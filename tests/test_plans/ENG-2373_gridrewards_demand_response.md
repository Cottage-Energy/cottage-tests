# Test Plan: GridRewards Demand Response Integration — Onboarding + Dashboard

## Overview
**Ticket**: [ENG-2373](https://linear.app/public-grid/issue/ENG-2373/gridrewards-demand-response-integration-onboarding-dashboard)
**PR**: [cottage-nextjs#1050](https://github.com/Cottage-Energy/cottage-nextjs/pull/1050) (MERGED)
**Date**: 2026-03-06
**Tester**: Christian

## Scope

### In Scope
- Onboarding (encouraged conversion) — GridRewards enrollment toggle visibility, default state, and behavior
- Dashboard — Demand response card rendering across 3 enrollment states + visibility conditions
- Dashboard — Enrollment modal interaction (consent, enroll, card state update)
- Database — `DemandResponseEnrollment` record creation, status values, `consentCapturedAt` timestamp
- Analytics — PostHog events for toggle interactions and enrollments

### Out of Scope
- PG Admin enrollment management page (separate ticket, Zack owns)
- Logical Buildings API integration / webhook calls (backend, separate ticket)
- Leap Energy / PG-owned demand response (future)
- RLS policies (already exist from DB setup)
- Non-encouraged-conversion onboarding flows (toggle only appears in encouraged conversion)

### Prerequisites
- AvalonBay building with `shouldShowDemandResponse = true` and `demandResponseProviderID` set (FK to GridRewards in `DemandResponseProvider`)
- A second building with `shouldShowDemandResponse = false` (or null `demandResponseProviderID`) for negative tests
- Test accounts with different roles: **owner** vs. **roommate**
- Test accounts with and without electric accounts
- Ability to set `DemandResponseEnrollment` status directly in Supabase (`PENDING_ENROLLMENT`, `ENROLLED`, `CANCELLED`)
- Access to PostHog for analytics event verification

### Dependencies
- `DemandResponseProvider` table seeded with GridRewards record
- Building configuration flags (`shouldShowDemandResponse`, `demandResponseProviderID`)
- Electric account linkage for dashboard card visibility

---

## Test Cases

### Onboarding — Toggle Visibility

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-001 | Toggle visible for DR-enabled building | AC 1 | Building has `shouldShowDemandResponse = true` + `demandResponseProviderID` set | 1. Start encouraged conversion move-in for DR-enabled building 2. Reach welcome page | GridRewards enrollment toggle visible below the renewable energy toggle | P0 | Yes |
| TC-002 | Toggle hidden for DR-disabled building | AC 2 | Building has `shouldShowDemandResponse = false` | 1. Start encouraged conversion move-in for DR-disabled building 2. Reach welcome page | No GridRewards toggle visible; page renders normally without it | P0 | Yes |
| TC-003 | Toggle hidden when no provider configured | AC 2 | Building has `shouldShowDemandResponse = true` but `demandResponseProviderID = null` | 1. Start encouraged conversion move-in 2. Reach welcome page | No GridRewards toggle visible | P1 | Exploratory |

### Onboarding — Toggle Behavior

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-004 | Toggle defaults to ON | AC 3 | DR-enabled building | 1. Reach welcome page with toggle visible | Toggle is in the ON position by default (opt-out model) | P0 | Yes |
| TC-005 | Collapsible "What is GridRewards?" section | AC 3 | DR-enabled building | 1. Reach welcome page 2. Locate collapsible section below toggle 3. Expand it | "What is GridRewards?" section expands with program description and earnings disclaimer | P1 | Yes |
| TC-006 | Toggle ON — enrollment created on submit | AC 4 | DR-enabled building, toggle ON | 1. Reach welcome page 2. Leave toggle ON 3. Submit the form 4. Query `DemandResponseEnrollment` in Supabase | Record created with `status = PENDING_ENROLLMENT` and `consentCapturedAt` timestamp populated | P0 | Yes |
| TC-007 | Toggle OFF — no enrollment created | AC 5 | DR-enabled building | 1. Reach welcome page 2. Turn toggle OFF 3. Submit the form 4. Query `DemandResponseEnrollment` in Supabase | No `DemandResponseEnrollment` record created for this resident | P0 | Yes |
| TC-008 | Toggle ON then OFF then ON — final state honored | — | DR-enabled building | 1. Toggle ON → OFF → ON 2. Submit form | Enrollment record created (final state = ON) | P2 | Exploratory |

### Dashboard — Card Visibility

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-009 | No electric account — no card | AC 6 | Resident has no electric account linked | 1. Log in 2. View dashboard | No demand response card shown, regardless of building config or enrollment status | P0 | Yes |
| TC-010 | Has enrollment — card shown even if building DR disabled | AC 7 | Resident has electric account + active enrollment; building DR since disabled | 1. Set `shouldShowDemandResponse = false` on building 2. Log in 3. View dashboard | Demand response card still visible (honoring existing enrollment) | P1 | Yes |
| TC-011 | Owner, no enrollment, DR enabled — "Get Started" card | AC 8 | Resident is owner, has electric account, no enrollment, building DR enabled | 1. Log in 2. View dashboard | Demand response card in "Get Started" state | P0 | Yes |
| TC-012 | Owner, CANCELLED enrollment, DR enabled — "Get Started" card | AC 8 | Same as TC-011 but enrollment exists with `CANCELLED` status | 1. Set enrollment status to `CANCELLED` 2. Log in 3. View dashboard | Card shows "Get Started" state (CANCELLED treated same as no enrollment) | P1 | Yes |
| TC-013 | Roommate, no enrollment — no card | AC 9 | Resident is NOT owner (roommate), has electric account, no enrollment | 1. Log in as roommate 2. View dashboard | No demand response card shown | P1 | Yes |
| TC-014 | No enrollment, building DR not enabled — no card | AC 10 | Resident has electric account, no enrollment, building `shouldShowDemandResponse = false` | 1. Log in 2. View dashboard | No demand response card shown | P1 | Yes |
| TC-015 | No enrollment, no provider configured — no card | AC 10 | Resident has electric account, no enrollment, building `demandResponseProviderID = null` | 1. Log in 2. View dashboard | No demand response card shown | P2 | Exploratory |

### Dashboard — Card States

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-016 | State A — Get Started (no enrollment) | AC 11 | Owner, electric account, no enrollment, DR enabled | 1. View dashboard | Card shows: "Get paid to save energy" title, "Free program. No app. Just SMS alerts..." body, "Average household earns $100+/year" stat pill, "Learn more" link, lime "Get started" button | P0 | Yes |
| TC-017 | State A — Get Started (CANCELLED enrollment) | AC 11 | Same as TC-016 but with `CANCELLED` enrollment | 1. Set enrollment to CANCELLED 2. View dashboard | Same "Get Started" card as TC-016 | P1 | Yes |
| TC-018 | State B — Pending | AC 12 | Owner, electric account, enrollment with `PENDING_ENROLLMENT` | 1. Set enrollment status to `PENDING_ENROLLMENT` 2. View dashboard | Card shows pending/processing messaging | P0 | Yes |
| TC-019 | State C — Enrolled | AC 13 | Owner, electric account, enrollment with `ENROLLED` | 1. Set enrollment status to `ENROLLED` 2. View dashboard | Card shows "GridRewards" title, green "Enrolled" badge, "You're enrolled. Watch for text alerts this summer..." body, "Manage enrollment" link | P0 | Yes |

### Dashboard — Enrollment Modal

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-020 | Modal opens from "Get started" button | AC 14 | Card in "Get Started" state | 1. Click "Get started" button on DR card | Modal opens with: SMS mockup bubble, 3 value props ("We text you" / "You earn cash" / "The grid stays clean"), consent checkbox (defaulted checked), terms link, Logical Buildings fine print, "Maybe later" + "Enroll for free" buttons | P0 | Yes |
| TC-021 | Modal opens from "Learn more" link | AC 14 | Card in "Get Started" state | 1. Click "Learn more" link on DR card | Same modal content as TC-020 | P1 | Yes |
| TC-022 | Consent checkbox unchecked — enroll disabled | AC 15 | Modal open | 1. Uncheck consent checkbox | "Enroll for free" button becomes disabled | P0 | Yes |
| TC-023 | Consent re-checked — enroll re-enabled | AC 15 | Modal open, checkbox unchecked | 1. Re-check consent checkbox | "Enroll for free" button becomes enabled again | P1 | Yes |
| TC-024 | Enroll for free — happy path | AC 16 | Modal open, consent checked | 1. Click "Enroll for free" 2. Query `DemandResponseEnrollment` in Supabase | Enrollment record created with `PENDING_ENROLLMENT`, modal closes, card updates to pending state (State B) | P0 | Yes |
| TC-025 | "Maybe later" dismisses modal | — | Modal open | 1. Click "Maybe later" | Modal closes, card remains in "Get Started" state, no enrollment created | P1 | Yes |
| TC-026 | Modal close via X / outside click / Esc | — | Modal open | 1. Close modal via X button 2. Repeat via clicking outside 3. Repeat via Esc key | Modal closes each time, no enrollment created, card unchanged | P2 | Exploratory |

### Dashboard — Manage Enrollment

| ID | Title | AC | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|----|---------------|-------|-----------------|----------|-----------|
| TC-027 | "Manage enrollment" link on enrolled card | AC 13 | Enrollment with `ENROLLED` status | 1. Click "Manage enrollment" link | Management modal/page opens (verify content per implementation) | P1 | Yes |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-028 | DemandResponseProvider seeded | `SELECT * FROM "DemandResponseProvider"` | GridRewards record exists with correct name and metadata | P0 |
| TC-029 | Enrollment created on onboarding opt-in | `SELECT * FROM "DemandResponseEnrollment" WHERE "residentId" = ?` after move-in | Record exists with `status = PENDING_ENROLLMENT`, `consentCapturedAt IS NOT NULL` | P0 |
| TC-030 | No enrollment on onboarding opt-out | Same query after move-in with toggle OFF | No record for this resident | P0 |
| TC-031 | Enrollment created from dashboard modal | Same query after dashboard enroll | Record exists with `status = PENDING_ENROLLMENT`, `consentCapturedAt IS NOT NULL` | P0 |
| TC-032 | Building flags control toggle visibility | `SELECT "shouldShowDemandResponse", "demandResponseProviderID" FROM "Building" WHERE id = ?` | Flags match expected values for test buildings | P1 |
| TC-033 | CANCELLED enrollment — Get Started card | Set enrollment status to `CANCELLED`, verify card state | Card renders "Get Started" state (same as no enrollment) | P1 |

### Analytics / PostHog Events

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-034 | Onboarding toggle interaction event | DR-enabled building, on welcome page | 1. Toggle GridRewards ON/OFF | PostHog event fires for toggle interaction with relevant properties | P1 | Exploratory |
| TC-035 | Onboarding enrollment event | DR-enabled building, toggle ON | 1. Submit form with toggle ON | PostHog event fires for enrollment during onboarding | P1 | Exploratory |
| TC-036 | Dashboard enrollment event | Card in "Get Started" state | 1. Complete enrollment via modal | PostHog event fires for enrollment from dashboard with relevant properties | P1 | Exploratory |
| TC-037 | No event when toggle OFF | DR-enabled building, toggle OFF | 1. Turn toggle OFF 2. Submit form | No enrollment event fires (opt-out toggle event may still fire) | P2 | Exploratory |

### Regression — Existing Flows

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-038 | Encouraged conversion without DR — flow unaffected | 1. Move-in via encouraged conversion for non-DR building 2. Complete full flow | Flow completes normally; no visual glitches where toggle would be; renewable toggle still works | P0 | Yes |
| TC-039 | Dashboard overview — existing cards unaffected | 1. Log in as user without DR enrollment 2. View dashboard | All existing cards (property, billing, utility) render correctly; no layout shift from DR card absence | P1 | Yes |
| TC-040 | Renewable energy toggle still works | 1. Move-in for DR-enabled building 2. Toggle renewable energy independently of GridRewards | Renewable toggle works independently; both toggles maintain their own state | P1 | Yes |
| TC-041 | Registration API — account creation intact | 1. Complete full move-in flow 2. Verify account created | User account created correctly; registration endpoints not broken by DR additions | P0 | Yes |
| TC-042 | Accordion component — no regression | 1. Navigate to any page using accordion component | Accordion expand/collapse works normally (component was modified in PR) | P2 | Exploratory |

---

## Automation Plan

| Suite | Test Cases | Notes |
|-------|-----------|-------|
| **Smoke** | TC-001, TC-006, TC-011, TC-016, TC-020, TC-024 | Core toggle visibility, onboarding enrollment, dashboard card, modal enroll |
| **Regression** | TC-001–TC-007, TC-009–TC-014, TC-016–TC-025, TC-027, TC-038–TC-041 | All automatable cases — scaffold in `tests/e2e_tests/` under new demand-response directory |
| **Exploratory only** | TC-003, TC-008, TC-015, TC-026, TC-034–TC-037, TC-042 | Require DB manipulation, PostHog inspection, or manual modal interaction |
| **Database** | TC-028–TC-033 | Verify via Supabase queries in test hooks or standalone verification |

### New Test Files Needed
- `tests/e2e_tests/demand-response/onboarding_enrollment_toggle.spec.ts` — TC-001 through TC-008
- `tests/e2e_tests/demand-response/dashboard_card_visibility.spec.ts` — TC-009 through TC-015
- `tests/e2e_tests/demand-response/dashboard_card_states.spec.ts` — TC-016 through TC-019
- `tests/e2e_tests/demand-response/dashboard_enrollment_modal.spec.ts` — TC-020 through TC-027
- `tests/e2e_tests/demand-response/exploratory/explore_gridrewards.spec.ts` — TC-034 through TC-037, TC-042

### POM Updates Needed
- **`move_in_page.ts`** — Add GridRewards toggle locators and methods (toggle on/off, expand collapsible, verify visibility)
- **`overview_dashboard_page.ts`** — Add demand response card locators and methods (card states, "Get started"/"Learn more" clicks, enrollment badge, "Manage enrollment" link)
- **New POM or component**: Enrollment modal interaction methods (consent checkbox, "Enroll for free", "Maybe later", modal close)

---

## Risks & Notes
- **Building test data**: Need AvalonBay buildings with DR flags set correctly — may need to coordinate with dev to seed test data or toggle flags in staging
- **Owner vs. roommate**: Need test accounts with different roles on the same building; verify how role is determined (`isOwner` field or similar)
- **Electric account dependency**: Dashboard card visibility depends on having an electric account — ensure test users have this linked
- **PR already merged**: Feature is in `dev` — test against staging/dev environment
- **Opt-out model risk**: Toggle defaults to ON — important to verify that users who explicitly opt out (toggle OFF) do NOT get enrolled
- **State transitions**: The `CANCELLED` status is treated the same as "no enrollment" for card display — verify this edge case carefully
- **Accordion/input component changes**: PR modified shared `accordion.tsx` and `input.tsx` — could have subtle regressions on other pages using these components
