# Subscription System — Renewable Energy

## Overview

Public Grid offers a renewable energy subscription ($3.29/mo) that offsets a user's electricity usage with clean energy credits from solar and wind farms. The subscription system is property-scoped (not user-scoped) and supports both billing and non-billing users.

**Key revamp (ENG-2627, Apr 2026)**: Subscriptions are now immutable records. Cancel creates a historical entry; re-subscribe creates a new row. Impact aggregates across all subscription periods.

---

## Data Model

### Subscription Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PK |
| `startDate` | date | When subscription became active |
| `endDate` | date (nullable) | Set on cancel to last successful billing date (or startDate if no billing). NULL = active. |
| `status` | enum | `pending` → `active` → `canceled` |
| `subscriptionConfigurationID` | bigint | FK → SubscriptionConfiguration (currently only ID=1) |
| `ledgerBalanceID` | text (nullable) | BLNK ledger balance — new one per subscription row |
| `propertyID` | bigint (nullable) | FK → Property. One active sub per property. |

**Constraints:**
- `idx_subscription_property_active`: Unique partial index on `(propertyID) WHERE status = 'active'` — enforces max one active subscription per property.

### SubscriptionConfiguration Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | bigint | PK. Currently only ID=1 ("100% Clean Energy") |
| `name` | varchar | Display name (e.g., "🌎 100% Clean Energy") |
| `monthlyFee` | integer | In cents (329 = $3.29) |
| `dayOfMonth` | smallint | Day of month for billing (currently 7) |
| `notificationLeadDays` | integer | Days before billing to send renewal reminder (currently 0) |
| `shouldProrate` | boolean | Whether to prorate first month |
| `isDefaultEnabled` | boolean | Whether auto-enabled on move-in |
| `purpose` | varchar | Display purpose text |
| `type` | enum | Configuration type |

### SubscriptionMetadata Table

Tracks individual billing cycle transactions for a subscription.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | PK (auto-increment) |
| `subscriptionID` | integer | FK → Subscription |
| `dueDate` | date | When the charge is due |
| `amount` | integer | Charge amount in cents |
| `status` | enum | `pending` → `completed` or `canceled` |
| `transactionID` | integer | FK → ledger transaction |
| `purpose` | text | Description |

### RenewableEnergyAllocation Table

Monthly kWh allocation estimates per utility company — used for non-billing users' impact calculations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `utilityCompanyID` | text | FK → UtilityCompany |
| `allocationAmount` | numeric | kWh for that month (e.g., 53.56 for COMED Jan 2026) |
| `month` | integer | 1-12 |
| `year` | integer | e.g., 2026 |

**Allocation logic:** If a month has no row (or < 50 bills averaged), defaults to 500 kWh. Current month is excluded from calculations.

### Payment.contributions (JSONB)

Subscription payments store contributions linking to the subscription:

- **New format (array):** `[{ "renewableSubscriptionID": 762, "amount": 329 }]`
- **Legacy format (object):** `{ "renewableSubscriptionID": 754, "amount": 318 }` — pre-revamp, being migrated

The `getPaymentType()` function handles both formats for backward compatibility.

---

## Subscription Lifecycle

### Subscribe (New)

**Via move-in:**
1. User completes move-in on a building with `offerRenewableEnergy = true`
2. Utility setup step shows RE toggle (if building + utility both have RE enabled)
3. On registration → Subscription row created with `status = active`, `startDate = today`

**Via account page (re-subscribe or first-time):**
1. Account → Subscription tab → "Activate green energy" → "Ready to Go Green?" modal → "Sign me up!"
2. FE calls `POST /api/subscriptions/create-subscription`
3. If an active subscription already exists → **auto-cancels** the existing one first, then creates new
4. New Subscription row: new ID, new `startDate`, new `ledgerBalanceID`

### Cancel

1. Account → Subscription tab → "Manage" → "Cancel subscription"
2. FE calls services cancel endpoint → `POST /subscriptions/{id}/cancel`
3. Subscription: `status = canceled`, `endDate = most recent successful billing date` (or `startDate` if no billing)
4. Pending SubscriptionMetadata is set to `canceled` (confirmed working with Inngest-generated metadata)

### Re-subscribe

1. Same as "Subscribe via account page" — always creates a new row
2. Old canceled subscription remains as historical record
3. A property can accumulate many subscription rows over time (e.g., property 21135 has 3: sub 754, 755, 758)

---

## Subscription States (UI)

### Active State
- Heading: "You are lowering your carbon footprint every month!"
- Shows: $3.29/mon, "Subscription: Active" (green), "Next bill: May 07, 2026"
- "Manage" button → manage modal (cancel or keep)
- "Your total impact" card with kWh, CO2 lbs, trees, miles
- "Billing History" table with all payments across all subscription entries

### Inactive State (Canceled)
- Heading: "Lower your carbon footprint today!"
- "Make your energy usage 100% green" pitch with bullet points
- "Activate green energy" button + "How does it work?" link
- "Billing History" table persists showing past payments (fix PR #1172)

### Paused State (No Payment Method)
- Orange "Paused" badge
- $3.29/mon shown, "Add payment method" + "Manage" buttons
- Stripe payment sheet opens from paused state

---

## Impact Calculations

Impact aggregates across **all** subscription periods for a property (gap-aware).

### Billing Users (`maintainedFor IS NOT NULL`)
- Uses actual electric bill data from `ElectricBill` table
- `calculateImpact(bills, subscriptionPeriods)` — filters bills whose `startDate` falls within any subscription period
- No disclaimer shown

### Non-Billing Users (`maintainedFor IS NULL`)
- Uses `RenewableEnergyAllocation` table estimates
- `calculateAllocationImpact(allocations, subscriptionPeriods)` — iterates month-by-month, only counting months within active subscription periods
- Missing months gap-filled to 500 kWh
- Disclaimer: "Your renewable energy offset is an estimate based on similar homes in your area, since we don't have your actual usage data."

### Environmental Metrics (from kWh)
| Metric | Formula |
|--------|---------|
| CO2 Prevented (lbs) | `kWh × 0.4` |
| Trees Planted | `CO2 / 48` |
| Miles Not Driven | `CO2 / 2200 / 0.000391` |

### Verified Example (ENG-2442)
Property 18642 (non-billing, COMED):
- Jan 2026: 53.56 kWh (real average, ≥50 bills)
- Feb 2026: 500 kWh (default, <50 bills)
- Mar 2026: 500 kWh (gap-filled, no row)
- **Total: 1,053.56 kWh** — exact match with UI

---

## Inngest Functions (Subscription Pipeline)

### Transaction Generation

| Field | Value |
|-------|-------|
| Function | `trigger-transaction-generation` |
| Event (dev) | `transaction-generation-trigger` |
| Schedule (prod) | Cron `0 13 * * *` EST |
| App | `pg-payments` (services repo) |

**What it does:** Creates pending `SubscriptionMetadata` for each active subscription.

**Eligibility criteria:**
- `ElectricAccount.status = 'ACTIVE'`
- `SubscriptionConfiguration.dayOfMonth = today's date`
- `Subscription.startDate` at least 1 billing cycle in the past
- No existing metadata for this billing cycle
- Building has `offerRenewableEnergy = true` + utility linked to `SubscriptionConfiguration`

**Email behavior (during generation):**
- **Has payment method:** Sends renewal reminder — "Your clean energy subscription will be charged soon ☀️"
- **No payment method:** Sends payment method reminder — "Keep your clean energy subscription active" with "Add Payment Method" CTA

### Subscription Payment

| Field | Value |
|-------|-------|
| Function | `trigger-subscriptions-payment` |
| Event (dev) | `subscriptions-payment-trigger` |
| Schedule (prod) | Cron `0 15 * * *` EST |
| App | `pg-payments` (services repo) |

**What it does:** Processes pending `SubscriptionMetadata` into Stripe payments.

**Behavior:**
- Picks up all metadata with `status = pending`
- Creates Payment record with array contributions: `[{ renewableSubscriptionID, amount }]`
- Charges via Stripe

**Email behavior (during payment):**
- **Payment succeeds:** "Your Subscription Payment Confirmation"
- **Payment fails (has PM):** "Your Subscription Payment Failed"
- **No payment method:** "We couldn't process your clean energy payment" with "Update Payment Method" CTA. **Subscription stays active.**

### Duplicate Payment Detection (ENG-2440)
- `hasActiveSubscriptionPayment()` checks for existing payments within 5-day window
- Queries array format: `.contains("contributions", [{ renewableSubscriptionID: subscriptionID }])`
- `succeeded` or `processing` → blocks duplicate
- `failed` → does NOT block (allows retry)
- Per-subscription concurrency lock: `limit: 1, key: event.data.subscription.id`

---

## Email Templates

| Template | Subject | Trigger | File (services repo) |
|----------|---------|---------|----------------------|
| Renewal Reminder | "Your clean energy subscription will be charged soon ☀️" | Generation, has PM | `packages/mail/emails/subscriptions/renewal-reminder.tsx` |
| Payment Method Reminder | "Keep your clean energy subscription active" | Generation, no PM | `packages/mail/emails/subscriptions/payment-method-reminder.tsx` |
| Payment Method Missing | "We couldn't process your clean energy payment" | Payment, no PM | `packages/mail/emails/subscriptions/payment-method-missing.tsx` |
| Payment Success | "Your Subscription Payment Confirmation" | Payment succeeds | `packages/mail/emails/subscriptions/payment-success.tsx` |
| Payment Failed | "Your Subscription Payment Failed" | Payment fails | `packages/mail/emails/subscriptions/payment-failed.tsx` |

**Note (ENG-2673):** Renewal reminder email for non-billing users uses the same wording as billing users (no "estimated" disclaimer). This was confirmed as **by design** — the team decided billing and non-billing users get identical renewal email wording. The "estimated" disclaimer only appears on the FE subscription tab, not in emails.

---

## Overview Sidebar Cards

The overview page sidebar shows different cards based on subscription state:

| State | Card |
|-------|------|
| No subscription | "Go 100% renewable — $3.29/mo · X neighbors joined" recommendation card |
| Active subscription | "Renewable energy" card with kWh impact, "Manage" link, "See full impact" button |
| Paused (no PM) | Paused badge + "Add payment method" |

**Controlled by:** `Building.offerRenewableEnergyDashboard` (boolean, separate from `Building.offerRenewableEnergy` which controls the move-in toggle).

---

## Building / Utility Configuration

For subscriptions to be available, ALL of these must be true:

| Config | Table | Column | Required |
|--------|-------|--------|----------|
| Building offers RE (move-in) | `Building` | `offerRenewableEnergy` | `true` |
| Building offers RE (dashboard) | `Building` | `offerRenewableEnergyDashboard` | `true` |
| Utility has subscription config | `UtilityCompany` | `subscriptionConfigurationID` | Not NULL |
| Utility offers RE | `UtilityCompany` | `offerRenewableEnergy` | `true` |

**Known working utilities:** ComEd (has `SubscriptionConfiguration`). Duke does NOT.

---

## PG-Admin Subscription Management

### Navigation
- Search for user by name/email in PG-Admin search
- Click user name in results table → profile panel opens as inline dialog/sheet
- Panel tabs: Profile, Properties, Registration, Fastmail, Sent Mail, Actions, History
- Subscription card is within the Properties tab, inside the charge account section

### Charge Account Requirement
The subscription management card only renders for properties that have charge accounts. If a property has no charge accounts (e.g., non-billing user created without payment method), the subscription section will not be visible in PG-Admin even if the user has an active subscription.

| Property | User | Charge Accounts | Subscription Card Visible |
|----------|------|-----------------|---------------------------|
| 20043 (`subsrace01`) | `pgtest+subsrace01@joinpublicgrid.com` | Yes | Yes |
| 21135 (`cian+4apr7`) | `cian+4apr7@onepublicgrid.com` | No | No |

### PG-Admin Dialog Scroll Limitation
The user profile opens in a dialog/sheet with its own scroll container (`div.h-full.overflow-y-auto`). Standard `fullPage: true` screenshots only capture the main page scroll, NOT the dialog's inner content. To scroll within the dialog:
```javascript
document.querySelector('.h-full.overflow-y-auto').scrollTop = 500; // adjust value as needed
```
`scrollIntoView` from the main page context does not work for elements inside the dialog.

---

## SubscriptionMetadata Status Values

The `status` enum on `SubscriptionMetadata` has three values:
- `pending` — created by transaction generation, awaiting payment
- `completed` — payment processed successfully
- `canceled` — subscription was canceled before payment processed

There is no `voided` value. Test plans and assertions should use `canceled` when referring to metadata status after subscription cancellation.

---

## Test Setup Recipe

### Create a user with active subscription

1. Move-in at `autotest` building (has ComEd, `offerRenewableEnergy = true`)
2. Select "Public Grid handles everything" on payment step (billing user)
3. Complete registration
4. Sign in → Account → Subscription → "Activate green energy" → "Sign me up!"

### Trigger subscription billing cycle in dev

1. Set `ElectricAccount.status = 'ACTIVE'`
2. Set `Subscription.startDate` to 1+ month ago
3. Set `SubscriptionConfiguration.dayOfMonth` to today's date
4. Trigger: `curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" -H "Content-Type: application/json" -d '{"name": "transaction-generation-trigger", "data": {}}'`
5. Wait ~50s → check `SubscriptionMetadata` for `pending` record
6. **Restore `dayOfMonth` to 7 immediately after metadata is created** — prevents accidental billing for other subscriptions on next cron cycle
7. Trigger: `curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" -H "Content-Type: application/json" -d '{"name": "subscriptions-payment-trigger", "data": {}}'`
8. Wait ~50s → check `Payment` table for `succeeded` record with array contributions

**CRITICAL: Always use Inngest-generated metadata, never manually INSERT SubscriptionMetadata rows.** Manually inserted metadata (missing `transactionID` and other fields set by the pipeline) may not be picked up correctly by the cancel endpoint or payment trigger. ENG-2672 was initially filed based on manually inserted metadata but the cancel flow works correctly with Inngest-generated metadata.

### Test without payment method (email AC16/AC17)

1. NULL out `CottageUsers.stripePaymentMethodID` before triggering generation
2. Generation → "Keep your clean energy subscription active" email
3. Payment → "We couldn't process your clean energy payment" email
4. **Restore** payment method after testing

---

## Test Users

| Email | Property | Type | Notes |
|-------|----------|------|-------|
| `pgtest+subsrace01@joinpublicgrid.com` | 20043 | Billing, ACTIVE, ComEd, has PM | Race condition testing, renewal email, cancel lifecycle |
| `pgtest+nonbilling1006@joinpublicgrid.com` | 18642 | Non-billing, ACTIVE, ComEd, has PM | Non-billing allocation, paused state, renewal email |
| `pgtest+fun+gas00002@joinpublicgrid.com` | — | Billing, ComEd, no PM | Activate without payment method |
| `pgtest+flex-msg00@joinpublicgrid.com` | 19693 | Billing, ACTIVE, ComEd, has PM, 6 bills | Billing impact with real bills |
| `pgtest+hh-member-ac5@joinpublicgrid.com` | — | Household member (non-owner) | Cannot activate/cancel (restricted) |
| `pgtest+sub-q6scfo@joinpublicgrid.com` | 21540 | Billing, NEW, PSEG, has PM | ENG-2627: AC16/AC17 email tests |
| `cian+4apr7@onepublicgrid.com` | 21135 | Non-billing, NEW, ComEd, has PM | ENG-2627: cancel→re-subscribe (subs 754→755→758) |
| `butch+billstest001@onepublicgrid.com` | 20238 | Billing, ACTIVE, ConEd, has PM, 6 bills | Overview sidebar testing |

**Password for pgtest+ users:** `PG#Test2026!` (reset via Supabase admin API)

---

## Known Bugs

| Ticket | Severity | Status | Description |
|--------|----------|--------|-------------|
| ENG-2672 | High | Resolved (false positive) | Cancel appeared to not void pending metadata — but only with manually INSERTed metadata (no `transactionID`). Inngest-generated metadata is correctly set to `canceled` on subscription cancel. |
| ENG-2673 | Medium | Open | Non-billing renewal email missing "estimated" disclaimer |

---

## Related Tickets

| Ticket | Title | Status |
|--------|-------|--------|
| ENG-2627 | Revamped Subscriptions (immutable rows, array contributions, new emails) | Testing/QA |
| ENG-2442 | New Subscriptions Tab Design + Renewable Energy Allocation | Done |
| ENG-2440 | Subscription Payment Race Condition (5-day dedup) | Done |
| ENG-2374 | Enable subscriptions for non-billing users (Services) | Done |
| ENG-2399 | Non-billing Subscriptions (Front-end) | Done |
| ENG-2396 | Overview Sidebar Redesign | Done |

---

## Automated Test Coverage

**Current state: No subscription-specific automated tests exist.** This is a gap.

Test plans ready for automation:
- `tests/test_plans/ENG-2627_revamped_subscriptions.md` (43 cases)
- `tests/test_plans/ENG-2442_subscriptions_tab_renewable_energy.md` (45 cases)
- `tests/test_plans/ENG-2440_subscription_payment_race_condition.md` (25 cases)

Needed for automation:
- New POM: `SubscriptionPage` (active state, inactive state, manage modal, Go Green modal)
- New fixture: `subscriptionQueries` (DB helpers for subscription state manipulation)
- New test specs in `tests/e2e_tests/subscription/`
