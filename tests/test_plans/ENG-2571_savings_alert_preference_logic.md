# Test Plan: ENG-2571 — FIX: Savings Alert Preference Logic

## Overview
**Ticket**: [ENG-2571](https://linear.app/public-grid/issue/ENG-2571/fix-savings-alert-preference-logic)
**Source**: Linear ticket + PR [cottage-nextjs #1144](https://github.com/Cottage-Energy/cottage-nextjs/pull/1144) (merged 2026-03-30)
**Date**: 2026-03-30
**Tester**: Christian

## Context
The savings preference toggles (savings alerts + auto-enroll/auto-apply) had incorrect logic around billing status, account number presence, and null enrollment preference handling. PR #1144 fixes the logic across **SavingsPreferenceCard** (`/app/services`) and **SearchForSavingsDialog** (`/app/overview` sidebar).

**Key changes:**
1. SavingsPreferenceCard was hidden for billing users — now visible for ALL users
2. New shared `hasValidAccountNumber()` — null, empty, "PENDING" = invalid
3. Auto-enroll disabled for non-billing users without valid account number
4. SearchForSavingsDialog hides auto-apply toggle when user can't auto-apply (vs just disabled before)
5. Default enrollment preference: null → `verification_only` (was `automatic`)
6. Button text: "Activate alerts only" when user can't auto-apply

## Scope

### In Scope
- SavingsPreferenceCard on `/app/services` (both toggles)
- SearchForSavingsDialog on `/app/overview` sidebar ("Recommended for you")
- 3 user types: billing, non-billing+valid account, non-billing+no account
- Toggle interaction logic (savings alerts → auto-enroll dependency)
- DB verification of `enrollmentPreference` on `CottageUsers`

### Out of Scope
- Connect flow registration
- Subscription toggle (separate feature)
- Payment processing
- Auto-apply card on connect overview (separate component, tested in ENG-2402)

### Prerequisites
- 3 test users in dev:
  - **Billing user** (`isBillingCustomer=true`, `maintainedFor` IS NOT NULL)
  - **Non-billing user with valid account number** (`isBillingCustomer=false`, `accountNumber` = real value)
  - **Non-billing user without account number** (`isBillingCustomer=false`, `accountNumber` = null or "PENDING")
- All users with `enrollmentPreference = NULL` initially (to test AC5 default)
- Access to `/app/services` and `/app/overview`

### DB Schema
- `CottageUsers.enrollmentPreference` — enum: `automatic`, `manual`, `verification_only`
- `ElectricAccount.accountNumber` — text, nullable
- `ElectricAccount.maintainedFor` — uuid, nullable (determines billing status)
- `ViewResidentDetails.isBillingCustomer` — boolean (derived)

## Test Cases

### Services Page — SavingsPreferenceCard (`/app/services`)

| ID | Title | User Type | Steps | Expected Result | Priority | Automate? |
|----|-------|-----------|-------|-----------------|----------|-----------|
| TC-001 | Billing user sees savings preference card | Billing | 1. Login as billing user 2. Navigate to `/app/services` | SavingsPreferenceCard is visible (was previously hidden for billing) | P0 | Yes |
| TC-002 | Billing user — both toggles visible and toggleable | Billing | 1. Login as billing user 2. Go to `/app/services` 3. Check savings alerts toggle 4. Check auto-enroll toggle | Both toggles visible. Savings alerts toggleable. Auto-enroll toggleable when alerts ON | P0 | Yes |
| TC-003 | Non-billing + valid account — both toggles visible | Non-billing + acct | 1. Login as non-billing user with valid account number 2. Go to `/app/services` | Both toggles visible and toggleable | P0 | Yes |
| TC-004 | Non-billing + no account — auto-enroll disabled | Non-billing, no acct | 1. Login as non-billing user with null/PENDING account number 2. Go to `/app/services` | Savings alerts toggle: visible + toggleable. Auto-enroll toggle: visible but disabled (OFF) | P0 | Yes |
| TC-005 | Savings alert OFF → auto-enroll forced OFF + disabled | Any | 1. Login 2. Go to `/app/services` 3. Toggle savings alerts OFF | Auto-enroll automatically OFF and disabled | P1 | Yes |
| TC-006 | Savings alert ON → auto-enroll becomes toggleable (billing) | Billing | 1. Login as billing user 2. Toggle savings alerts ON | Auto-enroll toggle becomes enabled/toggleable | P1 | Yes |
| TC-007 | Savings alert ON → auto-enroll stays disabled (no acct) | Non-billing, no acct | 1. Login as non-billing user with no account 2. Toggle savings alerts ON | Auto-enroll toggle remains disabled despite alerts being ON | P1 | Yes |
| TC-008 | Null enrollment preference defaults to OFF | Any (null pref) | 1. Ensure user has `enrollmentPreference = NULL` in DB 2. Login 3. Go to `/app/services` | Both toggles show as OFF (verification_only), not automatic | P0 | Yes |

### Overview Sidebar — SearchForSavingsDialog

| ID | Title | User Type | Steps | Expected Result | Priority | Automate? |
|----|-------|-----------|-------|-----------------|----------|-----------|
| TC-009 | Billing user — both toggles visible in dialog | Billing | 1. Login as billing user 2. Go to `/app/overview` 3. Click savings recommendation in sidebar | Dialog opens. Both "Savings alerts" and "Auto-apply savings" toggles visible | P0 | Yes |
| TC-010 | Non-billing + valid account — both toggles visible | Non-billing + acct | 1. Login 2. Open SearchForSavingsDialog | Both toggles visible and toggleable | P0 | Yes |
| TC-011 | Non-billing + no account — auto-apply HIDDEN | Non-billing, no acct | 1. Login as non-billing user with no account 2. Open SearchForSavingsDialog | Savings alerts toggle visible. Auto-apply toggle is **hidden** (not just disabled) | P0 | Yes |
| TC-012 | Button text: "Activate alerts only" when can't auto-apply | Non-billing, no acct | 1. Login as user who can't auto-apply 2. Open dialog 3. Turn on savings alerts | Button reads "Activate alerts only" (not "Activate alerts and auto-apply") | P1 | Yes |
| TC-013 | Button text: "Activate alerts and auto-apply" when can auto-apply | Billing or non-billing+acct | 1. Login as eligible user 2. Open dialog 3. Turn on both toggles | Button reads "Activate alerts and auto-apply" | P1 | Yes |
| TC-014 | Alerts ON + auto-apply OFF → button says "Activate alerts only" | Billing | 1. Open dialog 2. Turn alerts ON 3. Leave auto-apply OFF | Button text: "Activate alerts only" | P1 | Yes |
| TC-015 | Savings alert OFF → auto-apply disabled in dialog | Billing | 1. Open dialog 2. Toggle alerts OFF | Auto-apply toggle becomes disabled | P1 | Yes |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-016 | Alerts only → enrollmentPreference = manual | After toggling alerts ON + auto-enroll OFF and saving | `SELECT "enrollmentPreference" FROM "CottageUsers" WHERE id = '<userId>'` → `manual` | P1 |
| TC-017 | Both ON → enrollmentPreference = automatic | After toggling both ON and saving (billing or valid acct user) | `enrollmentPreference` → `automatic` | P1 |
| TC-018 | Both OFF → enrollmentPreference = verification_only | After toggling alerts OFF and saving | `enrollmentPreference` → `verification_only` | P1 |
| TC-019 | Can't auto-apply user → never sets automatic | Non-billing no-acct user, toggle alerts ON, save | `enrollmentPreference` → `manual` (never `automatic` even if UI tried) | P1 |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Account number = "PENDING" treated as no account | 1. Set `accountNumber = 'PENDING'` in DB 2. Login 3. Check `/services` and sidebar | Auto-enroll disabled on services, auto-apply hidden in sidebar | P1 | Yes |
| TC-021 | Account number = empty string treated as no account | 1. Set `accountNumber = ''` in DB 2. Login 3. Check both locations | Same as TC-020 — treated as no valid account | P2 | Yes |
| TC-022 | Gas account number valid, electric null → has valid account | 1. User with `gasAccount.accountNumber` = valid, `electricAccount.accountNumber` = null 2. Check toggles | Treated as having valid account — both toggles available | P2 | No |
| TC-023 | Rapid toggle — alerts ON/OFF quickly | 1. Open services page 2. Toggle alerts ON then OFF rapidly | No stale state — auto-enroll follows alerts toggle correctly | P2 | No |
| TC-024 | Dialog dismiss without saving | 1. Open sidebar dialog 2. Toggle alerts 3. Close without clicking activate | No changes saved to DB — `enrollmentPreference` unchanged | P2 | Yes |

### Negative Tests

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-025 | Activate button disabled when alerts OFF | Open dialog, leave alerts OFF | Activate button is disabled | P1 | Yes |
| TC-026 | Auto-enroll click does nothing when disabled | Non-billing no-acct, click on auto-enroll row on services | Toggle does not change state | P2 | No |

### Onboarding Paths — Savings Preference After Registration

These test cases verify that savings preferences work correctly for users who arrive through different onboarding flows (billing vs non-billing). After completing onboarding, the user's savings toggle state and DB values should be consistent with their account type.

#### Billing Onboarding Paths

| ID | Title | Onboarding Flow | Steps | Expected Result | Priority | Automate? |
|----|-------|----------------|-------|-----------------|----------|-----------|
| TC-027 | Move-in billing → savings prefs accessible | Move-in (autotest) | 1. Complete move-in via `/move-in?shortCode=autotest` as billing user 2. Navigate to `/app/services` 3. Check savings toggles | SavingsPreferenceCard visible. Both toggles visible and toggleable. `enrollmentPreference` = NULL (defaults to OFF) | P1 | Yes |
| TC-028 | Move-in billing → sidebar dialog has both toggles | Move-in (autotest) | 1. Complete move-in as billing user 2. Navigate to `/app/overview` 3. Open SearchForSavingsDialog | Both "Savings alerts" and "Auto-apply savings" toggles visible. Button: "Activate alerts and auto-apply" when both ON | P1 | Yes |
| TC-029 | Transfer billing → savings prefs accessible | Transfer | 1. Complete transfer via `/transfer` as billing user 2. Navigate to `/app/services` | SavingsPreferenceCard visible. Both toggles visible and toggleable | P1 | Yes |
| TC-030 | Finish registration billing → savings prefs accessible | Finish Registration | 1. Generate finish-reg URL via API (`POST api-dev.publicgrd.com/v1/test-partner/register`) 2. Complete finish-reg flow 3. Navigate to `/app/services` | SavingsPreferenceCard visible. Both toggles visible and toggleable | P1 | Yes |
| TC-031 | Move-in billing (pgtest encourage conversion) → savings prefs | Move-in (pgtest) | 1. Complete move-in via `/move-in?shortCode=pgtest` as billing user 2. Navigate to `/app/services` | Same as TC-027 — encourage conversion flag doesn't affect savings toggle logic | P2 | Yes |
| TC-032 | TX Light flow → savings prefs accessible | Light (TX dereg) | 1. Complete Light flow via `/move-in` using address `2900 Canton St` unit `524` 2. Navigate to `/app/services` | SavingsPreferenceCard visible. Toggles based on billing/account status from TX setup | P2 | No |

#### Non-Billing Onboarding Paths

| ID | Title | Onboarding Flow | Steps | Expected Result | Priority | Automate? |
|----|-------|----------------|-------|-----------------|----------|-----------|
| TC-033 | Move-in non-billing + valid account → both toggles work | Move-in (non-billing) | 1. Complete move-in via `/move-in?shortCode=autotest`, choose "I will manage payments myself" 2. Verify account number assigned 3. Navigate to `/app/services` | SavingsPreferenceCard visible. Both toggles visible and toggleable (has valid account) | P1 | Yes |
| TC-034 | Move-in non-billing + PENDING account → auto-enroll disabled | Move-in (non-billing) | 1. Complete non-billing move-in 2. Verify account number = PENDING 3. Navigate to `/app/services` | Savings alerts toggleable. Auto-enroll visible but **disabled** | P0 | Yes |
| TC-035 | Move-in non-billing + PENDING → sidebar hides auto-apply | Move-in (non-billing) | 1. Same user as TC-034 2. Navigate to `/app/overview` 3. Open SearchForSavingsDialog | Auto-apply toggle **hidden**. Button: "Activate alerts only" | P0 | Yes |
| TC-036 | Transfer non-billing → savings prefs match account state | Transfer (non-billing) | 1. Complete transfer as non-billing user 2. Navigate to `/app/services` | Toggle state matches account number status (valid → both work, PENDING → auto-enroll disabled) | P1 | Yes |
| TC-037 | Bill Upload flow → savings prefs on /services | Bill Upload | 1. Complete bill upload via `/bill-upload/connect-account` (zip `12249`, Con Edison) 2. Navigate to `/app/services` | SavingsPreferenceCard visible. Toggle state matches billing/account status | P1 | Yes |
| TC-038 | Verify Utilities flow → savings prefs on /services | Verify Utilities | 1. Complete verify-utilities via `/verify-utilities/connect-account` (zip `12249`) 2. Navigate to `/app/services` | SavingsPreferenceCard visible. Toggle state matches billing/account status | P1 | Yes |
| TC-039 | Utility Verification flow (pgtest) → savings prefs | Utility Verification | 1. Start move-in via `/move-in?shortCode=pgtest` 2. Click "I will call and setup myself" 3. Complete utility verification 4. Navigate to `/app/services` | SavingsPreferenceCard visible. Auto-enroll likely disabled (PENDING account) | P2 | No |

#### Cross-Path Verification

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | Billing user activates savings → transfer → prefs persist | 1. Billing user activates savings alerts + auto-enroll 2. Complete transfer to new address 3. Check `/app/services` | `enrollmentPreference` persists after transfer (tied to CottageUsers, not ElectricAccount) | P2 | No |
| TC-041 | Non-billing user → account number updated → auto-enroll unlocks | 1. Non-billing user with PENDING account number 2. Account number gets updated to valid value (DB or utility verification) 3. Navigate to `/app/services` | Auto-enroll toggle becomes enabled on services page. Auto-apply toggle appears in sidebar dialog | P1 | Yes |
| TC-042 | Fresh registration default — all onboarding paths set NULL enrollmentPreference | 1. Complete any onboarding flow 2. Query `CottageUsers.enrollmentPreference` | `enrollmentPreference` = NULL (defaults to `verification_only` in UI = both toggles OFF) | P1 | Yes |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion | Ticket |
|----|------------|-------------|--------|------------|--------|
| UX-001 | Services page — auto-enroll toggle | For non-billing users without account number, the auto-enroll toggle is visible but disabled with no explanation WHY it's disabled | User confusion — "why can't I turn this on?" | Add tooltip or helper text: "Add your account number to enable auto-enrollment" | [ENG-2574](https://linear.app/public-grid/issue/ENG-2574) |
| UX-002 | Sidebar dialog vs Services page | Sidebar HIDES the auto-apply toggle when user can't use it, but Services page shows it disabled — inconsistent pattern | User may wonder why the option exists on one page but not the other | Align both: either hide or disable+explain in both locations | [ENG-2575](https://linear.app/public-grid/issue/ENG-2575) |
| UX-003 | Sidebar dialog button text | "Activate alerts only" vs "Activate alerts and auto-apply" — text change is subtle and the only signal that auto-apply won't be set | Users may not notice the text difference | Consider a brief explanation below the button about what will be activated | [ENG-2576](https://linear.app/public-grid/issue/ENG-2576) |

> UX improvement tickets filed 2026-03-30. All assigned to Christian, related to ENG-2571.

## Automation Plan
- **Smoke**: TC-001 (billing sees card), TC-004 (no-acct auto-enroll disabled), TC-011 (sidebar auto-apply hidden), TC-034 (non-billing move-in → auto-enroll disabled), TC-035 (non-billing move-in → sidebar hides auto-apply)
- **Regression**: TC-002, TC-003, TC-005–TC-010, TC-012–TC-015, TC-016–TC-019, TC-020, TC-025, TC-027–TC-031, TC-033, TC-036–TC-038, TC-041, TC-042
- **Exploratory only**: TC-022, TC-023, TC-026, TC-032, TC-039, TC-040

## Test Data Strategy
For exploratory testing via Playwright MCP, we need 3 user types. Options:
1. **Use existing test users** — query Supabase to find users matching each profile
2. **Manipulate DB** — take an existing user and SET `accountNumber` to null/PENDING to test no-account scenarios
3. **Move-in flow** — register fresh billing (autotest) + non-billing (pgtest with "setup myself") users

Recommended: Start with existing users + DB manipulation for edge cases (TC-020, TC-021).

## Risks & Notes
- PR already merged — testing in dev environment
- Services page POM (`services_page.ts`) has no savings preference locators — will need POM updates for automation
- Overview sidebar POM — no SearchForSavingsDialog locators exist yet
- The "Recommended for you" sidebar section may not always show savings recommendation — depends on user state
- `isBillingCustomer` is derived in `ViewResidentDetails` view — need to verify the exact derivation logic if discrepancies found

## Verification Plan (Exploratory)
1. Find/create 3 test users (billing, non-billing+acct, non-billing+no-acct)
2. For each user, check `/app/services` → SavingsPreferenceCard
3. For each user, check `/app/overview` sidebar → SearchForSavingsDialog
4. Toggle combinations and verify DB state via Supabase
5. Verify AC5: null enrollmentPreference defaults to OFF
6. Verify AC6: button text changes based on canAutoApply
