# Test Plan: Light User Email Update Flow

## Overview
**Ticket**: ENG-2080
**PR**: cottage-nextjs #1123 (merged 2026-03-31)
**Source**: Linear ticket + PR diff + Supabase schema + dev comments
**Date**: 2026-04-01
**Tester**: Christian

## Context
When a light user updates their email on `/portal/account`, three systems must stay in sync:
1. **Supabase Auth** (`auth.users`) — source of truth for authentication
2. **LightUsers table** — stores `email` column per light user record
3. **Light API** (`/v1/account`) — external Light API profile

The flow: Edit email → Supabase sends verification email → User clicks link → `/email-confirmation` → `/session-init` (email parity check + sync) → `/portal/account?emailUpdated=true`

### New API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/light/init-session` | GET | Fetch priority light user + set `light-access-token` cookie |
| `/api/light/get-user/account-api` | GET | Fetch light user via account API (moved from dashboard GET) |
| `/api/light/profile/sync-email` | PATCH | Sync email across ALL LightUser accounts + Light API |

### DB Trigger Status
- Function `update_light_users_email` EXISTS in dev — updates `LightUsers.email` on `auth.users` update
- **No trigger attached** — the ticket mentions `light_email_update_on_email_auth` but it does NOT exist in dev
- Existing trigger `email_update_on_email_auth_change` only updates `CottageUsers`
- Email sync for light users is handled via API route (`/api/light/profile/sync-email`), not DB trigger
- **Verify**: Is the missing trigger intentional (API-only sync) or a migration gap?

## Scope

### In Scope
- AC1: Initiating email change on `/portal/account`
- AC2: Email confirmation via `/email-confirmation` (session/no-session paths, error states)
- AC3: Email sync on `/session-init` (parity check, sync-email call, multi-account)
- AC4: Middleware skips for `/email-confirmation` and `/session-init`
- AC5: Post-confirmation redirect + toast notifications
- AC6: Multi-account sync (all LightUsers rows updated)
- AC7: Middleware refactor — `getPriorityLightUserAndRefreshMetadata` (no behavior change)
- Cross-browser: Chrome, Safari, Firefox, Mobile Safari
- Regression: CottageUser flows, session-init, portal routing

### Out of Scope
- Light API internal behavior (third-party)
- Supabase Auth email sending internals
- CottageUser email update flow (separate feature, but regression-check email-confirmation)

### Prerequisites
- Light user account in dev (created via Light move-in flow)
- Access to email inbox for verification links (Fastmail)
- Multi-property light user for AC6 testing
- Cross-browser test environments

## Test Cases

### Happy Path (AC1, AC2, AC3, AC5)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Edit email — initiate change | 1. Log in as light user 2. Go to `/portal/account` 3. Click "Edit details" 4. Change email to new valid address 5. Click "Save changes" | Confirmation dialog appears: "Check your inbox — verify your new email address by clicking the link we've just sent you" with "Okay" button. Email field reverts to old email. | P0 | Yes |
| TC-002 | Verification email received | After TC-001: Check inbox of NEW email address | Verification email from Supabase arrives with confirmation link | P0 | Yes (Fastmail) |
| TC-003 | Confirm email — active session (same browser) | 1. Complete TC-001 2. Open verification link in same browser (active session) 3. Lands on `/email-confirmation` | Auto-redirects to `/session-init` → email parity check → sync → redirects to `/portal/account?emailUpdated=true` | P0 | Yes |
| TC-004 | Success toast after email update | After TC-003: Observe `/portal/account` page | Success toast: "Email updated — Your email has been successfully updated." Query param `emailUpdated` cleaned from URL. Email field shows new email. | P0 | Yes |
| TC-005 | Confirm email — no session (different browser) | 1. Complete TC-001 2. Open verification link in different browser/incognito (no session) | Redirects to `/sign-in?emailUpdated=true` with orange banner: "Your email has been updated. Please sign in with your new email address." | P0 | Yes |
| TC-006 | Sign in after email change — new email works | After TC-005: Sign in with new email address | Login succeeds, lands on `/portal/overview` | P1 | Yes |
| TC-007 | Edit non-email fields only | 1. Log in as light user 2. Edit first name and phone number only (don't change email) 3. Save | Success toast "Your profile has been updated!" — no confirmation dialog, no verification email | P1 | Yes |
| TC-008 | Edit email AND other fields simultaneously | 1. Change email + first name + phone 2. Save | Non-email fields update immediately. Email triggers verification flow. Confirmation dialog appears. | P1 | Yes |

### Email Confirmation Page (AC2)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Expired verification link | 1. Initiate email change 2. Wait for link expiration (or use invalid token) 3. Click expired/invalid link | `/email-confirmation` shows error message with Supabase error description + "contact support" link. "Back to Home" button goes to `/portal/overview` (light user). | P1 | Yes |
| TC-011 | Error page — Back to Home (light user) | On error state of `/email-confirmation` as light user: Click "Back to Home" | Navigates to `/portal/overview` (NOT `/app/overview`) | P1 | Yes |
| TC-012 | Error page — Back to Home (cottage user) | On error state of `/email-confirmation` as cottage user: Click "Back to Home" | Navigates to `/app/overview` | P2 | Yes |
| TC-013 | Verification link — no error, no session | Open valid verification link with no active session | Redirects to `/sign-in?emailUpdated=true` | P1 | Yes |

### Session-Init Email Sync (AC3)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Session-init — email parity mismatch triggers sync | 1. Initiate email change 2. Confirm via link (active session) 3. Observe network on `/session-init` | Calls: 1) `/api/light/init-session` 2) `/api/light/get-user/app-api` 3) If emails differ → `PATCH /api/light/profile/sync-email` 4) Redirect to `/portal/account?emailUpdated=true` | P0 | No (exploratory — network inspection) |
| TC-021 | Session-init — emails already match | Navigate to `/session-init` when auth email = Light API email | Redirects straight to `/portal/overview` (no sync needed) | P1 | Yes |
| TC-022 | Session-init — sync-email fails | Simulate sync failure (e.g., Light API down) | Redirects to `/portal/account?emailUpdated=false`, warning toast shown | P1 | No (exploratory — requires API failure) |
| TC-023 | Session-init — cottage user not affected | Navigate to `/session-init` as cottage user | Normal cottage user flow — no light email sync logic executed | P1 | Yes |

### Multi-Account Sync (AC6)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Multi-property light user — all accounts synced | 1. Log in as light user with multiple lightDevIDs 2. Change email and confirm 3. Check all LightUsers rows in DB | All LightUsers rows with same `id` have updated email. Light API profile updated for each `lightDevID`. | P0 | Partial (DB verification manual) |
| TC-031 | Multi-property — partial sync failure | If one Light API PATCH fails during iteration | Sync stops, returns error. Redirect to `/portal/account?emailUpdated=false` | P2 | No (exploratory) |

### Middleware (AC4, AC7)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | Middleware — /email-confirmation not redirected | As light user, navigate to `/email-confirmation` with valid params | Page loads normally — NOT redirected to `/portal/overview` | P0 | Yes |
| TC-041 | Middleware — /session-init not redirected | As light user, navigate to `/session-init` | Page loads and processes — NOT redirected to `/portal/overview` | P0 | Yes |
| TC-042 | Middleware refactor — portal pages still work | Navigate to `/portal/overview`, `/portal/account`, `/portal/billing` as light user | All portal pages load correctly, light user routing unchanged | P1 | Yes |
| TC-043 | Middleware refactor — non-portal redirect still works | As light user, navigate to `/app/overview` | Redirected to `/portal/overview` (unchanged behavior) | P1 | Yes |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Email validation — empty | Clear email field, submit | Validation error: "Email is required" | P1 | Yes |
| TC-051 | Email validation — invalid format | Enter "not-an-email", submit | Validation error: "Must be a valid email" | P1 | Yes |
| TC-052 | Email validation — same email as current | Change email to exact same value, save | No verification triggered — treated as non-email-change (success toast only) OR email field not counted as changed | P2 | Yes |
| TC-053 | Cancel editing — email change discarded | 1. Click "Edit details" 2. Change email 3. Click "Cancel" | Email reverts to original value, no verification sent | P1 | Yes |
| TC-054 | Dismiss confirmation dialog | After email change, click outside dialog or press Escape | Dialog closes. Email field shows old email (reverted). No page navigation. | P2 | Yes |
| TC-055 | Double email change — second before first confirmed | 1. Initiate email change to email-A 2. Before confirming, change email to email-B | New verification sent for email-B. Previous verification for email-A should be invalidated by Supabase | P2 | No (exploratory) |
| TC-056 | Change email to already-registered email | Enter email that belongs to another Supabase user | Supabase should reject — error toast shown | P2 | No (exploratory) |
| TC-057 | Confirmation email sent to BOTH old and new addresses | Initiate email change, check both inboxes | Confirmation email arrives at both old AND new email — this is expected Supabase behavior (security feature, team confirmed keeping it) | P2 | Yes (Fastmail) |
| TC-058 | Email field disabled while saving | Click Save while email change is processing | Email field and form should be disabled (`isUpdatingAccount` state) | P2 | Yes |
| TC-059 | Profile update fails — email change not triggered | Simulate Light API profile PATCH failure for non-email fields | Error toast shown, email verification NOT triggered (email update only fires after profile update succeeds) | P2 | No (exploratory) |

### Negative Tests

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Unauthenticated access to /portal/account | Navigate to `/portal/account` without session | Redirected to sign-in | P1 | Yes |
| TC-061 | Cottage user cannot access /portal/account | Log in as CottageUser, navigate to `/portal/account` | Redirected away (middleware redirect) | P2 | Yes |
| TC-062 | Direct access to /api/light/profile/sync-email without auth | PATCH `/api/light/profile/sync-email` without session | 401 Unauthorized | P2 | No (API test) |
| TC-063 | Old email cannot sign in after confirmation | After confirming email change, try signing in with OLD email | Login fails or redirects appropriately | P1 | Yes |

### Cross-Browser

| ID | Title | Browser | Scope | Priority | Automate? |
|----|-------|---------|-------|----------|-----------|
| TC-070 | Edit form renders correctly | Chrome | Form, validation, dialog | P1 | Yes (Chromium project) |
| TC-071 | Edit form renders correctly | Safari | Form, validation, dialog | P1 | Yes (Safari project) |
| TC-072 | Edit form renders correctly | Firefox | Form, validation, dialog | P1 | Yes (Firefox project) |
| TC-073 | Edit form renders correctly | Mobile Safari | Form, validation, dialog | P1 | Yes (Mobile Safari project) |
| TC-074 | Confirmation link redirect | Safari | Open link — active session redirect | P2 | Yes (Safari project) |
| TC-075 | Confirmation link redirect | Firefox | Open link — no session redirect | P2 | Yes (Firefox project) |
| TC-076 | Toast notification | Mobile Safari | Success/warning toast display | P2 | Yes (Mobile Safari project) |
| TC-077 | Sign-in orange banner | Chrome, Safari, Firefox, Mobile Safari | `emailUpdated=true` banner | P2 | Yes (multi-project) |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-080 | Auth email updated after confirmation | `SELECT email FROM auth.users WHERE id = '<user_id>'` | Email matches new email | P0 |
| TC-081 | LightUsers email updated after sync | `SELECT email FROM "LightUsers" WHERE id = '<user_id>'` | All rows show new email | P0 |
| TC-082 | Multi-account — all rows updated | `SELECT "lightDevID", email FROM "LightUsers" WHERE id = '<user_id>'` | Every `lightDevID` row has the new email | P0 |
| TC-083 | DB trigger status | Check if `light_email_update_on_email_auth` trigger exists | Verify: is sync API-only (intentional) or is a migration missing? | P1 |
| TC-084 | CottageUsers email unaffected | `SELECT email FROM "CottageUsers" LIMIT 5` after light user email change | CottageUsers emails unchanged | P2 |

### Regression: Dev Test Bugs (from ticket comments)

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-090 | Email NOT updated prematurely | 1. Change email 2. Before clicking verification link, check `/portal/account` | Email still shows OLD value until verification + sync completes | P0 |
| TC-091 | Portal account shows updated email after sync | 1. Change email 2. Confirm via verification link 3. After redirect, check `/portal/account` | Email field shows NEW email (was reported as bug: "email not updated on portal but updated in Supabase") | P0 |
| TC-092 | Redirect path after confirmation is correct | Click verification link with active session | Redirects through `/email-confirmation` → `/session-init` → `/portal/account?emailUpdated=true` (NOT just `/portal/overview`) | P0 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Confirmation dialog | Dialog has `hideCloseButton={true}` but user can still dismiss by pressing Escape or clicking overlay. The "Okay" button is the only explicit CTA. | Minor confusion — user may wonder if closing the dialog cancels the change | Add brief text: "You can close this dialog — the verification email has already been sent" |
| UX-002 | Email revert on submit | When email change is submitted, the email field immediately reverts to old email (`form.setValue('email', profile.email)`) | Could confuse users — they just typed a new email and it disappeared | Show old email grayed out with "(pending verification)" label, or keep new email with a "pending" badge |
| UX-003 | Verification link — slow redirect | Comment: "takes a while before redirects to portal/overview" when using totally different email | User staring at blank/loading email-confirmation page | Add loading spinner or "Verifying your email..." message on `/email-confirmation` |
| UX-004 | Dual confirmation emails | Supabase sends verification to BOTH old and new email addresses | Old email recipient may be confused ("I didn't request this") | Consider adding explanatory text in the confirmation dialog: "You'll receive verification emails at both your old and new addresses" |
| UX-005 | Sign-in banner after email change (no session) | Orange banner says "Please sign in with your new email address" but doesn't pre-fill the email field | User has to remember/type the new email | Pre-fill email field from the `emailUpdated` context or add the new email in the banner text |
| UX-006 | Error toast on failure | Warning toast says "Something went wrong updating your email" — generic | Doesn't help user know what to do next | Add: "Please try again or contact support" with support link |

## Automation Plan

### Smoke (P0 — 5 cases)
- TC-001 (initiate change), TC-003 (confirm with session), TC-004 (success toast), TC-040 (middleware /email-confirmation), TC-041 (middleware /session-init)

### Regression1 (P1 — 15 cases)
- TC-002, TC-005, TC-006, TC-007, TC-008, TC-010, TC-011, TC-013, TC-021, TC-023, TC-042, TC-043, TC-050, TC-051, TC-053

### Regression2–5 (Cross-browser — 8 cases)
- TC-070 through TC-077 distributed across browser projects

### Exploratory Only (8 cases)
- TC-020 (network inspection), TC-022 (sync failure), TC-031 (partial sync), TC-055 (double change), TC-056 (duplicate email), TC-059 (profile failure), TC-083 (DB trigger verification)

### Test Infrastructure Needed
- **New POM**: `LightAccountPage` — `/portal/account` (edit form, email field, confirmation dialog, toasts)
- **New POM**: `EmailConfirmationPage` — `/email-confirmation` (error state, back button)
- **Fixture**: Light user auth helper (login as light user, manage light session)
- **Fixture**: Email verification helper (Fastmail JMAP — fetch verification link from email)
- **Test data**: Light user with multiple `lightDevID` entries for AC6

## Risks & Notes

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Missing DB trigger** — `light_email_update_on_email_auth` not in dev | Medium | Verify with dev if API-only sync is intentional. If trigger was supposed to exist, file bug. |
| **Light API dependency** — sync-email calls external Light API | Medium | Tests may flake if Light API is down. Consider mock/stub for automated tests. |
| **Supabase email delivery** — verification emails may be delayed | Low | Use Fastmail JMAP polling with retry. |
| **Session expiry during flow** — user takes too long between steps | Low | Test with near-expired session if possible. |
| **CottageUser regression** — `/email-confirmation` page changed to add light user logic | Medium | TC-012 and TC-023 verify cottage user path is unaffected. |
| **session-init rewrite** — major changes to session initialization | High | TC-023 + TC-042/043 verify no regression for both user types. Middleware refactor (AC7) affects ALL light user page loads. |
| **Confirmation email to both addresses** — Supabase security feature | Info | Team confirmed keeping this (Cian + Anton in comments). Document as expected behavior. |
