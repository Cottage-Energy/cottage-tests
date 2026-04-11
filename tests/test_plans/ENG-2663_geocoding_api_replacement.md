# Test Plan: Replace Google Places Text Search Pro with Geocoding API

## Overview
**Ticket**: ENG-2663
**PR**: [cottage-nextjs #1183](https://github.com/Cottage-Energy/cottage-nextjs/pull/1183) (MERGED to dev)
**Date**: 2026-04-08
**Tester**: Christian
**Created by**: Tomy Falgui
**Priority**: High

## Summary
`generatePreFilledAddress` in `apps/main/utils/addressComponentsFetcher.ts` was calling the Google Places Text Search Pro API (`places:searchText`) at ~$194/mo. It has been swapped to the Google Geocoding API (`geocode/json`) at ~$44/mo — a 78% cost reduction. The return shape is identical (`{ addressString, addressComponents }` with `Address` type), so no callers needed changes.

### What Changed
| Aspect | Before (Places Text Search Pro) | After (Geocoding API) |
|--------|--------------------------------|----------------------|
| Endpoint | `POST places.googleapis.com/v1/places:searchText` | `GET maps.googleapis.com/maps/api/geocode/json` |
| Response root | `data['places'][0]` | `data.results[0]` (with `data.status === 'OK'` check) |
| Component types | `shortText` / `longText` | `short_name` / `long_name` |
| Location bias | NYC (lat 40.7128, lng -74.006, 10km radius) | None (removed) |
| Region code | `regionCode: 'US'` | None (not supported by Geocoding API) |
| Street construction | Ternary with operator precedence bug | Clean `if/else if/else` chain |
| City fallback | `sublocality_level_1` > `locality` + `political` > address split | `sublocality_level_1` > `locality` |

### Callers (3 total)
| Caller | File | Flow | Notes |
|--------|------|------|-------|
| `generateAddressData` | `apps/main/app/move-in/utils/generate-address-data.ts` | Standard US move-in | Bypasses geocoding for Canada and Light encouraged conversion |
| `aggregateMovedData` / `aggregateFunnelData` | `apps/main/app/move-in/providers/aggregate-data.ts` | Partner pre-fill (Moved, Funnel) | Normalizes both destination and origin addresses |
| `getRegistrationPageData` | `apps/main/app/finish-registration/getRegistrationPageData.ts` | Finish registration | Pre-fills address from existing CottageUser record |

### DB Impact
- `Address` table: `googlePlaceID` (text, nullable) — should still be populated with a valid Google `place_id`
- All other address fields (`street`, `city`, `state`, `zip`, `country`) should be populated identically

## Scope

### In Scope
- Address normalization accuracy through the Geocoding API
- `googlePlaceID` population in the `Address` table
- All 3 caller paths: move-in, partner data, finish-registration
- Edge case addresses: sublocality cities (NYC boroughs), no street number, ambiguous addresses
- Standard move-in flow regression (functional completion)

### Out of Scope
- Canada addresses (bypass `generatePreFilledAddress` entirely — build address directly)
- Light encouraged conversion addresses (bypass `generatePreFilledAddress`)
- Google API billing verification (infra/cost concern, not functional)
- Partner API integration testing (Moved/Funnel partner APIs themselves)

### Prerequisites
- PR #1183 deployed to dev environment
- Test user accounts available for move-in flows
- Access to Supabase dev for DB verification

## Test Cases

### Happy Path — Standard Move-In
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Standard move-in with Google autocomplete address | 1. Go to `/move-in?shortCode=autotest` 2. Type a standard US address (e.g., "200 Park Ave, New York") and select from autocomplete 3. Complete full move-in flow | Move-in completes. `Address` record has correct street, city, state, zip, and a non-null `googlePlaceID` | P0 | Existing coverage |
| TC-002 | Move-in with address URL parameters | 1. Go to `/move-in?streetAddress=123+Main+St&city=Chicago&zip=60601` 2. Verify address fields pre-filled 3. Complete move-in flow | Address pre-fills correctly from URL params. Geocoding normalizes the address. `Address` record is accurate | P0 | Existing coverage |
| TC-003 | Move-in with shortCode + address params | 1. Go to `/move-in?shortCode=autotest&streetAddress=456+Oak+Ave&city=Boston&zip=02101` 2. Complete move-in flow | Address resolves correctly. Both shortcode building config and geocoded address are applied | P1 | Existing coverage |
| TC-004 | Move-in with utility company params + address params | 1. Go to `/move-in?electricCompany=CON-EDISON&streetAddress=789+Broadway&city=New+York&zip=10003` 2. Complete move-in flow | Utility assigned correctly. Address geocoded and stored with valid `googlePlaceID` | P1 | Existing coverage |

### Happy Path — Partner Pre-fill & Finish Registration
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-005 | Finish registration with existing address | 1. Trigger finish-reg via API (`POST api-dev.publicgrd.com/v1/test-partner/register`) 2. Open finish-reg URL from email 3. Verify address is pre-filled 4. Complete registration | Address pre-fills from existing CottageUser record via Geocoding API. `googlePlaceID` populated in `Address` table | P1 | Existing coverage |
| TC-006 | Partner (Moved) pre-fill with destination + origin addresses | 1. Use a Moved partner move-in link with address data 2. Verify destination address pre-fills 3. Complete move-in | Both destination and origin addresses normalized via Geocoding API. `Address` records have valid components | P2 | No (requires partner mock) |

### Edge Cases — Address Parsing
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | NYC borough address (sublocality_level_1) | 1. Move-in with address in Brooklyn, NY (e.g., "100 Flatbush Ave, Brooklyn, NY 11217") 2. Complete flow 3. Check DB | City resolves to "Brooklyn" (from `sublocality_level_1`, not "New York" from `locality`). `googlePlaceID` present | P1 | Exploratory |
| TC-011 | Standard city address (locality only) | 1. Move-in with address in Chicago (e.g., "233 S Wacker Dr, Chicago, IL 60606") 2. Check DB | City resolves to "Chicago" from `locality`. All fields correct | P1 | Exploratory |
| TC-012 | Address with no street number | 1. Move-in with an address that has only a route name (e.g., "Broadway, New York, NY 10001") 2. Check DB | Street should be the route name only (e.g., "Broadway"), not "undefined Broadway". City/state/zip correct | P1 | Exploratory |
| TC-013 | Address with no route (landmark/POI) | 1. Move-in with a landmark address (e.g., "Empire State Building, New York, NY") 2. Check DB | Street falls back to first part of `formatted_address` (before comma). `googlePlaceID` present | P2 | Exploratory |
| TC-014 | Ambiguous/partial address in URL params | 1. Go to `/move-in?streetAddress=123+Main&city=&zip=` 2. Observe behavior | Function returns `null` (generate-address-data.ts has `if (!streetAddress \|\| !zip) return null` guard). Address entry step shown normally | P2 | Exploratory |
| TC-015 | Non-existent address | 1. Move-in with an address that doesn't exist (e.g., "99999 Nonexistent Rd, Faketown, ZZ 00000") 2. Observe behavior | Geocoding API returns no results → function returns null. User fills in address manually. No crash | P2 | Exploratory |

### Edge Cases — Cross-Region & Special Characters
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-016 | Texas address (non-Light, non-encouraged) | 1. Move-in with TX address (e.g., "1234 Elm St, Dallas, TX 75201") WITHOUT Light/encouraged shortcode 2. Check DB | Address geocoded normally (not bypassed). `googlePlaceID` present. State = "TX" | P1 | Exploratory |
| TC-017 | Address with apartment/unit in street string | 1. Move-in with "200 Park Ave Apt 5B, New York, NY 10166" 2. Check DB | Street should be "200 Park Ave" (Geocoding strips unit). Unit captured separately in form | P2 | Exploratory |
| TC-018 | Address with special characters | 1. Move-in with address containing `#` (e.g., "100 Main St #4, Boston, MA 02101") 2. Check encoding and DB | `encodeURIComponent` handles `#`. Address resolves correctly | P2 | Exploratory |

### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Geocoding API returns no match | 1. Trigger `generatePreFilledAddress` with a completely invalid string 2. Observe | Returns `null`. Flow continues — user enters address manually | P1 | Exploratory |
| TC-021 | Verify bypass paths unaffected | 1. Canada move-in (`?country=ca&shortCode=pgtest`) 2. Light encouraged conversion (`?shortCode=txtest` + Light address) | Both bypass `generatePreFilledAddress` entirely. No geocoding call made. Address built from form input directly | P1 | Exploratory |

### Database Verification
| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-030 | googlePlaceID populated after move-in | After completing a standard move-in, query: `SELECT "googlePlaceID", street, city, state, zip FROM "Address" WHERE id = '<address_id>'` | `googlePlaceID` is non-null and starts with `ChIJ...` (standard Google place ID format). All address fields populated | P0 |
| TC-031 | Address components match expected values | Compare geocoded address fields against the input address for a known address (e.g., "200 Park Ave, New York, NY 10166") | street = "200 Park Avenue", city = "New York" or "Manhattan", state = "NY", zip = "10166" | P1 |
| TC-032 | No regression in existing Address records | Query recent `Address` records created after PR deployment: `SELECT "googlePlaceID", street, city, state, zip FROM "Address" ORDER BY "createdAt" DESC LIMIT 10` | All records have properly formatted fields. No nulls where values existed before (except known edge cases) | P1 |

### UX & Improvement Opportunities
| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Address pre-fill (URL params) | The old code had a `regionCode: 'US'` and NYC location bias. The new Geocoding API has neither. For very ambiguous addresses, results could differ from what users expect | Low — most addresses are unambiguous; callers provide full address strings | Consider adding `&region=us` to the Geocoding API URL for consistency (supported param) |
| UX-002 | Street name display | The old code had an operator precedence bug that could produce "123 undefined" as a street when `streetName` was missing. The new code properly falls back to `formatted_address` split | Positive improvement — no action needed | N/A — this is a fix, not a regression |
| UX-003 | City resolution for multi-borough cities | Both APIs use `sublocality_level_1` > `locality` for city. NYC addresses may show "Manhattan" or "Brooklyn" instead of "New York" depending on Google's response | Low — existing behavior, not a regression | Verify this behavior is consistent between old and new API for the same test addresses |

## Automation Plan
- **Smoke**: TC-001 — standard move-in (already covered by existing smoke tests that exercise address entry)
- **Regression**: TC-002, TC-003, TC-004 — already covered by existing `move_in_pre_filled.spec.ts` and `move_in_parameters.spec.ts`
- **Exploratory only**: TC-010 through TC-021 — address parsing edge cases are best verified interactively with DB checks since they test Geocoding API response variations, not UI behavior
- **DB verification**: TC-030, TC-031, TC-032 — run during exploratory session via Supabase MCP

## Risks & Notes
- **Risk: API response differences** — While the return shape is identical, the Geocoding API may parse address components differently from Places Text Search Pro for edge cases (e.g., which component is tagged as `sublocality_level_1` vs `locality`). This is the primary risk to validate.
- **Risk: Removed location bias** — The old code biased toward NYC. Removing this shouldn't matter since callers provide full address strings, but worth verifying for ambiguous addresses.
- **Low risk: `place_id` format** — Both APIs return Google `place_id` values. They should be identical for the same address, but verify.
- **Mitigation**: Existing e2e tests in `move_in_pre_filled.spec.ts` and `move_in_parameters.spec.ts` cover the primary move-in paths and will catch any functional regressions. Exploratory testing focuses on address parsing accuracy via DB verification.

## Exploratory Session Plan
1. **Standard move-in** — complete a move-in with a known address, verify DB
2. **NYC borough** — test Brooklyn/Manhattan addresses for city resolution
3. **No street number** — test address with only route name
4. **Texas non-Light** — verify standard TX address goes through geocoding
5. **URL params edge cases** — partial/missing params
6. **Finish registration** — verify pre-fill path works
7. **Compare old vs new** — if any existing users have Address records, compare format
