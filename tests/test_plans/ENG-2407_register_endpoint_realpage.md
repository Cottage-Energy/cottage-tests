# Test Plan: ENG-2407 — Register Endpoint Change for RealPage

## Overview
**Ticket**: [ENG-2407](https://linear.app/public-grid/issue/ENG-2407/task-register-endpoint-change-for-realpage)
**Source**: Linear ticket + [services PR #311](https://github.com/Cottage-Energy/services/pull/311) (merged 2026-03-24)
**Notion**: [LOFT RealPage Integration](https://www.notion.so/public-grid/LOFT-Real-Page-Integration-2c5e16f7944b8047a757f5ed74b4eef3)
**Date**: 2026-03-24
**Tester**: Christian

## Summary
Backend API change to the partner register endpoint (`POST /v1/:partner/register`). Adds `leaseID` at root level of the request body. The `external_lease_id` is now resolved as `leaseID ?? (resident.internalID|property.siteId) ?? null`. Schema validation enforces that either `leaseID` or both fallback fields are present. Finish-registration URL now appends `leaseID={externalLeaseID}`.

## Integration Context (from Notion doc)
This is part of the **LOFT <> RealPage** integration — a one-click utility setup for residents.

### User Experience Flow
1. **RealPage Loft**: Resident sees "Set Up Electricity" task → clicks → one-click setup page → accepts terms & consent → submits
2. **Public Grid API**: Receives payload (via Zapier or Direct API) → validates → creates resident account → sends welcome email with secure identity link → daily reminder emails until complete or move-in date
3. **Resident**: Receives email → clicks secure link → completes finish-registration:
   - `enrollment.type = "move-in"`: Identity verification page (DOB, SSN or ID upload, prior address) → "Verify & Complete"
   - `enrollment.type = "verification"`: Utility proof upload page (email + proof of utility account) → "Continue"

### Integration Paths
- **Zapier** (recommended for pilot): RealPage form submit → Zapier webhook → Public Grid API
- **Direct API** (future state): RealPage backend → HTTPS POST → Public Grid API
- Same payload structure — no changes needed on PG side when migrating

### Production Endpoint
`POST https://api.onepublicgrid.com/v1/partners/realpage/register`

### Minimal Viable Payload
Only 4 fields truly required: `firstName`, `lastName`, `email`, `enrollment.type`. If `leaseID` is not provided, `resident.internalID` and `property.siteId` also become required. Public Grid collects any missing information directly from the resident.

## Code Changes (PR #311)
| File | Change |
|------|--------|
| `schemas.ts` | Added `leaseID` (optional string) at root. Added `.refine()`: if no `leaseID`, both `resident.internalID` AND `property.siteId` required |
| `registrationService.ts` | New `externalLeaseID` resolution logic. New `missing_lease_identifier` error type. Duplicate check uses resolved `externalLeaseID` (was `resident.internalID` only). DB `external_lease_id` uses resolved value. Finish-registration URL appends `leaseID` param |

### Resolution Logic (from diff)
```typescript
const externalLeaseID = leaseID ?? (resident.internalID && property?.siteId
  ? `${resident.internalID}|${property.siteId}`
  : null);
```

### Previous Behavior
- `external_lease_id` = `resident.internalID` if present, else `property.siteId`
- Duplicate check only ran against `resident.internalID`
- Finish-registration URL did NOT include `leaseID` param

## Scope

### In Scope
- `leaseID` resolution (direct vs fallback vs missing)
- Schema validation (required field combinations)
- Duplicate detection against resolved `externalLeaseID`
- Finish-registration URL generation with `leaseID` param
- DB verification of `Property.externalLeaseID`
- Backward compatibility (existing payloads without `leaseID`)

### Out of Scope
- Finish-registration frontend form completion (covered by ENG-2430)
- RealPage Loft UI (setup card, consent checkbox, success message — RealPage-owned)
- Partner validation/matching logic (unchanged)
- Stripe customer creation (unchanged)
- Auth/token generation (unchanged)
- Zapier webhook configuration (RealPage-owned)

### Prerequisites
- **Bearer token** for `POST api-dev.publicgrd.com/v1/test-partner/register` (stored in `.env`)
- Dev environment (`api-dev.publicgrd.com`) running with PR #311 deployed
- Unique email addresses per test (use `pgtest+eng2407-XX@joinpublicgrid.com` pattern)
- Supabase access for DB verification
- Fastmail access for welcome email / reminder email verification

### Dependencies
- `doesExternalLeaseIDExist()` function — checks `Property.externalLeaseID` in DB
- `ViewMoveInPartnerReferral` view — partner lookup (e.g., `test-partner` prefix)
- Frontend finish-registration page must handle new `leaseID` query param

## Test Cases

### Happy Path — leaseID Resolution

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Register with `leaseID` at root level | Unique email, unique leaseID | 1. POST `/v1/test-partner/register` with `leaseID: "lease-tc001"` + required fields 2. Check response | `success: true`, `finishRegistrationURL` contains `leaseID=lease-tc001` | P0 | Yes |
| TC-002 | Register with fallback (`resident.internalID` + `property.siteId`) — no `leaseID` | Unique email | 1. POST without `leaseID` but with `resident.internalID: "rp001"` and `property.siteId: "site001"` 2. Check response | `success: true`, `finishRegistrationURL` contains `leaseID=rp001%7Csite001` (URL-encoded pipe) | P0 | Yes |
| TC-003 | `leaseID` takes priority over fallback fields | Unique email | 1. POST with `leaseID: "lease-tc003"` AND `resident.internalID: "rp003"` AND `property.siteId: "site003"` 2. Check response 3. Query `Property.externalLeaseID` in DB | `externalLeaseID` = `lease-tc003` (NOT `rp003\|site003`), URL contains `leaseID=lease-tc003` | P0 | Yes |
| TC-004 | Successful registration stores `externalLeaseID` in DB | After TC-001 | 1. Query `SELECT "externalLeaseID" FROM "Property" WHERE "electricAccountID" = <id>` | `externalLeaseID` = `lease-tc001` | P0 | Yes |
| TC-005 | Fallback stores concatenated value in DB | After TC-002 | 1. Query `Property.externalLeaseID` for the created user | `externalLeaseID` = `rp001\|site001` | P0 | Yes |
| TC-006 | Enrollment type `move-in` (default) | Unique email, unique leaseID | 1. POST with `enrollment.type: "move-in"` | `success: true`, `status: "REGISTRATION_INCOMPLETE"` | P1 | Yes |
| TC-007 | Enrollment type `verification` | Unique email, unique leaseID | 1. POST with `enrollment.type: "verification"` | `success: true`, `status: "VERIFICATION_INCOMPLETE"` | P1 | Yes |
| TC-008 | Success response contains expected structure | After any successful registration | 1. Verify response body structure | Response has `success: true`, `userId`, `status`, `message`, `finishRegistrationURL` | P0 | Yes |

### Partner Slug & Endpoint

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-080 | Registration via `realpage` partner slug | Unique email, unique leaseID | 1. POST to `/v1/realpage/register` with valid body | Registration succeeds, partner matched against `ViewMoveInPartnerReferral` | P0 | Yes |
| TC-081 | Registration via `test-partner` slug (dev testing) | Unique email, unique leaseID | 1. POST to `/v1/test-partner/register` with valid body | Registration succeeds (partnerID may be null if no matching referral code) | P1 | Yes |

### E2E Flow — API → Email → Finish-Registration

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-090 | Welcome email sent after `move-in` registration | Successful registration with `enrollment.type: "move-in"` | 1. POST register endpoint 2. Check Fastmail inbox for welcome email within 2 min | Email received with secure identity link (finish-registration URL) | P0 | Yes |
| TC-091 | Welcome email sent after `verification` registration | Successful registration with `enrollment.type: "verification"` | 1. POST register endpoint 2. Check Fastmail inbox | Email received with finish-registration URL | P0 | Yes |
| TC-092 | Finish-reg link from email → identity page (`move-in`) | TC-090 email received | 1. Extract URL from email 2. Navigate in Playwright 3. Take snapshot | "Complete your registration" page loads with DOB, SSN/ID upload, prior address fields | P0 | Exploratory |
| TC-093 | Finish-reg link from email → utility verification page (`verification`) | TC-091 email received | 1. Extract URL from email 2. Navigate in Playwright 3. Take snapshot | "Let's verify your utility account setup" page loads with email, proof upload fields | P0 | Exploratory |
| TC-094 | Finish-reg URL contains `leaseID` query param | TC-090 or TC-091 email | 1. Extract URL from email 2. Parse query params | URL contains `leaseID={externalLeaseID}`, `token`, `email` | P0 | Yes |
| TC-095 | Daily reminder email sent (if not completed) | Registration created, NOT completed | 1. Register user 2. Wait for reminder cycle (or verify Inngest `registration/start-finish-reg-chain` event triggered) | Reminder email sent to resident until registration is complete or move-in date passes | P2 | Exploratory |

### Validation Errors — Missing Identifiers

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | No `leaseID`, missing `resident.internalID` — rejected | Unique email, `property.siteId` provided | 1. POST without `leaseID`, without `resident.internalID`, with `property.siteId: "site010"` | Error response with `missing_lease_identifier` or schema validation error | P0 | Yes |
| TC-011 | No `leaseID`, missing `property.siteId` — rejected | Unique email, `resident.internalID` provided | 1. POST without `leaseID`, with `resident.internalID: "rp011"`, without `property.siteId` | Error response with `missing_lease_identifier` or schema validation error | P0 | Yes |
| TC-012 | No `leaseID`, missing both fallback fields — rejected | Unique email | 1. POST without `leaseID`, without `resident.internalID`, without `property.siteId` | Error response with `missing_lease_identifier` or schema validation error | P0 | Yes |
| TC-013 | No `leaseID`, `property` object omitted entirely — rejected | Unique email, `resident.internalID` provided | 1. POST without `leaseID`, with `resident.internalID`, no `property` object at all | Schema validation error (property.siteId missing) | P1 | Yes |

### Duplicate Detection

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Duplicate `leaseID` — rejected | TC-001 already created `lease-tc001` | 1. POST with same `leaseID: "lease-tc001"` but different email | `errorType: "duplicate_identifier"`, message contains `lease-tc001` | P0 | Yes |
| TC-021 | Duplicate resolved fallback — rejected | TC-002 already created `rp001\|site001` | 1. POST without `leaseID`, with same `resident.internalID: "rp001"` and `property.siteId: "site001"`, different email | `errorType: "duplicate_identifier"` | P0 | Yes |
| TC-022 | Same `leaseID` as existing fallback value — cross-format duplicate | Existing `externalLeaseID` = `rp001\|site001` (from TC-002) | 1. POST with `leaseID: "rp001\|site001"` (pipe character in leaseID), different email | `errorType: "duplicate_identifier"` (resolved value matches existing) | P1 | Yes |
| TC-023 | Duplicate email — rejected (unchanged behavior) | TC-001 email already registered | 1. POST with different `leaseID` but same email as TC-001 | `errorType: "duplicate_email"` | P1 | Yes |

### Finish-Registration URL Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | URL includes `leaseID` param from root `leaseID` | Successful TC-001 response | 1. Parse `finishRegistrationURL` from response 2. Extract query params | URL contains `leaseID=lease-tc001`, `token=<jwt>`, `email=<email>` | P0 | Yes |
| TC-031 | URL includes `leaseID` param from fallback | Successful TC-002 response | 1. Parse `finishRegistrationURL` from response 2. Extract query params | URL contains `leaseID=rp001%7Csite001` (pipe URL-encoded) | P0 | Yes |
| TC-032 | URL includes address params when full address provided | Unique registration with all address fields | 1. POST with all `property` fields (street, city, state, zip, unitNumber) 2. Parse URL | URL contains `streetAddress`, `city`, `state`, `zip`, `unitNumber` params | P1 | Yes |
| TC-033 | URL excludes address params when partial address | Registration with only `property.street` | 1. POST with only street + siteId (no city/state/zip) 2. Parse URL | URL does NOT contain `streetAddress` (all-or-nothing for address fields) | P2 | Yes |
| TC-034 | Finish-registration page loads with `leaseID` param | Valid `finishRegistrationURL` from TC-001 | 1. Navigate to `finishRegistrationURL` in browser 2. Check page loads | Page loads successfully, no errors, user context populated | P1 | Exploratory |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-040 | `externalLeaseID` from root `leaseID` | `SELECT "externalLeaseID" FROM "Property" p JOIN "ElectricAccount" ea ON p."electricAccountID" = ea."id" JOIN "CottageUser" cu ON ea."cottageUserID" = cu."id" WHERE cu."email" = '<tc001-email>'` | `externalLeaseID` = `lease-tc001` | P0 |
| TC-041 | `externalLeaseID` from fallback | Same query for TC-002 email | `externalLeaseID` = `rp001\|site001` | P0 |
| TC-042 | `externalLeaseID` uses `leaseID` when both provided | Same query for TC-003 email | `externalLeaseID` = `lease-tc003` (root wins over fallback) | P0 |
| TC-043 | No orphaned records on validation failure | After TC-010 (rejected request) | Query `CottageUser` by TC-010 email | No user record created | P1 |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Empty string `leaseID` treated as absent | 1. POST with `leaseID: ""`, with both fallback fields | Schema `.trim()` makes it empty string → falsy → fallback used. `externalLeaseID` = `{internalID}\|{siteId}` | P1 | Yes |
| TC-051 | Whitespace-only `leaseID` treated as absent | 1. POST with `leaseID: "   "`, with both fallback fields | `.trim()` makes it empty → fallback used | P2 | Yes |
| TC-052 | Very long `leaseID` (255+ chars) | 1. POST with 300-char `leaseID` | Either accepted (stored as-is) or validation error — document actual behavior | P2 | Yes |
| TC-053 | Special characters in `leaseID` | 1. POST with `leaseID: "lease/2407&special=true"` | Accepted, stored as-is, URL-encoded in finish-registration URL | P2 | Yes |
| TC-054 | `leaseID` with pipe character (mimics fallback format) | 1. POST with `leaseID: "id1\|id2"` | Accepted — `leaseID` is opaque string, pipe is valid | P2 | Yes |
| TC-055 | `moveInDate` more than 3 days in past — rejected | 1. POST with `enrollment.moveInDate` = 5 days ago | Schema validation error: "moveInDate cannot be more than 3 days in the past" | P2 | Yes |
| TC-056 | `moveInDate` exactly 3 days ago — accepted | 1. POST with `enrollment.moveInDate` = 3 days ago | Accepted (isSameOrAfter check) | P2 | Yes |

### Backward Compatibility

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Old payload format with `resident.internalID` + `property.siteId` (no `leaseID` field) | 1. POST using exact old payload format from onboarding-flows doc (building.internalID, resident.internalID, property.siteId) | Registration succeeds, `externalLeaseID` = `{internalID}\|{siteId}` | P0 | Yes |
| TC-061 | Old payload with only `resident.internalID` (no `siteId`, no `leaseID`) — NOW REJECTED | 1. POST with `resident.internalID` but no `property.siteId` and no `leaseID` | **BREAKING**: Previously accepted (stored `internalID` as `external_lease_id`), now rejected with `missing_lease_identifier` | P0 | Yes |
| TC-062 | Minimal required fields + `leaseID` | 1. POST with only `resident.firstName`, `lastName`, `email`, `enrollment.type`, `leaseID` | Registration succeeds — `leaseID` satisfies the identifier requirement | P1 | Yes |

### Negative Tests

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | Missing required `resident.firstName` | 1. POST without `resident.firstName` | Schema validation error | P2 | Yes |
| TC-071 | Missing required `resident.email` | 1. POST without `resident.email` | Schema validation error | P2 | Yes |
| TC-072 | Invalid email format | 1. POST with `resident.email: "not-an-email"` | Schema validation error | P2 | Yes |
| TC-073 | Invalid `enrollment.type` value | 1. POST with `enrollment.type: "transfer"` | Schema validation error (only `move-in` or `verification` allowed) | P2 | Yes |
| TC-074 | Invalid `dateOfBirth` format | 1. POST with `resident.dateOfBirth: "05/15/1990"` (not ISO) | Schema validation error | P3 | No |
| TC-075 | No auth bearer token | 1. POST without Authorization header | 401 Unauthorized | P2 | Yes |
| TC-076 | Invalid partner in URL path | 1. POST to `/v1/nonexistent-partner/register` with valid body | Registration succeeds (partnerID = null, non-blocking) | P2 | Yes |

## Test Data

### API Endpoints
```
# Dev (testing)
POST https://api-dev.publicgrd.com/v1/test-partner/register
Authorization: Bearer <PARTNER_REGISTER_TOKEN>   # stored in .env
Content-Type: application/json

# Dev (realpage partner slug)
POST https://api-dev.publicgrd.com/v1/realpage/register
Authorization: Bearer <PARTNER_REGISTER_TOKEN>
Content-Type: application/json

# Production (reference only — do NOT test against production)
POST https://api.onepublicgrid.com/v1/partners/realpage/register
```

### Base Payload Template (with leaseID)
```json
{
  "leaseID": "eng2407-tc001",
  "resident": {
    "firstName": "QA",
    "lastName": "Test",
    "email": "pgtest+eng2407-tc001@joinpublicgrid.com",
    "phone": "1111111111",
    "dateOfBirth": "1990-05-15"
  },
  "building": {
    "internalID": "guid-autotest",
    "name": "QA Test Community"
  },
  "property": {
    "siteId": "site-eng2407",
    "street": "123 Main St",
    "unitNumber": "4B",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  },
  "enrollment": {
    "type": "move-in",
    "moveInDate": "2026-04-01"
  }
}
```

### Base Payload Template (fallback — no leaseID)
```json
{
  "resident": {
    "firstName": "QA",
    "lastName": "Fallback",
    "email": "pgtest+eng2407-tc002@joinpublicgrid.com",
    "internalID": "rp-eng2407-001",
    "phone": "1111111111"
  },
  "property": {
    "siteId": "site-eng2407-fb",
    "street": "456 Oak Ave",
    "city": "Brooklyn",
    "state": "NY",
    "zip": "11201"
  },
  "enrollment": {
    "type": "verification"
  }
}
```

### Email Pattern
`pgtest+eng2407-tcXXX@joinpublicgrid.com` — unique per test case

### DB Verification Query
```sql
SELECT p."externalLeaseID", p."electricAccountID", ea."cottageUserID", cu."email"
FROM "Property" p
JOIN "ElectricAccount" ea ON p."electricAccountID" = ea."id"
JOIN "CottageUser" cu ON ea."cottageUserID" = cu."id"
WHERE cu."email" = 'pgtest+eng2407-tcXXX@joinpublicgrid.com';
```

## Automation Plan

### Smoke (P0 — 19 cases)
TC-001, TC-002, TC-003, TC-004, TC-005, TC-008, TC-010, TC-011, TC-012, TC-020, TC-021, TC-030, TC-031, TC-080, TC-090, TC-091, TC-094

### Regression (P1 — 12 cases)
TC-006, TC-007, TC-013, TC-022, TC-023, TC-032, TC-040, TC-041, TC-042, TC-050, TC-060, TC-061, TC-062, TC-081

### Lower Priority (P2/P3 — 16 cases)
TC-033, TC-043, TC-051–TC-056, TC-070–TC-076, TC-095

### Exploratory Only (4 cases)
TC-034 (finish-registration page loads with new param), TC-092 (move-in identity page), TC-093 (verification utility proof page), TC-095 (daily reminder email)

### Implementation Notes
- **API test pattern**: This is the first API-only test suite in `cottage-tests`. Will need:
  - A `registerApi.ts` helper (or fixture) wrapping `fetch()` with auth headers
  - Cleanup: delete created `CottageUser` + `Property` + `ElectricAccount` in `afterEach`
  - Consider `tests/e2e_tests/register-api/` as a new test folder
- **Bearer token available**: Token provided — add as `PARTNER_REGISTER_TOKEN` to `.env`

## Risks & Notes

1. **Breaking change for existing integrations**: TC-061 confirms that old payloads with only `resident.internalID` (no `siteId`, no `leaseID`) are now rejected. Any partner currently sending this format will break.
2. **Duplicate detection scope change**: Previously only checked `resident.internalID`; now checks resolved `externalLeaseID`. Existing records with `externalLeaseID` set from `property.siteId` (old fallback path) could conflict with new registrations.
3. **Pipe character in DB**: Fallback format `{internalID}|{siteId}` stores a pipe literal in `Property.externalLeaseID`. Frontend and any downstream consumers must handle this.
4. **Finish-registration URL change**: Frontend receives `leaseID` param it didn't before. ENG-2430 already handles `leaseID` in move-in, but finish-registration page must also handle it gracefully.
5. **Zapier integration path**: RealPage pilot uses Zapier (webhook → API). Zapier may add headers, retry logic, or transform the payload — worth verifying if Zapier is in the loop during testing.
6. **Daily reminder emails**: Inngest triggers `registration/start-finish-reg-chain` — reminders sent daily until complete or move-in date. Event key routes to services (`pg-payments`), not FE — need to verify this chain fires correctly.

## Test Case Summary
| Category | Count | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|-----|
| Happy Path + Response | 8 | 6 | 2 | 0 | 0 |
| Partner Slug & Endpoint | 2 | 1 | 1 | 0 | 0 |
| Validation Errors | 4 | 3 | 1 | 0 | 0 |
| Duplicate Detection | 4 | 2 | 2 | 0 | 0 |
| Finish-Reg URL | 5 | 2 | 2 | 1 | 0 |
| E2E Flow (API → Email → Page) | 6 | 4 | 0 | 1 | 0 |
| DB Verification | 4 | 3 | 1 | 0 | 0 |
| Edge Cases | 7 | 0 | 1 | 5 | 0 |
| Backward Compat | 3 | 2 | 1 | 0 | 0 |
| Negative Tests | 7 | 0 | 0 | 5 | 2 |
| **Total** | **50** | **23** | **11** | **12** | **2** |
