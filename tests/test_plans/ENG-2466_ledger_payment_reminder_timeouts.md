# Test Plan: ENG-2466 — Ledger Payment Reminders: Fix Statement Timeouts

## Overview
**Ticket**: ENG-2466
**Source**: [Linear](https://linear.app/public-grid/issue/ENG-2466), [services PR #310](https://github.com/Cottage-Energy/services/pull/310)
**Date**: 2026-03-27
**Tester**: Christian
**PR Status**: Merged (2026-03-27)
**Created By**: Tomy Falgui

## Context

The ledger payment reminder pipeline (`trigger` → `batch-process` → `batch`) was hitting Supabase statement timeouts due to:
1. **Unbounded bill queries** — `retrieveElectricPropertyBills` / `retrieveGasPropertyBills` joined across 6 tables with up to 40+ property IDs in a single query
2. **N+1 account status lookups** — `getAccountStatus()` called per-account in loops (~80 individual queries per batch)
3. **N+1 delinquency lookups** — `getDelinquencyStatus()` called per-account (~40 queries per batch)
4. **Duplicate status fetches** — `getAccountStatus()` called in `batch.ts` AND again in `calculateReminderLogic()` for the same accounts

### What the Fix Does
- **New `getAccountStatuses()` bulk method** — fetches `id, status, isDelinquent` for all accounts in one query, returns a `Map`
- **Pre-fetch pattern** — account statuses fetched once at batch start, passed as maps to `calculateReminderLogic()` and `calculateDelinquency()`
- **Bill query restructure** — queries from Account→Bill (not Bill→Account), chunks property IDs in batches of 25 via `chunkArray()`
- **`calculateDelinquency` is now synchronous** — reads from pre-fetched map instead of awaiting DB calls
- **Removed try/catch fallback** — previously, if a status fetch failed per-account, the account was still included; now the whole batch fails if `getAccountStatuses()` fails
- **Null safety** — `hasMore ?? false` prevents crash on undefined pagination

### Pipeline Architecture
```
trigger-ledger-payment-reminders (cron 11AM EST / event: "ledger.payment.reminders")
  └─ aggregateCottageUserChargeAccounts() → groups users + charge accounts
  └─ sends "ledger.batch.reminders.process" events (batches of 20 users)
      └─ batch-process-ledger-reminders
          └─ fetchChargeAccountsWithUsers()
          └─ fetchBalanceData() (BLNK ledger)
          └─ fetchAllBillsWithMetadata() ← CHANGED (chunked bill queries)
          └─ groups by property + user → sends "ledger.batch.reminders.send"
              └─ batch-ledger-payment-reminders
                  └─ getAccountStatuses() ← NEW (bulk pre-fetch)
                  └─ filter inactive accounts ← CHANGED (map lookup)
                  └─ calculateReminderLogic() ← CHANGED (accepts status maps)
                      └─ calculateDelinquency() ← CHANGED (sync, map lookup)
                  └─ sends reminder-email / reminder-text / flag-for-offboarding
```

### Reminder Thresholds (unchanged — verify still honored)
| Days Overdue | Type | Email | Text (EIN) | Text (non-EIN) |
|---|---|---|---|---|
| 5–15 | `standard` | Every 5 days | Every 5 days | Every 7 days |
| 16–24 | `shutoff_warning` | Daily | Every 3 days (from 18) | Day 21 only |
| 25+ | `final_shutoff` | Once | Once | Once |

## Scope

### In Scope
- Functional equivalence of reminder pipeline after query optimization
- Correct filtering of inactive / NEEDS_OFF_BOARDING accounts
- Correct delinquency detection from pre-fetched map
- Bill data integrity after query restructure (Account→Bill + chunking)
- Pipeline completion without timeouts for realistic batch sizes
- Error handling behavior change (batch-level failure vs. per-account fallback)

### Out of Scope
- Reminder email/text content or template changes (no changes in PR)
- BLNK ledger balance calculations (untouched)
- Stripe payment capture (separate pipeline)
- Production cron scheduling (unchanged)
- Text message consent logic (unchanged)

### Prerequisites
- Dev environment with Inngest dashboard access
- `INNGEST_EVENT_KEY` from `.env` (routes to `pg-payments`)
- Billing users with ACTIVE electric/gas accounts and outstanding balances in dev
- At least one user with INACTIVE accounts (for filtering verification)
- At least one user with `isDelinquent = true` (for delinquency verification)

### Dependencies
- Inngest (`pg-payments` app) — must be running with merged PR #310 code
- Supabase (dev) — account status and bill data
- BLNK ledger — balance data
- Dialpad — text message delivery (optional for testing)

## Test Cases

### Happy Path — Pipeline Execution

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Trigger pipeline via event in dev | 1. `curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" -H "Content-Type: application/json" -d '{"name": "ledger.payment.reminders", "data": {}}'` 2. Open Inngest dashboard → check `trigger-ledger-payment-reminders` run | Function triggers successfully, returns `batchesSent`, `totalUsers`, `totalChargeAccounts` counts | P0 | No (exploratory) |
| TC-002 | Batch-process completes for all batches | 1. After TC-001, check Inngest dashboard for `batch-process-ledger-reminders` runs 2. Verify each batch completes without timeout | All `batch-process-ledger-reminders` runs complete with status "Completed" — no timeouts or errors | P0 | No (exploratory) |
| TC-003 | Batch (reminder delivery) completes | 1. After TC-002, check `batch-ledger-reminders` runs 2. Verify reminder emails/texts are dispatched | Reminder delivery functions complete. Check Inngest logs for "Processing batch X with Y reminder groups" | P0 | No (exploratory) |
| TC-004 | Standard reminder sent for 5-day overdue user | 1. Identify a billing user with balance 5+ days overdue (or set up via DB) 2. Trigger pipeline 3. Check Fastmail for reminder email | User receives "Payment Due" email with correct balance and due date | P1 | No (exploratory) |
| TC-005 | Pipeline handles users with both electric + gas accounts | 1. Identify a billing user with both electric and gas charge accounts 2. Trigger pipeline 3. Verify both account types are processed | Both electric and gas accounts appear in reminder data; statuses fetched for both types | P1 | No (exploratory) |

### Account Status Filtering (Core Behavioral Equivalence)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | INACTIVE electric accounts excluded from reminders | 1. Query: `SELECT ea."id" FROM "ElectricAccount" ea WHERE ea."status" = 'INACTIVE' AND ea."maintainedFor" IS NOT NULL LIMIT 3` 2. Trigger pipeline 3. Check Inngest logs for these account IDs | INACTIVE accounts do NOT appear in reminder processing. Inngest logs show "activeAccounts" filtering excludes them | P0 | No (DB + Inngest logs) |
| TC-011 | INACTIVE gas accounts excluded from reminders | 1. Query for INACTIVE gas accounts with `maintainedFor` set 2. Trigger pipeline 3. Verify gas accounts filtered | INACTIVE gas accounts excluded via `gasStatuses.get(id)?.status === "INACTIVE"` check | P0 | No (DB + Inngest logs) |
| TC-012 | NEEDS_OFF_BOARDING accounts excluded from valid accounts | 1. Identify accounts with `status = 'NEEDS_OFF_BOARDING'` 2. Trigger pipeline | Accounts with NEEDS_OFF_BOARDING status are excluded from `validAccounts` in `calculateReminderLogic` (not considered for payment reminders) | P1 | No (Inngest logs) |
| TC-013 | Mixed active/inactive accounts — only active processed | 1. Find a user with both ACTIVE and INACTIVE accounts on same property 2. Trigger pipeline | Only the ACTIVE account(s) generate reminders; INACTIVE ones silently skipped. `activeAccounts.length` reflects only active ones | P0 | No (DB + Inngest logs) |
| TC-014 | All accounts inactive → user skipped entirely | 1. Find/create a user where ALL accounts are INACTIVE 2. Trigger pipeline | `activeAccounts.length === 0` → `continue` — user is skipped, no reminder sent | P1 | No (Inngest logs) |

### Delinquency Detection

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Delinquent electric account tagged correctly | 1. Query: `SELECT ea."id", ea."isDelinquent" FROM "ElectricAccount" ea WHERE ea."isDelinquent" = true AND ea."status" = 'ACTIVE' AND ea."maintainedFor" IS NOT NULL LIMIT 3` 2. Trigger pipeline 3. Check Inngest logs for delinquency tagging | `calculateDelinquency` returns `shouldTagElectric = true` for delinquent accounts. Pre-fetched map correctly provides `isDelinquent` value | P1 | No (Inngest logs) |
| TC-021 | Delinquent gas account tagged correctly | 1. Query for delinquent gas accounts 2. Trigger pipeline | `shouldTagGas = true` for delinquent gas accounts | P1 | No (Inngest logs) |
| TC-022 | Non-delinquent accounts not tagged | 1. Verify accounts with `isDelinquent = false` 2. Trigger pipeline | `shouldTagElectric = false` / `shouldTagGas = false` — no false positives | P1 | No (Inngest logs) |
| TC-023 | Delinquency untagging for recovered accounts | 1. Find an account with `isDelinquent = false` but was previously delinquent (has reminder history) 2. Trigger pipeline | `shouldUntagElectric = true` or `shouldUntagGas = true` — clears delinquency flag when account is no longer delinquent | P2 | No (Inngest logs) |

### Bill Data Integrity (Query Restructure)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Electric bills retrieved correctly after query restructure | 1. Pick 3 properties with known electric bills: `SELECT eb."id", eb."totalAmountDue", ea."id" as "accountId", ea."propertyID" FROM "ElectricBill" eb JOIN "ElectricAccount" ea ON eb."electricAccountID" = ea."id" WHERE ea."maintainedFor" IS NOT NULL AND ea."status" = 'ACTIVE' LIMIT 10` 2. Trigger pipeline 3. Verify these bills appear in batch-process logs | Bills returned by restructured query (Account→Bill) match expected bills. `FlatElectricBill` objects have correct `id`, `totalAmountDue`, `ElectricAccount.id`, and associated `TransactionMetadata`, `BillAdjustment`, `BillCredit` | P0 | No (DB + Inngest logs) |
| TC-031 | Gas bills retrieved correctly after query restructure | 1. Same approach for gas bills 2. Verify gas bills in batch-process | Gas bills correctly retrieved via Account→GasBill query path | P1 | No (DB + Inngest logs) |
| TC-032 | Chunking works for >25 properties | 1. Count properties in a batch: verify some batches have >25 unique property IDs 2. Trigger pipeline | `chunkArray(propertyIDs, 25)` splits into multiple queries. All bills across all chunks returned — no data loss | P0 | No (Inngest logs) |
| TC-033 | Empty property list returns empty bills | 1. Verify the code handles `propertyIDs.length === 0` (early return) | `retrieveElectricPropertyBills([])` returns `[]` without querying DB | P2 | No (code review — confirmed in diff) |
| TC-034 | Bills with no TransactionMetadata / BillAdjustment / BillCredit | 1. Find bills with no associated metadata records 2. Trigger pipeline | `TransactionMetadata: []`, `BillAdjustment: []`, `BillCredit: []` — null-safe via `?? []` fallback in flatMap | P2 | No (DB + Inngest logs) |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-040 | `getAccountStatuses` returns correct Map for electric | `SELECT "id", "status", "isDelinquent" FROM "ElectricAccount" WHERE "id" IN (<sample IDs>)` — compare with what pipeline receives | Map entries match raw DB values: `{ status, isDelinquent }` for each ID | P0 |
| TC-041 | `getAccountStatuses` returns correct Map for gas | Same query for `GasAccount` | Map entries match raw DB values | P1 |
| TC-042 | Account statuses include all expected status types in dev | `SELECT DISTINCT "status" FROM "ElectricAccount" WHERE "maintainedFor" IS NOT NULL` | ACTIVE (414), INACTIVE (104), NEEDS_OFF_BOARDING (86), plus NEW, PENDING_FIRST_BILL, etc. — all handled by the filtering logic | P2 |
| TC-043 | Delinquent accounts exist in dev for testing | `SELECT COUNT(*) FROM "ElectricAccount" WHERE "isDelinquent" = true AND "maintainedFor" IS NOT NULL AND "status" = 'ACTIVE'` | At least 12 electric + 2 gas accounts available for delinquency testing | P2 |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | User with only electric accounts (no gas) | 1. Find user with electric accounts but no gas 2. Trigger pipeline | Gas status map has no entry for this user. `gasAccountID` is null → gas delinquency defaults to `false`. No error | P1 | No |
| TC-051 | User with only gas accounts (no electric) | 1. Find user with gas accounts but no electric 2. Trigger pipeline | Electric status map has no entry. `electricAccountID` is null → electric delinquency defaults to `false`. No error | P1 | No |
| TC-052 | Account ID not in pre-fetched map (data race) | 1. Consider: account created after pre-fetch but before map lookup 2. Review code path | `accountStatuses.electric.get(id)` returns `undefined` → `?.status` is `undefined` → `=== "INACTIVE"` is `false` → account IS included (safe default). For delinquency: `?.isDelinquent ?? false` → treated as not delinquent (safe default) | P2 | No (code review) |
| TC-053 | Large batch — 20 users × multiple properties × multiple accounts | 1. Trigger pipeline in dev (real data — ~400+ active billing accounts) 2. Monitor Inngest for any timeouts | All batches complete without statement timeout. This is the PRIMARY success metric for the fix | P0 | No (exploratory) |
| TC-054 | `hasMore` pagination returns undefined | 1. Review code: `hasMore = result?.hasMore ?? false` 2. Consider: what if Supabase returns `undefined` for pagination | `?? false` prevents infinite loop — pagination terminates cleanly | P2 | No (code review — confirmed in diff) |
| TC-055 | Exactly 25 properties in a batch (chunk boundary) | 1. Verify behavior at exact chunk size boundary | `chunkArray([...25 items], 25)` produces exactly 1 chunk — no off-by-one | P2 | No (code review) |
| TC-056 | 26 properties in a batch (chunk overflow by 1) | 1. Verify chunking splits correctly | `chunkArray([...26 items], 25)` produces 2 chunks: [25] + [1] — both queried, results merged | P2 | No (code review) |

### Error Handling Changes

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Batch-level failure behavior (removed per-account fallback) | 1. Review removed try/catch in `calculateReminderLogic` 2. Consider: what happens if `getAccountStatuses` throws | **Behavioral change**: Previously, individual status fetch failures were caught and the account was still included. Now, if `getAccountStatuses` throws, the entire batch fails and retries (3 retries configured on trigger). This is arguably better — a DB failure should retry, not silently include accounts with unknown status | P1 | No (code review) |
| TC-061 | Pipeline retries on transient DB error | 1. Verify Inngest retry config: `retries: 3` on trigger 2. If a batch fails, confirm it retries | Failed batches retry up to 3 times before marking as failed in Inngest | P2 | No (Inngest dashboard) |

### Performance Verification

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | No statement timeouts in dev pipeline run | 1. Trigger full pipeline 2. Monitor Inngest dashboard for all function runs 3. Check for any timeout errors | Zero timeout errors across all `trigger`, `batch-process`, and `batch` function runs | P0 | No (exploratory) |
| TC-071 | Query count reduction verified via logs | 1. Trigger pipeline 2. Check Inngest logs for query patterns | Expect ~2-3 bulk queries per batch (1 `getAccountStatuses` Electric + 1 Gas + chunked bill queries) instead of ~180-240 individual queries | P1 | No (Inngest logs) |
| TC-072 | Payment processor delinquency also uses bulk fetch | 1. Verify `payment-processor.ts` changes work in context 2. Check that delinquency recalculation after payment uses pre-fetched statuses | `PaymentProcessor` pre-fetches statuses before the delinquency loop — same pattern as reminders | P1 | No (code review + Inngest logs) |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Inngest dashboard | No observability into query counts or timing per batch — hard to verify the fix reduced queries without adding logging | Debugging timeout regressions requires code changes to add timing | Add structured logging: `logger.info("Fetched statuses", { electricCount: electricStatuses.size, gasCount: gasStatuses.size, durationMs })` for future monitoring |
| UX-002 | Error handling | Removed per-account try/catch means one bad account ID could fail an entire batch of 20 users | If `getAccountStatuses` throws for any reason, 20 users miss their reminders until retry succeeds | Consider: keep batch-level fetch but add validation that all expected IDs are in the returned Map, log warnings for missing IDs |
| UX-003 | `batch-process.ts` staleness gap | README notes 120s × batchNumber production sleep — statuses pre-fetched in `batch-process` could be stale by the time `batch.ts` acts | Account status change during sleep window could cause incorrect filtering | The PR partially addresses this (statuses now fetched in `batch.ts`, not `batch-process`) — verify this is the case for all status reads |

## Automation Plan

### Not Automatable (Inngest pipeline — no direct UI/API test surface)
All test cases in this plan are **exploratory / manual verification** via:
- Inngest dashboard (function runs, logs, timing)
- Supabase queries (data verification)
- Fastmail (email delivery verification)

### Future Automation Opportunities
- **API test**: If a health-check or status endpoint is added for the reminder pipeline, could write API tests
- **DB state verification**: Could write a Playwright API test that triggers the event, waits, then queries Supabase to verify expected reminder records were created
- **Smoke**: Add `ledger.payment.reminders` event trigger to CI smoke suite once we have a reliable assertion point

### Recommended Test Approach
1. **Phase 1 — Code Review** (TC-033, TC-052, TC-054, TC-055, TC-056, TC-060): Verify logical correctness from the diff — already partially done during triage
2. **Phase 2 — Dev Pipeline Run** (TC-001 through TC-005, TC-053, TC-070, TC-071): Trigger the pipeline in dev, monitor Inngest dashboard for successful completion with no timeouts
3. **Phase 3 — Data Verification** (TC-010 through TC-014, TC-020 through TC-023, TC-030 through TC-032, TC-040 through TC-043): Query Supabase before/after pipeline run to verify correct accounts were processed and bills were retrieved
4. **Phase 4 — Email Spot Check** (TC-004): If a test user has an overdue balance, verify the reminder email arrives via Fastmail

## Risks & Notes

1. **No existing automated coverage** — this is the first test plan for the ledger reminder pipeline. All verification is manual/exploratory
2. **Dev data dependency** — test effectiveness depends on having billing users with overdue balances, inactive accounts, and delinquent accounts in dev. Current dev data looks sufficient (414 active, 104 inactive, 12 delinquent electric billing accounts)
3. **Cron vs event** — in production this runs on cron (11 AM EST). In dev, it's event-triggered (`ledger.payment.reminders`). The fix applies to both trigger paths since it's in `batch-process` and `batch`, not `trigger`
4. **Error handling regression risk** — removed try/catch means a Supabase outage during `getAccountStatuses` will fail the entire batch instead of degrading gracefully. Retries (3x) mitigate this, but worth monitoring
5. **Production sleep delay** — `120_000 * batchNumber` ms sleep in production means batch 5 waits 10 minutes. Pre-fetched statuses are still fresh because they're fetched in `batch.ts` (after sleep), not in `batch-process.ts` (before sleep). **Verify this in testing**
6. **`chunkArray` utility** — imported from `@pg/utils/arrays`. Assumed to work correctly; not testing the utility itself

## Test Case Summary

| Category | Count | P0 | P1 | P2 |
|----------|-------|----|----|-----|
| Happy Path | 5 | 3 | 2 | 0 |
| Account Status Filtering | 5 | 3 | 2 | 0 |
| Delinquency Detection | 4 | 0 | 3 | 1 |
| Bill Data Integrity | 5 | 2 | 1 | 2 |
| Database Verification | 4 | 1 | 1 | 2 |
| Edge Cases | 7 | 1 | 2 | 4 |
| Error Handling | 2 | 0 | 1 | 1 |
| Performance | 3 | 1 | 2 | 0 |
| **Total** | **35** | **11** | **14** | **10** |
