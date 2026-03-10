# Test Plan: ENG-2340 — Email Co-location into Services Repo

## Overview
**Ticket**: [ENG-2340](https://linear.app/public-grid/issue/ENG-2340/task-email-co-location-into-services-repo)
**Source**: Linear ticket + Services PR #272 (merged) + Services PR #259 (merged) + cottage-nextjs PR #1081 (open)
**Date**: 2026-03-10
**Tester**: Christian

## Context
Transactional email templates are being migrated from `cottage-nextjs/packages/transactional/` to `services/packages/mail/`. The cottage-nextjs side switches from direct template imports (`@public-grid/transactional/*`) to a factory pattern (`createTemplates()` from `@cottage-energy/mail@1.0.0-dev.42`). 13 email templates are affected.

### Key Code Changes
- **Old pattern**: `import TEMPLATE from '@public-grid/transactional/template-name'` → `TEMPLATE(args)`
- **New pattern**: `import { createTemplates } from '@cottage-energy/mail'` → `const templates = createTemplates({ frontendUrl })` → `templates.templateName({ data: {...} })`
- Some template prop interfaces changed (see Risk Notes below)
- Fallback text templates replaced with inline strings
- `packages/transactional/` directory deleted entirely from cottage-nextjs

## Scope

### In Scope
- Email delivery verification for all 13 migrated templates
- Email content verification (subject line, key body content, CTA links)
- Flows that trigger these emails end-to-end
- Regression of existing move-in, bill upload, and payment email checks

### Out of Scope
- Template visual/rendering correctness (unit/visual test — dev-owned in services repo)
- Inngest function internals (unit test — dev-owned)
- Email templates that were already in services (ledger billing emails: bill ready, payment confirmation, failed payment, update payment method)
- Email deliverability/spam scoring

### Prerequisites
- cottage-nextjs PR #1081 merged and deployed to dev environment
- Services PR #272 already merged (2026-03-10)
- `NEXT_PUBLIC_BASE_URL` env var correctly set in dev
- Fastmail API key available (`FASTMAIL_API_KEY`)
- Test user emails routed to `pgtest+*@joinpublicgrid.com` via Fastmail

### Dependencies
- Inngest service running and processing events
- Resend email delivery service operational
- Supabase database accessible for test data setup/teardown

## Templates & Trigger Mapping

| # | Template | Subject Line | Trigger Flow | Inngest Function | From Address |
|---|----------|-------------|-------------|-----------------|-------------|
| 1 | `moveInTemplate` | "Your utility account is on the way!" | Move-in registration (move-in type) | `onboardingFlow` | welcome@onepublicgrid.com |
| 2 | `startServiceEmail` | "Your utility account is on the way!" | Start service registration (non-move-in) | `onboardingFlow` / `testEmail` | welcome@onepublicgrid.com |
| 3 | `educationalEmail` | "Welcome to Public Grid: Let's Get Started!" | Post-registration (delayed ~2 days) | `onboardingFlow` | welcome@onepublicgrid.com |
| 4 | `nonBillingWelcomeEmail` | (TBD — verify subject) | Non-billing account registration | `testEmail` | welcome@onepublicgrid.com |
| 5 | `paymentSetupReminder` | "Quick reminder: Add your payment method" | Post-registration (delayed ~5 days) | `onboardingFlow` | welcome@onepublicgrid.com |
| 6 | `paymentSetupPending` | (TBD — verify subject) | Payment setup pending state | `onboardingFlow` / `testEmail` | welcome@onepublicgrid.com |
| 7 | `billUploadConfirmation` | (varies by type — "bill" or "document") | Bill upload flow completion | `billUploadConfirmation` | welcome@onepublicgrid.com |
| 8 | `completeUtilityVerification` | "Complete your utility verification" / "Reminder: ..." | Do-it-later utility verification | `startDoItLaterEmailChain` / `sendDoItLaterReminder` | welcome@onepublicgrid.com |
| 9 | `docUploadTemplate` | "Document Upload Required" | Registration requiring doc upload | `registration` | welcome@onepublicgrid.com |
| 10 | `householdInvitation` | "{ownerName} has invited you to view..." | Household member invitation | `householdInvitation` | welcome@onepublicgrid.com |
| 11 | `householdInvitationStatus` | "{name} {status} your invitation..." | Invite accepted/declined | `householdStatusUpdate` | welcome@onepublicgrid.com |
| 12 | `cancelAccount` | "Your Start Service Request...Has Been Cancelled" | Account cancellation | `cancelAccount` | welcome@onepublicgrid.com |
| 13 | `otpEmailNotFoundTemplate` | "No Account Found" | OTP attempt with unknown email | `otpEmailNotFound` | (TBD — verify) |

## Existing Coverage Map

| Template | Existing Fastmail Check | Existing Test Spec | Gap |
|----------|------------------------|-------------------|-----|
| `moveInTemplate` | `Check_Utility_Account_OTW` | move-in specs | **Covered** — verify still passes post-migration |
| `startServiceEmail` | `Check_Utility_Account_OTW` | move-in specs | **Covered** — verify still passes |
| `educationalEmail` | `Check_Welcome_to_PG_Lets_Get_Started` | move-in specs | **Partial** — soft failure, no hard assert |
| `paymentSetupReminder` | `Check_Quick_Reminder_Add_Your_Payment_Method` | move-in specs | **Partial** — only checked in some flows |
| `billUploadConfirmation` | None | bill upload specs | **GAP** — flow tested, email not verified |
| `completeUtilityVerification` | None | None | **GAP** — no coverage |
| `docUploadTemplate` | None | None | **GAP** — no coverage |
| `nonBillingWelcomeEmail` | None | None | **GAP** — no coverage |
| `paymentSetupPending` | None | None | **GAP** — no coverage |
| `householdInvitation` | None | None | **GAP** — no coverage |
| `householdInvitationStatus` | None | None | **GAP** — no coverage |
| `cancelAccount` | None | None | **GAP** — no coverage |
| `otpEmailNotFoundTemplate` | None | None | **GAP** — no coverage |

## Test Cases

### P0 — Smoke: Regression of Existing Email Checks

These verify that templates already covered by existing tests still work post-migration. **Run these first.**

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Move-in email still delivered post-migration | 1. Run existing move-in smoke test (`move_in_new_service_zip_user.spec.ts`) 2. Observe `Check_Utility_Account_OTW` assertion | Email received with correct subject "Your utility account is on the way!" and utility company name in body | P0 | Already automated — re-run |
| TC-002 | Educational email still delivered post-migration | 1. Run existing move-in test that checks educational email 2. Observe `Check_Welcome_to_PG_Lets_Get_Started` | Email received with subject "Welcome to Public Grid: Let's Get Started!" | P0 | Already automated — re-run |
| TC-003 | Payment setup reminder still delivered post-migration | 1. Run existing move-in test that triggers payment reminder 2. Observe `Check_Quick_Reminder_Add_Your_Payment_Method` | Email received with subject "Quick reminder: Add your payment method" | P0 | Already automated — re-run |
| TC-004 | OTP email still works (not migrated but verify no regression) | 1. Run any move-in flow that does OTP login 2. Observe `Get_OTP` | OTP email received and code extracted successfully | P0 | Already automated — re-run |

### P1 — Critical: New Email Delivery Verification

These verify templates that have **no existing Fastmail coverage**. Must be tested manually/exploratory first, then automated.

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Bill upload confirmation email delivered | 1. Complete bill upload flow for Con Edison (existing test) 2. After upload success, check Fastmail for confirmation email to test user | Email received from welcome@onepublicgrid.com with bill upload confirmation content | P1 | Yes — add Fastmail check to `savings_flow_base.spec.ts` |
| TC-011 | Complete utility verification email delivered | 1. Register a new user who selects "do it later" for utility verification 2. Wait for Inngest to fire the email chain 3. Check Fastmail for verification email | Email received with subject "Complete your utility verification" containing provider name and first name | P1 | Yes — new spec or add to existing flow |
| TC-012 | Document upload required email delivered | 1. Register a user in a market that requires doc upload (non-integrated utility) 2. Check Fastmail for doc upload email | Email received with subject "Document Upload Required" containing utility company name | P1 | Yes |
| TC-013 | Cancel account email delivered | 1. Create a test user with active start-service request 2. Cancel the account via API/UI 3. Check Fastmail for cancellation email | Email received with subject containing "Cancelled" and service date in body | P1 | Yes |
| TC-014 | OTP email not found sends correctly | 1. Attempt OTP login with an email that has no account 2. Check Fastmail for "No Account Found" email | Email received with subject "No Account Found" | P1 | Yes |
| TC-015 | Household invitation email delivered | 1. Create a test user with a property 2. Send household invitation to a test email 3. Check Fastmail for invitation email | Email received with subject containing owner name and property address, with invite code in body | P1 | Yes |
| TC-016 | Household invitation status email delivered | 1. Accept/decline a household invitation 2. Check Fastmail for status update to property owner | Email received with subject containing resident name and status (accepted/declined) | P1 | Yes |

### P2 — Normal: Content & Link Verification

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Move-in email CTA links point to correct URL | 1. Trigger move-in email 2. Parse HTML body from Fastmail 3. Check all `<a>` href values | All CTA links use the correct `frontendUrl` base (not localhost, not broken) | P2 | Yes |
| TC-021 | Educational email contains correct user data | 1. Trigger educational email for user with known first name and utility 2. Parse email body | Email body contains user's first name and utility company name | P2 | Yes |
| TC-022 | Payment setup reminder contains first name | 1. Trigger payment setup reminder 2. Parse email body | Email body contains user's first name (prop interface changed — was `registrationData`, now `{ firstName }`) | P2 | Yes |
| TC-023 | Bill upload confirmation varies by type | 1. Upload a bill (type = "bill") 2. Upload a document (type = "document") 3. Check email subject/content for each | Subject and body content differ based on upload type | P2 | Yes |
| TC-024 | Household invitation email contains invite code link | 1. Trigger household invitation 2. Parse email body | Email contains clickable link with correct invite code parameter | P2 | Yes |

### P3 — Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Email with missing first name falls back gracefully | 1. Trigger complete-utility-verification email for user with no first name 2. Check email body | Email body uses "there" as fallback (per code: `firstName || 'there'`) | P3 | No — exploratory |
| TC-031 | Doc upload fallback text email sends when React render fails | 1. Simulate React email render failure (would need error injection) 2. Verify text fallback is sent | Plain text email sent with correct user name and utility company | P3 | No — exploratory |
| TC-032 | Cancel account email shows formatted date | 1. Cancel account with a future service date 2. Check email body | Date formatted as "dddd, MMMM D, YYYY" (e.g., "Monday, March 15, 2026") | P3 | No — exploratory |
| TC-033 | Multiple household invitations don't duplicate emails | 1. Send invitation to same email twice 2. Check Fastmail | Two separate invitation emails received (not duplicated/lost) | P3 | No — exploratory |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-040 | Inngest events fire for migrated email types | Check Inngest dashboard or logs for `email.send` events post-migration | Events are being routed through the new `send_email` Inngest function in services | P1 |
| TC-041 | No orphaned email references in cottage-nextjs | After PR #1081 merge, verify no remaining imports of `@public-grid/transactional` | Zero references to the old package | P1 |

## Automation Plan

### Immediate (run existing tests to verify regression)
- **Smoke**: TC-001 through TC-004 — run existing move-in + payment test suite
- **Scope**: `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/cottage-user-move-in/ --project=Chromium`

### Short-term (add Fastmail checks to existing flows)
- TC-010: Add `billUploadConfirmation` email check to `savings_flow_base.spec.ts`
- TC-020–TC-022: Add content assertions to existing Fastmail helper functions

### Medium-term (new test specs needed)
- TC-011–TC-016: New spec `tests/e2e_tests/email-verification/email_delivery_post_migration.spec.ts`
- Would need new Fastmail helper functions for each email type
- Tag with `@regression1` scope

### Manual/Exploratory
- TC-030–TC-033: Explore during `/exploratory-test` session
- TC-040–TC-041: One-time verification checks

## Risk Notes

1. **Prop interface changes** — Several templates changed their prop signatures:
   - `billUploadConfirmation`: dropped `firstName` parameter → verify email still renders without it
   - `paymentSetupReminder`: changed from `{ data: registrationData }` to `{ data: { firstName } }` → verify only firstName is needed
   - `householdInvitation`: changed from positional args `(inviteCode, address, ownerName)` to object `{ data: { inviteCode, propertyAddress, ownerName } }` → verify all fields still map correctly
   - `householdInvitationStatus`: changed from positional args to object with renamed fields (`ownerName` → `ownerFirstName`) → verify field mapping
2. **Pre-release package version** — cottage-nextjs uses `@cottage-energy/mail@1.0.0-dev.42` — if this version is pulled or updated, imports may break
3. **Frontend URL dependency** — All templates use `createTemplates({ frontendUrl: process.env.NEXT_PUBLIC_BASE_URL ?? '' })` — if env var is empty, CTA links will be broken (empty string base URL)
4. **Fallback text changes** — `otpEmailNotFound` and `registration` (doc upload) had separate fallback template files; now use inline strings. Content may differ slightly.
5. **Deployment ordering** — Services PR #272 is already merged but cottage-nextjs PR #1081 is still open. Until #1081 is deployed, the old templates are still in use. After #1081 deploys, the new `@cottage-energy/mail` package takes over. **Test timing matters.**

## Test Execution Order

1. **Pre-merge (now)**: Run TC-001–TC-004 smoke tests against dev to confirm current baseline
2. **Post-merge of PR #1081**: Re-run TC-001–TC-004 immediately to catch regressions
3. **Post-merge**: Execute TC-010–TC-016 (manual/exploratory first via `/exploratory-test`)
4. **Post-verification**: Automate TC-010–TC-016 as permanent regression tests
5. **Ongoing**: TC-020–TC-024 content checks added to regression suite

## Next Steps
- `/run-tests` — Run existing move-in smoke suite to establish baseline (TC-001–TC-004)
- `/exploratory-test` — Interactive session to verify TC-010–TC-016 after PR #1081 merges
- `/new-test` — Scaffold `email_delivery_post_migration.spec.ts` for new email checks
- `/log-bug` — If any email delivery fails post-migration
