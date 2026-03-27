# Test Plan: Bill Upload Confirmation Email

## Overview
**Ticket**: ENG-2398
**PR**: cottage-nextjs #1135 (merged 2026-03-25)
**Related**: ENG-2438 (email co-location — set up Inngest function infrastructure)
**Source**: Linear ticket, PR diff, API route source, `use-bill-upload.ts`, `inngest-functions.md`
**Date**: 2026-03-25
**Tester**: Christian

## Bug Description
After successfully uploading a bill via the Bill Upload or Verify Utilities flow, users did not receive a confirmation email. Users only received emails when verification was approved or failed. The fix adds a `POST /api/bill-upload/send-confirmation-email` call that triggers the FE Inngest function `bill-upload/confirmation`.

## Scope

### In Scope
- New user bill upload flow (`/bill-upload/upload`) — confirmation email with type `join-public-grid`
- Authenticated user bill upload (in-app via `useBillUpload` hook) — confirmation email with dynamic type
- Email type logic: `join-public-grid` vs `verify-only` based on account status
- API route validation (`/api/bill-upload/send-confirmation-email`)
- Fire-and-forget behavior — upload succeeds regardless of email send outcome
- Email delivery verification via Fastmail JMAP

### Out of Scope
- Email template styling/layout (covered by ENG-2438)
- OTP verification modal flow (existing, unchanged)
- Bill processing/scanning logic (unchanged)
- Verify utilities approval/failure emails (existing, unchanged)

### Prerequisites
- **Environment**: dev (`https://dev.publicgrid.energy`)
- **Utility**: Con Edison (zip `12249`) — `isBillUploadAvailable=TRUE`
- **Test email domain**: `pgtest+*@joinpublicgrid.com` (Fastmail-monitored)
- **Test file**: `PGLogo002.jpg` (in `tests/resources/data/`)
- **Inngest**: FE Inngest function `bill-upload/confirmation` must be deployed to dev
- **Note**: `bill-upload/confirmation` is a FE Inngest function on the `public-grid` app — cannot be triggered via `INNGEST_EVENT_KEY`, must test via actual e2e flows

### Dependencies
- Fastmail JMAP API for email verification
- Supabase for account status verification
- Inngest (FE `public-grid` app) for email dispatch

## Email Type Logic Reference

The `getEmailType()` function in `use-bill-upload.ts` determines the email type:

| Pre-upload Account Status | Post-upload Status | Email Type |
|--------------------------|-------------------|------------|
| `ELIGIBLE` | `REVIEW_UPLOAD_BILL` | `join-public-grid` |
| `ISSUE_UPLOAD_BILL` | `REVIEW_UPLOAD_BILL` | `join-public-grid` |
| `ISSUE_VERIFICATION` | `REVIEW_VERIFICATION` | `verify-only` |
| `NEED_VERIFICATION` | `REVIEW_VERIFICATION` | `verify-only` |
| `RESIDENT_SETS_UP` | `REVIEW_VERIFICATION` | `verify-only` |
| `VERIFICATION_INCOMPLETE` | `REVIEW_VERIFICATION` | `verify-only` |
| `WAITING_FOR_DOCS` | `PENDING_FIRST_BILL` | `verify-only` |

**New user flow** (`page.tsx`): Always sends `join-public-grid` (hardcoded).

## Trigger Points

| Trigger | File | Email Type | Auth Context |
|---------|------|-----------|-------------|
| New user registration + upload | `bill-upload/upload/page.tsx` | Always `join-public-grid` | `result.session` from registration response |
| Authenticated user upload (in-app) | `components/bill-upload/use-bill-upload.ts` | Dynamic via `getEmailType()` | `supabase.auth.getSession()` |

## Test Cases

### Happy Path — New User Bill Upload

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | New user uploads bill via `/bill-upload` and receives confirmation email | 1. Navigate to `/bill-upload/connect-account` 2. Enter zip `12249`, select Con Edison 3. Click Check Availability 4. Enter new test email, upload `PGLogo002.jpg` 5. Click Upload Bill 6. Wait for scanning → success 7. Check Fastmail for confirmation email | User receives confirmation email with type `join-public-grid` within ~60s of upload success | P0 | Yes |
| TC-002 | New user bill upload with PDF file receives confirmation email | 1. Same as TC-001 but upload `PGsample.pdf` instead | Confirmation email received regardless of file format | P1 | Yes |
| TC-003 | New user bill upload via partner shortcode receives confirmation email | 1. Navigate to `/bill-upload/connect-account?partner=autotest` 2. Enter zip `12249`, select Con Edison 3. Complete upload flow 4. Check Fastmail | Confirmation email received; partner context does not block email | P1 | No |

### Happy Path — Authenticated User Bill Upload

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-004 | Authenticated user with `ELIGIBLE` status uploads bill → `join-public-grid` email | 1. Create test user with `ElectricAccount.status = ELIGIBLE` 2. Sign in 3. Upload bill via in-app upload 4. Check Fastmail for confirmation email | Email received with type `join-public-grid` (status transitions to `REVIEW_UPLOAD_BILL`) | P0 | Yes |
| TC-005 | Authenticated user with `ISSUE_UPLOAD_BILL` status uploads bill → `join-public-grid` email | 1. Create test user with `ElectricAccount.status = ISSUE_UPLOAD_BILL` 2. Sign in 3. Upload bill via in-app upload 4. Check Fastmail | Email received with type `join-public-grid` | P1 | No |
| TC-006 | Authenticated user with `ISSUE_VERIFICATION` status uploads bill → `verify-only` email | 1. Create test user with `ElectricAccount.status = ISSUE_VERIFICATION` 2. Sign in 3. Upload bill via in-app upload 4. Check Fastmail | Email received with type `verify-only` (status transitions to `REVIEW_VERIFICATION`) | P1 | No |
| TC-007 | Authenticated user with `NEED_VERIFICATION` status uploads bill → `verify-only` email | 1. Set test user status to `NEED_VERIFICATION` 2. Sign in, upload bill 3. Check Fastmail | Email received with type `verify-only` | P2 | No |
| TC-008 | Authenticated user with `RESIDENT_SETS_UP` status uploads bill → `verify-only` email | 1. Set test user status to `RESIDENT_SETS_UP` 2. Sign in, upload bill 3. Check Fastmail | Email received with type `verify-only` | P2 | No |

### Happy Path — Existing User via OTP (page.tsx path)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-009 | Existing user enters email on `/bill-upload/upload`, verifies OTP, uploads bill | 1. Navigate to `/bill-upload/connect-account` 2. Enter zip `12249`, select Con Edison 3. Enter existing user email 4. OTP modal appears → verify OTP 5. Bill uploads (if status is `ISSUE_UPLOAD_BILL`) 6. Check Fastmail | Confirmation email received after successful upload via OTP path | P1 | No |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Upload succeeds but no session available (authenticated path) | 1. Create scenario where `supabase.auth.getSession()` returns null session 2. Upload bill | Upload succeeds (shows success), NO email sent (guard: `if (sessionData.session && user.email)`) | P1 | No |
| TC-011 | Upload succeeds but no session in registration response (page.tsx path) | 1. Simulate registration returning no session 2. Upload bill | Upload succeeds, NO email sent (guard: `if (result.session)`) | P2 | No |
| TC-012 | Gas account status determines email type when electric has no status | 1. Create user with no electric account but `GasAccount.status = ELIGIBLE` 2. Upload bill | Email sent with type `join-public-grid` (gas status drives type) | P2 | No |
| TC-013 | Both electric and gas accounts — electric takes precedence for email type | 1. Create user with `ElectricAccount.status = ELIGIBLE`, `GasAccount.status = ISSUE_VERIFICATION` 2. Upload bill | Email type = `join-public-grid` (electric `REVIEW_UPLOAD_BILL` wins in `getEmailType` — checks electric first) | P2 | No |
| TC-014 | Rapid successive uploads — only one confirmation email per upload | 1. Complete bill upload 2. Quickly attempt another upload 3. Check Fastmail | Each successful upload sends exactly one confirmation email | P2 | No |

### Negative Tests

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-015 | Inngest failure does not break upload flow (authenticated path) | 1. Upload bill successfully 2. Inngest `bill-upload/confirmation` fails silently | Upload shows success; `.catch(() => {})` swallows error; no user-facing impact | P1 | No |
| TC-016 | API route rejects invalid email format | 1. POST to `/api/bill-upload/send-confirmation-email` with invalid email | Returns 400 with `Invalid request body` and field errors | P2 | No |
| TC-017 | API route rejects invalid email type | 1. POST with `type: "invalid"` instead of `join-public-grid` or `verify-only` | Returns 400 — zod validation rejects invalid enum | P2 | No |
| TC-018 | API route rejects missing session tokens | 1. POST without `session` object | Returns 400 — zod validation requires session | P2 | No |
| TC-019 | API route rejects invalid session (expired/revoked tokens) | 1. POST with expired/invalid access_token | Returns 400 with `Not a valid user` | P2 | No |
| TC-020 | File upload fails — no confirmation email sent | 1. Trigger file upload failure (e.g., server error) 2. Check Fastmail | No confirmation email sent — email call happens AFTER upload success | P1 | No |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-021 | ElectricAccount status updated correctly after bill upload | `SELECT status FROM "ElectricAccount" WHERE "cottageUserID" = '<id>'` | Status transitions per `getNewAccountStatus()` mapping (e.g., `ELIGIBLE` → `REVIEW_UPLOAD_BILL`) | P0 |
| TC-022 | New user created with correct `cottageConnectUserType` | `SELECT "cottageConnectUserType" FROM "CottageUser" WHERE email = '<email>'` | `BILL_UPLOAD` for users created via `/bill-upload` flow | P1 |
| TC-023 | Documents record created for uploaded file | `SELECT * FROM "Documents" WHERE "cottageUserID" = '<id>' ORDER BY "createdAt" DESC LIMIT 1` | Document record exists with correct user association | P1 |

### Email Content Verification

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-024 | `join-public-grid` email has correct subject and sender | 1. Complete TC-001 2. Inspect email via Fastmail JMAP | Subject and sender match expected template (per ENG-2438 reference) | P1 | Yes |
| TC-025 | `join-public-grid` email body contains expected content | 1. Complete TC-001 2. Parse email body | Body contains user-facing confirmation messaging, no broken template variables | P2 | No |
| TC-026 | `verify-only` email has correct subject and sender | 1. Complete TC-006 2. Inspect email via Fastmail JMAP | Subject differs from `join-public-grid` type; sender matches | P1 | No |
| TC-027 | `verify-only` email body contains expected content | 1. Complete TC-006 2. Parse email body | Body reflects verify-only context (not enrollment messaging) | P2 | No |

## Automation Plan

### Smoke Suite
- **TC-001**: New user bill upload → confirmation email received (core bug fix validation)

### Regression (Regression1)
- **TC-002**: PDF file format variant
- **TC-004**: Authenticated user `ELIGIBLE` status → email
- **TC-024**: Email subject/sender verification

### Exploratory Only
- TC-003, TC-005–TC-009: Status variant paths (test via Playwright MCP + Supabase data setup)
- TC-010–TC-014: Edge cases (require specific data/state manipulation)
- TC-015–TC-020: Negative tests (require API-level testing or failure simulation)
- TC-025–TC-027: Email body content (manual visual verification first, then automate subject/sender)

### Implementation Notes
- **Email verification**: Add `Check_Bill_Upload_Confirmation` to `fastmail_actions.ts` following existing pattern (retry loop with `RETRY_CONFIG.EMAIL_CONFIRMATION`)
- **Email subject** (discovered 2026-03-25): `Welcome to Public Grid! 🎉` from `Public Grid Team <welcome@onepublicgrid.com>`
- **Email delivery time**: ~50 seconds from upload success to Fastmail inbox
- **Existing tests**: The 4 tests in `savings_flow_base.spec.ts` should be enhanced to assert email receipt after upload success
- **New Fastmail helper**: Create reusable helper for `join-public-grid` email type. The `verify-only` type may not need a helper (see finding below)

## Exploratory Session Findings (2026-03-25)

### Results: 3/4 ACs PASS, 1 FAIL

| AC | Result | Evidence |
|----|--------|----------|
| New user bill upload → email | PASS | API returned 200, email received in ~50s, type `join-public-grid` |
| Authenticated user upload → email | PASS | `ISSUE_UPLOAD_BILL` user uploaded via overview → email received, type `join-public-grid` |
| Email content matches template | PASS | Logo, heading, bill confirmation, next steps, View Dashboard CTA, support info |
| Verify utilities flow → email | **FAIL** | `/verify-utilities/upload` has its own `page.tsx` that was NOT modified by PR #1135. No email sent. |

### Key Finding: Verify Utilities Flow Missing Email

The ticket says "bill upload flow/verify utilities" but only bill upload was fixed. The verify utilities flow at `/verify-utilities/connect-account` uses a **separate page component** at `apps/main/app/(bill-upload)/verify-utilities/upload/page.tsx` that does NOT contain the `send-confirmation-email` call.

**Evidence**:
- Ran full verify utilities flow with `pgtest+verifyutil+email2398b@joinpublicgrid.com`
- User created with `cottageConnectUserType: ACCOUNT_VERIFICATION`, status: `REVIEW_UPLOAD_BILL`
- Grep of verify-utilities `page.tsx` — no match for `send-confirmation-email`
- Fastmail: 0 emails received after 50s wait

**Impact**: Verify utilities users do NOT receive a confirmation email after uploading their bill. The `verify-only` email type code in `getEmailType()` is reachable via the `useBillUpload` hook (authenticated in-app upload) but NOT via the verify-utilities onboarding flow.

**Recommendation**: The same `send-confirmation-email` fetch call needs to be added to `apps/main/app/(bill-upload)/verify-utilities/upload/page.tsx` with type `verify-only`.

### Additional Finding: Overview Re-upload Also Missing Email

The overview "Upload new document" button for `ISSUE_VERIFICATION` users uses yet another upload component that also does NOT send confirmation emails. This is a separate code path from both `page.tsx` files and the `useBillUpload` hook.

## Risks & Notes
- **FE Inngest timing**: FE Inngest functions may have variable processing time. Email verification retries (5 attempts × 15s = 75s max wait) should be sufficient but may need tuning
- **Verify utilities spec is empty**: `tests/e2e_tests/bill-upload/verify_utilities/verify-utilities.spec.ts` exists but is blank — no automated tests for this flow
- **Fire-and-forget risk**: Since email send errors are silently caught, a broken Inngest function or API route could fail silently in production with no monitoring
- **`page.tsx` path has no `.catch()`**: Unlike `use-bill-upload.ts` which has `.catch(() => {})`, the `page.tsx` email fetch has no error handler

## Next Steps
1. Flag verify-utilities gap to dev (Anton) — needs same `send-confirmation-email` call in verify-utilities `page.tsx`
2. `/new-test` — Add `Check_Bill_Upload_Confirmation` to `fastmail_actions.ts` and enhance bill upload tests with email assertions
3. Once verify-utilities fix is deployed, retest that flow
