# Test Plan: Connect Account UI/Code Polishing

## Overview
**Ticket**: ENG-2402
**Source**: [Linear ENG-2402](https://linear.app/public-grid/issue/ENG-2402/task-connect-account-uicode-polishing) | [PR #1088](https://github.com/Cottage-Energy/cottage-nextjs/pull/1088) (merged)
**Date**: 2026-03-13
**Tester**: Christian

## Context
PR #1088 "Refactor/connect overview changes" (886 additions, 748 deletions, 20 files) is a UI polish + code cleanup pass on the Connect Account feature. Changes touch: connect registration form, connect utility modal (form/connecting/MFA/success/error views), bill upload modal (idle/uploading/ready/success/error views), auto-apply savings card, and setup tracker steps. The PR was merged to `dev`.

### Related Tickets (all in Testing/QA except ENG-2372)
- **ENG-2365**: Connect Onboarding Registration Flow — `/connect` page, account creation, post-registration DB state, password reset mandate, renewable energy card visibility
- **ENG-2363**: Reusable Connect Utility Modal Component — 5 modal states (form/connecting/MFA/error/success), Trigger.dev real-time run, cancel mid-flow, MFA wait-token
- **ENG-2370**: Overview Page Eligible Electric Account Status View Updates — auto-apply rendering logic (`isConnectAccount + ELIGIBLE + !isBillingCustomer + !hasBills`), non-connect ELIGIBLE user path, post-link transition
- **ENG-2371**: Trigger Task - Utility Account Credential Validation — Exelon provider support (ComEd/PECO/BGE/Pepco/Delmarva/ACE), MFA 5-min timeout, per-user rate limiting, credential save logic
- **ENG-2372**: Connect Account Save Credentials Endpoint (Ready in Dev) — `/connect-account` + `/upsert-credentials` endpoints, `password`/`retainEmail` params, account activation

### Existing Coverage
- Existing test plan: `tests/test_plans/qa-test-cases-connect-overview.md` (23 sections, full-stack)
- Existing tests: `tests/e2e_tests/connect-account/bill-upload-savings-flow/savings_flow_base.spec.ts`
- Existing POM: `tests/resources/page_objects/bill_upload_page.ts`

---

## Scope

### In Scope
- All UI changes introduced in PR #1088
- Connect registration form (`/connect`) — layout/text changes, success toast
- Connect utility modal — form view, connecting view, MFA view, success view, error view
- Bill upload modal — idle view, uploading view, ready view, success view, error→idle consolidation
- Auto-apply savings card — button size/text changes, modal cross-switching
- Setup tracker — Step 2 connect account text, upload-bill-error styling
- New icons (thumbs-up, alert-success, alert-error)
- Locator impact on existing automated tests

### Out of Scope
- Overview right sidebar (explicitly excluded per ticket)
- Backend task layer / services layer (no backend changes in this PR)
- Database changes (none in this PR)
- Credential validation flow end-to-end (covered in existing test plan)

### Prerequisites
- `dev` environment with PR #1088 merged and deployed
- Test user accounts:
  - Bill upload user with `ELIGIBLE` status (for auto-apply savings card)
  - Bill upload user with `ISSUE_UPLOAD_BILL` status (for upload-bill-error tracker)
  - Connect account user with `isConnectAccount = true` (for Step 2 text)
  - Standard billing customer (for regression)
- Connect-ready utility provider (for connect utility modal)

### Dependencies
- Figma designs at node 4533:10867 (couldn't access via MCP — verify visually against live app)
- BLNK/ChargeAccount service availability (for connect credential validation flows)

---

## Test Cases

### 1. Connect Registration Form (`/connect`)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Page heading text and styling | Navigate to `/connect` | Heading reads "Find savings on your energy bill" with subtext "We scan for better rates and alert you when we find one. Takes 30 seconds." | P1 | Yes |
| TC-002 | Bill-savings image renders | Navigate to `/connect` | Energy bill savings image renders above the heading (120x120) | P2 | Yes |
| TC-003 | Form fields render correctly | Navigate to `/connect` | Address autocomplete, email (with mail icon), first name, and last name inputs all visible. No redundant labels on email field. | P1 | Yes |
| TC-004 | Submit button text and state | Load form without filling fields | Button reads "Get started" with chevron-right icon. Disabled when required fields are empty. | P1 | Yes |
| TC-005 | Submit button processing state | Fill valid data and submit | Button changes to "Creating account..." with processing indicator while submitting | P2 | No |
| TC-006 | Success toast on account creation | Complete valid registration | Toast appears with variant="success", title "Account created!", description "Redirecting you to your dashboard". User redirected to `/app/overview`. | P1 | Yes |
| TC-007 | Legal links at bottom | Navigate to `/connect` | "Letter of Authorization" and "Terms" links visible below submit button, open in new tabs | P2 | Yes |
| TC-008 | Utility company field hidden for LIGHT/TX-DEREG | Enter address in LIGHT/TX-DEREG area | Utility company selector does not appear | P1 | Yes |
| TC-009 | Max-width constraint | Inspect form container | Form constrained to `max-w-[25rem]`, heading area to `max-w-[21.25rem]` | P3 | No |

### 2. Connect Utility Modal — Form View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Modal title | Open connect utility modal from tracker or auto-apply card | Title reads "Connect your account" | P1 | Yes |
| TC-011 | Provider card styling | Open modal | Provider card has `bg-brown-50` background with ThumbsUpFeatured icon (not PurpleElectricity). Provider name in bold. | P1 | Yes |
| TC-012 | Provider card description | Open modal | Shows "Enter your {providerName} login details" | P1 | Yes |
| TC-013 | Email input has no label prop | Open modal | Email input has placeholder "Email" but no separate label element above it | P2 | No |
| TC-014 | Credential security notice | Open modal | Lock icon with "Credentials are protected and never stored" text visible | P1 | Yes |
| TC-015 | Button layout | Open modal | Cancel and Connect buttons side-by-side with equal flex width, separated by DividerBeads | P1 | Yes |
| TC-016 | "Upload bill" alternative link | Open modal for connect-ready provider | "No {providerName} account? Upload bill" link visible below buttons | P1 | Yes |
| TC-017 | "Upload bill" switches to bill upload modal | Click "Upload bill" link in form view | Connect modal closes, bill upload modal opens | P0 | Yes |
| TC-018 | Modal max-width constraint | Open modal | Modal constrained to `max-w-[25rem]` | P3 | No |

### 3. Connect Utility Modal — Connecting View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-019 | Connecting view icon | Submit valid credentials, observe connecting state | ThumbsUpFeatured icon displayed (not Plug icon) | P2 | No |
| TC-020 | Connecting heading and subtext | Observe connecting state | "Connecting your account" heading with "This usually takes a few seconds" subtext | P1 | No |
| TC-021 | Steps container styling | Observe connecting state | 3-step progress wrapped in `bg-brown-50 rounded-xl` container | P2 | No |
| TC-022 | Step progression | Watch full connection flow | Steps show: "Connecting to {Provider}" → "Validating your credentials" → "Pulling in your account details" with active/completed/pending indicators | P1 | No |

### 4. Connect Utility Modal — MFA View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-023 | MFA view renders with 4 digit boxes | Trigger MFA flow | "Verify your identity" heading with ThumbsUp icon in brown-200 bg. Four individual digit input boxes displayed. | P0 | No |
| TC-024 | MFA description text | Trigger MFA flow | "{providerName} sent a verification code to your email or phone. Enter it below to continue." | P1 | No |
| TC-025 | Single digit entry auto-advances | Type a digit in box 1 | Cursor auto-advances to box 2. Repeat for boxes 2→3→4. | P0 | No |
| TC-026 | Backspace navigates to previous box | Focus on box 3 (empty), press Backspace | Focus moves to box 2 | P1 | No |
| TC-027 | Paste full code | Paste "1234" into any box | All 4 boxes fill with digits 1, 2, 3, 4. Focus moves to last filled box. | P0 | No |
| TC-028 | Paste partial code | Paste "12" into box 1 | Boxes 1 and 2 fill. Focus moves to box 3. Boxes 3-4 remain empty. | P1 | No |
| TC-029 | Non-numeric input rejected | Type "a" or "!" in a digit box | Input is ignored (only digits accepted) | P1 | No |
| TC-030 | Submit with incomplete code | Enter only 2 digits and click Verify | Error: "Enter the verification code to continue" | P1 | No |
| TC-031 | Submit with empty code | Click Verify without entering any digits | Error: "Please enter the verification code" | P1 | No |
| TC-032 | Verify button state | Enter 4 digits | Verify button enabled. Shows "Verifying..." with processing state while submitting. | P1 | No |
| TC-033 | Cancel during MFA | Click Cancel | Modal returns to form state / closes | P1 | No |
| TC-034 | "Resend code" link visible | Trigger MFA flow | "Didn't receive a code? Resend code" text visible below digit boxes | P2 | No |
| TC-035 | Filled digit box has purple border | Type a digit in a box | Filled boxes show `border-purple-400 border-2`, empty boxes show `border-gray-300` | P2 | No |
| TC-036 | Error state shows red border | Submit wrong code, trigger error | All digit boxes show `border-red-300` | P2 | No |

### 5. Connect Utility Modal — Success View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-037 | Success icon | Complete successful connection | AlertSuccess icon displayed (green check, not old CheckCircleFilledGreen) | P2 | No |
| TC-038 | Success heading and description | Complete successful connection | "You're connected!" heading. Description: "Your {providerName} account is linked. We'll automatically find and apply savings for you." | P1 | No |
| TC-039 | Account info card | Complete successful connection | Provider name and "Account #{number}" displayed in `bg-brown-50` card with PurpleElectricity icon | P1 | No |
| TC-040 | Done button closes modal and refreshes | Click Done | Modal closes. Overview page refreshes with updated account state. | P0 | No |

### 6. Connect Utility Modal — Error View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-041 | Error icon | Trigger any error state | AlertError icon displayed (not old AlertCircleFilled) | P2 | No |
| TC-042 | Wrong credentials error | Enter incorrect password | Error: "The email or password you entered doesn't match your {Provider} account. Try again or you can upload your utility bill instead" | P1 | No |
| TC-043 | Network/system error | Trigger SYSTEM_ERROR | Error: "Something went wrong on our end. Try again in a moment — if it keeps happening, upload your bill instead." with "Upload bill" button | P1 | No |
| TC-044 | "Try again" resets to form | Click "Try again" on error view | Returns to form view with fields cleared/ready for re-entry | P1 | No |
| TC-045 | "Upload bill" from error opens bill upload modal | Click "Upload bill" on error view | Connect modal closes, bill upload modal opens | P1 | Yes |

### 7. Bill Upload Modal — Idle View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-046 | Modal title | Open bill upload modal | Title reads "Upload document" (changed from "Upload your bill") | P1 | Yes |
| TC-047 | Drop zone text | Open bill upload modal | Shows "Click to upload" (purple, underlined) + "or drag and drop your file here" (gray) | P1 | Yes |
| TC-048 | Upload icon in drop zone | Open bill upload modal | Upload icon (w-6 h-6) displayed in drop zone | P2 | Yes |
| TC-049 | Buttons layout | Open bill upload modal | Cancel and Upload buttons side-by-side with equal flex width. Upload button disabled (no file selected). | P1 | Yes |
| TC-050 | "Connect account" alternative link | Open bill upload for connect-ready provider | "Have a {providerName} account? Connect account" link visible below buttons | P1 | Yes |
| TC-051 | "Connect account" switches to connect modal | Click "Connect account" link | Bill upload modal closes, connect utility modal opens | P0 | Yes |
| TC-052 | Error state reuses idle view | Trigger upload error (e.g., file too large) | Same idle view renders with red drop zone border and error message below. No separate error view. | P1 | Yes |
| TC-053 | File too large error message | Select file > 10MB | Error: "Your file is too large. We can only accept files up to 10MB. Try compressing your file or taking a photo of your bill instead." | P1 | Yes |

### 8. Bill Upload Modal — Uploading View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-054 | Uploading view title | Select file and submit | Title reads "Upload document" | P1 | Yes |
| TC-055 | Progress bar redesign | Observe uploading state | Full-width background fill (`bg-purple-50`) instead of thin progress bar. Upload icon + "{progress}% (Uploading)" text. | P2 | No |
| TC-056 | File icon renders by type | Upload PDF / JPG / PNG | Correct file type icon displayed next to file name | P2 | Yes |

### 9. Bill Upload Modal — Ready View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-057 | Ready view title | Select a valid file | Title reads "Upload document" | P1 | Yes |
| TC-058 | File size no longer displayed | Select a valid file | File name shown but NO file size information visible | P1 | Yes |
| TC-059 | Re-upload link | Select a valid file | "Made a mistake? Re-upload" text visible. Re-upload is a button (not span). | P1 | Yes |
| TC-060 | Re-upload resets to idle | Click "Re-upload" | Returns to idle view, file selection cleared | P1 | Yes |
| TC-061 | Upload button enabled | Select a valid file | Upload button is now enabled (was disabled in idle) | P0 | Yes |

### 10. Bill Upload Modal — Success View

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-062 | Success icon | Complete upload | AlertSuccess icon displayed | P2 | Yes |
| TC-063 | Done closes modal and refreshes | Click Done after successful upload | Modal closes, page refreshes | P0 | Yes |

### 11. Bill Upload Error Messages (Unified)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-064 | Auth error message | Trigger upload while not signed in | Error: "Something went wrong. Try uploading again. If this keeps happening, reach out to our support team" | P2 | No |
| TC-065 | Storage upload failure message | Simulate Supabase storage failure | Same unified message: "Something went wrong. Try uploading again..." | P2 | No |
| TC-066 | Unexpected error message | Trigger unexpected exception | Same unified message: "Something went wrong. Try uploading again..." | P2 | No |

### 12. Auto-Apply Savings Card

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-067 | Button sizes | Log in as eligible bill upload user | "Connect utility" and "Upload bill" buttons are size `md` (not `sm`) | P1 | Yes |
| TC-068 | "Upload bill" button text | View auto-apply card | Button reads "Upload bill" (changed from "Upload a bill") | P1 | Yes |
| TC-069 | Piggybank image responsive behavior | View at different widths | Piggybank image hidden below 475px, visible and absolutely positioned above 475px | P2 | No |
| TC-070 | Description text layout | View auto-apply card | "Get savings applied automatically" in `text-xl font-bold`. Description and benefits in flex-col gap-3 container. | P2 | Yes |
| TC-071 | Connect utility → Upload bill switch | Open connect modal from card, click "Upload bill" in error/form view | Connect modal closes, state resets, bill upload modal opens | P0 | Yes |
| TC-072 | Upload bill → Connect account switch | Open bill upload from card, click "Connect account" | Bill upload closes, connect modal opens | P0 | Yes |

### 13. Setup Tracker

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-073 | Step 1 font weight for bill upload user | Log in as bill upload user with REVIEW_UPLOAD_BILL | Step 1 title uses `font-semibold` (changed from `font-bold`) | P3 | No |
| TC-074 | Step 2 text for connect account user | Log in as user with `isConnectAccount = true` and completed step | Step 2 shows "Savings applied automatically" with description "Once verified, we'll scan for savings and auto-apply them!" | P1 | Yes |
| TC-075 | Step 2 default text for non-connect user | Log in as standard billing customer | Step 2 still shows "Savings monitoring begins" (unchanged) | P1 | Yes |
| TC-076 | Upload-bill-error header styling | Log in as user with ISSUE_UPLOAD_BILL | Error header: "We couldn't verify your account" in `text-display-xs font-bold text-red-500`. DividerBeads visible above error section. | P1 | No |
| TC-077 | Upload bill button in error state | View upload-bill-error tracker | "Upload utility bill" button has `size="lg"` and Upload01 start icon | P2 | No |
| TC-078 | Connect utility actions from tracker error | View tracker in upload-bill-error state with connect-ready provider | Connect utility actions available as extra actions alongside upload button | P2 | No |
| TC-079 | Tracker → connect modal → upload bill switch | From tracker, open connect modal, then switch to bill upload | Connect modal closes, resets, bill upload modal opens | P0 | Yes |

### 14. Regression — Non-Connect Users

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-080 | Standard billing customer overview unchanged | Log in as standard billing customer | Overview page renders identically — savings cards, setup tracker, billing history all unchanged | P0 | Yes |
| TC-081 | Standard tracker steps unaffected | Standard billing customer | Steps 0→1→2→3 visible with same labels and states as before | P1 | Yes |
| TC-082 | No connect modals for standard users | Browse overview, billing, settings | No connect-utility or bill-upload modal surfaces unprompted | P1 | Yes |

### 15. Locator Impact Assessment (Automation)

| ID | Title | Impact | Expected Fix | Priority |
|----|-------|--------|--------------|----------|
| TC-083 | BillUploadPage `uploadBillHeading` locator | `getByRole('heading', { name: 'Upload your bill' })` → **BROKEN** (now "Upload document") | Update to `getByRole('heading', { name: 'Upload document' })` | P0 |
| TC-084 | BillUploadPage `energySavingsHeading` locator | `getByRole('heading', { name: 'Stop overpaying for electricity' })` — may be stale if `/bill-upload/connect-account` page was also updated | Verify against live app; update if changed | P1 |
| TC-085 | Bill upload button text | `getByRole('button', { name: /Upload bill/i })` — still matches "Upload bill" | No change needed | P2 |

---

## Automation Plan

### Smoke Suite
- TC-006 (registration success toast)
- TC-040 (connect success done)
- TC-051 (modal cross-switch: bill upload → connect)
- TC-063 (bill upload success done)
- TC-071 (modal cross-switch: connect → bill upload)

### Regression Suite
- TC-001–TC-009 (connect form)
- TC-010–TC-018 (connect modal form view)
- TC-046–TC-053 (bill upload idle view)
- TC-057–TC-062 (bill upload ready/success views)
- TC-067–TC-072 (auto-apply savings card)
- TC-074–TC-075 (tracker Step 2)
- TC-079–TC-082 (tracker modals + regression)

### Exploratory Only
- TC-019–TC-022 (connecting view — transient state, hard to assert)
- TC-023–TC-036 (MFA view — requires MFA-enabled utility account, not automatable without test provider)
- TC-037–TC-045 (success/error views — depend on real credential validation via BLNK)
- TC-054–TC-056 (uploading view — transient progress state)
- TC-064–TC-066 (unified error messages — require failure simulation)
- TC-069 (responsive piggybank — visual check)
- TC-073, TC-076–TC-078 (tracker styling — visual verification)

---

## Risks & Notes

1. **MFA digit-box input is a significant functional change** — moved from single text input to 4 individual inputs. Edge cases around paste, keyboard navigation, and screen reader accessibility should be thoroughly explored.
2. **"Resend code" button has no handler** — The button is rendered but the onClick handler is empty in the PR. This may be intentional (placeholder for future work) or a bug. Verify with dev.
3. **Error state consolidation** — Bill upload error now re-renders IdleView with `errorMessage` prop instead of a dedicated ErrorView. Verify that the drop zone remains functional (can select new file) when in error state.
4. **Modal cross-switching state management** — New `onUploadBill` prop on ConnectUtilityModal creates connect→bill-upload switch path. Verify no state leaks (e.g., connecting state persists after switching).
5. **Figma access blocked** — Could not fetch design context from Figma. Visual verification should be done manually against the design at `figma.com/design/XFvjjqsf77NdeJtUvoHHuj/PG---Onboarding?node-id=4533-10867`.
6. **Existing POM locator breakage** — `BillUploadPage.uploadBillHeading` will fail since "Upload your bill" → "Upload document". Must fix before running existing bill upload tests.
7. **Connect button moved outside form** — The Connect button in form view now uses `onClick={form.handleSubmit(onSubmit)}` instead of `type="submit"` inside the form. **VERIFIED: Enter key from form fields DOES trigger submission.** react-hook-form handles this correctly.
8. **BLNK dependency** — Connect credential validation flows are still dependent on BLNK service availability. MFA and success/error views may be blocked during testing.

---

## Gaps Identified from Related Tickets

The following ACs from related tickets were NOT covered in the original test plan or exploratory session. They should be tested as part of the broader Connect Account feature validation.

### From ENG-2365 (Connect Onboarding Registration)

| ID | Title | Steps | Expected Result | Priority | Status |
|----|-------|-------|-----------------|----------|--------|
| TC-086 | Password reset mandate after registration | Complete connect registration, land on overview | Password reset dialog appears (`shouldResetPassword: true` in DB). User must set new password. | P1 | PASS (observed in exploratory) |
| TC-087 | Renewable energy card visible for connect user | Log in as connect account with ELIGIBLE status | Renewable energy offset card visible in sidebar (if utility supports renewables) | P1 | INCONCLUSIVE — Card NOT visible for connect ELIGIBLE user. Auto-apply card appears instead. Visible for non-connect ELIGIBLE user. Needs dev clarification on intended behavior. |
| TC-088 | Duplicate email registration | Submit `/connect` form with existing email | Toast: "An account with this email already exists." Submit button re-enabled. | P1 | PASS — Toast shows "Something went wrong — An account with this email already exists." Button re-enables. |
| TC-089 | Registration API failure | Simulate registration failure | Generic error toast displayed. Submit button re-enabled. | P2 | Not tested |
| TC-090 | Post-registration DB state | Check DB after registration | `cottageConnectUserType=BILL_UPLOAD`, `enrollmentPreference=manual`, `isRegistrationComplete=true`, `ElectricAccount.status=ELIGIBLE`, `isConnectAccount=true`, `maintainedFor` NOT set | P0 | PASS (verified in exploratory) |

### From ENG-2363 (Connect Utility Modal)

| ID | Title | Steps | Expected Result | Priority | Status |
|----|-------|-------|-----------------|----------|--------|
| TC-091 | Cancel mid-connecting state | Open connect modal, submit valid creds, close modal while connecting | In-progress Trigger.dev run cancelled via `/api/connect/cancel`. Modal resets on next open. | P1 | BLOCKED (BLNK) |
| TC-092 | MFA timeout (5 min) | Trigger MFA flow, wait 5+ minutes without submitting code | MFA waitpoint times out. Modal shows error state. | P1 | BLOCKED (BLNK) |
| TC-093 | System-level run failure | Trigger.dev run crashes or times out | Modal shows generic error state with "Try again" and "Upload bill" options | P1 | BLOCKED (BLNK) |
| TC-094 | Modal resets on re-open after cancel | Cancel modal during any state, re-open | Modal starts fresh in form view, no stale state | P1 | BLOCKED (BLNK for connecting state) |

### From ENG-2370 (Overview Rendering Logic)

| ID | Title | Steps | Expected Result | Priority | Status |
|----|-------|-------|-----------------|----------|--------|
| TC-095 | Auto-apply card rendering conditions | Verify with: `isConnectAccount=true`, `status=ELIGIBLE`, `isBillingCustomer=false`, `hasBills=false` | Auto-apply savings card shown with "Connect utility" and "Upload bill" | P0 | PASS (observed in exploratory) |
| TC-096 | Auto-apply NOT shown when any condition is false | Log in as user where one condition differs (e.g., `isBillingCustomer=true`) | Auto-apply card does NOT appear; standard overview shown instead | P1 | PASS — Non-connect ELIGIBLE user (`pgtest+funnel0001`, Con Edison) does NOT see auto-apply card. Standard overview shown with billing info. |
| TC-097 | Non-connect ELIGIBLE user sees bills + renewable card | Log in as non-connect user with ELIGIBLE status | Bills in main column, renewable energy card in sidebar. No auto-apply card. | P1 | PASS — User sees $0.00 balance, billing history, account details, renewable energy card ($3.29/mo "Activate offer"), and Services nav link. |
| TC-098 | Overview transitions after successful utility link | Complete credential validation → account status moves off ELIGIBLE | Auto-apply layout disappears. Standard overview for new status shown. Renewable energy card still accessible. | P0 | BLOCKED (BLNK) |
| TC-099 | Connect account is NOT a billing customer | Log in as connect account | No billing-related UI (billing history, payment options). `isBillingCustomer=false`. | P1 | PASS (observed — no billing UI in overview) |

### From ENG-2371 (Trigger Task - Credential Validation)

| ID | Title | Steps | Expected Result | Priority | Status |
|----|-------|-------|-----------------|----------|--------|
| TC-100 | Successful connection — ComEd | Submit valid ComEd credentials | Metadata transitions: starting → logging_in → fetching_account_info → complete. Success view with account number. | P0 | BLOCKED (BLNK) |
| TC-101 | MFA flow — code accepted | Submit creds for MFA-enabled account, enter valid code | MFA view → 4-digit input → verify → success | P0 | BLOCKED (BLNK) |
| TC-102 | Wrong credentials | Submit invalid password | Error: provider-specific "wrong credentials" message. Credentials NOT saved. | P1 | BLOCKED (BLNK) |
| TC-103 | Concurrent connection rate limiting | Submit creds twice rapidly for same user | First runs immediately, second queues (concurrencyLimit: 1 per user) | P2 | BLOCKED (BLNK) |
| TC-104 | Provider coverage — PECO, BGE, Pepco, Delmarva, ACE | Test with each supported provider | Login succeeds for each Exelon family provider | P1 | BLOCKED (BLNK + test accounts needed) |

### From ENG-2372 (Save Credentials Endpoint)

| ID | Title | Steps | Expected Result | Priority | Status |
|----|-------|-------|-----------------|----------|--------|
| TC-105 | `/connect-account` endpoint — happy path | POST with valid API key, userId, email, provider, utilityType | 200, credentials upserted | P1 | Not tested (backend/API) |
| TC-106 | `/connect-account` — with accountNumber | Include accountNumber in request | ElectricAccount updated with accountNumber, status → ACTIVE | P1 | Not tested (backend/API) |
| TC-107 | `/connect-account` — invalid auth | POST without valid API key | 400 "Invalid access token" | P1 | Not tested (backend/API) |
| TC-108 | `/upsert-credentials` backward compatibility | POST without new `password`/`retainEmail` fields | Identical to pre-update behavior | P1 | Not tested (backend/API) |

---

## Exploratory Session Summary

### Session 1 (2026-03-13) — Original Test Plan
Covered connect registration flow, bill upload modal, connect utility modal form view, and overview page for connect users. Key findings:
- Full registration + bill upload flow: PASS
- Post-registration DB state: PASS (verified `cottageConnectUserType=BILL_UPLOAD`, `isConnectAccount=true`, `status=REVIEW_UPLOAD_BILL`)
- Password reset mandate: PASS
- Setup tracker visible for REVIEW_UPLOAD_BILL user: PASS
- MFA/connecting/success/error views: BLOCKED (BLNK dependency)

### Session 2 (2026-03-13) — Gaps from Related Tickets
Focused on TC-087, TC-088, TC-096, TC-097, and Risk #7.

| Test | Result | Detail |
|------|--------|--------|
| TC-088 Duplicate email | PASS | Toast: "An account with this email already exists." |
| Risk #7 Enter key | PASS | Enter triggers submission via react-hook-form |
| TC-096 Auto-apply negative | PASS | Non-connect user does NOT see auto-apply card |
| TC-097 Non-connect overview | PASS | Sees billing, renewable energy card, Services nav |
| TC-087 Renewable energy card | INCONCLUSIVE | Not visible for connect ELIGIBLE user — auto-apply card shown instead. Needs dev confirmation. |

### Overall Coverage (108 test cases)
- **PASS**: 14 cases
- **INCONCLUSIVE**: 1 case (TC-087)
- **BLOCKED**: 12 cases (BLNK/backend dependency)
- **Not tested**: 81 cases (backend/API, additional UI scenarios)

### Recommended Next Steps
- `/fix-test` — Update `BillUploadPage.uploadBillHeading` locator ("Upload your bill" → "Upload document")
- `/new-test` — Automate TC-088 (duplicate email) and TC-096/TC-097 (overview card conditions)
- Dev clarification needed on TC-087 (renewable energy card for connect users)
- Retest BLNK-blocked cases when service is available
