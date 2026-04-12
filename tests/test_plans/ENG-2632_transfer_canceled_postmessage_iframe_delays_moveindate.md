# Test Plan: Transfer Flow — Canceled PostMessage, Iframe Delays, moveInDate URL Param

## Overview
**Ticket**: [ENG-2632](https://linear.app/public-grid/issue/ENG-2632/transfer-flow-add-canceled-postmessage-iframe-navigation-delays-and)
**PR**: [cottage-nextjs #1173](https://github.com/Cottage-Energy/cottage-nextjs/pull/1173) (merged)
**Source**: Linear ticket + PR diff (10 files, +80/-40 lines)
**Date**: 2026-04-07
**Tester**: Christian

## Summary
Three gaps between partner-facing documentation and actual implementation of the transfer flow:
1. **Canceled postMessage** — `{ status: 'canceled' }` was never sent when user hit the "unavailable" screen and clicked "Go back"
2. **Iframe navigation delays** — Navigation happened instantly, racing with partner postMessage handlers. Now delays 8s (`POST_MESSAGE_TIMEOUT_MS`) when in iframe
3. **`moveInDate` URL parameter** — Documented but never parsed. Now prefills move-in date in new-address and estimated-date pickers

## Scope

### In Scope
- `{ status: 'canceled' }` postMessage fired on "Go back" click (unavailable screen)
- 8-second navigation delay when in iframe (both "Go back" and "Done" buttons)
- Spinner/processing state on buttons during iframe delay
- Immediate navigation when NOT in iframe
- `moveInDate=MM/DD/YYYY` URL parameter parsing and prefill
- "Next" button disabled fix (must select radio before enabling, even with prefilled date)
- `isInIframe` utility extraction to shared `utils/iframe.ts`
- `parseMoveOutDate` → `parseDateParam` rename (no behavioral change)
- Auto-redirect timer on success screen (iframe only, 8s)

### Out of Scope
- Transfer flow business logic (RPC, DB writes, property eligibility) — covered by existing plan (ENG-2280)
- Transfer UI improvements — covered by ENG-2455
- Provider `startLease` → `moveInDate` mapping (deferred)
- ISO date format support (MM/DD/YYYY only)
- Cross-origin postMessage targeting (uses `'*'` wildcard)
- Automated test creation (no transfer tests exist yet)

### Prerequisites
- **Eligible user** (for full transfer + success screen): `pgtest+0ssn+std@joinpublicgrid.com` — has ACTIVE properties
- **Ineligible user** (for "unavailable" screen): Need a user with all INACTIVE properties — may require DB manipulation (set all ElectricAccount statuses to INACTIVE temporarily)
- **Dev environment**: `https://dev.publicgrid.energy/transfer`
- **postMessage listener**: `window.addEventListener('message', e => console.log('postMessage:', e.data))` in devtools console
- **Iframe embed**: Test HTML page that embeds `/transfer` in an iframe (create locally or use browser devtools)

### Dependencies
- PR #1173 merged and deployed to dev
- No feature flags — changes are unconditional

## Files Changed (10 files)

| File | Change |
|------|--------|
| `utils/iframe.ts` | **NEW** — shared `isInIframe()` utility |
| `(bill-upload)/shared/utils/iframe-utils.ts` | Removed duplicate `isInIframe`, now imports from shared |
| `transfer/transfer-widget.tsx` | "Go back" sends `{ status: 'canceled' }`, delays if iframe, spinner state |
| `transfer/forms/success.tsx` | "Done" delays if iframe, spinner state, auto-redirect timer refactored |
| `transfer/forms/new-service-question.tsx` | Prefill `estimatedMoveInDate` from URL + button disabled fix |
| `transfer/url-params.ts` | `parseMoveOutDate` → `parseDateParam`, added `moveInDate` parsing |
| `transfer/machines/transfer.tsx` | Pass `moveInDate` to new-address machine |
| `transfer/machines/new-address/index.ts` | Init `moveInDate` from input (was hardcoded `null`) |
| `transfer/machines/new-address/types.ts` | Added `moveInDate` to `NewAddressMachineInput` |
| `transfer/machines/post-message-handler/handle-post.ts` | Added `{ status: 'canceled' }` to `TransferPostMessage` type |

## Test Cases

### Change 1: Canceled PostMessage + Iframe Delays

#### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Canceled postMessage fires on "Go back" (no iframe) | 1. Log in as user with NO eligible properties 2. Navigate to `/transfer` 3. See "Transfer isn't available right now" screen 4. Add postMessage listener in devtools 5. Click "Go back" | `{ status: 'canceled' }` logged in console; immediate navigation to `/app/overview` | P0 | Yes |
| TC-002 | Canceled postMessage fires + delay in iframe | 1. Embed `/transfer` in an iframe 2. Log in as ineligible user 3. See unavailable screen 4. Add postMessage listener on parent window 5. Click "Go back" | `{ status: 'canceled' }` received by parent; spinner shows on button; ~8s delay; then navigates to `/app/overview` | P0 | Yes |
| TC-003 | "Go back" button shows spinner during iframe delay | 1. Same as TC-002 2. After clicking "Go back", observe button | Button shows `isProcessing` spinner; button is disabled during delay | P1 | Yes |
| TC-004 | "Done" button delay in iframe (success screen) | 1. Embed `/transfer` in iframe 2. Complete full transfer flow as eligible user 3. On success screen, click "Done" | Spinner shows on "Done" button; ~8s delay; then navigates to `/` | P0 | Yes |
| TC-005 | "Done" button immediate navigation (no iframe) | 1. Complete transfer flow (not in iframe) 2. On success screen, click "Done" | Immediate navigation to `/app/overview` (no spinner, no delay) | P0 | Yes |
| TC-006 | Auto-redirect on success screen (iframe) | 1. Embed `/transfer` in iframe 2. Complete transfer flow 3. On success screen, do NOT click "Done" 4. Wait ~8s | Auto-redirects to `/` after `POST_MESSAGE_TIMEOUT_MS` (8s) | P1 | No |
| TC-007 | "Done" click cancels auto-redirect timer | 1. Same as TC-006 but click "Done" immediately 2. Observe behavior | Only one navigation occurs (click handler's timeout); auto-redirect timer is cleared | P1 | No |

#### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | No auto-redirect when NOT in iframe | 1. Complete transfer flow outside iframe 2. Reach success screen 3. Wait 10+ seconds without clicking "Done" | No auto-redirect occurs; screen stays on success page | P1 | No |
| TC-011 | "Go back" postMessage with cross-origin iframe | 1. Embed `/transfer` in iframe from different origin 2. Click "Go back" on unavailable screen | postMessage still fires (uses `'*'` wildcard); `isInIframe` returns true (catches cross-origin exception) | P2 | No |
| TC-012 | Multiple rapid "Go back" clicks | 1. On unavailable screen in iframe 2. Click "Go back" rapidly multiple times | Button disables after first click (`isNavigating` state); only one postMessage + one navigation | P2 | No |
| TC-013 | Multiple rapid "Done" clicks | 1. On success screen in iframe 2. Click "Done" rapidly | Button disables after first click (`isNavigating` state); single navigation | P2 | No |

#### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | No canceled postMessage for eligible user | 1. Log in as eligible user (ACTIVE property) 2. Navigate to `/transfer` | Unavailable screen does NOT appear; user enters transfer flow normally; no `canceled` message sent | P1 | Yes |
| TC-021 | postMessage not sent on other navigation actions | 1. In transfer flow (not unavailable screen) 2. Navigate away or use exit button | No `{ status: 'canceled' }` postMessage fires (only fires from unavailable screen "Go back") | P2 | No |

### Change 2: moveInDate URL Parameter

#### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | moveInDate prefills new-address date picker | 1. Navigate to `/transfer?moveInDate=05/01/2026` 2. Proceed through flow to "Start service?" 3. Select "Start service at my new address" 4. On new-address screen, check date picker | Move-in date picker prefilled with May 1, 2026 | P0 | Yes |
| TC-031 | moveInDate prefills estimated move-in date | 1. Navigate to `/transfer?moveInDate=05/01/2026` 2. Proceed through flow to "Start service?" 3. Select "Don't have my new address yet" | Estimated move-in date picker prefilled with May 1, 2026 | P0 | Yes |
| TC-032 | Button stays disabled until radio selected (with prefilled date) | 1. Navigate to `/transfer?moveInDate=05/01/2026` 2. Reach "Start service?" screen 3. Do NOT select any radio option | "Next" button is DISABLED despite date being prefilled | P0 | Yes |
| TC-033 | Button enables after radio selection (with prefilled date) | 1. Same as TC-032 2. Select either radio option | "Next" button enables | P0 | Yes |
| TC-034 | moveInDate combined with moveOutDate | 1. Navigate to `/transfer?moveOutDate=04/15/2026&moveInDate=05/01/2026` 2. Check move-out date field 3. Proceed to move-in date field | Both dates prefilled correctly from URL params | P1 | Yes |

#### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | moveInDate with invalid format | 1. Navigate to `/transfer?moveInDate=garbage` 2. Proceed to date picker screens | Date pickers are empty (graceful null handling); no error shown | P1 | Yes |
| TC-041 | moveInDate with empty value | 1. Navigate to `/transfer?moveInDate=` 2. Check date pickers | Date pickers empty; flow behaves normally | P2 | Yes |
| TC-042 | moveInDate with ISO format (unsupported) | 1. Navigate to `/transfer?moveInDate=2026-05-01` | Date pickers empty (parser only accepts MM/DD/YYYY) | P2 | Yes |
| TC-043 | moveInDate with past date | 1. Navigate to `/transfer?moveInDate=01/01/2020` | Date picker prefilled with Jan 1, 2020 (no validation on URL param; validation may occur at form submission) | P2 | No |
| TC-044 | moveInDate without moveOutDate | 1. Navigate to `/transfer?moveInDate=05/01/2026` (no moveOutDate) 2. Check move-out date field on move-out screen | Move-out date is empty (not affected by moveInDate) | P2 | Yes |
| TC-045 | User overrides prefilled moveInDate | 1. Navigate to `/transfer?moveInDate=05/01/2026` 2. Reach date picker 3. Change date to June 15, 2026 | User-selected date takes precedence; form submits with June 15 | P2 | No |
| TC-046 | moveInDate with special characters | 1. Navigate to `/transfer?moveInDate=05%2F01%2F2026` (URL-encoded) | Parser handles URL-decoded value; date prefilled correctly | P3 | No |

### Regression Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Normal transfer flow without URL params | 1. Navigate to `/transfer` (no query params) 2. Complete full transfer flow | All steps work as before; no regressions from refactoring | P0 | Yes |
| TC-051 | moveOutDate still works after rename | 1. Navigate to `/transfer?moveOutDate=04/15/2026` 2. Check move-out date field | Move-out date prefilled (parseDateParam rename didn't break existing behavior) | P1 | Yes |
| TC-052 | Bill upload iframe flow unaffected | 1. Navigate to bill upload flow in an iframe context 2. Verify `isInIframe` still works | Shared `isInIframe` from `utils/iframe.ts` works for bill-upload flow (re-export in iframe-utils.ts) | P1 | No |
| TC-053 | Success screen auto-redirect still works (iframe) | 1. Complete transfer in iframe 2. Don't click "Done" 3. Wait 8 seconds | Auto-redirect fires after 8s (refactored from inline to ref-based timer) | P1 | No |

### Database Verification
| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-060 | moveInDate stored correctly after transfer | After completing transfer with `?moveInDate=05/01/2026`, check new ElectricAccount | `startDate` on new ElectricAccount = 2026-05-01 (or however the RPC maps moveInDate) | P1 |
| TC-061 | No DB changes on "Go back" (canceled) | After clicking "Go back" on unavailable screen, check DB | No new records created; no status changes; only a postMessage was sent | P1 |

### UX & Improvement Opportunities
| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Unavailable screen (iframe) | 8-second delay with spinner but no explanatory text — user may think app is frozen | Confusion, potential "broken" perception | Add brief message like "Redirecting you back..." below the spinner |
| UX-002 | Success screen (iframe) | "Done" button delay matches auto-redirect delay (both 8s) — clicking "Done" resets the timer to a fresh 8s instead of using remaining time | Adds up to 16s total wait if user clicks late | Consider: if user clicks "Done", use a shorter delay (e.g., 1-2s) since the click itself signals readiness |
| UX-003 | moveInDate URL param | Invalid date silently ignored — partner has no feedback that their param was malformed | Partner debugging difficulty | Log a console warning for invalid `moveInDate` values so partners can diagnose integration issues |
| UX-004 | postMessage wildcard origin | `sendPostMessage` uses `'*'` wildcard — any window can receive the message | Minor security concern in production | Consider restricting to partner origin via config (acknowledged as out-of-scope in PR) |
| UX-005 | "Go back" button text | In iframe context, "Go back" may confuse partners — where does it go back TO? | Partner integration clarity | Consider documenting the navigation target (`/app/overview`) in partner docs alongside the postMessage contract |

## Automation Plan
- **Smoke**: TC-001 (canceled postMessage basic), TC-030 (moveInDate prefill), TC-032 (button disabled fix), TC-050 (regression)
- **Regression**: TC-002, TC-004, TC-005, TC-020, TC-031, TC-033, TC-034, TC-040, TC-041, TC-042, TC-044, TC-051
- **Exploratory only**: TC-006, TC-007, TC-010, TC-011, TC-012, TC-013, TC-021, TC-043, TC-045, TC-046, TC-052, TC-053

**Note**: Iframe testing requires embedding the app in an `<iframe>` — this needs either a test HTML harness or Playwright's `page.evaluate()` to create an iframe context. The `isInIframe` check (`window.self !== window.top`) can potentially be mocked via `page.addInitScript()`.

## Test Data Requirements
| Need | Approach |
|------|----------|
| Eligible user (ACTIVE property) | `pgtest+0ssn+std@joinpublicgrid.com` — has multiple ACTIVE ElectricAccounts |
| Ineligible user (all INACTIVE) | DB manipulation: temporarily set all ElectricAccount statuses to INACTIVE for a test user, or create a fresh user via move-in → set to INACTIVE |
| Iframe context | Local HTML file: `<iframe src="https://dev.publicgrid.energy/transfer" width="100%" height="800"></iframe>` |
| postMessage listener | `window.addEventListener('message', e => console.log('postMessage:', e.data))` |

## Risks & Notes
- **Iframe testing complexity**: Playwright MCP (Chromium-only) can create iframe contexts via `page.evaluate()`, but cross-origin iframe behavior may differ from same-origin testing
- **8-second delay**: Tests involving the delay will be slow; may want to mock `POST_MESSAGE_TIMEOUT_MS` for automated tests
- **No existing transfer e2e tests**: This plan covers the new changes but a full transfer flow test suite (from ENG-2280 plan) is still pending automation
- **DB manipulation for "unavailable" screen**: Need to create or manipulate a user with NO eligible properties — must restore after testing
- **`parseDateParam` rename**: Functional no-op but verify `moveOutDate` still works (TC-051)
