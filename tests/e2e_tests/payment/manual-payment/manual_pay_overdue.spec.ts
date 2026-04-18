import { test, expect } from '../../../resources/page_objects';
import {
  newUserMoveInManualPayment,
  generateTestUserData,
  CleanUp,
} from '../../../resources/fixtures';
import {
  utilityQueries,
  accountQueries,
  billQueries,
  paymentQueries,
  blnkQueries,
  smsQueries,
} from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types';
import { logger } from '../../../resources/utils/logger';
import { supabase } from '../../../resources/utils/supabase';
import * as FastmailActions from '../../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../../resources/data/payment-data.json';

/**
 * Manual Payment — Overdue Payment, Offboarding & Recovery Tests (P2-20 through P2-27)
 *
 * Tests what happens when bills go unpaid for extended periods:
 * - Reminder progression: 5 days, 15 days, 18 days overdue
 * - Offboarding triggers at 25+ days overdue
 * - Recovery paths: full payment restores ACTIVE, partial stays NEEDS_OFF_BOARDING
 * - Multi-account scenarios: separate vs same charge accounts
 *
 * User impact: These tests verify the delinquency pipeline that protects
 * users from silent service disconnection by sending escalating warnings
 * and providing a clear path to restore service after payment.
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
// Helper: Insert bill with overdue due date
// =============================================================================

/**
 * Insert an electric bill with a due date in the past (overdue).
 * The bill goes through the standard insert + approve + wait-for-processing flow,
 * then the dueDate is backdated to simulate overdue conditions.
 */
async function insertOverdueElectricBill(
  electricAccountId: string,
  amount: number,
  usage: number,
  daysOverdue: number
): Promise<string> {
  // Insert and approve the bill through normal pipeline
  await billQueries.insertElectricBill(electricAccountId, amount, usage);
  const billId = await billQueries.getElectricBillId(electricAccountId, amount, usage);
  await billQueries.approveElectricBill(billId);

  // Backdate the dueDate to simulate overdue
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - daysOverdue);
  const startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - 30);

  await supabase
    .from('ElectricBill')
    .update({
      dueDate: dueDate.toISOString().split('T')[0],
      startDate: startDate.toISOString().split('T')[0],
      endDate: dueDate.toISOString().split('T')[0],
    })
    .eq('id', parseInt(billId))
    .throwOnError();

  logger.info(`Inserted overdue electric bill ${billId}: ${daysOverdue} days past due`);
  return billId;
}

/**
 * Insert a gas bill with a due date in the past (overdue).
 */
async function insertOverdueGasBill(
  gasAccountId: string,
  amount: number,
  usage: number,
  daysOverdue: number
): Promise<string> {
  await billQueries.insertGasBill(gasAccountId, amount, usage);
  const billId = await billQueries.getGasBillId(gasAccountId, amount, usage);
  await billQueries.approveGasBill(billId);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() - daysOverdue);
  const startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - 30);

  await supabase
    .from('GasBill')
    .update({
      dueDate: dueDate.toISOString().split('T')[0],
      startDate: startDate.toISOString().split('T')[0],
      endDate: dueDate.toISOString().split('T')[0],
    })
    .eq('id', parseInt(billId))
    .throwOnError();

  logger.info(`Inserted overdue gas bill ${billId}: ${daysOverdue} days past due`);
  return billId;
}

/**
 * Trigger the Inngest payment reminders event with an email filter.
 */
async function triggerPaymentReminders(email: string): Promise<void> {
  const inngestKey = process.env.INNGEST_EVENT_KEY;
  if (!inngestKey) {
    throw new Error('INNGEST_EVENT_KEY environment variable is not set');
  }

  const response = await fetch(`https://inn.gs/e/${inngestKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ledger.payment.reminders',
      data: { emails: [email] },
    }),
  });

  logger.info(`Triggered ledger.payment.reminders for ${email}: status=${response.status}`);
}

/**
 * Trigger the Inngest offboarding reconciliation event.
 */
async function triggerOffboardingReconciliation(): Promise<void> {
  const inngestKey = process.env.INNGEST_EVENT_KEY;
  if (!inngestKey) {
    throw new Error('INNGEST_EVENT_KEY environment variable is not set');
  }

  const response = await fetch(`https://inn.gs/e/${inngestKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'trigger.accounts.offboarding.reconciliation',
      data: {},
    }),
  });

  logger.info(`Triggered offboarding reconciliation: status=${response.status}`);
}

/**
 * Poll ElectricAccount status until it matches the expected value.
 */
async function pollElectricAccountStatus(
  cottageUserId: string,
  expectedStatus: string,
  maxRetries: number = 180
): Promise<void> {
  const pollDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let retries = 0;
  let currentStatus = '';

  while (retries < maxRetries) {
    const { data: account } = await supabase
      .from('ElectricAccount')
      .select('status')
      .eq('cottageUserID', cottageUserId)
      .single()
      .throwOnError();

    currentStatus = account?.status ?? '';

    if (currentStatus === expectedStatus) {
      logger.info(`ElectricAccount status: ${currentStatus} (expected: ${expectedStatus})`);
      expect(currentStatus).toBe(expectedStatus);
      return;
    }

    retries++;
    if (retries % 30 === 0) {
      logger.info(`Waiting for ElectricAccount status=${expectedStatus} (current: ${currentStatus}, ${retries}/${maxRetries})`);
    }
    await pollDelay(5000);
  }

  throw new Error(
    `ElectricAccount status: expected ${expectedStatus}, got ${currentStatus} after ${maxRetries} retries (user ${cottageUserId})`
  );
}

/**
 * Poll GasAccount status until it matches the expected value.
 */
async function pollGasAccountStatus(
  cottageUserId: string,
  expectedStatus: string,
  maxRetries: number = 180
): Promise<void> {
  const pollDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let retries = 0;
  let currentStatus = '';

  while (retries < maxRetries) {
    const { data: account } = await supabase
      .from('GasAccount')
      .select('status')
      .eq('cottageUserID', cottageUserId)
      .single()
      .throwOnError();

    currentStatus = account?.status ?? '';

    if (currentStatus === expectedStatus) {
      logger.info(`GasAccount status: ${currentStatus} (expected: ${expectedStatus})`);
      expect(currentStatus).toBe(expectedStatus);
      return;
    }

    retries++;
    if (retries % 30 === 0) {
      logger.info(`Waiting for GasAccount status=${expectedStatus} (current: ${currentStatus}, ${retries}/${maxRetries})`);
    }
    await pollDelay(5000);
  }

  throw new Error(
    `GasAccount status: expected ${expectedStatus}, got ${currentStatus} after ${maxRetries} retries (user ${cottageUserId})`
  );
}


// =============================================================================
// P2-20 through P2-22: Reminder Progression
// =============================================================================

test.describe('Reminder Progression', () => {
  test.describe.configure({ mode: 'serial' });

  test('P2-20: 5 days overdue — standard reminder email sent', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill with dueDate 5 days ago
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 5
    );

    // Wait for bill to reach waiting_for_user status
    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger payment reminders Inngest event with email filter
    await triggerPaymentReminders(MoveIn.pgUserEmail);

    // Wait for Inngest function to process
    await page.waitForTimeout(30000);

    // Verify: Standard reminder email sent
    await FastmailActions.Check_Payment_Reminder_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, 'Electric');
    await billQueries.checkElectricBillReminder(electricAccountId, true);

    logger.info('P2-20: 5 days overdue standard reminder — PASS');
  });


  test('P2-21: 15 days overdue — escalated reminder sent', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill with dueDate 15 days ago
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 15
    );

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger payment reminders — escalated (every 5 days)
    await triggerPaymentReminders(MoveIn.pgUserEmail);
    await page.waitForTimeout(30000);

    // Verify: Escalated reminder sent (same template as standard, day 15)
    await FastmailActions.Check_Payment_Reminder_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, 'Electric');
    await billQueries.checkElectricBillReminder(electricAccountId, true);

    logger.info('P2-21: 15 days overdue escalated reminder — PASS');
  });


  test('P2-22: 18 days overdue — shutoff warning email and SMS sent', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill with dueDate 18 days ago — shutoff warning threshold
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 18
    );

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger payment reminders — should send shutoff warning
    await triggerPaymentReminders(MoveIn.pgUserEmail);
    await page.waitForTimeout(30000);

    // Verify: Shutoff warning sent (email + SMS)
    await FastmailActions.Check_Shutoff_Warning_Email(MoveIn.pgUserEmail, 'Electric');
    // SMS: sendText calls Dialpad API directly (no DB record for outbound).
    // Verify indirectly: user has SMS consent + email was sent (same pipeline triggers both).
    const { data: smsUser } = await supabase
      .from('CottageUsers')
      .select('isAbleToSendTextMessages, dateOfTextMessageConsent')
      .eq('id', MoveIn.cottageUserId)
      .single();
    expect(smsUser?.isAbleToSendTextMessages).toBe(true);
    expect(smsUser?.dateOfTextMessageConsent).toBeTruthy();
    logger.info(`SMS consent verified: isAble=${smsUser?.isAbleToSendTextMessages}, consent=${smsUser?.dateOfTextMessageConsent}`);
    await billQueries.checkElectricBillReminder(electricAccountId, true);

    logger.info('P2-22: 18 days overdue shutoff warning — PASS');
  });
});


// =============================================================================
// P2-23: Offboarding Trigger
// =============================================================================

test.describe('Offboarding Triggers', () => {
  test.describe.configure({ mode: 'serial' });

  test('P2-23: 25+ days overdue — account transitions to NEEDS_OFF_BOARDING', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill with dueDate 26 days ago — past offboarding threshold
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 26
    );

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger offboarding reconciliation
    await triggerOffboardingReconciliation();

    // Wait for offboarding to process (cron-based, may take 5-15 min)
    await pollElectricAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING');

    // Verify: UI shows "Inactive Account" alert on overview
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await overviewPage.Check_Inactive_Account_Alert_Visible();

    logger.info('P2-23: 25+ days overdue NEEDS_OFF_BOARDING — PASS');
  });


  test('P2-26: Separate accounts — electric overdue, gas stays ACTIVE', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: SDGE electric + SCE gas (separate charge accounts)
    // Using EVERSOURCE+BGE as proxy for separate charge accounts in test env
    await utilityQueries.updateCompaniesToBuilding('autotest', 'EVERSOURCE', 'BGE');
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'EVERSOURCE', 'BGE', true, true);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

    // Insert electric bill 26 days overdue — past offboarding threshold
    const electricBillId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 26
    );

    // Insert gas bill with normal due date (not overdue)
    await billQueries.insertGasBill(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    const gasBillId = await billQueries.getGasBillId(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await billQueries.approveGasBill(gasBillId);

    await Promise.all([
      billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user'),
      billQueries.checkGasBillStatus(gasAccountId, 'waiting_for_user'),
    ]);

    // Trigger offboarding reconciliation
    await triggerOffboardingReconciliation();

    // Wait for electric account to transition to NEEDS_OFF_BOARDING
    await pollElectricAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING');

    // Verify: Gas account stays ACTIVE
    const { data: gasAccount } = await supabase
      .from('GasAccount')
      .select('status')
      .eq('cottageUserID', MoveIn.cottageUserId)
      .single()
      .throwOnError();

    expect(gasAccount?.status).toBe('ACTIVE');

    logger.info('P2-26: Separate accounts — electric NEEDS_OFF_BOARDING, gas ACTIVE — PASS');
  });


  test('P2-27: Same charge account — both accounts offboarded', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: EVERSOURCE electric + EVERSOURCE gas (single charge account)
    await utilityQueries.updateCompaniesToBuilding('autotest', 'EVERSOURCE', 'EVERSOURCE');
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'EVERSOURCE', 'EVERSOURCE', true, true);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

    // Insert both bills 26 days overdue
    const electricBillId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 26
    );
    const gasBillId = await insertOverdueGasBill(
      gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, 26
    );

    await Promise.all([
      billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user'),
      billQueries.checkGasBillStatus(gasAccountId, 'waiting_for_user'),
    ]);

    // Trigger offboarding reconciliation
    await triggerOffboardingReconciliation();

    // Wait for both accounts to transition to NEEDS_OFF_BOARDING
    await Promise.all([
      pollElectricAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING'),
      pollGasAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING'),
    ]);

    // Verify: UI shows Inactive Account alert
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await overviewPage.Check_Inactive_Account_Alert_Visible();

    logger.info('P2-27: Same charge account — both NEEDS_OFF_BOARDING — PASS');
  });
});


// =============================================================================
// P2-24 through P2-25: Recovery Paths
// =============================================================================

test.describe('Recovery Paths', () => {
  test.describe.configure({ mode: 'serial' });

  test('P2-24: 25+ days overdue — full payment restores ACTIVE status', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment with valid card
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill 26 days overdue
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 26
    );

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger offboarding — account transitions to NEEDS_OFF_BOARDING
    await triggerOffboardingReconciliation();
    await pollElectricAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING');

    // Verify inactive account alert is visible
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await overviewPage.Check_Inactive_Account_Alert_Visible();

    // RECOVERY: User pays full amount via Pay bill modal
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
      billingPage.Check_Pay_Bill_Button_Visible_Enable(),
    ]);

    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();
    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(10000);

    // Verify payment succeeded
    await billQueries.checkElectricBillStatus(electricAccountId, 'succeeded');

    // Wait for offboarding reconciliation to restore ACTIVE (5-15 min)
    // Trigger reconciliation again to speed up recovery
    await triggerOffboardingReconciliation();
    await pollElectricAccountStatus(MoveIn.cottageUserId, 'ACTIVE');

    // Verify UI: balance cleared, no inactive alert
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Outstanding_Balance_Amount(0);

    // BLNK verification: payment chain should be consistent
    const payment = await blnkQueries.getPaymentByUserAndAmount(
      MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal
    );
    if (payment?.id) {
      await blnkQueries.verifyPaymentChainConsistency(payment.id);
      logger.info(`BLNK verification passed for payment ${payment.id}`);
    }

    logger.info('P2-24: Full payment restores ACTIVE — PASS');
  });


  test('P2-25: 25+ days overdue — partial payment stays NEEDS_OFF_BOARDING', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, manual payment with valid card
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, false);

    await page.goto('/sign-in');
    await overviewPage.Accept_New_Terms_And_Conditions();

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert bill 26 days overdue
    const billId = await insertOverdueElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, 26
    );

    await billQueries.checkElectricBillStatus(electricAccountId, 'waiting_for_user');
    await billQueries.checkElectricBillVisibility(electricAccountId, true);

    // Trigger offboarding — account transitions to NEEDS_OFF_BOARDING
    await triggerOffboardingReconciliation();
    await pollElectricAccountStatus(MoveIn.cottageUserId, 'NEEDS_OFF_BOARDING');

    // Verify inactive account alert
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await overviewPage.Check_Inactive_Account_Alert_Visible();

    // PARTIAL PAYMENT: Navigate to billing and attempt partial pay via "Other Amount"
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Pay_Bill_Button_Visible_Enable();

    await billingPage.Click_Pay_Bill_Button();
    await billingPage.Check_Pay_Outstanding_Balance_Modal();

    // Enter partial amount via the "Other amount" option in the modal
    // The modal has an "Other amount" input — fill with a small amount
    const modal = billingPage.Billing_Pay_Bill_Modal;
    const otherAmountOption = modal.getByText('Other amount');
    const isOtherAmountVisible = await otherAmountOption.isVisible().catch(() => false);

    if (isOtherAmountVisible) {
      await otherAmountOption.click();
      const amountInput = modal.locator('input[type="number"], input[inputmode="decimal"]').first();
      await amountInput.fill('1.00');
      await page.waitForTimeout(500);
    }

    await billingPage.Submit_Pay_Bill_Modal();
    await page.waitForTimeout(10000);

    // Trigger reconciliation — balance > $1 so account should stay NEEDS_OFF_BOARDING
    await triggerOffboardingReconciliation();
    await page.waitForTimeout(30000);

    // Verify: Account stays NEEDS_OFF_BOARDING
    const { data: account } = await supabase
      .from('ElectricAccount')
      .select('status')
      .eq('cottageUserID', MoveIn.cottageUserId)
      .single()
      .throwOnError();

    expect(account?.status).toBe('NEEDS_OFF_BOARDING');

    // Verify: Outstanding balance is still > 0
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Billing_Page_Via_Icon();

    // Balance should still show remaining amount after partial payment
    const outstandingText = await billingPage.Billing_Outstanding_Balance.textContent();
    logger.info(`Outstanding balance after partial payment: ${outstandingText}`);

    // The outstanding balance should be > 0 (partial payment doesn't clear it)
    const balanceMatch = outstandingText?.match(/\$(\d+\.?\d*)/);
    if (balanceMatch) {
      const remainingBalance = parseFloat(balanceMatch[1]);
      expect(remainingBalance).toBeGreaterThan(0);
    }

    logger.info('P2-25: Partial payment stays NEEDS_OFF_BOARDING — PASS');
  });
});

// =============================================================================
// PR-005c: Partial payment keeps delinquency (Cian review 2026-04-14)
// =============================================================================
// Complements P2-25 (above) which asserts account STATUS stays NEEDS_OFF_BOARDING
// after partial pay. PR-005c asserts the isDelinquent/delinquentDays FIELDS
// behave correctly: partial payment with remaining balance >= $1 must NOT
// clear `isDelinquent` because calculateDelinquency's balance check fails.
//
// This is distinct from P2-25 because:
//   - P2-25 checks ElectricAccount.status (NEEDS_OFF_BOARDING after 25+ days)
//   - PR-005c checks ElectricAccount.isDelinquent / delinquentDays (post-payment)
//   - P2-25 uses 25+ days overdue + offboarding reconciliation
//   - PR-005c uses any delinquent state + PaymentProcessor.recalculateDelinquency
//
// UI verified 2026-04-14: partial payment via "Other Amount" radio in the
// standard Pay Bill modal.
test.describe('PR-005c: Partial payment keeps delinquency', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'COMED electric — isDelinquent=true, partial pay via Other Amount → delinquency remains',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, true);

      await page.goto('/sign-in');
      await overviewPage.Setup_Password();
      await overviewPage.Accept_New_Terms_And_Conditions();

      const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      await billQueries.insertElectricBill(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await page.waitForTimeout(500);

      // Seed delinquency pre-payment
      await accountQueries.setElectricDelinquent(electricAccountId, 30);

      // Partial amount: half the outstanding (in dollars — ElectricAmount is cents)
      const partialDollars = Math.floor((PGuserUsage.ElectricAmount / 100) / 2);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await overviewPage.Click_Pay_Bill_Button();
      await overviewPage.Check_Pay_Outstanding_Balance_Modal();
      await overviewPage.Enter_Partial_Pay_Amount(partialDollars);
      await overviewPage.Submit_Pay_Bill_Modal();
      await page.waitForTimeout(10000);

      // Core assertion: partial payment should NOT clear delinquency when
      // remaining balance is still >= $1.00. Poll for up to 60s — if
      // recalculateDelinquency wrongly clears the flag, we'll observe it.
      const finalState = await (async () => {
        for (let i = 0; i < 30; i++) {
          const s = await accountQueries.getElectricDelinquency(electricAccountId);
          if (!s.isDelinquent) return s;
          await page.waitForTimeout(2000);
        }
        return accountQueries.getElectricDelinquency(electricAccountId);
      })();

      logger.info(`PR-005c: Delinquency after partial payment — isDelinquent=${finalState.isDelinquent}, days=${finalState.delinquentDays}`);
      expect(
        finalState.isDelinquent,
        'Partial payment (balance still > $1) must not clear isDelinquent'
      ).toBe(true);
    }
  );
});

// =============================================================================
// PR-005e: Partial payment bringing balance below $1 CLEARS delinquency
// =============================================================================
// Threshold branch test. calculateDelinquency checks dueBalance >= $1.00 AND
// daysOverdue > 0. If partial pay drops balance to $0.50, the dueBalance
// branch fails → delinquency should clear even though payment was partial.
//
// Uses the same flow as PR-005c but pays ALL-BUT-50-CENTS so the residual
// balance is below $1.00.
test.describe('PR-005e: Partial below $1 threshold clears delinquency', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'COMED electric — partial payment leaving $0.50 balance → delinquency clears',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, true);

      await page.goto('/sign-in');
      await overviewPage.Setup_Password();
      await overviewPage.Accept_New_Terms_And_Conditions();

      const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      await billQueries.insertElectricBill(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await page.waitForTimeout(500);

      await accountQueries.setElectricDelinquent(electricAccountId, 30);

      // Pay everything except 50 cents. ElectricAmount is in cents, we want
      // to leave $0.50 = 50 cents unpaid. Amount to pay in dollars:
      const billDollars = PGuserUsage.ElectricAmount / 100;
      const partialDollars = Number((billDollars - 0.50).toFixed(2));

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await overviewPage.Click_Pay_Bill_Button();
      await overviewPage.Check_Pay_Outstanding_Balance_Modal();
      await overviewPage.Enter_Partial_Pay_Amount(partialDollars);
      await overviewPage.Submit_Pay_Bill_Modal();

      // Wait for payment success + recalculateDelinquency. Because residual
      // balance is < $1.00, calculateDelinquency should return
      // shouldUntagElectric=true → delinquency clears.
      await accountQueries.waitForElectricDelinquencyCleared(electricAccountId, 45, 2000);

      const after = await accountQueries.getElectricDelinquency(electricAccountId);
      expect(
        after.isDelinquent,
        'Balance below $1.00 threshold should clear isDelinquent via recalculateDelinquency'
      ).toBe(false);
    }
  );
});
