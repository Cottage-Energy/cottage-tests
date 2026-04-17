# Test Plan: ENG-2715 — Address Form Validation, Prefilled Address Clearing, and Utility Override Improvements

## Overview
**Ticket**: [ENG-2715](https://linear.app/public-grid/issue/ENG-2715)
**PR**: [cottage-nextjs #1217](https://github.com/Cottage-Energy/cottage-nextjs/pull/1217) (MERGED to dev on 2026-04-17)
**Reporter context**: Walkthrough video by Zack Schmitz ([cap.so/s/zdv7zm6ybw7y19z](https://cap.so/s/zdv7zm6ybw7y19z)) — AC1/AC2/AC3 are the three UX issues flagged in the video
**Business context**: Blocking Mynd onboarding / welcome emails. Shipped despite frontend feature freeze.
**Date**: 2026-04-17
**Tester**: Christian

## Scope

### In Scope
- AC1 — Address input validation state (green check / red X) across all Light autocomplete usages
- AC2 — Clear prefilled Texas address when Light partial-address-search returns 0
- AC3 — Skip address confirmation search when `electricCompany` / `gasCompany` URL override params are present
- AC4 — Override params combined with incomplete shortcode routes via companyOverride path
- AC5 — Regression across 5 address flows
- AC6 — Pay Bills modal footer visibility during Flex option picker
- AC7 — "Learn more about Flex" closes the Pay Bills sheet
- Parity verification across **Next.js dev** (`dev.publicgrid.energy`) AND **TanStack dev** (`tanstack-dev.onepublicgrid.com`) — PR touches both apps

### Out of Scope
- Cottage app post-login pages other than Billing/Pay Bills
- Non-Flex-qualifying residents (no intermediate picker behavior change for them — only regression check)
- API v2 / Partner embed APIs
- Light user ESI ID Light flow internals (covered by existing `light_*.spec.ts` suite)

### Prerequisites
- Test users: at least 2 fresh accounts reachable via move-in, 1 Flex-qualifying resident with outstanding balance (`pgtest+flex-msg00`), 1 non-Flex resident with outstanding balance
- Test addresses:
  - Light-matched TX address: `2900 Canton St, Dallas TX 75226` unit `524` (ESI ID `10443720007633191`)
  - TX-non-Light (partial search 0 results): user-selected `1301 University Ave, Lubbock, TX 79401` is a Lubbock ZIP — outside ESI ID coverage; use for AC2. Alternative: any Texas address outside the TXDREG footprint
  - CoServ-split ZIP example: `75056` (Frisco) or `76227` (Aubrey) — to validate override routing when DB would default to TXDREG
  - Non-TX regression baseline: ComEd Chicago (`2900 N Halsted St, Chicago, IL 60657`)
- Shortcodes: `autotest`, `pgtest`, `txtest`, plus no-shortcode standard
- Playwright MCP configured for dev environment
- Fastmail JMAP env vars set (`set -a; source .env; set +a`) for email verification
- Password handling: fresh users must complete `PG#12345` dialog per project convention

## Test Cases

### AC1 — Address Validation State (Green Check / Red X)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Empty input shows neutral state (no check, no X) | 1. Go to `/move-in?shortCode=txtest` 2. Observe empty address field | Neither green check nor red X icon. Continue disabled | P1 | Yes |
| TC-002 | Typed partial TX address (unresolved) shows red X | 1. `/move-in?shortCode=txtest` 2. Type `2900 Canton` but don't pick suggestion | Address field shows **red X** (invalid styling). Continue disabled | P0 | Yes |
| TC-003 | TX address while Light search in flight shows red X | 1. `/move-in?shortCode=txtest` 2. Select Light suggestion 3. Observe during `isAddressSearching` | Red X shown while `isButtonProcessing === true`. Continue disabled with spinner | P1 | Yes |
| TC-004 | Valid ESI-matched TX address shows green check | 1. `/move-in?shortCode=txtest` 2. Type & select `2900 Canton St 524` → Light search resolves with ESI ID | **Green check** visible. Continue enabled. Clicking proceeds to Light flow | P0 | Yes |
| TC-005 | TXDREG address with 0-match (button disabled) shows red X — NOT check | 1. `/move-in?shortCode=txtest` 2. Type a TX address where ESI lookup returns 0 results (e.g., out-of-area Lubbock) | **Red X** visible (NOT green check). Continue disabled. This is the exact bug from video issue #1 | P0 | Yes |
| TC-006 | AC1 on standard move-in (no shortcode) with TX address | 1. `/move-in` (no shortcode) 2. Type TX address triggering Light type-ahead | Same validation states as TC-001..TC-005 | P1 | Yes |
| TC-007 | AC1 on encouraged conversion (`pgtest`) with TX address | 1. `/move-in?shortCode=pgtest` 2. Enter TX address | Check/X validation applies. Note: encouraged default form now uses `AddressAutocomplete` (not Light) — verify plain Google autocomplete still renders cleanly | P1 | Yes |
| TC-008 | AC1 on Light encouraged (`txtest`) address page | 1. Light encouraged flow until Light address step 2. Test empty / invalid / valid states | Matches AC1 behavior on `light-encouraged-address.tsx` | P1 | Yes |
| TC-009 | AC1 on texas-flow bill upload | 1. Go to texas-flow bill upload (via Light-enabled ZIP `75063` → bill upload) 2. Test empty / invalid / valid on ESI search | Check/X applies on `texas-flow/address-search` page too | P1 | Yes |
| TC-010 | Non-TX Google autocomplete unaffected | 1. `/move-in?shortCode=autotest` 2. Select Chicago address | No red X / no green check on `AddressAutocomplete`. Continue works as before | P1 | Yes |

### AC2 — Clear Prefilled Address on Failed Light Partial Search

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | TX prefilled address with 0-match → cleared to empty | 1. Build move-in URL with TX address prefill params (encouraged conversion with prefilled address outside ESI coverage) 2. Page loads → TXDREG detected → Light partial search fires → 0 results | Address field is **cleared** to empty. Input is in neutral (no check, no X). User can type/search freely | P0 | Yes |
| TC-021 | TX prefilled address WITH matches → preserved | 1. Prefill `2900 Canton St` (ESI-covered) 2. Page loads → TXDREG → partial search → N>0 matches | Prefilled address **remains**, Continue enabled once user resolves to a specific match | P0 | Yes |
| TC-022 | Non-TX prefilled address — no partial search runs | 1. Prefill a Chicago address 2. Page loads | No TXDREG detection, no Light partial search, prefilled address intact | P1 | Yes |
| TC-023 | AC2 applies to both encouraged AND non-encouraged move-in | 1. Run TC-020 on `/move-in` (no shortcode) and again on `/move-in?shortCode=pgtest` | Clear behavior matches in both variants | P1 | Yes |
| TC-024 | After clearing, user naturally lands in "Can't find your address?" flow | 1. Complete TC-020 2. Manually type the same address that had 0 ESI matches 3. Verify Light type-ahead behavior / fallback | User can proceed via Light fallback modal OR Google autocomplete route without being stuck | P1 | Manual |

### AC3 — Skip Address Confirmation When Utility Override Params Present

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | `electricCompany=COSERV` on TX address — no confirmation modal | 1. `/move-in?electricCompany=COSERV` 2. Enter a Dallas-area address (normally would trigger TXDREG confirmation) 3. Click Next | **No** "Confirm your address" modal. Form proceeds directly. Button shows processing state while `companyOverride` machine state active | P0 | Yes |
| TC-031 | `gasCompany=<code>` only — same skip behavior | 1. `/move-in?gasCompany=SCE` 2. TX address 3. Next | Confirmation skipped | P1 | Yes |
| TC-032 | Both `electricCompany` + `gasCompany` params | 1. `/move-in?electricCompany=COSERV&gasCompany=SCE` 2. TX address 3. Next | Confirmation skipped; both utilities applied to resulting ElectricAccount/GasAccount | P1 | Yes |
| TC-033 | Override param + shortCode (building) — override wins | 1. `/move-in?shortCode=autotest&electricCompany=SDGE` 2. Any address 3. Next | SDGE overrides ComEd (autotest default). Existing pattern — regression check only | P1 | Yes (existing) |
| TC-034 | Button processing state visible during companyOverride state | 1. TC-030 with network throttling 2. Click Next | Button shows spinner/processing label while machine is in `form: 'companyOverride'` state. User can't double-click | P2 | Yes |
| TC-035 | No override params present → confirmation modal fires normally | 1. `/move-in` 2. Enter `2900 Canton St` (ESI-covered) 3. Next | "Confirm your address" modal appears with Use verified / Keep original | P0 | Yes |
| TC-036 | Non-encouraged move-in (standard) override applies | 1. `/move-in?electricCompany=COSERV` (no shortCode) 2. TX address 3. Next | Confirmation skipped — same as TC-030 | P1 | Yes |
| TC-037 | Encouraged-default move-in override applies | 1. `/move-in?shortCode=pgtest&electricCompany=COSERV` 2. TX address 3. Next | In encouraged-default form, `hasUtilityCompanyParams` triggers `handleNext()` without `runConfirmationSearch` | P1 | Yes |
| TC-038 | Invalid utility code with override param — falls back to regular flow | 1. `/move-in?electricCompany=XXX` 2. Any address 3. Next | Matches existing invalid-param fallback (confirmation does NOT appear; regular flow proceeds using ZIP-mapped utility). Regression of existing test suite | P2 | Yes (existing) |

### AC4 — Incomplete Shortcode + Utility Override

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | `shortCode=moved` (not connected to building) + `electricCompany=COSERV` | 1. `/move-in?shortCode=moved&electricCompany=COSERV` 2. TX address 3. Next | Machine routes through `companyOverride` (NOT `buildingValidation`). Confirmation skipped. ElectricAccount created with COSERV | P0 | Yes |
| TC-041 | AC4 with address that WOULD resolve to TXDREG | 1. `/move-in?shortCode=moved&electricCompany=COSERV` 2. CoServ-split ZIP (e.g. Frisco `75056`) 3. Next | Resulting ElectricAccount uses **COSERV**, not TXDREG. DB assertion | P0 | Yes |
| TC-042 | Incomplete shortCode WITHOUT override — regression | 1. `/move-in?shortCode=moved` (no overrides) 2. Any address 3. Next | Existing fallback behavior (routes through regular validation) — not broken | P1 | Yes (existing) |

### AC5 — Regression Across Address Flows

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Standard move-in full flow completes | 1. `/move-in?shortCode=autotest` 2. Complete all 6 steps → success page | Success page. DB: CottageUser created, ElectricAccount + GasAccount ACTIVE | P0 | Yes (existing smoke) |
| TC-051 | TX Light flow full flow completes | 1. `/move-in?shortCode=txtest` 2. Enter `2900 Canton St 524` → Use verified 3. Complete Light flow | LightUser created in `LightUsers` table. Success page. Phone `(646) 437-6170` | P0 | Yes |
| TC-052 | Encouraged conversion (`pgtest`) full flow | 1. `/move-in?shortCode=pgtest` 2. Complete encouraged flow | Success. Dashboard reachable | P0 | Yes (existing) |
| TC-053 | Finish registration flow | 1. POST `/v1/test-partner/register` 2. Follow URL → complete finish reg | Account created and attributed correctly | P1 | Yes (existing) |
| TC-054 | Texas-flow bill upload end-to-end | 1. `/bill-upload/connect-account` with TX-eligible ZIP `75063` 2. Enter TX address → ESI resolution → bill upload | Bill upload completes. New validation state doesn't break submission | P1 | Yes |
| TC-055 | Transfer flow still works | 1. `/transfer` as eligible user 2. Move through flow | No regression on transfer (unchanged by PR, but shares form patterns) | P2 | Yes (existing) |
| TC-056 | Canada flow still works | 1. `/move-in?shortCode=pgtest&country=ca` 2. Complete flow | Manual-entry Canadian address form unaffected | P2 | Yes (existing) |
| TC-057 | Waitlist flow still works | 1. `/move-in` with `155 N Nebraska Ave, Casper, WY 82609` 2. Submit | Waitlist page still renders + Slack alert still fires | P1 | Yes (existing) |

### AC6 — Pay Bills Modal Footer During Flex Options Picker

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Flex-qualifying user, no saved method → picker screen has NO footer | 1. Log in as `pgtest+flex-msg00` (Flex-enabled, outstanding, not yet Flex customer) with NO payment method 2. Open Pay Bills modal | `PaymentOptionsWithExternal` picker shown. **No** "Save details" / "Cancel" in footer. DividerBeads hidden | P0 | Yes |
| TC-061 | Flex-qualifying user clicks "Pay in full" → footer reappears | 1. From TC-060 2. Click "Pay in full" | Payment method form renders. **"Save details" and "Cancel" visible**. No render flash | P0 | Yes |
| TC-062 | Flex-qualifying user clicks "Update payment method" on existing flow | 1. Log in as Flex-qualifying user with existing method 2. Click "Update payment method" inside Pay Bills | Picker shown (no footer). "Pay in full" reveals footer | P1 | Yes |
| TC-063 | Non-Flex-qualifying user (no Flex-enabled property) — form direct, footer present | 1. Log in as non-Flex user with outstanding bill 2. Open Pay Bills → Update method | Payment form shown directly. "Save details" / "Cancel" visible from the start. No picker, no flash | P0 | Yes |
| TC-064 | Existing Flex customer — form direct, footer present | 1. Log in as user already enrolled in Flex 2. Pay Bills → Update method | No picker (`isFlexCustomer=true` suppresses). Form + footer direct | P1 | Yes |
| TC-065 | Cancel from picker screen | 1. TC-060 2. Close sheet via X or escape | Sheet closes. State resets to `idle`. Reopen → picker again | P2 | Yes |
| TC-066 | Machine sub-state matches expectation | 1. TC-060 2. Inspect XState machine via Playwright `browser_evaluate` | `state.matches({updating:'choosing'})` true; `state.matches({updating:'editing'})` false | P2 | Manual |

### AC7 — "Learn More About Flex" Closes the Pay Bills Sheet

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | Click "Learn more about Flex" from picker → Pay Bills sheet closes, Flex modal opens | 1. TC-060 (Flex-qualifying picker visible) 2. Click "Learn more about Flex" | Pay Bills sheet closes (matches "Split my bill" behavior). Flex info modal opens | P0 | Yes |
| TC-071 | Dismissing Flex modal after TC-070 does NOT re-open Pay Bills | 1. TC-070 2. Close Flex modal | User lands on original page (Billing/Overview). Pay Bills sheet does NOT auto-reopen | P1 | Yes |
| TC-072 | Non-picker context — "Learn more about Flex" link (if present elsewhere) behavior unchanged | 1. On Billing page banner "Learn more" 2. Click | Existing behavior preserved (scope confirm with PM if changed) | P2 | Manual |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-080 | AC3 override creates ElectricAccount with overridden utility | `SELECT uc.name FROM "ElectricAccount" ea JOIN "UtilityCompany" uc ON uc.id = ea."utilityCompanyID" WHERE ea."cottageUserID" = '<uid>';` | Matches override param value (e.g. `CoServ`), NOT the TXDREG default for the ZIP | P0 |
| TC-081 | AC4 override via incomplete shortcode still attributes correctly | `SELECT mip.name FROM "Referrals" r JOIN "MoveInPartner" mip ON mip.id = r."referredBy" WHERE r.referred = '<uid>';` | Resolves to expected partner (or fallback Simpson) — no regression from ENG-2694 | P1 |
| TC-082 | AC5 Light flow still writes to `LightUsers` | `SELECT id, email FROM "LightUsers" WHERE email = '<email>';` | Row exists. `CottageUsers` does NOT have this email | P1 |
| TC-083 | AC5 Standard flow still writes to `CottageUsers` + accounts | Standard move-in creates CottageUser + ElectricAccount | Row count matches expected | P1 |
| TC-084 | `hasUtilityCompanyParams` context propagates through machine | Via Playwright `browser_evaluate` on move-in actor state | `state.context.hasUtilityCompanyParams === true` when URL has params | P2 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | AC1 red X state | Red X alone signals "invalid" but doesn't tell the user **why** Continue is disabled (unresolved ESI vs. search-in-flight vs. zod error are all red X) | User sees invalid state but not actionable reason — may retry identical input | Add subtle helper text below field: "Select an address from the list" when unresolved, vs. "Checking..." when searching |
| UX-002 | AC2 prefilled clear | Address silently disappears from field on page load if partial search fails | User may not notice the clear and think the page loaded broken | Add a tiny inline message ("We couldn't match your address — please re-enter") anchored near the input on first clear |
| UX-003 | AC3 override UX | URL param override is invisible — no user-facing indicator that a utility was preselected via URL | Partner (Mynd) user never learns which utility was chosen until confirmation screen | Surface utility company name on address page: "Service by CoServ" badge |
| UX-004 | AC6 no-footer state | Footer disappears entirely on picker screen — sheet feels partially-rendered on first frame | Perceived polish regression for Flex-qualifying users; may look like loading state | Keep footer height but hide buttons, OR add a subtle "Choose an option above" hint |
| UX-005 | AC7 Pay Bills sheet close | Clicking "Learn more about Flex" hard-closes the bill-pay sheet — user loses context if they dismiss Flex modal | User has to re-open Pay Bills modal to continue paying | Offer a "Back to Pay Bills" action from Flex modal close, OR keep Pay Bills sheet open behind the Flex modal |
| UX-006 | Video finding — CoServ/TXDREG split ZIPs | ZIP mapping defaults to TXDREG; partners must know to add `electricCompany=COSERV` URL param manually | Brittle — partners who forget the param route users to wrong utility, breaking onboarding email attribution | Add back-end ZIP-to-utility multi-mapping with scoring (CoServ 80% confidence mentioned in video already exists server-side) — prompt user in UI when confidence is split |
| UX-007 | AC1 on non-Light TX address (partial typed) | While user is still typing an ESI-eligible address, red X flashes between keystrokes as debounce resolves — can feel jittery | Perceived flakiness, may distract | Delay the red X by 300ms after the last keystroke (debounce matching the search debounce) |

> These are opportunities identified during test planning — the feature works as specified. File with `/log-bug` as `[IMPROVEMENT]` tickets after verifying in the live flow.

## Automation Plan

### Smoke (Regression1, Chromium)
- TC-004 (green check happy path — Light-matched TX address) — new small spec
- TC-050, TC-051, TC-052 (existing smoke specs — already covered)
- TC-060 + TC-061 (Flex picker footer hide/show) — new in payment POM
- TC-070 (Learn more closes sheet) — new

### Regression1 (Chromium)
- TC-001, TC-002, TC-003, TC-005, TC-009 (validation states — Next.js)
- TC-020, TC-021, TC-023 (prefilled clear behavior)
- TC-030, TC-031, TC-032, TC-033, TC-035, TC-036, TC-037 (override params)
- TC-040, TC-041 (incomplete shortcode + override)
- TC-054 (texas-flow bill upload regression)
- TC-062, TC-063, TC-064 (Pay Bills variants)
- TC-080, TC-082, TC-083 (DB assertions)

### Regression2 (TanStack — Firefox / alternate browser)
- TC-001, TC-004, TC-020, TC-030 repeated against **`BASE_URL=https://tanstack-dev.onepublicgrid.com`** — PR touches tanstack-main; validate parity

### Exploratory-only / Manual
- TC-024 (user recovers via "Can't find your address?" after clear)
- TC-066 (machine sub-state inspection)
- TC-072 (non-picker "Learn more" behavior)
- UX-001 through UX-007 (file improvements)

### Test Infrastructure Changes
- **MoveInPage POM**: add `Check_Address_Validation_State(state: 'valid' | 'invalid' | 'neutral')` helper inspecting the `isValid`/`isInvalid` indicator class or aria attribute on `LightAddressAutocomplete`
- **PayBillsModal POM**: add `Check_Footer_Visible(): Promise<boolean>` and `Check_Picker_Visible(): Promise<boolean>`; add `Click_Learn_More_About_Flex()`
- **New spec**: `tests/e2e_tests/cottage-user-move-in/encourage-conversion-workflows/address_validation_override.spec.ts` — covers AC1/AC3/AC4
- **New spec**: `tests/e2e_tests/cottage-user-move-in/standard-workflows/prefilled_address_clear.spec.ts` — covers AC2
- **New spec or extension**: `tests/e2e_tests/payment/pay_bill_flex_picker.spec.ts` — covers AC6/AC7
- **Existing spec to un-fixme**: `move_in_parameters.spec.ts` → "Move In Parameter TX Dereg New User Electric &/or Gas" describe block is currently `describe.fixme` — AC3 coverage suggests this can now be re-enabled (verify fixture behavior first)

## Risks & Notes

### Execution Risks
- **Dual-stack PR** — must regress on BOTH `dev.publicgrid.energy` AND `tanstack-dev.onepublicgrid.com`. TanStack has separate auth; Christian may need to re-create test users per env.
- **Merge-already-deployed** — PR merged 2026-04-17 02:28 UTC. Automated tests may already be breaking on dev if validation state assertions collide. Check CI first.
- **Feature-freeze override** — reduces confidence that full manual QA was done pre-merge. Elevated post-merge QA scrutiny warranted.

### Data Risks
- CoServ has NO `utilityCode` in `UtilityCompany` table (verified via Supabase query). AC3 URL param format for CoServ may rely on `name` matching or a different field — **verify during TC-030 setup**. If URL param doesn't resolve, it's either a doc gap OR a bug; log accordingly.
- TXDREG utility code also not present in UtilityCompany — existing `?electricCompany=TX-DEREG` tests are `test.describe.fixme`, suggesting param format for dereg utilities was never proven.

### Dependencies
- Mynd onboarding emails depend on correct partner + utility attribution post-move-in. TC-080 (ElectricAccount utility) + TC-081 (Referrals) are load-bearing for the business reason this PR shipped.
- ENG-2694 (Moved→Simpson attribution bug) is a known upstream issue — if it fires during testing, separate from ENG-2715.

### Open Questions
1. Does `?electricCompany=COSERV` use `UtilityCompany.name` or a separate code? Confirm before TC-030.
2. Should AC1 validation also apply on Light encouraged address (`light-encouraged-address.tsx`)? PR includes the file — confirm expected UI.
3. Is the `describe.fixme` block in `move_in_parameters.spec.ts` for TX-DEREG params resolvable now? Worth attempting to un-fixme during automation.

## Next Steps
1. Run smoke suite on dev (Chromium) post-merge to catch any existing test breakage from validation-state changes
2. `/exploratory-test` session covering AC1, AC2, AC3 on both Next.js and TanStack — capture screenshots of green check + red X + neutral states
3. `/log-bug` for any UX-001..UX-007 findings that merit improvement tickets
4. `/create-test` to scaffold new specs (address_validation_override, prefilled_address_clear, pay_bill_flex_picker)
5. Run regression suite across R1 + R2 once automated

---
*Generated by `/test-plan`. Feature spans Next.js + TanStack; PR already merged to dev. AC1/AC2/AC3 directly map to video walkthrough findings; AC6/AC7 are unrelated Pay Bills polish bundled into the same PR.*
