# Test Plan: NEVER_VERIFIED Status + PM Email Notification

## Overview
**Ticket**: ENG-2395
**Source**: [Linear ENG-2395](https://linear.app/public-grid/issue/ENG-2395/task-never-verified-status-in-pg-admin) | [PR #536 (pg-admin)](https://github.com/Cottage-Energy/pg-admin/pull/536) — MERGED | [PR #1083 (cottage-nextjs)](https://github.com/Cottage-Energy/cottage-nextjs/pull/1083) — MERGED
**Date**: 2026-03-16
**Tester**: Christian

## Context
New account status `NEVER_VERIFIED` for move-in users who entered the verification flow but never completed utility verification. Previously these users were marked `INACTIVE`, mixing them with legitimately moved-out customers. The change introduces:

1. **Database**: New `NEVER_VERIFIED` value in `enum_UtilityAccount_status`, new `notifyPmOnNeverVerified` boolean on `BuildingOwnershipCompany`, new `pmEmail` text column on `Building`
2. **PG Admin** (pg-admin PR #536): `NEVER_VERIFIED` in status dropdown, `NeverVerifiedEmailModal` with email preview, `useNeverVerifiedNotification` hook that checks building ownership flags before prompting
3. **Customer-facing FE** (cottage-nextjs PR #1083): `isInactiveLike()` helper function treating `NEVER_VERIFIED` identically to `INACTIVE` in dashboard rendering, utility alerts, and property calculations. Inngest function for email delivery via Resend.
4. **Email flow**: PG Admin → cottage-nextjs API `/api/building-never-verified` → Inngest → Resend email to `Building.pmEmail`

### Repos in Scope
- `pg-admin` — PG Admin React app (status dropdown, email modal, notification hook)
- `cottage-nextjs` — Customer FE (`isInactiveLike` logic) + backend (Inngest email function, API route)
- Supabase — DB migration (enum + schema changes)

### Existing Coverage
- **Zero** tests for NEVER_VERIFIED in cottage-tests
- **Zero** PG Admin e2e tests in this repo (no `tests/e2e_tests/pg-admin/` directory)
- Existing move-in tests reference `ElectricAccount` status but don't test NEVER_VERIFIED
- `tests/resources/types/database.types.ts` does not yet include `NEVER_VERIFIED`

---

## Scope

### In Scope
- DB migration verification (enum value, new columns, defaults)
- PG Admin: status dropdown for electric and gas accounts
- PG Admin: NEVER_VERIFIED status save to DB
- PG Admin: PM email notification modal (conditional display, confirm/skip actions)
- PG Admin: email delivery via Resend (content, recipient, reply-to)
- Customer FE: dashboard renders NEVER_VERIFIED same as INACTIVE
- Customer FE: `isInactiveLike()` covers all conditional logic paths
- Building segmentation: NEVER_VERIFIED counts as inactive segment

### Out of Scope
- Ops reporting/analytics dashboards (not yet built)
- Retargeting workflows using NEVER_VERIFIED (future work)
- Other status transitions unrelated to NEVER_VERIFIED
- PG Admin auth/login (not part of this feature)

### Prerequisites
- `dev` environment with both PRs deployed
- PG Admin access at `https://dev.publicgrid.co` with ops credentials
- Test user with an electric account in a verifiable status (to change to NEVER_VERIFIED)
- Test building with:
  - `BuildingOwnershipCompany.notifyPmOnNeverVerified = true` AND `Building.pmEmail` populated (for modal tests)
  - `BuildingOwnershipCompany.notifyPmOnNeverVerified = false` (for silent skip tests)
  - `Building.pmEmail = null` (for missing email tests)
- Inngest dev server running (`pnpm run dev-main-only-inngest` per PR #1083 notes)
- Access to verify Resend email delivery (Fastmail inbox or Resend dashboard)

### Dependencies
- PG Admin availability (was down as of 2026-03-15 for ENG-2406 testing)
- Inngest server for email delivery chain
- Resend email service
- Supabase migration applied to dev

---

## Test Cases

### A. Database Migration

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | NEVER_VERIFIED exists in enum | Query `pg_enum` for `enum_UtilityAccount_status` | `NEVER_VERIFIED` is present as a valid value | P0 | Yes (DB query) |
| TC-002 | notifyPmOnNeverVerified column exists | Query `information_schema.columns` for `BuildingOwnershipCompany` | Boolean column `notifyPmOnNeverVerified` exists, default `false` | P0 | Yes (DB query) |
| TC-003 | pmEmail column exists | Query `information_schema.columns` for `Building` | Nullable text column `pmEmail` exists | P0 | Yes (DB query) |
| TC-004 | Existing accounts unaffected | Query electric/gas accounts with prior statuses | No accounts inadvertently set to NEVER_VERIFIED by migration | P1 | Yes (DB query) |

### B. PG Admin — Status Dropdown

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | NEVER_VERIFIED in electric account dropdown | 1. Open PG Admin → navigate to user profile 2. Open electric account status dropdown | `NEVER_VERIFIED` appears as a selectable option alongside all existing statuses | P0 | Yes |
| TC-011 | NEVER_VERIFIED in gas account dropdown | 1. Open PG Admin → navigate to user with gas account 2. Open gas account status dropdown | `NEVER_VERIFIED` appears as a selectable option | P0 | Yes |
| TC-012 | NEVER_VERIFIED has correct styling | 1. View NEVER_VERIFIED in status dropdown or badge | Gray color scheme (`bg-gray-500/10 border-gray-600 text-gray-600`) per PR | P2 | No (visual) |

### C. PG Admin — Status Change Save

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Save NEVER_VERIFIED on electric account | 1. Open user profile in PG Admin 2. Change electric account status to NEVER_VERIFIED 3. Save | Status updates to NEVER_VERIFIED in DB. `ElectricAccount.status = 'NEVER_VERIFIED'` confirmed via Supabase query | P0 | Yes |
| TC-021 | Save NEVER_VERIFIED on gas account | 1. Open user profile in PG Admin 2. Change gas account status to NEVER_VERIFIED 3. Save | Status updates to NEVER_VERIFIED in DB. `GasAccount.status = 'NEVER_VERIFIED'` confirmed via Supabase query | P0 | Yes |
| TC-022 | Status change from NEVER_VERIFIED to another status | 1. Account already set to NEVER_VERIFIED 2. Change to INACTIVE 3. Save | Status updates successfully; no stale state | P1 | Yes |
| TC-023 | Status change from active status to NEVER_VERIFIED | 1. Account in PENDING or ENROLLED status 2. Change to NEVER_VERIFIED 3. Save | Status saves correctly; modal logic fires if conditions met | P1 | Yes |

### D. PG Admin — Email Notification Modal (Flag Enabled + pmEmail Set)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Modal appears when conditions met | 1. Set `BuildingOwnershipCompany.notifyPmOnNeverVerified = true` 2. Set `Building.pmEmail = 'pm@example.com'` 3. Change account status to NEVER_VERIFIED and save | Confirmation dialog appears: "This building's ownership company has Property Manager notifications enabled. Would you like to send a notification email to the Property Manager at pm@example.com?" | P0 | Yes |
| TC-031 | Modal shows correct resident name | 1. User has first name "John", last name "Doe" 2. Trigger NEVER_VERIFIED modal | Modal email preview includes "John Doe" as the resident name | P0 | Yes |
| TC-032 | Modal shows correct unit number | 1. Property has unit number "4B" 2. Trigger NEVER_VERIFIED modal | Modal email preview includes "unit 4B" | P0 | Yes |
| TC-033 | Modal shows email preview | 1. Trigger NEVER_VERIFIED modal | Preview text shows full email body: greeting, resident name, unit, verification failure message, follow-up suggestion, sign-off "The Public Grid Team" | P1 | Yes |
| TC-034 | Modal has Confirm and Skip buttons | 1. Trigger NEVER_VERIFIED modal | Two buttons visible: "Confirm" (primary) and "Skip" (outline/secondary) | P1 | Yes |
| TC-035 | Confirm sends email | 1. Trigger NEVER_VERIFIED modal 2. Click "Confirm" | Loading state shows "Sending..." → success toast "PM notification email sent to pm@example.com" → modal closes | P0 | Yes |
| TC-036 | Confirm button disabled while sending | 1. Trigger NEVER_VERIFIED modal 2. Click "Confirm" | Both Confirm and Skip buttons are disabled during the loading state | P2 | Yes |
| TC-037 | Skip dismisses without sending | 1. Trigger NEVER_VERIFIED modal 2. Click "Skip" | Modal closes, no email sent, no error toast | P0 | Yes |
| TC-038 | Modal only fires on status *change* | 1. Account already in NEVER_VERIFIED 2. Re-save without changing status | No modal appears (status didn't change) | P1 | Yes |

### E. PG Admin — Email Notification Modal (Flag Disabled / pmEmail Missing)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | No modal when flag is false | 1. Set `BuildingOwnershipCompany.notifyPmOnNeverVerified = false` 2. `Building.pmEmail` is populated 3. Change to NEVER_VERIFIED and save | Status saves successfully, no modal appears, no email sent | P0 | Yes |
| TC-041 | No modal when pmEmail is null | 1. Set `BuildingOwnershipCompany.notifyPmOnNeverVerified = true` 2. `Building.pmEmail = null` 3. Change to NEVER_VERIFIED and save | Status saves successfully, no modal appears, no email sent | P0 | Yes |
| TC-042 | No modal when both conditions false | 1. Flag is false AND pmEmail is null 2. Change to NEVER_VERIFIED and save | Status saves silently, no modal | P2 | Yes |
| TC-043 | No modal for non-NEVER_VERIFIED status changes | 1. Flag is true, pmEmail is set 2. Change status to INACTIVE (not NEVER_VERIFIED) 3. Save | No modal appears (modal only triggers for NEVER_VERIFIED) | P1 | Yes |

### F. Email Delivery Verification

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Email sent to correct recipient | 1. Trigger NEVER_VERIFIED → Confirm email send | Email arrives at `Building.pmEmail` address | P0 | Partial (Fastmail) |
| TC-051 | Email has correct reply-to | 1. Confirm email send 2. Inspect received email headers | Reply-To is `partners@onepublicgrid.com` | P1 | Partial (Fastmail) |
| TC-052 | Email subject line | 1. Confirm email send 2. Check received email | Subject: "Resident Utility Verification - Action May Be Needed" | P1 | Partial (Fastmail) |
| TC-053 | Email body contains resident name | 1. Resident is "Jane Smith" 2. Confirm email send | Body includes "Jane Smith" | P0 | Partial (Fastmail) |
| TC-054 | Email body contains unit number | 1. Property unit is "12A" 2. Confirm email send | Body includes "unit 12A" | P0 | Partial (Fastmail) |
| TC-055 | Email send failure handling | 1. Simulate API error (e.g., invalid email, Inngest down) | Error toast: "Failed to send PM notification email". Modal closes. Status change still persisted. | P1 | No (exploratory) |
| TC-056 | Email sent via Inngest function | 1. Check Inngest dashboard or logs after Confirm | `building-never-verified` Inngest function was invoked and completed | P2 | No (manual) |

### G. Customer FE — NEVER_VERIFIED Renders as INACTIVE

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Dashboard renders same as INACTIVE | 1. Set account status to NEVER_VERIFIED via DB/PG Admin 2. Log in as that resident on customer FE | Dashboard renders identically to how INACTIVE renders — no errors, no blank UI, no "unknown status" | P0 | Yes |
| TC-061 | Utility account alert shows inactivity | 1. Account status is NEVER_VERIFIED 2. Access dashboard | `useUtilityAccountInactivity` returns 'inactive' (same as INACTIVE) — inactivity alert/banner appears if applicable | P1 | Yes |
| TC-062 | Active utility account selection skips NEVER_VERIFIED | 1. Electric account is NEVER_VERIFIED, gas account is ACTIVE 2. Access dashboard | Gas account is selected as the active utility account (NEVER_VERIFIED is treated as inactive) | P1 | Yes |
| TC-063 | getUtilityStatus returns 'inactive' | 1. Account status is NEVER_VERIFIED | `getUtilityStatus()` returns `'inactive'` — property calculations treat it as inactive | P1 | Yes (via UI assertion) |
| TC-064 | No console errors for NEVER_VERIFIED | 1. Set account to NEVER_VERIFIED 2. Load customer dashboard 3. Check browser console | No unhandled status errors, no undefined/null rendering issues | P1 | Yes |
| TC-065 | Switch from NEVER_VERIFIED back to active status | 1. Account is NEVER_VERIFIED 2. Via PG Admin, change to ENROLLED 3. Refresh customer dashboard | Dashboard updates to show active state, no stale cache issues | P2 | Yes |

### H. Building Segmentation

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | NEVER_VERIFIED in inactive segment | 1. Building has resident with NEVER_VERIFIED status 2. Query/view building property segments | Resident is bucketed into the `inactive` segment, same as INACTIVE | P0 | Yes (DB query) |
| TC-071 | Segment details include NEVER_VERIFIED users | 1. Query `get_buildings_property_segment_details` for a building with NEVER_VERIFIED residents | NEVER_VERIFIED residents appear in the inactive segment details | P1 | Yes (DB query) |
| TC-072 | Segment counts are accurate | 1. Building has 2 INACTIVE + 1 NEVER_VERIFIED residents 2. View segment counts | Inactive segment count = 3 (includes all) | P1 | Yes (DB query) |

### I. Edge Cases & Regression

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-080 | Both electric AND gas set to NEVER_VERIFIED | 1. User has both electric and gas accounts 2. Set both to NEVER_VERIFIED 3. Check customer FE | Dashboard renders inactive state. No double-modal in PG Admin (each fires independently per account save). | P2 | No (exploratory) |
| TC-081 | NEVER_VERIFIED user attempts new move-in | 1. Resident with NEVER_VERIFIED status 2. Attempt to re-register or start new move-in flow | Existing behavior for INACTIVE applies — user can re-enter flow or is redirected appropriately | P2 | No (exploratory) |
| TC-082 | Missing resident name (null first/last) | 1. User record has null firstName and lastName 2. Trigger NEVER_VERIFIED modal | Modal shows "Unknown Resident" (fallback per PR code) | P2 | Yes |
| TC-083 | Missing unit number (null) | 1. Property has null unitNumber 2. Trigger NEVER_VERIFIED modal | Modal shows "Unknown Unit" (fallback per PR code) | P2 | Yes |
| TC-084 | MoveInFormModal also triggers notification | 1. MoveInFormModal component has `onNeverVerifiedStatusChange` prop 2. Change status to NEVER_VERIFIED via MoveInFormModal | Same modal/notification behavior as main status dropdown | P1 | Yes |
| TC-085 | Concurrent status changes | 1. Two ops users open same account in PG Admin 2. Both change to NEVER_VERIFIED simultaneously | Both saves succeed; modal fires for each session independently | P3 | No (exploratory) |
| TC-086 | Existing INACTIVE users unaffected | 1. Query users currently with INACTIVE status 2. Verify FE rendering | No behavior change for existing INACTIVE users — dashboard still renders correctly | P0 | Yes (regression) |

---

## Automation Plan

### Smoke (P0, immediate)
- TC-001, TC-002, TC-003 (DB migration verification)
- TC-010, TC-020 (PG Admin status dropdown + save — pending PG Admin test infrastructure)
- TC-030, TC-035, TC-037 (modal show/confirm/skip)
- TC-040, TC-041 (modal suppression)
- TC-060 (customer FE renders NEVER_VERIFIED as INACTIVE)
- TC-070 (building segmentation)

### Regression (post-automation)
- TC-011, TC-021, TC-022, TC-023 (gas account, transitions)
- TC-031–TC-034, TC-036, TC-038 (modal details)
- TC-042, TC-043 (additional suppression cases)
- TC-050–TC-054 (email delivery content)
- TC-061–TC-065 (customer FE details)
- TC-071, TC-072 (segment details)
- TC-082–TC-084, TC-086 (edge cases + regression)

### Exploratory Only
- TC-012 (visual styling)
- TC-055, TC-056 (email failure + Inngest verification)
- TC-080, TC-081, TC-085 (complex edge cases)

### Automation Blockers
- **PG Admin tests**: No PG Admin e2e infrastructure exists yet. Tests TC-010 through TC-043 and TC-082–TC-084 require PG Admin Playwright setup (auth, POM classes, fixtures). This is a **new test surface** for the cottage-tests repo.
- **Email verification**: TC-050–TC-056 depend on receiving the Resend email. Fastmail can verify delivery if `Building.pmEmail` is set to a Fastmail test address. Full Inngest verification (TC-056) is manual.
- **Supabase MCP**: DB queries (TC-001–TC-004, TC-070–TC-072) currently blocked by "Forbidden resource" error — need project access resolved.

---

## Test Data Setup

### Required DB State (via Supabase or PG Admin)
1. **Building with notifications enabled**: `BuildingOwnershipCompany.notifyPmOnNeverVerified = true`, `Building.pmEmail = 'pgtest+neververified@joinpublicgrid.com'` (Fastmail-routable)
2. **Building with notifications disabled**: `BuildingOwnershipCompany.notifyPmOnNeverVerified = false`, `Building.pmEmail` populated
3. **Building with no pmEmail**: `BuildingOwnershipCompany.notifyPmOnNeverVerified = true`, `Building.pmEmail = null`
4. **Test users**: Residents at each building with electric accounts in a changeable status (e.g., PENDING, ENROLLED)
5. **Ownership companies**: Per ticket, AVB and Westover are the intended companies with notification enabled — verify these exist in dev

---

## Risks & Notes

1. **PG Admin was down** as of 2026-03-15 (found during ENG-2406 testing). If still down, all PG Admin tests (Sections B–E) are blocked.
2. **No PG Admin test infrastructure** — this is the first feature requiring PG Admin e2e tests. Need to establish: PG Admin auth fixture, page object for user profile/account status, building management pages.
3. **Inngest dependency** — email delivery requires `pnpm run dev-main-only-inngest` running in cottage-nextjs. CI environment may not have this. Manual verification may be needed for email tests.
4. **Supabase MCP permissions** — DB verification queries are returning "Forbidden resource". Need to resolve project access or use direct Supabase client.
5. **Email testing** — use Fastmail test address as `pmEmail` to intercept and verify email content, subject, reply-to.
6. **`database.types.ts` update needed** — local type file doesn't include `NEVER_VERIFIED`. Should be updated before writing automated tests.
7. **isInactiveLike coverage** — the `INACTIVE_LIKE_STATUSES` array in cottage-nextjs is `['INACTIVE', 'NEVER_VERIFIED']`. If any FE code still does direct `=== 'INACTIVE'` comparisons instead of using `isInactiveLike()`, NEVER_VERIFIED users could see broken UI. Grep the codebase for missed spots.

---

## Suggested Test Sequence

1. **DB verification** (TC-001–TC-004) — confirm migration landed in dev
2. **PG Admin exploratory** (TC-010–TC-012, TC-020–TC-023) — status dropdown + save
3. **PG Admin modal flow** (TC-030–TC-043) — notification modal all paths
4. **Email delivery** (TC-050–TC-056) — verify Resend email content
5. **Customer FE** (TC-060–TC-065) — dashboard rendering for NEVER_VERIFIED
6. **Building segments** (TC-070–TC-072) — segment calculations
7. **Edge cases** (TC-080–TC-086) — regression and boundary conditions

---

*Total: 42 test cases (15 P0, 16 P1, 9 P2, 2 P3)*
*Generated by QA automation — full test plan saved to cottage-tests repo*
