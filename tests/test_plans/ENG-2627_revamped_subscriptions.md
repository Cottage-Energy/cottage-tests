# Test Plan: Revamped Subscriptions

## Overview
**Ticket**: ENG-2627
**Source**: Linear ticket, cottage-nextjs PR #1176, services PR #383, Supabase schema analysis
**Date**: 2026-04-08
**Tester**: Christian

## Summary
The subscription system is being revamped to support multiple subscription records per user/property (immutable history). Instead of mutating a single Subscription row on cancel/re-subscribe, the system now:
- **Cancel**: sets `endDate` on the current subscription, status → `canceled`
- **Re-subscribe**: inserts a new Subscription row (new ID, new `startDate`, `endDate = null`)
- **Constraint**: unique partial index `idx_subscription_property_active` enforces max one active subscription per property

Additionally:
- Payment `contributions` migrated from object `{renewableSubscriptionID, amount}` to array `[{renewableSubscriptionID, amount}]`
- Impact calculations now aggregate across all subscription periods (gap-aware)
- 2 new email templates: payment method reminder (at generation time) and payment method missing (at payment time)
- Billing page Payments tab now visible for ALL users (not just billing customers)
- FE always calls `create-subscription` (POST) — the old `PUT /api/subscriptions/subscribe` route is deleted

## PRs
| PR | Repo | Status | Key Changes |
|----|------|--------|-------------|
| #1176 | cottage-nextjs | Merged → dev | FE: new fetcher, impact calc refactor, activate mutation simplification, Payments tab for all |
| #383 | services | Merged → dev | BE: contributions array, multi-period impact in emails, 2 new email templates, new repo methods |

## DB Changes
| Change | Detail |
|--------|--------|
| New unique partial index | `idx_subscription_property_active ON Subscription(propertyID) WHERE status = 'active'` |
| Contributions migration | `UPDATE Payment SET contributions = jsonb_build_array(contributions) WHERE jsonb_typeof(contributions) = 'object' AND contributions ? 'renewableSubscriptionID'` |
| Subscription status enum | `pending`, `active`, `canceled` (unchanged) |

## Current Dev State
| Property | User | Sub IDs | Pattern |
|----------|------|---------|---------|
| 21135 | `cian+4apr7@onepublicgrid.com` | 754 (canceled, Feb 8 → Mar 7) + 755 (active, Mar 7 →) | Cancel + re-subscribe ✓ |
| 20164 | `butch+connect013@onepublicgrid.com` | 757 (active, Apr 8 →) | Single active |
| 21375 | `cian+apr8@onepublicgrid.com` | 756 (active, Apr 8 →) | Single active |

**Migration status**: 1 Payment still in object format (sub 754) — migration may not have run yet in dev.

## Scope

### In Scope
- Subscription lifecycle: subscribe via move-in, cancel, re-subscribe (new row creation)
- Active subscription display (account page, overview sidebar)
- Inactive/canceled subscription display and re-activation flow
- Impact calculations aggregating across multiple subscription periods
- Payments table showing all subscription payments across all subscription entries
- Billing page Payments tab visibility for non-billing users
- Contributions format handling (array + legacy object backward compat)
- Email templates: renewal reminder, payment method reminder, payment method missing
- DB constraint enforcement (one active sub per property)
- Cancel flow: endDate set, pending metadata voided

### Out of Scope
- Stripe webhook handlers (AC20 states these are unchanged)
- Transaction generation cron internals (AC19 — verify it still works, don't test cron logic)
- Subscription payment Stripe flow internals (unchanged per AC20)
- Production data migration execution

### Prerequisites
- Dev environment deployed with PR #1176 + PR #383 merged
- Test users with: active subscription, canceled subscription, cancel+re-subscribe history, no payment method
- `offerRenewableEnergy = true` on test building (`autotest`)

### Dependencies
- Inngest `trigger-transaction-generation` + `trigger-subscriptions-payment` for email verification (AC14-17)
- Inngest `balance-ledger-batch` (cron) for subscription payment capture
- Stripe test mode for payment method scenarios

---

## Test Cases

### Subscription Lifecycle (AC1-AC4)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Subscribe via move-in flow | Building with `offerRenewableEnergy=true` | 1. Start move-in at `/move-in?shortCode=autotest` 2. Complete flow with RE toggle ON 3. Complete registration | Active subscription created with `startDate = today`, `endDate = null`, status = `active`. New ledger balance created. | P0 | Yes |
| TC-002 | Cancel subscription from account page | User with active subscription | 1. Sign in 2. Go to `/app/account` 3. Click manage subscription 4. Cancel subscription | Subscription status = `canceled`, `endDate` set to most recent successful billing date (or `startDate` if no billing). Pending SubscriptionMetadata voided. | P0 | Yes |
| TC-003 | Re-subscribe after cancel (new row) | User with canceled subscription | 1. Sign in 2. Go to `/app/account` 3. See inactive subscription state 4. Click "Go Green" / reactivate 5. Confirm | NEW Subscription row created (different ID). New `startDate`, `endDate = null`, status = `active`. Old canceled row untouched. | P0 | Yes |
| TC-004 | Cancel then re-subscribe — verify old record preserved | User who just did TC-003 | 1. Query DB for all subscriptions on property | Old subscription: same ID, same `startDate`, `endDate` set, status = `canceled`. New subscription: new ID, new `startDate`, `endDate = null`, status = `active`. | P0 | Yes (DB assertion) |
| TC-005 | Unique constraint: only one active sub per property | Property with active subscription | 1. Attempt to insert a second active subscription via direct DB insert | DB should reject with unique constraint violation on `idx_subscription_property_active` | P1 | Yes (DB test) |
| TC-006 | Re-subscribe while already active (auto-cancel first) | User with active subscription | 1. Sign in 2. Trigger reactivate flow (e.g., from overview "Go Green" card while already subscribed) | Existing active sub should be canceled first, then new sub created. Only one active sub at end. | P1 | Exploratory |
| TC-007 | Subscribe via move-in — no RE toggle (offerRenewableEnergy=false) | Building with `offerRenewableEnergy=false` | 1. Complete move-in flow | No subscription created. User sees inactive/recommended state on account page. | P2 | Yes |

### Querying & Display (AC5-AC7)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Active subscription display on account page | User with active subscription | 1. Sign in 2. Go to `/app/account` | Active subscription card shown with: status, monthly fee ($3.29/mo), next billing date, impact stats. Manage/cancel options available. | P0 | Yes |
| TC-011 | Inactive subscription display on account page | User with canceled subscription, no active sub | 1. Sign in 2. Go to `/app/account` | Inactive subscription state shown. "Go Green" reactivation option visible. | P0 | Yes |
| TC-012 | Overview sidebar — active subscription renewable card | User with active subscription | 1. Sign in 2. Go to `/app/overview` | Renewable energy card shows impact stats (kWh, CO2, trees, miles). | P1 | Yes |
| TC-013 | Overview sidebar — no subscription, recommended card | User without subscription | 1. Sign in 2. Go to `/app/overview` | "Upgrade to 100% renewable energy" recommended card shown with price. | P1 | Yes |
| TC-014 | Subscription payments in account payments table | User with cancel→re-subscribe history (property 21135) | 1. Sign in 2. Go to `/app/account` 3. View payments | Payments from ALL subscription entries shown (both old canceled sub and new active sub). Unified list. | P0 | Yes |
| TC-015 | Billing page payments tab visible for non-billing users | Non-billing user with subscription | 1. Sign in 2. Go to `/app/billing` | "Payments" tab visible alongside "Bill History". Shows subscription payments. | P1 | Yes |
| TC-016 | Billing page payments tab shows all subscription payments | User with multiple subscription entries | 1. Sign in 2. Go to `/app/billing` 3. Click "Payments" tab | All subscription payments across all subscription entries shown. | P1 | Yes |

### Usage & Impact Calculations (AC8-AC10)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Impact aggregated across subscription periods (billing user) | Billing user with cancel→re-subscribe history and electric bills | 1. Sign in 2. Go to `/app/account` | Impact shows aggregated kWh from bills within ALL subscription periods (Jan-Mar + Jun-present). Gap months excluded. | P1 | Exploratory |
| TC-021 | Impact aggregated across subscription periods (non-billing user) | Non-billing user with cancel→re-subscribe history | 1. Sign in 2. Go to `/app/account` | Impact uses estimated allocation (500 kWh/mo default) for months within subscription periods only. Gap months excluded. | P1 | Exploratory |
| TC-022 | Impact with single subscription period | User with only one subscription (never canceled) | 1. Sign in 2. Check impact on account page | Impact calculated from subscription startDate to now. Same as before revamp. | P2 | Yes |
| TC-023 | Impact with no subscription | User with no active or historical subscriptions | 1. Sign in 2. Check account page | Impact shows 0 for all metrics (kWh, CO2, trees, miles). | P2 | Yes |

### Contributions Format (AC11-AC13)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | New subscription payments use array contributions | Active subscription, trigger payment | 1. Trigger `trigger-transaction-generation` 2. Wait for `trigger-subscriptions-payment` 3. Check Payment record | `contributions` is array: `[{renewableSubscriptionID: X, amount: Y}]` | P0 | Yes (DB verification) |
| TC-031 | Legacy object contributions display correctly | Payment with old object format (sub 754 in dev) | 1. Sign in as user with old payment 2. View payments on account or billing page | Payment displays correctly with type "Subscription" even though contributions is object format. | P1 | Yes |
| TC-032 | Contributions migration — object → array | DB has object-format contributions | 1. Run migration SQL 2. Query Payment | All `{renewableSubscriptionID, amount}` objects converted to `[{renewableSubscriptionID, amount}]` arrays. | P1 | DB verification |
| TC-033 | getPaymentType handles array subscription contributions | Payment with array contributions | 1. Check payment type classification | Returns "Subscription" when contributions array contains `renewableSubscriptionID`. | P2 | Covered by TC-014/TC-016 |
| TC-034 | getPaymentType handles array bill contributions | Payment with array contributions containing `chargeAccountID` | 1. Check payment type classification | Returns "Bill" correctly. | P2 | Covered by existing tests |

### Emails (AC14-AC18)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | Renewal reminder — billing user with payment method | Billing user, active subscription, has payment method | 1. Trigger `trigger-transaction-generation` 2. Check email | Email with: upcoming charge amount, payment method (brand + last4), actual kWh offset "since starting your subscription on {earliestStartDate}" aggregated across all periods. | P1 | Exploratory |
| TC-041 | Renewal reminder — non-billing user with payment method | Non-billing user, active subscription, has payment method | 1. Trigger `trigger-transaction-generation` 2. Check email | Same as TC-040 but offset text says "estimated" and notes "based on similar homes in your area." Uses allocation-based calculation. | P1 | Exploratory |
| TC-042 | Payment method reminder — no payment method at generation | User with no payment method, active subscription | 1. Trigger `trigger-transaction-generation` 2. Check email | Subject: "Keep your clean energy subscription active". Body: "You've got a charge coming up" + charge amount + charge date + "Add Payment Method" CTA → `/app/account?tabValue=paymentMethod`. | P1 | Exploratory |
| TC-043 | Payment method missing — no payment method at payment time | User with no payment method, pending subscription metadata | 1. Trigger `trigger-subscriptions-payment` 2. Check email | Subject: "We couldn't process your clean energy payment". Body: "Your payment didn't go through" + amount + date + "Update Payment Method" CTA. Subscription stays active. | P1 | Exploratory |
| TC-044 | Renewal reminder uses earliest startDate across all subs | User with cancel→re-subscribe, payment method | 1. Trigger generation 2. Check email startDate | Email says "Since starting your subscription on {earliestStartDate}" — uses first subscription's startDate, not current subscription's. | P2 | Exploratory |
| TC-045 | Payment success/failure emails unchanged | User with subscription payment | 1. Process a subscription payment 2. Check success email | Standard payment success/failure emails — no change from before. | P2 | Exploratory |

### Negative Tests

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-050 | Cancel already-canceled subscription | User with canceled subscription | 1. Attempt to cancel via API/UI | Should not error. No-op or graceful message. | P2 | Exploratory |
| TC-051 | Re-subscribe without payment method | User with canceled sub, no payment method | 1. Sign in 2. Try to reactivate subscription | Should show payment method entry sheet first, then activate after payment method added. | P1 | Yes |
| TC-052 | Rapid payment method change with pending subscription | User with pending subscription metadata | 1. Change payment method rapidly 2. Check for double payment | AC22: No double payment triggered. Only one payment processes. | P1 | Exploratory |
| TC-053 | Create subscription fails — cancel step fails | Simulate: existing active sub, cancel endpoint returns error | 1. Trigger create-subscription when cancel fails | Returns 500 error "Failed to cancel existing subscription before creating new one". No orphaned state. | P2 | Exploratory |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-060 | Unique partial index exists | `SELECT indexdef FROM pg_indexes WHERE indexname = 'idx_subscription_property_active'` | Index exists: `CREATE UNIQUE INDEX ... ON Subscription(propertyID) WHERE status = 'active'` | P0 |
| TC-061 | Cancel sets endDate correctly | Query canceled subscription's `endDate` | `endDate` = most recent successful billing date, or `startDate` if no billing | P1 |
| TC-062 | New subscription gets new ledger balance | Query new subscription after re-subscribe | `ledgerBalanceID` is populated and different from old subscription's | P1 |
| TC-063 | Pending metadata canceled on cancel | Query `SubscriptionMetadata` for canceled subscription | All pending metadata has status = `canceled` (enum has no `voided` — only `pending`/`completed`/`canceled`). Already-completed metadata stays `completed`. | P1 |
| TC-064 | Contributions migration completeness | `SELECT count(*) FROM Payment WHERE jsonb_typeof(contributions) = 'object' AND contributions ? 'renewableSubscriptionID'` | Count = 0 (all migrated to array) | P1 |
| TC-065 | Old canceled subscriptions retain NULL endDate (pre-revamp) | Query old canceled subs | Old canceled subs (pre-revamp) may have NULL endDate — this is expected historical data. New cancels should always set endDate. | P3 |

### No Regression (AC19-AC21)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-070 | Transaction generation picks up only active subscriptions | Active + canceled subscriptions exist | 1. Trigger `trigger-transaction-generation` 2. Check SubscriptionMetadata | Metadata created only for active subscriptions. Canceled subs ignored. | P1 | Exploratory |
| TC-071 | Subscription payment processing works end-to-end | Active subscription with pending metadata | 1. Trigger `trigger-subscriptions-payment` 2. Verify Stripe charge + Payment record | Payment created with array contributions, Stripe charge succeeds, payment status updates correctly. | P1 | Exploratory |
| TC-072 | Cancel flow voids pending metadata | Active subscription with pending metadata | 1. Cancel subscription 2. Check metadata | All pending SubscriptionMetadata for that subscription voided. | P1 | Exploratory |
| TC-073 | Existing move-in flow still creates subscription | Standard move-in with RE toggle | 1. Complete move-in flow with RE enabled | Subscription created as before — no regression in onboarding. | P0 | Yes (existing tests) |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Account page — canceled subscription | When a user cancels and has historical subscription data, they lose visibility of their past impact stats until they re-subscribe | Users may feel their past contributions are lost, reducing re-subscription motivation | Show "Your past impact" summary on the inactive subscription card — aggregated stats from canceled periods |
| UX-002 | Billing page — non-billing user Payments tab | The Payments tab is now visible for non-billing users (good), but if they have zero payments it shows an empty state | Users might be confused by an empty Payments tab they haven't seen before | Consider hiding the Payments tab if `paymentCount === 0`, or show an informative empty state message |
| UX-003 | Email — "We couldn't process your clean energy payment" | The email says "Your subscription will stay active while you get this sorted" which is reassuring, but doesn't say how long they have | Users may delay updating payment method indefinitely | Add a soft deadline: "Please update within X days to avoid interruption" |
| UX-004 | Re-subscribe flow | The reactivation flow goes through a "Ready to Go Green?" modal, but doesn't show what the user previously had (their past impact, how long they were subscribed) | Missed opportunity to reinforce the value of re-subscribing | Show brief impact recap in the reactivation modal: "You previously offset X kWh over Y months" |
| UX-005 | Cancel flow — endDate communication | The cancel confirmation doesn't clearly explain when the subscription actually ends (endDate = last successful billing date vs. immediately) | Users may be confused about whether they lose coverage immediately or at period end | Clarify in cancel confirmation: "Your subscription will remain active until {endDate}" |

---

## Automation Plan

### Smoke (P0)
- TC-001 (subscribe via move-in), TC-002 (cancel), TC-003 (re-subscribe), TC-010 (active display), TC-060 (DB constraint)

### Regression
- TC-004, TC-005, TC-007, TC-011-TC-016, TC-022-TC-023, TC-030-TC-031, TC-051, TC-061-TC-064, TC-073

### Exploratory Only
- TC-006 (re-subscribe while active — edge case)
- TC-020-TC-021 (impact aggregation across periods — need specific test data)
- TC-040-TC-045 (email verification — requires Inngest triggers + Fastmail)
- TC-050, TC-052, TC-053 (negative edge cases)
- TC-070-TC-072 (Inngest pipeline regression)

---

## Test Data Requirements

| Need | How to Set Up |
|------|---------------|
| User with active subscription | Use existing: `cian+apr8@onepublicgrid.com` (property 21375, sub 756) |
| User with cancel→re-subscribe history | Use existing: `cian+4apr7@onepublicgrid.com` (property 21135, subs 754+755) |
| User with no payment method + active sub | Create via move-in, then remove payment method in Stripe dashboard |
| User with no subscription | Any user who completed move-in without RE toggle |
| Non-billing user with subscription | Need to create: move-in on building with `maintainedFor IS NULL` + RE toggle on |
| Legacy object-format payment | Existing: 1 Payment record for sub 754 still in object format |

## Risks & Notes
- **Migration timing**: The contributions migration SQL should NOT run if subscription payments are pending (per Cian's comment). Need to coordinate timing.
- **Inngest email testing**: Email templates (AC14-17) require triggering Inngest events and checking Fastmail — inherently async and timing-dependent.
- **No existing e2e test coverage for subscriptions**: This is the first subscription-focused test suite. Need new POMs for subscription management (cancel modal, reactivation modal, impact stats).
- **endDate logic**: AC2 says endDate = "most recent successful billing date (or startDate if no successful billing)". Need to verify this is implemented correctly in the cancel endpoint (services repo).
- **1 legacy Payment record**: Sub 754 still has object-format contributions in dev. Verify the migration runs, and verify FE handles both formats correctly before/after.
