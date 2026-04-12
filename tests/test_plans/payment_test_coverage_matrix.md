# Payment Test Coverage Matrix

Generated: 2026-04-12

## Summary

| Metric | Count |
|--------|-------|
| **Total Payment Tests** | **99** (excluding load tests) |
| Test Spec Files | 12 |
| Auto-Payment Tests | 45 |
| Manual Payment Tests | 30 |
| BLNK Ledger Tests | 11 |
| Payment Transition Tests | 5 |
| Flex Payment Tests | 3 |
| Subscription Payment Tests | 3 |
| Onboarding Variation Tests | 4 |
| Load Test Templates | 6 (x100 iterations each = 600) |

---

## Tag Distribution

| Tag | Count | Notes |
|-----|-------|-------|
| `@payment` only (no regression tag) | 52 | On-demand via `--grep @payment` |
| `@smoke` | 2 | 1 auto-pay + 1 manual-pay |
| `@regression1` | 5 | 1 auto-success + 1 manual-success + 3 auto-fail |
| `@regression2` | 5 | 1 auto-success + 1 manual-success + 3 auto-fail |
| `@regression3` | 5 | 1 auto-success + 1 manual-success + 3 auto-fail |
| `@regression4` | 5 | 1 auto-success + 1 manual-success + 3 auto-fail |
| `@regression5` | 5 | 1 auto-success + 1 manual-success + 1 manual-fail + 2 auto-fail |
| `@regression6` | 6 | 1 auto-success + 1 manual-success + 1 manual-fail + 1 subscription + 2 auto-fail |
| `@regression7` | 5 | 1 auto-success + 1 manual-success + 1 manual-fail + 2 auto-fail |
| `ALL_REGRESSION` (R1-R7) | 11 | All BLNK ledger verification tests |

---

## Detailed Test Inventory by File

### 1. Auto-Pay — Successful Payment (10 tests)

**File:** `tests/e2e_tests/payment/auto-payment/auto_pay_successful_payment.spec.ts`

| # | Test Title | Payment Method | Utility | Account Type | Onboarding | Tags |
|---|-----------|----------------|---------|--------------|------------|------|
| 1 | EVERSOURCE Electric Only Valid Auto Payment Finish Account Added | Card | EVERSOURCE | Electric | Finish Acct | `@regression1`, `@payment` |
| 2 | PSEG Electric & Gas Valid Auto Payment Move In Added | Card | PSEG | E+G | Move In | `@regression2`, `@payment` |
| 3 | SDGE SCE Electric & Gas Valid Auto Payment Finish Account Added | Card | SDGE/SCE | E+G | Finish Acct | `@smoke`, `@payment` |
| 4 | NGMA NGMA Electric & Gas Valid Auto Payment Move In Added | Card | NGMA | E+G | Move In | `@regression3`, `@payment` |
| 5 | DUKE Gas Only Valid Auto Payment Move In Added | Card | DUKE | Gas | Move In | `@regression4`, `@payment` |
| 6 | COMED Electric Only Valid Bank Payment Move In Added | Bank | COMED | Electric | Move In | `@regression5`, `@payment` |
| 7 | DELMARVA Electric & Gas Valid Bank Payment Finish Account Added | Bank | DELMARVA | E+G | Finish Acct | `@regression6`, `@payment` |
| 8 | BGE DTE Electric & Gas Valid Bank Payment Move In Added | Bank | BGE/DTE | E+G | Move In | `@regression7`, `@payment` |
| 9 | EVERSOURCE EVERSOURCE Electric & Gas Valid Bank Payment Finish Account Added | Bank | EVERSOURCE | E+G | Finish Acct | `@payment` |
| 10 | BGE Gas Only Valid Bank Payment Finish Account Added | Bank | BGE | Gas | Finish Acct | `@payment` |

---

### 2. Auto-Pay — Failed Payment (24 tests)

**File:** `tests/e2e_tests/payment/auto-payment/auto_pay_failed_payment.spec.ts`

#### 3DS Card Failure → Message Update (3 tests)
| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 1 | COMED COMED Electric Only Profile Added to Failed Message Update | COMED | Electric | Message | `@regression1`, `@payment` |
| 2 | CON-EDISON CON-EDISON Electric & Gas Move In Added to Failed Message Update | CON-EDISON | E+G | Message | `@regression2` |
| 3 | BGE COMED Gas Only Move In Added to Failed Message Update | BGE/COMED | Gas | Message | `@regression3` |

#### 3DS Card Failure → Pay Bill Link Update (4 tests)
| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 4 | CON-EDISON Electric Only Move In Added to Pay Bill Link Update | CON-EDISON | Electric | Pay Bill Link | `@regression4` |
| 5 | COMED EVERSOURCE Electric & Gas Profile Added to Pay Bill Link Update | COMED/EVERSOURCE | E+G | Pay Bill Link | `@regression5` |
| 6 | COMED Gas Only Finish Account Added to Pay Bill Link Update | COMED | Gas | Pay Bill Link | `@regression6` |
| 7 | EVERSOURCE Electric Only Finish Account Added to Pay Button Update | EVERSOURCE | Electric | Pay Button | `@regression7` |

#### 3DS Card Failure → Pay Button Update (6 tests)
| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 8 | COMED BGE Electric & Gas Valid Profile Added to Pay Button Update | COMED/BGE | E+G | Pay Button | `@regression1` |
| 9 | BGE CON-EDISON Gas Only Move In Added to Pay Button Update | BGE/CON-EDISON | Gas | Pay Button | `@regression2` |
| 10 | CON-EDISON Electric Only Move In Added to Profile Update | CON-EDISON | Electric | Profile | `@regression3` |
| 11 | NGMA NGMA Electric & Gas Move In Added to Profile Update | NGMA | E+G | Profile | `@regression4` |
| 12 | CON-EDISON Gas Only Valid Profile Added to Profile Update | CON-EDISON | Gas | Profile | `@regression5` |
| 13 | COMED Electric Move In Added to Failed Message Update | COMED | Electric | Message | `@regression6` |

#### 3DS E+G Failure Scenarios (6 tests)
| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 14 | DTE DTE Electric & Gas Move In Added to Failed Message Update | DTE | E+G | Message | `@regression7` |
| 15 | EVERSOURCE NGMA Gas Profile Added to Failed Message Update | EVERSOURCE/NGMA | Gas | Message | `@regression1` |
| 16 | PSEG PSEG Electric Profile Added to Pay Bill Button Update | PSEG | Electric | Pay Bill Btn | `@regression2` |
| 17 | NGMA CON-EDISON Electric & Gas Finish Account Added to Pay Bill Button Update | NGMA/CON-EDISON | E+G | Pay Bill Btn | `@regression3` |
| 18 | NGMA Gas Finish Account Added to Pay Bill Button Update | NGMA | Gas | Pay Bill Btn | `@regression4` |
| 19 | NGMA NGMA Electric Profile Added to Pay Button Update | NGMA | Electric | Pay Button | `@regression5` |

#### 3DS Card Failure → Profile Update (5 tests)
| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 20 | EVERSOURCE COMED Electric & Gas Move In Added to Pay Button Update | EVERSOURCE/COMED | E+G | Pay Button | `@regression6` |
| 21 | BGE Gas Finish Account Added to Pay Button Update | BGE | Gas | Pay Button | `@regression7` |
| 22 | COMED Electric Move In Added to Profile Update | COMED | Electric | Profile | `@regression1` |
| 23 | BGE BGE Electric & Gas Move In Added to Profile Update | BGE | E+G | Profile | `@regression2` |
| 24 | EVERSOURCE CON-EDISON Gas Profile Added to Profile Update | EVERSOURCE/CON-EDISON | Gas | Profile | `@regression3` |

---

### 3. Auto-Pay — Reconciliation (3 tests)

**File:** `tests/e2e_tests/payment/auto-payment/auto_pay_reconciliation.spec.ts`

| # | Test Title | Utility | Account Type | Scenario | Tags |
|---|-----------|---------|--------------|----------|------|
| 1 | COMED Electric Only: auto-pay fails, user updates card, Inngest reconciliation succeeds | COMED | Electric | Single fail → reconcile | `@payment` |
| 2 | EVERSOURCE E+G: both bills fail, user updates card, Inngest reconciliation succeeds for both | EVERSOURCE | E+G | Dual fail → reconcile | `@payment` |
| 3 | COMED Electric Only: auto-pay fails twice, third card valid, Inngest reconciliation succeeds | COMED | Electric | Multi-fail → reconcile | `@payment` |

---

### 4. Onboarding Payment Variations (4 tests)

**File:** `tests/e2e_tests/payment/auto-payment/onboarding_payment_variations.spec.ts`

| # | Test Title | Flow Type | Shortcode | Account Type | Tags |
|---|-----------|-----------|-----------|--------------|------|
| 1 | P2-10: Encouraged conversion + billing (pgtest, Electric only) | Encouraged | pgtest | Electric | `@payment` |
| 2 | P2-11: Encouraged conversion E+G (pgtest, SDGE Electric + Gas) | Encouraged | pgtest | E+G | `@payment` |
| 3 | P2-12: Partner shortcode (funnel4324534, non-building) | Partner | funnel4324534 | — | `@payment` |
| 4 | P2-13: Finish registration flow (API-created user) | Finish Reg | API | — | `@payment` |

---

### 5. Subscription Payment (3 tests)

**File:** `tests/e2e_tests/payment/auto-payment/subscription_payment.spec.ts`

| # | Test Title | Scenario | Tags |
|---|-----------|----------|------|
| 1 | Active subscription generates metadata and processes payment via Inngest | Happy path | `@payment` |
| 2 | Cancel subscription stops metadata generation, re-subscribe resumes | Cancel + resubscribe | `@payment` |
| 3 | 3DS card auto-pay fails — cannot do 3DS in background | 3DS failure | `@regression6`, `@payment` |

---

### 6. Manual Pay — Successful Payment (16 tests)

**File:** `tests/e2e_tests/payment/manual-payment/manual_pay_successful_payment.spec.ts`

#### Card Payments (8 tests)
| # | Test Title | Utility | Account Type | Onboarding | Tags |
|---|-----------|---------|--------------|------------|------|
| 1 | NGMA Electric Only Valid Manual Card Payment Move In Added | NGMA | Electric | Move In | `@payment` |
| 2 | COMED NGMA Electric Only Valid Manual Card Payment Move In Added | COMED/NGMA | Electric | Move In | `@smoke`, `@payment` |
| 3 | CON-EDISON CON-EDISON Electric Only Valid Manual Card Payment Finish Account Added | CON-EDISON | Electric | Finish Acct | `@regression1`, `@payment` |
| 4 | EVERSOURCE EVERSOURCE Electric & Gas Valid Manual Card Payment Move In Added | EVERSOURCE | E+G | Move In | `@regression2`, `@payment` |
| 5 | NGMA BGE Electric & Gas Valid Manual Card Payment Finish Account Added | NGMA/BGE | E+G | Finish Acct | `@regression3`, `@payment` |
| 6 | COMED COMED Gas Only Valid Manual Card Payment Move In Added | COMED | Gas | Move In | `@regression4`, `@payment` |
| 7 | EVERSOURCE BGE Gas Only Valid Manual Card Payment Finish Account Added | EVERSOURCE/BGE | Gas | Finish Acct | `@payment` |
| 8 | EVERSOURCE Gas Only Valid Manual Card Payment Finish Account Added | EVERSOURCE | Gas | Finish Acct | `@payment` |

#### Bank Payments (8 tests)
| # | Test Title | Utility | Account Type | Onboarding | Tags |
|---|-----------|---------|--------------|------------|------|
| 9 | EVERSOURCE Electric Only Valid Manual Bank Payment Move In Added | EVERSOURCE | Electric | Move In | `@regression5`, `@payment` |
| 10 | COMED COMED Electric Only Valid Bank Payment Finish Account Added | COMED | Electric | Finish Acct | `@payment` |
| 11 | COMED CON-EDISON Electric Only Valid Bank Payment Finish Account Added | COMED/CON-EDISON | Electric | Finish Acct | `@payment` |
| 12 | BGE BGE Electric & Gas Valid Bank Payment Move In Added | BGE | E+G | Move In | `@regression6`, `@payment` |
| 13 | BGE NGMA Electric & Gas Valid Bank Payment Finish Account Added | BGE/NGMA | E+G | Finish Acct | `@payment` |
| 14 | NGMA NGMA Gas Only Valid Bank Payment Move In Added | NGMA | Gas | Move In | `@regression7`, `@payment` |
| 15 | CON-EDISON EVERSOURCE Gas Only Valid Bank Payment Move In Added | CON-EDISON/EVERSOURCE | Gas | Move In | `@payment` |
| 16 | COMED Gas Only Valid Bank Payment Finish Account Added | COMED | Gas | Finish Acct | `@payment` |

---

### 7. Manual Pay — Failed Payment (6 tests)

**File:** `tests/e2e_tests/payment/manual-payment/manual_pay_failed_payment.spec.ts`

| # | Test Title | Utility | Account Type | Recovery | Tags |
|---|-----------|---------|--------------|----------|------|
| 1 | COMED Electric Only — manual card fails, update card, re-pay succeeds | COMED | Electric | Update card | `@regression5`, `@payment` |
| 2 | EVERSOURCE EVERSOURCE Electric & Gas — manual card fails, update card, re-pay | EVERSOURCE | E+G | Update card | `@regression6`, `@payment` |
| 3 | DUKE Gas Only — manual card fails, update card, re-pay | DUKE | Gas | Update card | `@regression7`, `@payment` |
| 4 | COMED Electric — card fails, switch to bank, manual pay succeeds | COMED | Electric | Switch to bank | `@payment` |
| 5 | COMED Electric — auto-pay fails, user manually pays, next bill still auto-pays | COMED | Electric | Manual fallback | `@payment` |
| 6 | Auto-pay to manual: disable auto-pay, next bill requires manual payment | — | — | Disable auto-pay | `@payment` |

---

### 8. Flex Payment (3 tests)

**File:** `tests/e2e_tests/payment/manual-payment/flex_payment.spec.ts`

| # | Test Title | Utility | Scenario | Tags |
|---|-----------|---------|----------|------|
| 1 | COMED Electric — flex-enabled user sees split bill option, pays in full | COMED | Pay in full | `@payment` |
| 2 | COMED Electric — split bill option redirects to getflex.com | COMED | Split bill redirect | `@payment` |
| 3 | NGMA Electric — non-flex user does NOT see split bill option | NGMA | No flex | `@payment` |

---

### 9. Manual Pay — Overdue & Offboarding (8 tests)

**File:** `tests/e2e_tests/payment/manual-payment/manual_pay_overdue.spec.ts`

| # | Test Title | Scenario | Tags |
|---|-----------|----------|------|
| 1 | P2-20: 5 days overdue — standard reminder email sent | Reminder progression | `@payment` |
| 2 | P2-21: 15 days overdue — escalated reminder sent | Reminder progression | `@payment` |
| 3 | P2-22: 18 days overdue — shutoff warning email and SMS sent | Reminder progression | `@payment` |
| 4 | P2-23: 25+ days overdue — account transitions to NEEDS_OFF_BOARDING | Offboarding trigger | `@payment` |
| 5 | P2-26: Separate accounts — electric overdue, gas stays ACTIVE | E+G separate | `@payment` |
| 6 | P2-27: Same charge account — both accounts offboarded | E+G shared | `@payment` |
| 7 | P2-24: 25+ days overdue — full payment restores ACTIVE status | Recovery | `@payment` |
| 8 | P2-25: 25+ days overdue — partial payment stays NEEDS_OFF_BOARDING | Partial recovery | `@payment` |

---

### 10. Payment Transitions (5 tests)

**File:** `tests/e2e_tests/payment/payment-transitions/payment_transitions.spec.ts`

| # | Test Title | Utility | Scenario | Tags |
|---|-----------|---------|----------|------|
| 1 | COMED Electric — manual user enables auto-pay, next bill auto-pays | COMED | Manual → auto-pay | `@payment` |
| 2 | COMED Electric — manual user with outstanding, toggle auto-pay, pay now | COMED | Manual → auto + pay | `@payment` |
| 3 | COMED Electric — manual user with outstanding, toggle auto-pay, do it later, next bill auto-pays | COMED | Manual → auto + defer | `@payment` |
| 4 | COMED Electric — auto-pay card user switches to bank, bill auto-pays with no fee | COMED | Card → bank | `@payment` |
| 5 | COMED Electric — auto-pay bank user switches to card, bill auto-pays with fee | COMED | Bank → card | `@payment` |

---

### 11. BLNK Ledger Verification (11 tests)

**File:** `tests/e2e_tests/payment/blnk_ledger_verification.spec.ts`

| # | Test Title | Verification Target | Tags |
|---|-----------|---------------------|------|
| 1 | Card payment — fee = bankersRound(amount * 0.03 + 30) | Fee calculation (card) | `ALL_REGRESSION` |
| 2 | Bank payment — zero fee, no fee transaction | Fee calculation (bank) | `ALL_REGRESSION` |
| 3 | Balance transitions: before → ingestion → inflight → success | Balance state machine | `ALL_REGRESSION` |
| 4 | Payment ↔ Remittance ↔ BLNK ↔ TransactionMetadata (electric only) | Cross-table integrity | `ALL_REGRESSION` |
| 5 | Separate charge accounts — electric + gas consistency | E+G charge accounts | `ALL_REGRESSION` |
| 6 | All BLNK txn descriptions and references match catalog | Description catalog | `ALL_REGRESSION` |
| 7 | Each contribution has matching UtilityRemittance with correct amount | Remittance matching | `ALL_REGRESSION` |
| 8 | Approved bill creates APPLIED BLNK transaction with correct reference | Bill → BLNK txn | `ALL_REGRESSION` |
| 9 | BLNK-04a: New user charge account has BLNK identity linked to balance | Identity linking | `ALL_REGRESSION` |
| 10 | BLNK-01a: New bill transaction effective_date matches bill dueDate | Date accuracy | `ALL_REGRESSION` |
| 11 | BLNK-02a: Bill ingestion produces exactly 1 BLNK transaction per reference | Dedup integrity | `ALL_REGRESSION` |

---

### 12. Load Tests (6 templates x 100 iterations = 600 tests)

**File:** `tests/e2e_tests/payment/payment_load_test.spec.ts`

| # | Template | Utility | Account Type | Tags |
|---|----------|---------|--------------|------|
| 1 | COMED Electric Only Valid Auto Payment Move In Added | COMED | Electric | `@payment` |
| 2 | EVERSOURCE Electric Only Valid Auto Payment Move In Added | EVERSOURCE | Electric | `@payment` |
| 3 | BGE Gas Only Valid Auto Payment Move In Added | BGE | Gas | `@payment` |
| 4 | DELMARVA Electric & Gas Only Valid Auto Payment Move In Added | DELMARVA | E+G | `@payment` |
| 5 | NGMA Electric & Gas Only Valid Auto Payment Move In Added | NGMA | E+G | `@payment` |
| 6 | PGE PSEG Electric & Gas Only Valid Auto Payment Move In Added | PGE/PSEG | E+G | `@payment` |

> Load tests are on-demand only. Not included in CI regression scopes.

---

## Coverage Matrix: Utility Company x Payment Method x Payment Type

| Utility | Auto Card | Auto Bank | Manual Card | Manual Bank | Failed Auto | Failed Manual | Reconciliation |
|---------|:---------:|:---------:|:-----------:|:-----------:|:-----------:|:-------------:|:--------------:|
| COMED | - | R5 | Smoke | - | R1, R6, R1 | R5 | 2 tests |
| EVERSOURCE | R1 | - | R2 | R5 | R7, R1, R6 | R6 | 1 test |
| PSEG | R2 | - | - | - | R2 | - | - |
| SDGE/SCE | Smoke | - | - | - | - | - | - |
| NGMA | R3 | - | - | R7 | R4, R3, R4, R5 | - | - |
| DUKE | R4 | - | - | - | - | R7 | - |
| DELMARVA | - | R6 | - | - | - | - | - |
| BGE | - | R7 | - | R6 | R3, R2, R7 | - | - |
| CON-EDISON | - | - | R1 | - | R2, R4, R5, R3 | - | - |
| DTE | - | - | - | - | R7 | - | - |

**Legend:** Smoke = `@smoke`, R1-R7 = `@regression1`-`@regression7`, `-` = no test

---

## Coverage Matrix: Scenario Category x Account Type

| Scenario | Electric Only | E+G (separate) | E+G (shared) | Gas Only |
|----------|:------------:|:--------------:|:------------:|:--------:|
| Auto-pay success (card) | 1 | 3 | - | 1 |
| Auto-pay success (bank) | 1 | 3 | - | 1 |
| Auto-pay failed (3DS) | 8 | 10 | - | 6 |
| Auto-pay reconciliation | 2 | 1 | - | - |
| Manual pay success (card) | 3 | 2 | - | 3 |
| Manual pay success (bank) | 3 | 2 | - | 3 |
| Manual pay failed | 2 | 1 | - | 1 |
| Flex payment | 2 | - | - | - |
| Overdue/offboarding | - | 1 (separate) | 1 (shared) | - |
| Payment transitions | 5 (COMED) | - | - | - |
| Subscription | 3 | - | - | - |
| Onboarding variations | 1 | 1 | - | - |
| BLNK ledger | 6 | 2 | - | - |

---

## CI Scope Distribution (Payment Tests per Scope)

| Scope | Test Count | Source |
|-------|:----------:|--------|
| **Smoke** | **2** | 1 auto-pay (SDGE) + 1 manual-pay (COMED) |
| **Regression1** | **3 + 11 BLNK** | auto-success + manual-success + auto-fail + all BLNK |
| **Regression2** | **3 + 11 BLNK** | auto-success + manual-success + auto-fail + all BLNK |
| **Regression3** | **3 + 11 BLNK** | auto-success + manual-success + auto-fail + all BLNK |
| **Regression4** | **3 + 11 BLNK** | auto-success + manual-success + auto-fail + all BLNK |
| **Regression5** | **4 + 11 BLNK** | auto-success + manual-success + manual-fail + auto-fail + all BLNK |
| **Regression6** | **5 + 11 BLNK** | auto-success + manual-success + manual-fail + subscription + auto-fail + all BLNK |
| **Regression7** | **4 + 11 BLNK** | auto-success + manual-success + manual-fail + auto-fail + all BLNK |
| **@payment (on-demand)** | **88** | All tests with `@payment` tag (excludes BLNK `ALL_REGRESSION`) |

---

## Coverage Gaps

| Gap | Risk | Recommendation |
|-----|------|----------------|
| Payment transitions only test COMED Electric | Medium | Add E+G transition test (at least 1 utility) |
| No manual bank failure tests | Low | Card→bank switch partially covers this |
| Flex only tests COMED Electric | Low | Add 1 E+G flex test if flex expands |
| Overdue tests don't cover Electric-only | Medium | Add P2-20 style for Electric-only user |
| No Stripe webhook failure simulation | Medium | Requires webhook mock infrastructure |
| Subscription tests only cover COMED | Low | Subscription logic is utility-agnostic |
| SDGE/SCE only has 1 test (auto-pay smoke) | Medium | Add manual-pay SDGE test |
| DELMARVA only has 1 test (auto bank) | Low | Uncommon utility, low traffic |
| DTE only appears in failed auto-pay | Low | Uncommon utility |
