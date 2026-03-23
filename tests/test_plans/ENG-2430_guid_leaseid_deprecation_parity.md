# Test Plan: ENG-2430 — Enforce same logic for guid & leaseID given deprecation

## Overview
**Ticket**: [ENG-2430](https://linear.app/public-grid/issue/ENG-2430/task-enforce-same-logic-for-guid-leaseid-given-deprecation)
**PR**: [cottage-nextjs #1131](https://github.com/Cottage-Energy/cottage-nextjs/pull/1131) (merged 2026-03-23)
**Date**: 2026-03-23
**Tester**: Christian

## Change Summary
PR #1131 normalizes `guid` and `leaseID` URL parameters in the move-in flow:
- `externalLeaseID` is now computed as `guid || leaseID || null` (guid takes priority)
- This applies in both `page.tsx` (server-side) and `move-in-widget.tsx` (client-side)
- `checkIfGuidInProgress` intentionally remains **guid-only** — provider in-progress resume does not fire from `leaseID`

**Files changed** (2 files, +6 / -2):
- `apps/main/app/move-in/page.tsx` — server-side externalLeaseID resolution + comment on guid-only provider check
- `apps/main/app/move-in/move-in-widget.tsx` — client-side externalLeaseID resolution

## Scope

### In Scope
- All 7 URL parameter combinations (guid only, leaseID only, both same, both different, neither, guid resume, leaseID no-resume)
- Existing-user detection parity (same email + matching/non-matching lease via guid vs leaseID)
- OTP follow-up parity (hasLeaseBeenRegistered via effective identifier)
- Dropped-off/authenticated user property targeting parity
- Provider in-progress resume isolation (guid-only)
- Light flow handoff (guid preserved in redirect)
- DB verification of `Property.externalLeaseID` after registration

### Out of Scope
- Transfer flow (not affected by this change)
- Connect flow (different entry point)
- Finish Registration flow (uses token, not guid/leaseID directly)
- Non-billing move-in (same code path for lease resolution, but billing behavior unchanged)

### Prerequisites
- Dev environment available
- Building `autotest` configured for standard move-in
- Building `txtest` configured for TX dereg (Light flow)
- Fastmail access for OTP verification
- Supabase access for DB verification of `Property.externalLeaseID`

### Dependencies
- `Property.externalLeaseID` column in Supabase
- `checkIfGuidInProgress` server function (unchanged, guid-only)
- Move-in state machine (XState) — consumes `externalLeaseID` from context

---

## Test Cases

### AC1: Guid-first normalization inside move-in

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Move-in with `guid` only | New user, `autotest` building | 1. Navigate to `/move-in?shortCode=autotest&guid=TESTLEASE001` 2. Complete full move-in flow | Move-in completes successfully; `guid` used as effective lease identifier | P0 | Yes |
| TC-002 | Move-in with `leaseID` only | New user, `autotest` building | 1. Navigate to `/move-in?shortCode=autotest&leaseID=TESTLEASE002` 2. Complete full move-in flow | Move-in completes successfully; `leaseID` used as effective lease identifier (unchanged behavior) | P0 | Yes |
| TC-003 | Move-in with both `guid` and `leaseID` (same value) | New user, `autotest` building | 1. Navigate to `/move-in?shortCode=autotest&guid=TESTLEASE003&leaseID=TESTLEASE003` 2. Complete full move-in flow | Move-in completes successfully; effective identifier = shared value | P1 | Yes |
| TC-004 | Move-in with both `guid` and `leaseID` (different values) — guid wins | New user, `autotest` building | 1. Navigate to `/move-in?shortCode=autotest&guid=GUID004&leaseID=LEASE004` 2. Complete full move-in flow 3. Query `Property.externalLeaseID` in DB | Move-in completes; `Property.externalLeaseID` = `GUID004` (guid wins) | P0 | Yes |
| TC-005 | Move-in with neither `guid` nor `leaseID` | New user, `autotest` building | 1. Navigate to `/move-in?shortCode=autotest` 2. Complete full move-in flow | Move-in completes successfully without lease-specific matching (baseline, existing behavior) | P0 | Yes |

### AC2: Existing-user check parity

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-006 | Existing user detected via `guid` — same email, matching lease | User A completed move-in with `externalLeaseID=LEASE006` | 1. Navigate to `/move-in?shortCode=autotest&guid=LEASE006` 2. Enter same address, same email as User A 3. Observe personal-info step | "Email already registered" message shown; OTP flow triggered (same as leaseID path) | P0 | Yes |
| TC-007 | Existing user detected via `leaseID` — same email, matching lease | User A completed move-in with `externalLeaseID=LEASE007` | 1. Navigate to `/move-in?shortCode=autotest&leaseID=LEASE007` 2. Enter same address, same email as User A 3. Observe personal-info step | "Email already registered" message shown; OTP flow triggered (identical to guid path) | P0 | Yes |
| TC-008 | Existing user — same email, different lease via `guid` | User A completed move-in with `externalLeaseID=ORIGLEASE` | 1. Navigate to `/move-in?shortCode=autotest&guid=DIFFERENTLEASE` 2. Enter same email as User A 3. Observe personal-info step | "Different lease" branch triggered — same behavior as if leaseID param were used | P1 | Yes |

### AC3: OTP follow-up parity

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-009 | OTP verification uses effective identifier (guid) | Existing user with `Property.externalLeaseID=LEASE009` | 1. Navigate to `/move-in?guid=LEASE009` 2. Enter matching email → "email registered" 3. Complete OTP verification | Post-OTP, `hasLeaseBeenRegistered` = true; user directed to existing property (not new lease) | P1 | Exploratory |
| TC-010 | OTP verification uses effective identifier (leaseID) | Existing user with `Property.externalLeaseID=LEASE010` | 1. Navigate to `/move-in?leaseID=LEASE010` 2. Enter matching email → "email registered" 3. Complete OTP verification | Post-OTP, `hasLeaseBeenRegistered` = true; identical behavior to guid path | P1 | Exploratory |

### AC4: Dropped-off / authenticated property targeting parity

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-011 | Dropped-off user restored with `guid` targets correct property | User dropped off mid-flow with `externalLeaseID=LEASE011` | 1. Navigate to `/move-in?guid=LEASE011` as dropped-off user 2. Flow restores user state | Property matching uses guid as effective identifier; targets same property | P2 | Exploratory |
| TC-012 | Dropped-off user restored with `leaseID` targets correct property | User dropped off mid-flow with `externalLeaseID=LEASE012` | 1. Navigate to `/move-in?leaseID=LEASE012` as dropped-off user 2. Flow restores user state | Property matching uses leaseID; targets same property as guid would | P2 | Exploratory |
| TC-013 | Effective identifier doesn't match any property — new lease scenario | Authenticated user, no property with matching externalLeaseID | 1. Navigate to `/move-in?guid=NONEXISTENT` as authenticated user | Treated as new lease scenario — no property pre-selected | P2 | Exploratory |

### AC5: Guid-only provider resume remains unchanged

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-014 | `guid` triggers provider in-progress resume | Provider flow in-progress for `guid=GUID014` | 1. Navigate to `/move-in?guid=GUID014` 2. Observe `checkIfGuidInProgress` behavior | Provider in-progress state auto-resumed; user continues from where they left off | P1 | Exploratory |
| TC-015 | `leaseID` does NOT trigger provider in-progress resume | Provider flow in-progress for guid value `GUID015` | 1. Navigate to `/move-in?leaseID=GUID015` 2. Observe behavior | Provider in-progress NOT resumed; `checkIfGuidInProgress` only runs for `guid` param. User starts fresh move-in | P0 | Yes |
| TC-016 | Both params — provider resume uses `guid` value only | Provider flow in-progress for `guid=GUID016` | 1. Navigate to `/move-in?guid=GUID016&leaseID=LEASE016` | Provider resume triggered using `guid` value; `leaseID` irrelevant for resume | P2 | Exploratory |

### AC6: Light handoff remains intact

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-017 | Guid preserved in Light flow redirect | TX dereg address (`2900 Canton St`, unit `524`) | 1. Navigate to `/move-in?guid=GUIDLIGHT` 2. Enter TX dereg address 3. Observe redirect to `/move-in/light` | `guid` param is preserved in the Light redirect URL | P1 | Yes |
| TC-018 | Light flow completes with guid-sourced externalLeaseID | TX dereg address, `guid` param | 1. Navigate to `/move-in?guid=GUIDLIGHT2` 2. Enter TX address → Light modal 3. Complete Light flow | Flow completes; `externalLeaseID` on property = guid value | P2 | Exploratory |

### DB Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-019 | `externalLeaseID` set from `guid` only | After TC-001: `SELECT "externalLeaseID" FROM "Property" WHERE "cottageUserID" = '<userId>'` | `externalLeaseID` = `TESTLEASE001` | P0 |
| TC-020 | `externalLeaseID` set from `leaseID` only | After TC-002: same query | `externalLeaseID` = `TESTLEASE002` | P0 |
| TC-021 | `externalLeaseID` set from `guid` when both present (guid wins) | After TC-004: same query | `externalLeaseID` = `GUID004` (NOT `LEASE004`) | P0 |
| TC-022 | `externalLeaseID` null when neither param present | After TC-005: same query | `externalLeaseID` IS NULL or default value | P1 |

### Negative / Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-023 | Empty `guid` param falls through to `leaseID` | Navigate to `/move-in?guid=&leaseID=LEASE023` | `leaseID` used as effective identifier (empty string is falsy) | P2 | Yes |
| TC-024 | Empty both params | Navigate to `/move-in?guid=&leaseID=` | Same as neither present — no lease matching | P2 | Yes |
| TC-025 | URL-encoded special characters in `guid` | Navigate to `/move-in?guid=LEASE%2F025%26special` | `safeDecodeURIComponent` decodes correctly; `externalLeaseID` = `LEASE/025&special` | P3 | Exploratory |
| TC-026 | Very long `guid` value | Navigate to `/move-in?guid=<256+ char string>` | Move-in flow handles gracefully; no truncation errors | P3 | Exploratory |

### Regression: Standard Move-in Flows (per Tomy's comment)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-027 | Standard move-in (no lease params) — autotest shortcode | Navigate to `/move-in?shortCode=autotest`, complete full flow | Move-in completes as before — no regression from guid normalization | P0 | Yes (existing) |
| TC-028 | Standard move-in — pgtest shortcode (encourage conversion) | Navigate to `/move-in?shortCode=pgtest`, complete full flow | Move-in completes as before | P1 | Yes (existing) |
| TC-029 | Move-in with `electricCompany` param (no lease params) | Navigate to `/move-in?electricCompany=COMED`, complete flow | Move-in completes; utility param handling unaffected | P1 | Yes (existing) |
| TC-030 | Move-in with address params (no lease params) | Navigate to `/move-in?streetAddress=123+williams&city=New+York&zip=1234`, complete flow | Move-in completes; address param handling unaffected | P1 | Yes (existing) |
| TC-031 | Existing user move-in (no lease params) — email registered + OTP | First user completes move-in, second move-in with same email | "Email registered" → OTP → confirmed → services page | P0 | Yes (existing) |

---

## Automation Plan

### Smoke (P0 — critical path validation)
- **TC-001**: guid-only move-in completes
- **TC-002**: leaseID-only move-in completes
- **TC-004 + TC-021**: both params, guid wins (+ DB verification)
- **TC-005**: neither param, baseline unchanged
- **TC-015**: leaseID does NOT trigger provider resume

### Regression (new tests to scaffold)
- **TC-003**: both params same value
- **TC-006, TC-007**: existing-user detection parity (guid vs leaseID)
- **TC-008**: different lease branch via guid
- **TC-017**: Light handoff preserves guid
- **TC-023, TC-024**: empty param edge cases
- **TC-019, TC-020, TC-022**: DB verification of externalLeaseID

### Existing regression (run as-is for confidence)
- **TC-027–TC-031**: standard move-in flows (already in `move_in_parameters.spec.ts`, `move_in_shortcode.spec.ts`, `move_in_existing_cottage_user.spec.ts`)

### Exploratory only (manual)
- **TC-009, TC-010**: OTP hasLeaseBeenRegistered verification (requires DB state inspection mid-flow)
- **TC-011–TC-013**: Dropped-off user property targeting (requires specific drop-off state setup)
- **TC-014, TC-016**: Provider in-progress resume (requires provider context setup)
- **TC-018**: Light flow completion with guid
- **TC-025, TC-026**: Special characters and long values

---

## Risks & Notes
- **No existing lease param coverage**: This is entirely new test territory — no tests currently use `guid` or `leaseID` params. All TC-001 through TC-026 are net-new.
- **Provider resume testing (AC5)**: `checkIfGuidInProgress` requires a provider-initiated guid flow to be "in progress" — this state may be difficult to set up in test automation. Recommend exploratory first.
- **DB verification requires Supabase access**: TC-019–TC-022 need Supabase queries against `Property.externalLeaseID`. Current `accountQueries` module doesn't expose this field — will need a new query helper.
- **Existing-user tests (AC2) need two-pass setup**: First create a user with a known `externalLeaseID`, then attempt a second move-in with the same identifier via guid vs leaseID.
- **Light flow (AC6)**: Needs `txtest` building or TX dereg address (`2900 Canton St`, unit `524`) to trigger the light redirect.
