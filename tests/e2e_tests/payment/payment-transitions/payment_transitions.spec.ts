import { test, expect } from '../../../resources/page_objects';
import {
  newUserMoveInAutoPayment,
  newUserMoveInSkipPayment,
  newUserMoveInManualPayment,
  generateTestUserData,
  CleanUp,
  PaymentUtilities,
} from '../../../resources/fixtures';
import {
  utilityQueries,
  accountQueries,
  billQueries,
  paymentQueries,
  blnkQueries,
} from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { logger } from '../../../resources/utils/logger';
import { supabase } from '../../../resources/utils/supabase';
import * as PaymentData from '../../../resources/data/payment-data.json';

/**
 * Payment Mode Transitions
 *
 * Tests toggling between auto-pay and manual pay, and switching payment methods:
 * - P2-02: Manual -> Auto transition (bill auto-pays after toggle)
 * - P2-03: Manual -> Auto + Pay Now (outstanding balance cleared immediately)
 * - P2-04: Manual -> Auto + Do It Later (outstanding stays, next bill auto-pays)
 * - P2-08: Payment method switch — Card to Bank (no fee)
 * - P2-09: Payment method switch — Bank to Card (3% fee)
 */

const paymentUtilities = new PaymentUtilities();
let MoveIn: any;

test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling('autotest', true);
  await utilityQueries.updateBuildingUseEncourageConversion('autotest', false);
  await utilityQueries.updateBuildingOfferRenewableEnergy('autotest', false);
  await utilityQueries.updatePartnerUseEncourageConversion('Moved', false);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page }) => {
  if (MoveIn?.pgUserEmail) {
    await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  }
  await page.close();
});


// =============================================================================
// P2-02: Manual -> Auto Transition
// =============================================================================

test.describe('P2-02: Manual to Auto-Pay Transition', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — manual user enables auto-pay, next bill auto-pays', {
    tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: Move-in with skip payment, then add manual card payment on overview (auto-pay OFF)
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();

    // Add manual card payment (auto-pay OFF)
    await overviewPage.Enter_Manual_Payment_Details(
      PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    // Verify auto-pay is OFF in DB
    const { data: userBefore } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userBefore?.isAutoPaymentEnabled).toBe(false);

    // Navigate to Account > Payment tab and enable auto-pay via switch
    await page.goto('/app/account');
    const paymentTab = page.getByRole('tab', { name: 'Payment' });
    await paymentTab.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Toggle auto-pay switch ON
    const autoPaySwitch = page.getByRole('switch');
    await autoPaySwitch.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Verify auto-pay is now ON in DB
    const { data: userAfter } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userAfter?.isAutoPaymentEnabled).toBe(true);

    // Get account IDs for bill insertion
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert approved bill — should auto-pay since auto-pay is now ON
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for auto-pay to process and succeed
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded');

    // Verify in UI — outstanding should be 0
    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // BLNK chain verification
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment).not.toBeNull();
    expect(payment?.paymentStatus).toBe('succeeded');
    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);
    }

    logger.info('P2-02 Manual to Auto transition: PASS — bill auto-paid after toggle');
  });
});


// =============================================================================
// P2-03: Manual -> Auto + Pay Now (Outstanding Balance)
// =============================================================================

test.describe('P2-03: Manual to Auto-Pay — Pay Now Outstanding', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — manual user with outstanding, toggle auto-pay, pay now', {
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: Manual pay user
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert and approve bill for manual payment — creates outstanding balance
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    const billId = await billQueries.getElectricBillId(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await billQueries.approveElectricBill(billId);
    await page.waitForTimeout(10000);

    // Wait for bill to be ready for user
    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Verify outstanding balance exists in UI
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // Navigate to Account > Payment tab and toggle auto-pay ON
    await page.goto('/app/account');
    const paymentTab = page.getByRole('tab', { name: 'Payment' });
    await paymentTab.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const autoPaySwitch = page.getByRole('switch');
    await autoPaySwitch.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // VERIFIED via Playwright MCP (2026-04-11):
    // - If card is in FAILED state: no modal appears, card shows "Automatic payment failed! Update method"
    // - If card is VALID: AutopayPaymentModal dialog should appear with pay/later options
    // This test uses a VALID card (newUserMoveInManualPayment with valid card), so modal expected
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Click "Pay now" to clear outstanding balance immediately
    // NOTE: Exact button text needs verification — try "Pay bill" first (consistent with pay modal)
    const payNowBtn = modal.getByRole('button', { name: /pay.*bill|pay.*now/i });
    await expect(payNowBtn).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await payNowBtn.click();
    await page.waitForTimeout(10000);

    // Verify auto-pay is ON
    const { data: userAfter } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userAfter?.isAutoPaymentEnabled).toBe(true);

    // Verify outstanding cleared
    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // Verify payment succeeded in DB
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded');

    // BLNK chain verification
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment).not.toBeNull();
    expect(payment?.paymentStatus).toBe('succeeded');
    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);
    }

    logger.info('P2-03 Manual to Auto + Pay Now: PASS — outstanding cleared immediately');
  });
});


// =============================================================================
// P2-04: Manual -> Auto + Do It Later
// =============================================================================

test.describe('P2-04: Manual to Auto-Pay — Do It Later', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — manual user with outstanding, toggle auto-pay, do it later, next bill auto-pays', {
    tag: [TEST_TAGS.REGRESSION3, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: Manual pay user
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert and approve bill for manual payment — creates outstanding balance
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    const billId = await billQueries.getElectricBillId(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await billQueries.approveElectricBill(billId);
    await page.waitForTimeout(10000);

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Verify outstanding balance exists
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // Navigate to Account > Payment tab and toggle auto-pay ON
    await page.goto('/app/account');
    const paymentTab = page.getByRole('tab', { name: 'Payment' });
    await paymentTab.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const autoPaySwitch = page.getByRole('switch');
    await autoPaySwitch.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // VERIFIED via Playwright MCP (2026-04-11):
    // AutopayPaymentModal only appears when card is VALID + outstanding balance exists
    // With FAILED card: shows "Automatic payment failed! Update method" instead (no modal)
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Click "Do it later" — outstanding stays unpaid
    // NOTE: Exact button text needs verification — try common patterns
    const laterBtn = modal.getByRole('button', { name: /later|skip|not now/i });
    await expect(laterBtn).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await laterBtn.click();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Verify auto-pay is ON even though we deferred payment
    const { data: userAfter } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userAfter?.isAutoPaymentEnabled).toBe(true);

    // Verify first bill is STILL outstanding
    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // Insert SECOND approved bill — this one should auto-pay
    const secondBillUserData = await generateTestUserData();
    const billId2 = await billQueries.insertApprovedElectricBill(
      electricAccountId, secondBillUserData.ElectricAmount, secondBillUserData.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId2);

    // Wait for the second bill to auto-pay
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, secondBillUserData.ElectricAmountTotal, 'succeeded');

    // Verify: First bill still outstanding, second bill auto-paid
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // The first bill amount should still be outstanding
    // (total outstanding = first bill only, since second bill was auto-paid)
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // BLNK verification for the second (auto-paid) bill
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, secondBillUserData.ElectricAmountTotal);
    expect(payment).not.toBeNull();
    expect(payment?.paymentStatus).toBe('succeeded');
    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);
    }

    logger.info('P2-04 Manual to Auto + Do It Later: PASS — first bill outstanding, second auto-paid');
  });
});


// =============================================================================
// P2-08: Payment Method Switch — Card to Bank
// =============================================================================

test.describe('P2-08: Payment Method Switch — Card to Bank', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — auto-pay card user switches to bank, bill auto-pays with no fee', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: Auto-pay user with card
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(
      PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    // Verify initial state: auto-pay ON, card payment method
    const { data: userBefore } = await supabase
      .from('CottageUsers')
      .select('stripePaymentMethodType, isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userBefore?.isAutoPaymentEnabled).toBe(true);
    expect(userBefore?.stripePaymentMethodType).toBe('card');

    // Switch payment method from card to bank via Account page
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await profilePage.Go_to_Payment_Info_Tab();
    await profilePage.click_Edit_Payment_Button();
    await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

    // Verify DB: payment method type changed to bank
    const { data: userAfterSwitch } = await supabase
      .from('CottageUsers')
      .select('stripePaymentMethodType, isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userAfterSwitch?.stripePaymentMethodType).toBe('us_bank_account');
    expect(userAfterSwitch?.isAutoPaymentEnabled).toBe(true);

    // Insert approved bill — should auto-pay via bank (no fee)
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for auto-pay to succeed
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded');

    // Verify in UI — outstanding should be 0
    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // BLNK chain verification — bank payment should have fee = 0
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment).not.toBeNull();
    expect(payment?.paymentStatus).toBe('succeeded');

    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);

      // Verify NO fee transaction exists for bank payment
      await blnkQueries.checkTransactionDoesNotExist(`transaction_fee_${payment.id}`);
    }

    logger.info('P2-08 Card to Bank switch: PASS — bill auto-paid via bank, no fee');
  });
});


// =============================================================================
// P2-09: Payment Method Switch — Bank to Card
// =============================================================================

test.describe('P2-09: Payment Method Switch — Bank to Card', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — auto-pay bank user switches to card, bill auto-pays with fee', {
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: Auto-pay user with bank account
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

    // Verify initial state: auto-pay ON, bank payment method
    const { data: userBefore } = await supabase
      .from('CottageUsers')
      .select('stripePaymentMethodType, isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userBefore?.isAutoPaymentEnabled).toBe(true);
    expect(userBefore?.stripePaymentMethodType).toBe('us_bank_account');

    // Switch payment method from bank to card via Account page
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await profilePage.Go_to_Payment_Info_Tab();
    await profilePage.click_Edit_Payment_Button();
    await profilePage.Enter_Auto_Payment_Details(
      PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    // Verify DB: payment method type changed to card
    const { data: userAfterSwitch } = await supabase
      .from('CottageUsers')
      .select('stripePaymentMethodType, isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userAfterSwitch?.stripePaymentMethodType).toBe('card');
    expect(userAfterSwitch?.isAutoPaymentEnabled).toBe(true);

    // Insert approved bill — should auto-pay via card (with 3% fee)
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for auto-pay to succeed
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded');

    // Verify in UI — outstanding should be 0
    await page.goto('/app/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // BLNK chain verification — card payment should have fee > 0
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment).not.toBeNull();
    expect(payment?.paymentStatus).toBe('succeeded');

    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);

      // Verify fee transaction EXISTS for card payment
      const feeTxn = await blnkQueries.getTransactionByReference(`transaction_fee_${payment.id}`);
      expect(feeTxn, 'Card payment should have a fee transaction').not.toBeNull();
      expect(Number(feeTxn!.amount)).toBeGreaterThan(0);
      expect(feeTxn!.status).toBe('APPLIED');

      logger.info(`P2-09 fee amount: $${feeTxn!.amount}`);
    }

    logger.info('P2-09 Bank to Card switch: PASS — bill auto-paid via card, fee applied');
  });
});
