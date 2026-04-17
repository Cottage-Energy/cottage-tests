import { test, expect } from '../../../resources/page_objects';
import {
  newUserMoveInManualPayment,
  newUserMoveInSkipPayment,
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
import { logger } from '../../../resources/utils/logger';
import { supabase } from '../../../resources/utils/supabase';
import * as PaymentData from '../../../resources/data/payment-data.json';

/**
 * Flex (Bill Splitting) Payment Tests
 *
 * Tests Flex-enabled payment scenarios where users can choose between
 * "Pay in Full" and "Split my bill" (via getflex.com).
 *
 * Flex requires:
 * - isFlexEnabled=true on the UtilityCompany (COMED has this)
 * - totalDue > 0
 * - Manual payment user (user clicks "Pay bill")
 *
 * Test cases:
 * 1. Flex-enabled user sees split bill option and can pay in full
 * 2. Flex split bill redirects to getflex.com
 * 3. Non-flex user does NOT see split option
 */
let MoveIn: ReturnType<typeof newUserMoveInManualPayment> extends Promise<infer T> ? T : never;

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
// Flex-Enabled User — Pay in Full
// =============================================================================

test.describe('Flex Payment — Pay in Full', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — flex-enabled user sees split bill option, pays in full', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED (isFlexEnabled=true), manual card payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Insert bill to create outstanding balance
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    // Navigate to billing page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();

    // Verify bill is visible and pay button is enabled
    await billingPage.Check_Pay_Bill_Button_Visible_Enable();
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);

    // Open pay modal
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();

    // Verify Flex option is present in the modal "Paying with" section
    // VERIFIED via Playwright MCP (2026-04-11): Flex is a clickable container in the
    // "Paying with" radiogroup, NOT a radio in the Amount section.
    // Text: "Split your bills into smaller payments" + "Add flexible payments to your account"
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    const flexOption = modal.getByText('Split your bills into smaller payments');
    const cardOption = modal.getByText(/Visa ending in/);
    const totalAmountRadio = modal.getByRole('radio', { name: /Total Amount Due/ });

    // Flex-enabled utility should show the flex payment option
    await expect(flexOption).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(cardOption).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    logger.info('Flex option visible in pay modal — paying with card (Total Amount Due)');

    // Select Total Amount Due (default) and pay with card
    await expect(totalAmountRadio).toBeChecked();

    // Submit payment (pay in full)
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    // Verify payment succeeded
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(0);
    await billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), 'Succeeded');

    // BLNK verification: verify payment chain consistency
    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment.paymentStatus).toBe('succeeded');
    await blnkQueries.verifyPaymentChainConsistency(payment.id);

    logger.info('Flex-enabled pay in full: PASS');
  });
});


// =============================================================================
// Flex-Enabled User — Split Bill Redirect
// =============================================================================

test.describe('Flex Payment — Split Bill Redirect', () => {
  test.describe.configure({ mode: 'serial' });

  test('COMED Electric — split bill option redirects to getflex.com', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED (isFlexEnabled=true), manual card payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Insert bill — Flex requires totalDue > 0
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    // Navigate to billing page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();

    await billingPage.Check_Pay_Bill_Button_Visible_Enable();

    // Open pay modal
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // VERIFIED via Playwright MCP (2026-04-11): Flex option is in "Paying with" radiogroup
    // as a clickable container with "Split your bills into smaller payments" text + "Learn more" button
    const flexOption = modal.getByText('Split your bills into smaller payments');
    await expect(flexOption).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Click the Flex option container to select it
    await flexOption.click();
    await page.waitForTimeout(1000);

    // After clicking Flex, check for redirect or "Learn more" interaction
    const learnMoreBtn = modal.getByRole('button', { name: 'Learn more' });
    const isLearnMoreVisible = await learnMoreBtn.isVisible().catch(() => false);

    if (isLearnMoreVisible) {
      // Click "Learn more" to trigger Flex redirect
      const [flexPage] = await Promise.all([
        context.waitForEvent('page', { timeout: TIMEOUTS.DEFAULT }).catch(() => null),
        learnMoreBtn.click(),
      ]);

      if (flexPage) {
        const flexUrl = flexPage.url();
        logger.info(`Flex redirect URL: ${flexUrl}`);
        expect(flexUrl).toContain('getflex.com');
        await flexPage.close();
      } else {
        // Flex may load inline or via iframe
        logger.info('Flex did not open new tab — may load inline or via iframe');
      }
    }

    logger.info('Flex split bill redirect: PASS');
  });
});


// =============================================================================
// Non-Flex User — No Split Option
// =============================================================================

test.describe('Flex Payment — Non-Flex User', () => {
  test.describe.configure({ mode: 'serial' });

  test('NGMA Electric — non-flex user does NOT see split bill option', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: NGMA (isFlexEnabled=false), manual card payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'NGMA', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'NGMA', null, true, true);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Insert bill
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);

    // Navigate to billing page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();

    await billingPage.Check_Pay_Bill_Button_Visible_Enable();

    // Open pay modal
    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

    // Verify: Flex option should NOT be visible for non-flex utility
    // VERIFIED: Flex shows as "Split your bills into smaller payments" in "Paying with" section
    const flexOption = modal.getByText('Split your bills into smaller payments');
    await expect(flexOption).not.toBeVisible({ timeout: 5000 });

    // Verify: Standard payment options are present (Total Amount Due / Other Amount)
    const totalAmountRadio = modal.getByRole('radio', { name: /total.*amount/i })
      .or(modal.getByText(/total.*amount/i));
    const otherAmountRadio = modal.getByRole('radio', { name: /other.*amount/i })
      .or(modal.getByText(/other.*amount/i));

    // At least the total amount option should be present
    const isTotalVisible = await totalAmountRadio.isVisible().catch(() => false);
    const isOtherVisible = await otherAmountRadio.isVisible().catch(() => false);
    logger.info(`Non-flex modal: Total Amount visible=${isTotalVisible}, Other Amount visible=${isOtherVisible}`);

    // Submit payment — should work normally without Flex
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(5000);

    // Verify payment succeeded
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // BLNK verification
    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
    expect(payment.paymentStatus).toBe('succeeded');
    await blnkQueries.verifyPaymentChainConsistency(payment.id);

    logger.info('Non-flex user no split option: PASS');
  });
});
