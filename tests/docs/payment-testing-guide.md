# Payment Testing Guide — Test Infrastructure Reference

> Last updated: 2026-04-16
> Author: Christian (QA)
> Companion to: `tests/docs/payment-system.md` (how the system works)
> This doc covers: how to TEST the payment system (classes, queries, POMs, specs, sequences)

## Table of Contents

1. [Test Sequence — What to Check at Every State](#test-sequence)
2. [Check Classes](#check-classes)
3. [Database Query Functions](#database-query-functions)
4. [Page Object Methods](#page-object-methods)
5. [Email Check Functions](#email-check-functions)
6. [Move-In Helper Functions](#move-in-helper-functions)
7. [UI State Mappings](#ui-state-mappings)
8. [Spec File Coverage](#spec-file-coverage)
9. [Test Data Reference](#test-data-reference)
10. [Common Patterns](#common-patterns)

---

## Test Sequence

Every payment test follows the same pattern: check UI at EVERY state transition on BOTH Overview and Billing pages. Never just check start and end — verify every intermediate state.

### Autopay Sequence (from `autoPaymentChecks.ts`)

**Step 1 — Bill inserted (NULL ingestionState)**
- Overview: $0, pay button NOT visible, electricity card CLEAR (no dates/amount/usage)
- Billing: $0, pay button NOT visible, bill HIDDEN in Bill History

**Step 2 — Bill approved (pre-BLNK)**
- UI unchanged from Step 1 — approved bills don't affect balance or visibility

**Step 3 — Bill processed (cron completes)**
- Overview: $XX.XX outstanding, pay button VISIBLE+ENABLED, electricity card CONTAINS bill details (start date MMM dd, end date MMM dd, amount, usage)
- DB: `checkPaymentStatus` → `scheduled_for_payment`
- Email: bill-arrival ("Your Electric bill is ready" for autopay, "...ready for payment" for manual)
- Billing: $XX.XX, pay button visible, bill VISIBLE in Bill History
- Payments tab: status = "Scheduled"

**Step 4 — Payment requires_capture**
- DB: `checkPaymentStatus` → `requires_capture`
- Payments tab: status = "Processing"

**Step 5 — Payment succeeded**
- DB: `checkPaymentStatus` → `succeeded`
- Email: "Your Bill Payment Confirmation"
- DB: `checkUtilityRemittance` → `ready_for_remittance`
- Payments tab: "Succeeded" + transaction fee (card: $X.XX / bank: "-")
- Billing: $0
- Overview: $0
- BLNK: `verifyFeeCalculation` + `verifyPaymentChainConsistency`

### Manual Pay Sequence (from `manualPaymentChecks.ts`)

Same as autopay Steps 1-2, then:

**Step 3 — Bill processed → `waiting_for_user` (NOT `scheduled_for_payment`)**
- DB: `checkElectricBillStatus` = `waiting_for_user`, `checkElectricBillVisibility` = true
- Overview: $XX.XX, pay button VISIBLE+ENABLED, Get Started widget NOT visible
- Billing: bill VISIBLE, status = "Pending", View button, amount correct
- **FIXME**: Bill-arrival email check not implemented yet for manual flow

**Step 4 — User clicks Pay bill**
- `Click_Pay_Bill_Button` → `Check_Pay_Outstanding_Balance_Modal` → `Submit_Pay_Bill_Modal`
- DB: `checkElectricBillProcessing`
- Billing: $0, bill status = "Processing"

**Step 5 — Payment succeeded**
- DB: `checkElectricBillStatus` = `succeeded`, `checkElectricBillPaidNotif` = true, `checkElectricBillServiceFee`
- Email: `Check_Bill_Payment_Confirmation`
- Billing: $0, bill "Succeeded", View button, amount correct
- Overview: $0, electricity card STILL shows bill details

### Failed Autopay Sequence (from `failedPaymentChecks.ts`)

**Initial state**: $0 + "Enrolled in Auto-pay" on both Overview and Billing

**After bill approved → processed**:
- DB: `scheduled_for_payment`, `checkElectricBillVisibility` = true
- Overview: "$XX.XX — Your auto-payment of $XX.XX is scheduled for tomorrow"

**After payment fails**:
- DB: `checkElectricBillStatus` = `failed`
- Email: `Check_Failed_Payment_Email`
- Billing: bill "Failed", $XX.XX, pay button visible

**Recovery (update payment link)**:
- Overview: "Automatic payment failed!" alert → "Update payment" link → Account page
- `Go_to_Payment_Info_Tab` → `click_Edit_Payment_Button` → new PM → `Check_Payment_Initiated_Message`
- DB: `checkElectricBillStatus` = `succeeded`, `checkElectricBillPaidNotif` = true
- Email: `Check_Bill_Payment_Confirmation`
- Final: $0, "Enrolled in Auto-pay", bill "Succeeded"

### DB Flags Checked at Each Stage
- `billVisibility` (false → true after processed)
- `billReminder` (true from start)
- `billPaidNotif` (false → true after succeeded)
- `billServiceFee` (card: amount, bank: null)

### Bank-Specific Differences (verified 2026-04-16)
- **Lifecycle**: Bank skips `scheduled_for_payment` → `requires_capture`. Goes directly `processing` → `succeeded`
- **Fee**: Bank = $0. No `transaction_fee`/`fee_transfer` BLNK entries. Payments tab shows "-" for fee
- **Failure**: Bank failure **disables autopay** (`isAutoPaymentEnabled` → false). Card failure keeps it ON
- **Failure email**: Bank = "[Urgent] - Update Your Payment Method". Card = "Payment Failed - Action Required"
- **After failure**: New bills may NOT process for bank-failed users (pipeline blocks when failed + autopay OFF). Use clean users for testing
- **Test banks (OAuth)**: `Success ••••6789`, `Failure ••••1116`, `Insufficient Funds ••••2227`

### Edge Cases (verified 2026-04-16)
- **Autopay disabled mid-pipeline**: Payment in `scheduled_for_payment` → user disables autopay → payment **`canceled`** (Step 9 validates state). Bill stays outstanding, user pays manually. Safe behavior.
- **Fee transition on cross-method recovery**: Bank→Card adds BLNK fee entries ($0 → 3%+$0.30). Card→Bank removes them. Pay bill modal updates dynamically.
- **Failed payment blocks new bills**: User with failed payment + autopay OFF → new approved bills stay stuck at `approved`. Pipeline won't process until payment state resolved.

### BLNK Assertions to Embed in Payment Tests
When testing payment flows, also verify these BLNK ACs as additional assertions:
- **On bill insert**: Check no duplicate BLNK entries for same reference (ENG-2420)
- **On bill processed**: Check `effective_date` + `meta_data.dueDate` set correctly (ENG-2421/2422)
- **On new user**: Check `blnk.balances.identity_id` is linked (ENG-2458)
- **On payment succeeded**: Verify full BLNK chain: bill → payment → fee (card) → remittance → fee_transfer (card)
- **On payment failed**: Check BLNK VOID entry, check `#dev-ledgers-alerts` Slack (ENG-2423/2424)

---

## Check Classes

Located in `tests/resources/fixtures/payment/`. Barrel export from `index.ts`.

### AutoPaymentChecks (8 methods)

| Method | Payment | Utility | CA Type |
|--------|---------|---------|---------|
| `Auto_Card_Payment_Electric_Checks` | Card | Electric only | Single |
| `Auto_Card_Payment_Gas_Checks` | Card | Gas only | Single |
| `Auto_Card_Payment_Electric_Gas_Checks_Single_Charge` | Card | E+G same company | Single |
| `Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge` | Card | E+G diff company | Multiple |
| `Auto_Bank_Payment_Electric_Checks` | Bank | Electric only | Single |
| `Auto_Bank_Payment_Gas_Checks` | Bank | Gas only | Single |
| `Auto_Bank_Payment_Electric_Gas_Checks_Single_Charge` | Bank | E+G same company | Single |
| `Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge` | Bank | E+G diff company | Multiple |

### ManualPaymentChecks (6 methods)

| Method | Payment | Utility |
|--------|---------|---------|
| `Manual_Card_Payment_Electric_Checks` | Card | Electric only |
| `Manual_Card_Payment_Electric_Gas_Checks` | Card | E+G |
| `Manual_Card_Payment_Gas_Checks` | Card | Gas only |
| `Manual_Bank_Payment_Electric_Checks` | Bank | Electric only |
| `Manual_Bank_Payment_Electric_Gas_Checks` | Bank | E+G |
| `Manual_Bank_Payment_Gas_Checks` | Bank | Gas only |

### FailedPaymentChecks (12 methods)

Two recovery paths: **Alert Update** (update PM via Account page) and **Pay Bill Link/Button** (manual pay with existing PM).

**Bank failures (6)**:
- `Bank_Auto_Payment_Failed_Bank_Alert_Update_{Electric,Electric_Gas,Gas}_Bill`
- `Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_{Electric,Electric_Gas,Gas}_Bill`

**Card failures (6)**:
- `Card_Auto_Payment_Failed_Card_Alert_Update_{Electric,Electric_Gas,Gas}_Bill`
- `Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_{Electric,Electric_Gas,Gas}_Bill`

### paymentHelpers.ts

| Function | Purpose |
|----------|---------|
| `ensureRegistrationComplete(page, userId)` | Sets EA/GA to ACTIVE + registrationJobCompleted, reloads page |
| `getPaymentDetailsSingleChargeAccount(MoveIn)` | Gets EA, GA, single ChargeAccount IDs |
| `getPaymentDetailsMultipleChargeAccounts(MoveIn)` | Gets EA, GA, separate electric/gas ChargeAccount IDs |

---

## Database Query Functions

### billQueries (26 functions)

**Insert**: `insertElectricBill(eaId, amount?, usage?)`, `insertGasBill(gaId, amount?, usage?)`, `insertApprovedElectricBill(eaId, amount?, usage?)`, `insertApprovedGasBill(gaId, amount?, usage?)`

Note: `insertElectricBill` sets `visible=false`, randomizes amount (1000-99999 cents) and usage (10-99) if not provided. Dates: start=now-35d, end=now-5d, statement=now-1d, due=now+15d. No `ingestionState` (defaults to NULL).

**Approve**: `approveElectricBill(billId)`, `approveGasBill(billId)`

**Wait for processed**: `checkElectricBillIsProcessed(billId)`, `checkGasBillIsProcessed(billId)` — polls with BILL_PROCESSING_MAX_RETRIES (450 retries x 1s = 7.5 min)

**Get**: `getElectricBillId(eaId, amount, usage)`, `getGasBillId(gaId, amount, usage)`, `getElectricBillStartDate(billId)`, `getElectricBillEndDate(billId)`, `getGasBillStartDate(billId)`, `getGasBillEndDate(billId)`

**Poll flags** (electric + gas symmetric): `check{E|G}BillVisibility(id, bool)`, `check{E|G}BillReminder(id, bool)`, `check{E|G}BillPaidNotif(id, bool)`, `check{E|G}BillStatus(id, status)`, `check{E|G}BillProcessing(id)`, `check{E|G}BillServiceFee(id, amount, usage, fee)`

### paymentQueries (3 functions)

| Function | Retries | Purpose |
|----------|---------|---------|
| `checkPaymentStatus(userId, amount, status)` | 900 | Poll Payment until status matches |
| `checkPaymentProcessing(userId, amount)` | 3000 (FAST_POLL) | Poll until processing/succeeded/failed |
| `checkUtilityRemittance(caId, amount, status)` | 300 | Poll UtilityRemittance |

### blnkQueries (25 functions)

**Balances**: `getBalance(balId)`, `getBalanceSnapshot(balId)`, `getChargeAccountBalance(caId)`, `checkChargeAccountOutstanding(caId, dollars, retries?)`

**Transactions**: `getTransactionByReference(ref)`, `getTransactionsByPattern(pattern)`, `getTransactionsByPaymentId(payId)`, `checkTransactionStatus(ref, status, retries?)`, `checkTransactionDescription(ref, desc)`, `checkTransactionAmount(ref, dollars)`, `checkTransactionAccounts(ref, src, dst)`, `checkTransactionDoesNotExist(ref)`

**Cross-table verification**: `verifyPaymentChainConsistency(payId)` — full chain: Payment→contributions→BLNK remittance→fee_transfer→UtilityRemittance. `verifyFeeCalculation(payId, billCents, feeCents)` — verifies amount math + fee BLNK entry existence.

**Bill ingestion**: `verifyBillIngestionTransaction(type, billId, dollars, desc?)`

**Migration**: `verifyEffectiveDate(ref, dueDate)`, `checkTransactionMigrationStatus(ref)`, `verifyIdentityLinkedToBalance(balId)`, `getIdentity(identId)`, `verifyTransactionUniqueness(ref)`

Key: BLNK amounts in DOLLARS, Payment amounts in CENTS.

### accountQueries (15 functions)

**Get IDs**: `checkGetElectricAccountId(userId)`, `getElectricAccountId(userId)`, `checkGetGasAccountId(userId)`, `getGasAccountId(userId)`

**Charge account**: `getCheckChargeAccount(eaId, gaId)` — retries 2x with 60s delay

**Delinquency**: `setElectricDelinquent(eaId, days)`, `getElectricDelinquency(eaId)`, `waitForElectricDelinquencyCleared(eaId)`, and gas equivalents

---

## Page Object Methods

### OverviewPage — Payment-Related

**Balance & buttons**: `Check_Outstanding_Balance_Amount(elec, gas?)`, `Check_Outstanding_Balance_Message(msg)`, `Check_Pay_Bill_Button_Visible/Not_Visible/Enabled/Disabled`

**Utility cards**: `Check_Electricity_Card_Contain_Bill_Details(billId, amount, usage)` — checks start date (MMM dd), end date, amount, usage. `Check_Electricity_Card_Is_Clear(billId, amount, usage)` — asserts those 4 fields are NOT present. Same pattern for Gas.

**Other**: `Check_Get_Started_Widget_Not_Visible`, `Check_Inactive_Account_Alert_Visible`

**Payment setup**: `Enter_Auto_Payment_Details(cc, exp, cvc, country, zip)`, `Enter_Manual_Payment_Details(...)` (unchecks autopay), `Enter_Auto_Payment_Valid_Bank_Details(email, name)`, `Enter_Manual_Payment_Valid_Bank_Details(...)`, `Enter_Auto_Payment_Invalid_Bank_Details(...)`, `Select_Pay_In_Full_If_Flex_Enabled`

**Pay bill modal**: `Click_Pay_Bill_Button`, `Submit_Pay_Bill_Modal`, `Enter_Partial_Pay_Amount(dollars)`

**Autopay modal**: `Check_Autopay_Payment_Modal_Visible`, `Click_Autopay_Pay_Now`, `Click_Autopay_Do_It_Later`, `Check_Autopay_Outstanding_Amount(dollars)`

**Failed payment**: `Check_Click_Failed_Payment_Update_Payment_Link`, `Check_Payment_Failed_Message_In_Modal`

**Auth**: `Setup_Password(password="PublicGrid#1")` — tests 4 invalid passwords first, uses fill+Tab for TanStack blur. `Accept_New_Terms_And_Conditions` — handles password dialog first if present.

### BillingPage — Payment-Related

**Balance**: `Check_Outstanding_Balance_Amount(elec, gas?)`, `Check_Outstanding_Balance_Message(msg)`

**Bill History row**: `Check_Electric_Bill_Hidden/Visibility(usage)`, `Check_Electric_Bill_Status(usage, status)`, `Check_Electric_Bill_Amount(usage, amount)`, `Check_Electric_Bill_View_Button(usage)`. Same for Gas.

**Payments tab**: `Check_Payment_Status(amount, status)`, `Check_Payment_Transaction_Fee(amount, fee)`

**Actions**: `Click_Pay_Bill_Button`, `Submit_Pay_Bill_Modal`, `Goto_Bills_History_Tab`, `Goto_Payments_Tab`

### ProfilePage (Account page)

`Go_to_Payment_Info_Tab`, `click_Edit_Payment_Button`, `click_Setup_Payment_Button`

Card methods: `Enter_Auto_Payment_Details(...)`, `Enter_Manual_Payment_Details(...)`
Bank methods: `Enter_Auto_Payment_Valid_Bank_Details(email, name)`, `Enter_Manual_Payment_Valid_Bank_Details(...)`, `Enter_Auto_Payment_Invalid_Bank_Details(...)`

`Check_Payment_Initiated_Message` — asserts "Success" toast visible.

### SidebarChat

`Goto_Overview_Page_Via_Icon`, `Goto_Billing_Page_Via_Icon` — all call `Ensure_No_Overlay()` first (handles password dialog).

---

## Email Check Functions

All in `tests/resources/fixtures/fastmail_actions.ts`. All poll 120 retries x 1s (up to 2 min).

### Bill Arrival (autopay users)
| Function | Subject |
|----------|---------|
| `Check_Electric_Bill_Is_Ready(email, amount)` | "Your Electric bill is ready" |
| `Check_Gas_Bill_Is_Ready(email, amount)` | "Your Gas bill is ready" |
| `Check_Electric_And_Gas_Bill_Is_Ready(email, amount)` | "Your Electric and Gas bills are ready" |

### Bill Arrival (manual pay users)
| Function | Subject |
|----------|---------|
| `Check_Electric_Bill_Is_Ready_For_Payment(email, amount)` | "Your Electric bill is ready for payment" |
| `Check_Gas_Bill_Is_Ready_For_Payment(email, amount)` | "Your Gas bill is ready for payment" |
| `Check_Electric_And_Gas_Bill_Is_Ready_For_Payment(email, amount)` | "Your Electric and Gas bills are ready for payment" |

**FIXME gap**: `Check_Electric_Bill_Ready_Email` and `Check_Gas_Bill_Ready_Email` referenced in `manualPaymentChecks.ts` are NOT yet implemented.

### Payment Result
| Function | Subject |
|----------|---------|
| `Check_Bill_Payment_Confirmation(email, amount)` | "Your Bill Payment Confirmation" |
| `Check_Failed_Payment_Email(email, amount)` | "Payment Failed - Action Required" |
| `Check_Update_Payment_Method_Email(email)` | "[Urgent] - Update Your Payment Method" |

### Overdue Reminders
| Function | Subject |
|----------|---------|
| `Check_Payment_Reminder_Email(email, amount, billType)` | "ACTION REQUIRED: Overdue Payment for {type}" |
| `Check_Shutoff_Warning_Email(email, billType)` | "Urgent: {type} Shutoff Notice..." |
| `Check_Final_Shutoff_Email(email, billType)` | "Final Notice: {type} Service Scheduled for Shutoff" |

---

## Move-In Helper Functions

In `tests/resources/fixtures/moveIn/newUserFlows.ts`. All return `MoveInResult`.

| Function | Payment | Method | Bank | Notes |
|----------|---------|--------|------|-------|
| `newUserMoveInAutoPayment` | auto | card | — | Standard autopay with card |
| `newUserMoveInManualPayment` | manual | card | — | Unchecks autopay checkbox |
| `newUserMoveInSkipPayment` | skip | — | — | Skips Stripe, uses FourDaysFromNow date |
| `newUserMoveInAutoBankAccount` | auto | bank | valid | OAuth test bank |
| `newUserMoveInManualBankAccount` | manual | bank | valid | OAuth test bank, autopay off |
| `newUserMoveInAutoFailedBankAccount` | auto | bank | invalid | Failure test bank |
| `newUserMoveInManualFailedBankAccount` | manual | bank | invalid | Failure test bank, autopay off |
| `newUserMoveInEncouraged` | (2-step) | — | — | For pgtest/funnel shortcodes |

`MoveInResult`: `{ accountNumber, cottageUserId, pgUserName, pgUserFirstName, pgUserEmail, smsConsent }`

---

## UI State Mappings

### Payment Status → UI Labels

| DB `paymentStatus` | Payments Tab | Bill History Status |
|---|---|---|
| `scheduled_for_payment` | **Scheduled** | Visible |
| `requires_capture` / processing | **Processing** | **Processing** |
| `succeeded` | **Succeeded** | **Succeeded** |
| `failed` | — | **Failed** |
| `waiting_for_user` (manual only) | — | **Pending** |

### Bill `ingestionState` → UI Visibility

| State | Outstanding | Bill in History | Pay Button |
|---|---|---|---|
| NULL / raw | $0 | Hidden | Hidden |
| `approved` (pre-BLNK) | $0 | Hidden | Hidden |
| `approved` (post-BLNK entry) | $XX.XX | Hidden | Hidden |
| `processed` | $XX.XX | Visible | Visible |

### Outstanding Balance Messages

| State | Overview Message | Billing Message |
|---|---|---|
| No bills, autopay ON | "No bills! We'll notify you when next one appears" | "Enrolled in Auto-pay" |
| Bill scheduled, autopay ON | "Your auto-payment of $XX.XX is scheduled for tomorrow" | — |
| Payment failed, autopay ON | "Automatic payment failed!" alert | — |
| After success, autopay ON | "$0 — Enrolled in Auto-pay" | "$0 — Enrolled in Auto-pay" |

### Bill History Row Elements
- Visibility (hidden vs visible)
- Status badge (Pending / Processing / Failed / Succeeded)
- View button
- Amount ($XX.XX)
- Usage (XXX kWh / therms)

### Payments Tab Row Elements
- Amount
- Status (Scheduled / Processing / Succeeded)
- Transaction fee (card: $X.XX / bank: "-")

### Overview Utility Card Elements
- **Clear**: does NOT contain start date, end date, amount, usage
- **Has details**: contains start date (MMM dd), end date (MMM dd), amount, usage

---

## Spec File Coverage

### Summary (100 functional + 600 load tests)

| File | Tests | Tags | Focus |
|------|-------|------|-------|
| `auto_pay_successful_payment` | 11 | SMOKE(1), R1-R7 | Card/bank autopay success |
| `auto_pay_failed_payment` | 24 | R1-R7 | Card/bank fail→recover matrix |
| `manual_pay_successful_payment` | 19 | SMOKE(1), R1-R7 | Card/bank manual success + delinquency |
| `manual_pay_failed_payment` | 7 | R5-R7 | Manual fail→recover, cross-method, transitions |
| `auto_pay_reconciliation` | 3 | PAYMENT only | Inngest reconciliation (single, E+G, multi-cycle) |
| `payment_transitions` | 5 | PAYMENT only | Manual↔auto toggle, card↔bank switch |
| `onboarding_payment_variations` | 4 | PAYMENT only | Encouraged conversion, partner shortcode, finish-reg |
| `subscription_payment` | 3 | R6(1) | Inngest sub pipeline, 3DS failure |
| `manual_pay_overdue` | 10 | PAYMENT only | Reminders (5/15/18 days), offboarding, recovery |
| `flex_payment` | 3 | PAYMENT only | Flex pay-in-full, split redirect, non-flex |
| `blnk_ledger_verification` | 16 | ALL_REGRESSION | Fee, balance, cross-table, migration |
| `non_billing_bill_handling` | 6 | PAYMENT only | Non-billing viewable/stuck bills |
| `payment_load_test` | 600 | PAYMENT | Load generation (no verification) |

### SMOKE Payment Tests (2)
1. `auto_pay_successful_payment`: SDGE+SCE E+G card multiple CA
2. `manual_pay_successful_payment`: COMED+NGMA E card multiple CA

### Utility Companies Tested
COMED, EVERSOURCE, NGMA, CON-EDISON, BGE, SDGE, SCE, PSEG, DUKE, DTE, DELMARVA, PGE (load only)

Flex-enabled: COMED, EVERSOURCE

---

## Test Data Reference

### payment-data.json
- `ValidCardNUmber`: `"4242 4242 4242 4242"` (note: typo in key)
- `InvalidCardNumber`: `"4000 0000 0000 0341"`

### TestUser (generated by `generateTestUserData()`)
Key fields: `ElectricAmount` (cents), `ElectricAmountActual` (string for UI), `ElectricServiceFee` (cents), `ElectricAmountTotal` (amount+fee), `ElectricUsage` (kWh). Same pattern for Gas and Combined.

### Constants

| Constant | Value |
|----------|-------|
| `TIMEOUTS.DEFAULT` | 30s |
| `TIMEOUTS.POLL_INTERVAL` | 1s |
| `TIMEOUTS.FAST_POLL_INTERVAL` | 100ms |
| `RETRY_CONFIG.BILL_PROCESSING_MAX_RETRIES` | 450 (~7.5 min) |
| `RETRY_CONFIG.PAYMENT_STATUS_MAX_RETRIES` | 900 (~15 min) |
| `RETRY_CONFIG.PAYMENT_PROCESSING_MAX_RETRIES` | 3000 (~5 min at FAST_POLL) |
| `RETRY_CONFIG.UTILITY_REMITTANCE_MAX_RETRIES` | 300 (~5 min) |

---

## Common Patterns

### beforeEach Setup (all payment specs)
```typescript
await utilityQueries.updateBuildingBilling("autotest", true);
await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
await utilityQueries.updateBuildingOfferRenewableEnergy("autotest", false);
await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
```

### afterEach Cleanup
```typescript
if (MoveIn?.pgUserEmail) {
  await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
}
```

### Password Dialog (every fresh user)
Always call `Setup_Password()` before `Accept_New_Terms_And_Conditions()`. Default password: `PublicGrid#1`. For Playwright MCP sessions: fill `PG#12345` manually.

### Card vs Bank Key Differences

| Aspect | Card | Bank |
|--------|------|------|
| Fee | 3% + $0.30 | Free |
| Fee BLNK transaction | `fee_transfer_*` exists | Does NOT exist |
| Recovery on failure | Recoverable | HARD-CODED non-recoverable |
| Transaction fee in Payments tab | $X.XX | "-" |
| `stripePaymentMethodType` | `'card'` | `'us_bank_account'` |
| Service fee in tests | `ElectricServiceFee` (positive) | `null` |
| Test bank | N/A | OAuth institution (`featured-institution-default`) |
| Failed bank test | N/A | Failure institution (`[data-testid="failure"]`) |

### Charge Account Rules
- **Single CA**: electric only, gas only, E+G same company
- **Multiple CAs**: E+G different companies
- **Exception**: EVERSOURCE and NGMA always separate CAs

### Utility Assignment
`utilityQueries.updateCompaniesToBuilding("autotest", electricCo, gasCo)` — sets Building companies before each test.
