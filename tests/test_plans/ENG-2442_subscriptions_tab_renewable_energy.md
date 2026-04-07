# Test Plan: ENG-2442 — New Account Subscriptions Tab Design + Renewable Energy Allocation

## Overview
**Ticket**: [ENG-2442](https://linear.app/public-grid/issue/ENG-2442/task-implement-new-account-subscriptions-tab-design)
**PR**: [cottage-nextjs #1156](https://github.com/Cottage-Energy/cottage-nextjs/pull/1156) (MERGED 2026-04-06)
**Source**: Linear ticket (30 ACs), PR diff (36 files changed, +9858/-9560), Supabase schema inspection, ticket comments (DDL + cron)
**Date**: 2026-04-06
**Tester**: Christian

## Summary
Complete redesign of the Account → Subscriptions tab with three distinct states (Inactive, Paused, Active) and a new renewable energy impact display for both billing and non-billing users. Introduces a new `RenewableEnergyAllocation` DB table + pg_cron job for non-billing user impact calculations. Also updates the Overview page renewable energy card to reflect the same logic.

## Scope

### In Scope
- **Subscriptions Tab**: Inactive, Paused, and Active state UI (desktop + mobile)
- **Subscription Actions**: Activate (with/without payment method), Add payment method, Manage, Cancel
- **Non-owner restrictions**: Household members cannot activate
- **Renewable Energy Impact**: kWh, CO2, trees, miles — billing vs non-billing calculation paths
- **Hide/Show impact details** toggle
- **"How does it work?" modal** from inactive and active states
- **Subscription Payments Table**: desktop table vs mobile card layout
- **Overview Page — Renewable Energy Card**: Active billing, Active non-billing, Paused, No bills yet, No subscription
- **RenewableEnergyAllocation table**: Schema, data integrity, cron logic, gap-fill defaults
- **Responsive layout**: Desktop vs mobile for all states

### Out of Scope
- Move-in flow renewable energy toggle (existing, separate feature)
- Stripe payment processing internals (tested via payment test suite)
- pg_cron job execution verification (DB-only, no UI)
- Light user portal (separate `portal/overview` — only `light-property-card.tsx` touched)

### Prerequisites
- **Billing user with active subscription + payment method + processed bills** — for AC11/12/19
- **Non-billing user with active subscription + payment method** — for AC13/14/20
- **User with active subscription but NO payment method** (paused state) — for AC6-10/21
- **User with NO subscription** — for AC1-5/24
- **Non-billing user who just activated this month** — for AC15/23
- **Billing user with active subscription but no bills yet** — for AC22
- **Household member (non-owner)** — for AC5
- **RenewableEnergyAllocation data** in dev DB (confirmed present — 25 utility companies, backfilled through Feb 2026)
- **Two users at same utility company** — for AC27
- **Two users at different utility companies** — for AC27

### Dependencies
- `RenewableEnergyAllocation` table (confirmed deployed in dev)
- pg_cron monthly job (`calculate_monthly_renewable_allocation`) — runs 1st of month at midnight UTC
- Stripe payment method sheet (existing component, reused)
- `packages/fetchers/src/renewable-allocation/` — new fetcher for allocation data

---

## Test Cases

### Subscriptions Tab — Inactive State (No Subscription)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-001 | Activate subscription with payment method on file (Desktop) | User with payment method, no active subscription | 1. Sign in → Account → Subscriptions tab 2. Verify inactive card with "Activate green energy" button 3. Click "Activate green energy" 4. Verify "Ready to go green" confirmation modal | Modal opens with confirmation details; after confirming, subscription activates → active state shown | P0 | Smoke | Yes |
| TC-002 | Activate subscription with payment method on file (Mobile) | Same as TC-001 | 1. Same flow on mobile viewport 2. Verify button is full-width 3. Verify image is below content (stacked layout) | Same activation flow, mobile-responsive layout | P1 | Regression | Yes |
| TC-003 | Activate without payment method (Desktop) | User with NO payment method, no subscription | 1. Sign in → Account → Subscriptions 2. Click "Activate green energy" 3. Verify payment method form sheet opens (NOT confirmation modal) 4. Add payment method via Stripe 5. Verify subscription activates immediately | Payment sheet opens → add method → subscription activates (no extra confirmation step) | P0 | Smoke | Yes |
| TC-004 | Activate without payment method (Mobile) | Same as TC-003 | Same flow on mobile viewport | Same behavior, mobile layout | P1 | Regression | Yes |
| TC-005 | Non-owner cannot activate | Household member (not property owner), no subscription | 1. Sign in as household member → Account → Subscriptions 2. Verify inactive card is visible 3. Verify NO "Activate green energy" button | Inactive card shown but no activation button | P1 | Regression | Yes |

### Subscriptions Tab — Paused State

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-006 | Paused state displays correctly (Desktop) | Active subscription, no payment method | 1. Sign in → Account → Subscriptions 2. Verify card shows "Paused" orange badge 3. Verify monthly fee is displayed 4. Verify "Add payment method" button 5. Verify "Manage" button | All paused state elements visible with correct styling | P0 | Smoke | Yes |
| TC-007 | Paused state displays correctly (Mobile) | Same as TC-006 | Same verification on mobile viewport | Mobile-responsive paused layout | P1 | Regression | Yes |
| TC-008 | Add payment method from paused state | Active subscription, no payment method | 1. Click "Add payment method" 2. Verify payment method form sheet opens 3. Add payment method via Stripe | Sheet opens, payment method added, sheet closes | P1 | Regression | Yes |
| TC-009 | Manage subscription from paused state | Active subscription, no payment method | 1. Click "Manage" 2. Verify manage modal shows subscription is paused 3. Verify monthly fee displayed 4. Verify cancel option available | Manage modal with paused status + cancel option | P1 | Regression | Yes |
| TC-010 | Payments table in paused state — with history | Active subscription (paused), has past payments | 1. Verify payments table appears below paused card 2. Verify date, amount, status columns | Payments table with historical data visible | P2 | Regression | Yes |
| TC-011 | Payments table in paused state — no history | Active subscription (paused), no past payments | 1. Verify NO payments table below paused card | Table is not rendered | P2 | Edge Case | Yes |

### Subscriptions Tab — Active State

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-012 | Active state — Billing user (Desktop) | Billing user, active subscription, payment method, processed bills | 1. Sign in → Account → Subscriptions 2. Verify "Active" green badge 3. Verify monthly fee 4. Verify impact section: lifetime kWh, CO2 (lbs), trees planted, fewer miles driven | All impact metrics shown, calculated from actual bills | P0 | Smoke | Yes |
| TC-013 | Active state — Billing user (Mobile) | Same as TC-012 | Same on mobile viewport | Mobile-responsive active layout | P1 | Regression | Yes |
| TC-014 | Active state — Non-billing user (Desktop) | Non-billing user, active subscription, payment method | 1. Sign in → Account → Subscriptions 2. Verify "Active" green badge + monthly fee 3. Verify impact based on utility company average 4. Expand "Hide details" 5. Verify footnote: "Your renewable energy offset is an estimate based on similar homes in your area..." | Impact from allocation table, footnote visible in expanded details | P0 | Smoke | Yes |
| TC-015 | Active state — Non-billing user (Mobile) | Same as TC-014 | Same on mobile viewport | Mobile layout with same content | P1 | Regression | Yes |
| TC-016 | Non-billing user — brand new subscription (0 kWh) | Non-billing user, subscription activated this month | 1. Sign in → Account → Subscriptions 2. Verify lifetime clean energy shows 0 kWh | 0 kWh displayed (current month not included) | P1 | Edge Case | Yes |
| TC-017 | Hide/show impact details toggle | Active subscription with impact data | 1. Click "Hide details" 2. Verify CO2, trees, miles metrics collapse 3. Click "See full impact" 4. Verify metrics expand | Toggle controls visibility of detailed metrics | P1 | Regression | Yes |
| TC-018 | Manage and cancel subscription | Active subscription | 1. Click "Manage" 2. Verify modal shows active subscription details + cancel option 3. Cancel subscription 4. Verify transition to inactive state | Cancel flow works, UI transitions to inactive | P0 | Smoke | Yes |
| TC-019 | Payments table in active state (Desktop) | Active subscription with past payments | 1. Verify payments table below active card 2. Verify columns: date, amount, status 3. Verify desktop table layout | Table layout with payment history | P1 | Regression | Yes |
| TC-020 | Payments table in active state (Mobile) | Same as TC-019 | Same verification on mobile | Card-based mobile layout (not table) | P1 | Regression | Yes |

### Overview Page — Renewable Energy Card

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-021 | Overview card — Active billing user | Billing user, active subscription, payment method, processed bills | 1. Sign in → Overview 2. Verify "Renewable energy" card in sidebar 3. Verify lifetime kWh from actual bills 4. Expand "See full impact" → CO2, trees, miles | Card shows bill-based impact with expandable details | P0 | Smoke | Yes |
| TC-022 | Overview card — Active non-billing user | Non-billing user, active subscription, payment method | 1. Sign in → Overview 2. Verify "Renewable energy" card 3. Verify impact from allocation table (previous months only) | Card shows allocation-based impact | P1 | Regression | Yes |
| TC-023 | Overview card — Paused (no payment method) | Active subscription, no payment method | 1. Sign in → Overview 2. Verify card shows paused state 3. Verify "Add payment method" button 4. Click → payment sheet opens | Paused state with add payment CTA | P1 | Regression | Yes |
| TC-024 | Overview card — Billing user, no bills yet | Billing user, active subscription, no processed bills | 1. Sign in → Overview 2. Verify card shows: "We're bringing renewable energy to your home. Check back later for updates." | "Check back later" message (no impact data) | P2 | Edge Case | Yes |
| TC-025 | Overview card — Non-billing, current month only (0 kWh) | Non-billing user, subscribed this month | 1. Sign in → Overview 2. Verify card shows 0 kWh (NOT "check back later") | 0 kWh shown — distinct from billing "check back" message | P1 | Edge Case | Yes |
| TC-026 | Overview card — No subscription | User with no active subscription | 1. Sign in → Overview 2. Verify NO "Renewable energy" card in sidebar | Card is absent | P1 | Regression | Yes |

### "How does it work?" Modal

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-027 | Learn more from inactive state | No active subscription | 1. Account → Subscriptions 2. Click "How does it work?" 3. Verify modal opens with 4-step process explanation | Modal explains renewable energy subscription process | P2 | Regression | Yes |
| TC-028 | Learn more from active state | Active subscription | 1. Account → Subscriptions 2. Click "How does it work?" 3. Verify same modal content | Same 4-step modal accessible from active state | P2 | Regression | Yes |

### Negative / Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|---------------|-------|-----------------|----------|------|-----------|
| TC-029 | Cancel activation mid-flow (with payment) | User with payment method, no subscription | 1. Click "Activate green energy" 2. Close/dismiss the "Ready to go green" modal without confirming | No subscription created, stays in inactive state | P2 | Edge Case | Yes |
| TC-030 | Cancel payment method addition mid-flow | User without payment method | 1. Click "Activate green energy" 2. Payment sheet opens 3. Close/dismiss the payment sheet | No subscription created, stays inactive, no partial payment method saved | P2 | Edge Case | Yes |
| TC-031 | Rapid activate/cancel cycle | Active subscription | 1. Activate subscription 2. Immediately manage → cancel 3. Verify clean state transition | No stale state, transitions cleanly to inactive | P2 | Edge Case | No |
| TC-032 | Browser resize during subscription flow | Desktop, mid-activation | 1. Start activation flow on desktop 2. Resize to mobile width mid-flow | Layout adapts, flow not interrupted | P3 | Edge Case | No |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-033 | RenewableEnergyAllocation table schema | `information_schema.columns WHERE table_name = 'RenewableEnergyAllocation'` | 7 columns: id (uuid), utilityCompanyID (text FK), allocationAmount (numeric), month (int 1-12), year (int ≥2020), created_at, updated_at | P1 |
| TC-034 | Unique constraint on (utilityCompanyID, month, year) | `INSERT duplicate row → should fail` | Unique constraint violation prevents duplicate allocations | P1 |
| TC-035 | RLS — authenticated read access | Query as authenticated user | SELECT returns data; INSERT/UPDATE/DELETE denied | P1 |
| TC-036 | Allocation uses previous months only (AC25) | Non-billing user subscribed since Jan 2026, check in April | Sum of allocations Jan–Mar only (not April) | P0 |
| TC-037 | Missing month defaults to 500 kWh (AC26) | Utility with no allocation row for a specific month | Frontend gap-fills with 500 kWh for that month | P1 |
| TC-038 | Allocation is per utility company (AC27) | Two non-billing users at same utility, same month | Both see identical allocation amount | P1 |
| TC-039 | Different utility companies get different allocations (AC27) | Users at different utilities | Each sees their utility's allocation (confirmed in dev: COMED=53.56 kWh for Jan 2026 vs CON-EDISON=500) | P1 |
| TC-040 | Small utility company defaults to 500 kWh (AC28) | Utility with <50 valid bills in a month | Allocation = 500 kWh (confirmed: most utilities in dev show 500) | P2 |

### Cross-State Transitions

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-041 | Inactive → Active (with payment method) | 1. Start at inactive 2. Activate 3. Verify active state | Clean transition, impact data loads | P0 | Smoke | Yes |
| TC-042 | Inactive → Active (without payment method) | 1. Start at inactive 2. Add payment + activate 3. Verify active state | Payment sheet → activation → active state in one flow | P0 | Smoke | Yes |
| TC-043 | Active → Inactive (cancel) | 1. Start at active 2. Manage → Cancel 3. Verify inactive state | Clean transition, no residual data shown | P0 | Smoke | Yes |
| TC-044 | Paused → Active (add payment method) | 1. Start at paused 2. Add payment method 3. Verify active state | Adding payment resumes subscription | P1 | Regression | Yes |
| TC-045 | Active → Paused (remove payment method externally) | 1. Active subscription 2. Payment method removed (via Stripe/DB) 3. Refresh subscriptions | Shows paused state with orange badge | P2 | Edge Case | No |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Non-billing active state | Footnote about estimated usage is hidden behind "Hide details" toggle — users may never see the disclaimer | Users may misunderstand their impact numbers as actual usage | Show the footnote in a subtle banner/tooltip near the kWh number itself, not buried in the expanded section |
| UX-002 | Inactive → Active (no payment) | AC3 says "subscription activates immediately" after adding payment — no confirmation step. This is inconsistent with the with-payment flow (AC1) which shows a confirmation modal | Users without payment method get less control over the activation decision | Consider showing the "Ready to go green" modal after payment method is successfully added, for consistency |
| UX-003 | Brand new non-billing user (AC15/23) | Showing "0 kWh" on day 1 is technically correct but feels like nothing is happening | New subscribers may feel the feature isn't working | Show a welcome message like "Your first impact report will be available next month" alongside or instead of 0 kWh |
| UX-004 | Payments table — empty state (AC10) | When there are no past payments, the table simply doesn't render — there's no messaging | Users may wonder where their payment history is | Consider a "No payments yet" placeholder instead of hiding the section entirely |
| UX-005 | Cancel subscription | Cancel is inside the Manage modal — it takes 2 clicks to reach. No confirmation dialog mentioned in ACs | Accidental cancellations are possible if there's no "Are you sure?" step | Add a confirmation prompt before cancellation completes |

---

## Automation Plan

### Smoke (7 cases — TC-001, TC-003, TC-006, TC-012, TC-014, TC-018, TC-021)
Critical paths: activate with/without payment, paused display, active billing + non-billing display, cancel, overview card.

### Regression Scope (23 cases)
- **Regression1 (Chromium Desktop)**: TC-002 through TC-028, TC-041–TC-044
- **Regression4/5 (Mobile)**: TC-002, TC-004, TC-007, TC-013, TC-015, TC-020

### Exploratory Only (4 cases — TC-031, TC-032, TC-045, plus DB verifications TC-033–TC-040)
- State transition edge cases requiring manual DB manipulation
- DB verification queries run via Supabase MCP during exploratory session

### New POMs Needed
- `SubscriptionsTabPage` — inactive/paused/active state locators, action buttons, impact metrics, payments table
- Update `OverviewPage` — add renewable energy card locators (sidebar card, kWh, CO2, trees, miles, expand/collapse, add payment)

### New Test Data Needed
| User Type | Requirements |
|-----------|-------------|
| Billing + subscription + payment + bills | For TC-012, TC-019, TC-021 |
| Non-billing + subscription + payment | For TC-014, TC-022 |
| Subscription + no payment (paused) | For TC-006, TC-023 |
| No subscription + payment method | For TC-001, TC-026 |
| No subscription + no payment method | For TC-003 |
| Non-billing + just activated this month | For TC-016, TC-025 |
| Billing + subscription + no bills | For TC-024 |
| Household member (non-owner) | For TC-005 |

---

## Risks & Notes
1. **Non-billing impact calculation depends on `RenewableEnergyAllocation` data** — in dev, most utilities show 500 kWh (small sample default). Only COMED Jan 2026 shows a real average (53.56 kWh). This limits realistic testing of varied allocations.
2. **pg_cron job runs monthly** — cannot trigger on-demand. Testing the cron logic requires either waiting for the 1st of the month or manually inserting allocation rows.
3. **No existing subscription POM or test specs** — this is a net-new test area. Need to build `SubscriptionsTabPage` POM and extend `OverviewPage`.
4. **Stripe payment sheet** is reused from existing flows — should work, but test that it integrates correctly from the new activation entry point.
5. **Household member test data** — need a property with an owner + at least one household member to test AC5. May need to set up via invite flow.
6. **"Remove payment method externally" (TC-045)** — requires Stripe dashboard or DB manipulation to simulate. Keep as exploratory.
7. **PR just merged today** (2026-04-06) — feature should be live in dev for immediate exploratory testing.
