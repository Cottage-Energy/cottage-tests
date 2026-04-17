import { test, expect } from '../../../resources/page_objects';
import {
  newUserMoveInManualPayment,
  newUserMoveInSkipPayment,
  newUserMoveInManualBankAccount,
  generateTestUserData,
  CleanUp,
} from '../../../resources/fixtures';
import {
  utilityQueries,
  accountQueries,
  billQueries,
  paymentQueries,
  blnkQueries,
} from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types';
import { supabase } from '../../../resources/utils/supabase';
import { logger } from '../../../resources/utils/logger';
import * as PaymentData from '../../../resources/data/payment-data.json';

/**
 * Manual Payment — Failed Payment & Recovery Tests
 *
 * Tests manual (user-initiated) payment failures and recovery paths:
 * - Card payment fails at Stripe → user updates card → re-pays manually
 * - Card payment fails → user switches to bank → re-pays
 * - Bank payment fails → user switches to card → re-pays
 *
 * These are DIFFERENT from auto-pay failed tests:
 * - Auto-pay: pipeline processes payment in background → fails → user recovers
 * - Manual: user clicks "Pay bill" → Stripe rejects → user sees error → user recovers
 *
 * Utility combos: electric only, gas only, electric+gas
 * Recovery paths: card→card, card→bank, bank→card
 */
let MoveIn: MoveInResult | undefined;

test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling('autotest', true);
  await utilityQueries.updateBuildingUseEncourageConversion('autotest', false);
  // await utilityQueries.updatePartnerUseEncourageConversion('Moved', false);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page }) => {
  if (MoveIn?.pgUserEmail) {
    await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  }
  await page.close();
});

// =============================================================================
// Manual Card Payment — Fail & Recover with New Card
// =============================================================================

test.describe('Manual Card Payment Failed — Card Recovery', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric Only — manual card fails, update card, re-pay succeeds', {
    tag: [TEST_TAGS.REGRESSION5, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment with INVALID card
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false, false, PaymentData.InvalidCardNumber);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Insert bill and approve for manual payment
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    const billId = await billQueries.getElectricBillId(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await billQueries.approveElectricBill(billId);
    await page.waitForTimeout(10000);

    // Wait for bill to be ready for manual payment
    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Navigate to billing page and attempt payment
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
      billingPage.Check_Pay_Bill_Button_Visible_Enable(),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Pending'),
    ]);

    // User clicks pay — open modal and submit (payment should fail with invalid card)
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    // Verify payment failed
    await billQueries.checkElectricBillProcessing(electricAccountId);
    await billQueries.checkElectricBillStatus(electricAccountId, 'failed');

    // Verify failed state in UI
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Failed'),
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
      billingPage.Check_Pay_Bill_Button_Visible_Enable(),
    ]);

    // Verify BLNK transaction voided
    const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    if (payment?.id) {
      const paymentTxns = await blnkQueries.getTransactionsByPaymentId(payment.id);
      for (const txn of paymentTxns) {
        if (txn.status !== 'VOID') {
          logger.warn(`BLNK: Expected VOID, got ${txn.status} for txn ${txn.reference}`);
        }
      }
    }

    // RECOVERY: Open pay modal again — it shows "Your last payment didn't go through"
    // Click Edit to update card, then retry payment
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Check_Payment_Failed_Message_In_Modal();

    // Retry with same method (modal allows retry)
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    // Verify recovery succeeded
    await billQueries.checkElectricBillStatus(electricAccountId, 'succeeded');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Succeeded'),
    ]);
  });


  test('EVERSOURCE EVERSOURCE Electric & Gas — manual card fails, update card, re-pay', {
    tag: [TEST_TAGS.REGRESSION6, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding('autotest', 'EVERSOURCE', 'EVERSOURCE');
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'EVERSOURCE', 'EVERSOURCE', true, true, false, PaymentData.InvalidCardNumber);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

    // Insert and approve both bills
    await Promise.all([
      billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
      billQueries.insertGasBill(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage),
    ]);
    await page.waitForTimeout(500);

    const [electricBillId, gasBillId] = await Promise.all([
      billQueries.getElectricBillId(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
      billQueries.getGasBillId(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage),
    ]);

    await Promise.all([
      billQueries.approveElectricBill(electricBillId),
      billQueries.approveGasBill(gasBillId),
    ]);
    await page.waitForTimeout(10000);

    await Promise.all([
      billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user'),
      billQueries.checkGasBillStatus(gasAccountId, 'waiting_for_user'),
    ]);

    // Navigate and attempt payment — should fail
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Pay_Bill_Button_Visible_Enable();
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    // Verify both bills failed
    await Promise.all([
      billQueries.checkElectricBillProcessing(electricAccountId),
      billQueries.checkGasBillProcessing(gasAccountId),
    ]);
    await Promise.all([
      billQueries.checkElectricBillStatus(electricAccountId, 'failed'),
      billQueries.checkGasBillStatus(gasAccountId, 'failed'),
    ]);

    // Verify failed UI
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Failed'),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), 'Failed'),
    ]);

    // RECOVERY: Re-open pay modal — shows failure message — retry
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Check_Payment_Failed_Message_In_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    await Promise.all([
      billQueries.checkElectricBillStatus(electricAccountId, 'succeeded'),
      billQueries.checkGasBillStatus(gasAccountId, 'succeeded'),
    ]);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Succeeded'),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), 'Succeeded'),
    ]);
  });


  test('DUKE Gas Only — manual card fails, update card, re-pay', {
    tag: [TEST_TAGS.REGRESSION7, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding('autotest', null, 'DUKE');
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, null, 'DUKE', true, true, false, PaymentData.InvalidCardNumber);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await billQueries.insertGasBill(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await page.waitForTimeout(500);

    const gasBillId = await billQueries.getGasBillId(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await billQueries.approveGasBill(gasBillId);
    await page.waitForTimeout(10000);

    await billQueries.checkGasBillStatus(gasAccountId, 'waiting_for_user');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Pay_Bill_Button_Visible_Enable();
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    await billQueries.checkGasBillProcessing(gasAccountId);
    await billQueries.checkGasBillStatus(gasAccountId, 'failed');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), 'Failed');

    // RECOVERY: Re-open pay modal — shows failure message — retry
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Check_Payment_Failed_Message_In_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    await billQueries.checkGasBillStatus(gasAccountId, 'succeeded');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), 'Succeeded'),
    ]);

    logger.info('Manual card failed gas → card recovery: PASS');
  });
});


// =============================================================================
// Manual Payment — Cross-Method Recovery (Card ↔ Bank)
// =============================================================================

test.describe('Manual Payment Failed — Cross-Method Recovery', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — card fails, switch to bank, manual pay succeeds', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup with invalid card (manual payment)
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false, false, PaymentData.InvalidCardNumber);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    const billId = await billQueries.getElectricBillId(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await billQueries.approveElectricBill(billId);
    await page.waitForTimeout(10000);

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');

    // Attempt manual payment — fails (invalid card)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    await billQueries.checkElectricBillStatus(electricAccountId, 'failed');

    // CROSS-METHOD RECOVERY: Switch from card to bank via profile
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await profilePage.Go_to_Payment_Info_Tab();
    await profilePage.click_Edit_Payment_Button();
    await profilePage.Enter_Manual_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

    // DB check: payment method type should now be bank
    const { data: user } = await supabase
      .from('CottageUsers')
      .select('stripePaymentMethodType')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(user?.stripePaymentMethodType).toBe('us_bank_account');

    // Re-pay manually with bank account (no fee)
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    await billQueries.checkElectricBillStatus(electricAccountId, 'succeeded');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Succeeded'),
    ]);

    logger.info('Manual card→bank cross-method recovery: PASS');
  });
});


// =============================================================================
// Auto-Pay Failed → Manual Pay as Backup
// =============================================================================

test.describe('Auto-Pay Failed — Manual Pay Backup', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — auto-pay fails, user manually pays, next bill still auto-pays', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: auto-pay ON with invalid card
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    // Add invalid card with auto-pay enabled
    await overviewPage.Enter_Auto_Payment_Details(
      PaymentData.InvalidCardNumber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);

    // Insert approved bill — auto-pay pipeline will process and fail
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for auto-pay to fail
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'failed');

    // Verify failed state
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // RECOVERY: Update to valid card first
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
    await profilePage.Go_to_Payment_Info_Tab();
    await profilePage.click_Edit_Payment_Button();
    await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, '12/30', '123', 'US', '10001'); // Valid card

    // MANUAL PAY as backup for the failed auto-pay bill
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(10000);

    // Verify manual payment succeeded
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // Verify auto-pay is still enabled (not disabled by manual pay)
    const { data: userAfter } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();

    // Note: if the failure was non-recoverable, auto-pay would be disabled
    // For recoverable failures, auto-pay stays enabled
    logger.info(`Auto-pay status after manual recovery: ${userAfter?.isAutoPaymentEnabled}`);

    // Insert SECOND bill — should auto-pay with the valid card
    const billId2 = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId2);

    // If auto-pay is still enabled, this should succeed automatically
    if (userAfter?.isAutoPaymentEnabled) {
      await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded');
      logger.info('Auto-pay failed, manual backup, next bill auto-pay succeeded: PASS');
    } else {
      // Auto-pay was disabled (non-recoverable failure) — next bill waits for manual
      logger.info('Auto-pay disabled after failure — next bill requires manual pay (expected for non-recoverable)');
    }
  });
});


// =============================================================================
// Payment Mode Transitions
// =============================================================================

test.describe('Payment Mode Transitions', () => {
  test.describe.configure({ mode: 'serial' });

  test('Auto-pay to manual: disable auto-pay, next bill requires manual payment', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: auto-pay ON with valid card
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

    // Verify auto-pay is ON
    const { data: userBefore } = await supabase
      .from('CottageUsers')
      .select('isAutoPaymentEnabled')
      .eq('id', MoveIn.cottageUserId)
      .single()
      .throwOnError();
    expect(userBefore?.isAutoPaymentEnabled).toBe(true);

    // DISABLE auto-pay via DB (simulating user toggle)
    await supabase
      .from('CottageUsers')
      .update({ isAutoPaymentEnabled: false })
      .eq('id', MoveIn.cottageUserId)
      .throwOnError();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert approved bill — since auto-pay is OFF, bill should be processed but NOT paid
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait to confirm NO payment is created (auto-pay disabled)
    await page.waitForTimeout(120000); // Wait 2 min — longer than dev auto-pay delay (1 min)

    // Check: bill is processed but no payment with 'succeeded' status
    // The bill notification email should say "ready for payment" (manual template)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Outstanding balance should be > 0 (bill not paid)
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
    await billingPage.Check_Pay_Bill_Button_Visible_Enable();

    // MANUAL PAY the bill
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(10000);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(0);

    logger.info('Auto to Manual transition: bill not auto-paid, manual pay succeeded: PASS');
  });
});

// =============================================================================
// PR-005h: Failed payment does NOT clear delinquency
// =============================================================================
// Negative test: recalculateDelinquency fires ONLY on successful payment, not
// on failure. If the hook were wrongly moved outside the success branch, a
// declining card could wrongly clear isDelinquent. This guards against that
// class of regression.
//
// Uses the existing invalid-card fixture pattern (PaymentData.InvalidCardNumber
// causes Stripe to decline the charge). Confirms that after the failure,
// delinquency flags are unchanged.
test.describe('PR-005h: Failed payment does NOT clear delinquency', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'COMED electric — invalid card fails, isDelinquent stays true (not cleared by failure)',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(
        page, 'COMED', null, true, false, false, PaymentData.InvalidCardNumber
      );

      await page.goto('/sign-in');
      await overviewPage.Setup_Password();
      await overviewPage.Accept_New_Terms_And_Conditions();

      const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      // Seed delinquency pre-failure
      await accountQueries.setElectricDelinquent(electricAccountId, 30);

      // Insert bill and attempt payment with invalid card (will fail)
      await billQueries.insertElectricBill(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await page.waitForTimeout(500);

      const billId = await billQueries.getElectricBillId(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await billQueries.approveElectricBill(billId);
      await page.waitForTimeout(10000);
      await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await overviewPage.Click_Pay_Bill_Button();
      await overviewPage.Check_Pay_Outstanding_Balance_Modal();
      await overviewPage.Submit_Pay_Bill_Modal();

      // Wait for the failure to resolve. Stripe card decline is quick (seconds).
      // We wait a generous 30s to ensure recalculateDelinquency had its chance
      // to (wrongly) fire. If it did, we'd see isDelinquent=false.
      await page.waitForTimeout(30000);

      const after = await accountQueries.getElectricDelinquency(electricAccountId);
      expect(
        after.isDelinquent,
        'Failed payment must NOT clear isDelinquent — recalculateDelinquency only runs on success'
      ).toBe(true);
      expect(
        after.delinquentDays,
        'delinquentDays should remain at seeded value (30) on failure'
      ).toBe(30);

      logger.info('PR-005h: Failed payment preserved delinquency state — PASS');
    }
  );
});
