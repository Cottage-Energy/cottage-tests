# Test Plan: Payment System — Comprehensive

## Overview
**Scope**: End-to-end payment system covering bill payments, subscription payments, payment methods, reminders, offboarding, and admin operations
**Date**: 2026-04-10 (updated 2026-04-11 with Brennan's expected state reference)
**Tester**: Christian
**Source**: cottage-nextjs, services, automations, pg-admin, Supabase schema analysis, previous exploratory sessions, `payment_system_ledger_flows.md` (Brennan)
**Reference Doc**: `tests/docs/payment-system.md`

## Summary

The payment system is the core revenue pipeline for Public Grid. It handles:
1. **Utility bill payments** — auto-pay and manual pay for electric/gas bills
2. **Subscription payments** — monthly renewable energy subscription ($3.29/mo)
3. **Payment method management** — add/update cards and bank accounts via Stripe
4. **Payment reminders** — escalating email/SMS reminders with offboarding at 25+ days
5. **Remittance** — PG paying utilities after user payments succeed

This test plan covers all payment flows across the user-facing app, backend pipeline, and admin dashboard.

## Architecture Quick Reference

```
Bill approved → balance-ledger-batch (cron) → process bills + create Blnk txn
  → auto-pay: sleep → PaymentProcessor → Stripe PaymentIntent
  → stripe-payment-capture-batch (cron) → capture
  → Stripe webhook: succeeded → remittance → automations pay utility
```

See `tests/docs/payment-system.md` for full architecture diagram.

## Repos Involved

| Repo | Role | Key Paths |
|------|------|-----------|
| `cottage-nextjs` | Frontend: pay bill modal, payment methods, billing pages | `apps/main/app/app/_features/payments/`, `apps/main/app/app/billing/` |
| `services` | Backend: Inngest pipeline, Stripe webhooks, ledger, reminders | `packages/inngest/functions/billing/`, `packages/billing/stripe/` |
| `automations` | Remittance execution: Playwright bots pay utility sites | `trigger/automations/nightlyPayBills.ts`, `src/modules/paymentManager.ts` |
| `pg-admin` | Admin: remittance mgmt, refunds, bill inbox | `services/remittances/`, `services/payments/` |

## Existing Test Coverage

| Area | Location | Status | Notes |
|------|----------|--------|-------|
| Auto-pay (card) — 8 utilities | `tests/e2e_tests/payment/auto-payment/auto_pay_successful_payment.spec.ts` | Active | Single + multiple charge accounts |
| Auto-pay (bank) — 8 utilities | Same file | Active | Bank account variants |
| Auto-pay failed + recovery | `auto_pay_failed_payment.spec.ts` | `.fixme()` | Disabled — needs fix |
| Manual pay (card) — 6 utilities | `manual-payment/manual_pay_successful_payment.spec.ts` | Active | Card + bank |
| Manual pay (bank) — 6 utilities | Same file | Active | |
| Manual pay failed + recovery | `manual_pay_failed_payment.spec.ts` | `.fixme()` | Disabled — needs fix |
| Load test — 6 utilities x 100 | `payment_load_test.spec.ts` | Active | Stress test |
| Subscription lifecycle | Exploratory only | No spec | ENG-2627 session |
| Payment reminders | Exploratory only | No spec | ENG-2466 session |
| Offboarding reconciliation | Exploratory only | No spec | ENG-2466 session |

### Gaps Identified

1. **No automated subscription payment tests** — only exploratory sessions
2. **Failed payment specs disabled** (`.fixme()`) — need investigation and fix
3. **No payment method management tests** — add/update card, add/update bank, 3DS verification
4. **No billing page UI tests** — outstanding balance display, bill history, payment history tabs
5. **No payment alert tests** — overdue balance alert, payment failed alert
6. **No autopay enable/disable tests** — toggle flow, autopay-then-pay-now modal
7. **No Flex payment tests** — Flex customer bill splitting, pay-in-full option
8. **No Light portal billing tests** — separate payment system for LightUsers
9. **No move-in payment setup tests** — onboarding payment method selection
10. **No multi-charge-account "Other Amount" tests** — separate utility payment
11. **No negative/boundary tests** — below minimum, above balance, zero amount
12. **No fee calculation verification** — 3% card fee, 0% bank fee display/accuracy
13. **No offboarding/delinquency automated tests** — 25+ day overdue scenarios
14. **No admin payment operations tests** — refunds, remittance management
15. **No bill adjustment/credit tests** — pre/post-ingestion adjustments, PG_PAYS vs OVERPAYMENT credits, paid-by-user scenarios
16. **No BLNK void failure tests** — edge case where void fails → `processing` status, `VoidOperations` record
17. **No auto-pay re-validation tests** — user disables auto-pay during sleep, user becomes Flex, payment already captured
18. **No Flex payment success/reconciliation tests** — `@Flex` ledger path, `allow_overdraft=false`, 15-min reconciliation cron

---

## Test Cases

### 1. Manual Payment — Happy Path

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| MP-001 | Pay total amount due with credit card | Billing user with approved+processed bill, outstanding balance > $1, valid card on file | 1. Navigate to /app/billing 2. Click "Pay bill" 3. Select "Total Amount Due" 4. Click "Pay" 5. Wait for success | Payment succeeds. Balance → $0. Payment record: `succeeded`. Bill history shows payment. Success email sent. | P0 | @smoke | Yes |
| MP-002 | Pay total amount due with bank account | Billing user with outstanding balance, valid bank account | Same as MP-001 but with bank account | Payment succeeds. No transaction fee. Payment status → `processing` initially (ACH delay). | P0 | @regression1 | Yes |
| MP-003 | Pay past due balance only | Billing user with overdue balance, `canPaySeparately=false` | 1. Open pay bill modal 2. Select "Past Due Balance" 3. Pay | Only overdue amount charged. Remaining current balance still outstanding. | P1 | @regression1 | Yes |
| MP-004 | Pay other amount — electric only | Billing user with separate charge accounts (different utilities) | 1. Open pay bill modal 2. Select "Other Amount" 3. Enter electric amount, leave gas at $0 4. Pay | Only electric charge account payment created. Gas balance unchanged. | P1 | @regression1 | Yes |
| MP-005 | Pay other amount — gas only | Same as MP-004 | Enter gas amount only | Only gas charge account payment created. Electric balance unchanged. | P1 | @regression1 | Yes |
| MP-006 | Pay other amount — both utilities custom amounts | Same as MP-004 | Enter custom amounts for both | Two contributions in Payment record. Both balances reduced correctly. | P1 | @regression2 | Yes |
| MP-007 | Manual pay with single charge account (electric + gas same company) | Billing user, single charge account | Open pay bill, see single total, pay | One payment covering both utilities. `canPaySeparately=false`. | P1 | @regression1 | Yes |

### 2. Manual Payment — Validation & Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| MP-010 | Minimum payment validation ($1.00) | Outstanding balance > $1 | Enter $0.50 in "Other Amount" | Validation error: minimum $1.00. Pay button disabled. | P1 | @regression2 | Yes |
| MP-011 | Cannot exceed outstanding balance | Outstanding balance = $150 | Enter $200 in "Other Amount" | Validation error: exceeds outstanding. Pay button disabled. | P1 | @regression2 | Yes |
| MP-012 | Zero amount rejected | Outstanding balance > 0 | Enter $0 | Validation error. At least one utility must have amount > 0. | P2 | @regression3 | Yes |
| MP-013 | Pay bill button disabled when no balance | No outstanding balance | Navigate to billing page | "Pay bill" button not visible or disabled. | P1 | @regression1 | Yes |
| MP-014 | Pay bill button visible when balance exists | Outstanding balance > 0 | Navigate to billing page | "Pay bill" button visible and enabled. | P0 | @smoke | Yes |
| MP-015 | Transaction fee displayed for card payment | Card payment method, outstanding $100 | Open pay bill modal | Fee shows: "$3.30" (3% + $0.30). Total shows: "$103.30". | P1 | @regression2 | Yes |
| MP-016 | No transaction fee for bank payment | Bank account payment method | Open pay bill modal | No fee displayed. Total equals bill amount. | P1 | @regression2 | Yes |
| MP-017 | Payment with expired/invalid payment method | `paymentMethodStatus = INVALID` | Try to pay | Error state. Prompted to update payment method. | P1 | @regression2 | Yes |

### 3. Manual Payment — 3DS Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| MP-020 | 3DS verification — successful | Card requiring 3DS | 1. Pay bill 2. 3DS iframe appears 3. Complete verification | Payment succeeds after 3DS. postMessage received. Status → `succeeded`. | P1 | @regression2 | No (manual) |
| MP-021 | 3DS verification — failed | Card requiring 3DS | 1. Pay bill 2. 3DS iframe appears 3. Fail verification | Payment fails. Error message displayed. | P2 | @regression3 | No (manual) |
| MP-022 | 3DS verification — timeout (10 min) | Card requiring 3DS | 1. Pay bill 2. 3DS iframe appears 3. Wait 10+ minutes | Timeout state reached. User prompted to retry. | P3 | @regression4 | No (manual) |

### 4. Auto-Payment

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| AP-001 | Auto-pay processes after bill approval (electric only) | Billing user, auto-pay ON, valid card, electric-only | 1. Insert approved electric bill 2. Wait for ledger batch cron 3. Wait for capture batch cron | Bill `ingestionState` → `processed`. BLNK bill txn (`electric-bill-{id}`) → `applied`. Payment created with `paymentStatus = "scheduled_for_payment"` → `"requires_capture"` → `"succeeded"`. BLNK payment txn (`electric_{paymentID}`) → `applied`. `remittance_{paymentID}` created. UtilityRemittance → `ready_for_remittance`. `"bill-paid"` email sent. | P0 | @smoke | Yes |
| AP-002 | Auto-pay with electric + gas (single charge account) | Billing user, single charge account, auto-pay ON | Insert approved electric + gas bills | Both bills processed. Single payment with combined amount. | P0 | @regression1 | Yes |
| AP-003 | Auto-pay with electric + gas (separate charge accounts) | Billing user, separate charge accounts | Insert approved electric + gas bills | Both processed. Separate payments per charge account. | P1 | @regression1 | Yes |
| AP-004 | Auto-pay with bank account | Billing user, auto-pay ON, bank account | Insert approved bill, wait for pipeline | Payment created. Status may stay `processing` longer (ACH). | P1 | @regression1 | Yes |
| AP-005 | Auto-pay disabled — bill processed but no payment | Billing user, auto-pay OFF | Insert approved bill, wait for pipeline | Bill → `processed`. No Payment record created. Bill notification email sent. | P1 | @regression2 | Yes |
| AP-006 | Auto-pay with invalid payment method | Billing user, auto-pay ON, `paymentMethodStatus = INVALID` | Insert approved bill, wait | Auto-pay disabled during processing. `paymentMethodStatus` stays `INVALID`. "Update Payment Method" email sent. | P1 | @regression2 | Yes |
| AP-007 | Auto-pay — first bill triggers SMS | Billing user, first bill ever | Insert first approved bill | Bill notification via email AND SMS. | P2 | @regression3 | No (verify SMS) |
| AP-008 | Auto-pay — Flex user skips auto-pay | Billing user, `isFlexCustomer = true` | Insert approved bill | Bill notification sent. No auto-pay. Payment handled by Flex. | P2 | @regression3 | Yes |
| AP-009 | Auto-pay timing — dev: 1 min delay | Dev environment | Insert bill, monitor timing | Auto-pay fires ~1 min after bill processing (not immediately). | P3 | @regression4 | No (timing) |

### 5. Auto-Payment — Failed Payment

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| AP-020 | Failed card payment — recoverable | Auto-pay user with `4000 0000 0000 0341` card | Insert bill, wait for pipeline | Payment `paymentStatus = "failed"`. BLNK inflight txn (`{utilityType}_{paymentID}`) → `void`. BLNK balance: `inflight_balance` restored (debit reversed). `isAutoPaymentEnabled` unchanged (stays true). `paymentMethodStatus` unchanged. `"bill-payment-failed"` email with error details. No UtilityRemittance created. | P0 | @regression1 | Yes |
| AP-021 | Failed payment — non-recoverable (confirm_card_data) | Simulated non-recoverable decline | Trigger payment failure | `paymentStatus = "failed"`. BLNK txn → `void`. `isAutoPaymentEnabled = false`. `paymentMethodStatus = "INVALID"`. `"update-payment-method"` email sent. Additional Slack alert about auto-pay disabled. | P1 | @regression2 | Yes |
| AP-022 | Failed bank payment (always non-recoverable) | Bank account, payment fails | Trigger bank payment failure | Same as AP-021 — bank failures are always non-recoverable. Auto-pay disabled, PM `INVALID`, update email sent. | P1 | @regression2 | Yes |
| AP-023 | Failed payment recovery — update card and pay | User with failed payment, auto-pay disabled | 1. Update payment method to valid card 2. Wait for reconciliation or manual pay | New payment method attached. Can manually pay or wait for auto-pay reconciliation. | P1 | @regression2 | Yes |
| AP-024 | Slack alert on payment failure | Any payment failure | Check Slack channel | Alert posted to `{stage}-operations-alerts`. | P2 | @regression3 | No (manual) |
| AP-025 | Void failure edge case — BLNK void fails | Payment fails but BLNK void call errors | Trigger payment failure where BLNK is unreachable | `Payment.paymentStatus = "processing"` (NOT "failed"). `VoidOperations` record created with error. Slack alert to `{stage}-payment-alerts`. Requires manual resolution. | P1 | @regression2 | No (Inngest) |
| AP-026 | Auto-pay re-validation — user disabled auto-pay during sleep | Auto-pay user, insert bill, disable auto-pay during 1-min sleep | 1. Insert bill 2. Wait for Payment to be created (`scheduled_for_payment`) 3. Set `isAutoPaymentEnabled = false` 4. Wait for re-validation | Payment `paymentStatus = "canceled"`. BLNK txn → `void`. No Stripe charge. | P2 | @regression3 | No (timing) |
| AP-027 | Auto-pay re-validation — user became Flex during sleep | Auto-pay user, insert bill, set `isFlexCustomer = true` during sleep | Same pattern as AP-026 but set Flex flag | Payment `paymentStatus = "failed"`. BLNK txn → `void`. | P2 | @regression3 | No (timing) |
| AP-028 | Auto-pay 3DS — auto-pay fails immediately | Card requiring 3DS, auto-pay user | Insert bill, wait for pipeline | Payment `paymentStatus = "failed"`. BLNK txn → `void`. `"bill-payment-failed"` email sent. (Auto-pay cannot do 3DS) | P1 | @regression2 | Yes |

### 6. Payment Method Management

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| PM-001 | Add credit card during move-in | New user in move-in flow | 1. Reach payment step 2. Enter card details in Stripe PaymentElement 3. Submit | SetupIntent confirmed. `stripePaymentMethodID` saved. `stripePaymentMethodType = card`. `paymentMethodStatus = VALID`. | P0 | @smoke | Yes |
| PM-002 | Add bank account during move-in | New user in move-in flow | 1. Reach payment step 2. Select bank account 3. Enter routing + account number | Bank account attached. May require micro-deposit verification. | P1 | @regression1 | Yes |
| PM-003 | Skip payment during move-in | Move-in flow, billing optional (`isBillingRequired = false`) | 1. Select "I will manage payments myself" 2. Continue | No payment method saved. `maintainedFor` set to NULL (non-billing user). | P1 | @regression2 | Yes |
| PM-004 | Update payment method from account page | Existing user with card | 1. Go to Account → Payment Method 2. Click Edit 3. Enter new card details 4. Submit | Old method replaced. New `stripePaymentMethodID`. `paymentMethodStatus = VALID`. | P0 | @regression1 | Yes |
| PM-005 | Update payment method from pay bill modal | User in pay bill flow | 1. Open pay bill modal 2. Click "Edit" on payment method 3. Update 4. Return to pay | Payment method updated. Can proceed to pay with new method. | P1 | @regression2 | Yes |
| PM-006 | Switch from card to bank account | User with card on file | Update to bank account from account page | `stripePaymentMethodType` → `us_bank_account`. Fee structure changes (0% vs 3%). | P1 | @regression2 | Yes |
| PM-007 | Switch from bank to card | User with bank on file | Update to card from account page | `stripePaymentMethodType` → `card`. 3% fee now applies. | P1 | @regression2 | Yes |
| PM-008 | Enable auto-pay from account page | User with auto-pay OFF | Toggle auto-pay ON | `isAutoPaymentEnabled = true`. Confirmation shown. | P1 | @regression1 | Yes |
| PM-009 | Disable auto-pay — confirmation dialog | User with auto-pay ON | Toggle auto-pay OFF | `DisableAutopayModal` appears. Warns about consequences. On confirm: `isAutoPaymentEnabled = false`. | P1 | @regression1 | Yes |
| PM-010 | Enable auto-pay with outstanding balance — Pay Now modal | Auto-pay OFF, outstanding balance > 0 | Enable auto-pay from overview | `AutopayPaymentModal` appears: "Autopay starts with next bill. Pay current overdue now?" "Pay now" or "Do it later" options. | P1 | @regression2 | Yes |
| PM-011 | Payment method card display | User with card on file | View account page payment tab | Shows: brand icon, last 4 digits, expiry, "3% fee" badge. | P2 | @regression3 | Yes |
| PM-012 | Bank account display | User with bank on file | View account page payment tab | Shows: bank name, last 4 digits, "No fee" indicator. | P2 | @regression3 | Yes |
| PM-013 | Move-in: auto-pay required by utility | Building with `isAutopayRequired = true` | Move-in payment step | Auto-pay checkbox checked and disabled (cannot uncheck). | P2 | @regression3 | Yes |
| PM-014 | Move-in: renewable energy subscription bundled with payment | Building with `offerRenewableEnergy = true` | Move-in payment step, RE toggle visible | Can enable RE subscription during payment setup. $3.29/mo added. | P2 | @regression3 | Yes |

### 7. Billing Page UI

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| BP-001 | Outstanding balance displays correctly | Billing user with processed bills | Navigate to /app/billing | Outstanding balance card shows correct total. Matches sum of charge account balances. | P0 | @smoke | Yes |
| BP-002 | Bill History tab — electric bills visible | User with electric bills | Go to billing → Bill History tab | Electric bills listed with amount, date, status. | P1 | @regression1 | Yes |
| BP-003 | Bill History tab — gas bills visible | User with gas bills | Go to billing → Bill History tab | Gas bills listed alongside electric. | P1 | @regression1 | Yes |
| BP-004 | Payments tab — payment history | User with payment history | Go to billing → Payments tab | Payments listed: date, amount, status (Succeeded/Processing/Failed), method. | P1 | @regression1 | Yes |
| BP-005 | Payments tab visible for non-billing users | Non-billing user with subscription payments | Go to billing → Payments tab | Tab visible. Shows subscription payments. | P2 | @regression2 | Yes |
| BP-006 | Overview page — electricity card shows bill details | User with processed electric bill | Navigate to /app/overview | Electricity card shows: amount, usage, period, due date. | P1 | @regression1 | Yes |
| BP-007 | Overview page — gas card shows bill details | User with processed gas bill | Navigate to /app/overview | Gas card shows: amount, usage, period, due date. | P1 | @regression1 | Yes |
| BP-008 | Overview page — cards clear after payment | User with outstanding → pay → succeed | Pay bill, wait for success | Electricity/Gas cards show "No outstanding balance" or clear state. | P1 | @regression2 | Yes |
| BP-009 | Outstanding balance updates after payment | Pay bill successfully | Check billing page after payment | Balance reduced by payment amount. Payment appears in history. | P0 | @regression1 | Yes |

### 8. Payment Alerts

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| PA-001 | Overdue balance alert displays | User with overdue balance (past due date) | Navigate to overview/billing | `OverdueBalanceAlert`: "Overdue Balance. Failure to pay will result in shutting off service." | P1 | @regression2 | Yes |
| PA-002 | Overdue alert links to billing page | Alert displayed | Click alert link | Navigates to /app/billing with pay bill context. | P2 | @regression3 | Yes |
| PA-003 | Payment failed alert displays | User with recent payment failure | Navigate to overview | `PaymentFailedAlert`: Shows Stripe error message. Links to account page. | P1 | @regression2 | Yes |
| PA-004 | No alerts when balance is current | User with current (not overdue) balance | Navigate to overview | No overdue or failed alerts displayed. | P2 | @regression3 | Yes |

### 9. Subscription Payments

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| SP-001 | Transaction generation creates pending metadata | Active subscription, billing user, aligned dayOfMonth | Trigger `transaction-generation-trigger` event | `SubscriptionMetadata` created: status=`pending`, amount=329 ($3.29), dueDate=today. Renewal reminder email sent. | P0 | @regression1 | Yes |
| SP-002 | Subscription payment processes successfully | Pending metadata from SP-001, valid payment method | Trigger `subscriptions-payment-trigger` event | Payment created: contributions=[{renewableSubscriptionID, amount}]. Stripe PaymentIntent confirmed. On webhook success: metadata → `completed`, success email. | P0 | @regression1 | Yes |
| SP-003 | No payment method — reminder email at generation | Active sub, no payment method (`stripePaymentMethodID = null`) | Trigger generation | `subscription-payment-method-reminder` email sent (not renewal reminder). Metadata still created. | P1 | @regression2 | Yes |
| SP-004 | No payment method — missing email at payment time | Pending metadata, no payment method | Trigger payment | `subscription-payment-method-missing` email sent. Payment NOT created. | P1 | @regression2 | Yes |
| SP-005 | Subscription payment — duplicate detection (5-day window) | Active sub with recent `succeeded` payment | Trigger payment again within 5 days | Duplicate blocked. No new payment created. `hasActiveSubscriptionPayment()` returns true. | P1 | @regression2 | Yes |
| SP-006 | Subscription payment — retry after failure | Active sub with `failed` payment | Trigger payment | New payment attempt allowed. `failed` status is non-blocking. | P1 | @regression2 | Yes |
| SP-007 | Subscription payment — per-subscription concurrency lock | Active sub, two concurrent triggers | Trigger payment twice quickly | Only one payment processes. Inngest concurrency: `{ limit: 1, key: subscription.id }`. | P2 | @regression3 | No (timing) |
| SP-008 | Cancel subscription — pending metadata voided | Active sub with pending metadata | Cancel subscription | Subscription `endDate` set. Pending `SubscriptionMetadata` → `canceled`. | P1 | @regression2 | Yes |
| SP-009 | Re-subscribe — new subscription row created | Canceled subscription | Re-subscribe via dashboard | New Subscription row (new ID). Old row unchanged (historical). New `ledgerBalanceID`. | P1 | @regression2 | Yes |
| SP-010 | Subscription payment failure — generation txn NOT voided | Active sub, payment fails | Trigger payment with bad card | Payment `paymentStatus = "failed"`. BLNK payment txn (`subscription-payment-{paymentID}`) → `void`. BUT generation txn (`subscription-{id}-{date}`) stays **`inflight`** (NOT voided). `SubscriptionMetadata.status` stays **`"pending"`** (NOT updated). `isAutoPaymentEnabled` unchanged. `paymentMethodStatus` unchanged. `"subscription-payment-failed"` email sent. | P1 | @regression2 | Yes |
| SP-011 | Non-billing user subscription — no payment method | Non-billing user (no maintainedFor), active sub | Trigger generation + payment | Emails reference allocation-based impact (not bill-based). Payment still attempted if PM exists. | P2 | @regression3 | Yes |
| SP-012 | Contributions format — array format | New payment with subscription | Check Payment.contributions | Format: `[{renewableSubscriptionID: X, amount: 329}]` (array, not object). | P2 | @regression3 | Yes |

### 10. Payment Reminders

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| PR-001 | Due soon reminder — 15 days before | Bill with due date 15 days out, auto-pay OFF | Trigger `ledger.payment.reminders` event | Standard email reminder sent. No SMS. | P1 | @regression2 | No (Inngest) |
| PR-002 | Standard overdue — 5 days past due | Bill 5 days overdue | Trigger reminders | Standard email + SMS (if consented). | P1 | @regression2 | No (Inngest) |
| PR-003 | Shutoff warning — 16+ days overdue | Bill 18 days overdue | Trigger reminders | Shutoff warning email (daily). SMS at threshold days. | P1 | @regression2 | No (Inngest) |
| PR-004 | Final shutoff — 25+ days overdue | Bill 25+ days overdue | Trigger reminders | Final shutoff email + SMS. Account flagged for offboarding. | P0 | @regression1 | No (Inngest) |
| PR-005 | Delinquency tagging | Bill overdue | Trigger reminders | `isDelinquent = true`, `delinquentDays` set on ElectricAccount/GasAccount. | P2 | @regression3 | No (Inngest) |
| PR-006 | Auto-pay user with failed payment — DOES get reminders | Billing user with auto-pay ON, but payment failed (balance > 0) | Trigger reminders | Reminders ARE sent. No explicit auto-pay filter — auto-pay users excluded only because successful payments zero their balance. Failed payment leaves balance, so reminders fire. | P1 | @regression2 | No (Inngest) |
| PR-007 | SMS requires text consent | User WITHOUT `dateOfTextMessageConsent` | Trigger reminders at SMS threshold | Email sent, SMS NOT sent (no consent). | P2 | @regression3 | No (Inngest) |

### 11. Offboarding & Reconciliation

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| OB-001 | Offboarding at 25+ days — separate charge accounts | Billing user, separate charge accounts, electric 25+ days overdue, gas current | Trigger reminder pipeline | Electric account → `NEEDS_OFF_BOARDING`. Gas account unchanged (separate companies). Slack alert. | P0 | @regression1 | No (Inngest) |
| OB-002 | Offboarding at 25+ days — single charge account | Single charge account, 25+ days overdue | Trigger reminder pipeline | Both accounts → `NEEDS_OFF_BOARDING` (property-level override). | P1 | @regression2 | No (Inngest) |
| OB-003 | Reconciliation — pay brings balance below $1 | `NEEDS_OFF_BOARDING` account, user pays full outstanding | Trigger `trigger-accounts-offboarding-reconciliation` | Account status → `ACTIVE`. `isDelinquent = false`. | P0 | @regression1 | No (Inngest) |
| OB-004 | Partial payment — stays NEEDS_OFF_BOARDING | `NEEDS_OFF_BOARDING`, partial payment (balance > $1) | Pay partial amount | Account stays `NEEDS_OFF_BOARDING`. Balance reduced but not cleared. | P1 | @regression2 | No (Inngest) |
| OB-005 | Property-level override — one overdue blocks all | Property with 2 charge accounts, one 25+ days overdue | Trigger offboarding | BOTH accounts → `NEEDS_OFF_BOARDING` even if one is current. | P1 | @regression2 | No (Inngest) |
| OB-006 | EVERSOURCE/NGMA exception — individual processing | EVERSOURCE or NGMA utility, one overdue | Trigger offboarding | Only the overdue account offboarded. Other stays `ACTIVE`. | P2 | @regression3 | No (Inngest) |

### 12. Move-In Payment Setup

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| MI-001 | Standard move-in — add card | `?shortCode=autotest` | Complete move-in, add card at payment step | User created as billing (`maintainedFor` NOT NULL). Card saved. Auto-pay enabled. | P0 | @smoke | Yes |
| MI-002 | Standard move-in — add bank account | `?shortCode=autotest` | Complete move-in, add bank at payment step | Bank account attached. `stripePaymentMethodType = us_bank_account`. | P1 | @regression1 | Yes |
| MI-003 | Standard move-in — skip payment | `?shortCode=autotest`, billing optional | Select "I will do the setup myself" | Non-billing user. `maintainedFor = NULL`. Savings alert page shown. | P1 | @regression2 | Yes |
| MI-004 | Encouraged conversion — skip payment | `?shortCode=pgtest` | Select "I will call and setup myself" | Non-billing user. Contact provider page. | P1 | @regression2 | Yes |
| MI-005 | Partner-themed payment form | `?shortCode=venn73458test` (Venn) | Reach payment step | Stripe Elements styled with Venn brand colors (coral/orange). | P2 | @regression3 | Yes |
| MI-006 | Auto-pay required by utility | Building with `isAutopayRequired = true` | Reach payment step | Auto-pay checkbox checked and grayed out. | P2 | @regression3 | Yes |
| MI-007 | RE subscription during payment setup | `?shortCode=autotest` (offerRenewableEnergy=true) | Enable RE toggle at payment step | Subscription created on setup complete. $3.29/mo charge. | P1 | @regression2 | Yes |

### 13. Flex Payment Integration

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| FX-001 | Flex customer — bill notification without auto-pay | `isFlexCustomer = true`, auto-pay ON, approved bill | Process bill through pipeline | Bill processed. Notification sent. Auto-pay NOT executed (Flex handles). | P1 | @regression2 | Yes |
| FX-002 | Flex promo card on account page | Flex-eligible user (not enrolled) | Navigate to Account → Payment Method | `FlexPromoCard` displayed. "Split this bill" via getflex.com. | P2 | @regression3 | Yes |
| FX-003 | Flex active card on account page | `isFlexCustomer = true` | Navigate to Account → Payment Method | `FlexActivePaymentCard` displayed instead of standard card. | P2 | @regression3 | Yes |
| FX-004 | Pay in full option for Flex users | Flex user with outstanding balance | Open pay bill modal | Radio group: "Public Grid" (direct pay) vs "Flex" (bill splitting). Can choose to pay in full. | P1 | @regression2 | Yes |

### 14. Light Portal Billing

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| LP-001 | Light user — billing page loads | Authenticated LightUser | Navigate to /portal/billing | Billing page loads with Light-specific components. Bills displayed. | P1 | @regression2 | Yes |
| LP-002 | Light user — initial payment setup | LightUser without payment method | Navigate to billing | `light-initial-payment-setup-form` displayed. Can add payment method. | P1 | @regression2 | Yes |
| LP-003 | Light user — update payment method | LightUser with existing method | Open payment update form | `light-payment-update-form` allows method change. | P2 | @regression3 | Yes |
| LP-004 | Light user — payment card preview | LightUser with payment method | View billing page | `light-payment-card-preview` shows current method details. | P2 | @regression3 | Yes |

### 15. Bill Adjustments & Credits

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| BA-001 | Pre-ingestion adjustment — folds into bill BLNK txn | Bill with `ingestionState = "approved"`, adjustment exists | Wait for ingestion pipeline | `BillAdjustment` record with `adjustmentPhase = "pre-ingestion"`. BLNK bill txn `precise_amount = totalAmountDue + netAdjustments`. No separate BLNK txn for adjustment. | P1 | @regression2 | No (Inngest) |
| BA-002 | Post-ingestion credit — reduces balance | Bill already `"processed"`, apply credit adjustment | Create negative post-ingestion adjustment | `BillAdjustment` with `adjustmentPhase = "post-ingestion"`. BLNK txn: `ledgerBalanceID` → `@AdjustmentsAbsorbed`, reference `adjustment_{billType}_bill_{billID}_{ts}`, status `applied`. Charge account balance reduced. | P1 | @regression2 | No (Inngest) |
| BA-003 | Post-ingestion fee — increases balance | Bill already `"processed"` | Create positive post-ingestion adjustment | BLNK txn: `@AdjustmentsAbsorbed` → `ledgerBalanceID`, reference `adjustment_{billType}_bill_{billID}_{ts}`. Charge account balance increased. | P2 | @regression3 | No (Inngest) |
| BA-004 | Credit overflow — BillCredit created | Post-ingestion credit larger than charge account balance | Apply large credit adjustment | `BillCredit` record created for overflow amount. Charge account balance does not go below zero. | P2 | @regression3 | No (Inngest) |
| BA-005 | PG_PAYS credit reduces bill ingestion amount | Bill with attached `PG_PAYS` credit | Process bill through pipeline | BLNK bill txn `precise_amount = totalAmountDue - credit.amount`. | P1 | @regression2 | No (Inngest) |
| BA-006 | OVERPAYMENT credit does not reduce bill amount | Bill with attached `OVERPAYMENT` credit | Process bill through pipeline | BLNK bill txn `precise_amount = totalAmountDue` (OVERPAYMENT contributes 0). | P2 | @regression3 | No (Inngest) |
| BA-007 | Paid-by-user — unprocessed bill (scenario 1) | Bill `ingestionState = "approved"` | Mark as paid by user | Credits unattached. `isPaidByUser = true`. `ingestionState = "cancelled"`. | P2 | @regression3 | No (Inngest) |
| BA-008 | Paid-by-user — processed bill, user paid, remittance exists (scenario 2) | Bill `"processed"`, user payment exists, UtilityRemittance exists | Mark as paid by user | Negative adjustment created with `willRemitOriginal = false`. | P2 | @regression3 | No (Inngest) |
| BA-009 | Paid-by-user — processed bill, user paid, no remittance (scenario 3) | Bill `"processed"`, user payment exists, no UtilityRemittance | Mark as paid by user | Negative adjustment with `willRemitOriginal = true`. New `UtilityRemittance` created. | P2 | @regression3 | No (Inngest) |
| BA-010 | Not idempotent — post-ingestion adjustment | Already adjusted bill | Apply same adjustment again | Second `BillAdjustment` and BLNK txn created (timestamp suffix makes unique). Balance doubly reduced. | P2 | @regression3 | No (Inngest) |

### 16. Flex Payment (Expanded)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| FX-010 | Flex payment success — BLNK transactions | `isFlexCustomer = true`, Flex payment event fires | Trigger `flex.payment.success` event | BLNK txn per charge account: ref `flex_{flexPaymentID}_{chargeAccountID}`, source `ledgerBalanceID`, dest `@Flex`, status `applied`, **`allow_overdraft = false`**. Remittance txn: ref `flex_remittance_{paymentID}`, `@Flex` → `@RemittancePool`. Payment `paymentStatus = "succeeded"`. UtilityRemittance `ready_for_remittance`. `"bill-paid"` email with `last4: "Flex"`, `brand: "Flex"`. | P1 | @regression2 | No (Inngest) |
| FX-011 | Flex payment — allow_overdraft is false | Flex payment where amount > balance | Trigger Flex payment | Payment should fail or handle gracefully — `allow_overdraft = false` unlike all other paths. | P2 | @regression3 | No (Inngest) |
| FX-012 | Flex reconciliation — stale payment caught | Flex payment with `ledgerTransactionID IS NULL`, `paymentStatus = "succeeded"`, created > 5 min ago | Wait for 15-min reconciliation cron | Success event re-emitted. Idempotency prevents duplicate BLNK txns (reference check). Payment gets `ledgerTransactionID` populated. | P2 | @regression3 | No (Inngest) |
| FX-013 | Flex checkout — inflight with 1-day expiry | Flex checkout initiated | Check BLNK | Inflight txn: ref `flex_checkout_{paymentID}_{chargeAccountID}`, status `inflight`, 1-day expiry. | P3 | @regression4 | No (Inngest) |

### 17. Database & Pipeline Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| DB-001 | Bill ingestion — BLNK txn with correct reference | Approved electric bill | Process through pipeline | `ingestionState` → `"processed"`. BLNK txn: reference `electric-bill-{id}`, source `@{utilityCompanyId}`, dest `ledgerBalanceID`, status `applied`. `TransactionMetadata` links txn to bill. Balance increased by `totalAmountDue`. | P0 | @regression1 | Yes |
| DB-002 | Payment record created with correct contributions | Bill payment | Check Payment table | `contributions` is array: `[{chargeAccountID, amount}]`. `paymentStatus` transitions: `scheduled_for_payment` → `requires_capture` (card) or `processing` (bank) → `succeeded`. `ledgerTransactionID` references BLNK bulk transaction. | P1 | @regression1 | Yes |
| DB-003 | BLNK payment txn — inflight to applied | Bill processed + payment succeeded | Check blnk.transactions | Payment txn ref `{utilityType}_{paymentID}`: `inflight` → `applied`. Fee txn ref `transaction_fee_{paymentID}`: `inflight` → `applied` (if card). Remittance txn ref `remittance_{paymentID}`: `applied` (created on success). Fee transfer ref `fee_transfer_{paymentID}`: `applied`. | P1 | @regression2 | Yes |
| DB-004 | TransactionMetadata — dueDate fallback logic | Bill with null `dueDate` | Process through pipeline | `TransactionMetadata.dueDate` = `statementDate + 3 days`. If that's in the past: `today + 5 days`. | P2 | @regression3 | Yes |
| DB-005 | UtilityRemittance created on payment success | Payment succeeded | Check UtilityRemittance | Status: `ready_for_remittance`. `chargeAccountID` correct. Amount matches contribution. `paymentID` set. | P1 | @regression2 | Yes |
| DB-006 | Payment failure — BLNK txn VOID + balance restored | Payment fails | Check blnk.transactions + balances | Inflight txn status → `void`. Charge account `balance` unchanged. `inflight_balance` restored (debit reversed). No UtilityRemittance created. | P1 | @regression2 | Yes |
| DB-007 | Sequential bill processing | Insert 2 approved bills for same charge account | Wait for pipeline | First bill processed, then second. Not parallel. | P1 | @regression2 | Yes |
| DB-008 | Non-billing user bills not processed | Non-billing user (`maintainedFor IS NULL`), approved bill | Wait for pipeline | Bill stays `approved`/`viewable`. No BLNK transaction. No Payment created. | P1 | @regression2 | Yes |
| DB-009 | Bill ingestion idempotency | Same bill processed twice (concurrent batch) | Run pipeline twice | Only one BLNK transaction created (reference check). Second attempt skips. | P2 | @regression3 | Yes |
| DB-010 | Subscription payment — contributions format | Subscription payment succeeds | Check Payment.contributions | Format: `[{renewableSubscriptionID: X, amount: 329}]`. No `chargeAccountID`. No UtilityRemittance (subscriptions don't create remittances). | P2 | @regression3 | Yes |
| DB-011 | BLNK transaction descriptions match expected patterns | Bill ingested + payment succeeded | Query blnk.transactions by reference | Bill txn: description matches `"{utilityCompanyId} {billType} {statementDate} [{usage} {unit}]"`. Payment txn: `"Customer Balance ({utilityType}) to Stripe"`. Fee txn: `"Stripe Fees to Stripe"`. Remittance txn: `"Remittance for payment {paymentID}"`. Fee transfer: `"Fee transfer for payment {paymentID}"`. | P1 | @regression2 | Yes |
| DB-012 | Fee calculation accuracy at DB level — card vs bank | Two billing users: one card, one bank. Same $100 bill. | Insert approved bill for each, wait for pipeline | **Card user**: `Payment.amount = 10330` cents ($100 bill + bankersRound(10000 * 0.03 + 30) = $3.30 fee). BLNK fee txn (`transaction_fee_{paymentID}`) amount = 3.30. **Bank user**: `Payment.amount = 10000` cents (no fee). No fee txn created. | P0 | @regression1 | Yes |
| DB-013 | BLNK balance formula at each pipeline step | Billing user, auto-pay ON, card | 1. Record `balance + inflight_balance` before bill 2. Insert approved bill, wait for ingestion 3. Record balances after ingestion 4. Wait for payment prep (scheduled_for_payment) 5. Record balances during inflight 6. Wait for success 7. Record final balances | **Before**: `balance=0, inflight=0, outstanding=0`. **After ingestion**: `balance=+billAmount (applied), inflight=0, outstanding=billAmount`. **During payment**: `balance=+billAmount, inflight_debit=+billAmount, outstanding=billAmount - paymentAmount` (inflight debit reduces outstanding). **After success**: `balance=0 (payment applied), inflight=0, outstanding=0`. | P0 | @regression1 | Yes |
| DB-014 | Cross-table consistency — full payment chain | Payment succeeded for electric+gas bill | Verify across Payment, UtilityRemittance, BLNK, TransactionMetadata | 1. `Payment.contributions[].amount` sums to `Payment.amount - fee`. 2. Each `contributions[].chargeAccountID` has matching `UtilityRemittance` with `amount = contribution.amount`. 3. `UtilityRemittance.paymentID = Payment.id`. 4. BLNK `remittance_{paymentID}` amount = `Payment.amount - fee`. 5. BLNK `fee_transfer_{paymentID}` amount = fee. 6. `TransactionMetadata.ledgerTransactionID` matches BLNK bill txn. 7. `TransactionMetadata.electricBillID`/`gasBillID` matches bill record. | P0 | @regression1 | Yes |
| DB-015 | UtilityRemittance amount matches contribution — per charge account | Payment with separate charge accounts (electric + gas) | Check each UtilityRemittance | For each entry in `Payment.contributions`: matching `UtilityRemittance` exists where `amount = contribution.amount` AND `chargeAccountID = contribution.chargeAccountID` AND `remittanceStatus = "ready_for_remittance"` AND `paymentID = Payment.id`. Total remittance amounts = `Payment.amount - fee`. | P1 | @regression2 | Yes |

### 18. Stripe Webhook Handling

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| WH-001 | payment_intent.succeeded — bill payment | Auto-pay bill payment | Wait for webhook | Payment → `succeeded`. Blnk committed. Remittance created. Email sent. `pay-bills` task triggered. | P0 | @regression1 | Yes |
| WH-002 | payment_intent.succeeded — subscription payment | Subscription payment | Wait for webhook | Payment → `succeeded`. SubscriptionMetadata → `completed`. Email sent. | P0 | @regression1 | Yes |
| WH-003 | payment_intent.payment_failed — bill | Auto-pay fails | Wait for webhook | Payment → `failed`. Blnk VOID. Slack alert. Failure email. | P1 | @regression2 | Yes |
| WH-004 | payment_intent.payment_failed — subscription | Sub payment fails | Wait for webhook | Same as WH-003 + subscription-specific failure email. | P1 | @regression2 | Yes |
| WH-005 | payment_method.attached — triggers pending sub payments | User attaches new PM with pending sub metadata | Wait for webhook | `payment_method.attached` triggers attempt to process pending subscription payments. | P2 | @regression3 | No (Inngest) |
| WH-006 | Webhook deduplication | Same webhook event ID sent twice | Check StripeWebhookEvents | Second event skipped (already processed). No duplicate payment/email. | P2 | @regression3 | No (Inngest) |

### 19. Email Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Tag | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----|-----------|
| EM-001 | Bill notification email — auto-pay user | New bill processed, auto-pay ON | Check Fastmail via JMAP | Email type `"ledger-auto-pay-ready"`. Subject: `"Your {billTypes} bill(s) are/is ready"`. Contains: bill amount, due date, service address, utility name. | P1 | @regression2 | Yes |
| EM-001b | Bill notification email — manual-pay user | New bill processed, auto-pay OFF | Check Fastmail via JMAP | Email type `"ledger-manual-pay-ready"`. Subject: `"Your {billTypes} bill(s) are/is ready for payment"`. | P1 | @regression2 | Yes |
| EM-002 | Payment success email | Payment succeeded | Check Fastmail | Email: "Payment received" with amount, confirmation, payment method last 4. | P1 | @regression2 | Yes |
| EM-003 | Payment failed email (recoverable) | Recoverable failure | Check Fastmail | Email: "Payment failed" with error message. No "update payment method" CTA. | P1 | @regression2 | Yes |
| EM-004 | Update payment method email (non-recoverable) | Non-recoverable failure | Check Fastmail | Email: "Update your payment method" with link to account page. | P1 | @regression2 | Yes |
| EM-005 | Subscription renewal reminder | Transaction generation | Check Fastmail | Email: renewal amount, payment method, clean energy impact stats. | P1 | @regression2 | Yes |
| EM-006 | Subscription payment method reminder (no PM) | Generation with no PM | Check Fastmail | Email: "Add a payment method" CTA. | P2 | @regression3 | Yes |
| EM-007 | Subscription payment success email | Sub payment succeeded | Check Fastmail | Email: subscription payment confirmation, impact stats. | P2 | @regression3 | Yes |
| EM-008 | Standard payment reminder (overdue) | Overdue bill, manual-pay user | Trigger reminders | Subject: `"ACTION REQUIRED: Overdue Payment for {billTypes}"`. Contains service address, amount due, utility names. | P2 | @regression3 | No (Inngest) |
| EM-008b | Due soon payment reminder | Bill due in 15/10/5 days | Trigger reminders | Subject: `"Payment Due Soon for {billTypes}"`. | P2 | @regression3 | No (Inngest) |
| EM-009 | Shutoff warning email | 16-24 days overdue | Trigger reminders | Subject: `"Urgent: {billTypes} Shutoff Notice for your Public Grid Account"`. | P2 | @regression3 | No (Inngest) |
| EM-010 | Final shutoff notice | 25+ days overdue, account NOT already NEEDS_OFF_BOARDING | Trigger reminders | Subject: `"Final Notice: {billTypes} Service Scheduled for Shutoff"`. Only sent if account not already offboarded. | P2 | @regression3 | No (Inngest) |
| EM-011 | Flex bill notification | Flex customer, bill processed | Check Fastmail | Email type `"ledger-flex-ready"`. No auto-pay processing. | P2 | @regression3 | No (Inngest) |
| EM-012 | PM not configured — urgent update email | Bill processed, no payment method | Check Fastmail | Email type `"update-payment-method"`. Subject: `"[Urgent] - Update Your Payment Method"`. Auto-pay disabled, PM marked `INVALID`. | P1 | @regression2 | Yes |

---

## Test Utilities Matrix

All utilities supported by the payment system. Tests should cover representative samples.

| Utility | Code | Electric | Gas | Charge Account Pattern | Notes |
|---------|------|----------|-----|----------------------|-------|
| EVERSOURCE | EVERSOURCE | Yes | Yes | Always separate | Exception: individual offboarding |
| PSEG | PSEG | Yes | Yes | Combined or separate | |
| SDGE | SDGE | Yes | Yes | Combined | San Diego |
| SCE | SCE | Yes | Yes | Combined or separate | SoCal |
| NGMA | NGMA | Yes | Yes | Always separate | Exception: individual offboarding |
| DUKE | DUKE | No | Yes | Gas only | |
| COMED | COMED | Yes | No | Electric only | |
| DELMARVA | DELMARVA | Yes | Yes | Combined or separate | |
| BGE | BGE | Yes | Yes | Combined | Baltimore |
| DTE | DTE | Yes | Yes | Combined | Detroit |
| ConEdison | CON_EDISON | Yes | Yes | Combined | New York |

---

## Automation Priority

### Phase 1 — P0/Smoke + Migration-Critical (15 tests)
Focus: Critical payment paths + financial integrity for migration safety.
- **Revenue-critical**: MP-001, MP-014, AP-001, BP-001, BP-009, MI-001, WH-001, WH-002, PM-001
- **Migration-critical (BLNK/ledger)**: DB-001, DB-012, DB-013, DB-014

### Phase 2 — P1/Regression1 (30+ tests)
Focus: Core payment variations, validation, and ledger verification.
- MP-002, MP-003, MP-004, MP-005, MP-007, MP-013, AP-002, AP-003, AP-004, AP-020, AP-028
- PM-002, PM-004, PM-008, PM-009, BP-002, BP-003, BP-004, BP-006, BP-007
- SP-001, SP-002, MI-002, DB-002, DB-007, DB-011, DB-015, OB-001, OB-003

### Phase 3 — P2/Regression2+ (60+ tests)
Focus: Edge cases, alerts, subscriptions, Flex, Light, adjustments, BLNK verification.
- All remaining tests from sections above including new BA-*, FX-01*, DB-009, DB-010

### Exploratory Only (Not Automated)
- 3DS verification (MP-020, MP-021, MP-022) — requires manual Stripe 3DS flow
- Payment reminders (PR-*) — Inngest pipeline, no direct UI
- Offboarding (OB-*) — Inngest pipeline, DB verification
- Webhook deduplication (WH-006) — internal Inngest behavior
- SMS verification (AP-007, PR-007) — Dialpad integration
- Bill adjustments (BA-*) — admin operations + pipeline verification
- Flex BLNK flows (FX-010 to FX-013) — Inngest event-driven
- Void failure edge case (AP-025) — requires BLNK unavailability
- Auto-pay re-validation timing (AP-026, AP-027) — requires precise timing during sleep

---

## Test Data Requirements

### Users Needed

| User Type | Payment Method | Auto-Pay | Charge Accounts | Purpose |
|-----------|---------------|----------|-----------------|---------|
| Billing, card, auto-pay ON | Valid card | ON | Single | Auto-pay happy path |
| Billing, card, auto-pay ON | Valid card | ON | Separate (2 utilities) | Multi-charge auto-pay |
| Billing, card, auto-pay OFF | Valid card | OFF | Single | Manual pay happy path |
| Billing, card, auto-pay OFF | Valid card | OFF | Separate | Manual pay "Other Amount" |
| Billing, bank, auto-pay ON | Valid bank | ON | Single | Bank auto-pay |
| Billing, invalid card | Invalid card (0341) | ON | Single | Failed payment |
| Billing, no PM | None | — | Single | Missing PM flows |
| Non-billing | None | — | — | Non-billing bill handling |
| Flex customer | Valid card | ON | Single | Flex integration |
| Subscription user | Valid card | ON | — | Subscription payment |
| Overdue user (5 days) | Valid card | OFF | Single | Reminder testing |
| Overdue user (25+ days) | Valid card | OFF | Single | Offboarding testing |
| LightUser | Valid card | — | — | Light portal billing |

### Bills Needed

- Insert approved electric bills: `tests/resources/fixtures/database/billQueries.ts` → `insertApprovedElectricBill()`
- Insert approved gas bills: `insertApprovedGasBill()`
- Wait for `balance-ledger-batch` cron (*/5 in dev)
- Verify: `ingestionState = 'processed'`, Payment record created

### Building Configuration

| Shortcode | Billing | RE Subscription | Notes |
|-----------|---------|----------------|-------|
| `autotest` | Yes (`isHandleBilling=true`) | Yes (`offerRenewableEnergy=true`) | Default for payment tests |
| `pgtest` | Yes | Yes | Encouraged conversion |
| Custom | Varies | Varies | Set `isAutopayRequired`, `isBillingRequired` per test |

---

## Dependencies & Prerequisites

| Dependency | Required For | Status |
|------------|-------------|--------|
| Stripe test mode | All payment tests | Available |
| Inngest event key (`INNGEST_EVENT_KEY`) | Subscription + reminder tests | In `.env` |
| Fastmail JMAP API | Email verification | In `.env` |
| Supabase access | DB verification + data setup | In `.env` |
| Blnk/SERVICES_MONEY_QUERY_ENDPOINT | Balance queries | Must be running in dev |
| Dev environment deployed | All tests | Required |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Blnk server down in dev | Blocks all payment tests | Medium | Verify Blnk health before test runs |
| Cron timing variability | Tests may need longer waits | Medium | Use generous retry configs (existing RETRY_CONFIG) |
| Stripe rate limiting | Failed payment tests | Low | Throttle parallel test execution |
| Shared test data contamination | False positives/negatives | Medium | Create fresh users per test, clean up in afterEach |
| Pipeline sequential constraint | Slow test execution for multi-bill scenarios | High | Use pay-then-insert cycle; minimize bills per test |

---

## Related Documents

- `tests/docs/payment-system.md` — Full payment system reference (updated with Brennan's expected states)
- `payment_system_ledger_flows.md` — Brennan's expected state reference (source of truth for BLNK transactions)
- `tests/docs/subscription-system.md` — Subscription system reference
- `tests/test_plans/ENG-2440_subscription_payment_race_condition.md` — Race condition test plan
- `tests/test_plans/ENG-2466_ledger_payment_reminder_timeouts.md` — Payment reminder test plan
- `tests/test_plans/ENG-2627_revamped_subscriptions.md` — Revamped subscriptions test plan
- `tests/test_plans/multi_processor_payment_system.md` — Future multi-processor plan
