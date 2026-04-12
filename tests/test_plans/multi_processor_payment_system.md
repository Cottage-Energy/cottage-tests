# Test Plan: Multi-Processor Payment System

## Overview
**Project**: [Multi-Processor Payment System](https://linear.app/public-grid/project/multi-processor-payment-system-54806c1fd524/overview)
**Lead**: Cian Laguesma
**Date**: 2026-03-26
**Tester**: Christian
**Status**: Backlog — 74 tickets (all Backlog), 0% progress
**Tickets**: 58 task tickets + 16 epic/milestone tickets across 8 milestones
**Last synced**: 2026-03-26 (2nd pass)

## Business Context
Public Grid currently routes all payments through Stripe. This project introduces multi-processor support (Stripe + Helcim in v1) with a resolution hierarchy: **User config → Building defaults → MoveInPartner defaults → System default**. Goals: reduce processing costs, enable partner/building-specific routing, avoid processor lock-in.

## Scope

### In Scope
- 8 milestones: DB Schema → FE Payment Setup → Services Payment Setup → Billing Engine → FE Manual Payment/3DS → PG-Admin → Backfill → Adhoc
- Processor resolution logic (4-level hierarchy)
- Stripe adapter (refactored from current implementation)
- Helcim adapter (new in v1)
- Frontend payment form routing (card + bank, per provider)
- Billing engine charge processing per provider
- BLNK ledger routing per provider
- Inngest payment flow refactors
- PG-Admin processor config management
- Data migration from legacy Stripe columns
- Backwards compatibility during rollout

### Out of Scope (per project definition)
- Fallback mechanism for payment failures
- Automated fallback deactivation policy
- Household-member payment expansion
- ZGO/Built production rollout
- Flex payments (separate rail)
- Light + TX-dereg flows (excluded from M2)

### Prerequisites
- Dev environment with Supabase access
- Stripe test keys and test cards (`4242 4242 4242 4242`)
- Helcim sandbox/test credentials (TBD — need from dev team)
- Inngest dev event key for payment flow testing
- PG-Admin dev access
- Test buildings configured with different processor defaults
- Test users with different processor config overrides

### Dependencies
- `cottage-nextjs` (FE payment forms, server loaders)
- `services` (backend adapters, processor resolution, billing engine, Inngest flows)
- `pg-admin` (admin UI for processor config)
- Helcim sandbox API availability
- BLNK ledger service
- Stripe test environment

---

## Current State Baseline

### Existing DB Schema (pre-migration)
| Table | Payment-Relevant Columns | Notes |
|-------|-------------------------|-------|
| `Payment` | `stripePaymentID`, `paymentMethodID`, `paymentStatus`, `amount`, `ledgerTransactionID` | Stripe-specific — will gain `providerPaymentID` + `provider` in M4 |
| `PaymentInstrument` | `type`, `reference`, `provider`, `isActive`, `allowOnboard`, `utilityCompanyId` | Already has `provider` column — possible early groundwork |
| `Building` | `isDefaultBillingEnabled`, `setUpPaymentDuringOnboarding` | NO `defaultCard`/`defaultBank` yet |
| `MoveInPartner` | `setUpPaymentDuringOnboarding` | NO `defaultCard`/`defaultBank` yet |

### New Tables (M1 — do NOT exist yet)
- `PaymentProvider` — replaces payment_provider enum
- `UserProcessorAccount` — per-user processor account (e.g., Stripe customer ID, Helcim customer token)
- `UserPaymentMethod` — per-user payment method with provider reference
- `PaymentProcessorConfig` — system + user scope overrides

### Existing Test Coverage (will need refactoring)
- **Auto-pay tests**: 9 passing (Stripe card + bank, 5 utilities)
- **Manual payment tests**: ~15 (all FIXME/disabled)
- **POMs**: `BillingPage` (Stripe iframe), `OverviewPage` (payment method mgmt)
- **Fixtures**: `PaymentUtilities` (pipeline), `PaymentQueries` (DB verification)
- **Test data**: `payment-data.json` (Stripe test cards)

---

## Ticket → Test Case Mapping

Reference for activating test cases as tickets move to development. Each ticket maps to the test cases it affects.

### Milestone 1: Database Schema (9 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2495 | Create PaymentProvider table | M1-001, M1-002 |
| ENG-2496 | Create new enums: payment_method_type, payment_method_status | M1-008, M1-009, M1-016, M1-017 |
| ENG-2497 | Create UserProcessorAccount table | M1-003, M1-010, M1-011 |
| ENG-2498 | Create UserPaymentMethod table | M1-004, M1-012 |
| ENG-2499 | Create PaymentProcessorConfig table | M1-005, M1-014 |
| ENG-2500 | Add defaultProvider columns to Building table | M1-006, M1-013 |
| ENG-2501 | Add defaultProvider columns to MoveInPartner table | M1-007 |
| ENG-2502 | Seed system defaults and initial PaymentProvider rows | M1-002 |
| ENG-2503 | (OPTIONAL) Add RLS policies for new payment tables | M1-015 |
| **Epic** | ENG-2494 — Milestone 1: Database Schema | — |

### Milestone 2: (FE) Payment Method Setup & Management (12 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2505 | Create packages/payment-processors package | M2-001 (infra) |
| ENG-2506 | Implement StripePaymentProcessor | M2-001, M2-003, M2-006, M2-034 |
| ENG-2507 | Implement HelcimPaymentProcessor | M2-002, M2-004, M2-007, M2-033 |
| ENG-2508 | Create generic payment API routes | M3-001, M3-007 |
| ENG-2509 | Build payment form router component | M2-005, M2-024, M2-035 |
| ENG-2510 | Resolve provider in move-in page.tsx + dashboard | M2-012, M2-020–M2-024, M2-014 |
| ENG-2511 | Refactor payment method display components | M2-009, M2-010, M2-011 |
| ENG-2512 | Refactor move-in payment flow | M2-012, M2-013, M2-036 |
| ENG-2513 | Refactor dashboard + account settings payment surfaces | M2-009, M2-010, M2-011 |
| ENG-2514 | Dual-write to new tables on payment method setup/edit | M2-008, M2-040–M2-044, CC-002 |
| ENG-2515 | New read queries for UserPaymentMethod + UserProcessorAccount | M2-040, M2-041 |
| ENG-2516 | Exclude Light + TX-dereg + Flex from processor resolution | M2-030, M2-031, M2-032 |
| **Epic** | ENG-2504 — Milestone 2: Payment Method Setup & Management | — |

### Milestone 3: (Services) Payment Method Setup & Management (8 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2517 | Create services/packages/payment-processors package | M3-001 (infra) |
| ENG-2518 | Implement StripePaymentProcessor (backend) | M3-002, M3-004, M3-010 |
| ENG-2519 | Implement HelcimPaymentProcessor (backend) | M3-003, M3-005, M3-011 |
| ENG-2520 | Dual-write in customer creation flows | M3-006, M2-043 |
| ENG-2521 | Dual-write in payment_method.attached webhook | M2-040, M2-041 |
| ENG-2522 | Dual-write in microdeposit verification flow | M2-042 |
| ENG-2523 | Helcim environment + API config | M3-003, M3-005 (prereq) |
| ENG-2524 | Helcim webhook endpoint (setup events only) | M3-005 |

### Milestone 4: (Services) Billing Engine & Charge Processing (17 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2527 | Payment table changes — providerPaymentID + provider columns | M4-005 |
| ENG-2528 | Extend adapter interface with charge methods | M4-001 (infra) |
| ENG-2529 | Extract Stripe charge logic into adapter | M4-001, M4-003 |
| ENG-2530 | Implement Helcim charge adapter | M4-002, M4-004 |
| ENG-2531 | Refactor payment-processor.ts — provider-aware charging | M4-001, M4-002, M4-030 |
| ENG-2532 | Refactor validation — checkPaymentMethodConfiguration | M4-030, M4-031 |
| ENG-2533 | (Optional) Cross-processor fallback charge logic | M4-031 (negates if not built) |
| ENG-2534 | Refactor auto-pay reconciliation — provider-aware | M4-008, M4-013 |
| ENG-2535 | Refactor ledger balance application — provider-aware | M4-006, M4-007 |
| ENG-2536 | Provider-aware capture job | M4-012 |
| ENG-2537 | Refactor payment success flow + remittance routing | M4-010 |
| ENG-2538 | Refactor payment failed flow | M4-011 |
| ENG-2539 | Refactor subscription payment flow — provider-aware | M4-008 |
| ENG-2540 | Helcim charge webhook handling | M4-020 |
| ENG-2541 | Helcim payout/settlement handling | M4-021 |
| ENG-2542 | Refactor manual payment flow — provider-aware | M4-003, M4-004 |
| ENG-2560 | Realtime Fee Calculation via provider API | M4-040 *(new — see below)* |
| **Epics** | ENG-2525, ENG-2526 — Milestone 3: Billing Engine | — |

### Milestone 5: (FE) Manual Payment & 3DS Provider Abstraction (3 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2544 | Refactor use3DSVerification hook — provider-agnostic | M5-003, M5-004, M5-010 |
| ENG-2545 | Refactor /api/payments/manual error handling — provider-aware | M5-001, M5-002, M5-005, M5-006 |
| ENG-2558 | UX improvements for Auto-Pay (processing msg + cancel via toggle) | M5-020, M5-021 *(new — see below)* |
| **Epic** | ENG-2543 — Milestone 3 Frontend: Manual Payment & 3DS | — |

### Milestone 6: PG-Admin (1 ticket)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2547 | PG Admin — display payment details from new tables | M6-001, M6-004, M6-005, M6-006 |
| **Epic** | ENG-2546 — Milestone 4: PG Admin | — |

### Milestone 8: Adhoc (1 ticket)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2548 | PG Admin — user-level processor config overrides | M6-002, M6-003, M6-010, M6-011, M6-020 |

> **Note on M8**: Created to hold the open UX question: when admin overrides a user's processor, should the user be prompted for a new payment method? Includes `shouldChangePaymentMethod` flag concept, auto-pay implications, and pre-email clearing. Test cases remain mapped to M6-0xx IDs since they test admin config functionality.

### Milestone 7: Backfill (7 tickets)
| Ticket | Title | Test Cases |
|--------|-------|------------|
| ENG-2550 | Backfill UserProcessorAccount from CottageUsers | M7-001, M7-006, M7-020, M7-022 |
| ENG-2551 | Backfill UserPaymentMethod from CottageUsers | M7-002, M7-006, M7-021, M7-022 |
| ENG-2552 | Enrich UserPaymentMethod metadata from Stripe API | M7-005 |
| ENG-2553 | Backfill Payment.provider + providerPaymentID | M7-003, M7-004 |
| ENG-2554 | Validate backfill data consistency | M7-006, M7-010–M7-015 |
| ENG-2555 | Remove fallback reads from legacy columns | M7-023, M7-010–M7-015 |
| ENG-2556 | Deprecate legacy CottageUsers Stripe columns | M7-023 |
| **Epic** | ENG-2549 — Milestone 5: Backfill Migration | — |

### Unassigned / High-Level Epics (no milestone, 8 tickets)
| Ticket | Title | Notes |
|--------|-------|-------|
| ENG-2485 | Create PaymentProvider model and provider references | Overlaps M1 — likely original planning ticket |
| ENG-2486 | Add provider defaults to Building and MoveInPartner | Overlaps M1 |
| ENG-2487 | Implement user payment processor config and resolution logic | Overlaps M2/M3 |
| ENG-2488 | Migrate billing and payment records to provider-based model | Overlaps M7 |
| ENG-2489 | Create multi-processor payment schema and migration path | Overlaps M1 |
| ENG-2490 | Implement Stripe and Helcim adapters and webhooks | Overlaps M2/M3/M4 |
| ENG-2491 | Build multi-processor payment collection and method management UI | Overlaps M2 |
| ENG-2492 | Add PG Admin support for processor visibility and overrides | Overlaps M6 |
| ENG-2493 | Update ledger and reconciliation for multiple payment providers | Overlaps M4 |

> **Note**: The 8 unassigned tickets (ENG-2485–2493) appear to be the original high-level planning tickets created before the milestones were broken down into granular tasks. They overlap with milestone-assigned tickets and likely won't move independently.

---

## Milestone 1: Database Schema

### Happy Path — Schema Validation
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M1-001 | PaymentProvider table exists with correct columns | 1. Query `information_schema.columns` for `PaymentProvider` | Table has: id, name, type (card/bank/both), isActive, config (jsonb), created_at, updated_at | P0 | Yes (DB) |
| M1-002 | PaymentProvider seeded with Stripe and Helcim | 1. Query `PaymentProvider` rows | At least 2 rows: Stripe (active) and Helcim (active) | P0 | Yes (DB) |
| M1-003 | UserProcessorAccount table exists | 1. Query schema for `UserProcessorAccount` | Table has: id, cottageUserID (FK), paymentProviderID (FK), externalAccountID, metadata, created_at | P0 | Yes (DB) |
| M1-004 | UserPaymentMethod table exists | 1. Query schema for `UserPaymentMethod` | Table has: id, userProcessorAccountID (FK), externalMethodID, type (enum: card/bank), status (enum: active/inactive/expired), last4, brand, metadata, created_at, updated_at | P0 | Yes (DB) |
| M1-005 | PaymentProcessorConfig table exists | 1. Query schema for `PaymentProcessorConfig` | Table has: id, scope (system/user), scopeID (nullable), cardProviderID (FK), bankProviderID (FK), created_at, updated_at | P0 | Yes (DB) |
| M1-006 | Building has defaultCard and defaultBank columns | 1. Query Building columns | `defaultCard` and `defaultBank` columns exist, both FK to PaymentProvider, both nullable | P1 | Yes (DB) |
| M1-007 | MoveInPartner has defaultCard and defaultBank columns | 1. Query MoveInPartner columns | `defaultCard` and `defaultBank` columns exist, both FK to PaymentProvider, both nullable | P1 | Yes (DB) |
| M1-008 | payment_method_type enum exists | 1. Query pg_enum for payment_method_type | Enum values include: card, bank (at minimum) | P1 | Yes (DB) |
| M1-009 | payment_method_status enum exists | 1. Query pg_enum for payment_method_status | Enum values include: active, inactive, expired (at minimum) | P1 | Yes (DB) |

### Edge Cases — Constraints & Integrity
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M1-010 | UserProcessorAccount FK to CottageUser enforced | 1. Insert UserProcessorAccount with invalid cottageUserID | FK violation error | P1 | Yes (DB) |
| M1-011 | UserProcessorAccount FK to PaymentProvider enforced | 1. Insert with invalid paymentProviderID | FK violation error | P1 | Yes (DB) |
| M1-012 | UserPaymentMethod FK to UserProcessorAccount enforced | 1. Insert with invalid userProcessorAccountID | FK violation error | P1 | Yes (DB) |
| M1-013 | Building.defaultCard FK to PaymentProvider enforced | 1. Update Building with invalid defaultCard UUID | FK violation error | P1 | Yes (DB) |
| M1-014 | PaymentProcessorConfig unique constraint on scope+scopeID | 1. Insert duplicate scope+scopeID combination | Unique violation error | P2 | Yes (DB) |
| M1-015 | Existing tables unaffected by migration | 1. Query Payment, CottageUser, Building row counts before/after migration | Row counts match, no data loss | P0 | Yes (DB) |

### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M1-016 | Cannot insert UserPaymentMethod with invalid status | 1. Insert with status = 'bogus' | Enum check violation | P2 | Yes (DB) |
| M1-017 | Cannot insert UserPaymentMethod with invalid type | 1. Insert with type = 'crypto' | Enum check violation | P2 | Yes (DB) |

---

## Milestone 2: (FE) Payment Method Setup & Management

### Happy Path — Processor Resolution & Form Routing
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M2-001 | Stripe card form renders when Stripe is resolved processor (system default) | 1. Navigate to move-in with `?shortCode=autotest` 2. Reach payment step 3. Select credit card | Stripe card iframe renders (familiar `[title="Secure payment input frame"]`) | P0 | Yes |
| M2-002 | Helcim card form renders when Helcim is resolved processor | 1. Configure test building with `defaultCard` → Helcim 2. Navigate to move-in for that building 3. Reach payment step 4. Select credit card | HelcimPay.js form renders (NOT Stripe iframe) | P0 | Yes |
| M2-003 | Stripe bank form renders when Stripe is resolved for bank | 1. Navigate to payment step 2. Select bank account tab | Stripe ACH form renders | P0 | Yes |
| M2-004 | Helcim bank form renders when Helcim is resolved for bank | 1. Configure building with `defaultBank` → Helcim 2. Navigate to payment step 3. Select bank account | Helcim bank form renders | P0 | Yes |
| M2-005 | Type selector appears when card and bank have different providers | 1. Configure building: `defaultCard` → Stripe, `defaultBank` → Helcim 2. Navigate to payment step | Both card and bank tabs available; switching tabs loads correct provider form | P1 | Yes |
| M2-006 | Payment method saved successfully via Stripe adapter | 1. Fill Stripe card form with `4242 4242 4242 4242` 2. Submit | Payment method saved, user redirected to next step, success confirmation shown | P0 | Yes |
| M2-007 | Payment method saved successfully via Helcim adapter | 1. Fill Helcim card form with test card 2. Submit | Payment method saved, user redirected, success confirmation | P0 | Yes |
| M2-008 | Dual-write: new tables populated alongside legacy columns | 1. Complete payment method setup 2. Query DB | `UserProcessorAccount` row created, `UserPaymentMethod` row created, AND legacy CottageUser Stripe columns still populated | P0 | Yes (DB) |
| M2-009 | Update payment method on Overview page (Stripe) | 1. Sign in as existing user 2. Go to Overview → payment method 3. Update card via Stripe form | New payment method saved, old one replaced, dual-write to both old and new tables | P1 | Yes |
| M2-010 | Update payment method on Overview page (Helcim) | 1. Sign in as Helcim-configured user 2. Go to Overview → payment method 3. Update card via Helcim form | New payment method saved via Helcim adapter | P1 | Yes |
| M2-011 | Update payment method on Billing page (Stripe) | 1. Sign in → Billing → Update payment method | Stripe form renders, method updated successfully | P1 | Yes |
| M2-012 | Add payment method during move-in (autotest, standard billing) | 1. Complete move-in flow with `?shortCode=autotest` through payment step | Payment method collected via resolved provider, onboarding completes | P0 | Yes |
| M2-013 | Add payment method during finish registration | 1. Trigger finish-reg via API 2. Complete flow through payment step | Payment method collected via resolved provider | P1 | Yes |
| M2-014 | Server loader passes resolved providers to frontend | 1. Inspect network response on payment page | Loader response includes `resolvedCardProvider` and `resolvedBankProvider` fields | P1 | Exploratory |

### Processor Resolution Hierarchy
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M2-020 | Resolution: User config overrides everything | 1. Set user PaymentProcessorConfig → Helcim 2. Set building default → Stripe 3. Navigate to payment form | Helcim form renders (user config wins) | P0 | Yes |
| M2-021 | Resolution: Building default used when no user config | 1. Ensure no user-level config 2. Set building `defaultCard` → Helcim 3. Navigate to payment form | Helcim form renders (building default used) | P0 | Yes |
| M2-022 | Resolution: MoveInPartner default used when no user or building config | 1. No user config 2. Building `defaultCard` = NULL 3. MoveInPartner `defaultCard` → Helcim 4. Navigate | Helcim form renders | P1 | Yes |
| M2-023 | Resolution: System default used as fallback | 1. No user config 2. Building defaults = NULL 3. MoveInPartner defaults = NULL 4. Navigate | System default (Stripe) form renders | P0 | Yes |
| M2-024 | Resolution: Card and bank can resolve to different providers | 1. Building `defaultCard` → Helcim, `defaultBank` → Stripe 2. Switch between tabs | Card tab shows Helcim, bank tab shows Stripe | P1 | Yes |

### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M2-030 | Light flow excluded from multi-processor | 1. Navigate to Light move-in (`2900 Canton St`, unit `524`) 2. Reach payment step | Stripe form renders regardless of building/partner config (Light excluded) | P1 | Yes |
| M2-031 | TX-dereg flow excluded from multi-processor | 1. Navigate to move-in with TX zip (`75063`) 2. Reach payment step | Stripe form renders regardless of config (TX-dereg excluded) | P1 | Yes |
| M2-032 | Non-billing flow: no payment form shown | 1. Move-in for non-billing building (maintainedFor IS NULL config) | No payment form rendered, no processor resolution attempted | P1 | Yes |
| M2-033 | Helcim form validation errors displayed | 1. Fill Helcim form with invalid card data 2. Submit | Client-side validation errors shown in Helcim form | P2 | Yes |
| M2-034 | Stripe form validation errors still work | 1. Fill Stripe form with invalid card `4000 0000 0000 0341` 2. Submit | Stripe validation error displayed as before refactor | P1 | Yes |
| M2-035 | Payment form loading state while resolving provider | 1. Navigate to payment step 2. Observe form area | Loading skeleton/spinner shown until provider resolved and form loaded | P2 | Exploratory |
| M2-036 | Browser back/forward through payment step | 1. Reach payment step 2. Go back 3. Come forward | Correct provider form re-renders without error | P2 | Exploratory |

### Database Verification
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M2-040 | UserProcessorAccount created on first payment setup | 1. New user completes payment setup | `UserProcessorAccount` row: correct cottageUserID, correct paymentProviderID, valid externalAccountID | P0 | Yes (DB) |
| M2-041 | UserPaymentMethod created with correct metadata | 1. Complete payment setup with card | `UserPaymentMethod` row: type=card, status=active, last4 matches, brand matches | P0 | Yes (DB) |
| M2-042 | Bank payment method stored correctly | 1. Complete payment setup with bank account | `UserPaymentMethod` row: type=bank, status=active | P1 | Yes (DB) |
| M2-043 | Legacy CottageUser columns still written (dual-write) | 1. Complete payment setup 2. Query CottageUser | Legacy Stripe columns populated (stripeCustomerID, stripePaymentMethodID) for backwards compat | P0 | Yes (DB) |
| M2-044 | Replacing payment method updates UserPaymentMethod status | 1. Add card 2. Replace with new card | Old UserPaymentMethod status → inactive, new one → active | P1 | Yes (DB) |

---

## Milestone 3: (Services) Payment Method Setup & Management

### Happy Path — Backend Adapter & Resolution
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M3-001 | Processor resolution API returns correct provider | 1. Call resolution endpoint for user with user-level config | Response includes resolved card and bank providers matching user config | P0 | Yes (API) |
| M3-002 | Stripe adapter: createCustomer works | 1. Trigger payment setup for Stripe-resolved user | Stripe customer created, `UserProcessorAccount` populated with Stripe customer ID | P0 | Yes (DB) |
| M3-003 | Helcim adapter: createCustomer works | 1. Trigger payment setup for Helcim-resolved user | Helcim customer token created, `UserProcessorAccount` populated | P0 | Yes (DB) |
| M3-004 | Stripe adapter: attachPaymentMethod works | 1. Submit Stripe card for Stripe-resolved user | PaymentMethod attached to Stripe customer, `UserPaymentMethod` created | P0 | Yes (DB) |
| M3-005 | Helcim adapter: attachPaymentMethod works | 1. Submit Helcim card for Helcim-resolved user | Card tokenized via Helcim, `UserPaymentMethod` created | P0 | Yes (DB) |
| M3-006 | Dual-write to legacy + new tables on backend | 1. Complete payment setup via any adapter 2. Query both old and new tables | Both CottageUser legacy columns AND new UserProcessorAccount/UserPaymentMethod populated | P0 | Yes (DB) |
| M3-007 | Resolution hierarchy tested at API level | 1. Set up user with building default (Helcim) and no user config 2. Call resolution API | Returns Helcim as resolved provider | P1 | Yes (API) |

### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M3-010 | Stripe adapter handles API error gracefully | 1. Trigger payment setup with invalid Stripe test card | Error returned to frontend, no partial data in new tables | P1 | Yes |
| M3-011 | Helcim adapter handles API error gracefully | 1. Trigger Helcim payment setup with invalid data | Error returned to frontend, no partial data in new tables | P1 | Yes |
| M3-012 | Resolution returns system default when all levels null | 1. User with no config, building defaults null, partner defaults null | System default provider returned | P1 | Yes (API) |

---

## Milestone 4: (Services) Billing Engine & Charge Processing

### Happy Path — Charge Routing
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M4-001 | Auto-pay charge routed through Stripe adapter | 1. Set up billing user with Stripe payment method 2. Insert approved bill 3. Wait for balance-ledger-batch + capture | Payment created with `provider=stripe`, `providerPaymentID` = Stripe payment intent ID, status → succeeded | P0 | Yes |
| M4-002 | Auto-pay charge routed through Helcim adapter | 1. Set up billing user with Helcim payment method 2. Insert approved bill 3. Wait for ledger + capture | Payment created with `provider=helcim`, `providerPaymentID` = Helcim transaction ID, status → succeeded | P0 | Yes |
| M4-003 | Manual payment via Stripe | 1. Sign in as Stripe user 2. Billing → Pay bill 3. Confirm payment | Payment processed via Stripe, correct providerPaymentID | P0 | Yes |
| M4-004 | Manual payment via Helcim | 1. Sign in as Helcim user 2. Billing → Pay bill 3. Confirm payment | Payment processed via Helcim, correct providerPaymentID | P0 | Yes |
| M4-005 | Payment table has provider and providerPaymentID columns | 1. Query Payment table schema | New columns: `provider` (text/enum), `providerPaymentID` (text) alongside legacy `stripePaymentID` | P0 | Yes (DB) |
| M4-006 | BLNK ledger routes to Stripe accounts | 1. Stripe user payment succeeds 2. Check BLNK transaction | Transaction posted to `@Stripe`/`@StripeFees` ledger accounts | P1 | Yes (DB) |
| M4-007 | BLNK ledger routes to Helcim accounts | 1. Helcim user payment succeeds 2. Check BLNK transaction | Transaction posted to `@Helcim`/`@HelcimFees` ledger accounts | P1 | Yes (DB) |
| M4-008 | Subscription auto-pay works with new adapter | 1. Activate subscription for Stripe user 2. Trigger `transaction-generation-trigger` 3. Trigger `subscriptions-payment-trigger` | Payment processed through adapter, subscription metadata resolved | P1 | Yes |

### Inngest Flow Refactors
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M4-010 | payment-success Inngest flow handles both providers | 1. Complete Stripe payment 2. Complete Helcim payment | Both trigger payment-success flow, email sent for both | P1 | Yes |
| M4-011 | payment-failed Inngest flow handles both providers | 1. Force Stripe payment failure 2. Force Helcim payment failure | Both trigger payment-failed flow, correct error handling | P1 | Yes |
| M4-012 | stripe-payment-capture-batch refactored for multi-provider | 1. Payments exist for both Stripe and Helcim in `requires_capture` 2. Wait for cron | Each payment captured via its respective provider's API | P0 | Yes |
| M4-013 | balance-ledger-batch creates Payment with provider field | 1. Insert approved bill for Helcim user 2. Wait for cron | Payment created with `provider=helcim` (not hardcoded stripe) | P0 | Yes (DB) |

### Helcim-Specific
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M4-020 | Helcim charge webhook received and processed | 1. Complete Helcim charge 2. Webhook fires | Webhook processed, Payment status updated | P1 | Exploratory |
| M4-021 | Helcim payout/settlement recorded | 1. After Helcim charges settle | Payout record created, reconciliation data available | P2 | Exploratory |
| M4-022 | Helcim refund processed via adapter | 1. Trigger refund for Helcim payment | Refund executed via Helcim API, `refundedAmount` updated | P1 | Exploratory |

### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M4-030 | Charge fails — no partial capture | 1. Force charge failure (e.g., declined card) | Payment status → failed, no capture attempted, no ledger entry | P0 | Yes |
| M4-031 | No fallback to other provider on failure (v1 — explicitly excluded) | 1. Helcim charge fails | Payment stays failed, does NOT retry via Stripe | P1 | Yes |
| M4-032 | Invalid provider in Payment record handled | 1. (Edge case) Payment with unknown provider value | Graceful error, logged, no crash in billing pipeline | P2 | Exploratory |

### Realtime Fee Calculation (ENG-2560)
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M4-040 | Fee calculation returns correct fee per provider | 1. Call fee calculation API for Stripe card 2. Call for Helcim card | Each returns provider-specific fee amount (may differ between providers) | P1 | Yes (API) |
| M4-041 | Fee calculation reflects in payment UI | 1. User on payment form 2. Observe fee/service charge display | Fee shown matches realtime calculation from provider API, not a hardcoded value | P1 | Yes |
| M4-042 | Fee calculation handles provider API timeout gracefully | 1. Simulate slow/failed provider fee API | Graceful fallback — either default fee or clear error, no broken UI | P2 | Exploratory |

---

## Milestone 5: (FE) Manual Payment & 3DS Provider Abstraction

### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M5-001 | Manual payment form routes to Stripe for Stripe user | 1. Sign in as Stripe user 2. Billing → Pay bill | Stripe payment form rendered with correct amount | P0 | Yes |
| M5-002 | Manual payment form routes to Helcim for Helcim user | 1. Sign in as Helcim user 2. Billing → Pay bill | Helcim payment form rendered with correct amount | P0 | Yes |
| M5-003 | Stripe 3DS challenge handled | 1. Use Stripe test card that triggers 3DS (`4000 0025 0000 3155`) 2. Pay bill | 3DS modal appears, complete challenge, payment succeeds | P1 | Yes |
| M5-004 | Helcim 3DS challenge handled | 1. Use Helcim test scenario that triggers 3DS 2. Pay bill | 3DS challenge handled via Helcim flow, payment succeeds | P1 | Exploratory |
| M5-005 | Manual payment success confirmation | 1. Complete manual payment via either provider | Success message shown, payment history updated, correct amount displayed | P0 | Yes |
| M5-006 | Manual payment reflected in billing history | 1. Complete manual payment 2. Navigate to Billing → Payments tab | Payment appears with correct amount, date, status, and provider indicator | P1 | Yes |

### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M5-010 | 3DS challenge cancelled/failed | 1. Trigger 3DS 2. Cancel or fail the challenge | Payment not processed, user returned to payment form with error message | P1 | Yes |
| M5-011 | Manual payment with outstanding balance across multiple bills | 1. User with multiple unpaid bills 2. Pay outstanding balance | All bills covered, correct total charged via resolved provider | P2 | Yes |
| M5-012 | Transaction fee displayed correctly per provider | 1. Select credit card for manual payment | Service fee message shown (may differ by provider if fee structures differ) | P2 | Exploratory |

### Auto-Pay UX Improvements (ENG-2558)
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M5-020 | Auto-pay processing message displayed | 1. Enable auto-pay 2. Trigger payment 3. Observe UI during processing | Processing message/indicator shown while payment is in progress | P1 | Yes |
| M5-021 | Cancel payment via auto-pay toggle off | 1. Auto-pay enabled with payment in progress 2. Toggle auto-pay off | Payment cancellation handled correctly — either prevented with message or cancelled gracefully | P1 | Yes |
| M5-022 | Auto-pay toggle state persists after page reload | 1. Toggle auto-pay on 2. Reload page | Auto-pay remains enabled | P2 | Yes |

---

## Milestone 6: PG-Admin

### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M6-001 | Admin views user payment method from new tables | 1. Open user in PG-Admin 2. View payment details | Payment method details loaded from `UserPaymentMethod` + `UserProcessorAccount` (last4, brand, type, provider, status) | P0 | Yes |
| M6-002 | Admin sets user-level processor config override | 1. Open user in PG-Admin 2. Set processor override → Helcim 3. Save | `PaymentProcessorConfig` row created (scope=user, scopeID=userID, provider=Helcim) | P0 | Yes |
| M6-003 | Admin clears user-level processor config override | 1. Open user with existing override 2. Clear override 3. Save | `PaymentProcessorConfig` row deleted, user falls back to building/system default | P1 | Yes |
| M6-004 | Admin sets building-level default card provider | 1. Open building in PG-Admin 2. Set defaultCard → Helcim 3. Save | `Building.defaultCard` updated to Helcim PaymentProvider ID | P1 | Yes |
| M6-005 | Admin sets building-level default bank provider | 1. Open building in PG-Admin 2. Set defaultBank → Helcim 3. Save | `Building.defaultBank` updated | P1 | Yes |
| M6-006 | Admin views resolved processor for user | 1. Open user in PG-Admin | Shows which processor is currently resolved (and why — user override vs building vs system) | P2 | Exploratory |

### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M6-010 | Admin overrides processor for user with existing payment method | 1. User has Stripe card saved 2. Admin overrides to Helcim | User's next payment form shows Helcim; existing Stripe method status unclear (open question from Cian's notes) | P1 | Exploratory |
| M6-011 | Admin cannot set override to inactive provider | 1. Try to set override to disabled provider | UI prevents selection or shows error | P2 | Exploratory |
| M6-012 | Multiple admins editing same building config | 1. Two admins open same building 2. Both edit defaultCard | Last write wins, no crash, data consistent | P3 | Exploratory |

### Cross-Platform Verification
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M6-020 | Admin override → customer sees correct form | 1. Admin sets user override → Helcim 2. User signs in → payment page | User sees Helcim form (cross-platform: admin action → customer effect) | P0 | Yes |
| M6-021 | Admin sets building default → new move-in uses it | 1. Admin sets building defaultCard → Helcim 2. New user does move-in for that building | Move-in payment step shows Helcim form | P1 | Yes |

---

## Milestone 7: Backfill & Migration

### Happy Path — Data Migration
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M7-001 | UserProcessorAccount backfilled from CottageUsers.stripeCustomerID | 1. Run backfill 2. Query UserProcessorAccount | One row per user with stripeCustomerID, paymentProviderID → Stripe | P0 | Yes (DB) |
| M7-002 | UserPaymentMethod backfilled from CottageUsers.stripePaymentMethodID | 1. Run backfill 2. Query UserPaymentMethod | One row per user with stripePaymentMethodID, type/last4/brand enriched from Stripe API | P0 | Yes (DB) |
| M7-003 | Payment.provider backfilled to 'stripe' for all existing payments | 1. Run backfill 2. Query Payment where provider IS NOT NULL | All existing payments have `provider=stripe` | P0 | Yes (DB) |
| M7-004 | Payment.providerPaymentID populated from stripePaymentID | 1. Run backfill 2. Query Payment | `providerPaymentID` = `stripePaymentID` for all existing rows | P0 | Yes (DB) |
| M7-005 | Metadata enriched via Stripe API | 1. Run backfill 2. Query UserPaymentMethod metadata | last4, brand, exp_month, exp_year populated from Stripe PaymentMethod.retrieve | P1 | Yes (DB) |
| M7-006 | Row counts match pre/post backfill | 1. Count CottageUser rows with stripeCustomerID 2. Count UserProcessorAccount rows | Counts match — no missed or duplicated rows | P0 | Yes (DB) |

### Regression — Existing Flows Still Work
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M7-010 | Existing Stripe user: auto-pay still works post-migration | 1. Existing user (backfilled) 2. Insert approved bill 3. Run billing pipeline | Payment succeeds via Stripe, reads from new tables | P0 | Yes |
| M7-011 | Existing Stripe user: manual payment still works | 1. Backfilled user 2. Billing → Pay bill | Payment form loads, payment succeeds | P0 | Yes |
| M7-012 | Existing Stripe user: update payment method works | 1. Backfilled user 2. Overview → update payment method | Stripe form renders, method updated in new tables | P0 | Yes |
| M7-013 | Move-in flow unaffected post-migration | 1. New move-in with `?shortCode=autotest` | Complete flow works, payment collected, no errors | P0 | Yes |
| M7-014 | Subscription management unaffected | 1. Existing user with subscription 2. Toggle subscription | Subscription activate/pause/cancel works as before | P1 | Yes |
| M7-015 | Overview dashboard loads correctly for migrated users | 1. Sign in as backfilled user 2. View overview | Outstanding balance, payment method card, bill details all render correctly | P0 | Yes |

### Negative Tests — Migration Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| M7-020 | User with NULL stripeCustomerID skipped gracefully | 1. Run backfill with users missing stripe data | No error, those users simply have no UserProcessorAccount row | P1 | Yes (DB) |
| M7-021 | User with expired/invalid Stripe payment method | 1. Run backfill where Stripe PM no longer exists | UserPaymentMethod created with status=expired or graceful skip, no crash | P1 | Yes (DB) |
| M7-022 | Backfill idempotent — re-run doesn't duplicate | 1. Run backfill twice | Same row counts after second run, no duplicates | P0 | Yes (DB) |
| M7-023 | Legacy column reads removed — code doesn't reference old columns | 1. Grep services + cottage-nextjs for legacy column usage | Zero references to deprecated CottageUser Stripe columns in active code paths | P1 | Exploratory |

---

## Cross-Cutting Test Cases

### Backwards Compatibility
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CC-001 | Partial rollout: M1 deployed, M2 not yet — existing flows unaffected | 1. After M1 schema migration 2. Run existing payment flow | Everything works, new tables exist but unused | P0 | Yes |
| CC-002 | Dual-write period: both old and new tables consistent | 1. During M2-M3 rollout 2. Complete payment setup 3. Query both table sets | Data consistent between legacy columns and new tables | P0 | Yes (DB) |
| CC-003 | API version compatibility during rollout | 1. Old frontend + new backend 2. New frontend + old backend | Graceful handling, no crashes (if applicable during deploy window) | P1 | Exploratory |

### Multi-Browser (post-M2)
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CC-010 | Payment form renders in Chrome | Standard payment flow | Form loads, payment succeeds | P0 | Yes |
| CC-011 | Payment form renders in Firefox | Standard payment flow | Form loads, payment succeeds | P1 | Yes |
| CC-012 | Payment form renders in Safari | Standard payment flow | Form loads, payment succeeds | P1 | Yes |
| CC-013 | Payment form renders on Mobile Chrome | Standard payment flow on mobile viewport | Form loads, payment succeeds | P1 | Yes |
| CC-014 | Payment form renders on Mobile Safari | Standard payment flow on mobile viewport | Form loads, payment succeeds | P1 | Yes |
| CC-015 | Helcim form renders on all browsers | Helcim payment form on Chrome/FF/Safari/Mobile | Form loads without JS errors | P1 | Yes |

---

## Summary

| Section | Happy Path | Edge Cases | Negative | DB Verification | Total |
|---------|-----------|------------|----------|-----------------|-------|
| M1: DB Schema | 9 | 6 | 2 | — | 17 |
| M2: FE Payment Setup | 14 | 7 | — | 5 | 26 |
| M2: Resolution Hierarchy | 5 | — | — | — | 5 |
| M3: Services Setup | 7 | — | 3 | — | 10 |
| M4: Billing Engine | 8 | — | 3 | — | 11 |
| M4: Inngest Refactors | 4 | — | — | — | 4 |
| M4: Helcim-Specific | 3 | — | — | — | 3 |
| M4: Realtime Fee Calc | 2 | 1 | — | — | 3 |
| M5: Manual Payment/3DS | 6 | 3 | — | — | 9 |
| M5: Auto-Pay UX | 3 | — | — | — | 3 |
| M6: PG-Admin | 6 | 3 | — | — | 9 |
| M6: Cross-Platform | 2 | — | — | — | 2 |
| M8: Adhoc (Admin Overrides) | — | — | — | — | *(uses M6 test cases)* |
| M7: Backfill | 6 | — | 4 | — | 10 |
| M7: Regression | 6 | — | — | — | 6 |
| Cross-Cutting | 3 | — | — | — | 3 |
| Multi-Browser | 6 | — | — | — | 6 |
| **Total** | **90** | **20** | **12** | **5** | **127** |

## Automation Plan

### Smoke Suite (P0 — run on every deploy)
- M2-001, M2-006 (Stripe form render + save)
- M2-007 (Helcim form render + save — once Helcim is live)
- M2-012 (Move-in with payment)
- M4-001 (Auto-pay via Stripe)
- M4-002 (Auto-pay via Helcim)
- M5-001, M5-002 (Manual payment routing)
- M7-010, M7-011 (Post-migration regression)

### Regression Suites
- **Regression1 (Chromium)**: All P0 + P1 cases for current milestone
- **Regression2-3 (Firefox/Safari)**: CC-011 through CC-015 (cross-browser payment form)
- **Regression4-5 (Mobile)**: CC-013, CC-014 (mobile payment forms)

### Exploratory Only (stay manual)
- M4-020 through M4-022 (Helcim webhooks/settlement — need sandbox observation)
- M5-004 (Helcim 3DS — depends on test tooling)
- M6-010 through M6-012 (Admin edge cases — low frequency, high judgment)
- M7-023 (Legacy column audit — one-time code review)
- CC-003 (Deploy window compatibility)

### Phased Activation
Tests should be activated as milestones land:
1. **M1 ships** → Run M1-001 through M1-017 (schema validation)
2. **M2+M3 ship** → Activate M2-*, M3-*, update POMs (BillingPage, OverviewPage) for multi-provider
3. **M4 ships** → Activate M4-*, refactor `PaymentUtilities` and `PaymentQueries` for provider-aware assertions
4. **M5 ships** → Activate M5-*, add manual payment + 3DS tests
5. **M6 ships** → Activate M6-* (requires PG-Admin POMs — new test infrastructure)
6. **M7 ships** → Activate M7-*, run full regression suite
7. **Post-M7** → Remove dual-write assertions, remove legacy column checks, clean up backwards-compat tests

## Test Infrastructure Changes Needed

### New Page Objects
- `HelcimPaymentFormPage` — Helcim payment form interactions (card + bank)
- `PaymentFormRouterPage` — abstracted payment form that delegates to Stripe or Helcim POM
- `AdminProcessorConfigPage` — PG-Admin processor config management (M6)
- `AdminPaymentMethodPage` — PG-Admin payment method display (M6)

### Updated Page Objects
- `BillingPage` — add Helcim form support alongside Stripe iframe
- `OverviewPage` — update payment method management for multi-provider
- `MoveInPage` (if exists) — update payment step for provider routing

### New Fixtures
- `processorConfig.ts` — helper to set/clear PaymentProcessorConfig via Supabase
- `paymentProviderSetup.ts` — helper to configure building/partner defaults
- `helcimTestData.ts` — Helcim test card numbers, sandbox credentials

### Updated Fixtures
- `PaymentUtilities` — add provider-aware assertions, support both Stripe and Helcim payment verification
- `PaymentQueries` — add queries for new tables (UserProcessorAccount, UserPaymentMethod, PaymentProcessorConfig)

### New Types
- `paymentProvider.types.ts` — PaymentProvider, UserProcessorAccount, UserPaymentMethod, PaymentProcessorConfig types

### Test Data
- Helcim test cards and bank account details (need from dev team)
- Test buildings configured per provider (Stripe-only, Helcim-only, mixed)
- Test users with different processor config levels

## Risks & Notes

1. **Helcim sandbox availability** — All Helcim tests depend on sandbox credentials and test data. Need from dev team before M2 testing begins.
2. **Coordinated deploys** — M2 (FE) and M3 (Services) must deploy together. Testing window between deploys may have broken state.
3. **No fallback in v1** — Payment failures are final per provider. Need clear error messaging tests to confirm users understand.
4. **Admin override UX question** — Cian noted: if admin overrides a user's provider, should the user be prompted for a new payment method? This is an open design question that affects M6-010.
5. **BLNK ledger accounts** — Need confirmation that `@Helcim`/`@HelcimFees` accounts exist in BLNK before M4 testing.
6. **PG-Admin test infrastructure** — No existing PG-Admin POMs or test fixtures. M6 requires new test infrastructure (see Cross-Platform Testing Strategy in memory).
7. **Existing FIXME tests** — Manual payment tests are currently disabled. M5 is a natural time to fix and re-enable them with multi-provider support.
8. **Backfill data volume** — M7 testing should include a volume check — how many users need migration, estimated runtime, can it be tested incrementally?
9. **Light/TX-dereg exclusion** — These flows are explicitly excluded from M2. Need negative tests (M2-030, M2-031) to confirm they remain on Stripe-only path.
