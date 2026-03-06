# Test Plan: Light Address Searching Revamped

## Overview
**Ticket**: [ENG-2347](https://linear.app/public-grid/issue/ENG-2347/task-light-address-searching-revamped)
**PR**: [cottage-nextjs#1036](https://github.com/Cottage-Energy/cottage-nextjs/pull/1036) (MERGED — 34 files, +2375/−945)
**Date**: 2026-03-03
**Tester**: Christian

## Summary

| Category | Test Cases | P0 | P1 | P2 | Automate | Exploratory |
|----------|-----------|----|----|----|---------:|------------:|
| Fallback Modal (AC1–AC3) | TC-001 – TC-006 | 3 | 3 | 0 | 5 | 1 |
| Confirmation Modal / ESID (AC3, AC5) | TC-010 – TC-016 | 4 | 3 | 0 | 5 | 2 |
| "Can't Find" on Google (AC4) | TC-020 | 0 | 1 | 0 | 0 | 1 |
| Gate Logic | TC-030 – TC-038 | 1 | 5 | 3 | 5 | 4 |
| Full-Address-Search API | TC-040 – TC-045 | 0 | 3 | 3 | 2 | 4 |
| AC7 Specific Address | TC-050 | 1 | 0 | 0 | 1 | 0 |
| UI / Visual (AC6) | TC-060 – TC-061 | 0 | 2 | 0 | 0 | 2 |
| Regression (Existing Flows) | TC-070 – TC-073 | 2 | 1 | 0 | 3 | 0 |
| **[GAP]** Valid shortCode × Pre-fill State | TC-080 – TC-083 | 1 | 2 | 1 | 3 | 1 |
| **[GAP]** Valid shortCode + encouragedConversion × Pre-fill State | TC-090 – TC-093 | 1 | 2 | 1 | 3 | 1 |
| **[GAP]** Non-valid shortCode × Pre-fill State | TC-100 – TC-103 | 1 | 2 | 1 | 2 | 2 |
| **[GAP]** No shortCode × Pre-fill State | TC-110 – TC-113 | 1 | 2 | 1 | 3 | 1 |
| **Totals** | **61** | **15** | **26** | **10** | **32** | **17** |

## Scope

### In Scope
- "Can't find your address" fallback modal (Light → Google autocomplete)
- Address confirmation modal (ESID matching on submit)
- Gate logic for `shouldUseLightAddressAutocomplete`
- Updated `POST /api/light/full-address-search` API logic (unit number handling)
- Both encouraged-conversion and standard address inputs
- Two-modal sequence (fallback modal → confirmation modal)

### Out of Scope
- Light.dev API correctness (third-party)
- Full move-in completion beyond address step (payment, SSN, etc.)
- PostHog experiment for plan benchmarks (covered in ENG-2355)
- Transfer/move-out flows (separate feature)

### Prerequisites
- Texas zip codes: 75201 (Dallas), 77001 (Houston), 78701 (Austin), or 77346 (Humble)
- Known ESID-yielding address: `14100 Will Clayton Pkwy, Humble, TX 77346` with unit `21308`
- Building shortcodes with TX-DEREG / LIGHT company assignments (e.g., `autotest`)
- Building shortcodes without company IDs for fallback gate logic testing
- Non-TX zip codes and non-eligible TX zips for negative gate logic tests

## Test Cases

### "Can't Find Your Address" Fallback Modal (AC1–AC3)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Fallback modal opens from Light search | Light address autocomplete active (TX-DEREG building) | 1. Navigate to `/move-in?shortCode=<tx-dereg-building>` 2. Click "Can't find your address? We are here to help." | Modal opens with fields: Address Line, Unit, City, State/Province, Zip. Google autocomplete is active on Address Line | P0 | Yes |
| TC-002 | Google autocomplete fills individual fields | Fallback modal open | 1. Type a TX address in Address Line 2. Select from Google dropdown | City, State, Zip are pre-filled from Google result. Address Line shows selected street address | P0 | Yes |
| TC-003 | Address components preserved on Next | Fallback modal with address filled | 1. Select Google address 2. Click "Next" | Correct address components (street, city, state, zip) are carried forward to the next step | P0 | Yes |
| TC-004 | googlePlaceID nulled on manual edit | Fallback modal with Google-selected address | 1. Select Google address 2. Manually edit City or Zip field 3. Click "Next" | `googlePlaceID` is null (no Google place ID passed) since user modified the auto-filled result | P1 | Exploratory |
| TC-005 | Manual entry without Google match | Fallback modal open | 1. Type full address manually (no Google selection) 2. Fill City, State, Zip manually 3. Click "Next" | Address accepted without Google match. No `googlePlaceID` passed. Flow continues normally | P1 | Yes |
| TC-006 | ESID shown in fallback modal | Fallback modal, address with valid ESID | 1. Enter `14100 Will Clayton Pkwy, Humble, TX 77346` with unit `21308` 2. Observe bottom of modal | ESID is displayed at the bottom of the modal | P1 | Yes |

### Address Confirmation Modal — ESID Matching (AC3, AC5)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Confirmation modal appears (from fallback) | In fallback modal, address has valid ESID | 1. Enter TX address with ESID in fallback modal 2. Click "Next" | Fallback modal closes. Brief spinner. Confirmation modal opens: "You entered [X]. We found [Y] with ESID [Z]. Does this match?" | P0 | Yes |
| TC-011 | Confirmation "Yes" → Light flow | Confirmation modal visible | 1. Click "Yes" on confirmation modal | User is redirected to Light/TX-dereg move-in flow with the matched ESID | P0 | Yes |
| TC-012 | Confirmation "No" → Normal flow | Confirmation modal visible | 1. Click "No / Keep what I entered" on confirmation modal | Confirmation modal dismissed. User proceeds through regular sign-up flow (service zip territory matching) | P0 | Yes |
| TC-013 | Confirmation modal appears (from Google search) | Google address search (non-Light), TX address with ESID | 1. Enter TX address that has an ESID in Google search 2. Click "Next" | Confirmation modal pops up with matched address and ESID. "Yes" → Light flow, "No" → normal flow | P0 | Yes |
| TC-014 | No confirmation modal — 0 ESID results | TX address, no matching ESID | 1. Enter TX address that does not match any Light ESID 2. Click "Next" | No confirmation modal. Flow continues through regular sign-up | P1 | Yes |
| TC-015 | No confirmation modal — 2+ ESID results | TX address, ambiguous match | 1. Enter TX address that returns multiple ESID matches 2. Click "Next" | No confirmation modal. Flow continues through regular sign-up | P1 | Exploratory |
| TC-016 | No confirmation modal — non-TX address | Non-TX address | 1. Enter a non-TX address (e.g., CA) 2. Click "Next" | No Light full-address-search triggered. No confirmation modal. Regular flow | P1 | Yes |

### "Can't Find" on Google Search (AC4)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | "Can't find" opens chat in Google mode | Google address search active (non-TX or non-Light building) | 1. Navigate to `/move-in` with non-Light building 2. Click "Can't find your address? We are here to help." | Support chat opens (no modal). This is distinct from the Light search behavior | P1 | Exploratory |

### Gate Logic — `shouldUseLightAddressAutocomplete` (Section 3)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | ShortCode + TX-DEREG company → Light enabled | Building with `electricCompanyID` = TX-DEREG | 1. Navigate to `/move-in?shortCode=<building>` | Light address autocomplete is active (type-ahead search, not Google) | P0 | Yes |
| TC-031 | ShortCode + LIGHT company → Light enabled | Building with `electricCompanyID` = LIGHT | 1. Navigate to `/move-in?shortCode=<building>` | Light address autocomplete is active | P1 | Yes |
| TC-032 | ShortCode + non-TX company → Google | Building with `electricCompanyID` = BGE (non-TX) | 1. Navigate to `/move-in?shortCode=<building>` | Google address autocomplete is active (not Light) | P1 | Yes |
| TC-033 | ShortCode + no company IDs + TX zip eligible → Light | Building with no company IDs, state=TX, zip eligibility > 0.5 | 1. Navigate to `/move-in?shortCode=<building>` with TX GUID/params | Light address autocomplete is active | P1 | Exploratory |
| TC-034 | ShortCode + no company IDs + TX zip ineligible → Google | Building with no company IDs, state=TX, zip eligibility ≤ 0.5 | 1. Navigate to `/move-in?shortCode=<building>` with low-eligibility TX zip | Google address autocomplete is active | P2 | Exploratory |
| TC-035 | No shortCode + TX state + eligible zip → Light | No shortCode, state=TX, eligible zip in query params | 1. Navigate to `/move-in?state=TX&zipCode=<eligible>` | Light address autocomplete is active | P1 | Yes |
| TC-036 | No shortCode + TX state + no zip → Google (default false) | No shortCode, state=TX, no zip code available | 1. Navigate to `/move-in?state=TX` (no zip) | Google autocomplete is active. Light confirmation on submit still possible | P2 | Exploratory |
| TC-037 | No shortCode + non-TX state → Google | No shortCode, state=CA | 1. Navigate to `/move-in?state=CA&zipCode=90001` | Google address autocomplete is active | P1 | Yes |
| TC-038 | Parameter-based TX-DEREG → Light | No shortCode, `electricCompany=TX-DEREG` parameter | 1. Navigate to `/move-in?electricCompany=TX-DEREG` | Light address autocomplete is active | P1 | Yes |

### Full-Address-Search API Logic (Section 4)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | No unit — exactly 1 result → returns data | TX address without unit number | 1. Submit address without unit 2. API runs full-address-search | Single ESID returned. Confirmation modal shows matched address | P1 | Yes |
| TC-041 | No unit — 0 results → returns null | TX address with no Light match | 1. Submit address without unit, no match | API returns null. No confirmation modal. Regular flow continues | P1 | Exploratory |
| TC-042 | No unit — 2+ results → returns null | TX address with multiple matches | 1. Submit ambiguous address (e.g., street without number) | API returns null. No confirmation modal | P2 | Exploratory |
| TC-043 | With unit — ESI IDs don't overlap → correct result | TX address with unit that has unique ESID | 1. Enter `14100 Will Clayton Pkwy` with unit `21308` | API reconciles APT-prefixed and raw unit searches. Returns correct single ESID | P1 | Yes |
| TC-044 | With unit — ESI ID overlaps main building → null (push to type-ahead) | TX address with unit whose ESID matches main building | 1. Submit address with unit that overlaps building ESID | API returns null (disambiguation needed). User pushed to Light type-ahead search | P2 | Exploratory |
| TC-045 | With unit — both raw and APT return different data → ambiguous | TX address with unit, conflicting results | 1. Submit address where raw and APT-prefixed unit return different ESIDs | API returns empty array. No confirmation modal | P2 | Exploratory |

### Specific Address Verification (AC7)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-050 | AC7 address yields ESID in Google search | Google address search active | 1. Enter `14100 Will Clayton Pkwy Humble, TX 77346, USA` 2. Add unit `21308` 3. Click "Next" | Address returns a valid ESID. Confirmation modal appears with the matched ESID | P0 | Yes |

### UI / Visual (AC6)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-060 | Fallback modal UI matches design | Light search active | 1. Open "Can't find your address" modal 2. Compare to AC6 screenshot in ticket | Modal layout, field arrangement, and styling match the design mockup | P1 | Exploratory |
| TC-061 | Confirmation modal UI is clear | Confirmation modal visible | 1. Trigger confirmation modal 2. Verify content | Shows user-entered address, Light-found address, ESID. "Yes" and "No" buttons clearly labeled | P1 | Exploratory |

### Regression — Existing Flows

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-070 | Existing shortCode flow still works (non-TX) | Building with BGE (non-TX) | 1. Run existing `move_in_shortcode.spec.ts` test for BGE shortcode | Test passes. No unexpected confirmation modal | P0 | Yes (existing) |
| TC-071 | Existing TX-DEREG parameter flow still works | `electricCompany=TX-DEREG` parameter | 1. Run existing `move_in_parameters.spec.ts` TX-DEREG tests | Tests pass. If confirmation modal now appears, tests handle it correctly | P0 | Yes (update existing) |
| TC-072 | Existing encouraged-conversion flow still works | Encouraged-conversion building | 1. Run `move_in_via_bldg_shortcode.spec.ts` | Test passes with any new modal interactions handled | P0 | Yes (update existing) |
| TC-073 | Service zip flow unaffected for non-TX | Non-TX service zip | 1. Run `move_in_new_service_zip_user.spec.ts` | Test passes. No gate logic interference | P1 | Yes (existing) |

---

> **Gap Coverage Note**: The sections below (TC-080 – TC-113) were added to fill the shortCode validity × pre-filled address state matrix that was unaddressed in the original plan. Each group tests how the address search initialises when a value is already present in the address field on page load — behaviour that differs meaningfully from the empty-field path.

### [GAP] Valid shortCode × Pre-filled Address State (TC-080 – TC-083)

**Context**: A valid TX-DEREG/LIGHT shortCode causes Light autocomplete to activate. These tests verify that the initial address field state (empty, normal, valid Light, or ineligible Light) is handled correctly on load and does not silently skip validation or incorrectly gate the user.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-080 | Valid shortCode — no pre-filled address → Light search active, empty field | Building with `electricCompanyID` = TX-DEREG or LIGHT | 1. Navigate to `/move-in?shortCode=<tx-dereg-building>` with no address query params | Light autocomplete is active. Address field is empty. User can type to search normally | P0 | Yes |
| TC-081 | Valid shortCode — pre-filled normal address → displayed, not auto-confirmed | Same building; normal (non-Light-eligible) address in query params (e.g. `address=123+Main+St,+Boston,+MA`) | 1. Navigate to `/move-in?shortCode=<tx-dereg-building>&address=<normal-address>` | Light autocomplete is active. Pre-filled address is shown in the field. No confirmation modal fires automatically. Full-address-search is not triggered until the user submits | P1 | Yes |
| TC-082 | Valid shortCode — pre-filled valid Light address → confirmation modal offered on load | Same building; ESID-yielding TX address in query params (e.g. `14100 Will Clayton Pkwy, Humble, TX 77346`) | 1. Navigate to `/move-in?shortCode=<tx-dereg-building>&address=<esid-address>&unit=21308` | Pre-filled address is populated. Full-address-search fires (or is triggered on first render). Confirmation modal appears prompting the user to accept the matched ESID address | P1 | Yes |
| TC-083 | Valid shortCode — pre-filled non-valid eligible Light address → no confirmation modal, Light search active | Same building; TX address that is eligible (correct zip) but returns 0 ESID results | 1. Navigate to `/move-in?shortCode=<tx-dereg-building>&address=<tx-no-esid-address>` | Pre-filled address shown. Full-address-search returns null. No confirmation modal fires. Light autocomplete remains available for the user to refine the address | P2 | Exploratory |

### [GAP] Valid shortCode + encouragedConversion === true × Pre-filled Address State (TC-090 – TC-093)

**Context**: `encouragedConversion` buildings present a slightly different UI flow. These tests confirm that the encouragedConversion path handles pre-filled address states the same way as the standard path — specifically that the confirmation modal and Light gate still behave correctly.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-090 | encouragedConversion shortCode — no pre-filled address → Light active, empty field | Building with `encouragedConversion = true` and TX-DEREG/LIGHT company ID | 1. Navigate to `/move-in?shortCode=<encouraged-building>` | Light autocomplete active. Address field empty. encouragedConversion UI elements visible (e.g. promotional copy). No unexpected modal | P0 | Yes |
| TC-091 | encouragedConversion shortCode — pre-filled normal address → shown, no auto-confirmation | Same building; non-TX or non-ESID address in query params | 1. Navigate to `/move-in?shortCode=<encouraged-building>&address=<normal-address>` | Pre-filled address displayed in field. No confirmation modal on load. encouragedConversion UI unaffected. User can edit or proceed | P1 | Yes |
| TC-092 | encouragedConversion shortCode — pre-filled valid Light address → confirmation modal offered | Same building; valid ESID-yielding TX address in query params | 1. Navigate to `/move-in?shortCode=<encouraged-building>&address=<esid-address>&unit=21308` | Confirmation modal appears with matched ESID. "Yes" → Light flow with encouragedConversion context preserved. "No" → regular sign-up, encouragedConversion context preserved | P1 | Yes |
| TC-093 | encouragedConversion shortCode — pre-filled non-valid eligible Light address → no modal, search active | Same building; TX-eligible address with no ESID in query params | 1. Navigate to `/move-in?shortCode=<encouraged-building>&address=<tx-no-esid-address>` | No confirmation modal. Light autocomplete active. Pre-filled address shown. encouragedConversion UI intact | P2 | Exploratory |

### [GAP] Non-valid shortCode × Pre-filled Address State (TC-100 – TC-103)

**Context**: A shortCode that does not correspond to any building (typo, deleted record, wrong env) should fail gracefully. These tests verify that invalid shortCodes do not cause unhandled errors and fall back to a safe default state regardless of what address is pre-filled.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-100 | Non-valid shortCode — no pre-filled address → graceful fallback | Use a shortCode that does not exist in the database (e.g. `shortCode=INVALID_XYZ`) | 1. Navigate to `/move-in?shortCode=INVALID_XYZ` | No JS error or crash. Page loads with a sensible fallback — either Google autocomplete or an error state. No Light gate triggered | P0 | Yes |
| TC-101 | Non-valid shortCode — pre-filled normal address → shown, no Light gate | Same invalid shortCode; normal address in query params | 1. Navigate to `/move-in?shortCode=INVALID_XYZ&address=<normal-address>` | Page loads. Pre-filled address shown (or cleared). Google autocomplete active (fallback). No confirmation modal. No Light-specific behaviour | P1 | Yes |
| TC-102 | Non-valid shortCode — pre-filled valid Light address → no confirmation modal triggered | Same invalid shortCode; ESID-yielding TX address in query params | 1. Navigate to `/move-in?shortCode=INVALID_XYZ&address=<esid-address>&unit=21308` | Page loads without error. Because the shortCode is invalid, Light gate is off. No full-address-search fired. No confirmation modal. Google autocomplete shown | P1 | Exploratory |
| TC-103 | Non-valid shortCode — pre-filled non-valid eligible Light address → no Light behaviour | Same invalid shortCode; TX-eligible no-ESID address in query params | 1. Navigate to `/move-in?shortCode=INVALID_XYZ&address=<tx-no-esid-address>` | Same as TC-102: no Light gate, no ESID lookup, Google autocomplete, no modal | P2 | Exploratory |

### [GAP] No shortCode × Pre-filled Address State (TC-110 – TC-113)

**Context**: When there is no shortCode the gate is determined purely by state/zip params. These tests confirm that pre-filled address query params are surfaced correctly in the field and that the Light/Google decision plus confirmation modal logic is not disrupted by the presence of pre-filled data.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-110 | No shortCode — no pre-filled address, TX eligible zip → Light active, empty field | No shortCode; `state=TX&zipCode=<eligible-zip>` only | 1. Navigate to `/move-in?state=TX&zipCode=77346` | Light autocomplete active. Address field empty. Matches and extends TC-035 with an explicit assertion that the field starts empty | P0 | Yes |
| TC-111 | No shortCode — pre-filled normal address, TX eligible zip → shown, no auto-confirmation | No shortCode; TX eligible zip; non-ESID address in params | 1. Navigate to `/move-in?state=TX&zipCode=77346&address=<normal-address>` | Light autocomplete active. Pre-filled normal address shown in field. No confirmation modal on load. Full-address-search not triggered until user submits | P1 | Yes |
| TC-112 | No shortCode — pre-filled valid Light address, TX eligible zip → confirmation modal offered | No shortCode; TX eligible zip; ESID-yielding address in params | 1. Navigate to `/move-in?state=TX&zipCode=77346&address=14100+Will+Clayton+Pkwy&unit=21308` | Pre-filled address populated. Full-address-search returns single ESID. Confirmation modal appears. "Yes" → Light flow; "No" → normal flow | P1 | Yes |
| TC-113 | No shortCode — pre-filled non-valid eligible Light address, TX eligible zip → no modal | No shortCode; TX eligible zip; TX address that returns 0 ESIDs | 1. Navigate to `/move-in?state=TX&zipCode=77346&address=<tx-no-esid-address>` | Pre-filled address shown. Full-address-search returns null. No confirmation modal. Light autocomplete available for user to refine | P2 | Exploratory |

## Automation Plan

| Suite | Test Cases | Notes |
|-------|-----------|-------|
| **Smoke** | TC-001, TC-010, TC-011, TC-013, TC-050 | Core modal flows — must work every deploy |
| **Regression** | TC-002, TC-003, TC-005, TC-006, TC-012, TC-014, TC-016, TC-030, TC-032, TC-035, TC-037, TC-038, TC-040, TC-043 | Full coverage of original automatable scenarios |
| **Gap — Smoke** | TC-080, TC-090, TC-100, TC-110 | One no-pre-fill baseline per shortCode group |
| **Gap — Regression** | TC-081, TC-082, TC-091, TC-092, TC-101, TC-111, TC-112 | Pre-filled normal and valid Light address paths |
| **Exploratory only** | TC-004, TC-015, TC-020, TC-033, TC-034, TC-036, TC-041, TC-042, TC-044, TC-045, TC-060, TC-061, TC-083, TC-093, TC-102, TC-103, TC-113 | Require manual inspection, network manipulation, or DB-specific setup |
| **Update existing** | TC-071, TC-072 | Existing TX-DEREG tests need to handle the new confirmation modal |

### New artifacts needed
- **Page objects**: Address confirmation modal, "Can't find your address" fallback modal (new locators in `move_in_page.ts`)
- **Test data**: TX eligible zip codes, ESID-yielding addresses, buildings with/without company IDs, invalid shortCodes, pre-fill address query param fixtures
- **Spec files**: New spec in `tests/e2e_tests/cottage-user-move-in/ui/` for modal interactions; new spec for shortCode × pre-fill matrix
- **Fixture updates**: May need helper to handle the confirmation modal (Yes/No) as reusable step; helper to construct URLs with address/unit query params

### Locators to add (move_in_page.ts)
- Fallback modal container
- Fallback modal Address Line, Unit, City, State, Zip fields
- Fallback modal "Next" button
- Confirmation modal container ("You entered X, we found Y")
- Confirmation modal "Yes" button
- Confirmation modal "No / Keep what I entered" button
- ESID display element in fallback modal

## Risks & Notes
- **Existing test breakage**: The confirmation modal now appears on TX-DEREG flows that previously went straight through. Existing tests in `move_in_shortcode.spec.ts` (COSERV) and `move_in_parameters.spec.ts` (TX-DEREG) will likely fail if they don't handle the new modal → run these first to assess impact
- **Light API availability**: Tests depend on Light.dev API being accessible in the test environment. ESID lookups may fail if the API is down
- **Google autocomplete in CI**: Google address autocomplete requires a valid API key and may behave differently in headless/CI environments
- **Two-modal sequence timing**: The fallback → spinner → confirmation sequence may have timing issues. Need appropriate waits between modals
- **`address-autocomplete.tsx` had 125 lines deleted**: The Google autocomplete component was significantly simplified — verify that non-TX Google flows still work correctly
- **`Move_In_Cannot_Find_Address_Link` locator** already exists in POM but the behavior behind it changed completely (modal vs. inline message)
- **Pre-fill address query param format**: Confirm whether the app reads address state from query params, URL segments, or sessionStorage before automating TC-081–083, TC-091–093, TC-111–113. If there is no supported pre-fill mechanism, these cases become exploratory
- **Invalid shortCode behaviour is undefined in the spec**: TC-100–103 assume a graceful fallback to Google autocomplete; verify the actual error handling path in the app before writing assertions
- **On-load ESID lookup timing**: TC-082, TC-092, TC-112 assume the full-address-search fires automatically when a pre-filled address is detected. If the search only fires on explicit user submit, the confirmation modal will not appear on load — adjust expected results accordingly
