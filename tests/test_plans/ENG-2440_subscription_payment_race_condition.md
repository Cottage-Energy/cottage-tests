# Test Plan: ENG-2440 — Subscriptions Update Payment Method Race Condition

## Overview
**Ticket**: [ENG-2440](https://linear.app/public-grid/issue/ENG-2440/task-subscriptions-update-payment-method-race-condition)
**Source**: [services#290](https://github.com/Cottage-Energy/services/pull/290) (merged 2026-03-17)
**Date**: 2026-03-18
**Tester**: Christian
**Created by**: Cian Laguesma

## Context

When a user updates their payment method while having pending `SubscriptionMetadata`, the Inngest function `subscription.payment.process` fires to attempt payment. If the user updates their payment method multiple times rapidly, the function fires in parallel per subscription, causing stale data reads and double payments.

### Fix Summary (PR #290)

| Mechanism | Implementation | Maps to |
|-----------|---------------|---------|
| **Per-subscription concurrency lock** | Inngest concurrency key: `{ limit: 1, key: "event.data.subscription.id" }` — queues events for the same subscription instead of running in parallel | AC1 |
| **5-day duplicate payment check** | New `hasActiveSubscriptionPayment()` in `LedgerPaymentRepository` — queries `Payment` table for non-failed, non-refunded payments within 5 days matching `contributions.renewableSubscriptionID` | AC2 |
| **Skip with reason** | Returns `{ status: "skip", reason: "active payment already exists" }` instead of creating duplicate | AC2 |
| **Failed/refunded bypass** | Query excludes `failed` and `refunded` from blocking statuses | AC3 |

### Duplicate Detection Query Logic
```
Payment table WHERE:
  contributions @> { renewableSubscriptionID: <subscriptionID> }
  AND (paymentStatus IS NULL OR paymentStatus NOT IN ('failed', 'refunded'))
  AND created_at >= now() - 5 days
  LIMIT 1
```

**Blocking statuses** (prevent new payment): `NULL`, `succeeded`, `processing`, `scheduled_for_payment`, `succeeded_but_unverified`, `canceled`
**Non-blocking statuses** (allow retry): `failed`, `refunded`

## Scope

### In Scope
- Duplicate payment prevention when updating payment method with pending subscriptions
- 5-day window boundary behavior
- Failed/refunded payment retry flow
- Per-subscription isolation (different subscriptions process independently)
- Normal payment method update flow (no regression)

### Out of Scope
- Inngest infrastructure concurrency queue internals (AC1 queue ordering, backpressure)
- Stripe payment processing outcomes
- Payment method validation / Stripe tokenization
- Subscription creation/cancellation flows

### Prerequisites
- User with active `Subscription` and pending `SubscriptionMetadata`
- Access to Supabase dev for DB state setup and verification
- Access to Inngest dashboard for function execution logs (AC1 verification)
- Existing auto-payment e2e flow working (regression baseline)

### Dependencies
- Inngest function deployment (services repo)
- Supabase `Payment` table
- Stripe payment method update API

## Test Cases

### Happy Path — Normal Payment Flow (Regression)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Single payment method update with pending subscription creates one payment | User has pending `SubscriptionMetadata`; no existing active payments for this subscription | 1. Sign in as test user 2. Navigate to payment settings 3. Add/update payment method 4. Wait for Inngest processing (~30s) 5. Query `Payment` table for subscription | Exactly 1 new `Payment` record created with correct `contributions.renewableSubscriptionID` | P0 | Yes |
| TC-002 | Payment method update with no pending subscription triggers no payment | User has no pending `SubscriptionMetadata` (all completed/canceled) | 1. Sign in as test user 2. Update payment method 3. Wait 30s 4. Query `Payment` table | No new `Payment` record created | P1 | Yes |
| TC-003 | Payment method update processes all pending metadata in single payment | User has 3 pending `SubscriptionMetadata` records for same subscription | 1. Insert 3 pending metadata records via DB 2. Update payment method from UI 3. Verify `Payment` table | Single `Payment` with `amount` = sum of all 3 pending metadata amounts | P1 | No |

### AC2: Duplicate Payment Detection (5-Day Window)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Skip payment when `succeeded` payment exists within 5 days | Insert `Payment` with `paymentStatus = 'succeeded'`, `created_at = now()`, matching `renewableSubscriptionID` in contributions | 1. Set up DB state 2. Update payment method from UI 3. Wait for Inngest 4. Query `Payment` table 5. Check Inngest logs | No new payment created; Inngest function returns `status: "skip"` | P0 | Yes |
| TC-011 | Skip payment when `processing` payment exists within 5 days | Insert `Payment` with `paymentStatus = 'processing'`, `created_at = now()` | Same as TC-010 | No new payment created; skip reason logged | P0 | Yes |
| TC-012 | Skip payment when `scheduled_for_payment` exists within 5 days | Insert `Payment` with `paymentStatus = 'scheduled_for_payment'`, `created_at = now()` | Same as TC-010 | No new payment created | P1 | No |
| TC-013 | Skip payment when `succeeded_but_unverified` exists within 5 days | Insert `Payment` with `paymentStatus = 'succeeded_but_unverified'`, `created_at = now()` | Same as TC-010 | No new payment created | P1 | No |
| TC-014 | Skip payment when `NULL` status payment exists within 5 days | Insert `Payment` with `paymentStatus = NULL`, `created_at = now()` | Same as TC-010 | No new payment created | P1 | No |
| TC-015 | Skip payment when `canceled` payment exists within 5 days | Insert `Payment` with `paymentStatus = 'canceled'`, `created_at = now()` | Same as TC-010 | No new payment created (canceled is NOT excluded by the query) | P2 | No |

### AC2: 5-Day Window Boundary

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Active payment at exactly 5 days ago blocks new payment | Insert `Payment` with `created_at = now() - 5 days` (on boundary), `paymentStatus = 'succeeded'` | 1. Set up DB state 2. Update payment method 3. Verify Payment table | No new payment created (within 5-day window) | P2 | No |
| TC-021 | Active payment older than 5 days does NOT block new payment | Insert `Payment` with `created_at = now() - 6 days`, `paymentStatus = 'succeeded'` | 1. Set up DB state 2. Update payment method 3. Verify Payment table | New payment IS created (outside window) | P1 | Yes |

### AC3: Failed/Refunded Payment Retry

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | New payment created when previous was `failed` within 5 days | Insert `Payment` with `paymentStatus = 'failed'`, `created_at = now()`, matching subscription | 1. Set up DB state 2. Update payment method 3. Wait for Inngest 4. Verify Payment table | New `Payment` record created (failed doesn't block) | P0 | Yes |
| TC-031 | New payment created when previous was `refunded` within 5 days | Insert `Payment` with `paymentStatus = 'refunded'`, `created_at = now()`, matching subscription | Same as TC-030 | New `Payment` record created (refunded doesn't block) | P0 | Yes |
| TC-032 | New payment after multiple failed attempts | Insert 3 `Payment` records all with `paymentStatus = 'failed'` within 5 days | 1. Set up DB state 2. Update payment method 3. Verify | New payment created; previous failures don't accumulate to block | P1 | No |

### AC1: Per-Subscription Concurrency / Rapid-Fire Prevention

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | Rapid payment method updates produce only one payment | User has pending subscription metadata | 1. Sign in 2. Update payment method 3. Immediately update again (different card) 4. Immediately update a third time 5. Wait 60s 6. Query `Payment` table | Only 1 `Payment` record created (concurrency key queues, duplicate check skips) | P0 | Exploratory |
| TC-041 | Different subscriptions process independently | User has 2 active subscriptions each with pending metadata | 1. Set up 2 subscriptions with pending metadata 2. Update payment method 3. Wait 60s 4. Query `Payment` table | 2 `Payment` records created — one per subscription | P1 | No |
| TC-042 | Verify Inngest concurrency key in function logs | Access to Inngest dashboard | 1. Trigger payment method update 2. Open Inngest dashboard 3. View `process-subscription-payment` function 4. Check concurrency config | Concurrency shows `limit: 1` per `event.data.subscription.id` | P1 | Exploratory |

### Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-050 | Mixed statuses: one failed + one succeeded for same subscription | Insert 2 `Payment` records: one `failed`, one `succeeded`, both within 5 days | 1. Set up DB state 2. Update payment method 3. Verify | No new payment (the `succeeded` one blocks, regardless of the `failed` one) | P1 | No |
| TC-051 | Active payment for different subscription doesn't block | Insert `Payment` for subscription A (succeeded); user also has pending metadata for subscription B | 1. Set up DB state 2. Update payment method 3. Verify | Payment created for subscription B; subscription A blocked correctly | P1 | No |
| TC-052 | Concurrent payment method update + subscription metadata insertion | Pending metadata inserted while payment processing is in flight | 1. Update payment method 2. While Inngest processes, insert new pending metadata 3. Verify | First batch processes; new metadata waits for next trigger | P2 | Exploratory |
| TC-053 | Payment method update with zero-amount pending metadata | Pending `SubscriptionMetadata` with `amount = 0` or `NULL` | 1. Set up DB state 2. Update payment method 3. Verify | Payment created with `amount = 0` or skipped (verify expected behavior) | P2 | Exploratory |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-060 | `hasActiveSubscriptionPayment` returns true for active payment | `SELECT * FROM "Payment" WHERE contributions @> '{"renewableSubscriptionID": <id>}' AND ("paymentStatus" IS NULL OR "paymentStatus" NOT IN ('failed', 'refunded')) AND created_at >= now() - interval '5 days'` | Returns 1+ rows when active payment exists | P0 |
| TC-061 | `hasActiveSubscriptionPayment` returns false for failed-only | Same query with only `failed` payments in window | Returns 0 rows | P0 |
| TC-062 | `contributions` JSONB contains correct `renewableSubscriptionID` | After payment method update → payment created, inspect `contributions` column | `contributions.renewableSubscriptionID` matches the subscription ID from `SubscriptionMetadata.subscriptionID` | P1 |
| TC-063 | `SubscriptionMetadata` status transitions after payment | Query metadata after payment processes | Pending metadata transitions to `completed`; amount and transactionID populated | P1 |

## Automation Plan

### Automatable (e2e — cottage-tests)
- **Smoke**: TC-001 (normal payment flow — regression baseline)
- **Regression**: TC-010, TC-011 (duplicate detection for common statuses), TC-021 (outside window allows payment), TC-030, TC-031 (failed/refunded retry)
- These require a DB setup helper to insert `Payment` records with specific statuses and timestamps

### Exploratory Only (manual)
- TC-040 (rapid-fire — timing-dependent, hard to make deterministic)
- TC-042 (Inngest dashboard verification)
- TC-052, TC-053 (timing edge cases)

### Unit/Integration Tests (services repo — recommend to dev team)
- AC1 concurrency key behavior (Inngest function config)
- `hasActiveSubscriptionPayment()` repository method — all status permutations
- 5-day boundary precision (dayjs subtract logic)
- `totalAmount` calculation from multiple pending metadata

## Test Data Requirements

| Data | Details |
|------|---------|
| Test user | Existing user with active subscription + pending `SubscriptionMetadata` |
| Payment records | Pre-inserted via Supabase with controlled `paymentStatus`, `created_at`, and `contributions` JSONB |
| Subscription | Active `Subscription` linked to user's property with `SubscriptionMetadata` in `pending` status |
| Payment method | Valid Stripe test card (4242...) or test bank account |

### DB Setup Pattern
```sql
-- 1. Find/create test subscription
SELECT s.id, s.status, sm.id as metadata_id, sm.status as meta_status, sm.amount
FROM "Subscription" s
JOIN "SubscriptionMetadata" sm ON sm."subscriptionID" = s.id
WHERE s."propertyID" = <test_property_id>
AND sm.status = 'pending';

-- 2. Insert blocking payment (for duplicate detection tests)
INSERT INTO "Payment" (id, "paidBy", "paymentStatus", "paymentMethodID", amount, contributions, created_at)
VALUES (
  uuid_generate_v4(),
  '<user_uuid>',
  'succeeded',  -- vary per test case
  'pm_test',
  1000,
  '{"renewableSubscriptionID": <subscription_id>}'::jsonb,
  now()  -- vary for boundary tests
);

-- 3. Verify after test
SELECT id, "paymentStatus", amount, contributions, created_at
FROM "Payment"
WHERE contributions @> '{"renewableSubscriptionID": <subscription_id>}'::jsonb
ORDER BY created_at DESC;
```

## Risks & Notes

1. **Inngest processing delay**: Payment processing is async (Inngest throttle: 5 per 30s). Tests must wait adequate time before DB verification — recommend 45-60s wait.
2. **`canceled` blocks new payments**: The query treats `canceled` as an active status (not excluded). Verify this is intentional — should a canceled payment within 5 days really prevent a retry?
3. **`refunded` not observed in dev**: No `Payment` records with `paymentStatus = 'refunded'` found in dev DB. TC-031 may need manual DB setup. Confirm `refunded` is a valid enum value.
4. **No `refunded` in known enum**: Known `paymentStatus` values are: `succeeded`, `canceled`, `processing`, `scheduled_for_payment`, `succeeded_but_unverified`, `failed`. The code references `refunded` but it may not exist yet — verify with dev team.
5. **Test isolation**: Pre-inserted `Payment` records must be cleaned up after tests to avoid polluting other test runs.
6. **Services repo unit tests**: Strongly recommend the dev team add unit tests for `hasActiveSubscriptionPayment()` covering all status permutations and boundary conditions — this is more reliable than e2e for the repository logic.
