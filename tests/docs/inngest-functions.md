# Inngest Functions Reference

Known Inngest functions in the `services` repo, their event names, eligibility criteria, and how to trigger them in dev for testing.

## How to Trigger in Dev

All dev triggers use the `INNGEST_EVENT_KEY` from `.env` (routes to the `pg-payments` app):

```bash
source .env
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "<event-name>", "data": {}}'
```

**Important**:
- Inngest API always returns 200 — doesn't mean a function handled the event
- Event names must match exactly (case-sensitive)
- In production, most functions are cron-triggered — only manually invocable via Inngest dashboard
- This event key routes to `pg-payments` (services). FE Inngest functions (`public-grid` app) need a separate key

## How to Read Function Source

When GitHub MCP returns 404, use the CLI:

```bash
gh api repos/Cottage-Energy/services/contents/<path> --jq '.content' | base64 -d
```

Example:
```bash
gh api repos/Cottage-Energy/services/contents/packages/inngest/functions/onboarding/touchpoints.ts --jq '.content' | base64 -d
```

## Functions — pg-payments App (services repo)

### Subscription & Billing

| Function ID | Event Name (dev) | Prod Trigger | Source Path |
|-------------|-----------------|--------------|-------------|
| `trigger-transaction-generation` | `transaction-generation-trigger` | Cron: `0 13 * * *` EST | `packages/inngest/functions/subscriptions/generation/trigger.ts` |
| `trigger-subscriptions-payment` | `subscriptions-payment-trigger` | Cron: `0 15 * * *` EST | `packages/inngest/functions/subscriptions/payment/trigger.ts` |
| `process-subscription-transaction` | `subscription.transaction.generate` | Fan-out from trigger | `packages/inngest/functions/subscriptions/generation/` |
| `process-subscription-payment` | `subscription.payment.process` | Fan-out from trigger | `packages/inngest/functions/subscriptions/payment/` |

**Eligibility for transaction-generation**:
- `ElectricAccount.status` must be `ACTIVE`
- `SubscriptionConfiguration.dayOfMonth` must match today's date
- `Subscription.startDate` must be at least 1 billing cycle in the past
- Building must have `offerRenewableEnergy = true` and utility linked to a `SubscriptionConfiguration`

**Eligibility for subscriptions-payment**:
- `SubscriptionMetadata` must exist with `status = 'pending'`

### Ledger Payment Reminders

| Function ID | Event Name (dev) | Prod Trigger | Source Path |
|-------------|-----------------|--------------|-------------|
| `trigger-ledger-payment-reminders` | `ledger.payment.reminders` | Cron: `0 11 * * *` TZ=America/New_York | `packages/inngest/functions/billing/ledger/reminders/trigger.ts` |
| `batch-process-ledger-reminders` | `ledger.batch.reminders.process` | Fan-out from trigger | `packages/inngest/functions/billing/ledger/reminders/batch-process.ts` |
| `batch-ledger-payment-reminders` | `ledger.batch.reminders.send` | Fan-out from batch-process | `packages/inngest/functions/billing/ledger/reminders/batch.ts` |

**Pipeline**: `trigger` → batches users (20 per batch) → `batch-process` (fetches bills, balances, groups by property) → `batch` (filters inactive, calculates delinquency, sends reminders)

**Eligibility**:
- `ElectricAccount.maintainedFor` IS NOT NULL (billing user)
- Active charge account with outstanding BLNK ledger balance
- Bill `dueDate` must be 5+ days in the past for standard reminders

**Reminder thresholds** (configured in `billThresholds.ts`):
- Days 5–15: `standard` — email every 5 days, text every 5 (EIN) or 7 (non-EIN) days
- Days 16–24: `shutoff_warning` — email daily, text every 3 days (EIN) or day 21 only (non-EIN)
- Day 25+: `final_shutoff` — one-time email + text, flags accounts for offboarding

**ENG-2466 fix (PR #310, 2026-03-27)**: Replaced N+1 per-account queries (~180-240 per batch) with bulk `getAccountStatuses()` pre-fetch + chunked bill retrieval (batches of 25 property IDs). `calculateDelinquency` is now synchronous.

**Dev-only email filter**: Trigger function accepts `data.emails` array to target specific users instead of processing all billing users. Example: `{"name": "ledger.payment.reminders", "data": {"emails": ["user@example.com"]}}`

**Known issue (ENG-2570)**: On single charge accounts (same company for electric + gas), gas-only overdue does NOT trigger NEEDS_OFF_BOARDING. Electric-only overdue offboards both. Separate charge accounts handle each utility independently.

### Offboarding Reconciliation

| Function ID | Event Name (dev) | Purpose |
|-------------|-----------------|---------|
| `trigger-accounts-offboarding-reconciliation` | `trigger.accounts.offboarding.reconciliation` | Scans NEEDS_OFF_BOARDING accounts; if outstanding balance is paid, restores status to ACTIVE |

**Timing**: Takes ~5-15 min to process after payment succeeds. Can be triggered via event API or Inngest dashboard Invoke.
**Behavior**: Only reconciles accounts where the balance is fully resolved. Partial payment reconciles only the paid charge account — unpaid accounts stay NEEDS_OFF_BOARDING.

### Bill Processing & Payments (Cron-only — NOT event-triggerable)

| Function ID | Cron Schedule | Purpose |
|-------------|--------------|---------|
| `balance-ledger-batch` | `*/5 * * * *` TZ=America/New_York | Processes approved bills → `ingestionState = 'processed'`, recalculates balances, creates Payment in `requires_capture` |
| `stripe-payment-capture-batch` | `*/5 * * * *` | Captures payments in `requires_capture` status → `succeeded` |
| `balance-ledger-application` | Event: `balance-ledger.application` | Applies individual ledger entries (fan-out from batch) |

**Critical**: These cron functions CANNOT be triggered via the event send API (`inn.gs/e/`). The API returns 200 but no function runs. To invoke manually, use the Inngest dashboard "Invoke" button.

**Bill processing pipeline** (sequential — each step requires a `*/5` cron cycle):
1. Insert bill with `ingestionState = 'approved'` (or insert then approve)
2. `balance-ledger-batch` processes bill → `ingestionState = 'processed'`, creates Payment in `requires_capture`
3. `stripe-payment-capture-batch` captures payment → `succeeded`
4. Only then can the next approved bill be processed by the next `balance-ledger-batch` run
5. For N bills: worst case ~N × 10 minutes (2 cron cycles per bill)

**Eligibility for balance-ledger-batch**:
- `ElectricAccount.maintainedFor` IS NOT NULL (billing user — chose "Public Grid handles everything" during move-in)
- Bill `ingestionState = 'approved'`
- No pending payment in `requires_capture` for the same ChargeAccount (sequential processing)

### Onboarding Emails

| Function ID | Event Name (dev) | Prod Trigger | Source Path |
|-------------|-----------------|--------------|-------------|
| `preparing-for-move` | `preparing-for-move` | Cron: `0 9 * * *` EST | `packages/inngest/functions/onboarding/touchpoints.ts` |

**Eligibility for preparing-for-move**:
- `ElectricAccount.status` in: `PENDING_FIRST_BILL`, `ACTIVE`, `LINK_ONLINE_ACCOUNT`, `CREATE_ONLINE_ACCOUNT`
- `dayjs().diff(startDate, 'day') === -1` — startDate must be ~24-48 hours away (+2 calendar days)
- **Batch function**: processes ALL qualifying accounts, not per-user
- **dayjs gotcha**: `diff('day')` truncates partial days toward zero. At 9 AM EST, +2 calendar days is the qualifying window.

**Data used**: `Property.unitNumber`, `Address.{street, city, state, zip, country}`, `ElectricAccount.{maintainedFor, startDate, status}`, `Resident.firstName`

**Email template**: `packages/mail/emails/onboarding/preparing-for-move.tsx`
- With unit: `{street} {formatUnitNumber(unit)}, {city}, {state} {zip}, {country}`
- Without unit: `{street}, {city}, {state} {zip}, {country}`
- Billing users (`maintainedFor` set) see "Quick Reminder — What is Public Grid?" section

See also: `tests/docs/preparing-for-move-touchpoint.md` for full testing guide.

### Registration

| Function ID | Event Name (dev) | Prod Trigger | Source Path |
|-------------|-----------------|--------------|-------------|
| `start-finish-reg-chain` | `registration/start-finish-reg-chain` | Event | `packages/inngest/functions/registration/` |
| `send-finish-reg-reminder` | `registration/send-finish-reg-reminder` | Event (from chain) | `packages/inngest/functions/registration/` |

### Generic Email

| Function ID | Event Name (dev) | Source Path |
|-------------|-----------------|-------------|
| `send-email` | `email.send` | `packages/inngest/functions/mailing/index.ts` |

Supports email types: `preparing-for-move`, `bill-payment-failed`, `setup-error`, and others via the `emailType` property in the event payload.

### Payment Processing

| Function ID | Event Name (dev) | Source Path |
|-------------|-----------------|-------------|
| `payment-failed-process` | `payment.failed.process` | `packages/inngest/functions/billing/` |
| `payment-success-process` | `payment.success.process` | `packages/inngest/functions/billing/` |

### OCR & Remittance

| Function ID | Event Name (dev) | Prod Trigger | Source Path |
|-------------|-----------------|--------------|-------------|
| `ocr-bill` | `ocr.bill` | Event | `packages/inngest/functions/ocr/` |
| `ocr-correction` | `ocr.correction` | Event | `packages/inngest/functions/ocr/` |
| `ocr-correction-batch` | N/A | Cron: `*/30 * * * *` | `packages/inngest/functions/ocr/` |
| `process-remittance-execution` | `remittance.execution.process` | Event | `packages/inngest/functions/remittance/` |
| `reconcile-remittance-executions` | `remittance.reconciliation.process` | Event | `packages/inngest/functions/remittance/` |

## Functions — public-grid App (FE / cottage-nextjs)

These are triggered internally by the FE and **cannot be triggered via the pg-payments event key**.

| Function | Event Name | Notes |
|----------|-----------|-------|
| OTP Email Not Found | `otp/email-not-found` | Inngest event payload |
| Household Invitation | `household/invitation` | Inngest event payload |
| Household Status Update | `household/status-update` | Inngest event payload |
| Cancel Account | `cancel-account` | Inngest event payload |
| Bill Upload Confirmation | `bill-upload/confirmation` | Triggered via `/api/bill-upload/send-confirmation-email` after successful bill upload. Payload: `{ email, firstName?, type: 'join-public-grid' \| 'verify-only' }`. Two trigger points: `page.tsx` (new user, always `join-public-grid`) and `use-bill-upload.ts` (authenticated user, dynamic type based on account status). Email subject: "Welcome to Public Grid! 🎉", from: `Public Grid Team <welcome@onepublicgrid.com>`. Note: `verify-only` type may be dead code — the verification upload component uses a separate path. Fixed in ENG-2398 / PR #1135. |
| Do-It-Later Notification | `do-it-later/send-notification` | Utility verification chain |
| Do-It-Later Reminder | `do-it-later/send-reminder` | Utility verification chain |
| Onboarding Flow | `onboarding/flow` | Multi-step, emailType-driven |
| Doc Upload Required | `registration/doc-upload` | isDocUploadRequired building |

**To test FE Inngest functions**: Run the corresponding e2e flow (move-in, sign-in with unknown email, etc.) rather than triggering events directly. Alternatively, get the FE event key from the Inngest dashboard.

## Email Verification Pattern

After triggering any email-related Inngest function:

1. **Wait ~45 seconds** for processing + delivery
2. **Check via Fastmail JMAP** (Node.js):
   ```javascript
   filter: {
     to: 'pgtest+<user>@joinpublicgrid.com',
     after: new Date(Date.now() - 5*60*1000).toISOString()
   }
   ```
3. **For screenshots**: Save email HTML → serve via local HTTP server → Playwright MCP screenshot (file:// URLs are blocked)
4. **For negative tests** (email NOT sent): Same check, assert 0 emails found

## Maintenance

This doc should be updated whenever:
- A new Inngest function is discovered during test planning or exploratory testing
- Eligibility criteria change (PR modifies the function's filter logic)
- New event names are confirmed
- A function moves between apps or changes trigger type
