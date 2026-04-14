import { expect } from '@playwright/test';
import { executeSQL, executeSQLMaybeSingle } from '../../utils/postgres';
import { supabase } from '../../utils/supabase';
import { RETRY_CONFIG, TIMEOUTS } from '../../constants';
import { logger } from '../../utils/logger';
import type {
  BlnkBalance,
  BlnkTransaction,
  BalanceSnapshot,
  TransactionMetadataRecord,
  PaymentDetailRecord,
  PaymentContribution,
} from '../../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Database queries for BLNK ledger verification.
 *
 * Uses direct Postgres connection (not Supabase PostgREST) because
 * blnk.balances and blnk.transactions are in the `blnk` schema
 * which is not exposed via PostgREST.
 *
 * All BLNK amounts are in DOLLARS. Payment table amounts are in CENTS.
 * Convert with: blnkAmount = paymentAmountCents / 100
 */
export class BlnkQueries {

  // ---------------------------------------------------------------------------
  // Balance queries
  // ---------------------------------------------------------------------------

  /**
   * Get full balance record by ledgerBalanceID (from ChargeAccount or Subscription)
   */
  async getBalance(ledgerBalanceId: string): Promise<BlnkBalance | null> {
    return executeSQLMaybeSingle<BlnkBalance>(
      `SELECT balance_id, balance::numeric as balance,
              credit_balance::numeric as credit_balance,
              debit_balance::numeric as debit_balance,
              inflight_balance::numeric as inflight_balance,
              inflight_credit_balance::numeric as inflight_credit_balance,
              inflight_debit_balance::numeric as inflight_debit_balance,
              ledger_id, currency
       FROM blnk.balances
       WHERE balance_id = $1`,
      [ledgerBalanceId]
    );
  }

  /**
   * Get a point-in-time balance snapshot with computed outstanding balance.
   * Outstanding = balance + inflight_balance (per Brennan's doc)
   */
  async getBalanceSnapshot(ledgerBalanceId: string): Promise<BalanceSnapshot> {
    const bal = await this.getBalance(ledgerBalanceId);
    if (!bal) {
      throw new Error(`No BLNK balance found for ${ledgerBalanceId}`);
    }

    const balance = Number(bal.balance);
    const inflight = Number(bal.inflight_balance);
    const inflightDebit = Number(bal.inflight_debit_balance);
    const inflightCredit = Number(bal.inflight_credit_balance);

    return {
      balance,
      inflight_balance: inflight,
      inflight_debit_balance: inflightDebit,
      inflight_credit_balance: inflightCredit,
      outstanding: balance + inflight,
    };
  }

  /**
   * Get the ledgerBalanceID for a charge account, then fetch its BLNK balance.
   */
  async getChargeAccountBalance(chargeAccountId: string): Promise<BalanceSnapshot> {
    const { data } = await supabase
      .from('ChargeAccount')
      .select('ledgerBalanceID')
      .eq('id', chargeAccountId)
      .single()
      .throwOnError();

    if (!data?.ledgerBalanceID) {
      throw new Error(`ChargeAccount ${chargeAccountId} has no ledgerBalanceID`);
    }

    return this.getBalanceSnapshot(data.ledgerBalanceID);
  }

  /**
   * Poll until charge account balance reaches expected outstanding amount.
   */
  async checkChargeAccountOutstanding(
    chargeAccountId: string,
    expectedOutstandingDollars: number,
    maxRetries: number = RETRY_CONFIG.BILL_PROCESSING_MAX_RETRIES
  ): Promise<BalanceSnapshot> {
    let retries = 0;
    let snapshot: BalanceSnapshot | null = null;

    while (retries < maxRetries) {
      try {
        snapshot = await this.getChargeAccountBalance(chargeAccountId);
        const roundedOutstanding = Math.round(snapshot.outstanding * 100) / 100;
        const roundedExpected = Math.round(expectedOutstandingDollars * 100) / 100;

        if (roundedOutstanding === roundedExpected) {
          logger.info(`Charge account ${chargeAccountId} outstanding: $${roundedOutstanding} (expected: $${roundedExpected})`);
          return snapshot;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('No BLNK balance found')) {
          logger.info(`No BLNK balance yet for charge account ${chargeAccountId}`);
        } else {
          throw error;
        }
      }

      retries++;
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    const actual = snapshot ? Math.round(snapshot.outstanding * 100) / 100 : 'N/A';
    throw new Error(
      `Expected outstanding $${expectedOutstandingDollars}, got $${actual} after ${maxRetries} retries for charge account ${chargeAccountId}`
    );
  }

  // ---------------------------------------------------------------------------
  // Transaction queries
  // ---------------------------------------------------------------------------

  /**
   * Get a BLNK transaction by its reference string.
   * References follow patterns like:
   *   - electric-bill-{id}
   *   - electric_{paymentID}
   *   - transaction_fee_{paymentID}
   *   - remittance_{paymentID}
   *   - fee_transfer_{paymentID}
   *   - subscription-{subId}-{YYYY-MM-DD}
   *   - subscription-payment-{paymentID}
   */
  async getTransactionByReference(reference: string): Promise<BlnkTransaction | null> {
    return executeSQLMaybeSingle<BlnkTransaction>(
      `SELECT transaction_id, source, destination,
              amount::numeric as amount, currency, status,
              reference, description, created_at, meta_data
       FROM blnk.transactions
       WHERE reference = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [reference]
    );
  }

  /**
   * Get all BLNK transactions matching a reference pattern (LIKE query).
   */
  async getTransactionsByPattern(pattern: string): Promise<BlnkTransaction[]> {
    return executeSQL<BlnkTransaction>(
      `SELECT transaction_id, source, destination,
              amount::numeric as amount, currency, status,
              reference, description, created_at, meta_data
       FROM blnk.transactions
       WHERE reference LIKE $1
       ORDER BY created_at DESC`,
      [pattern]
    );
  }

  /**
   * Get all BLNK transactions linked to a payment via Payment.ledgerTransactionID.
   * Handles both txn_ (single) and bulk_ (batch) prefixes.
   */
  async getTransactionsByPaymentId(paymentId: string): Promise<BlnkTransaction[]> {
    // First get the ledgerTransactionID from the Payment record
    const { data: payment } = await supabase
      .from('Payment')
      .select('ledgerTransactionID')
      .eq('id', paymentId)
      .single()
      .throwOnError();

    if (!payment?.ledgerTransactionID) {
      return [];
    }

    // Query transactions matching this ID or its children
    return executeSQL<BlnkTransaction>(
      `SELECT transaction_id, source, destination,
              amount::numeric as amount, currency, status,
              reference, description, created_at, meta_data
       FROM blnk.transactions
       WHERE transaction_id = $1
          OR parent_transaction = $1
       ORDER BY created_at ASC`,
      [payment.ledgerTransactionID]
    );
  }

  /**
   * Poll until a transaction with the given reference reaches the expected status.
   *
   * Note on QUEUED: BLNK transactions created with `skip_queue: false` (auto-pay path)
   * start in QUEUED before the BLNK queue worker transitions them to INFLIGHT. Bill
   * ingestion and manual pay use `skip_queue: true` and never enter QUEUED. The
   * polling loop here tolerates transient QUEUED naturally — callers should still
   * assert against the terminal expected state (APPLIED/INFLIGHT/VOID). QUEUED is
   * exposed in the signature so a caller can explicitly wait on QUEUED if diagnosing
   * queue-worker behavior.
   */
  async checkTransactionStatus(
    reference: string,
    expectedStatus: 'APPLIED' | 'INFLIGHT' | 'QUEUED' | 'VOID',
    maxRetries: number = RETRY_CONFIG.BILL_PROCESSING_MAX_RETRIES
  ): Promise<BlnkTransaction> {
    let retries = 0;
    let txn: BlnkTransaction | null = null;

    while (retries < maxRetries) {
      txn = await this.getTransactionByReference(reference);

      if (txn && txn.status === expectedStatus) {
        logger.info(`BLNK txn ${reference}: status=${txn.status}, amount=${txn.amount}`);
        return txn;
      }

      retries++;
      if (retries % 30 === 0) {
        logger.info(`Waiting for BLNK txn ${reference} to reach ${expectedStatus} (${retries}/${maxRetries}), current: ${txn?.status ?? 'not found'}`);
      }
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    const currentStatus = txn?.status ?? 'not found';
    throw new Error(
      `BLNK txn ${reference}: expected ${expectedStatus}, got ${currentStatus} after ${maxRetries} retries`
    );
  }

  /**
   * Assert a transaction exists and verify its description matches expected pattern.
   */
  async checkTransactionDescription(
    reference: string,
    expectedDescription: string | RegExp
  ): Promise<void> {
    const txn = await this.getTransactionByReference(reference);
    expect(txn, `BLNK transaction with reference ${reference} should exist`).not.toBeNull();

    if (typeof expectedDescription === 'string') {
      expect(txn!.description).toBe(expectedDescription);
    } else {
      expect(txn!.description).toMatch(expectedDescription);
    }
  }

  /**
   * Assert a transaction exists and verify its amount.
   * Amount is in DOLLARS (not cents).
   */
  async checkTransactionAmount(
    reference: string,
    expectedAmountDollars: number
  ): Promise<void> {
    const txn = await this.getTransactionByReference(reference);
    expect(txn, `BLNK transaction with reference ${reference} should exist`).not.toBeNull();

    const actual = Math.round(Number(txn!.amount) * 100) / 100;
    const expected = Math.round(expectedAmountDollars * 100) / 100;
    expect(actual).toBe(expected);
  }

  /**
   * Assert a transaction exists and verify source/destination accounts.
   */
  async checkTransactionAccounts(
    reference: string,
    expectedSource: string,
    expectedDestination: string
  ): Promise<void> {
    const txn = await this.getTransactionByReference(reference);
    expect(txn, `BLNK transaction with reference ${reference} should exist`).not.toBeNull();
    expect(txn!.source).toBe(expectedSource);
    expect(txn!.destination).toBe(expectedDestination);
  }

  /**
   * Assert that NO transaction exists with the given reference.
   * Useful for verifying bank payments don't create fee transactions.
   */
  async checkTransactionDoesNotExist(reference: string): Promise<void> {
    const txn = await this.getTransactionByReference(reference);
    expect(txn, `BLNK transaction with reference ${reference} should NOT exist`).toBeNull();
  }

  // ---------------------------------------------------------------------------
  // TransactionMetadata queries (public schema — uses Supabase)
  // ---------------------------------------------------------------------------

  /**
   * Get TransactionMetadata linking a BLNK transaction to a bill.
   */
  async getTransactionMetadata(ledgerTransactionId: string): Promise<TransactionMetadataRecord | null> {
    const { data } = await supabase
      .from('TransactionMetadata')
      .select('*')
      .eq('ledgerTransactionID', ledgerTransactionId)
      .maybeSingle()
      .throwOnError();

    return data as TransactionMetadataRecord | null;
  }

  /**
   * Check TransactionMetadata exists and links to the expected bill.
   */
  async checkTransactionMetadataLinksBill(
    ledgerTransactionId: string,
    billType: 'electric' | 'gas',
    billId: number
  ): Promise<void> {
    const metadata = await this.getTransactionMetadata(ledgerTransactionId);
    expect(metadata, `TransactionMetadata for txn ${ledgerTransactionId} should exist`).not.toBeNull();

    if (billType === 'electric') {
      expect(metadata!.electricBillID).toBe(billId);
    } else {
      expect(metadata!.gasBillID).toBe(billId);
    }
  }

  // ---------------------------------------------------------------------------
  // Payment detail queries (public schema — uses Supabase)
  // ---------------------------------------------------------------------------

  /**
   * Get full Payment record with contributions for verification.
   */
  async getPaymentDetail(paymentId: string): Promise<PaymentDetailRecord | null> {
    const { data } = await supabase
      .from('Payment')
      .select('id, paidBy, amount, paymentStatus, stripePaymentID, paymentMethodID, ledgerTransactionID, contributions, refundedAmount, succeededAt')
      .eq('id', paymentId)
      .maybeSingle()
      .throwOnError();

    return data as PaymentDetailRecord | null;
  }

  /**
   * Get Payment record by user and amount (matches existing paymentQueries pattern).
   * Returns the full record with contributions for BLNK verification.
   */
  async getPaymentByUserAndAmount(
    cottageUserId: string,
    amountCents: number
  ): Promise<PaymentDetailRecord | null> {
    const { data } = await supabase
      .from('Payment')
      .select('id, paidBy, amount, paymentStatus, stripePaymentID, paymentMethodID, ledgerTransactionID, contributions, refundedAmount, succeededAt')
      .eq('paidBy', cottageUserId)
      .eq('amount', amountCents)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .throwOnError();

    return data as PaymentDetailRecord | null;
  }

  /**
   * Poll until Payment record exists and return it with full details.
   */
  async waitForPayment(
    cottageUserId: string,
    amountCents: number,
    maxRetries: number = RETRY_CONFIG.PAYMENT_STATUS_MAX_RETRIES
  ): Promise<PaymentDetailRecord> {
    let retries = 0;

    while (retries < maxRetries) {
      const payment = await this.getPaymentByUserAndAmount(cottageUserId, amountCents);
      if (payment) {
        return payment;
      }

      retries++;
      if (retries % 60 === 0) {
        logger.info(`Waiting for Payment (user=${cottageUserId}, amount=${amountCents}) — ${retries}/${maxRetries}`);
      }
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    throw new Error(`Payment not found after ${maxRetries} retries for user ${cottageUserId} amount ${amountCents}`);
  }

  // ---------------------------------------------------------------------------
  // Cross-table verification (DB-014)
  // ---------------------------------------------------------------------------

  /**
   * Verify full payment chain consistency:
   * Payment.contributions ↔ UtilityRemittance ↔ BLNK transactions
   *
   * Checks:
   * 1. contributions[].amount sums to Payment.amount - fee
   * 2. Each contribution has matching UtilityRemittance
   * 3. Remittance BLNK txn amount matches
   * 4. Fee transfer BLNK txn amount matches
   */
  async verifyPaymentChainConsistency(paymentId: string): Promise<void> {
    // 1. Get payment detail
    const payment = await this.getPaymentDetail(paymentId);
    expect(payment, `Payment ${paymentId} should exist`).not.toBeNull();
    expect(payment!.paymentStatus).toBe('succeeded');

    const contributions = payment!.contributions as PaymentContribution[];
    expect(Array.isArray(contributions), 'contributions should be an array').toBe(true);
    expect(contributions.length).toBeGreaterThan(0);

    // 2. Check remittance BLNK transaction exists
    const remittanceTxn = await this.getTransactionByReference(`remittance_${paymentId}`);
    expect(remittanceTxn, `Remittance txn for payment ${paymentId} should exist`).not.toBeNull();
    expect(remittanceTxn!.status).toBe('APPLIED');

    // 3. Check fee transfer BLNK transaction
    const feeTransferTxn = await this.getTransactionByReference(`fee_transfer_${paymentId}`);
    // Fee transfer may not exist if bank payment (0 fee)
    if (feeTransferTxn) {
      expect(feeTransferTxn.status).toBe('APPLIED');
    }

    // 4. Verify amounts
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    const feeDollars = feeTransferTxn ? Number(feeTransferTxn.amount) : 0;
    const remittanceDollars = Number(remittanceTxn!.amount);

    // Contributions sum (cents) should equal payment amount minus fee
    const paymentAmountCents = payment!.amount;
    const feeAmountCents = Math.round(feeDollars * 100);
    expect(totalContributions).toBe(paymentAmountCents - feeAmountCents);

    // Remittance amount (dollars) should match contributions sum (converted)
    const expectedRemittanceDollars = Math.round(totalContributions) / 100;
    expect(Math.round(remittanceDollars * 100) / 100).toBe(
      Math.round(expectedRemittanceDollars * 100) / 100
    );

    // 5. Verify each contribution has matching UtilityRemittance
    for (const contribution of contributions) {
      if (contribution.chargeAccountID) {
        const { data: remittance } = await supabase
          .from('UtilityRemittance')
          .select('id, amount, remittanceStatus, paymentID')
          .eq('paymentID', paymentId)
          .eq('chargeAccountID', contribution.chargeAccountID)
          .maybeSingle()
          .throwOnError();

        expect(remittance, `UtilityRemittance for charge account ${contribution.chargeAccountID} should exist`).not.toBeNull();
        expect(remittance!.remittanceStatus).toBe('ready_for_remittance');
        // Remittance amount is in a numeric column (dollars or cents depending on context)
        // The contribution amount is in cents
        expect(Number(remittance!.amount)).toBe(contribution.amount);
      }
    }

    logger.info(`Payment chain verified for ${paymentId}: ${contributions.length} contributions, remittance=$${remittanceDollars}, fee=$${feeDollars}`);
  }

  // ---------------------------------------------------------------------------
  // Fee verification (DB-012)
  // ---------------------------------------------------------------------------

  /**
   * Verify fee calculation accuracy for a payment.
   *
   * Card: fee = bankersRound(amount * percentage + fixed)
   * Bank: fee = 0
   *
   * @param paymentId - Payment UUID
   * @param billAmountCents - Bill amount in cents (before fee)
   * @param expectedFeeCents - Expected fee in cents
   */
  async verifyFeeCalculation(
    paymentId: string,
    billAmountCents: number,
    expectedFeeCents: number
  ): Promise<void> {
    const payment = await this.getPaymentDetail(paymentId);
    expect(payment, `Payment ${paymentId} should exist`).not.toBeNull();

    // Payment.amount = bill + fee (all in cents)
    expect(payment!.amount).toBe(billAmountCents + expectedFeeCents);

    // BLNK fee transaction
    if (expectedFeeCents > 0) {
      const feeTxn = await this.getTransactionByReference(`transaction_fee_${paymentId}`);
      expect(feeTxn, `Fee transaction for payment ${paymentId} should exist`).not.toBeNull();

      const expectedFeeDollars = Math.round(expectedFeeCents) / 100;
      expect(Math.round(Number(feeTxn!.amount) * 100) / 100).toBe(expectedFeeDollars);
      expect(feeTxn!.description).toBe('Stripe Fees to Stripe');
    } else {
      // Bank payment — no fee transaction should exist
      await this.checkTransactionDoesNotExist(`transaction_fee_${paymentId}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Bill ingestion verification (DB-001 enhanced)
  // ---------------------------------------------------------------------------

  /**
   * Verify BLNK transaction created during bill ingestion.
   *
   * @param billType - 'electric' or 'gas'
   * @param billId - Bill ID
   * @param expectedAmountDollars - Expected amount in dollars
   * @param expectedDescription - Expected description pattern
   */
  async verifyBillIngestionTransaction(
    billType: 'electric' | 'gas',
    billId: number,
    expectedAmountDollars: number,
    expectedDescription?: string | RegExp
  ): Promise<BlnkTransaction> {
    const reference = `${billType}-bill-${billId}`;

    const txn = await this.checkTransactionStatus(reference, 'APPLIED');

    // Verify amount
    const actual = Math.round(Number(txn.amount) * 100) / 100;
    const expected = Math.round(expectedAmountDollars * 100) / 100;
    expect(actual).toBe(expected);

    // Verify description if provided
    if (expectedDescription) {
      if (typeof expectedDescription === 'string') {
        expect(txn.description).toBe(expectedDescription);
      } else {
        expect(txn.description).toMatch(expectedDescription);
      }
    }

    return txn;
  }


  // =========================================================================
  // BLNK Migration — ENG-2421: Effective Date Verification
  // =========================================================================

  /**
   * Verify that a BLNK transaction's effective_date matches the bill's dueDate.
   * For post-migration transactions: effective_date = bill dueDate
   * For pre-migration (backfilled): effective_date = created_at
   */
  async verifyEffectiveDate(reference: string, expectedDueDate: string): Promise<void> {
    const rows = await executeSQL<{ effective_date: string; created_at: string }>(
      `SELECT effective_date, created_at FROM blnk.transactions WHERE reference = $1`,
      [reference]
    );
    expect(rows.length).toBeGreaterThan(0);
    const txn = rows[0];

    // Post-migration: effective_date should match the bill's due date
    const effectiveDate = new Date(txn.effective_date).toISOString().split('T')[0];
    const expected = new Date(expectedDueDate).toISOString().split('T')[0];
    expect(effectiveDate).toBe(expected);
    logger.info(`BLNK effective_date verified: ${reference} → ${effectiveDate} (expected ${expected})`);
  }

  /**
   * Check if a transaction was backfilled (effective_date = created_at) vs new (effective_date = dueDate).
   */
  async checkTransactionMigrationStatus(reference: string): Promise<'backfilled' | 'post-migration'> {
    const rows = await executeSQL<{ effective_date: string; created_at: string }>(
      `SELECT effective_date, created_at FROM blnk.transactions WHERE reference = $1`,
      [reference]
    );
    if (rows.length === 0) throw new Error(`Transaction ${reference} not found`);

    const effective = new Date(rows[0].effective_date).getTime();
    const created = new Date(rows[0].created_at).getTime();
    // Within 1 second = backfilled
    return Math.abs(effective - created) < 1000 ? 'backfilled' : 'post-migration';
  }


  // =========================================================================
  // BLNK Migration — ENG-2458: Identity Linking Verification
  // =========================================================================

  /**
   * Verify a BLNK identity exists and is linked to a balance for the given charge account.
   */
  async verifyIdentityLinkedToBalance(balanceId: string): Promise<{ identityId: string; balanceId: string }> {
    const rows = await executeSQL<{ identity_id: string; balance_id: string }>(
      `SELECT b.identity_id, b.balance_id
       FROM blnk.balances b
       WHERE b.balance_id = $1 AND b.identity_id IS NOT NULL`,
      [balanceId]
    );
    expect(rows.length).toBe(1);
    expect(rows[0].identity_id).toBeTruthy();
    logger.info(`BLNK identity linked: balance ${balanceId} → identity ${rows[0].identity_id}`);
    return { identityId: rows[0].identity_id, balanceId: rows[0].balance_id };
  }

  /**
   * Get BLNK identity details by identity_id.
   */
  async getIdentity(identityId: string): Promise<{ identity_id: string; email_address: string; meta_data: Record<string, unknown> }> {
    const rows = await executeSQL<{ identity_id: string; email_address: string; meta_data: Record<string, unknown> }>(
      `SELECT identity_id, email_address, meta_data FROM blnk.identity WHERE identity_id = $1`,
      [identityId]
    );
    expect(rows.length).toBe(1);
    return rows[0];
  }


  // =========================================================================
  // BLNK Migration — ENG-2420: Uniqueness Verification
  // =========================================================================

  /**
   * Count transactions with a given reference — should always be exactly 1 after uniqueness constraint.
   */
  async verifyTransactionUniqueness(reference: string): Promise<number> {
    const rows = await executeSQL<{ count: string }>(
      `SELECT COUNT(*) as count FROM blnk.transactions WHERE reference = $1`,
      [reference]
    );
    const count = parseInt(rows[0].count);
    expect(count).toBe(1);
    logger.info(`BLNK uniqueness verified: ${reference} → ${count} transaction(s)`);
    return count;
  }
}

export const blnkQueries = new BlnkQueries();
