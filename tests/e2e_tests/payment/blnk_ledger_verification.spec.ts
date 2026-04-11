import { test, expect } from '../../resources/page_objects';
import {
  newUserMoveInAutoPayment,
  newUserMoveInSkipPayment,
  newUserMoveInAutoBankAccount,
  generateTestUserData,
  CleanUp,
  PaymentUtilities,
} from '../../resources/fixtures';
import {
  utilityQueries,
  accountQueries,
  billQueries,
  paymentQueries,
  blnkQueries,
} from '../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS, RETRY_CONFIG } from '../../resources/constants';
import * as PaymentData from '../../resources/data/payment-data.json';

/**
 * BLNK Ledger Verification Tests
 *
 * Migration safety tests that verify financial integrity across:
 * - BLNK transactions (references, descriptions, statuses, amounts)
 * - Payment records (contributions, amounts with fees)
 * - UtilityRemittance records (per charge account)
 * - TransactionMetadata (bill-to-ledger linkage)
 * - Cross-table consistency (Payment ↔ Remittance ↔ BLNK)
 *
 * These tests encode the expected states from Brennan's payment_system_ledger_flows.md
 * and must pass before/after any payment system migration.
 *
 * Reference: tests/docs/payment-system.md — Complete BLNK Transaction Catalog
 */

const paymentUtilities = new PaymentUtilities();
let MoveIn: ReturnType<typeof newUserMoveInAutoPayment> extends Promise<infer T> ? T : never;

// Helper: wait with polling
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
// DB-012: Fee Calculation Accuracy at DB Level
// =============================================================================

test.describe('DB-012: Fee Calculation Accuracy', () => {
  test.describe.configure({ mode: 'serial' });

  test('Card payment — fee = bankersRound(amount * 0.03 + 30)', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only with card auto-pay
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

    // Get account IDs
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);

    // Insert approved bill and wait for pipeline
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for payment to succeed
    const expectedAmountWithFee = PGuserUsage.ElectricAmountTotal; // cents: bill + fee
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'succeeded');

    // DB-012 ASSERTION: Verify fee at DB level
    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, expectedAmountWithFee);
    expect(payment.amount).toBe(expectedAmountWithFee);

    // Verify: Payment.amount = billAmount + bankersRound(billAmount * 0.03 + 30)
    const expectedFee = PGuserUsage.ElectricServiceFee; // pre-calculated by generateTestUserData
    const expectedBillPlusFee = PGuserUsage.ElectricAmount + expectedFee;
    expect(payment.amount).toBe(expectedBillPlusFee);

    // Verify BLNK fee transaction exists with correct amount (dollars)
    await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, expectedFee);
  });

  test('Bank payment — zero fee, no fee transaction', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only with bank auto-pay
    await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoBankAccount(page, 'COMED', null, true, false);
    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();

    // Get account IDs
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert approved bill and wait for pipeline
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    // Wait for payment (bank: amount = bill only, no fee)
    await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);

    // DB-012 ASSERTION: Payment.amount = bill amount (no fee)
    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);
    expect(payment.amount).toBe(PGuserUsage.ElectricAmount);

    // Verify NO fee transaction in BLNK
    await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, 0);
  });
});

// =============================================================================
// DB-013: BLNK Balance Formula at Each Pipeline Step
// =============================================================================

test.describe('DB-013: Balance at Each Pipeline Step', () => {
  test.describe.configure({ mode: 'serial' });

  test('Balance transitions: before → ingestion → inflight → success', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, card auto-pay
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

    // Get charge account and ledgerBalanceID
    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);

    // STEP 1: Snapshot BEFORE bill insertion
    const beforeSnapshot = await blnkQueries.getChargeAccountBalance(chargeAccountId);
    const initialBalance = beforeSnapshot.balance;
    console.log('BEFORE bill:', JSON.stringify(beforeSnapshot));

    // STEP 2: Insert approved bill
    const billAmountCents = PGuserUsage.ElectricAmount;
    const billAmountDollars = billAmountCents / 100;
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, billAmountCents, PGuserUsage.ElectricUsage
    );

    // STEP 3: Wait for bill ingestion (ingestionState → processed)
    await billQueries.checkElectricBillIsProcessed(billId);

    // Snapshot AFTER ingestion — balance should increase by bill amount
    const afterIngestionSnapshot = await blnkQueries.getChargeAccountBalance(chargeAccountId);
    console.log('AFTER ingestion:', JSON.stringify(afterIngestionSnapshot));

    // Bill txn is APPLIED immediately, so balance increases
    const expectedBalanceAfterIngestion = initialBalance + billAmountDollars;
    expect(Math.round(afterIngestionSnapshot.balance * 100) / 100).toBeCloseTo(
      Math.round(expectedBalanceAfterIngestion * 100) / 100, 1
    );

    // STEP 4: Wait for payment to be created (scheduled_for_payment)
    const expectedAmountWithFee = PGuserUsage.ElectricAmountTotal;
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'scheduled_for_payment');

    // Snapshot DURING inflight — inflight_debit_balance should increase
    // (payment txn is INFLIGHT, debiting from charge account to @Stripe)
    const duringInflightSnapshot = await blnkQueries.getChargeAccountBalance(chargeAccountId);
    console.log('DURING inflight:', JSON.stringify(duringInflightSnapshot));

    // inflight_debit_balance > 0 means there's a pending debit
    expect(duringInflightSnapshot.inflight_debit_balance).toBeGreaterThan(0);

    // STEP 5: Wait for payment success
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'succeeded');

    // Allow a moment for BLNK to commit the transaction
    await delay(5000);

    // Snapshot AFTER success — balance should be back near zero (or reduced)
    const afterSuccessSnapshot = await blnkQueries.getChargeAccountBalance(chargeAccountId);
    console.log('AFTER success:', JSON.stringify(afterSuccessSnapshot));

    // After payment succeeds, inflight should resolve
    // The outstanding balance (balance + inflight) should be ~0
    expect(afterSuccessSnapshot.outstanding).toBeCloseTo(0, 0);
  });
});

// =============================================================================
// DB-014: Cross-Table Consistency — Full Payment Chain
// =============================================================================

test.describe('DB-014: Cross-Table Consistency', () => {
  test.describe.configure({ mode: 'serial' });

  test('Payment ↔ Remittance ↔ BLNK ↔ TransactionMetadata (electric only)', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, card auto-pay
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

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);

    // Insert bill and wait for full pipeline
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    const expectedAmountWithFee = PGuserUsage.ElectricAmountTotal;
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'succeeded');

    // Allow BLNK to finalize
    await delay(5000);

    // ── 1. Get the Payment record with full details ──
    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, expectedAmountWithFee);
    expect(payment.paymentStatus).toBe('succeeded');
    expect(payment.ledgerTransactionID).not.toBeNull();

    // ── 2. Verify contributions format (array with chargeAccountID) ──
    const contributions = payment.contributions;
    expect(Array.isArray(contributions)).toBe(true);
    expect(contributions!.length).toBeGreaterThan(0);

    const contribution = contributions![0];
    expect(contribution.chargeAccountID).toBe(chargeAccountId);
    expect(contribution.amount).toBe(PGuserUsage.ElectricAmount); // bill amount only (no fee)

    // ── 3. Verify contributions sum = Payment.amount - fee ──
    const totalContributions = contributions!.reduce((sum, c) => sum + c.amount, 0);
    const expectedFee = PGuserUsage.ElectricServiceFee;
    expect(totalContributions).toBe(payment.amount - expectedFee);

    // ── 4. Verify BLNK bill ingestion transaction ──
    const billTxn = await blnkQueries.getTransactionByReference(`electric-bill-${billId}`);
    expect(billTxn).not.toBeNull();
    expect(billTxn!.status).toBe('APPLIED');
    // Bill txn amount in dollars
    expect(Math.round(Number(billTxn!.amount) * 100)).toBe(PGuserUsage.ElectricAmount);

    // ── 5. Verify TransactionMetadata links bill to BLNK ──
    await blnkQueries.checkTransactionMetadataLinksBill(
      billTxn!.transaction_id, 'electric', parseInt(billId)
    );

    // ── 6. Verify BLNK remittance transaction ──
    const remittanceTxn = await blnkQueries.getTransactionByReference(`remittance_${payment.id}`);
    expect(remittanceTxn).not.toBeNull();
    expect(remittanceTxn!.status).toBe('APPLIED');
    // Remittance amount = payment minus fee, in dollars
    const expectedRemittanceDollars = (payment.amount - expectedFee) / 100;
    expect(Math.round(Number(remittanceTxn!.amount) * 100) / 100).toBeCloseTo(
      Math.round(expectedRemittanceDollars * 100) / 100, 1
    );

    // ── 7. Verify BLNK fee transfer transaction ──
    const feeTransferTxn = await blnkQueries.getTransactionByReference(`fee_transfer_${payment.id}`);
    expect(feeTransferTxn).not.toBeNull();
    expect(feeTransferTxn!.status).toBe('APPLIED');
    const expectedFeeDollars = expectedFee / 100;
    expect(Math.round(Number(feeTransferTxn!.amount) * 100) / 100).toBeCloseTo(
      Math.round(expectedFeeDollars * 100) / 100, 1
    );

    // ── 8. Verify UtilityRemittance matches contribution ──
    await paymentQueries.checkUtilityRemittance(
      chargeAccountId, contribution.amount, 'ready_for_remittance'
    );

    // ── 9. Full chain verification ──
    await blnkQueries.verifyPaymentChainConsistency(payment.id);

    console.log(`DB-014 PASS: Payment ${payment.id} — full chain verified`);
  });

  test('Separate charge accounts — electric + gas consistency', {
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: SDGE electric + SCE gas (separate charge accounts)
    await utilityQueries.updateCompaniesToBuilding('autotest', 'SDGE', 'SCE');
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'SDGE', 'SCE', true, true);
    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(
      PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

    // Separate charge accounts for different utilities
    const electricChargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);
    const gasChargeAccountId = await accountQueries.getCheckChargeAccount(null, gasAccountId);

    // Insert both bills
    const [electricBillId, gasBillId] = await Promise.all([
      billQueries.insertApprovedElectricBill(electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
      billQueries.insertApprovedGasBill(gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage),
    ]);

    // Wait for both bills to be processed
    await Promise.all([
      billQueries.checkElectricBillIsProcessed(electricBillId),
      billQueries.checkGasBillIsProcessed(gasBillId),
    ]);

    // With separate charge accounts, separate payments are created
    // Wait for electric payment
    await paymentQueries.checkPaymentStatus(
      MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal, 'succeeded'
    );
    // Wait for gas payment
    await paymentQueries.checkPaymentStatus(
      MoveIn.cottageUserId, PGuserUsage.GasAmountTotal, 'succeeded'
    );

    await delay(5000);

    // Verify electric payment chain
    const electricPayment = await blnkQueries.waitForPayment(
      MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal
    );
    expect(electricPayment.contributions![0].chargeAccountID).toBe(electricChargeAccountId);
    await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);

    // Verify gas payment chain
    const gasPayment = await blnkQueries.waitForPayment(
      MoveIn.cottageUserId, PGuserUsage.GasAmountTotal
    );
    expect(gasPayment.contributions![0].chargeAccountID).toBe(gasChargeAccountId);
    await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);

    // Verify BLNK bill ingestion transactions
    const electricBillTxn = await blnkQueries.getTransactionByReference(`electric-bill-${electricBillId}`);
    expect(electricBillTxn).not.toBeNull();
    expect(electricBillTxn!.status).toBe('APPLIED');

    const gasBillTxn = await blnkQueries.getTransactionByReference(`gas-bill-${gasBillId}`);
    expect(gasBillTxn).not.toBeNull();
    expect(gasBillTxn!.status).toBe('APPLIED');

    console.log(`DB-014 PASS: Separate charge accounts — electric ${electricPayment.id}, gas ${gasPayment.id}`);
  });
});

// =============================================================================
// DB-011: BLNK Transaction Descriptions Match Expected Patterns
// =============================================================================

test.describe('DB-011: Transaction Descriptions & References', () => {
  test.describe.configure({ mode: 'serial' });

  test('All BLNK txn descriptions and references match catalog', {
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: COMED electric only, card auto-pay
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

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    const expectedAmountWithFee = PGuserUsage.ElectricAmountTotal;
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'succeeded');
    await delay(5000);

    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, expectedAmountWithFee);

    // ── Bill ingestion transaction ──
    // Reference: electric-bill-{billId}
    // Description: "{companyId} Electric {statementDate} {usage} kWh"
    const billTxn = await blnkQueries.getTransactionByReference(`electric-bill-${billId}`);
    expect(billTxn).not.toBeNull();
    expect(billTxn!.reference).toBe(`electric-bill-${billId}`);
    expect(billTxn!.description).toMatch(/COMED Electric \d{4}-\d{2}-\d{2}/);
    expect(billTxn!.description).toContain('kWh');

    // ── Payment transaction ──
    // Reference: electric_{paymentID}
    // Description: "Customer Balance (Electric) to Stripe"
    const paymentTxn = await blnkQueries.getTransactionByReference(`electric_${payment.id}`);
    expect(paymentTxn).not.toBeNull();
    expect(paymentTxn!.description).toMatch(/Customer Balance \(Electric\) to Stripe/i);

    // ── Fee transaction ──
    // Reference: transaction_fee_{paymentID}
    // Description: "Stripe Fees to Stripe"
    const feeTxn = await blnkQueries.getTransactionByReference(`transaction_fee_${payment.id}`);
    expect(feeTxn).not.toBeNull();
    expect(feeTxn!.description).toBe('Stripe Fees to Stripe');

    // ── Remittance transaction ──
    // Reference: remittance_{paymentID}
    // Description: "Remittance for payment {paymentID}"
    const remittanceTxn = await blnkQueries.getTransactionByReference(`remittance_${payment.id}`);
    expect(remittanceTxn).not.toBeNull();
    expect(remittanceTxn!.description).toBe(`Remittance for payment ${payment.id}`);

    // ── Fee transfer transaction ──
    // Reference: fee_transfer_{paymentID}
    // Description: "Fee transfer for payment {paymentID}"
    const feeTransferTxn = await blnkQueries.getTransactionByReference(`fee_transfer_${payment.id}`);
    expect(feeTransferTxn).not.toBeNull();
    expect(feeTransferTxn!.description).toBe(`Fee transfer for payment ${payment.id}`);

    console.log(`DB-011 PASS: All 5 BLNK transactions match expected patterns for payment ${payment.id}`);
  });
});

// =============================================================================
// DB-015: UtilityRemittance Amount Matches Contribution Per Charge Account
// =============================================================================

test.describe('DB-015: Remittance ↔ Contribution Matching', () => {
  test.describe.configure({ mode: 'serial' });

  test('Each contribution has matching UtilityRemittance with correct amount', {
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // Setup: EVERSOURCE electric + gas (always separate charge accounts)
    await utilityQueries.updateCompaniesToBuilding('autotest', 'EVERSOURCE', null);
    await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, 'EVERSOURCE', null, true, false);
    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(
      PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry,
      PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip
    );

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);

    // Insert bill and wait for pipeline
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );
    await billQueries.checkElectricBillIsProcessed(billId);

    const expectedAmountWithFee = PGuserUsage.ElectricAmountTotal;
    await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, expectedAmountWithFee, 'succeeded');
    await delay(5000);

    const payment = await blnkQueries.waitForPayment(MoveIn.cottageUserId, expectedAmountWithFee);

    // Verify each contribution has a matching UtilityRemittance
    const contributions = payment.contributions!;
    for (const contribution of contributions) {
      if (contribution.chargeAccountID) {
        // UtilityRemittance amount should match contribution amount
        await paymentQueries.checkUtilityRemittance(
          contribution.chargeAccountID,
          contribution.amount,
          'ready_for_remittance'
        );
      }
    }

    // Verify total remittance = Payment.amount - fee
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const expectedFee = PGuserUsage.ElectricServiceFee;
    expect(totalContributions).toBe(payment.amount - expectedFee);

    console.log(`DB-015 PASS: ${contributions.length} contributions matched with UtilityRemittance records`);
  });
});

// =============================================================================
// DB-001 Enhanced: Bill Ingestion BLNK Transaction
// =============================================================================

test.describe('DB-001: Bill Ingestion BLNK Verification', () => {
  test.describe.configure({ mode: 'serial' });

  test('Approved bill creates APPLIED BLNK transaction with correct reference', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page }) => {
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

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

    const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

    // Insert approved bill
    const billId = await billQueries.insertApprovedElectricBill(
      electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
    );

    // Wait for processing
    await billQueries.checkElectricBillIsProcessed(billId);

    // Verify BLNK transaction
    const billAmountDollars = PGuserUsage.ElectricAmount / 100;
    const txn = await blnkQueries.verifyBillIngestionTransaction(
      'electric',
      parseInt(billId),
      billAmountDollars,
      /COMED Electric/
    );

    // Verify status is APPLIED (not inflight)
    expect(txn.status).toBe('APPLIED');

    // Verify TransactionMetadata links to this bill
    await blnkQueries.checkTransactionMetadataLinksBill(
      txn.transaction_id, 'electric', parseInt(billId)
    );

    console.log(`DB-001 PASS: Bill ${billId} → BLNK txn ${txn.transaction_id} (APPLIED, $${txn.amount})`);
  });
});
