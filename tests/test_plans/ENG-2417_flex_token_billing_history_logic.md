# Test Plan: Flex Create Account Token — Billing History Logic

## Overview
**Ticket**: [ENG-2417](https://linear.app/public-grid/issue/ENG-2417/task-flex-create-account-token-logic-for-users-w-bills-but-no)
**PR**: [cottage-nextjs#1104](https://github.com/Cottage-Energy/cottage-nextjs/pull/1104) (merged to dev 2026-03-17)
**Date**: 2026-03-17
**Tester**: Christian

## Summary
Frontend refactor to how `estimatedDueDate` is calculated in the Flex `generate-token` API payload. Previously, the fallback was always `electricAccount.startDate + 20 days`. Now uses a 3-tier priority based on billing history:

1. **Has bills** → most recent bill's `dueDate + 20 days` (falls back to `statementDate + 20 days` if `dueDate` is null)
2. **No bills, has startDate** → `electricAccount.startDate + 20 days` (existing behavior, unchanged)
3. **No bills, no startDate** → today's date (existing behavior, unchanged)

### Code Changes (5 files)
| File | Change |
|------|--------|
| `billing/queries/hooks.ts` | New `useGetMostRecentPropertyBill()` hook — filters bills by active property's electric+gas account IDs, sorts by `statementDate` desc |
| `flex/hooks/use-flex-checkout.ts` | Passes `mostRecentBill` to `mapToFlexPayload` |
| `flex/utils/map-to-flex-payload.ts` | New `getEstimatedDueDate()` function with 3-tier logic; replaces inline `startDate + 20` fallback |
| `account/page.tsx` | Prefetches all bills server-side (needed for the new hook) |
| `portal/components/header/user-dropdown.tsx` | Minor: `handleLogout` made async |

### Verification Method
**Network request interception** on the `generate-token` API call. Inspect the request payload for the `nearest_due_date` (or equivalent) field. The ticket explicitly states: "Check network logs for the generate-token API call."

## Scope

### In Scope
- All 3 `estimatedDueDate` calculation paths in the Flex token payload
- `useGetMostRecentPropertyBill` hook: filtering by active property, sorting by `statementDate`
- Account page bill prefetch (no regression on page load)
- Logout async change (no regression)

### Out of Scope
- Flex payment splitting logic (no changes)
- Backend `generate-token` endpoint logic (no changes — this is frontend payload construction only)
- Stripe/payment processing (no changes)
- Prior backend Flex due date changes (covered in `PR271_PR266_flex_due_date_and_connect_account.md`)

### Prerequisites
- Dev environment with PR #1104 deployed (merged 2026-03-17)
- Flex-enabled test users in different billing states (see Test Data section)
- Browser DevTools or Playwright network interception to inspect `generate-token` payload

## Test Data (Dev Environment)

| Scenario | User | Email | Bills | Latest dueDate | Latest statementDate | startDate | Balance |
|----------|------|-------|-------|----------------|---------------------|-----------|---------|
| AC2: Bills, balance=0 | `0082dbee...` | `pm+fef747f3...@joinpublicgrid.com` | 2 | 2026-01-03 | 2025-12-26 | 2025-11-22 | 0 |
| AC2: Bills, balance=null | `0029e64a...` | `pgtest+burdette...@joinpublicgrid.com` | 3 | 2025-08-07 | 2025-07-22 | 2025-07-23 | N/A |
| AC2 fallback: Bills w/ NULL dueDate | **None found in dev** | — | — | — | — | — | — |
| AC3: No bills, has startDate | `62fd597a...` | `cian+testwithflexonboarding@onepublicgrid.com` | 0 | — | — | 2026-02-18 | — |
| AC3: No bills, has startDate | `0084f2b5...` | `pgtest+malvina...@joinpublicgrid.com` | 0 | — | — | 2025-06-05 | — |
| AC1: Outstanding balance | `7c2387ee...` | `cian+testwithflexoutstanding5@onepublicgrid.com` | 1 | 2026-02-20 | 2026-02-20 | 2026-02-19 | TBD |

**Note**: No Flex users in dev have bills with NULL `dueDate`. AC2 fallback to `statementDate` cannot be verified with existing data — may need to NULL out a `dueDate` via Supabase for testing, or mark as exploratory.

## Test Cases

### Happy Path — Acceptance Criteria

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-001 | AC1: Outstanding balance > 0 sends actual balance + nearestDueDate | Flex user with `totalDue > 0` and bills | 1. Log in as Flex user with outstanding balance 2. Navigate to Account page 3. Intercept `generate-token` network request 4. Check payload | `nearest_due_date` = actual bill due date (NOT estimated). `amount` = actual outstanding balance | P0 | Regression |
| TC-002 | AC2: Zero balance with bills uses most recent bill dueDate + 20 days | Flex user with `totalDue <= 0`, has bills with `dueDate` populated | 1. Log in as Flex user with zero balance but billing history 2. Navigate to Account page 3. Intercept `generate-token` request 4. Check `nearest_due_date` in payload | `nearest_due_date` = most recent bill's `dueDate` + 20 days (formatted `YYYY-MM-DD`) | P0 | Smoke |
| TC-003 | AC2 fallback: Zero balance, bills with NULL dueDate uses statementDate + 20 | Flex user with bills where `dueDate` IS NULL | 1. Set a test bill's `dueDate` to NULL via Supabase (if needed) 2. Log in 3. Navigate to Account page 4. Intercept `generate-token` request | `nearest_due_date` = most recent bill's `statementDate` + 20 days | P0 | Edge Case |
| TC-004 | AC3: No billing history uses startDate + 20 days | Flex user with 0 bills, `electricAccount.startDate` populated | 1. Log in as Flex user with no bills 2. Navigate to Account page 3. Intercept `generate-token` request | `nearest_due_date` = `electricAccount.startDate` + 20 days | P1 | Regression |
| TC-005 | AC3 fallback: No bills and no startDate uses today's date | Flex user with 0 bills and NULL `startDate` | 1. NULL out test user's `startDate` via Supabase (if needed) 2. Log in 3. Navigate to Account page 4. Intercept `generate-token` request | `nearest_due_date` = today's date (`YYYY-MM-DD`) | P1 | Edge Case |

### Bill Selection Logic — `useGetMostRecentPropertyBill`

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-006 | Most recent bill selected by statementDate (not dueDate or createdAt) | Flex user with multiple bills, different `statementDate` values | 1. Verify user has multiple bills in DB 2. Log in, navigate to Account page 3. Intercept `generate-token` 4. Calculate expected date from bill with latest `statementDate` | `nearest_due_date` is derived from the bill with the most recent `statementDate` | P1 | Regression |
| TC-007 | Bills filtered by active property's accounts only | Flex user with multiple properties (if applicable) | 1. Verify user has bills across multiple accounts 2. Log in 3. Check that only bills matching active property's `electricAccount.id` or `gasAccount.id` are considered | Token payload uses bill from active property, not other properties | P2 | Edge Case |
| TC-008 | Gas bills included in selection | Flex user with gas account and gas bills | 1. Find/create user with gas bills 2. Log in 3. Intercept `generate-token` 4. Verify gas bill can be selected as most recent | If gas bill has most recent `statementDate`, it is used for estimated due date | P2 | Edge Case |

### Network Payload Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-009 | generate-token API call contains correct date format | Any Flex user | 1. Log in 2. Navigate to Account page 3. Intercept `generate-token` request 4. Inspect date format | `nearest_due_date` is in `YYYY-MM-DD` format (not ISO timestamp) | P1 | Smoke |
| TC-010 | generate-token payload includes all expected fields | Any Flex user | 1. Intercept `generate-token` request 2. Verify payload structure | Payload includes: `first_name`, `last_name`, `nearest_due_date`, address fields, utility info. No undefined/null for required fields | P1 | Regression |

### Account Page — Prefetch Regression

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-011 | Account page loads without error after bills prefetch | Any logged-in user | 1. Log in 2. Navigate to Account page 3. Check browser console for errors | Page loads successfully. No errors related to `fetchAllBillsServer` or bill queries | P0 | Regression |
| TC-012 | Account page load time not significantly degraded | Any logged-in user | 1. Navigate to Account page 2. Observe load time 3. Check network waterfall | Page loads within acceptable time. Bills prefetch does not block render | P2 | Regression |

### Logout Regression

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-013 | Logout still works after async change | Any logged-in user | 1. Log in 2. Click profile dropdown 3. Click "Sign out" | User is logged out, redirected to `/sign-in`. PostHog reset is called before redirect | P1 | Regression |

### Negative / Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-014 | Non-Flex user does not trigger generate-token | Non-Flex user (`isFlexCustomer = false`) | 1. Log in as non-Flex user 2. Navigate to Account page 3. Monitor network requests | No `generate-token` API call is made | P2 | Regression |
| TC-015 | User with only 1 bill — that bill is used | Flex user with exactly 1 bill | 1. Log in 2. Intercept `generate-token` 3. Verify date calculation | `nearest_due_date` = that bill's `dueDate` + 20 days | P2 | Regression |
| TC-016 | Bill with future dueDate — still adds 20 days | Flex user with a bill where `dueDate` is in the future | 1. Log in 2. Intercept `generate-token` | `nearest_due_date` = future `dueDate` + 20 days (could be far in the future — no cap) | P2 | Edge Case |
| TC-017 | Bill with very old dueDate — still adds 20 days | Flex user with bills only from 6+ months ago | 1. Log in 2. Intercept `generate-token` | `nearest_due_date` = old `dueDate` + 20 days (could be in the past — no floor to today) | P2 | Edge Case |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-018 | Verify test user billing state matches AC2 | `SELECT eb."dueDate", eb."statementDate", eb."totalAmountDue" FROM "ElectricBill" eb WHERE eb."electricAccountID" = {eaId} ORDER BY eb."statementDate" DESC` | Bills exist with expected `dueDate`/`statementDate` values for test user | P1 |
| TC-019 | Verify test user has zero outstanding balance | `SELECT ea."totalOutstandingBalance" FROM "ElectricAccount" ea WHERE ea.id = {eaId}` | `totalOutstandingBalance` = 0 or NULL for AC2/AC3 test users | P1 |
| TC-020 | Verify Flex-enabled flag | `SELECT "isFlexCustomer" FROM "CottageUsers" WHERE id = '{userId}'` | `isFlexCustomer` = true for all test users | P1 |

## Automation Plan

- **Smoke**: TC-002 (primary AC2 path), TC-009 (date format)
- **Regression**: TC-001, TC-004, TC-006, TC-010, TC-011, TC-013
- **Exploratory only**: TC-003 (requires DB manipulation for NULL dueDate), TC-005 (requires NULL startDate), TC-007, TC-008, TC-012, TC-016, TC-017
- **Automate?**: TC-001 through TC-006 are automatable via Playwright network interception (`page.route` / `page.waitForRequest`). TC-011 and TC-013 are straightforward UI tests.

### Network Interception Pattern (for automation)
```typescript
// Intercept the generate-token API call
const tokenRequest = page.waitForRequest(req =>
  req.url().includes('generate-token') && req.method() === 'POST'
);
// Trigger the Flex checkout flow
// ...
const request = await tokenRequest;
const payload = request.postDataJSON();
expect(payload.nearest_due_date).toBe(expectedDate);
```

## Risks & Notes

1. **No NULL dueDate test data in dev**: All existing Flex user bills have `dueDate` populated. Testing the `statementDate` fallback (AC2 fallback in TC-003) will require either:
   - Manually NULLing a bill's `dueDate` via Supabase
   - Finding/creating appropriate test data
   - Accepting code review as sufficient (the logic is straightforward: `dueDate ?? statementDate`)

2. **Balance determination is frontend-side**: The `totalDue` used to decide which path is taken comes from `getPropertyBalancesOptions`, not directly from `ElectricAccount.totalOutstandingBalance`. Need to confirm how the frontend `balances` object maps to the AC conditions.

3. **`mostRecentBill` could be null even with bills**: If no bills match the active property's account IDs (e.g., bills exist but for a different property), the hook returns `null` and falls through to startDate logic.

4. **Prior test plan overlap**: The earlier `PR271_PR266_flex_due_date_and_connect_account.md` covered the **backend** Flex due date changes (TC-001–TC-005 there). This plan covers the **frontend** token payload construction, which is the complementary piece.

5. **Logout change is low risk**: The `handleLogout` async change just ensures `logout()` completes before `posthog.reset()` runs. Regression risk is minimal but worth a quick check.

## Verification Queries

```sql
-- Find most recent bill for a user's electric account
SELECT eb.id, eb."dueDate", eb."statementDate", eb."totalAmountDue"
FROM "ElectricBill" eb
WHERE eb."electricAccountID" = (
  SELECT ea.id FROM "ElectricAccount" ea WHERE ea."cottageUserID" = '<userId>'
)
ORDER BY eb."statementDate" DESC
LIMIT 5;

-- Check if user has gas account + gas bills
SELECT ga.id as "gasAccountId",
  (SELECT COUNT(*) FROM "GasBill" gb WHERE gb."gasAccountID" = ga.id) as gas_bill_count
FROM "GasAccount" ga
WHERE ga."cottageUserID" = '<userId>';

-- Verify Flex status + outstanding balance
SELECT cu."isFlexCustomer", ea."totalOutstandingBalance", ea."startDate"
FROM "CottageUsers" cu
JOIN "ElectricAccount" ea ON ea."cottageUserID" = cu.id
WHERE cu.id = '<userId>';
```

## Execution Plan

### Phase 1: Network Verification (Primary)
1. Log in as AC2 user (bills, zero balance) → intercept `generate-token` → verify TC-002
2. Log in as AC3 user (no bills) → intercept `generate-token` → verify TC-004
3. Log in as AC1 user (outstanding balance) → intercept `generate-token` → verify TC-001
4. Verify date format in all payloads → TC-009

### Phase 2: Edge Cases (Exploratory)
5. Attempt TC-003 (NULL dueDate) — modify test data if needed
6. Verify bill sorting with multi-bill user → TC-006
7. Check non-Flex user → TC-014

### Phase 3: Regression
8. Account page load → TC-011
9. Logout flow → TC-013
10. Run existing payment tests: `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/payment/ --project=Chromium`
