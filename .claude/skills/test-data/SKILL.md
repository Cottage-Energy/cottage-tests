---
name: test-data
description: Set up test data for specific scenarios — recipes for billing users, subscriptions, bills, and account states
user-invocable: true
---

# Test Data Setup

Utility skill for creating and managing test data. Called by other skills (`/create-test`, `/exploratory-test`, `/run-tests`) or standalone.

## Usage

Tell me what you need: "billing user with processed bills", "non-billing move-in", "connect-ready user", etc. I'll set it up using the real system pipeline where possible.

---

## Recipes

### 1. Billing User (standard move-in)
Creates a user via the billing move-in path with Stripe payment method.

**Steps:**
1. `mcp__playwright__browser_navigate` to `https://dev.publicgrid.energy/move-in?shortCode=autotest`
2. Intercept `mi-session/start` to prevent auto-redirect
3. Walk through move-in: address → about you → identity → payment (Stripe `4242424242424242`) → confirmation
4. **Result**: user with `maintainedFor IS NOT NULL`, payment method on file

**Key flags set:** `ElectricAccount.maintainedFor` populated, `Resident.isRegistrationComplete = true`

**Variants:**
- `shortCode=pgtest` → encourage conversion flow (address-first)
- `shortCode=txtest` → TX dereg flow
- Non-billing: select "I will manage payments myself" → `maintainedFor = null`

### 2. Active Account (ready for subscriptions/bills)
Takes an existing user and activates their account for backend processing.

**Steps via Supabase:**
```sql
-- Activate electric account
UPDATE "ElectricAccount" SET "status" = 'ACTIVE', "isActive" = true, "registrationJobCompleted" = true
WHERE "cottageUserID" = '<user-id>';

-- Ensure registration complete
UPDATE "Resident" SET "isRegistrationComplete" = true
WHERE "cottageUserID" = '<user-id>';
```

### 3. User with Processed Bills
Requires: billing user (Recipe 1) + active account (Recipe 2).

**Steps:**
1. Insert bill: `INSERT INTO "ElectricBill" (...) VALUES (...)` with `"ingestionState" = 'approved'`
2. Wait for `balance-ledger-batch` cron (~5 min) — poll: `SELECT "ingestionState" FROM "ElectricBill" WHERE "id" = '<id>'`
3. Bill becomes `processed`, Payment created in `requires_capture`
4. Wait for `stripe-payment-capture-batch` cron (~5 min) — Payment becomes `succeeded`
5. **Pipeline is sequential** — next bill can only process after current one completes

**Shortcut for FE-only tests:** First bill through real pipeline, then set remaining bills directly to `processed` via SQL.

### 4. Subscription-Ready User
Requires: billing user + active account + subscription config alignment.

**Steps via Supabase:**
```sql
-- Set subscription day to today
UPDATE "SubscriptionConfiguration" SET "dayOfMonth" = EXTRACT(DAY FROM NOW())
WHERE "id" = '<config-id>';

-- Set subscription start date to past (at least 1 billing cycle)
UPDATE "Subscription" SET "startDate" = NOW() - INTERVAL '2 months'
WHERE "id" = '<sub-id>';
```

**Trigger processing:**
```bash
source .env; curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "transaction-generation-trigger", "data": {}}'
# Wait ~30s, then:
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "subscriptions-payment-trigger", "data": {}}'
```

### 5. Connect-Ready User
User with a connect-enabled utility company.

**Prerequisites:** Utility must have `isConnectReady = true`. Only 3 in dev: Con Edison, ComEd, National Grid MA.

**Steps:**
1. Create user via move-in with an address served by a connect-ready utility (e.g., zip `12249` for Con Edison)
2. Verify: `SELECT "isConnectReady" FROM "UtilityCompany" WHERE "id" = '<utility-id>'`

### 6. Multi-Property User
User with 2+ properties (lands on `/app/summary` instead of `/app/overview`).

**Steps:**
1. Create user via move-in (first property)
2. Insert second property via Supabase or run a second move-in flow with same email

### 7. Feature Flag Manipulation
Toggle DB flags for test scenarios. **Always restore in afterEach/cleanup.**

**Common flags:**
| Table | Flag | Controls |
|-------|------|----------|
| `Building` | `isHandleBilling` | Billing vs non-billing path |
| `Building` | `offerRenewableEnergyDashboard` | Sidebar RE card |
| `Building` | `offerRenewableEnergy` | Move-in RE option |
| `Building` | `shouldShowDemandResponse` | GridRewards recommendation |
| `UtilityCompany` | `offerRenewableEnergy` | RE resolution |
| `UtilityCompany` | `subscriptionConfigurationID` | Links to pricing config |
| `CottageUsers` | `enrollmentPreference` | null/verification_only/automatic/manual |

### 8. Gas-Only or Electric-Only User
Manipulate building config before move-in to control charge account structure.

**Gas-only:**
```sql
-- Save original, set electric to NULL
UPDATE "Building" SET "electricCompanyID" = NULL WHERE "shortCode" = 'autotest';
-- Run move-in via Playwright MCP (sequentially, NEVER parallel)
-- Restore after:
UPDATE "Building" SET "electricCompanyID" = 'SDGE' WHERE "shortCode" = 'autotest';
```

**Electric-only:** Same pattern but set `gasCompanyID = NULL`.

**Single charge account (both utilities):** Use a building where `electricCompanyID = gasCompanyID` (e.g., `pgtest` has both = SDGE). Exceptions: Eversource and NGMA always create separate charge accounts.

**Separate charge accounts:** Use a building where `electricCompanyID ≠ gasCompanyID` (e.g., `autotest` has SDGE + SCE).

### 9. User with Overdue Unpaid Bills (for payment reminder testing)
Requires: billing user (Recipe 1) + active account (Recipe 2) + auto-pay OFF.

**Steps:**
1. During move-in, **uncheck the auto-pay checkbox** on the payment step. Or set via DB: `UPDATE "CottageUsers" SET "isAutoPaymentEnabled" = false WHERE "id" = '<user-id>'`
2. Activate account: `UPDATE "ElectricAccount" SET "status" = 'ACTIVE' WHERE "id" = '<ea-id>'`
3. Insert bill as `approved` with overdue due date:
```sql
INSERT INTO "ElectricBill" ("electricAccountID", "totalAmountDue", "totalUsage", "startDate", "endDate", "statementDate", "dueDate", "ingestionState")
VALUES (<ea-id>, 55000, 0, '2026-02-15', '2026-03-15', '2026-03-15', '<overdue-date>', 'approved');
```
4. Wait for `balance-ledger-batch` cron (~5 min) — poll every 3 min: `SELECT "ingestionState" FROM "ElectricBill" WHERE "id" = '<id>'`
5. **NEVER insert as `processed`** — bypasses BLNK ledger, balance stays $0
6. With auto-pay OFF, `stripe-payment-capture-batch` won't auto-capture — balance stays outstanding

**Trigger reminder pipeline:**
```bash
source .env; curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "ledger.payment.reminders", "data": {"emails": ["<user-email>"]}}'
```

**Reminder thresholds:** Day 5-15 standard, day 16-24 shutoff warning, day 25+ final shutoff → NEEDS_OFF_BOARDING.

### 10. Manual Payment (via "Pay bill" UI)
For testing payment flows, reconciliation, and partial payments.

**Steps:**
1. Sign in as the user via Playwright MCP
2. Click "Pay bill" on overview
3. Modal shows:
   - **Single charge account**: "Total Amount Due", "Past Due Balance", "Other Amount"
   - **Separate charge accounts**: "Total Amount Due", "Other Amount" → expands to per-utility breakdown
4. Select amount and click "Pay bill"
5. Wait for payment processing (~15-20s)

**Trigger offboarding reconciliation after payment:**
```bash
source .env; curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "trigger.accounts.offboarding.reconciliation", "data": {}}'
```
Reconciliation takes ~5-15 min. Poll DB every 3 min to check status.

---

## Cleanup

**Always clean up test data after use:**
- `CleanUp.Test_User_Clean_Up(email)` for users created via move-in
- Restore all DB flags to original values
- Delete inserted bills/records if not cleaned by user cleanup

---

## Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | Walk through move-in flow to create users via real UI |
| **Supabase MCP** | `execute_sql` — insert/update/query test data, toggle flags, verify state |
| `Bash` | Trigger Inngest events, run curl commands |

---

## Retrospective
After completing this skill, check: did any step not match reality? Update this SKILL.md with what you learned.
