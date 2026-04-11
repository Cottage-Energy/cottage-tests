# Payment System — Complete Reference

> Last updated: 2026-04-11
> Author: Christian (QA)
> Source: Codebase analysis + Brennan's expected state reference (`payment_system_ledger_flows.md`)

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Blnk Ledger](#blnk-ledger)
5. [Bill Payment Pipeline](#bill-payment-pipeline)
6. [Bill Adjustments & Credits](#bill-adjustments--credits)
7. [Auto-Payment Flow](#auto-payment-flow)
8. [Manual Payment Flow](#manual-payment-flow)
9. [Card Capture](#card-capture)
10. [Successful Bill Payment](#successful-bill-payment)
11. [Failed Bill Payment](#failed-bill-payment)
12. [Subscription Payment Pipeline](#subscription-payment-pipeline)
13. [Flex Payment](#flex-payment)
14. [Payment Reminders & Offboarding](#payment-reminders--offboarding)
15. [Remittance System](#remittance-system)
16. [Stripe Integration](#stripe-integration)
17. [Fee Structure](#fee-structure)
18. [Frontend Payment Flows](#frontend-payment-flows)
19. [PG-Admin Payment Features](#pg-admin-payment-features)
20. [Test Data & Recipes](#test-data--recipes)
21. [Key Constants](#key-constants)
22. [Known Behaviors & Edge Cases](#known-behaviors--edge-cases)
23. [Complete BLNK Transaction Catalog](#complete-blnk-transaction-catalog)

---

## System Overview

The Cottage/Public Grid payment system handles two domains:

1. **Utility bill payments** — Users pay their electric/gas bills through PG, which then remits to utilities
2. **Subscription payments** — Monthly renewable energy subscription ($3.29/mo)

The system spans 4 repos:

| Repo | Role |
|------|------|
| `cottage-nextjs` | Frontend — pay bill modal, payment method management, billing pages, Stripe Elements |
| `services` | Backend — Inngest payment pipeline, Stripe webhooks, ledger processing, reminders |
| `automations` | Remittance execution — Playwright bots pay utility websites, reconciliation |
| `pg-admin` | Admin control plane — remittance management, refunds, bill inbox, manual triggers |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER-FACING (cottage-nextjs)                  │
│                                                                         │
│  Move-In Payment Setup ──► Overview/Billing Page ──► Pay Bill Modal     │
│       (SetupIntent)           (balance display)     (PaymentIntent)     │
│                                                                         │
│  Account Page ──► Payment Method Form ──► Stripe Elements               │
│                    (SetupIntent)          (PaymentElement)               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    POST /api/payments/manual
                    POST /api/stripe/setup-intent
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                           BACKEND (services)                            │
│                                                                         │
│  Inngest Functions:                                                     │
│  ┌─────────────────────┐   ┌──────────────────────┐                    │
│  │ balance-ledger-batch │   │ trigger-transaction-  │                   │
│  │ (cron: */5 dev,     │   │ generation            │                   │
│  │  every 3h prod)     │   │ (cron: 1PM ET prod,   │                   │
│  │       │             │   │  event: dev)           │                   │
│  │       ▼             │   │       │                │                   │
│  │ balance-ledger-     │   │       ▼                │                   │
│  │ application         │   │ batch-process-sub-     │                   │
│  │  (process bills,    │   │ transactions           │                   │
│  │   auto-pay)         │   │       │                │                   │
│  └─────────┬───────────┘   │       ▼                │                   │
│            │               │ process-subscription-  │                   │
│            │               │ transaction            │                   │
│            │               └──────────┬─────────────┘                   │
│            ▼                          ▼                                  │
│  ┌─────────────────────┐   ┌──────────────────────┐                    │
│  │ stripe-payment-     │   │ trigger-subscriptions- │                   │
│  │ capture-batch       │   │ payment               │                   │
│  │ (cron: */5 dev,     │   │ (cron: 3PM ET prod,   │                   │
│  │  hourly prod)       │   │  event: dev)           │                   │
│  └─────────┬───────────┘   └──────────┬─────────────┘                   │
│            │                          │                                  │
│            ▼                          ▼                                  │
│  ┌─────────────────────────────────────────────────┐                    │
│  │           Stripe Webhook Handler                 │                   │
│  │  payment_intent.succeeded → success handler      │                   │
│  │  payment_intent.payment_failed → failure handler  │                  │
│  │  payment_method.attached → method handler         │                  │
│  └─────────────────────────────────────────────────┘                    │
│                                                                         │
│  Blnk Ledger (double-entry)    Payment Reminders Pipeline               │
│  Delinquency Tagging           Offboarding (25+ days overdue)           │
│  Auto-Pay Reconciliation                                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    UtilityRemittance created
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                     REMITTANCE (automations + pg-admin)                  │
│                                                                         │
│  pg-admin: Bundle remittances → Create RemittanceExecution              │
│  automations: Playwright bots → Login to utility site → Pay bill        │
│  automations: Bank payment reconciliation → Verify via utility history  │
│  pg-admin: Mark execution complete/failed → Monitor via dashboards      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### `Payment` (Current — Active)
Primary payment record. **Amounts in cents (integer).**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Auto-generated |
| `paidBy` | uuid (FK → CottageUsers) | The user who paid |
| `paymentStatus` | enum `paymentstatus` | See statuses below |
| `amount` | integer | Total amount in cents (bill amount + fee) |
| `stripePaymentID` | text | Stripe PaymentIntent ID (`pi_...`) |
| `paymentMethodID` | text | Stripe payment method used |
| `ledgerTransactionID` | text | Links to blnk.transactions (`txn_...` or `bulk_...`) |
| `contributions` | jsonb | Array: `[{amount, chargeAccountID}]` (bills) or `[{amount, renewableSubscriptionID}]` (subscriptions) |
| `refundedAmount` | integer | Amount refunded (cents), default 0 |
| `succeededAt` | timestamp | When payment succeeded |
| `payout_id` | uuid (FK → Payout) | Links to outbound payout |
| `metadata` | jsonb | Additional metadata |

**Payment Statuses (`paymentstatus` enum):**

| Status | Meaning | How it gets here |
|--------|---------|------------------|
| `requires_capture` | Created by ledger batch, awaiting Stripe capture | `balance-ledger-application` auto-pay |
| `processing` | Stripe capture in progress | After `stripe.paymentIntents.capture()` |
| `succeeded` | Payment completed | Stripe webhook `payment_intent.succeeded` |
| `failed` | Payment failed | Stripe webhook `payment_intent.payment_failed` |
| `scheduled_for_payment` | Scheduled for future | Auto-pay with next-day delay |
| `waiting_for_user` | Needs user action (manual pay) | Manual payment pending |
| `paid_by_user` | User paid directly | Manual payment completed |
| `canceled` | Cancelled | User or system cancellation |
| `approved` | Approved for processing | Intermediate state |
| `succeeded_but_unverified` | Succeeded but needs verification | Edge case (bank accounts) |
| `awaiting_refund` / `refund_processing` / `refunded` | Refund lifecycle | Admin-initiated refund |

#### `ChargeAccount`
Central billing entity — one per utility account. Links user → utility account → ledger balance.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `electricAccountID` | integer (FK → ElectricAccount) | Can be null |
| `gasAccountID` | integer (FK → GasAccount) | Can be null |
| `propertyID` | integer (FK → Property) | Can be null |
| `ledgerBalanceID` | text | Links to `blnk.balances` (`bln_...`) |
| `paymentInstrumentId` | uuid (FK → PaymentInstrument) | How PG pays the utility |
| `status` | text | Currently `active` |

**Charge account patterns:**
- **Single charge account** (electric + gas same company): Both `electricAccountID` and `gasAccountID` populated on ONE ChargeAccount
- **Separate charge accounts**: One ChargeAccount with `electricAccountID`, another with `gasAccountID` — user can pay each utility separately
- **Electric-only or gas-only**: Only one ID populated

#### `ElectricBill` / `GasBill`
Bill records. **Amounts in cents.**

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint (PK) | |
| `electricAccountID` / `gasAccountID` | bigint (FK) | Parent account |
| `totalAmountDue` | integer | Bill total in cents |
| `totalUsage` | double | kWh/therms usage |
| `startDate` / `endDate` | timestamptz | Billing period |
| `dueDate` | timestamptz | Payment due date |
| `ingestionState` | enum | `approved`, `processed`, `cancelled`, `viewable` |
| `opsVerdict` | enum | `good`, `bad` |
| `paymentStatus` | enum | Legacy direct bill payment status |
| `isPaidByUser` | boolean | Manual payment outside system |
| `isPaidUtilityCompany` | boolean | PG remitted to utility |
| `isDepositOnlyBill` | boolean | Deposit bill flag |
| `manual` | boolean | Manually created bill |
| `visible` | boolean | Show to user |

**Ingestion State Pipeline:**
```
approved → processed → (UtilityRemittance created) → done
           ↘ cancelled
viewable (non-billing users, stays forever)
```

#### `CottageUsers` (Payment Columns)

| Column | Type | Notes |
|--------|------|-------|
| `stripeCustomerID` | text | Stripe customer ID (`cus_...`) |
| `stripePaymentMethodID` | text | Default payment method (`pm_...`) |
| `stripePaymentMethodType` | enum | `card` or `us_bank_account` |
| `paymentMethodStatus` | enum | `VALID` or `INVALID` |
| `isAutoPaymentEnabled` | boolean | Auto-pay toggle (default true) |
| `fee_structure` | bigint (FK → FeeStructure) | User's fee structure |
| `requiresMicroDepositVerification` | boolean | Bank ACH verification needed |
| `isFlexCustomer` | boolean | Enrolled in Flex bill splitting |

#### `ElectricAccount` / `GasAccount` (Payment Columns)

| Column | Type | Notes |
|--------|------|-------|
| `maintainedFor` | uuid (FK → CottageUsers) | **NOT NULL = billing user** (PG handles payment) |
| `status` | enum | `ACTIVE`, `NEEDS_OFF_BOARDING`, `PENDING_FIRST_BILL`, etc. |
| `totalOutstandingBalance` | numeric | Outstanding balance |
| `hasOverdueBalance` | boolean | Overdue flag |
| `isDelinquent` | boolean | Delinquency flag (set by reminder pipeline) |
| `delinquentDays` | integer | Days delinquent |

### Subscription Tables

#### `SubscriptionConfiguration`
Template/product definition.

| Column | Notes |
|--------|-------|
| `id` | bigint PK |
| `name` | e.g., "100% Clean Energy" |
| `monthlyFee` | 329 = $3.29 |
| `dayOfMonth` | Billing day (default 1, testing uses 7) |
| `notificationLeadDays` | Days before to notify (e.g., 5) |

#### `Subscription`
Per-property subscription instance. **Immutable** — cancel creates endDate, re-subscribe creates new row.

| Column | Notes |
|--------|-------|
| `id` | bigint PK |
| `status` | `pending`, `active`, `canceled` |
| `subscriptionConfigurationID` | FK → SubscriptionConfiguration |
| `propertyID` | FK → Property |
| `ledgerBalanceID` | Links to `blnk.balances` |
| `startDate` / `endDate` | Subscription period |

**Unique constraint**: `idx_subscription_property_active` — max 1 active per property.

#### `SubscriptionMetadata`
Individual billing cycle record generated by Inngest.

| Column | Notes |
|--------|-------|
| `id` | integer PK |
| `subscriptionID` | FK → Subscription |
| `status` | `pending`, `completed`, `canceled` |
| `amount` | Charge amount in cents (may be prorated) |
| `dueDate` | When this charge is due |
| `transactionID` | FK → blnk.transactions |

### Ledger Tables (`blnk` schema)

#### `blnk.balances`
| Column | Notes |
|--------|-------|
| `balance_id` | text PK (`bln_...`) |
| `balance` | Net balance (**in dollars, not cents**) |
| `credit_balance` / `debit_balance` | Totals |
| `inflight_balance` / `inflight_credit_balance` / `inflight_debit_balance` | In-flight amounts |
| `ledger_id` | Parent ledger |

#### `blnk.transactions`
| Column | Notes |
|--------|-------|
| `transaction_id` | text PK (`txn_...` or `bulk_...`) |
| `source` / `destination` | Balance IDs |
| `amount` | **In dollars (not cents!)** |
| `status` | `APPLIED`, `INFLIGHT`, `QUEUED`, `REJECTED`, `VOID` |

#### `TransactionMetadata`
Maps ledger transactions to bills.

| Column | Notes |
|--------|-------|
| `ledgerTransactionID` | FK → blnk.transactions |
| `electricBillID` / `gasBillID` | FK → bills |
| `dueDate` | Payment due date |

### Remittance Tables

#### `UtilityRemittance`
Money owed to utilities after user payments succeed.

| Column | Notes |
|--------|-------|
| `id` | uuid PK |
| `remittanceStatus` | `waiting_for_payment` → `ready_for_remittance` → `for_bundling` → `processing` → `done` |
| `amount` | numeric |
| `chargeAccountID` | FK → ChargeAccount |
| `paymentID` | FK → Payment |

#### `PaymentInstrument`
PG's corporate payment method for paying utilities.

#### `RemittanceExecution` / `RemittanceExecutionItem`
Tracks actual execution of payments to utility companies.

### Other Payment Tables

| Table | Purpose |
|-------|---------|
| `FeeStructure` | Fee rules: `fixed` (cents) + `percentage` * amount |
| `BillAdjustment` | Pre/post-ingestion bill adjustments |
| `BillCredit` | Credits on charge accounts (`PG_PAYS`, `OVERPAYMENT`) |
| `SavingsAdjustment` | Community solar savings per bill |
| `VoidOperations` | Tracks void/reversal operations on payments |
| `Payout` | Outbound payouts from PG |
| `Payments` (LEGACY) | Frozen since July 2025, 1,469 records. Do not use. |
| `Charges` (LEGACY) | Groups legacy payments. Do not use. |

---

## Bill Payment Pipeline

The bill payment pipeline is **sequential** and **cron-driven**. Each bill must complete the full cycle before the next can be processed for the same charge account.

### Bill Ingestion — Expected State

**Trigger:** Cron picks up all bills with `ingestionState = "approved"`, groups by property.

**Preconditions:**
- Bill has `ingestionState = "approved"`
- Utility account has non-null `maintainedFor` (billing user)
- ChargeAccount exists with a `ledgerBalanceID`

#### Per Bill — BLNK Transaction

| Field | Expected Value |
|-------|---------------|
| `reference` | `{billType}-bill-{billId}` (e.g. `electric-bill-42`, `gas-bill-17`) |
| `source` | `@{utilityCompanyId}` |
| `destination` | The charge account's `ledgerBalanceID` |
| `precise_amount` | `totalAmountDue + netAdjustments + netCredits` |
| `description` | `"{utilityCompanyId} {billType} {statementDate}"` with optional `" {totalUsage} {unit}"` suffix |
| `status` | **`applied`** (NOT inflight — bill transactions are immediately applied) |

**Amount calculation:**
- `netAdjustments` = sum of all `BillAdjustment.amount` for this bill
- `netCredits` = sum of `-credit.amount` for credits where `applicationStatus = "pending"` AND `creditType = "PG_PAYS"`. Credits with `creditType = "OVERPAYMENT"` contribute 0.

#### Per Bill — TransactionMetadata

| Field | Expected Value |
|-------|---------------|
| `ledgerTransactionID` | The BLNK `transaction_id` from above |
| `electricBillID` or `gasBillID` | The bill ID (matching bill type) |
| `dueDate` | Bill's `dueDate`, or `statementDate + 3 days` if null, or `today + 5 days` if that fallback is in the past |

#### Bill Record

| Field | Before | After |
|-------|--------|-------|
| `ingestionState` | `"approved"` | `"processed"` |

#### BLNK Balance (charge account)

| Field | Change |
|-------|--------|
| `balance` | Increased by `precise_amount` (immediately applied) |
| `inflight_balance` | Unchanged |

#### Notifications Sent

| Condition | Email Type | Subject Pattern |
|-----------|-----------|-----------------|
| Auto-pay enabled | `"ledger-auto-pay-ready"` | `"Your {billTypes} bill(s) are/is ready"` |
| Auto-pay disabled | `"ledger-manual-pay-ready"` | `"Your {billTypes} bill(s) are/is ready for payment"` |
| First bill ever for property | SMS also sent | (in addition to email) |
| Flex customer | `"ledger-flex-ready"` | (exits pipeline, no auto-pay attempted) |
| Payment method not configured | `"update-payment-method"` | `"[Urgent] - Update Your Payment Method"` (also disables auto-pay, marks PM `INVALID`) |

#### Idempotency

- If a BLNK transaction with matching reference already exists, no new transaction is created.
- If `ingestionState` is no longer `"approved"` when worker picks it up, the bill is skipped.

### Key Rules

- **Only billing users** (`maintainedFor IS NOT NULL`) have bills processed through the pipeline. Non-billing users' bills stay `approved` or `viewable` forever.
- **Sequential processing**: One approved bill at a time per charge account. Next bill waits for previous payment to complete.
- **For N bills**: Need ~N x 2 cron cycles (~N x 10 min in dev worst case).
- **NEVER insert bills directly as `processed`** — this bypasses the Blnk ledger, leaving balance at $0.
- **Minimum payment**: $1.00 (`STRIPE_MINIMUM_PAYMENT_AMOUNT = 100` cents).
- **Flex users**: Get bill notification but payment is handled by GetFlex, not auto-pay.

---

## Bill Adjustments & Credits

### Pre-Ingestion Adjustment

**Condition:** Bill `ingestionState` is NOT `"processed"`

- `BillAdjustment` record created with `adjustmentPhase = "pre-ingestion"`
- No BLNK transaction yet — adjustment amount folded into the bill's BLNK transaction during ingestion
- If `willRemitOriginal = true`: a separate **immediately applied** BLNK transaction created:
  - Reference: `pre_ingestion_remittance_{billType}_bill_{billID}_{timestamp}`
  - Credit given: `@AdjustmentsAbsorbed` → `@RemittancePool`. Fee charged: `@RemittancePool` → `@AdjustmentsCollected`

### Post-Ingestion Adjustment

**Condition:** Bill `ingestionState` is `"processed"`

- `BillAdjustment` record created with `adjustmentPhase = "post-ingestion"`
- **Immediately applied** BLNK transaction:
  - Reference: `adjustment_{billType}_bill_{billID}_{timestamp}`
  - Credit (negative amount): `ledgerBalanceID` → `@AdjustmentsAbsorbed`
  - Fee (positive amount): `@AdjustmentsAbsorbed` → `ledgerBalanceID`
- If credit pushes charge account balance below zero → `BillCredit` record created for overflow
- **Not idempotent** — the `timestamp` suffix means each API call creates a new transaction

### Bill Credits

**Condition:** Bill NOT yet `"processed"`, credit is `"pending"`, not already attached

- `BillCredit` record updated with `electricBillID`/`gasBillID` and `appliedBy`
- No BLNK transaction at attach time — credit applied during bill ingestion

| Credit Type | Effect on BLNK Transaction Amount During Ingestion |
|-------------|-----------------------------------------------------|
| `PG_PAYS` | Reduces by `credit.amount` |
| `OVERPAYMENT` | No effect (contributes 0) |

### Paid-By-User (4 Scenarios)

| # | Bill Processed? | User Paid Us? | Remittance Exists? | Expected State |
|---|----------------|---------------|-------------------|----------------|
| 1 | No | No | N/A | Credits unattached, `isPaidByUser = true`, `ingestionState = "cancelled"` |
| 2 | Yes | Yes | Yes | Negative adjustment created (`willRemitOriginal = false`) |
| 3 | Yes | Yes | No | Negative adjustment created (`willRemitOriginal = true`), `UtilityRemittance` created |
| 4 | Yes | No | N/A | Negative adjustment created (`willRemitOriginal = false`) |

---

## Auto-Payment Flow

Auto-pay is enabled per user via `CottageUsers.isAutoPaymentEnabled` (default: true). Follows bill ingestion when user has auto-pay ON, a valid payment method, and is not a Flex customer.

### After `preparePayment` (Before Sleep)

#### Payment Record Created

| Field | Expected Value |
|-------|---------------|
| `paidBy` | user ID |
| `amount` | `totalAmount + transactionFee` |
| `paymentMethodID` | user's `stripePaymentMethodID` |
| `contributions` | Array of `{ chargeAccountID, amount }` per charge account |
| `paymentStatus` | **`"scheduled_for_payment"`** |
| `ledgerTransactionID` | BLNK `batch_id` from bulk transaction |

#### BLNK Transactions (Inflight Bulk)

One transaction per charge account:

| Field | Expected Value |
|-------|---------------|
| `reference` | `{utilityType}_{paymentID}` — e.g. `electric_{uuid}`, `gas_{uuid}`, `electric_and_gas_{uuid}` |
| `source` | charge account's `ledgerBalanceID` |
| `destination` | `@Stripe` |
| `description` | `"Customer Balance ({utilityType}) to Stripe"` |
| `status` | **`inflight`** |

If card with fee > 0, an additional fee transaction:

| Field | Expected Value |
|-------|---------------|
| `reference` | `transaction_fee_{paymentID}` |
| `source` | `@StripeFees` |
| `destination` | `@Stripe` |
| `description` | `"Stripe Fees to Stripe"` |
| `status` | `inflight` |

**Fee calculation:** `bankersRound(totalAmount * feeStructure.percentage + feeStructure.fixed)`. Returns 0 if payment method type is not in `feeStructure.targetPaymentMethodTypes` (bank accounts = 0%).

#### BLNK Balance Change

| Field | Change |
|-------|--------|
| `balance` | Unchanged |
| `inflight_balance` | Decreased by charge amount (inflight debit) |
| `inflight_debit_balance` | Increased by charge amount |

### Sleep

- **Production:** Until 12:00:00 PM ET the next day
- **Dev:** 1 minute

### Pre-Payment Re-Validation

Before charging Stripe, the system re-validates. If validation fails:

| Validation Failure | Payment Status | BLNK Status |
|-------------------|---------------|-------------|
| Payment record missing | `"failed"` | `void` |
| Payment already succeeded/processing | No change | No change (idempotent skip) |
| Payment no longer `"scheduled_for_payment"` | Depends | `void` only if `"failed"` |
| User not found | `"failed"` | `void` |
| User became Flex customer | `"failed"` | `void` |
| User disabled auto-pay | `"canceled"` | `void` |

### After Stripe Confirmation

| Payment Method | Payment Status | Stripe PI Status | BLNK |
|----------------|---------------|------------------|------|
| Card | `"requires_capture"` | `requires_capture` (hold, not charged) | Still `inflight` |
| Bank (ACH) | `"processing"` | `processing` (ACH in transit) | Still `inflight` |

### Stripe PaymentIntent Details (Auto-Pay)

| Field | Value |
|-------|-------|
| `amount` | `totalAmount + transactionFee` (cents) |
| `currency` | `"usd"` |
| `capture_method` | Card: `"manual"`. Bank: `"automatic_async"` |
| `allow_redirects` | **`"never"`** (auto-pay) |
| `metadata.paidBy` | user ID |
| `metadata.paymentID` | payment ID |
| `statement_descriptor_suffix` | Utility company IDs joined with `/`, truncated to 12 chars |
| Stripe idempotency key | `paymentID` |

### 3DS Required (Auto-Pay)

Auto-pay does NOT support 3DS verification. If Stripe returns `requires_action`:

| Field | Expected Value |
|-------|---------------|
| `Payment.paymentStatus` | `"failed"` |
| BLNK transactions | `void` |
| Email | `"bill-payment-failed"` |

### Auto-Pay Reconciliation

Separate Inngest function catches users who missed the normal auto-pay window:
- `auto-pay-reconciliation-trigger` → batches of 25 → `auto-pay-reconciliation`
- Identifies auto-pay users with outstanding balances
- Uses same `PaymentProcessor` flow

---

## Manual Payment Flow

### UI Flow (cottage-nextjs)

1. User navigates to `/app/billing` or `/app/overview`
2. Sees outstanding balance card with "Pay bill" button (visible when `totalDue > 0`)
3. Clicks "Pay bill" → `PayBillsModal` (Sheet) opens
4. **XState machine** (`payment-flow-machine.ts`) manages states: `idle` → `viewOrUpdate` → `viewing` → `paying` → `success`

### Payment Amount Options

| Option | When Available | Description |
|--------|---------------|-------------|
| Total Amount Due | Always (when balance > 0) | Pays full outstanding balance |
| Past Due Balance | When `canPaySeparately=false` AND overdue exists | Pays only overdue amount |
| Other Amount | When `canPaySeparately=true` (separate charge accounts) | Per-utility custom amounts |

**`canPaySeparately`**: True when electric and gas have different charge accounts (different utility companies). Returned by balance endpoint.

### API Call

```
POST /api/payments/manual → proxies to SERVICES_MANUAL_PAYMENT_ENDPOINT (lambda)
```

### Differences from Auto-Pay

| Aspect | Auto-Pay | Manual Pay |
|--------|----------|-----------|
| `Payment.paymentStatus` on create | `"scheduled_for_payment"` | `null` |
| Sleep before Stripe | Yes (prod: next day 12PM ET, dev: 1 min) | None |
| Pre-payment re-validation | Yes (full matrix above) | None |
| Stripe `allow_redirects` | `"never"` | **`"always"`** |
| 3DS required | Fails immediately (void + failed) | Returns `redirect_url` for user to complete |

### 3DS Verification (Manual Only)

If Stripe returns `requires_action`, the system:
1. Returns a redirect URL to the frontend (does NOT void or fail)
2. Frontend renders 3DS verification in an iframe
3. `use3DSVerification` hook listens for `window.postMessage` with `type: '3ds-verification-complete'`
4. Calls `stripe.retrievePaymentIntent(piSecret)` — success if `processing`, `succeeded`, or `requires_capture`
5. 10-minute timeout on verification wait state

### Validation (Zod Schema)

- Minimum $1.00 per charge
- Cannot exceed outstanding balance
- At least one utility amount > 0 for "other" type
- Card: 3% transaction fee added
- Bank: No fee

---

## Card Capture

**Trigger:** Cron (hourly in prod, every 5 min in dev) finds payments with `paymentStatus = "requires_capture"`.

**Only card payments** enter this flow. Bank account payments use `capture_method: "automatic_async"` and skip capture entirely.

### After Successful Capture

| Field | Expected Value |
|-------|---------------|
| Stripe PaymentIntent status | `"succeeded"` |
| BLNK transactions | Still `inflight` (committed later by success webhook handler) |

The Stripe `payment_intent.succeeded` webhook fires → triggers the success flow.

### After Failed Capture

| Field | Expected Value |
|-------|---------------|
| `Payment.paymentStatus` | `"failed"` |
| BLNK transactions | `void` |
| Slack alert | Sent |

---

## Successful Bill Payment

**Trigger:** Stripe `payment_intent.succeeded` webhook. Differentiated from subscription payments by the **absence** of `metadataIDs` in Stripe metadata.

### Expected State

#### Payment Record

| Field | Expected Value |
|-------|---------------|
| `paymentStatus` | `"succeeded"` |

#### BLNK — Payment Transaction Committed

| Transaction | Status |
|-------------|--------|
| `{utilityType}_{paymentID}` (payment) | **`applied`** (committed) |
| `transaction_fee_{paymentID}` (fee) | **`applied`** (committed, same bulk) |

#### BLNK — Remittance Transactions Created

Two new **immediately applied** transactions:

| # | Reference | Source | Destination | Amount |
|---|-----------|--------|-------------|--------|
| 1 | `remittance_{paymentID}` | `@Stripe` | `@RemittancePool` | Payment amount (excluding fees) |
| 2 | `fee_transfer_{paymentID}` | `@Stripe` | `@StripeFees` | Fee amount |

#### UtilityRemittance Records

One per contribution in the payment:

| Field | Expected Value |
|-------|---------------|
| `amount` | The contribution amount for that charge account |
| `chargeAccountID` | The charge account ID |
| `remittanceStatus` | `"ready_for_remittance"` |
| `paymentID` | The payment ID |

#### Notifications

| Type | Sent |
|------|------|
| `"bill-paid"` email | Yes |
| `"pay-bills-trigger"` job (production only) | Yes |

#### Idempotency

If the BLNK transaction is already `"applied"` AND a transaction with reference `remittance_{paymentID}` already exists, the entire flow is skipped.

---

## Failed Bill Payment

**Trigger:** Stripe `payment_intent.payment_failed` webhook. The webhook handler emits an internal event (does NOT update payment status directly — the failure handler does).

### Expected State

#### Payment Record

| Field | Expected Value |
|-------|---------------|
| `paymentStatus` | `"failed"` |

#### BLNK — Payment Transaction Voided

| Field | Expected Value |
|-------|---------------|
| Original inflight transaction | Status: **`void`** |

#### BLNK Balance

| Field | Change |
|-------|--------|
| `balance` | Unchanged (was never committed) |
| `inflight_balance` | Inflight debit reversed (balance restored) |

### Void Failure Edge Case

If the BLNK void call itself fails:

| Field | Expected Value |
|-------|---------------|
| `Payment.paymentStatus` | **`"processing"`** (NOT `"failed"`) — requires manual resolution |
| Slack alert | Sent to `{stage}-payment-alerts` |
| `VoidOperations` record | Created with error details |

### Recoverability

**Recoverable** (card failure with a retryable advice code):

| Field | Expected Value |
|-------|---------------|
| `isAutoPaymentEnabled` | Unchanged (stays `true`) |
| `paymentMethodStatus` | Unchanged |
| Email | `"bill-payment-failed"` with error details |

**Non-recoverable** (advice code `"confirm_card_data"` or `"do_not_try_again"`, or ANY bank account failure):

| Field | Expected Value |
|-------|---------------|
| `isAutoPaymentEnabled` | `false` |
| `paymentMethodStatus` | `"INVALID"` |
| Email | `"update-payment-method"` |
| Slack alert | Additional alert about auto-pay being disabled |

### Notifications

| Type | Sent |
|------|------|
| Slack alert to `{stage}-operations-alerts` | Always |
| User email | Always (type depends on recoverability) |
| `UtilityRemittance` | Never created |

---

## Subscription Payment Pipeline

Monthly renewable energy subscription ($3.29/mo). Two-phase daily process:

### Phase 1: Transaction Generation (1 PM ET prod / event in dev)

```
trigger-transaction-generation
  │  Gets all active subscriptions
  │  Batches into groups of 5
  ▼
batch-process-subscription-transactions
  │  Check: today == notificationLeadDays before dayOfMonth?
  │  If yes, emit subscription.transaction.generate
  ▼
process-subscription-transaction
  │  Create Blnk INFLIGHT transaction (@SubscriptionDues → subscription ledger)
  │  Create SubscriptionMetadata (status: pending, amount, dueDate)
  │  Send email:
  │    - Has payment method → subscription-renewal-reminder
  │    - No payment method → subscription-payment-method-reminder
  └──→ Done (wait for Phase 2)
```

### Phase 2: Payment Processing (3 PM ET prod / event in dev)

```
trigger-subscriptions-payment
  │  Gets active subscriptions for payment
  │  Batches into groups of 5
  ▼
batch-process-subscription-payments
  │  Check: today == dayOfMonth?
  │  Filter: pending metadata + today's dueDate + valid transactionID
  ▼
process-subscription-payment
  │  Concurrency: 5 total, 1 per subscription ID (prevents duplicates)
  │  Validate: property, user, active account, no existing active payment
  │  Create Payment record (contributions: [{amount, renewableSubscriptionID}])
  │  Create Blnk INFLIGHT transaction
  │  Create Stripe PaymentIntent (automatic_async capture)
  │  stripe.paymentIntents.confirm()
  ▼
Stripe Webhook
  ├── succeeded → subscription-payment-success-process
  │   → Commit Blnk transactions
  │   → Update SubscriptionMetadata.status → 'completed'
  │   → Send success email
  │
  └── failed → subscription-payment-failed-process
      → Void Blnk transaction
      → Slack alert
      → Send failure email with Stripe error
```

### Subscription Payment Success

**Trigger:** Stripe `payment_intent.succeeded` with `metadataIDs` present in metadata.

| Record | Field | Expected Value |
|--------|-------|---------------|
| `Payment` | `paymentStatus` | `"succeeded"` |
| BLNK payment txn (`subscription-payment-{paymentID}`) | status | **`applied`** (committed) |
| BLNK generation txn(s) (`subscription-{id}-{date}`) | status | **`applied`** (committed, one per metadata ID) |
| `SubscriptionMetadata` (each) | `status` | `"completed"` |
| Email | type | `"subscription-payment-success"` |

**No remittance transactions or `UtilityRemittance` records** are created for subscription payments.

### Subscription Payment Failure

**Trigger:** Stripe `payment_intent.payment_failed` with `metadataIDs` present.

| Record | Field | Expected Value |
|--------|-------|---------------|
| `Payment` | `paymentStatus` | `"failed"` |
| BLNK payment txn (`subscription-payment-{paymentID}`) | status | **`void`** |
| BLNK generation txn(s) (`subscription-{id}-{date}`) | status | **`inflight`** (NOT voided — stays pending for retry) |
| `SubscriptionMetadata` | `status` | **`"pending"`** (NOT updated — stays pending for retry) |
| `isAutoPaymentEnabled` | | Unchanged (NOT disabled, unlike bill payment failures) |
| `paymentMethodStatus` | | Unchanged (NOT marked INVALID) |
| Email | type | `"subscription-payment-failed"` (always, regardless of advice code) |

> **Key difference from bill payment failure**: Subscription failures do NOT void the generation transaction or update metadata. The subscription stays eligible for retry.

### Subscription Cancellation

| Record | Field | Expected Value |
|--------|-------|---------------|
| `Subscription` | `endDate` | Set |
| `SubscriptionMetadata` (pending) | `status` | `"canceled"` |

### Duplicate Payment Prevention

- **Per-subscription concurrency lock** (Inngest): `{ limit: 1, key: "event.data.subscription.id" }`
- **5-day detection window**: `hasActiveSubscriptionPayment()` checks for existing payment where `paymentStatus` is NOT `"failed"` or `"refunded"` (i.e. null, processing, succeeded, requires_action, requires_capture)
- `failed` and `refunded` statuses are **non-blocking** (allow retry)

### Dev Testing Recipe

```sql
-- 1. Set EA ACTIVE, backdate sub, align dayOfMonth to today
UPDATE "ElectricAccount" SET status = 'ACTIVE' WHERE id = <ea_id>;
UPDATE "Subscription" SET "startDate" = '<1-month-ago>' WHERE id = <sub_id>;
UPDATE "SubscriptionConfiguration" SET "dayOfMonth" = <today_day> WHERE id = 1;
```
```bash
# 2. Trigger generation → creates pending metadata
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "transaction-generation-trigger", "data": {}}'
# Wait ~50s
```
```sql
-- 3. RESTORE dayOfMonth IMMEDIATELY (affects all subscriptions)
UPDATE "SubscriptionConfiguration" SET "dayOfMonth" = 7 WHERE id = 1;
```
```bash
# 4. Trigger payment
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "subscriptions-payment-trigger", "data": {}}'
# Wait ~50s
```

---

## Flex Payment

### Flex Payment Success

**Trigger:** `flex.payment.success` event with `flexPaymentID`, `amountInCents`, `contributions`.

#### BLNK Transactions (Per Charge Account)

| Field | Expected Value |
|-------|---------------|
| `reference` | `flex_{flexPaymentID}_{chargeAccountID}` |
| `source` | charge account's `ledgerBalanceID` |
| `destination` | `@Flex` |
| `description` | `"Flex payment {flexPaymentID}"` |
| `status` | **`applied`** (NOT inflight) |
| `allow_overdraft` | **`false`** (unlike all other payment paths) |

#### BLNK Remittance Transaction

| Field | Expected Value |
|-------|---------------|
| `reference` | `flex_remittance_{paymentID}` |
| `source` | `@Flex` |
| `destination` | `@RemittancePool` |
| `status` | `applied` |

#### Payment Record

| Field | Expected Value |
|-------|---------------|
| `paymentStatus` | `"succeeded"` |
| `ledgerTransactionID` | BLNK batch_id |

#### UtilityRemittance

Same as bill payment success: one per contribution, `remittanceStatus = "ready_for_remittance"`.

#### Notifications

| Type | Details |
|------|---------|
| `"bill-paid"` email | `last4: "Flex"`, `brand: "Flex"` |
| `"pay-bills-trigger"` job | Production only |

### Flex Reconciliation

A cron job (every 15 min) catches stale Flex payments where `ledgerTransactionID IS NULL`, `paymentStatus = "succeeded"`, and `created_at` older than 5 minutes. Re-emits the success event. The success handler's idempotency (reference check) prevents duplicates.

### Flex Checkout (Inflight)

| Field | Expected Value |
|-------|---------------|
| `reference` | `flex_checkout_{paymentID}_{chargeAccountID}` |
| `status` | **`inflight`** with 1-day expiry |

---

## Payment Reminders & Offboarding

### Reminder Pipeline (services)

**Trigger**: Cron `0 11 * * *` (11 AM ET prod) / event `ledger.payment.reminders` (dev)

```
trigger-ledger-payment-reminders
  │  Aggregates all CottageUsers with charge accounts
  │  Batches into groups of 20
  ▼
batch-process-ledger-reminders
  │  Fetches: Blnk balances, bills, payments, due dates
  │  Groups by user+property
  │  Production: 120s delay per batch (spread load)
  ▼
batch-ledger-payment-reminders
  │  Decision engine per user:
  │  Filters inactive accounts, calculates reminder tier
  ▼
  ├── ledger.delinquency.tag (delinquency tracking)
  ├── ledger.payment.reminder.email
  ├── ledger.payment.reminder.text (SMS via Dialpad)
  └── ledger.payment.reminder.flag-offboarding
```

### Balance Used

```
effective_balance = balance + inflight_balance
```

Inflight transactions (pending payments) are included. A pending payment reduces the effective balance.

### Auto-Pay Users

There is **no explicit auto-pay filter**. Auto-pay users are implicitly excluded because successful payments bring their balance to zero. If an auto-pay payment **fails** and leaves a balance, reminders **will** be sent.

### Skip Conditions (No Notifications)

- No `nearestDueDate` exists for any charge account
- Not overdue AND not within a due-soon window day
- No account has `dueBalance >= $1.00`
- All accounts are `INACTIVE`
- Total balance across all active accounts <= 0

### Reminder Schedule — Exact Days

#### Due-Soon (Before Due Date)

| Days Before Due | Email | SMS |
|----------------|-------|-----|
| 15 | Yes | No |
| 10 | Yes | No |
| 5 | Yes | No |

#### Overdue (After Due Date)

| Days Overdue | Type | Email | SMS (Under Cottage EIN) | SMS (Not Under EIN) |
|---|---|---|---|---|
| 5 | `standard` | Yes | Yes | No |
| 7 | `standard` | No | No | Yes |
| 10 | `standard` | Yes | Yes | No |
| 14 | `standard` | No | No | Yes |
| 15 | `standard` | Yes | Yes | No |
| 16-24 | `shutoff_warning` | Yes (daily) | Yes (at 18, 21, 24) | Yes (at 21) |
| 25+ | `final_shutoff` | Yes | Yes | Yes |

### SMS Consent

SMS is only sent if BOTH:
- `isAbleToSendTextMessages = true`
- `dateOfTextMessageConsent` is not null

### Email Subjects by Type

| Type | Subject |
|------|---------|
| `standard` (overdue) | `"ACTION REQUIRED: Overdue Payment for {billTypes}"` |
| `standard` (due soon) | `"Payment Due Soon for {billTypes}"` |
| `shutoff_warning` | `"Urgent: {billTypes} Shutoff Notice for your Public Grid Account"` |
| `final_shutoff` | `"Final Notice: {billTypes} Service Scheduled for Shutoff"` (only for accounts NOT already `NEEDS_OFF_BOARDING`) |

### Delinquency Tagging

Updated as a side effect of the reminder pipeline (NOT real-time on payment events):

| Condition | Expected State on Utility Account |
|-----------|----------------------------------|
| `daysOverdue > 0` AND `dueBalance >= $1.00` | `isDelinquent = true`, `delinquentDays = N` |
| Previously delinquent but now `daysOverdue <= 0` OR `dueBalance < $1.00` | `isDelinquent = false`, `delinquentDays = 0` |

**Single-account users:** Both electric and gas tagged with same overdue days.
**Multi-account users:** Each utility type evaluated independently.

### Offboarding (25+ Days)

At 25+ days overdue, the reminder pipeline:
1. Sets utility account status → `NEEDS_OFF_BOARDING`
2. Sends Slack alert to `{stage}-needs-off-boarding`
3. Account excluded from future reminder processing

### Reconciliation Back to ACTIVE

**Schedule:** Daily cron (11 AM ET in prod). Fetches accounts with `status = "NEEDS_OFF_BOARDING"`, groups by property.

Account flips back to `"ACTIVE"` when ANY of:
- `dueBalance < $1.00`
- No `nearestDueDate` (no unpaid bills)
- Days overdue < 25

Account stays `"NEEDS_OFF_BOARDING"` when:
- `dueBalance >= $1.00` AND 25+ days overdue

**Property-level override**: For utility companies where user has BOTH electric and gas on same charge account — if ANY account is still overdue, ALL accounts for that company stay `NEEDS_OFF_BOARDING`.

**Exception:** EVERSOURCE and NGMA are always evaluated individually.

### Ledger Interaction

The reminder pipeline **only reads** from BLNK. It never creates, commits, or voids transactions.

---

## Remittance System

After user payments succeed, PG must pay the utilities.

### Flow

```
Payment succeeded
  → UtilityRemittance created (status: ready_for_remittance)
  → PG-Admin: Ops bundles remittances (status: for_bundling)
  → RemittanceExecution created
  → RemittanceExecutionItem links execution → UtilityRemittance
  → automations repo: Playwright bots login to utility website and pay
  → OR: pg-admin: Manual payment + dashboard-pay-bill trigger
  → Reconciliation: Check utility payment history or Fastmail email confirmation
  → UtilityRemittance status → done
```

### Automations Repo Tasks

| Task | Trigger | Purpose |
|------|---------|---------|
| `nightly-pay-bills` | Scheduled (nightly) | Fetches all utility audit settings, creates payment tasks per provider |
| `pay-bills-trigger` | On-demand | Ad-hoc payment for specific users |
| `dashboard-pay-bill` | On-demand (from PG-Admin) | Single-user pay bill with remittance IDs or amount |
| `remittance-cleanup-task` | Scheduled (daily 12:00 Manila) | Reconciles `TO_REVIEW`, `POSTED`, `PENDING` executions |

### PG-Admin Remittance Routes

| Route | Purpose |
|-------|---------|
| `/remittance-management` | Main remittance table with tabs: remittances, pending executions, review |
| `/unpaid-remittances` | Unpaid remittance list, reconcile modal, CSV export |
| `/failed-executions` | Critical/failed remittance executions |

---

## Stripe Integration

### Payment Methods Supported

| Method | Fee | Processing Time | Notes |
|--------|-----|-----------------|-------|
| Credit/debit card | 3% | Instant | Visa, MC, Amex, Discover, Diners, JCB, UnionPay |
| US bank account (ACH) | 0% | 3-5 business days | Micro-deposit verification may be required |

### Stripe Objects Used

| Object | When | Notes |
|--------|------|-------|
| `SetupIntent` | Adding/updating payment method | `payment_method_types: ['us_bank_account', 'card']` |
| `PaymentIntent` | Processing payments | Manual: created directly. Auto: created by `PaymentProcessor` |
| `PaymentElement` | UI form | Unified Stripe form component (not individual CardElement) |
| `Customer` | User linking | `stripeCustomerID` on CottageUsers |

### Webhook Events Handled

| Event | Handler | Notes |
|-------|---------|-------|
| `payment_intent.succeeded` | Routes to bill or subscription success based on `metadataIDs` presence | Deduplication via `StripeWebhookEvents` table |
| `payment_intent.payment_failed` | Routes to bill or subscription failure | Non-recoverable: disables auto-pay |
| `payment_intent.processing` | Processing state handler | |
| `setup_intent.requires_action` | Micro-deposit verification | Bank accounts |
| `setup_intent.setup_failed` | Setup failure | |
| `payment_method.attached` | Updates user payment method, attempts pending subscription payments | |
| `payout.created` / `payout.paid` | Outbound payout tracking | |

### Non-Recoverable Payment Failures

| Advice Code | Meaning | Action |
|-------------|---------|--------|
| `confirm_card_data` | Card data issue | Disable auto-pay, mark INVALID |
| `do_not_try_again` | Permanent decline | Disable auto-pay, mark INVALID |
| `us_bank_account` (any failure) | Bank transfer failed | Disable auto-pay, mark INVALID |

### Test Cards

| Card | Purpose |
|------|---------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0341` | Failed payment (attach succeeds, charge fails) |

---

## Blnk Ledger

All payments go through Blnk's double-entry ledger system. BLNK transactions are **immutable** — committing or voiding creates a new child record rather than updating the original. To determine effective status, traverse the tree to the leaf nodes.

### Balance Formulas

| Name | Formula | Used For |
|------|---------|----------|
| **Outstanding balance** | `balance + inflight_balance` | Payment amount calculation, payment validation, reminder decisions |
| **Processing balance** | `inflight_debit_balance` | Showing user what's currently being charged |
| **Due balance** | `max(0, (past-due electric bills + past-due gas bills) - total payments)` | Reminder severity, offboarding threshold |

### System Accounts

| Account | Role |
|---------|------|
| `@{utilityCompanyId}` | Source when a bill is ingested (e.g. `@ConEd`, `@PSEG`) |
| `@Stripe` | Destination when a payment is charged |
| `@StripeFees` | Source for the transaction fee portion of a payment |
| `@RemittancePool` | Where successful payment funds go for utility remittance |
| `@Flex` | Flex partner payment account |
| `@SubscriptionDues` | Source for subscription charges |
| `@AdjustmentsAbsorbed` | Destination for PG-absorbed credits |
| `@AdjustmentsCollected` | Destination for extra fees from adjustments |

### Transaction States

| State | Meaning |
|-------|---------|
| `applied` | Finalized. Reflected in `balance`. |
| `inflight` | Pending. Reflected in `inflight_balance` only. Will become `applied` (commit) or `void`. |
| `void` | Reversed. No longer reflected in any balance. |

### Amounts

All BLNK amounts are in **cents** (precision = 100, currency = USD).

> **Note**: The DB research found `blnk.transactions.amount` stored in dollars. Brennan's doc states cents. Verify in dev which is current — the system may have been migrated. When writing tests, always check the actual values.

### Remittance Flow in Ledger

On payment success, two new **immediately applied** transactions:

| # | Reference | Source | Destination | Amount |
|---|-----------|--------|-------------|--------|
| 1 | `remittance_{paymentID}` | `@Stripe` | `@RemittancePool` | Payment amount (excluding fees) |
| 2 | `fee_transfer_{paymentID}` | `@Stripe` | `@StripeFees` | Fee amount |

Then `UtilityRemittance` records created per contribution/charge account with `remittanceStatus = "ready_for_remittance"`.

---

## Fee Structure

Formula: `fixed` (cents) + `percentage` * amount

| Payment Method | Fixed Fee | Percentage | Example ($100 bill) |
|---------------|-----------|------------|---------------------|
| Card | $0.30 | 3% | $0.30 + $3.00 = $3.30 fee |
| Bank (ACH) | $0.00 | 0% | $0.00 fee |

Default fee structure (id=1): $0.30 + 3% for cards.

---

## Frontend Payment Flows

### A. Manual Pay Bill (Primary)

| Component | File | Purpose |
|-----------|------|---------|
| `PaymentSection` | `outstanding-bills-page.tsx` / `outstanding-overview-page.tsx` | "Pay bill" button |
| `PayBillsModal` | `pay-bills-modal.tsx` | Sheet/slide-over container |
| `PayBillsView` | `pay-bills-view.tsx` | Payment form with amount selection |
| `payment-flow-machine` | `payment-flow-machine.ts` | XState: idle → viewOrUpdate → viewing → paying → success |
| `useOutstandingBalancePayment` | `mutations/payment.ts` | POST to `/api/payments/manual` |
| `use3DSVerification` | `hooks/use3DSVerification.ts` | 3DS postMessage listener |
| `chargeBuilder` | `calculations/chargeBuilder.ts` | Splits amounts between electric/gas |
| `createPayBillsSchema` | `schemas.ts` | Zod validation |

### B. Payment Method Add/Update

| Component | File | Purpose |
|-----------|------|---------|
| `PaymentMethodForm` | `stripe/payment-method-form.tsx` | Stripe Elements wrapper |
| `SetupFormProvider` | `stripe/setup-form-provider.tsx` | Stripe Elements context |
| `PaymentSetupForm` | `stripe/payment-setup-form.tsx` | `PaymentElement` rendering |
| `useSetupIntentMutation` | `mutations/payment-method/index.ts` | Creates SetupIntent |
| `AutoPaymentCheckbox` | `stripe/auto-payment-checkbox.tsx` | Auto-pay toggle |

### C. Move-In Payment Setup

| Component | File | Purpose |
|-----------|------|---------|
| `SetupPaymentForm` | `move-in/forms/setup-payment.tsx` | Onboarding payment form |
| `setupPaymentMachine` | `move-in/machines/setup-payment/index.ts` | XState machine |
| Billing optionality | Radio group | "PG handles everything" vs "I will manage payments myself" |
| `getElementOptions` | Theme-aware | Adapts to partner brand colors |

### D. Autopay Enable + Pay Now

| Component | File | Purpose |
|-----------|------|---------|
| `AutopayPaymentModal` | `billing/components/modals/autopay-payment-modal.tsx` | Enable autopay + pay outstanding |
| "Pay now" / "Do it later" | Buttons | Immediate payment or skip |

### E. Account Page Payment Method

| Component | File | Purpose |
|-----------|------|---------|
| `PaymentMethodTab` | `account/_components/payment-method/` | Shows current method, Flex integration |
| `DisableAutopayModal` | Confirmation dialog | Warns about disabling autopay |
| `FlexActivePaymentCard` / `FlexPromoCard` | Flex UI | Bill splitting promotion |

### F. Payment Alerts

| Alert | Trigger | Action |
|-------|---------|--------|
| `OverdueBalanceAlert` | Overdue balance detected | "Failure to pay will result in shutting off service" |
| `PaymentFailedAlert` | Stripe error on file | Shows error message, links to account page |

### G. Light Portal Billing

Separate system under `/portal/billing/`. Uses Light-specific payment APIs:
- `/api/light/bills/payments/` — Light user bill payments
- `/api/light/ensure-payment-method` — Ensure payment method exists
- Light-specific components: `light-payment-card-preview`, `light-payment-update-form`, `light-initial-payment-setup-form`

---

## PG-Admin Payment Features

### Admin Routes

| Route | Purpose |
|-------|---------|
| `/remittance-management` | Full remittance management (filter, bulk select, status updates) |
| `/unpaid-remittances` | Unpaid remittances with reconcile + outstanding balance modals |
| `/failed-executions` | Critical/failed remittance executions |
| `/billing-inbox` | Bill management (list, filter, detail panel, adjustments) |
| `/bill-email-notifications` | Monitors bill email notifications from utilities |

### Admin API Services

| Service | Key Operations |
|---------|---------------|
| Payments | `updatePaymentRefund` — refund amounts on succeeded payments |
| Remittances | Full CRUD + bulk operations, execution management, reconciliation |
| Stripe | `getStripePaymentMethod` — retrieve details for admin review |
| Ledgers | `getPropertyBalance` — fetch from money service |
| Bills | List, add, update, delete, OCR submit, adjustments |
| Trigger | `runTriggerTask` — invoke `dashboard-pay-bill` and audit tasks |
| Charge Accounts | `createChargeAccount`, batch lookup |
| Savings Adjustments | Community solar tracking CRUD |

### Admin UI Components

| Component | Purpose |
|-----------|---------|
| `ProviderGroupedPaymentsTable` | Payments by provider with summary stats |
| `RefundModal` | Process refunds (max validation, currency masking) |
| `ConflictResolutionPanel` | Resolve remittance conflicts |
| `ReconcileRemittancesModal` | Reconcile from unpaid list |
| `SetOutstandingBalanceModal` | Override outstanding balance |
| `BillDetailPanel` / `BillAdjustmentModal` / `BillCreditsSection` | Bill management |

---

## Test Data & Recipes

### Existing Test Users (Payment)

| Email | Type | Charge Accounts | Notes |
|-------|------|-----------------|-------|
| `pgtest+reminder001@joinpublicgrid.com` | Billing, auto-pay OFF | Separate (SDGE + ComEd) | Payment reminder testing |
| `pgtest+reminder002@joinpublicgrid.com` | Billing, auto-pay OFF | Single (SDGE + SDGE) | Payment reminder testing |
| `pgtest+tc043@joinpublicgrid.com` | Billing, auto-pay OFF | Separate (SDGE + SCE) | Payment reminder testing |
| `pgtest+tc021v2@joinpublicgrid.com` | Billing, auto-pay OFF | Gas only (SCE) | Payment reminder testing |
| `butch+billstest001@onepublicgrid.com` | Billing, ACTIVE | ConEd, 6 bills | Subscription + bill testing |
| `pgtest+sub-q6scfo@joinpublicgrid.com` | Billing | — | No-PM subscription emails |
| `pgtest+subsrace01@joinpublicgrid.com` | Billing | — | Race condition testing |
| `pgtest+nonbilling1006@joinpublicgrid.com` | Non-billing | — | Non-billing subscription |

**Password**: `PG#Test2026!` (pgtest+ users) or `PG#12345` (legacy)

### Bill Insertion Recipe

```sql
-- Insert an approved electric bill (amounts in cents)
INSERT INTO "ElectricBill" (
  "electricAccountID", "totalAmountDue", "totalUsage",
  "startDate", "endDate", "dueDate", "statementDate",
  "ingestionState", "opsVerdict", "visible"
) VALUES (
  <ea_id>, 15000, 500.00,
  '2026-03-01', '2026-03-31', '2026-04-15', '2026-04-01',
  'approved', 'good', true
);
```

Then wait for `balance-ledger-batch` cron (*/5 in dev) to process.

### Creating a Billing User

1. Run move-in flow with `?shortCode=autotest` (has `isHandleBilling=true`)
2. Add payment method (card or bank) during onboarding
3. Verify: `ElectricAccount.maintainedFor IS NOT NULL`
4. Insert approved bill → wait for cron → verify bill becomes `processed`

### Pay-Then-Insert Cycle

1. Pay all outstanding bills via UI
2. Insert new approved bill
3. Wait ~7 min for Inngest cron cycle (ledger batch + capture batch)
4. Verify DB: `ingestionState = 'processed'`, `Payment.paymentStatus = 'succeeded'`
5. Reload page and test

---

## Key Constants

| Constant | Value | Location |
|----------|-------|----------|
| `STRIPE_MINIMUM_PAYMENT_AMOUNT` | 100 (cents = $1.00) | `services/packages/billing/stripe/const.ts` |
| Minimum payment (FE) | $1.00 | `cottage-nextjs schemas.ts` |
| Card fee | $0.30 + 3% | `FeeStructure` table (id=1) |
| Bank fee | $0.00 | No fee structure applied |
| Auto-pay delay (prod) | Until 12:00 PM ET next day | `services billing/utils/wait.ts` |
| Auto-pay delay (dev) | 1 minute | Same file |
| Ledger batch cron (dev) | `*/5 * * * *` | Every 5 minutes |
| Ledger batch cron (prod) | `50 */3 * * *` | Every 3 hours at :50 |
| Capture batch cron (dev) | `*/5 * * * *` | Every 5 minutes |
| Capture batch cron (prod) | `0 * * * *` | Hourly |
| Reminder cron (prod) | `0 11 * * *` | 11 AM ET |
| Sub generation cron (prod) | `0 13 * * *` | 1 PM ET |
| Sub payment cron (prod) | `0 15 * * *` | 3 PM ET |
| Offboarding threshold | 25 days overdue | Reminder pipeline |
| Duplicate detection window | 5 days | Subscription payment |
| 3DS verification timeout | 10 minutes | Frontend `use3DSVerification` |

---

## Known Behaviors & Edge Cases

### Billing vs Non-Billing

- **Billing user**: `maintainedFor IS NOT NULL` → bills processed, payments created, remittances generated
- **Non-billing user**: `maintainedFor IS NULL` → bills stay `approved`/`viewable` forever, no payment processing

### Single vs Separate Charge Accounts

- **Single**: Electric + gas from same company → one ChargeAccount → one payment covers both
- **Separate**: Different companies → two ChargeAccounts → user can pay each separately (canPaySeparately=true)
- **Exception**: EVERSOURCE and NGMA always get separate charge accounts regardless of config

### Flex Users

- `isFlexCustomer = true` on CottageUsers
- Get bill notifications but payment handled by GetFlex (bill splitting via getflex.com)
- Auto-pay not processed for Flex users
- "Pay in Full" option available if Flex enabled + outstanding balance

### Legacy System

- `Payments` + `Charges` tables frozen since July 2025
- All new payments use `Payment` table + Blnk ledger
- Some users may still have legacy payment history

### Blnk Amount Discrepancy

- `Payment.amount` = **cents** (integer)
- `blnk.transactions.amount` = **dollars** (numeric)
- Always verify correct unit when checking across tables

### Property-Level Offboarding Override

If ANY charge account on a property is 25+ days overdue, ALL accounts stay `NEEDS_OFF_BOARDING` — even if some are current. Exception: EVERSOURCE and NGMA processed individually.

### Community Solar Cap

Payment amount may be reduced by community solar offset. `SavingsAdjustment` tracks this per bill. `UtilityRemittance` can have `adjustmentType = 'COMMUNITY_SOLAR_OFFSET'`.

---

## Complete BLNK Transaction Catalog

Every BLNK transaction type in the system, listed by when it's created.

### Bill Ingestion

| Reference | Description | Source | Dest | Inflight? | When |
|-----------|-------------|--------|------|-----------|------|
| `{billType}-bill-{billId}` | `"{companyId} {billType} {date} [{usage} {unit}]"` | `@{companyId}` | `ledgerBalanceID` | No | Bill processed |

### Bill Payment

| Reference | Description | Source | Dest | Inflight? | When |
|-----------|-------------|--------|------|-----------|------|
| `{utilityType}_{paymentID}` | `"Customer Balance ({type}) to Stripe"` | `ledgerBalanceID` | `@Stripe` | **Yes** | Payment prepared |
| `transaction_fee_{paymentID}` | `"Stripe Fees to Stripe"` | `@StripeFees` | `@Stripe` | **Yes** | Payment prepared (if fee > 0) |
| `remittance_{paymentID}` | `"Remittance for payment {paymentID}"` | `@Stripe` | `@RemittancePool` | No | Payment succeeded |
| `fee_transfer_{paymentID}` | `"Fee transfer for payment {paymentID}"` | `@Stripe` | `@StripeFees` | No | Payment succeeded |

### Subscription

| Reference | Description | Source | Dest | Inflight? | When |
|-----------|-------------|--------|------|-----------|------|
| `subscription-{subId}-{YYYY-MM-DD}` | `"Subscription Metadata for Subscription: {id} on: {date}"` | `@SubscriptionDues` | `sub.ledgerBalanceID` | **Yes** | Generation phase |
| `subscription-payment-{paymentID}` | `"Subscription Payment for ID: {id} and Payment ID: {paymentID}"` | `sub.ledgerBalanceID` | `@Stripe` | **Yes** | Payment phase |

### Flex

| Reference | Description | Source | Dest | Inflight? | When |
|-----------|-------------|--------|------|-----------|------|
| `flex_{flexPaymentID}_{chargeAccountID}` | `"Flex payment {flexPaymentID}"` | `ledgerBalanceID` | `@Flex` | No | Flex payment success |
| `flex_checkout_{paymentID}_{chargeAccountID}` | `"Flex checkout payment {paymentID}"` | `ledgerBalanceID` | `@Flex` | **Yes** (1-day expiry) | Flex checkout |
| `flex_remittance_{paymentID}` | `"Flex remittance for payment {paymentID}"` | `@Flex` | `@RemittancePool` | No | Flex payment success |

### Adjustments

| Reference | Description | Source | Dest | Inflight? | When |
|-----------|-------------|--------|------|-----------|------|
| `adjustment_{billType}_bill_{billID}_{ts}` | `"Credit adjustment: {reason}"` | `ledgerBalanceID` | `@AdjustmentsAbsorbed` | No | Post-ingestion credit |
| `adjustment_{billType}_bill_{billID}_{ts}` | `"Fee adjustment: {reason}"` | `@AdjustmentsAbsorbed` | `ledgerBalanceID` | No | Post-ingestion fee |
| `pre_ingestion_remittance_{billType}_bill_{billID}_{ts}` | `"Pre-ingestion remittance for adjustments: {reason}"` | Varies | Varies | No | Pre-ingestion adj with remittance |
