# Test Plan: ENG-2687 — Moved Direct to Consumer API

## Overview
**Ticket**: ENG-2687
**Source**: Notion PDF "Moved Direct to Consumer" (attached) + live API probing on `https://api-dev.publicgrd.com/v1/`
**Date**: 2026-04-14
**Tester**: Christian

Two new API v1 endpoints power the Moved Personal Dashboard integration:
1. **GET `/v1/utilities/availability/{zip}`** — partner queries available utilities + `pgEnabled` flag for a zip
2. **POST `/v1/moved/embed`** — partner POSTs resident + property data; PG returns a pre-formatted iframe URL pointing at the encouraged-conversion move-in flow with `shortCode=moved`

Authentication for both: `Authorization: Bearer <API key>`.

## Scope

### In Scope
- API contract validation (request/response shape, status codes, validation rules)
- Authentication enforcement (missing token, invalid token, valid token)
- Happy path: full payload → embed URL → iframe loads `/move-in?shortCode=moved&...` with prefilled fields
- Edge cases: minimal payload, missing optional fields, special chars, large payloads
- Response data semantics: `pgEnabled`, `isPrimaryUtility`, `phone`, `website`
- Cross-zip behavior: NY (Con Edison), TX (TX-DEREG), LA (LA-DWP `pgEnabled=false`), Casper WY (waitlist secondary providers)
- URL parameter encoding (special chars, `internalID` → `leaseID`)
- Iframe embed: postMessage on completion, prefill rendering in move-in flow
- Spec/doc accuracy verification

### Out of Scope
- The full Moved encouraged-conversion move-in flow itself (covered by existing move-in tests + ENG-2588 partner shortcode coverage)
- Backend rate limiting / throttling (no documented limits; flag if discovered)
- Webhook callbacks (not in spec)
- Production smoke (dev only, per Read-Only Source of Truth Rule)

### Prerequisites
- `MOVED_API_KEY` env var (currently `9sBpLum1O5J9nn1HuVitFnNhLNeVOdiw` — sample dev key from ticket; confirm canonical name with backend before merging)
- Test email pattern: `pgtest+moved-api-{suffix}-{ts}@joinpublicgrid.com`
- For iframe/UI verification: ability to load embed URL in Playwright browser
- Future-dated `moveInDate` (≥ today) for happy path

## Spec-vs-Reality Findings (from probing)

| # | Type | Doc says | Reality | Severity |
|---|------|----------|---------|----------|
| D1 | DOC | sample curl: `/api/v1/moved/embed` | `/api/v1/...` returns 404; `/v1/...` works | High (blocks integration) |
| D2 | DOC | URL params `street`, `unit` | Real params `streetAddress`, `unitNumber` | High (Moved would ignore prefill) |
| D3 | DOC | `https://onepublicgrid.com/movein?...` | `https://dev.onepublicgrid.com/move-in?...` (env-specific host + hyphen) | Medium |
| D4 | DOC | `internalID` "optional, future use" | Returned as `leaseID` URL param | Low (undocumented) |
| D5 | DOC | LA-DWP example shows `pgEnabled=true` | LA-DWP returns `pgEnabled=false` in dev | Low (misleading example) |
| D6 | DOC | `website` is URL string | `website` returns `""` for known utilities | Medium |
| D7 | DOC | `resident` subfields all "Required: No" | `resident` object itself is required | Medium |
| D8 | DOC | "no providers returned = not in coverage" | Out-of-coverage zips return providers with `isPrimaryUtility=false` | Medium |
| B1 | API | "moveInDate cannot be more than 3 days in the past" | `-4 days` succeeds, `-30 days` rejected — boundary unclear | Medium |
| B2 | API | "phone digits only, no formatting" | `(555) 123-4567` accepted, URL-encoded into embed URL | Low |
| B3 | API | (no doc) | No `maxLength` — 1000-char `firstName` accepted | Low (security/UX) |
| B4 | API | (no doc) | SQL/XSS strings accepted (URL-encoded only) | Medium |
| B5 | UX  | (no doc) | Validation reports first failing field only, not all | Improvement |
| B6 | DOC | (no doc) | Canada flow (`country=ca`) not covered by spec | Improvement |

## Test Cases

### Endpoint 1: GET /v1/utilities/availability/{zip}

#### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-A01 | NY zip returns Con Edison `pgEnabled=true` | GET `/v1/utilities/availability/10001` w/ valid Bearer | 200; `utilityProviders[0]` = `{isPrimaryUtility:true, pgEnabled:true, utilityCompanyID:'CON-EDISON', utilityCompanyName:'Con Edison'}` | P0 | Yes |
| TC-A02 | TX zip returns TX-DEREG primary | GET `/v1/utilities/availability/75063` w/ valid Bearer | 200; `utilityCompanyID:'TX-DEREG'`, `pgEnabled:true` | P1 | Yes |
| TC-A03 | LA zip returns LA-DWP `pgEnabled=false` | GET `/v1/utilities/availability/90210` w/ valid Bearer | 200; `LA-DWP` with `pgEnabled:false` (signals partner to show fallback) | P1 | Yes |
| TC-A04 | Out-of-coverage zip returns secondary-only providers | GET `/v1/utilities/availability/82609` (Casper WY) | 200; all returned providers have `isPrimaryUtility:false` (= waitlist signal) | P2 | Yes |

#### Validation
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-A10 | 4-digit zip rejected | GET `/v1/utilities/availability/1000` | 400; FST_ERR_VALIDATION; "Too small: expected string to have >=5 characters" | P1 | Yes |
| TC-A11 | 6-digit zip rejected | GET `/v1/utilities/availability/100012` | 400; "Too big: expected string to have <=5 characters" | P1 | Yes |
| TC-A12 | Extended zip (90210-2111) rejected | GET `/v1/utilities/availability/90210-2111` | 400; "Too big: ...<=5 characters" | P2 | Yes |
| TC-A13 | Non-numeric zip rejected | GET `/v1/utilities/availability/abc` | 400; "Too small: ...>=5 characters" (or numeric-format error) | P2 | Yes |
| TC-A14 | All-zeros zip | GET `/v1/utilities/availability/00000` | Either 200 with empty providers, or 400 with clear message | P3 | Yes |

#### Authentication
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-A20 | Missing Authorization header | GET `/v1/utilities/availability/10001` (no header) | 401; `{error:"missing authorization header"}` | P0 | Yes |
| TC-A21 | Invalid Bearer token | GET `/v1/utilities/availability/10001` w/ `Bearer invalid_xyz` | 401; `{error:"invalid authorization header"}` | P0 | Yes |
| TC-A22 | Token without `Bearer ` prefix | GET w/ `Authorization: 9sBp...` (raw key) | 401 | P2 | Yes |

#### HTTP Methods
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-A30 | POST not allowed | POST `/v1/utilities/availability/10001` | 404 or 405 | P3 | Yes |

#### Response Schema
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-A40 | Response schema shape | TC-A01 | Each provider has exactly: `isPrimaryUtility` (bool), `pgEnabled` (bool), `utilityCompanyID` (string), `utilityCompanyName` (string), `phone` (string\|null), `website` (string) | P1 | Yes |
| TC-A41 | `phone` field consistency | TC-A01..A04 | `phone` is `null` or string; not `undefined` | P2 | Yes |
| TC-A42 | `website` field — non-empty when known | TC-A01 (Con Edison) | Currently `""` → flag as **Doc bug D6** if still empty | P2 | Yes (assertion will fail until D6 fixed) |

---

### Endpoint 2: POST /v1/moved/embed

#### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E01 | Full payload returns embed URL | POST with full resident + property + future moveInDate | 200; `embedURL` matches `https://dev.onepublicgrid.com/move-in?shortCode=moved&leaseID=...&firstName=...&zip=...` with all fields URL-encoded | P0 | Yes |
| TC-E02 | Minimal valid payload (just resident:{} + zip) | POST `{resident:{}, property:{zip:"10001"}}` | 200; `embedURL` = `.../move-in?shortCode=moved&zip=10001` | P0 | Yes |
| TC-E03 | `isTransfer=true` returns embed URL | POST with `isTransfer:true` + resident + zip | 200; embed URL still resolves to move-in flow (verify if URL differs from default — flag if no transfer signal in URL) | P1 | Yes |
| TC-E04 | `internalID` mapped to `leaseID` URL param | POST with `resident.internalID:"user_12345"` | 200; URL contains `leaseID=user_12345` (NOT `internalID`) | P1 | Yes |
| TC-E05 | Embed URL params use `streetAddress`/`unitNumber` | POST with property `street:"123 Main St", unitNumber:"4B"` | 200; URL contains `streetAddress=123+Main+St` and `unitNumber=4B` (per Doc bug D2) | P1 | Yes |
| TC-E06 | Special chars in name URL-encoded | POST with `firstName:"Jean-Luc O'Brien"` | 200; URL has `firstName=Jean-Luc+O%27Brien` | P2 | Yes |
| TC-E07 | TX zip returns Moved-shortCode embed (not txtest) | POST with `property.zip:"75063"` | 200; URL is `.../move-in?shortCode=moved&zip=75063` (Moved partner overrides TX-specific path) | P2 | Yes |
| TC-E08 | Out-of-coverage zip still returns embed URL | POST with `property.zip:"82609"` (Casper WY) | 200; embed URL returned — flow itself will route to waitlist | P2 | Yes |

#### Validation — `resident` object
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E10 | Empty body rejected | POST `{}` | 400; FST_ERR_VALIDATION mentioning resident + property | P0 | Yes |
| TC-E11 | Missing `resident` rejected | POST `{property:{zip:"10001"}}` | 400; "body/resident Invalid input: expected object" (per Doc bug D7 — should fix docs OR API) | P1 | Yes |
| TC-E12 | Invalid email format rejected | POST `{resident:{email:"not-an-email"},property:{zip:"10001"}}` | 400; "body/resident/email Invalid email address" | P1 | Yes |
| TC-E13 | Invalid `moveInDate` format rejected | POST `{resident:{moveInDate:"01/15/2025"}, ...}` | 400; "body/resident/moveInDate Invalid ISO date" | P1 | Yes |
| TC-E14 | Invalid `dateOfBirth` format rejected | POST `{resident:{dateOfBirth:"15/05/1990"}, ...}` | 400; "body/resident/dateOfBirth Invalid ISO date" | P2 | Yes |
| TC-E15 | `moveInDate` 30 days in past rejected | POST with `moveInDate` 30d ago | 400; "moveInDate cannot be more than 3 days in the past" | P1 | Yes |
| TC-E16 | `moveInDate` 4 days in past — currently accepted | POST with `moveInDate` 4d ago | Currently 200 (should be 400 per spec — Bug B1). Test asserts current behavior + comments expected behavior | P2 | Yes (negative test for B1) |
| TC-E17 | `moveInDate` exactly 3 days in past accepted | POST with `moveInDate` 3d ago | 200 | P2 | Yes |
| TC-E18 | `moveInDate` today accepted | POST with `moveInDate` today | 200 | P2 | Yes |

#### Validation — `property` object
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E20 | Missing zip rejected | POST `{resident:{}, property:{}}` | 400; "body/property/zip Invalid input: expected string" | P0 | Yes |
| TC-E21 | Zip too short | POST `{resident:{}, property:{zip:"123"}}` | 400; "Too small: ...>=5 characters" | P1 | Yes |
| TC-E22 | State longer than 2 chars | POST `{resident:{}, property:{zip:"10001",state:"New York"}}` | 400; "body/property/state Too big: ...<=2 characters" | P2 | Yes |
| TC-E23 | State lowercase accepted | POST `{resident:{}, property:{zip:"10001",state:"ny"}}` | 200 (current behavior — flag if downstream expects uppercase) | P3 | Yes |

#### Authentication
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E30 | Missing auth header | POST without Authorization | 401; "missing authorization header" | P0 | Yes |
| TC-E31 | Invalid Bearer token | POST with `Bearer invalid_xyz` | 401; "invalid authorization header" | P0 | Yes |

#### HTTP Methods
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E40 | GET on embed not allowed | GET `/v1/moved/embed` | 404 (currently) | P3 | Yes |
| TC-E41 | Malformed JSON body | POST with body `{not valid` | 400; FST_ERR_CTP_INVALID_JSON_BODY | P2 | Yes |

#### Negative / Security
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E50 | SQL-injection-like firstName | POST `firstName:"Robert'); DROP TABLE users;--"` | 200; URL-encoded into embed URL — no DB impact (verify Move-in flow renders sanitized) | P1 | Yes |
| TC-E51 | XSS string in lastName | POST `lastName:"<script>alert(1)</script>"` | 200; URL-encoded — verify rendered inert in iframe Move-in flow | P1 | Yes |
| TC-E52 | 1000-char firstName accepted | POST with 1000-char firstName | 200 currently — flag for B3 (no maxLength) | P2 | Yes |
| TC-E53 | Extra unknown fields ignored | POST with `resident.middleName`, `resident.ssn`, `property.country` | 200; extra fields stripped from URL (NOT echoed) | P1 | Yes |
| TC-E54 | SSN never echoed in URL | TC-E53 | URL must NOT contain `ssn=...` | P0 | Yes |

#### Response Schema
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-E60 | Response shape | TC-E01 | Body has exactly `{embedURL: string}` — no extra fields | P1 | Yes |
| TC-E61 | Embed URL host is environment-correct | TC-E01 in dev | URL host = `dev.onepublicgrid.com` (in staging would be `staging.*`, prod would be `onepublicgrid.com`) | P1 | Yes |
| TC-E62 | Embed URL `shortCode=moved` always present | TC-E01..E08 | Every URL has `shortCode=moved` | P0 | Yes |

---

### Iframe / UI Verification (Playwright UI tests)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-U01 | Embed URL loads Moved-themed move-in | Get embed URL via API; navigate browser to embed URL | Page loads encouraged-conversion flow with Moved branding (Moved theme = blue) | P1 | Exploratory first, then Yes |
| TC-U02 | Prefill: name, email, phone visible | Embed URL with full payload → navigate → reach Step 2 (resident info) | firstName, lastName, email, phone fields prefilled | P1 | Yes |
| TC-U03 | Prefill: address rendered | Embed URL with full property → navigate | Address step shows pre-selected address from URL params | P1 | Yes |
| TC-U04 | XSS strings render inert in iframe | TC-E51 → load embed URL in iframe | `<script>` text shows as literal text, no JS execution | P0 | Yes |
| TC-U05 | postMessage on completion | Embed URL → complete move-in flow → listen for window postMessage | Parent receives postMessage with completion payload (verify event name + structure with backend) | P1 | Exploratory |
| TC-U06 | Out-of-coverage zip routes to waitlist | TC-E08 (Casper) → load embed URL | Move-in flow shows waitlist page (per existing waitlist behavior) | P2 | Yes |
| TC-U07 | TX zip in embed routes to TX-DEREG flow | TC-E07 (75063) → load embed URL | Move-in flow handles TX dereg path with Moved branding | P2 | Yes |

---

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Doc — endpoint paths | Sample curl uses `/api/v1/...` but actual path is `/v1/...` | Partner integrations will 404 immediately | Update Notion + PDF + sample curl to use `/v1/...` |
| UX-002 | Doc — embed URL field names | Doc shows `street=...&unit=...` but real params are `streetAddress`/`unitNumber` | Moved would map fields to wrong query params; prefill silently fails on Move-in flow | Update doc OR rename real params to match doc |
| UX-003 | Doc — `resident` requirement | Subfields say "Required: No" but the object itself is required | First integration call fails with confusing error | Add a top-level note: "`resident` object is required even if empty" |
| UX-004 | Doc — out-of-coverage semantics | Doc says "no providers returned = not in coverage" — but reality returns providers with `isPrimaryUtility=false` | Partner won't know how to detect waitlist case | Document: "If all providers have `isPrimaryUtility=false`, treat as waitlist / out-of-coverage" |
| UX-005 | API — moveInDate validation | "more than 3 days in past" rejection inconsistent (-4d accepted, -30d rejected) | Partner may send dates within window thinking they're rejected | Either fix boundary to exactly 3 days, or document actual cutoff |
| UX-006 | API — phone format | Doc says "digits only" but formatted phones accepted | Inconsistent partner integrations; some send `(555)` some send `5551234567` | Either enforce digits-only validation OR strip formatting server-side and document it |
| UX-007 | API — string length caps | No `maxLength` on `firstName`, `lastName`, etc. | Storage/URL bloat risk; potential DoS via huge payloads | Add reasonable caps (e.g., 100 chars on names) with clear validation messages |
| UX-008 | API — multi-field validation errors | Only first failing field reported | Partners need multiple round-trips to fix all issues | Aggregate validation errors and return all in single response |
| UX-009 | Embed URL params — `internalID` → `leaseID` | Undocumented mapping | Partner can't predict URL shape; debugging is hard | Document the rename in spec |
| UX-010 | Doc — environment-specific embed URL | Doc shows prod URL only; dev returns `dev.onepublicgrd.com` | Partner may hardcode prod URL during dev integration | Add note: "embedURL host is environment-aware (dev/staging/prod)" |
| UX-011 | Spec — Canada flow | No mention of `country=ca` for Canadian addresses | Moved Canadian flow won't work | Add Canada support: accept `country` field, append `country=ca` to embed URL |
| UX-012 | Spec — webhook on completion | postMessage mentioned in flowchart only, no spec | Partner integration teams left guessing event name + payload | Document postMessage event name, payload schema, error variants |

> These do NOT block test plan execution. File priority items (UX-001 to UX-005, UX-009) as `[IMPROVEMENT]` tickets via `/log-bug` after exploratory session confirms.

## Automation Plan

### Test File
`tests/api_tests/v1/moved-embed/moved_embed.spec.ts` — covers both endpoints (TC-A* + TC-E*) following the `AlertsEnrollmentApi` pattern.

### Helper Class
`tests/resources/fixtures/api/movedEmbedApi.ts` with methods:
- `getAvailability(zip)` / `getAvailabilityNoAuth(zip)` / `getAvailabilityBadToken(zip)`
- `createEmbed(body)` / `createEmbedRaw(body)` / `createEmbedNoAuth(body)` / `createEmbedBadToken(body)`
- `sendMethod(path, method)` for method-not-allowed tests

### Types
`tests/resources/types/movedEmbed.types.ts`:
- `UtilityProvider`, `AvailabilityResponse`
- `MovedEmbedRequestBody` (with `Resident` + `Property` sub-types)
- `MovedEmbedSuccessResponse` (`{embedURL: string}`)
- `MovedEmbedValidationError`, `MovedEmbedAuthError`
- Discriminated union response type

### Cross-cutting E2E integration spec (modeled on finish-registration)
`tests/e2e_tests/moved-d2c/moved_d2c_move_in.spec.ts` — follows the same three-layer pattern as [`tests/e2e_tests/finish-registration-flow/finish_reg_move_in.spec.ts`](../e2e_tests/finish-registration-flow/finish_reg_move_in.spec.ts). Uses `MovedEmbedApi` to call the API, navigates to the returned `embedURL`, walks through the non-billing encouraged-conversion flow, verifies DB attribution and prefill. Covers TC-U01..U04 + TC-U08.

**Deferred until ENG-2694 is fixed** — would otherwise bake in broken Simpson attribution. Once fix lands, scaffold per the outline in [`tests/docs/partner-direct-to-consumer-api.md`](../docs/partner-direct-to-consumer-api.md#integration-spec-outline-for-when-eng-2694-is-fixed).

### Iframe parent harness (TC-U05)
Blocked on backend documenting the postMessage event name + payload. When spec lands, extend the integration spec above to wrap the embed URL in an iframe parent and capture `window.addEventListener('message', ...)` events on completion.

### Tags
- **Smoke**: TC-A01, TC-E01, TC-E62, TC-E54 (auth + happy path + safety) — `@smoke`, R1
- **Regression1 (API)**: All TC-A*, TC-E* — `@api`, R1
- **Regression1 (UI)**: TC-U01, TC-U02 (prefill + branding) — R1
- **Mobile/cross-browser**: TC-U01, TC-U02 — R4 (Mobile Chrome), R5 (Mobile Safari)
- **Exploratory only**: TC-U05 (postMessage — needs backend confirmation on payload shape), TC-U07 (TX dereg interaction)

### Env Var
- Add `MOVED_API_KEY` to `.env` and `.env.example`. Confirm canonical name with backend before merge.
- Add `api_v1_moved` field to `tests/resources/utils/environmentBaseUrl.ts` if base URL handling needs to differ from the existing `/v1/` setup (likely just reuse `${baseUrl}/v1/moved/embed`).

### Cleanup
- Embed endpoint does NOT create DB rows directly — just returns a URL. No DB cleanup needed for API tests.
- UI tests that complete the full move-in flow MUST clean up created CottageUser via `CleanUp.Test_User_Clean_Up(email)`.

## Risks & Notes
- **API key naming**: Sample uses a generic key — confirm whether this is `MOVED_API_KEY`, a shared `PARTNER_API_KEY`, or partner-scoped (per `Authorization` header described as "Your API key (provided by Public Grid)"). Block test merge until backend confirms.
- **Doc accuracy is high-priority**: 8 doc bugs found in a single probing session. Recommend backend team review live docs at `https://0bb57b59.developers-dkm.pages.dev/` (per existing Partner API v2 pattern) and replace the PDF.
- **B1 (date validation)**: If unintentional, this is a logic bug. If intentional (e.g., business decision to allow recent dates), update spec wording. TC-E16 will fail until clarified.
- **postMessage spec missing**: The flowchart shows "Post message on completion" with no event name or payload. Block UI completion tests until backend documents this.
- **Iframe sandboxing**: Spec doesn't say what `sandbox` attributes the parent iframe should set. Risk: third-party cookies + payment iframes (Stripe) may break in restrictive sandboxes. Recommend adding integration guidance.
- **Coverage of existing Move-in flow**: Existing Moved partner shortcode tests (`venn73458test`, `moved5439797test` in ENG-2588) cover the underlying flow — focus this plan on the new API surface + iframe handoff, not re-testing the move-in journey.

## Next Steps
1. `/exploratory-test` — run interactive session to validate findings + capture postMessage payload
2. `/log-bug` — file 5+ improvement tickets (UX-001..005, UX-009) with **User Impact** statements
3. `/create-test` — scaffold `MovedEmbedApi` helper + `moved_embed.spec.ts` covering all TC-A* and TC-E*
4. Open question for backend: canonical API key env var name, `country=ca` support, postMessage payload spec
