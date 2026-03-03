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
| **Totals** | **45** | **11** | **18** | **6** | **21** | **14** |

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

## Automation Plan

| Suite | Test Cases | Notes |
|-------|-----------|-------|
| **Smoke** | TC-001, TC-010, TC-011, TC-013, TC-050 | Core modal flows — must work every deploy |
| **Regression** | TC-002, TC-003, TC-005, TC-006, TC-012, TC-014, TC-016, TC-030, TC-032, TC-035, TC-037, TC-038, TC-040, TC-043 | Full coverage of automatable scenarios |
| **Exploratory only** | TC-004, TC-015, TC-020, TC-033, TC-034, TC-036, TC-041, TC-042, TC-044, TC-045, TC-060, TC-061 | Require manual inspection, network manipulation, or DB-specific setup |
| **Update existing** | TC-071, TC-072 | Existing TX-DEREG tests need to handle the new confirmation modal |

### New artifacts needed
- **Page objects**: Address confirmation modal, "Can't find your address" fallback modal (new locators in `move_in_page.ts`)
- **Test data**: TX eligible zip codes, ESID-yielding addresses, buildings with/without company IDs
- **Spec files**: New spec in `tests/e2e_tests/cottage-user-move-in/ui/` for modal interactions
- **Fixture updates**: May need helper to handle the confirmation modal (Yes/No) as reusable step

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
