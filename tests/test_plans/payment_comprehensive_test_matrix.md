# Payment Test Matrix — Comprehensive Combinations

> Date: 2026-04-11
> Purpose: Document every payment scenario combination that needs testing.
> This supersedes the earlier task-based approach with a matrix-driven approach.

## Test Dimensions

### Dimension 1: Onboarding Type

| Code | Type | Shortcode | Payment Step |
|------|------|-----------|--------------|
| OB-BUILD | Standard building move-in | `autotest` | During move-in OR skip + add after sign-in |
| OB-ENCOUR | Encouraged conversion (building) | `pgtest` | During move-in OR "I will call and setup myself" |
| OB-PARTNER | Partner (no building) | `funnel4324534` | During move-in |
| OB-FINISH | Finish registration (API-generated) | API → email → UI | During finish-reg flow |

### Dimension 2: Utility Configuration

| Code | Electric | Gas | Charge Accounts | Example Config |
|------|----------|-----|-----------------|----------------|
| UC-E | Electric only | None | 1 single | COMED, null |
| UC-G | None | Gas only | 1 single | null, DUKE |
| UC-EG-SAME | Electric + Gas | Same company | 1 single (combined) | PSEG, PSEG |
| UC-EG-DIFF-SAME | Electric + Gas | Different companies | 2 separate | SDGE, SCE |
| UC-EG-EVERSOURCE | Electric + Gas | EVERSOURCE (always separate) | 2 separate (exception) | EVERSOURCE, EVERSOURCE |
| UC-EG-NGMA | Electric + Gas | NGMA (always separate) | 2 separate (exception) | NGMA, NGMA |

### Dimension 3: Payment Method

| Code | Method | Fee | Stripe Capture | Notes |
|------|--------|-----|----------------|-------|
| PM-CARD | Credit/debit card | 3% + $0.30 | `manual` (requires_capture) | 3DS possible |
| PM-BANK | US bank account (ACH) | $0.00 | `automatic_async` (processing) | 3-5 day settlement |

### Dimension 4: Payment Mode

| Code | Mode | How bill gets paid | DB Flow |
|------|------|-------------------|---------|
| MODE-AUTO | Auto-pay | Pipeline: bill approved → processed → scheduled_for_payment → requires_capture → succeeded | Background |
| MODE-MANUAL | Manual pay | User clicks "Pay bill" button → creates payment → succeeded | User-initiated |
| MODE-SKIP | Skip + add later | No payment during onboarding, add via account page, then manual or auto | Deferred |

### Dimension 5: Onboarding Payment Entry Point

| Code | Entry | Description |
|------|-------|-------------|
| EP-MOVEIN | During move-in | Payment added at onboarding payment step |
| EP-SKIP-OVERVIEW | Skip + add on overview | Skip during move-in, enter payment on overview page after sign-in |
| EP-SKIP-ACCOUNT | Skip + add on account | Skip during move-in, enter payment via account settings |

### Dimension 6: Payment Outcome

| Code | Outcome | What Happens |
|------|---------|-------------|
| OUT-SUCCESS | Success | Payment completes. BLNK committed. Remittance created. |
| OUT-FAIL-RECOVER | Fail → recoverable | Card declined (retryable advice code). Auto-pay stays ON. |
| OUT-FAIL-NONRECOV | Fail → non-recoverable | Card/bank permanent failure. Auto-pay OFF. PM INVALID. |
| OUT-FAIL-3DS | Fail → 3DS required (auto) | Auto-pay cannot do 3DS → immediate fail |

### Dimension 7: Recovery Path (after failure)

| Code | Recovery | Steps |
|------|----------|-------|
| REC-CARD-CARD | Update card → same mode | Change to new valid card, payment retries via same mode |
| REC-CARD-BANK | Switch card → bank | Change payment method type entirely |
| REC-BANK-CARD | Switch bank → card | Change payment method type |
| REC-BANK-BANK | Update bank → new bank | Change to different bank account |
| REC-RECONCILE | Inngest reconciliation | `auto-pay-reconciliation-trigger` event picks up outstanding balance |
| REC-MANUAL-PAY | Manual pay as backup | Failed auto-pay → user manually pays via "Pay bill" button |
| REC-MANUAL-THEN-AUTO | Manual pay → next bill auto | Manually pay failed bill, next bill still goes through auto-pay |

### Dimension 8: Mode Transitions

| Code | Transition | Steps |
|------|-----------|-------|
| TRANS-AUTO-MANUAL | Disable auto-pay | Toggle OFF → next bill requires manual payment |
| TRANS-MANUAL-AUTO | Enable auto-pay | Toggle ON → next bill auto-pays. If outstanding, AutopayPaymentModal shows. |
| TRANS-MANUAL-AUTO-PAY | Enable auto-pay + pay now | Toggle ON + pay outstanding immediately |
| TRANS-MANUAL-AUTO-LATER | Enable auto-pay + skip | Toggle ON + "Do it later" for outstanding |

---

## Priority Matrix — What to Test

### P0 — Revenue Critical (must pass, run in Smoke)

| ID | Onboarding | Utility | Method | Mode | Outcome | Recovery |
|----|-----------|---------|--------|------|---------|----------|
| P0-01 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P0-02 | OB-BUILD | UC-EG-SAME | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P0-03 | OB-BUILD | UC-EG-DIFF-SAME | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P0-04 | OB-BUILD | UC-E | PM-BANK | MODE-AUTO | OUT-SUCCESS | - |
| P0-05 | OB-BUILD | UC-E | PM-CARD | MODE-MANUAL | OUT-SUCCESS | - |
| P0-06 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-FAIL-RECOVER | REC-CARD-CARD |
| P0-07 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-FAIL-NONRECOV | REC-CARD-CARD |

### P1 — Critical Coverage (run in Regression1)

| ID | Onboarding | Utility | Method | Mode | Outcome | Recovery |
|----|-----------|---------|--------|------|---------|----------|
| P1-01 | OB-BUILD | UC-G | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P1-02 | OB-BUILD | UC-EG-EVERSOURCE | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P1-03 | OB-BUILD | UC-EG-NGMA | PM-CARD | MODE-AUTO | OUT-SUCCESS | - |
| P1-04 | OB-BUILD | UC-EG-SAME | PM-BANK | MODE-AUTO | OUT-SUCCESS | - |
| P1-05 | OB-BUILD | UC-EG-DIFF-SAME | PM-BANK | MODE-AUTO | OUT-SUCCESS | - |
| P1-06 | OB-BUILD | UC-G | PM-BANK | MODE-AUTO | OUT-SUCCESS | - |
| P1-07 | OB-BUILD | UC-E | PM-CARD | MODE-MANUAL | OUT-SUCCESS | - |
| P1-08 | OB-BUILD | UC-EG-SAME | PM-CARD | MODE-MANUAL | OUT-SUCCESS | - |
| P1-09 | OB-BUILD | UC-EG-DIFF-SAME | PM-CARD | MODE-MANUAL | OUT-SUCCESS | - |
| P1-10 | OB-BUILD | UC-G | PM-CARD | MODE-MANUAL | OUT-SUCCESS | - |
| P1-11 | OB-BUILD | UC-E | PM-BANK | MODE-MANUAL | OUT-SUCCESS | - |
| P1-12 | OB-BUILD | UC-EG-SAME | PM-BANK | MODE-MANUAL | OUT-SUCCESS | - |
| P1-13 | OB-BUILD | UC-G | PM-BANK | MODE-MANUAL | OUT-SUCCESS | - |
| P1-14 | OB-BUILD (skip) | UC-E | PM-CARD | EP-SKIP-OVERVIEW | OUT-SUCCESS | - |
| P1-15 | OB-BUILD (skip) | UC-EG-DIFF-SAME | PM-CARD | EP-SKIP-OVERVIEW | OUT-SUCCESS | - |

### P1 — Failed Payment + Recovery

| ID | Onboarding | Utility | Method | Mode | Outcome | Recovery |
|----|-----------|---------|--------|------|---------|----------|
| P1-20 | OB-BUILD | UC-EG-SAME | PM-CARD | MODE-AUTO | OUT-FAIL-RECOVER | REC-CARD-CARD |
| P1-21 | OB-BUILD | UC-EG-DIFF-SAME | PM-CARD | MODE-AUTO | OUT-FAIL-NONRECOV | REC-CARD-CARD |
| P1-22 | OB-BUILD | UC-E | PM-BANK | MODE-AUTO | OUT-FAIL-NONRECOV | REC-BANK-CARD |
| P1-23 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-FAIL-NONRECOV | REC-CARD-BANK |
| P1-24 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-FAIL-NONRECOV | REC-RECONCILE |
| P1-25 | OB-BUILD | UC-E | PM-CARD | MODE-AUTO | OUT-FAIL-NONRECOV | REC-MANUAL-PAY |

### P2 — Payment Mode Transitions

| ID | Transition | Starting State | Steps | Expected |
|----|-----------|---------------|-------|----------|
| P2-01 | TRANS-AUTO-MANUAL | Auto-pay ON, card on file | Disable auto-pay → insert bill → wait | Bill processed, no payment created. User must pay manually. |
| P2-02 | TRANS-MANUAL-AUTO | Auto-pay OFF, card on file, no balance | Enable auto-pay → insert bill → wait | Bill processed, auto-pay creates payment. |
| P2-03 | TRANS-MANUAL-AUTO-PAY | Auto-pay OFF, card, outstanding balance | Enable auto-pay from overview | AutopayPaymentModal shows "Pay now" + "Do it later". Click "Pay now" → payment created. |
| P2-04 | TRANS-MANUAL-AUTO-LATER | Same as P2-03 | Click "Do it later" | Outstanding stays. Next bill will auto-pay. |
| P2-05 | Auto-fail → manual backup | Auto-pay ON, card fails | Auto-pay fails → user manually pays via Pay bill button | Failed payment stays. New manual payment succeeds. Next bill still auto-pays. |
| P2-06 | Auto-fail → reconciliation → success | Auto-pay ON, card fails → update card | Update card → trigger `auto-pay-reconciliation-trigger` | Reconciliation finds outstanding balance → creates new payment → succeeds |
| P2-07 | Auto-fail → auto-fail → update → reconciliation | Auto-pay ON, card fails, user updates to another bad card | First fail → update card (still bad) → trigger reconciliation → second fail → update to good card → trigger reconciliation → success | Multiple failure cycles before final success |

### P2 — Onboarding Variations

| ID | Onboarding | Utility | Method | Mode | Notes |
|----|-----------|---------|--------|------|-------|
| P2-10 | OB-ENCOUR | UC-E | PM-CARD | MODE-AUTO | Encouraged conversion + billing |
| P2-11 | OB-ENCOUR | UC-EG-SAME | PM-CARD | MODE-AUTO | pgtest shortcode |
| P2-12 | OB-PARTNER | UC-E | PM-CARD | MODE-AUTO | Non-building partner |
| P2-13 | OB-FINISH | UC-E | PM-CARD | MODE-AUTO | Finish registration flow |

### P2 — Overdue Scenarios

| ID | Days Overdue | Account Config | Expected |
|----|------------|----------------|----------|
| P2-20 | 5 days | Electric only, manual pay | Standard reminder email sent |
| P2-21 | 15 days | Electric only, manual pay | Escalated reminder (every 5 days) |
| P2-22 | 18 days | Electric only, manual pay | Shutoff warning email + SMS |
| P2-23 | 25+ days | Electric only, manual pay | Final shutoff. Account → NEEDS_OFF_BOARDING. |
| P2-24 | 25+ days → pay | NEEDS_OFF_BOARDING, pay full | Account → ACTIVE. Delinquency cleared. |
| P2-25 | 25+ days → partial pay | NEEDS_OFF_BOARDING, partial | Account stays NEEDS_OFF_BOARDING (balance > $1). |
| P2-26 | 25+ days, separate accounts | Electric overdue, gas current | Electric → NEEDS_OFF_BOARDING. Gas stays ACTIVE. |
| P2-27 | 25+ days, same charge account | Both overdue | Both → NEEDS_OFF_BOARDING (property-level). |

---

## Verification Layers (every test checks ALL of these)

### Layer 1: UI State
- Outstanding balance displays correctly
- Pay bill button visible/enabled/disabled appropriately
- Bill history shows correct bills
- Payment history shows correct status progression (Scheduled → Processing → Succeeded/Failed)
- Transaction fee displayed (card) or "-" (bank)
- Payment alerts (overdue, failed) appear when appropriate

### Layer 2: Database State
- `ElectricBill`/`GasBill`: `ingestionState`, `paymentStatus`, `visible`, `isSendReminder`, `paidNotificationSent`, `transactionFee`
- `Payment`: `paymentStatus` transitions, `amount` (with fee), `contributions` (array format), `ledgerTransactionID`
- `UtilityRemittance`: exists with correct `amount`, `chargeAccountID`, `remittanceStatus`
- `CottageUsers`: `isAutoPaymentEnabled`, `paymentMethodStatus`, `stripePaymentMethodType`

### Layer 3: BLNK Ledger State
- Bill ingestion txn: reference `{billType}-bill-{id}`, status `APPLIED`, correct amount
- Payment txn: reference `{utilityType}_{paymentID}`, status `INFLIGHT` → `APPLIED`
- Fee txn: reference `transaction_fee_{paymentID}`, correct amount (card) or absent (bank)
- Remittance txn: reference `remittance_{paymentID}`, status `APPLIED`
- Fee transfer: reference `fee_transfer_{paymentID}`, status `APPLIED`
- Balance snapshots: outstanding = balance + inflight_balance at each step
- Cross-table consistency: Payment.contributions ↔ UtilityRemittance ↔ BLNK

### Layer 4: Email Verification
- Bill ready email (auto-pay: `ledger-auto-pay-ready`, manual: `ledger-manual-pay-ready`)
- Payment success email (`bill-paid`)
- Payment failed email (recoverable: `bill-payment-failed`, non-recoverable: `update-payment-method`)
- Reminder emails (standard, shutoff warning, final shutoff) with correct subjects

---

## Manual Test Cases (require PG-Admin or external tools)

| ID | Test | Tool | Steps |
|----|------|------|-------|
| M-01 | Bill Statement "View" button appears after PDF generation | PG-Admin | Process bill in PG-Admin bill inbox → verify Statement PDF generates → check Bill History "View" link in customer dashboard |
| M-02 | SMS content verification for shutoff warnings | Dialpad dashboard | Trigger `ledger.payment.reminders` for 18+ day overdue user → check Dialpad dashboard for SMS content |
| M-03 | PG-Admin remittance management | PG-Admin | Verify remittance records appear in PG-Admin after successful payment → confirm correct amounts |

---

## File Architecture

### Spec Files (restructured)

```
tests/e2e_tests/payment/
├── auto-payment/
│   ├── auto_pay_successful_payment.spec.ts     ← EXISTS (working)
│   ├── auto_pay_failed_payment.spec.ts         ← EXISTS (fixme → fix)
│   └── auto_pay_reconciliation.spec.ts         ← NEW (Inngest reconciliation)
├── manual-payment/
│   ├── manual_pay_successful_payment.spec.ts   ← EXISTS (fixme → fix)
│   ├── manual_pay_failed_payment.spec.ts       ← EXISTS (fixme → rewrite)
│   └── manual_pay_overdue.spec.ts              ← NEW (overdue + offboarding)
├── payment-transitions/
│   ├── auto_to_manual_transition.spec.ts       ← NEW
│   ├── manual_to_auto_transition.spec.ts       ← NEW
│   ├── payment_method_switch.spec.ts           ← NEW (card↔bank)
│   └── failed_payment_recovery.spec.ts         ← NEW (fail→update→reconcile/manual)
├── blnk_ledger_verification.spec.ts            ← EXISTS (just built)
└── payment_load_test.spec.ts                   ← EXISTS (working)
```

### Fixtures (restructured)

```
tests/resources/fixtures/
├── paymentUtilities.ts                         ← MODIFY: remove AdminApiContext dependency,
│                                                  add missing manual methods, add BLNK checks
├── database/
│   ├── billQueries.ts                          ← MODIFIED (12 new methods done)
│   ├── blnkQueries.ts                          ← NEW (done)
│   ├── paymentQueries.ts                       ← MODIFY: add getPaymentDetail, checkPaymentMethod
│   └── accountQueries.ts                       ← MODIFY: add getChargeAccountWithLedgerBalance
└── moveIn/
    └── newUserFlows.ts                         ← EXISTS (all flows working)
```

---

## Implementation Order

### Phase 1: Fix Broken Tests (immediate)
1. Fix `manual_pay_successful_payment.spec.ts` — replace `AdminApi.Simulate_*` with `billQueries.insertApprovedElectricBill/Gas`, remove AdminApiContext param from Manual_*_Payment_Checks calls
2. Fix `auto_pay_failed_payment.spec.ts` — same AdminApi replacement, create missing Alert_Update methods
3. Fix `manual_pay_failed_payment.spec.ts` — complete rewrite with manual fixtures + real failed manual scenarios

### Phase 2: Payment Transitions + Recovery (new tests)
4. Build `failed_payment_recovery.spec.ts` — card→card, card→bank, bank→card, bank→bank recovery
5. Build `auto_pay_reconciliation.spec.ts` — Inngest reconciliation after failed auto-pay
6. Build `auto_to_manual_transition.spec.ts` — disable auto-pay, verify manual required
7. Build `manual_to_auto_transition.spec.ts` — enable auto-pay, AutopayPaymentModal

### Phase 3: Overdue + Expanded Coverage
8. Build `manual_pay_overdue.spec.ts` — overdue escalation, offboarding, reconciliation
9. Add encouraged conversion + partner onboarding test variants
10. Add BLNK verification to all new specs
