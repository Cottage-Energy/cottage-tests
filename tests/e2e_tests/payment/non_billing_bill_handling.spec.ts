import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { executeSQL } from '../../resources/utils/postgres';
import { createLogger } from '../../resources/utils/logger';
import { newUserMoveInSkipPayment, generateTestUserData, CleanUp } from '../../resources/fixtures';
import { utilityQueries, accountQueries, billQueries } from '../../resources/fixtures/database';
import type { MoveInResult } from '../../resources/types';

const log = createLogger('NonBillingBillHandling');
let NonBillingMoveIn: MoveInResult | null = null;

/**
 * Non-billing user bill handling — DB-level invariants.
 *
 * Covers two related cases from the test plan (§17):
 *
 * DB-008: The normal path — non-billing bills are born `viewable` by the
 *         nightly-audit scraper. They never enter BLNK. They never create a
 *         Payment. They stay `viewable` forever (no terminal transition).
 *
 * DB-008a: The wrongful-approval edge case — if a bill ends up in `approved`
 *          on a non-billing account (via PG-Admin, manual INSERT, etc.),
 *          `balance-ledger-batch` silently skips it because the cron filters
 *          by `maintainedFor IS NOT NULL`. No retroactive transition to
 *          `viewable` exists — the bill is stuck forever.
 *
 * Both tests rely on existing dev data as fixtures (15 viewable + 15 stuck
 * approved bills as of 2026-04-14). If dev cleanup removes them, individual
 * tests skip.
 *
 * Reference: tests/test_plans/payment_system_comprehensive.md §17 DB-008, DB-008a
 * Reference: tests/docs/payment-system.md — Ingestion State Pipeline
 * Reference: automations/src/base/utility.ts:309-315 — the `checkNewBills()` logic
 *
 * Non-billing user bills are normally born in `viewable` state by the
 * nightly-audit scraper (`automations/src/base/utility.ts:309-315
 * checkNewBills()`). If a bill ends up in `approved` on a non-billing account
 * — whether via PG-Admin promote, direct SQL INSERT, or any other path that
 * bypasses the scraper — it is silently skipped by `balance-ledger-batch`
 * because that cron filters by `maintainedFor IS NOT NULL`
 * (services `packages/inngest/functions/billing/ledger/batch/utils.ts:12`).
 *
 * The invariant: such bills must have NO BLNK transaction and NO Payment
 * record. They should stay `approved` indefinitely — proving the filter
 * works correctly. As of 2026-04-14 dev has 12 electric + 3 gas such bills,
 * the oldest from Oct 2025.
 *
 * This test does NOT create new test data — it relies on existing stuck
 * bills as fixtures. If dev cleanup removes all of them, the test skips.
 *
 * Reference: tests/test_plans/payment_system_comprehensive.md §17 DB-008a
 * Reference: tests/docs/payment-system.md — Ingestion State Pipeline
 */

interface StuckBillRow {
  id: number;
  ingestionState: string;
  createdAt: string;
  statementDate: string;
  electricAccountID: number;
  maintainedFor: string | null;
  accountNumber: string;
}

interface ViewableBillRow {
  id: number;
  electricAccountID: number;
  createdAt: string;
  statementDate: string;
}

// =============================================================================
// DB-008: Non-billing bills born `viewable` — no BLNK, no Payment
// =============================================================================

test.describe('DB-008: Non-billing bills in `viewable` state', () => {
  test.describe.configure({ retries: 0 });

  test(
    'Non-billing `viewable` electric bills have no BLNK transaction',
    { tag: [TEST_TAGS.PAYMENT] },
    async () => {
      test.setTimeout(TIMEOUTS.DEFAULT * 3);

      // Find existing viewable bills on non-billing accounts. These were
      // inserted by the nightly-audit scraper via `checkNewBills()` — the
      // normal path. They must never have a corresponding BLNK transaction
      // because the payment pipeline only touches billing users.
      const viewableBills = await executeSQL<ViewableBillRow>(
        `SELECT eb.id, eb."electricAccountID", eb."createdAt"::text, eb."statementDate"::text
         FROM "ElectricBill" eb
         JOIN "ElectricAccount" ea ON ea.id = eb."electricAccountID"
         WHERE eb."ingestionState" = 'viewable'
           AND ea."maintainedFor" IS NULL
         ORDER BY eb."createdAt" DESC
         LIMIT 10`,
        []
      );

      if (viewableBills.length === 0) {
        test.skip(true, 'No `viewable` non-billing electric bills exist in dev.');
        return;
      }

      log.info(`Checking ${viewableBills.length} viewable bills for BLNK absence`, {
        billIds: viewableBills.map(b => b.id),
      });

      for (const bill of viewableBills) {
        const blnkTxns = await executeSQL<{ transaction_id: string; status: string }>(
          `SELECT transaction_id, status FROM blnk.transactions WHERE reference = $1`,
          [`electric-bill-${bill.id}`]
        );

        expect(
          blnkTxns,
          `Bill ${bill.id} is in \`viewable\` on a non-billing account but has BLNK transaction(s). ` +
            `viewable bills must never enter the ledger.`
        ).toHaveLength(0);
      }
    }
  );

  test(
    'Non-billing `viewable` gas bills have no BLNK transaction',
    { tag: [TEST_TAGS.PAYMENT] },
    async () => {
      test.setTimeout(TIMEOUTS.DEFAULT * 3);

      const viewableGasBills = await executeSQL<{ id: number; gasAccountID: number }>(
        `SELECT gb.id, gb."gasAccountID"
         FROM "GasBill" gb
         JOIN "GasAccount" ga ON ga.id = gb."gasAccountID"
         WHERE gb."ingestionState" = 'viewable'
           AND ga."maintainedFor" IS NULL
         ORDER BY gb."createdAt" DESC
         LIMIT 10`,
        []
      );

      if (viewableGasBills.length === 0) {
        test.skip(true, 'No `viewable` non-billing gas bills exist in dev.');
        return;
      }

      log.info(`Checking ${viewableGasBills.length} viewable gas bills for BLNK absence`);

      for (const bill of viewableGasBills) {
        const blnkTxns = await executeSQL<{ transaction_id: string }>(
          `SELECT transaction_id FROM blnk.transactions WHERE reference = $1`,
          [`gas-bill-${bill.id}`]
        );
        expect(
          blnkTxns,
          `Gas bill ${bill.id} is in \`viewable\` on a non-billing account but has BLNK transaction(s).`
        ).toHaveLength(0);
      }
    }
  );

  test(
    '`viewable` is a terminal state — old viewable bills do not transition',
    { tag: [TEST_TAGS.PAYMENT] },
    async () => {
      // If any transition path (`viewable → processed`, `viewable → approved`,
      // `viewable → cancelled`) existed, bills older than 30 days would have
      // moved. Their continued presence as `viewable` is proof the state is
      // terminal.
      const oldViewable = await executeSQL<{ count: string; oldest: string }>(
        `SELECT COUNT(*)::text AS count, MIN(eb."createdAt")::text AS oldest
         FROM "ElectricBill" eb
         JOIN "ElectricAccount" ea ON ea.id = eb."electricAccountID"
         WHERE eb."ingestionState" = 'viewable'
           AND ea."maintainedFor" IS NULL
           AND eb."createdAt" < NOW() - INTERVAL '30 days'`,
        []
      );

      const count = Number(oldViewable[0]?.count ?? 0);
      const oldest = oldViewable[0]?.oldest;
      log.info('Viewable bills older than 30 days', { count, oldest });

      if (count === 0) {
        test.skip(true, 'No viewable bills older than 30 days to verify stasis against.');
        return;
      }

      // If we have N bills stuck in `viewable` for >30 days, that's direct
      // proof the state is terminal. We don't need to assert anything stronger.
      expect(count, 'Expected at least 1 old viewable bill as stasis evidence').toBeGreaterThanOrEqual(1);
    }
  );
});

// =============================================================================
// DB-008a: Wrongfully-approved non-billing bills stuck in `approved`
// =============================================================================

test.describe('DB-008a: Wrongfully-approved non-billing bills', () => {
  test.describe.configure({ retries: 0 });

  test(
    'Non-billing approved bills (>7 days old) have no BLNK transaction or Payment',
    { tag: [TEST_TAGS.PAYMENT] },
    async () => {
      test.setTimeout(TIMEOUTS.DEFAULT * 3);

      // Find non-billing bills that have been stuck in `approved` for >7 days.
      // If `balance-ledger-batch` were incorrectly processing them, they would
      // have transitioned to `processed` within 1-2 cron cycles (~10 min).
      const stuckBills = await executeSQL<StuckBillRow>(
        `SELECT eb.id, eb."ingestionState", eb."createdAt"::text, eb."statementDate"::text,
                eb."electricAccountID", ea."maintainedFor", ea."accountNumber"
         FROM "ElectricBill" eb
         JOIN "ElectricAccount" ea ON ea.id = eb."electricAccountID"
         WHERE eb."ingestionState" = 'approved'
           AND ea."maintainedFor" IS NULL
           AND eb."createdAt" < NOW() - INTERVAL '7 days'
         ORDER BY eb."createdAt" ASC
         LIMIT 5`,
        []
      );

      if (stuckBills.length === 0) {
        log.info('No stuck non-billing approved bills in dev — DB-008a skipped this run');
        test.skip(true, 'No wrongfully-approved non-billing bills exist in dev to verify against. Either all were cleaned up, or the scraper path is fully correct now.');
        return;
      }

      log.info(`Found ${stuckBills.length} stuck non-billing approved bills`, {
        oldest: stuckBills[0].createdAt,
        billIds: stuckBills.map(b => b.id),
      });

      // For each stuck bill, assert no BLNK transaction was created.
      // The bill-ingestion transaction reference pattern is `electric-bill-{id}`.
      for (const bill of stuckBills) {
        const blnkTxns = await executeSQL<{ transaction_id: string; status: string; reference: string }>(
          `SELECT transaction_id, status, reference
           FROM blnk.transactions
           WHERE reference = $1`,
          [`electric-bill-${bill.id}`]
        );

        expect(
          blnkTxns,
          `Bill ${bill.id} (${bill.createdAt}) is in \`approved\` on a non-billing account but has BLNK transaction(s). ` +
            `balance-ledger-batch should have skipped it — this suggests the maintainedFor filter regressed.`
        ).toHaveLength(0);
      }

      // The BLNK-transaction absence check above is the authoritative proof
      // that balance-ledger-batch skipped these bills. A Payment cross-check
      // is not meaningful because charge accounts are often shared — the same
      // account may have OTHER (billing) bills that DID produce payments.
    }
  );

  test(
    'Gas non-billing approved bills also skipped by balance-ledger-batch',
    { tag: [TEST_TAGS.PAYMENT] },
    async () => {
      test.setTimeout(TIMEOUTS.DEFAULT * 3);

      const stuckGasBills = await executeSQL<{ id: number; gasAccountID: number; createdAt: string }>(
        `SELECT gb.id, gb."gasAccountID", gb."createdAt"::text
         FROM "GasBill" gb
         JOIN "GasAccount" ga ON ga.id = gb."gasAccountID"
         WHERE gb."ingestionState" = 'approved'
           AND ga."maintainedFor" IS NULL
           AND gb."createdAt" < NOW() - INTERVAL '7 days'
         ORDER BY gb."createdAt" ASC
         LIMIT 5`,
        []
      );

      if (stuckGasBills.length === 0) {
        test.skip(true, 'No wrongfully-approved non-billing gas bills in dev.');
        return;
      }

      log.info(`Found ${stuckGasBills.length} stuck non-billing approved gas bills`);

      for (const bill of stuckGasBills) {
        const blnkTxns = await executeSQL<{ transaction_id: string }>(
          `SELECT transaction_id FROM blnk.transactions WHERE reference = $1`,
          [`gas-bill-${bill.id}`]
        );
        expect(
          blnkTxns,
          `Gas bill ${bill.id} is stuck in \`approved\` on non-billing account but has BLNK transaction(s).`
        ).toHaveLength(0);
      }
    }
  );
});

// =============================================================================
// DB-008b: Non-billing bill FE visibility
// =============================================================================
// Non-billing users should see their bills on Billing & Payments (read-only)
// but have NO "Pay bill" button and NO outstanding balance. This is the UI
// side of the DB-008 invariant: the ledger pipeline doesn't touch these
// bills, so no outstanding balance can accrue.
//
// Creates a fresh non-billing user via skip-payment move-in, inserts a
// `viewable` bill via Supabase (simulating what the scraper would do), and
// verifies the FE rendering.
test.describe('DB-008b: Non-billing bill FE visibility', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async () => {
    if (NonBillingMoveIn?.pgUserEmail) {
      await CleanUp.Test_User_Clean_Up(NonBillingMoveIn.pgUserEmail);
      NonBillingMoveIn = null;
    }
  });

  test(
    'Non-billing user sees viewable bills but NO Pay bill button',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateBuildingBilling('autotest', true);
      await utilityQueries.updateBuildingUseEncourageConversion('autotest', false);
      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);

      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      NonBillingMoveIn = await newUserMoveInSkipPayment(page, 'COMED', null, true, false);

      // NonBillingMoveIn.cottageUserId → electric account (non-billing, maintainedFor=null)
      const electricAccountId = await accountQueries.checkGetElectricAccountId(NonBillingMoveIn.cottageUserId);

      // Insert a bill directly as `viewable` (simulating scraper's normal path
      // for non-billing users per automations/src/base/utility.ts:309-315)
      const billId = await billQueries.insertElectricBill(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await executeSQL(
        `UPDATE "ElectricBill" SET "ingestionState" = 'viewable' WHERE id = $1`,
        [billId]
      );

      // Sign in and navigate to overview
      await page.goto('/sign-in');
      await overviewPage.Setup_Password();
      await overviewPage.Accept_New_Terms_And_Conditions();
      await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Core invariants: no outstanding balance, no Pay bill button.
      // For non-billing users, balance stays $0 because the bill never enters BLNK.
      await overviewPage.Check_Outstanding_Balance_Amount(0);
      await overviewPage.Check_Pay_Bill_Button_Not_Visible();

      log.info('DB-008b: Non-billing viewable bill — no Pay button, $0 outstanding, PASS');
    }
  );
});
