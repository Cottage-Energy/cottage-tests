# Test Plan: ENG-2641 — Revert Encouraged Conversion Unsupported Address Fix

## Overview
**Ticket**: [ENG-2641](https://linear.app/public-grid/issue/ENG-2641)
**PR**: [cottage-nextjs#1180](https://github.com/Cottage-Energy/cottage-nextjs/pull/1180) — Reverts PR #1170
**Related**: [ENG-2618](https://linear.app/public-grid/issue/ENG-2618) (original bug), [ENG-2630](https://linear.app/public-grid/issue/ENG-2630) (fix side-effect bug)
**Date**: 2026-04-08
**Tester**: Christian

## Context

### Bug Chain
1. **ENG-2618**: Encouraged conversion + unsupported address → welcome page with "null" utility → 400 error on submit. No waitlist, no Slack alert.
2. **PR #1170** (fix for ENG-2618): Added XState guards in the encouraged conversion machine to route unsupported addresses to utility verification when `isUtilityVerificationEnabled=true`, or show a "We couldn't find service" dialog.
3. **ENG-2630**: PR #1170's fix caused a new bug — utility verification from encouraged conversion with unsupported address doesn't create an ElectricAccount.
4. **ENG-2641 / PR #1180**: Revert PR #1170 to fix ENG-2630. Accept that ENG-2618 behavior returns.

### How the Flow Works Post-Revert
The encouraged conversion flow has two key decision points for unsupported addresses:

**1. `zip-logic.ts`** (in building-selection machine) — runs when address is submitted:
- If `isUtilityVerificationEnabled=false` AND utility doesn't handle move-ins → **throws error** → `shouldNavigateToWaitlist=true` → **waitlist page**
- If `isUtilityVerificationEnabled=true` AND utility doesn't handle move-ins (or no utility found) → **does NOT throw** → returns with `hasPrimaryUtilityCompanyForZip=false` / `primaryUtilityHandlesMoveIn=false` → `shouldNavigateToWaitlist=false`

**2. Encouraged conversion machine** (after building-selection completes):
- If `shouldNavigateToWaitlist=true` → `waitlistDecision` state → **waitlist page**
- Otherwise → `welcome` state → **welcome page** (regardless of whether utility was found)

**PR #1180 removed** the machine-level guard that intercepted case 2 and routed to utility verification. Now the flow always falls through to `welcome` when `shouldNavigateToWaitlist=false`.

### The Ticket's Expected Behavior
"When signing up on an unsupported address with a building with no electric/gas company id should yield an error when trying to sign up."

This means: a building with **null electricCompanyID and null gasCompanyID** + unsupported address in encouraged conversion → the user reaches the welcome page → tries to register → gets a 400 error because there's no utility company to register with. **The error IS the intended behavior** — it's better than silently creating an account without an ElectricAccount (ENG-2630).

### Code Changes (PR #1180)
- **`encouraged-conversion/index.ts`**: Removed guard that routed to `#startServiceType.utilityVerification` when `isUtilityVerificationEnabled && (!hasPrimaryUtilityCompanyForZip || !primaryUtilityHandlesMoveIn)`. Removed matching guard on back-navigation.
- **`move-in.tsx`**: Whitespace-only (formatting on demand response fields).
- **`building-selection/zip-logic.ts`**: Blank line added only.

## Scope

### In Scope
- Encouraged conversion with building that has **no electric/gas company ID** (the ticket's primary scenario)
- Encouraged conversion with unsupported address across all shortcode types (Building vs MoveInPartner, utilVerif ON vs OFF)
- The `isUtilityVerificationEnabled` branching behavior in zip-logic.ts (determines waitlist vs welcome)
- ENG-2630 resolution — utility verification path from machine guard is removed
- Happy path regression — supported addresses in encouraged conversion
- Standard move-in waitlist — unaffected flow confirmation

### Out of Scope
- Transfer flow (separate XState machine)
- Light/TX-DEREG flows
- Bill upload/verify utilities waitlist
- Payment flows, post-auth dashboard

### Prerequisites
- PR #1180 deployed to dev (`dev.publicgrid.energy`) — merged 2026-04-08 06:10 UTC

### Test Shortcodes

| Shortcode | Type | Encouraged | UtilVerif | Electric | Gas | Scenario |
|-----------|------|-----------|----------|----------|-----|----------|
| `newbuilding123123` | Building | true | true | **null** | **null** | **Primary test case** — building with no utilities |
| `pgtest` | Building | true | true | SDGE | SDGE | Building with utilities (address doesn't matter) |
| `txtest` | Building | true | true | TX-DEREG | null | TX building |
| `autotest` | Building | false | false | PSEG | PSEG | Standard (non-encouraged) baseline |
| `venn73458test` | MoveInPartner | true | true | — | — | Partner shortcode (no building-level utils) |
| `funnel1111` | Building (Funnel) | true | false | BGE | null | Building with utility + utilVerif OFF |

### Test Addresses
- **Unsupported**: `155 N Nebraska Ave, Casper, WY 82609` or `500 N Capitol Ave, Lansing, MI 48933`
- **Supported (SDGE area)**: San Diego, CA address
- **Supported (ComEd area)**: `233 S Wacker Dr, Chicago, IL 60606`

## Test Cases

### Primary Scenario — Building with No Utility Companies (TC-001 to TC-004)
These test the exact scenario described in the ticket: `newbuilding123123` has null electricCompanyID and null gasCompanyID.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-001 | Encouraged conversion with null-utility building + unsupported address → welcome page | `newbuilding123123` (encouraged=true, utilVerif=true, electric=null, gas=null) | 1. Navigate to `/move-in?shortCode=newbuilding123123` 2. Enter `155 N Nebraska Ave, Casper, WY 82609` 3. Click Next | Welcome page renders. `isUtilityVerificationEnabled=true` prevents zip-logic from throwing, so `shouldNavigateToWaitlist=false` → welcome state. Utility name shows as "null" or empty. | P0 | Smoke |
| TC-002 | Null-utility building + unsupported address → form submit yields 400 error | Continue from TC-001 | 1. Check terms checkbox 2. Click "Get Started" 3. Fill personal info (name, email, phone, DOB, move-in date, SSN/license, previous address) 4. Click "Finish setup" | `POST /api/registration/create` returns 400: `{"error":"Invalid request body","details":{"electricCompanyID":["Provide at least one of electricCompanyID or gasCompanyID"]}}`. Toast: "Oops... Something went wrong". User stuck on form. | P0 | Smoke |
| TC-003 | Null-utility building + unsupported address → no CottageUser or ElectricAccount created | After TC-002 | 1. Query Supabase `"CottageUsers"` by test email 2. Query `"ElectricAccount"` for test address | No records created — 400 error prevents registration | P1 | Regression |
| TC-004 | Null-utility building + unsupported address → no Slack waitlist alert | During TC-001 | 1. Monitor network tab for `/api/send-alert` calls after clicking Next | 0 calls to `/api/send-alert`. Encouraged conversion never enters waitlist XState state when `isUtilityVerificationEnabled=true`. | P1 | Regression |

### `isUtilityVerificationEnabled` Branching (TC-005 to TC-007)
The critical branching: `utilVerif=true` → zip-logic does NOT throw → welcome page. `utilVerif=false` → zip-logic throws → waitlist.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-005 | Encouraged conversion + utilVerif ON + unsupported address → welcome (NOT waitlist) | `pgtest` (encouraged=true, utilVerif=true, has SDGE) | 1. Navigate to `/move-in?shortCode=pgtest` 2. Enter `155 N Nebraska Ave, Casper, WY 82609` 3. Click Next | Welcome page renders with building's utility (SDGE). Because `utilVerif=true`, zip-logic does NOT throw → `shouldNavigateToWaitlist=false` → welcome state. | P0 | Regression |
| TC-006 | Encouraged conversion + utilVerif OFF + unsupported address → waitlist | `funnel1111` (encouraged=true, utilVerif=false, has BGE) or toggle `pgtest` utilVerif to false | 1. Navigate to `/move-in?shortCode=funnel1111` 2. Enter `155 N Nebraska Ave, Casper, WY 82609` 3. Click Next | Waitlist page renders: "We haven't reached your area yet". Because `utilVerif=false`, zip-logic THROWS → `shouldNavigateToWaitlist=true` → waitlist state. | P0 | Regression |
| TC-007 | Waitlist page has Join Wait List form (utilVerif OFF path) | Continue from TC-006 | 1. Verify page content | Shows Name, Email, Zip code fields with "Join Wait List" button. | P1 | Regression |

### ENG-2630 Resolution — Machine Guard Removed (TC-008 to TC-009)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-008 | No direct routing to utility verification from encouraged conversion machine | `newbuilding123123` (utilVerif=true, no utilities) | 1. Navigate to `/move-in?shortCode=newbuilding123123` 2. Enter unsupported address 3. Click Next 4. Observe page | Welcome page renders, NOT utility verification / Contact Provider. The machine-level guard to `#startServiceType.utilityVerification` has been removed by the revert. | P0 | Regression |
| TC-009 | "I will call and setup myself" still routes to utility verification (separate path) | `pgtest` (utilVerif=true) + supported address | 1. Navigate to `/move-in?shortCode=pgtest` 2. Enter supported address 3. Click Next → welcome page 4. Click "I will call and setup myself" | Routes to utility verification (Contact Provider) via the `startServiceType` → `skipLogic` path. This path was NOT removed by the revert — only the direct machine guard was. | P1 | Regression |

### MoveInPartner Shortcode Behavior (TC-010 to TC-011)
MoveInPartner shortcodes resolve via `MoveInPartner` table, NOT `Building`. They have no building-level utility companies.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-010 | MoveInPartner (utilVerif ON) + unsupported address → utility verification via zip-logic | `venn73458test` (Venn partner, utilVerif=true) | 1. Navigate to `/move-in?shortCode=venn73458test` 2. Enter `155 N Nebraska Ave, Casper, WY 82609` 3. Click Next | Contact Provider page renders. zip-logic.ts routes to utility verification because `isUtilityVerificationEnabled=true` AND utility doesn't handle move-ins. "Your provider is" shows empty (no provider for WY). | P1 | Regression |
| TC-011 | MoveInPartner (utilVerif OFF) + unsupported address → waitlist | Need MoveInPartner with utilVerif=false (Funnel, Renew, or Virtuo) | 1. Navigate to `/move-in?shortCode=<partner-shortcode>` 2. Enter unsupported address 3. Click Next | Waitlist page: "We haven't reached your area yet". zip-logic throws → `shouldNavigateToWaitlist=true`. | P2 | Edge Case |

### Happy Path Regression — Supported Addresses (TC-012 to TC-014)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-012 | Encouraged conversion + supported address (pgtest/SDGE) → welcome with correct utility | `pgtest` | 1. Navigate to `/move-in?shortCode=pgtest` 2. Enter supported SDGE-area address 3. Click Next | Welcome page shows "Service is started on your behalf with these providers" with SDGE logos. Utility name is NOT null. | P0 | Smoke |
| TC-013 | Encouraged conversion + supported address → full registration succeeds | `pgtest` + supported address | 1. Complete TC-012 2. Check terms, "Get started" 3. Fill form, "Finish setup" | Registration succeeds. CottageUser and ElectricAccount created with `electricCompanyID=SDGE`. | P1 | Regression |
| TC-014 | Encouraged conversion happy path with `txtest` | `txtest` (TX-DEREG) | 1. Navigate to `/move-in?shortCode=txtest` 2. Enter TX address 3. Complete flow | Flow completes normally. TX-DEREG electric account created. | P1 | Regression |

### Standard Move-in Regression (TC-015 to TC-016)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-015 | Standard move-in + unsupported address → waitlist (unchanged) | No shortCode or `autotest` | 1. Navigate to `/move-in` 2. Enter unsupported address 3. Click Continue | Waitlist: "We haven't reached your area yet". Standard flow unaffected by encouraged conversion revert. | P1 | Regression |
| TC-016 | Standard move-in + supported address → normal 5/6-step flow | `autotest` | 1. Navigate to `/move-in?shortCode=autotest` 2. Enter supported address (ComEd area) 3. Proceed | Normal move-in flow. No impact from revert. | P1 | Regression |

### Edge Cases (TC-017 to TC-021)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Type |
|----|-------|---------------|-------|-----------------|----------|------|
| TC-017 | Null-utility building + supported address → welcome page (building has no utility regardless) | `newbuilding123123` | 1. Navigate to `/move-in?shortCode=newbuilding123123` 2. Enter a supported address (Chicago, IL) 3. Click Next | Welcome page renders. Even with a supported address, the building has null utility companies. Utility name shows null/empty. Form submit would 400. | P1 | Edge Case |
| TC-018 | Back navigation from welcome page with unsupported address | `pgtest` | 1. Enter unsupported address → welcome page 2. Click Edit on address card 3. Change address | Edit dialog opens with current address. User can change to a new address and re-submit. | P2 | Edge Case |
| TC-019 | Unsupported address → welcome → Edit → supported address | `pgtest` | 1. Enter unsupported address → welcome (shows SDGE from building) 2. Edit address to supported SDGE-area address | Welcome page still shows SDGE. Flow proceeds normally since `pgtest` has SDGE at building level. | P2 | Edge Case |
| TC-020 | Rapid address re-entry (unsupported → unsupported) | `newbuilding123123` | 1. Enter unsupported address → welcome 2. Edit → different unsupported address 3. Click Next | Welcome page renders again. No accumulated state issues. | P3 | Edge Case |
| TC-021 | Console errors during unsupported address flow | `newbuilding123123` | 1. Navigate and enter unsupported address 2. Check console for errors | Expected: may see 404 for `/terms-of-service` and `/privacy` (pre-existing). No new JS errors from the revert. | P2 | Edge Case |

### Database Verification (TC-022 to TC-024)

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-022 | No CottageUser created after 400 error on null-utility building | After TC-002: `SELECT * FROM "CottageUsers" WHERE "email" = '<test-email>'` | No record — 400 prevents user creation | P1 |
| TC-023 | No ElectricAccount created after 400 error | After TC-002: `SELECT * FROM "ElectricAccount" ea JOIN "Property" p ON ea."id" = p."electricAccountID" WHERE p."addressLine1" ILIKE '%Nebraska%'` | No record | P1 |
| TC-024 | CottageUser + ElectricAccount created for supported address happy path | After TC-013: Query by test email | Both records exist with correct `electricCompanyID` | P1 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Welcome page (null-utility building) | "Service is started on your behalf with these providers" with empty/null utility names and broken logo images | Users see broken text and images — unprofessional, confusing | Guard welcome page against null utilities: if no utility companies → redirect to waitlist or show "area not serviceable" message |
| UX-002 | Registration form submission (400 error) | Generic "Something went wrong" toast auto-dismisses in ~3 seconds. User stuck on form with no recovery path | Users wasted time filling out a full form only to hit a dead end | Show a specific error ("This area isn't serviceable yet") with a redirect to waitlist or support contact |
| UX-003 | Form accessible for unsupported area | Users can complete the entire form (name, email, phone, DOB, SSN, previous address, move-in date) for an area with no utility match | Wastes user time, captures sensitive data (SSN) for no purpose | Block form access when building has null utility companies — validate before showing "Get Started" |
| UX-004 | `isUtilityVerificationEnabled` determines waitlist vs dead-end | utilVerif=true → silent dead-end (welcome → 400). utilVerif=false → proper waitlist. The flag's purpose is about setup preference, not about address validation | Flag has an unintended side-effect: it prevents the waitlist from appearing for unsupported addresses | Decouple address validation from utility verification. Check utility match independently of `isUtilityVerificationEnabled`. |
| UX-005 | No Slack alert for encouraged conversion unsupported addresses (utilVerif ON) | When `isUtilityVerificationEnabled=true`, the encouraged conversion flow never enters waitlist state → no Slack alert fires for the sales team | Lost leads — partner-referred users in unsupported areas are invisible | Wire Slack alert into the welcome page when no utility match is found, or fix the waitlist routing |
| UX-006 | Contact Provider "Your provider is" empty (MoveInPartner path) | When MoveInPartner + unsupported address routes to utility verification via zip-logic, no provider name displays | User told to "sign up directly with the utility company" but not told which company | Show fallback text ("contact your local utility") or prevent reaching Contact Provider when no utility is found |

> These are not test failures — the feature works as coded post-revert. These are known regressions from the revert (ENG-2618 behavior returning) and opportunities for a proper fix.

## Automation Plan
- **Smoke**: TC-001, TC-002, TC-012 (primary scenario + happy path)
- **Regression**: TC-005, TC-006, TC-008, TC-015 (branching logic + standard flow)
- **Exploratory only**: TC-003, TC-004, TC-007, TC-009–TC-011, TC-013–TC-014, TC-017–TC-021 (network monitoring, MoveInPartner, edge cases)

## Risks & Notes
1. **`newbuilding123123` is the critical test shortcode** — it's the only building in dev with `useEncouragedConversion=true`, `isUtilityVerificationEnabled=true`, AND both `electricCompanyID` and `gasCompanyID` null. If this building gets modified by other tests, the primary scenario can't be tested.
2. **`isUtilityVerificationEnabled` is the key branching variable** — when true, zip-logic does NOT throw for unsupported addresses, so the flow silently proceeds to welcome instead of waitlist. This is not obviously intentional behavior — it's a side-effect of the flag.
3. **Building shortcodes with utilities (pgtest, txtest) mask the bug** — these buildings have utility companies configured at building level, so the welcome page shows the building's utility regardless of address. The "null utility" scenario only appears on buildings with null electricCompanyID/gasCompanyID.
4. **MoveInPartner behavior differs from Building** — MoveInPartner shortcodes go through a different resolution path. `venn73458test` routes to Contact Provider (via zip-logic), not the welcome page. The machine guard removal doesn't affect this path.
5. **No existing automated coverage** — `encourage-conversion-workflows/` spec files are empty. This entire area has zero automated tests.
