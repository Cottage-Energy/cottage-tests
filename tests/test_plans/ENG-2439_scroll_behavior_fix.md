# Test Plan: ENG-2439 — Fix Scrolling Behavior for FE

## Overview
**Ticket**: [ENG-2439](https://linear.app/public-grid/issue/ENG-2439/task-fix-scrolling-behavior-for-fe)
**Source**:
- [cottage-nextjs#1103](https://github.com/Cottage-Energy/cottage-nextjs/pull/1103) — Add scroll to top hook (6 files)
- [Slack thread](https://public-grid.slack.com/archives/C09PU9WKX4Z/p1773521822935219) — original bug report

**Date**: 2026-03-18
**Tester**: Christian
**Created by**: Butch Castro

---

## Context

### Problem
When navigating between steps in multi-step onboarding flows, the scroll position is preserved from the previous step. Users who scroll down on one screen land mid-page on the next step — especially disorienting on mobile with long forms. This also occurs on back navigation.

### Root Cause
Two separate root causes depending on flow architecture:

1. **XState-based flows** (move-in, move-in light, transfer, finish-registration): All steps render on a single page via conditional rendering driven by XState state machines. No actual page navigation occurs → browser has no reason to reset scroll.
2. **Bill upload flows** (routing-based): Uses Next.js App Router `router.push()`. Although Next.js defaults to scrolling to top, the browser's native scroll restoration (bfcache) overrides this on back navigation, restoring the previous scroll position. A standard `useEffect` with `window.scrollTo()` is insufficient because the browser's restoration fires **after** the paint phase.

### Fix Summary
New `useScrollToTop` hook at `apps/main/components/useScrollToTop.ts`:
- Accepts a dependency value (current step identifier)
- Uses **double `requestAnimationFrame`** to scroll AFTER the browser's native scroll restoration completes
- Skips initial render to avoid unnecessary scroll on page load

### Files Changed (PR #1103)

| File | Change | Step Dependency |
|------|--------|-----------------|
| `apps/main/components/useScrollToTop.ts` | **NEW** — reusable scroll-to-top hook | N/A |
| `apps/main/app/move-in/forms/form-wizard.tsx` | Integrated hook | `currentStep` (calculated step number) |
| `apps/main/app/move-in/light/light-form-wizard.tsx` | Integrated hook | `currentStep` (calculated step number) |
| `apps/main/app/transfer/forms/form-wizard.tsx` | Integrated hook | `topLevel` (top-level state string) |
| `apps/main/app/finish-registration/forms/form-wizard.tsx` | Integrated hook | `stateValue` (state string) |
| `apps/main/app/(bill-upload)/shared/components/page-layout.tsx` | Integrated hook | `pathname` (current route) |

### Existing Test Coverage
- **Move-in tests**: 8 specs in `tests/e2e_tests/cottage-user-move-in/` — navigate multi-step flows but do NOT assert scroll position
- **Bill upload tests**: `bill_upload_modal.spec.ts`, `savings_flow_base.spec.ts` — do NOT test scroll
- **Transfer tests**: None exist yet
- **Finish-registration tests**: None exist yet
- **Scroll-specific tests**: None exist anywhere

### Unrelated Components (confirmed by ticket)
- `useScrollArrow` hook (`apps/main/components/useScrollArrow.tsx`) — manages scroll indicators inside modals, NOT page scroll
- `external-header` component — tracks `window.pageYOffset` for sticky header styling, should not conflict

---

## Scope

### In Scope
- Scroll resets to top on **forward navigation** across all 5 flow types
- Scroll resets to top on **back navigation** across all 5 flow types
- **No scroll flash/jump** on initial page load (hook skips initial render)
- **No scroll reset during sub-state transitions** within the same visual step (e.g., loading states, inline validation)
- **Mobile behavior** — long forms where scroll issues are most noticeable
- **Cross-browser**: Chrome (XState + bfcache), Safari (stronger bfcache), Firefox (standard)

### Out of Scope
- `useScrollArrow` hook (modal scroll indicators — unrelated)
- `external-header` sticky behavior (independent `pageYOffset` tracking)
- Bill upload iframe parent frame scroll (hook scrolls inner window only — expected)
- Overview page or non-onboarding pages
- Content/UI correctness of the flows themselves (only testing scroll behavior)

### Prerequisites
- PR #1103 deployed to dev environment
- Access to all 5 onboarding flows in dev
- Mobile viewport testing (Mobile Chrome + Mobile Safari projects)
- Test users/entry points for each flow

### Dependencies
- cottage-nextjs deployment (PR #1103 only — no services or DB changes)

---

## Test Cases

### 1. Move-In Flow (XState — `currentStep` dependency)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Scroll resets on forward navigation | Move-in flow started via `/move-in?shortCode=autotest` | 1. Fill first step fields 2. Scroll down to bottom of page (`window.scrollTo(0, 500)`) 3. Click Continue to advance to next step 4. Check `window.scrollY` | `window.scrollY === 0` — page is at top of next step | P0 | Yes |
| TC-002 | Scroll resets on back navigation | Move-in flow, advanced past step 1 | 1. Advance to step 2+ 2. Scroll down 3. Click Back button 4. Check `window.scrollY` | `window.scrollY === 0` — previous step shows from top | P0 | Yes |
| TC-003 | No scroll flash on initial page load | Fresh navigation | 1. Navigate directly to `/move-in?shortCode=autotest` 2. Wait for page load 3. Immediately check `window.scrollY` | Page loads at top; no visible scroll jump or flash; `scrollY === 0` throughout | P1 | Yes |
| TC-004 | No scroll reset during sub-state transition | Move-in step with inline validation or loading spinner | 1. Navigate to a step 2. Scroll to middle of page 3. Trigger form validation error (submit with empty required field) 4. Check `window.scrollY` | Scroll position preserved — NOT reset to top (sub-state change, not step change) | P1 | Exploratory |
| TC-005 | Mobile — scroll resets on long form step | Mobile viewport (375px width), move-in flow | 1. Start move-in on Mobile Chrome project 2. Fill form fields, scrolling down through long step 3. Advance to next step | Page scrolls to top of next step; no mid-page landing | P0 | Yes |

### 2. Move-In Light Flow (XState — `currentStep` dependency)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Scroll resets on forward navigation (light) | Move-in light flow started | 1. Scroll down on first step 2. Advance to next step 3. Check `window.scrollY` | `scrollY === 0` | P0 | Yes |
| TC-011 | Scroll resets on back navigation (light) | Light flow, past step 1 | 1. Advance to step 2+ 2. Scroll down 3. Go back 4. Check `scrollY` | `scrollY === 0` | P1 | Yes |
| TC-012 | No scroll flash on initial load (light) | Fresh navigation to move-in light URL | 1. Navigate directly 2. Verify no jump | Page loads at top, no flash | P1 | Yes |

### 3. Transfer Flow (XState — `topLevel` dependency)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Scroll resets on forward navigation (transfer) | Transfer flow started (requires valid token/link) | 1. Scroll down on current step 2. Advance to next step 3. Check `scrollY` | `scrollY === 0` | P0 | Yes |
| TC-021 | Scroll resets on back navigation (transfer) | Transfer flow, past step 1 | 1. Advance 2. Scroll down 3. Go back | `scrollY === 0` | P1 | Yes |
| TC-022 | No scroll flash on initial load (transfer) | Fresh navigation to `/transfer` | 1. Navigate directly 2. Verify no jump | Page loads at top, no flash | P1 | Yes |
| TC-023 | Mobile — scroll resets (transfer) | Mobile viewport, transfer flow | 1. Start transfer on mobile 2. Scroll down 3. Advance | `scrollY === 0` on next step | P0 | Yes |

### 4. Finish Registration Flow (XState — `stateValue` dependency)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | Scroll resets on forward navigation (finish-reg) | `/finish-registration?token=X&email=Y` with valid params | 1. Scroll down on first step 2. Advance 3. Check `scrollY` | `scrollY === 0` | P0 | Yes |
| TC-031 | Scroll resets on back navigation (finish-reg) | Past step 1 | 1. Advance 2. Scroll down 3. Go back | `scrollY === 0` | P1 | Yes |
| TC-032 | No scroll flash on initial load (finish-reg) | Fresh navigation with valid params | 1. Navigate directly 2. Verify | Page loads at top, no flash | P1 | Yes |
| TC-033 | Mobile — scroll resets (finish-reg) | Mobile viewport | 1. Start on mobile 2. Scroll + advance | `scrollY === 0` | P0 | Yes |

### 5. Bill Upload Flow (Route-Based — `pathname` dependency)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | Scroll resets on forward navigation (bill upload) | Bill upload flow started | 1. Scroll down on current page 2. Click Continue / advance to next page (route change) 3. Check `scrollY` | `scrollY === 0` — double rAF overrides any stale scroll | P0 | Yes |
| TC-041 | Scroll resets on back navigation (bill upload) — bfcache override | Bill upload, past first page | 1. Advance to page 2+ 2. Scroll down 3. Click **browser back button** (triggers bfcache) 4. Check `scrollY` | `scrollY === 0` — hook fires after bfcache scroll restoration via double rAF | P0 | Yes |
| TC-042 | Scroll resets on in-app back (bill upload) | Same as TC-041 | 1. Use in-app Back button (if exists) instead of browser back 2. Check `scrollY` | `scrollY === 0` | P1 | Yes |
| TC-043 | Verify utilities sub-flow — scroll reset | In `/verify-utilities` route | 1. Navigate through verify-utilities 2. Scroll down 3. Advance | `scrollY === 0` | P1 | Yes |
| TC-044 | Texas flow sub-flow — scroll reset | In `/texas-flow` route (if accessible in dev) | 1. Navigate through texas flow 2. Scroll + advance | `scrollY === 0` | P2 | Exploratory |

### 6. Additional Non-Billing Flows — Scroll Reset

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-070 | Scroll resets — Utility Verification flow | `/move-in?shortCode=pgtest`, click "I will call and setup myself" to enter utility verification | 1. Enter verification flow 2. Scroll down 3. Advance step 4. Check `scrollY` | `scrollY === 0` | P1 | Exploratory |
| TC-071 | Scroll resets — Connect flow | `/connect`, new user registration | 1. Fill connect form, scroll down 2. Submit / advance 3. Check `scrollY` | `scrollY === 0` | P1 | Exploratory |
| TC-072 | Scroll resets — TX Bill Drop flow | Bill Upload URL with TX zip `75063` | 1. Enter TX bill drop flow 2. Scroll down 3. Advance 4. Check `scrollY` | `scrollY === 0` | P2 | Exploratory |

### 8. Cross-Browser / bfcache Specifics

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-050 | Safari bfcache — back navigation scroll reset | Bill upload flow on Safari (Desktop Safari or Mobile Safari project) | 1. Advance 2 pages 2. Scroll down on page 2 3. Browser back 4. Check `scrollY` | `scrollY === 0` — Safari has stronger bfcache; double rAF must still win | P0 | Yes |
| TC-051 | Firefox — forward + back scroll reset | Any multi-step XState flow on Firefox project | 1. Advance 2. Scroll 3. Go back 4. Advance again | `scrollY === 0` on every transition | P1 | Yes |

### 9. Edge Cases / Negative Tests

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-060 | Rapid step navigation doesn't break scroll | Any multi-step flow | 1. Click Next/Continue rapidly 3 times without waiting for animations 2. Wait for UI to settle 3. Check `scrollY` | Final step at top; no stuck scroll position; no errors | P2 | Exploratory |
| TC-061 | Scroll reset works after window resize mid-step | Desktop move-in flow | 1. Start at 1440px width 2. Scroll down 3. Resize to 375px (mobile) 4. Advance step | `scrollY === 0` at new viewport size | P2 | Exploratory |
| TC-062 | External header sticky behavior unaffected | Any flow with external header | 1. Scroll down past header trigger point (sticky header appears) 2. Advance to next step 3. Verify header behavior | After scroll reset, header returns to initial non-sticky state; `pageYOffset` tracking still works | P1 | Exploratory |
| TC-063 | Mobile keyboard dismiss doesn't trigger false scroll reset | Mobile, any step with text input | 1. Tap into a text input (keyboard opens, viewport shifts) 2. Fill field 3. Tap outside to dismiss keyboard 4. Check scroll position | Scroll position NOT reset (keyboard dismiss is not a step change — hook dependency unchanged) | P1 | Exploratory |
| TC-064 | Multiple rAF queued — no scroll flicker | Any flow, advance step | 1. Advance step 2. Observe transition closely (record if possible) | No visible scroll flicker; smooth transition to top; single scroll event | P2 | Exploratory |

---

## Automation Plan

### Smoke (P0 — one per flow + mobile + Safari bfcache)
TC-001, TC-005, TC-010, TC-020, TC-023, TC-030, TC-033, TC-040, TC-041, TC-050

### Regression (P1 — back navigation + initial load + cross-browser)
TC-002, TC-003, TC-011, TC-012, TC-021, TC-022, TC-031, TC-032, TC-042, TC-043, TC-051

### Exploratory Only (timing/edge cases)
TC-004, TC-044, TC-060–TC-064

### Automation Strategy — Scroll Position Assert Pattern
```typescript
// Helper function for scroll tests
async function assertScrollAtTop(page: Page, tolerance = 5) {
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThanOrEqual(tolerance);
}

// Force scroll down before step transition
async function scrollDown(page: Page, pixels = 500) {
  await page.evaluate((px) => window.scrollTo(0, px), pixels);
  // Verify scroll took effect
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
}

// Test pattern:
// 1. Navigate to flow
// 2. scrollDown(page, 500)
// 3. Click Next/Continue
// 4. await page.waitForTimeout(200) // allow double rAF to complete
// 5. assertScrollAtTop(page)
```

**Note**: The `waitForTimeout(200)` after step transition is necessary because the hook uses double `requestAnimationFrame`, which fires after 2 animation frames (~32ms at 60fps). A 200ms buffer accounts for slower CI environments.

### Unit Tests (recommend to dev team — cottage-nextjs)
- `useScrollToTop`: calls `window.scrollTo(0, 0)` when dependency changes
- `useScrollToTop`: does NOT call `scrollTo` on initial render (skips mount)
- `useScrollToTop`: uses double `requestAnimationFrame` (can mock `requestAnimationFrame`)
- `useScrollToTop`: no-ops when dependency stays the same (sub-state transitions)

---

## Test Data Requirements

### Billing Flows (maintainedFor NOT null — payment method added/addable)

| Flow | Entry Point | Test Data | Notes |
|------|------------|-----------|-------|
| **Move-in** | `/move-in?shortCode=autotest` | Shortcode `autotest` (standard move-in, partner-branded) | Existing `newUserMoveInAutoPayment` fixture works |
| **Move-in (pgtest)** | `/move-in?shortCode=pgtest` | Shortcode `pgtest` (`useEncourageConversion=TRUE`, shorter flow) | Also has `isUtilityVerificationEnabled=TRUE` |
| **Transfer** | `/transfer` OR active/eligible user → Services → "Transfer my service" | User with ElectricAccount status `ACTIVE` or `ELIGIBLE` | Need existing test user with active account |
| **Light (TX dereg)** | `/move-in` → address `2900 Canton St` unit `524` | Modal appears: keep original → TX dereg, or address with ESD ID → Light flow | Light-specific address triggers the modal |
| **Finish Registration** | API-generated URL via `POST api-dev.publicgrd.com/v1/test-partner/register` | Bearer `GlF6YW1mCDNyZjopPSWDVFhpQlWDsSJA`, building `guid-autotest`, modify email/name/date per run | URL in API response contains `?token=` and `&email=` params |

### Non-Billing Flows (maintainedFor IS NULL — no payment method)

| Flow | Entry Point | Test Data | Notes |
|------|------------|-----------|-------|
| **Bill Upload** | `/bill-upload/connect-account` | Zip `12249` (Con Edison, `isBillUploadAvailable=TRUE`) | If flag is FALSE → waiting list flow instead |
| **Verify Utilities** | `/verify-utilities/connect-account` | Same zip `12249` (Con Edison) | Same `isBillUploadAvailable` prerequisite |
| **TX Bill Drop** | Bill Upload / Verify Utilities URLs | Light-enabled zip `75063` | Uses bill upload path but with TX zip |
| **Utility Verification** | `/move-in?shortCode=pgtest` → "I will call and setup myself" | Shortcode `pgtest` has `isUtilityVerificationEnabled=TRUE` | User clicks link to enter verification flow |
| **Connect** | `/connect` | Any supported utility | Registers new user |

### Building Shortcodes
| Shortcode | Flow Type | Key Flags |
|-----------|-----------|-----------|
| `autotest` | Standard move-in (partner) | Default |
| `pgtest` | Short move-in + utility verification | `useEncourageConversion=TRUE`, `isUtilityVerificationEnabled=TRUE` |
| `txtest` | TX dereg encourage conversion | `useEncourageConversion=TRUE`, ElectricCompany=`TX-DEREG` |

No special DB setup required — these are pure UI behavior tests. Existing test fixtures (`newUserMoveInAutoPayment`, `CleanUp`) can be reused for move-in tests.

---

## Risks & Notes

1. **Double `requestAnimationFrame` timing is browser-dependent**: At 60fps, 2 frames = ~32ms. On slower machines or CI runners, frames may be slower. If automated tests flake, increase the post-transition wait from 200ms to 500ms.

2. **bfcache behavior varies significantly across browsers**:
   - **Safari** (desktop + mobile): Strongest bfcache implementation — highest risk for scroll restoration overriding the fix. TC-050 is P0 for this reason.
   - **Chrome**: Standard bfcache, less aggressive than Safari.
   - **Firefox**: Different scroll restoration behavior — may not need the double rAF workaround but shouldn't break.

3. **Mobile keyboard changes viewport**: When keyboard opens on mobile, it shifts the viewport. Dismissing the keyboard restores it. This is NOT a step change and should NOT trigger scroll reset. TC-063 verifies this.

4. **Bill upload iframe context**: `window.scrollTo` inside an iframe scrolls the iframe's inner window, not the parent. If bill upload is embedded in an iframe (some contexts), the parent frame scroll is unaffected. This is expected — not a bug.

5. **No conflict with `useScrollArrow`**: Confirmed by ticket. `useScrollArrow` manages scroll indicators inside modals (`overflow-y: auto`), not page-level `window.scrollTo`.

6. **No conflict with `external-header`**: The header tracks `window.pageYOffset` for sticky styling. After scroll reset, `pageYOffset` returns to 0 and the header returns to its initial state. No conflict expected but TC-062 verifies.

7. **Transfer and finish-registration flows have no existing e2e tests**: Move-in has 8 specs to build on, but transfer and finish-reg tests would be net-new. Scroll tests for these flows may need new test entry point helpers.

8. **Sub-state transitions must NOT trigger scroll reset**: The hook dependency (`currentStep`, `topLevel`, `stateValue`, `pathname`) only changes on actual step transitions. Loading states, validation errors, and other sub-state changes within the same step should not alter the dependency value. TC-004 verifies this for move-in; worth spot-checking for other flows during exploratory testing.
