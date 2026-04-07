# Test Plan: Public Grid REST API v2

## Overview
**Ticket**: N/A (API Design Specification)
**Source**: Public Grid REST API v2 Design Specification (PDF, Draft v0.2 — March 2026)
**Date**: 2026-04-06
**Tester**: Christian
**Base URL**: `https://api.onepublicgrid.com/api/v2`

## Scope

### In Scope
- All 20 endpoints across 5 resource groups (buildings, properties, customers, registration, utilities)
- Authentication and authorization (Bearer API key, partner scoping)
- Pagination conventions (limit/offset defaults and max values)
- Data format conventions (UUIDs, integer IDs, cents, ISO 8601, usage units)
- Error handling (consistent error format, all 6 error codes)
- Webhook event delivery and signature validation (6 event types)
- SSO auth flow routing logic (existing vs new users, flowType variants)
- Registration flows (move-in, savings-enrollment) with minimum viable payloads

### Out of Scope
- `POST /registration/move-out` (explicitly marked "Future" in spec)
- Webhook endpoint implementation on partner side (partner responsibility)
- Internal database schema validation (covered by backend unit tests)
- v1 endpoint deprecation/migration testing (separate plan when timeline defined)
- Load/performance testing (separate plan)

### Prerequisites
- API key for a test partner with access to at least one building
- A second API key scoped to a different partner (for isolation/forbidden tests)
- Test building with both electric and gas utility companies assigned
- Test building with properties in various statuses (Active, Pending, Inactive)
- Test customer with bill history and interval data available
- Webhook receiver endpoint configured for the test partner
- Access to Supabase dev for DB verification

### Dependencies
- Stripe integration (for bill.paid webhook events)
- Utility company data in UtilityCompany table (for /utilities endpoints)
- Interval data availability depends on utility meter data access
- SSO auth depends on existing move-in, verify, and savings flows working

---

## Test Cases

### 1. Authentication & Authorization

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| AUTH-001 | Valid API key returns data | 1. Send `GET /buildings` with valid Bearer token | 200 with building data scoped to partner | P0 | Yes |
| AUTH-002 | Missing Authorization header | 1. Send `GET /buildings` without Authorization header | 401 with `UNAUTHORIZED` error code | P0 | Yes |
| AUTH-003 | Empty Bearer token | 1. Send `GET /buildings` with `Authorization: Bearer ` (empty) | 401 with `UNAUTHORIZED` error code | P0 | Yes |
| AUTH-004 | Invalid/expired API key | 1. Send `GET /buildings` with `Authorization: Bearer invalid-key-123` | 401 with `UNAUTHORIZED` error code | P0 | Yes |
| AUTH-005 | Malformed Authorization header | 1. Send `GET /buildings` with `Authorization: Basic abc123` (wrong scheme) | 401 with `UNAUTHORIZED` error code | P1 | Yes |
| AUTH-006 | Partner scoping — own buildings only | 1. Send `GET /buildings` with Partner A key 2. Send `GET /buildings` with Partner B key | Each response contains only buildings associated with that partner — no overlap | P0 | Yes |
| AUTH-007 | Partner cannot access other partner's building | 1. Get a buildingID from Partner A 2. Send `GET /buildings/{buildingID}` with Partner B key | 403 with `FORBIDDEN` error code | P0 | Yes |
| AUTH-008 | Partner cannot access other partner's customer | 1. Get a customerID from Partner A 2. Send `GET /customers/{customerID}` with Partner B key | 403 with `FORBIDDEN` error code | P0 | Yes |

### 2. Buildings — `GET /buildings`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| BLD-001 | List buildings — default pagination | 1. Send `GET /buildings` with no query params | 200 with `data` array, `total`, `limit: 50`, `offset: 0` | P0 | Yes |
| BLD-002 | List buildings — custom limit | 1. Send `GET /buildings?limit=10` | 200 with at most 10 items in `data`, `limit: 10` | P1 | Yes |
| BLD-003 | List buildings — max limit enforced | 1. Send `GET /buildings?limit=200` | 200 with at most 100 items (max enforced) OR 400 error | P2 | Yes |
| BLD-004 | List buildings — offset pagination | 1. Send `GET /buildings?limit=1&offset=0` → get first building 2. Send `GET /buildings?limit=1&offset=1` → get second building | Two different buildings returned; `offset` values match request | P1 | Yes |
| BLD-005 | List buildings — offset beyond total | 1. Send `GET /buildings?offset=99999` | 200 with empty `data` array, `total` reflects actual count | P2 | Yes |
| BLD-006 | Building object shape validation | 1. Send `GET /buildings` 2. Validate first building in array | Has `id` (UUID), `name` (string), `shortCode`, `address` (street/city/state/zip), `utilities` (array), `totalUnitCount`, `createdAt` (ISO 8601) | P0 | Yes |
| BLD-007 | Building utilities array structure | 1. Get a building with known electric + gas utilities | `utilities` array has entries with `utilityCompanyID`, `name`, `type` (electric/gas), `pgEnabled` (boolean) | P1 | Yes |
| BLD-008 | List buildings — negative limit | 1. Send `GET /buildings?limit=-1` | 400 with `INVALID_REQUEST` error | P2 | Yes |
| BLD-009 | List buildings — non-integer limit | 1. Send `GET /buildings?limit=abc` | 400 with `INVALID_REQUEST` error | P2 | Yes |

### 3. Buildings — `GET /buildings/{buildingID}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| BLD-010 | Get building by ID — happy path | 1. Get a known buildingID 2. Send `GET /buildings/{buildingID}` | 200 with full building object including `properties` array | P0 | Yes |
| BLD-011 | Get building — includes property summary | 1. Send `GET /buildings/{buildingID}` for building with properties | Response includes `properties` array with `id`, `unitNumber`, `utilities` (accountID, accountType, status) | P0 | Yes |
| BLD-012 | Get building — non-existent ID | 1. Send `GET /buildings/00000000-0000-0000-0000-000000000000` | 404 with `NOT_FOUND` error | P1 | Yes |
| BLD-013 | Get building — malformed UUID | 1. Send `GET /buildings/not-a-uuid` | 400 with `INVALID_REQUEST` error | P2 | Yes |

### 4. Buildings — `POST /buildings/create`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| BLD-014 | Create building — full payload | 1. Send `POST /buildings/create` with name, address (all fields), utilities array (electric + gas), externalID, totalUnitCount | 201 with `id` (UUID), `name`, `shortCode` (auto-generated), `createdAt` | P0 | Yes |
| BLD-015 | Create building — minimum required fields | 1. Send `POST /buildings/create` with only name, address.street, address.city, address.state, address.zip | 201 with building created successfully | P0 | Yes |
| BLD-016 | Create building — missing name | 1. Send `POST /buildings/create` without `name` | 400 with `INVALID_REQUEST` referencing `name` | P1 | Yes |
| BLD-017 | Create building — missing address.street | 1. Send `POST /buildings/create` without `address.street` | 400 with `INVALID_REQUEST` referencing `address.street` | P1 | Yes |
| BLD-018 | Create building — missing address.city | 1. Send without `address.city` | 400 with `INVALID_REQUEST` | P1 | Yes |
| BLD-019 | Create building — missing address.state | 1. Send without `address.state` | 400 with `INVALID_REQUEST` | P1 | Yes |
| BLD-020 | Create building — missing address.zip | 1. Send without `address.zip` | 400 with `INVALID_REQUEST` | P1 | Yes |
| BLD-021 | Create building — invalid state code | 1. Send with `address.state: "XYZ"` (not 2-letter) | 400 with `INVALID_REQUEST` | P2 | Yes |
| BLD-022 | Create building — invalid zip format | 1. Send with `address.zip: "123"` (not 5-digit) | 400 with `INVALID_REQUEST` | P2 | Yes |
| BLD-023 | Create building — duplicate utility types | 1. Send with `utilities` array containing two `electric` entries | 400 — max one entry per type | P1 | Yes |
| BLD-024 | Create building — invalid utilityCompanyID | 1. Send with `utilities: [{ type: "electric", utilityCompanyID: "FAKE-UTILITY" }]` | 400 with `INVALID_REQUEST` | P2 | Yes |
| BLD-025 | Create building — DB verification | 1. Create a building via API 2. Query Supabase `Building` table by returned ID | Building exists in DB with correct name, address, utilities | P1 | Yes |

### 5. Properties — `GET /properties`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| PROP-001 | List properties — default pagination | 1. Send `GET /properties` | 200 with `data` array, `total`, `limit: 50`, `offset: 0` | P0 | Yes |
| PROP-002 | Filter by buildingID | 1. Send `GET /properties?buildingID={uuid}` | 200 with only properties belonging to that building | P0 | Yes |
| PROP-003 | Filter by status | 1. Send `GET /properties?status=Active` | 200 with only properties where at least one utility account is Active | P1 | Yes |
| PROP-004 | Filter by buildingID + status combined | 1. Send `GET /properties?buildingID={uuid}&status=Active` | 200 with properties matching both filters | P1 | Yes |
| PROP-005 | Property object shape validation | 1. Get a property from list response | Has `id` (integer), `buildingID` (UUID), `unitNumber`, `address` (with unitNumber), `utilities` array (accountID, accountType, utilityCompanyID, accountNumber, status, startDate, endDate), `customer` (id, firstName, lastName, email) | P0 | Yes |
| PROP-006 | Property utilities array — electric + gas | 1. Get a property with both electric and gas accounts | `utilities` array has two entries with `accountType: "electric"` and `accountType: "gas"` | P1 | Yes |
| PROP-007 | Filter by non-existent buildingID | 1. Send `GET /properties?buildingID=00000000-0000-0000-0000-000000000000` | 200 with empty `data` array | P2 | Yes |
| PROP-008 | Custom pagination | 1. Send `GET /properties?limit=5&offset=0` 2. Send `GET /properties?limit=5&offset=5` | Paginated results, no overlap between pages | P1 | Yes |

### 6. Properties — `GET /properties/{propertyID}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| PROP-009 | Get property by ID — happy path | 1. Send `GET /properties/{propertyID}` | 200 with full property including address, utilities (with accountNumber, startDate, endDate), and customer | P0 | Yes |
| PROP-010 | Get property — non-existent ID | 1. Send `GET /properties/999999999` | 404 with `NOT_FOUND` | P1 | Yes |
| PROP-011 | Get property — non-integer ID | 1. Send `GET /properties/abc` | 400 with `INVALID_REQUEST` | P2 | Yes |
| PROP-012 | Get property — customer embedded | 1. Get a property with an associated customer | `customer` object has `id` (UUID), `firstName`, `lastName`, `email` | P1 | Yes |

### 7. Properties — `GET /properties/{propertyID}/bills`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| BILL-001 | Get property bills — default | 1. Send `GET /properties/{propertyID}/bills` | 200 with `propertyID`, `data` array, `total`, `limit: 12`, `offset: 0` | P0 | Yes |
| BILL-002 | Bill object shape validation | 1. Get a bill from response | Has `id` (integer), `accountID`, `accountType`, `startDate`, `endDate`, `statementDate`, `dueDate`, `totalAmountDueCents` (integer), `totalUsage` (float), `usageUnit`, `pdfURL` | P0 | Yes |
| BILL-003 | Filter by accountType=electric | 1. Send `GET /properties/{propertyID}/bills?accountType=electric` | All returned bills have `accountType: "electric"` | P1 | Yes |
| BILL-004 | Filter by accountType=gas | 1. Send `GET /properties/{propertyID}/bills?accountType=gas` | All returned bills have `accountType: "gas"` | P1 | Yes |
| BILL-005 | Filter by startDate | 1. Send with `startDate=2024-06-01` | All returned bills have dates on or after 2024-06-01 | P1 | Yes |
| BILL-006 | Filter by endDate | 1. Send with `endDate=2024-06-30` | All returned bills have dates on or before 2024-06-30 | P1 | Yes |
| BILL-007 | Filter by date range | 1. Send with `startDate=2024-01-01&endDate=2024-06-30` | Bills within the date range only | P1 | Yes |
| BILL-008 | Bills pagination — custom limit | 1. Send with `limit=3` | At most 3 bills returned, `limit: 3` | P1 | Yes |
| BILL-009 | Bills max limit enforced | 1. Send with `limit=100` | At most 50 bills (max enforced) | P2 | Yes |
| BILL-010 | totalAmountDueCents is integer in cents | 1. Get a bill 2. Verify `totalAmountDueCents` is an integer (e.g., 8500 = $85.00) | Value is integer, not decimal | P1 | Yes |
| BILL-011 | pdfURL is accessible (signed URL) | 1. Get a bill with pdfURL 2. Fetch the URL | PDF content accessible (200), Content-Type is application/pdf | P2 | No |
| BILL-012 | Property with no bills | 1. Get bills for a property with no bill history | 200 with empty `data` array, `total: 0` | P2 | Yes |

### 8. Customers — `GET /customers/{customerID}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CUST-001 | Get customer — happy path | 1. Send `GET /customers/{customerID}` | 200 with `id`, `firstName`, `lastName`, `email`, `createdAt`, `properties` array | P0 | Yes |
| CUST-002 | Customer properties array structure | 1. Get a customer with at least one property | `properties[].propertyID` (integer), `buildingID` (UUID), `buildingName`, `unitNumber`, `utilities` array | P0 | Yes |
| CUST-003 | Customer with multiple properties | 1. Get a customer associated with 2+ properties | `properties` array has multiple entries, each with unique propertyID | P1 | Yes |
| CUST-004 | Non-existent customerID | 1. Send `GET /customers/00000000-0000-0000-0000-000000000000` | 404 with `NOT_FOUND` | P1 | Yes |
| CUST-005 | Malformed customerID | 1. Send `GET /customers/not-a-uuid` | 400 with `INVALID_REQUEST` | P2 | Yes |

### 9. Customers — `GET /customers/{customerID}/properties/{propertyID}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CUST-006 | Get customer property — happy path | 1. Send `GET /customers/{cID}/properties/{pID}` | 200 with `customerID`, `propertyID`, `buildingID`, `buildingName`, `unitNumber`, `address`, `utilities` (with accountNumber, status, dates) | P0 | Yes |
| CUST-007 | Customer-property mismatch | 1. Send with valid customerID but propertyID belonging to another customer | 404 with `NOT_FOUND` | P1 | Yes |
| CUST-008 | Non-existent propertyID for customer | 1. Send with valid customerID but `propertyID=999999` | 404 with `NOT_FOUND` | P2 | Yes |

### 10. Customers — `GET /customers/{cID}/properties/{pID}/bills`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CUST-009 | Get customer property bills — happy path | 1. Send `GET /customers/{cID}/properties/{pID}/bills` | 200 with `customerID`, `propertyID`, `data` array of bills, `total`, `limit: 12` | P0 | Yes |
| CUST-010 | Filter by accountType | 1. Send with `accountType=electric` | All bills have `accountType: "electric"` | P1 | Yes |
| CUST-011 | Filter by date range | 1. Send with `startDate` and `endDate` | Bills within range only | P1 | Yes |
| CUST-012 | Custom pagination | 1. Send with `limit=5&offset=0` | At most 5 bills, correct pagination metadata | P1 | Yes |

### 11. Customers — `GET /customers/{cID}/properties/{pID}/bills/{billID}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CUST-013 | Get specific bill — happy path | 1. Send full nested path with valid IDs | 200 with complete bill object (id, accountID, accountType, dates, amount, usage, pdfURL) | P0 | Yes |
| CUST-014 | Bill ID mismatch — wrong property | 1. Send with valid cID and pID but billID belonging to another property | 404 with `NOT_FOUND` | P1 | Yes |
| CUST-015 | Non-existent billID | 1. Send with `billID=999999` | 404 with `NOT_FOUND` | P2 | Yes |
| CUST-016 | pdfURL is signed and short-lived | 1. Get a bill 2. Verify pdfURL contains signing parameters (e.g., token, expiry) | URL includes signing params | P2 | No |

### 12. Customers — `GET /customers/{cID}/properties/{pID}/intervals`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| INT-001 | Get intervals — happy path | 1. Send `GET .../intervals` for property with meter data | 200 with `customerID`, `propertyID`, `firstIntervalDiscovered`, `lastIntervalDiscovered`, `granularity`, `usageUnit`, `intervals` array, `total` | P0 | Yes |
| INT-002 | Interval object shape | 1. Get first interval from response | Has `start` (ISO 8601), `end` (ISO 8601), `consumption` (float), `createdAt` (ISO 8601) | P0 | Yes |
| INT-003 | Filter by date range | 1. Send with `startDate=2024-01-15&endDate=2024-01-16` | Only intervals within that date range returned | P1 | Yes |
| INT-004 | Custom granularity request | 1. Send with `granularity=60` (hourly) | Response `granularity` is 60, intervals are hourly | P1 | Yes |
| INT-005 | Default granularity — native | 1. Send without `granularity` param | Response uses native granularity of the account (e.g., 15 min) | P1 | Yes |
| INT-006 | No interval data available | 1. Send for a property with no smart meter data | 200 with empty `intervals` array | P1 | Yes |
| INT-007 | Granularity mismatch (Open Question #3) | 1. Request 15-min granularity for account with only hourly data | TBD — verify behavior matches spec decision (aggregate/native/error) | P2 | No |

### 13. Customers — `POST /customers/search`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| SRCH-001 | Search by email — exact match | 1. Send `POST /customers/search` with `{ "email": "known@example.com" }` | 200 with `data` array containing matching customer with properties | P0 | Yes |
| SRCH-002 | Search by externalLeaseID | 1. Send with `{ "externalLeaseID": "lease_xyz_001" }` | 200 with matching customer | P0 | Yes |
| SRCH-003 | Search by firstName + lastName | 1. Send with `{ "firstName": "Jane", "lastName": "Doe" }` | 200 with matching customers | P1 | Yes |
| SRCH-004 | Search by multiple fields (AND logic) | 1. Send with email + firstName + lastName | 200 with customers matching ALL criteria | P1 | Yes |
| SRCH-005 | Search — no matching results | 1. Send with `{ "email": "nonexistent@nowhere.com" }` | 200 with empty `data` array, `total: 0` | P1 | Yes |
| SRCH-006 | Search — empty body | 1. Send `POST /customers/search` with `{}` (no params) | 400 — at least one parameter required | P0 | Yes |
| SRCH-007 | Search — partner scoping | 1. Search for a customer belonging to Partner A using Partner B's key | 200 with empty `data` (not 403 — search just returns no results) | P1 | Yes |
| SRCH-008 | Search response includes properties and utilities | 1. Search for a known customer | Result includes `properties[].utilities[].accountID`, `accountType`, `status` | P1 | Yes |

### 14. Customers — `POST /customers/auth` (SSO)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| SSO-001 | Auth existing user — dashboard redirect | 1. Send `POST /customers/auth` with `externalUserID`, `email` (existing active user), `partnerCode` | 200 with `status: "EXISTING"`, `flowType: "dashboard"`, `url` containing token, `accessToken`, `expiresIn` | P0 | Yes |
| SSO-002 | Auth unknown user — move-in flow (default) | 1. Send with new user email, `flowType: "move-in"` | 200 with `status: "UNKNOWN"`, `flowType: "move-in"`, `url` pointing to move-in registration | P0 | Yes |
| SSO-003 | Auth unknown user — verify flow | 1. Send with new user email, `flowType: "verify"` | 200 with `status: "UNKNOWN"`, `flowType: "verify"`, `url` pointing to verification flow | P0 | Yes |
| SSO-004 | Auth unknown user — savings flow | 1. Send with new user email, `flowType: "savings"` | 200 with `status: "UNKNOWN"`, `flowType: "savings"`, `url` pointing to savings/bill upload | P0 | Yes |
| SSO-005 | Auth — default flowType is move-in | 1. Send without `flowType` field for unknown user | 200 with `flowType: "move-in"` | P1 | Yes |
| SSO-006 | Auth — missing required externalUserID | 1. Send without `externalUserID` | 400 with `INVALID_REQUEST` referencing `externalUserID` | P1 | Yes |
| SSO-007 | Auth — missing required email | 1. Send without `email` | 400 referencing `email` | P1 | Yes |
| SSO-008 | Auth — missing required partnerCode | 1. Send without `partnerCode` | 400 referencing `partnerCode` | P1 | Yes |
| SSO-009 | Auth — invalid partnerCode | 1. Send with `partnerCode: "nonexistent-partner"` | 401 or 403 | P1 | Yes |
| SSO-010 | Auth — accessToken is valid JWT | 1. Get accessToken from auth response 2. Decode JWT | Token is valid, contains expected claims | P2 | Yes |
| SSO-011 | Auth — expiresIn matches spec (600s) | 1. Get auth response | `expiresIn: 600` | P2 | Yes |
| SSO-012 | Auth — URL is iframe-ready with embedded token | 1. Get auth response 2. Verify `url` contains token param | URL includes `?token=` parameter matching `accessToken` | P1 | Yes |
| SSO-013 | Auth — optional fields pre-fill | 1. Send with all optional fields (firstName, lastName, phone, address) for unknown user | 200 — fields accepted, URL may include pre-fill params | P2 | Yes |
| SSO-014 | Auth — phone E.164 format validation | 1. Send with `phone: "not-a-phone"` | 400 with validation error for phone format | P2 | Yes |

### 15. Registration — `POST /registration/move-in`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| REG-001 | Move-in — full payload | 1. Send `POST /registration/move-in` with building, resident (all fields), property (all fields), enrollment (moveInDate, type: "move-in") | 201 with `success: true`, `data.registrationID`, `data.status: "pending_identity"`, `data.message`, `data.finishRegistrationURL` | P0 | Yes |
| REG-002 | Move-in — minimum viable payload | 1. Send with only `resident.firstName`, `resident.lastName`, `resident.email`, `enrollment.type: "move-in"` | 201 — PG will collect remaining info via email | P0 | Yes |
| REG-003 | Move-in — missing firstName | 1. Send without `resident.firstName` | 400 with `INVALID_REQUEST` | P1 | Yes |
| REG-004 | Move-in — missing lastName | 1. Send without `resident.lastName` | 400 | P1 | Yes |
| REG-005 | Move-in — missing email | 1. Send without `resident.email` | 400 | P1 | Yes |
| REG-006 | Move-in — missing enrollment.type | 1. Send without `enrollment.type` | 400 | P1 | Yes |
| REG-007 | Move-in — invalid enrollment.type | 1. Send with `enrollment.type: "invalid"` | 400 | P1 | Yes |
| REG-008 | Move-in — enrollment type "verification" | 1. Send with `enrollment.type: "verification"` | 201 with appropriate status (may differ from move-in) | P1 | Yes |
| REG-009 | Move-in — duplicate email | 1. Register user A 2. Attempt registration with same email | 409 with `CONFLICT` | P0 | Yes |
| REG-010 | Move-in — finishRegistrationURL is valid | 1. Register a new user 2. Verify `finishRegistrationURL` | URL contains token, points to onepublicgrid.com/move-in | P0 | Yes |
| REG-011 | Move-in — registrationID is unique | 1. Register two users 2. Compare registrationIDs | IDs are different | P2 | Yes |
| REG-012 | Move-in — phone E.164 format | 1. Send with `resident.phone: "+12125551234"` | Accepted | P2 | Yes |
| REG-013 | Move-in — invalid phone format | 1. Send with `resident.phone: "abc"` | 400 or accepted (spec says optional) | P2 | Yes |
| REG-014 | Move-in — dateOfBirth format | 1. Send with `resident.dateOfBirth: "1990-05-15"` | Accepted | P2 | Yes |
| REG-015 | Move-in — DB verification | 1. Register a user 2. Query Supabase for CottageUser by email | User record created with correct firstName, lastName, email | P1 | Yes |

### 16. Registration — `POST /registration/savings-enrollment`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| SAV-001 | Savings enrollment — full payload | 1. Send `POST /registration/savings-enrollment` with resident (all fields) + property (all fields) | 201 with `success: true`, `data.registrationID`, `data.status: "pending_bill_upload"`, `data.finishRegistrationURL` | P0 | Yes |
| SAV-002 | Savings — minimum viable payload | 1. Send with only `resident.firstName`, `resident.lastName`, `resident.email` | 201 | P0 | Yes |
| SAV-003 | Savings — missing required fields | 1. Send without `resident.email` | 400 | P1 | Yes |
| SAV-004 | Savings — finishRegistrationURL points to savings | 1. Register for savings 2. Check URL | URL points to onepublicgrid.com/savings | P1 | Yes |
| SAV-005 | Savings — duplicate email | 1. Enroll user 2. Attempt same email again | 409 with `CONFLICT` | P1 | Yes |

### 17. Utilities — `GET /utilities`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| UTIL-001 | List utilities — no filters | 1. Send `GET /utilities` | 200 with `data` array, `total`. Each utility has `id`, `name`, `website`, `phone`, `pgEnabled`, `utilitiesHandled`, `states` | P0 | Yes |
| UTIL-002 | Filter by state | 1. Send `GET /utilities?state=NY` | All returned utilities have `"NY"` in their `states` array | P1 | Yes |
| UTIL-003 | Filter by pgEnabled=true | 1. Send `GET /utilities?pgEnabled=true` | All returned utilities have `pgEnabled: true` | P1 | Yes |
| UTIL-004 | Filter by state + pgEnabled | 1. Send `GET /utilities?state=NY&pgEnabled=true` | Results match both filters | P1 | Yes |
| UTIL-005 | utilitiesHandled values | 1. Get utilities response | Each utility's `utilitiesHandled` contains one or more of `["electricity", "gas"]` | P1 | Yes |
| UTIL-006 | Invalid state code | 1. Send `GET /utilities?state=ZZ` | 200 with empty `data` array (or 400 — depends on implementation) | P2 | Yes |

### 18. Utilities — `GET /utilities/zip/{zip}`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| ZIP-001 | Zip lookup — known zip (10001) | 1. Send `GET /utilities/zip/10001` | 200 with `zip: "10001"`, `utilityProviders` array with Con Edison (`pgEnabled: true`) | P0 | Yes |
| ZIP-002 | Utility provider object shape | 1. Check provider in response | Has `id`, `name`, `isPrimaryUtility` (boolean), `pgEnabled` (boolean), `website`, `phone`, `utilitiesHandled` | P0 | Yes |
| ZIP-003 | Zip with no utility coverage | 1. Send `GET /utilities/zip/00000` (invalid/uncovered zip) | 200 with empty `utilityProviders` array OR 404 | P1 | Yes |
| ZIP-004 | Invalid zip format (3 digits) | 1. Send `GET /utilities/zip/123` | 400 with `INVALID_REQUEST` | P2 | Yes |
| ZIP-005 | Non-numeric zip | 1. Send `GET /utilities/zip/abcde` | 400 with `INVALID_REQUEST` | P2 | Yes |
| ZIP-006 | Multiple providers for one zip | 1. Look up a zip with electric + gas providers | Response has multiple entries with different `utilitiesHandled` values | P1 | Yes |

### 19. Webhooks

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| WH-001 | customer.created fires on registration | 1. Register a new customer via `POST /registration/move-in` 2. Check webhook receiver | Webhook received with event type `customer.created`, includes customer data | P0 | No |
| WH-002 | customer.activated fires on account activation | 1. Activate a customer account 2. Check webhook receiver | Webhook received with `customer.activated` | P1 | No |
| WH-003 | customer.status_changed fires on status change | 1. Change a customer's account status 2. Check webhook | Webhook received with `customer.status_changed`, includes old and new status | P1 | No |
| WH-004 | customer.deactivated fires on deactivation | 1. Deactivate/move out a customer 2. Check webhook | Webhook received with `customer.deactivated` | P1 | No |
| WH-005 | bill.created fires when bill available | 1. Create a new bill for a customer 2. Check webhook | Webhook received with `bill.created`, includes bill data | P1 | No |
| WH-006 | bill.paid fires on payment | 1. Process a bill payment 2. Check webhook | Webhook received with `bill.paid` | P1 | No |
| WH-007 | X-PG-Signature header present | 1. Trigger any webhook event 2. Inspect headers | `X-PG-Signature` header present with valid HMAC signature | P0 | No |
| WH-008 | Webhook payload matches spec format | 1. Receive any webhook 2. Validate payload structure | Consistent JSON format, includes event type, timestamp, and relevant data | P1 | No |
| WH-009 | Webhook retries on failure | 1. Configure webhook endpoint to return 500 2. Trigger event | PG retries delivery (exact retry policy TBD) | P2 | No |
| WH-010 | Webhooks respect partner scoping | 1. Register customer under Partner A 2. Check Partner B's webhook endpoint | Partner B does NOT receive the event | P1 | No |

### 20. Error Handling (Cross-cutting)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| ERR-001 | Error format consistency | 1. Trigger a 400 error 2. Validate response structure | `{ "error": { "code": "...", "message": "...", "details": { ... } } }` | P0 | Yes |
| ERR-002 | 400 INVALID_REQUEST format | 1. Send malformed request to any endpoint | `error.code: "INVALID_REQUEST"`, `error.details.field` and `error.details.reason` present | P0 | Yes |
| ERR-003 | 401 UNAUTHORIZED format | 1. Send request without auth | `error.code: "UNAUTHORIZED"` | P0 | Yes |
| ERR-004 | 403 FORBIDDEN format | 1. Access another partner's resource | `error.code: "FORBIDDEN"` | P1 | Yes |
| ERR-005 | 404 NOT_FOUND format | 1. Request non-existent resource | `error.code: "NOT_FOUND"` | P1 | Yes |
| ERR-006 | 409 CONFLICT format | 1. Duplicate registration | `error.code: "CONFLICT"` | P1 | Yes |
| ERR-007 | Content-Type application/json required | 1. Send POST with `Content-Type: text/plain` | 400 or 415 error | P2 | Yes |
| ERR-008 | Invalid JSON body | 1. Send POST with malformed JSON `{broken` | 400 with parse error | P2 | Yes |
| ERR-009 | Method not allowed | 1. Send `DELETE /buildings/{id}` (unsupported method) | 405 Method Not Allowed | P2 | Yes |
| ERR-010 | Unknown endpoint path | 1. Send `GET /api/v2/nonexistent` | 404 | P2 | Yes |

### 21. Data Convention Validation (Cross-cutting)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| CONV-001 | Building IDs are UUIDs | 1. Get any building | `id` matches UUID format (8-4-4-4-12 hex) | P1 | Yes |
| CONV-002 | Customer IDs are UUIDs | 1. Get any customer | `id` matches UUID format | P1 | Yes |
| CONV-003 | Property IDs are integers | 1. Get any property | `id` is an integer | P1 | Yes |
| CONV-004 | Account IDs are integers | 1. Get property with utilities | `utilities[].accountID` is an integer | P1 | Yes |
| CONV-005 | Bill IDs are integers | 1. Get a bill | `id` is an integer | P1 | Yes |
| CONV-006 | Timestamps are ISO 8601 | 1. Get any resource with timestamps | `createdAt`, `startDate`, `endDate` all match ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) | P1 | Yes |
| CONV-007 | Monetary amounts in cents | 1. Get a bill | `totalAmountDueCents` is an integer (not decimal) | P1 | Yes |
| CONV-008 | Usage includes usageUnit | 1. Get a bill or interval with usage data | `usageUnit` field present (e.g., "kWh", "therms") alongside usage value | P1 | Yes |

---

## UX & Improvement Opportunities

| ID | Area | Observation | Impact | Suggestion |
|----|------|-------------|--------|------------|
| UX-001 | Error details | Spec shows `details.field` and `details.reason` but no mention of multiple field errors | Partners may only see the first validation error, requiring repeated submissions to fix all issues | Return an array of field errors in a single response (e.g., `details.fields: [{ field, reason }]`) |
| UX-002 | Pagination consistency | `/properties/{id}/bills` defaults to `limit: 12, max: 50` while all other lists default to `limit: 50, max: 100` | Partners may be confused by inconsistent defaults | Standardize pagination defaults or document the reasoning (12 = 1 year of monthly bills) |
| UX-003 | POST /buildings/create access | Open Question #1 in spec — unrestricted building creation could corrupt data | Partner creates building with wrong utility assignments → downstream move-in failures | Restrict to admin/onboarding scope or add a review/approval step |
| UX-004 | accountNumber PII exposure | Open Question #2 in spec — full account numbers in list responses | PII exposure risk if partner system is compromised | Mask in list responses (e.g., `****5678`), expose full only on detail endpoint with explicit include param |
| UX-005 | Interval granularity contract | Open Question #3 — no defined behavior for mismatched granularity requests | Partners get unpredictable responses, breaking their dashboards | Return native granularity with a `requestedGranularity` field indicating what was asked for vs. what's available |
| UX-006 | pdfURL expiration not documented | Spec says "short-lived" but doesn't specify TTL | Partners cache URLs that expire, then get broken links for end users | Document exact TTL (e.g., 15 minutes) and add an `expiresAt` field to the bill response |
| UX-007 | Search requires POST (unconventional) | `POST /customers/search` uses POST for a read operation | Partners expecting RESTful GET with query params may be confused | Consider supporting `GET /customers?email=...` as an alias, or document the POST-for-search rationale clearly |
| UX-008 | No rate limiting documentation | Spec doesn't mention rate limits | Partners may hit undocumented limits, causing production outages | Document rate limits per endpoint (or at least per-key global limit) in the spec |
| UX-009 | No versioning strategy documented | Base URL is `/api/v2` but no deprecation/sunset policy | Partners can't plan for future API changes | Add a versioning policy section: how long v2 will be supported, sunset notice period, changelog format |
| UX-010 | Webhook retry policy unspecified | Spec mentions webhooks but no retry, timeout, or failure handling | Partners can't build reliable webhook consumers without knowing retry behavior | Document: retry count, backoff strategy, timeout, dead letter queue |

> These are not test failures — the feature works as specified. These are opportunities to improve the API and partner developer experience identified during test planning. File actionable ones as improvement tickets via `/log-bug`.

---

## Automation Plan

### Smoke (P0 — Critical Path)
Tests to include in smoke suite: AUTH-001, AUTH-002, AUTH-006, BLD-001, BLD-006, BLD-010, BLD-014, PROP-001, PROP-005, PROP-009, BILL-001, BILL-002, CUST-001, CUST-006, CUST-009, CUST-013, INT-001, SRCH-001, SRCH-006, SSO-001, SSO-002, REG-001, REG-002, REG-009, SAV-001, UTIL-001, ZIP-001, ERR-001, ERR-002, ERR-003
**Count: ~30 smoke tests**

### Regression Scope
- **Regression1**: All Auth + Buildings + Properties tests (~35 tests)
- **Regression2**: All Customers + Search + SSO tests (~35 tests)
- **Regression3**: All Registration + Utilities + Error Handling + Conventions tests (~35 tests)

### Exploratory Only (manual)
- WH-001 through WH-010 (webhooks require receiver setup — manual until webhook test infrastructure is built)
- BILL-011 (pdfURL accessibility — requires fetching signed URL)
- CUST-016 (pdfURL signing verification)
- INT-007 (granularity mismatch — Open Question #3, behavior TBD)

### Test Infrastructure Needed
| Component | Purpose | Location |
|-----------|---------|----------|
| `PublicGridApiV2` helper class | Base class for all v2 API calls (auth, base URL, common methods) | `tests/resources/fixtures/api/publicGridApiV2.ts` |
| `BuildingsApi` helper | Buildings-specific methods (list, get, create) | `tests/resources/fixtures/api/buildingsApi.ts` |
| `PropertiesApi` helper | Properties + bills methods | `tests/resources/fixtures/api/propertiesApi.ts` |
| `CustomersApi` helper | Customers, search, auth, bills, intervals | `tests/resources/fixtures/api/customersApi.ts` |
| `RegistrationApi` helper | Move-in, savings-enrollment | `tests/resources/fixtures/api/registrationApi.ts` |
| `UtilitiesApi` helper | Utilities list, zip lookup | `tests/resources/fixtures/api/utilitiesApi.ts` |
| API v2 types | Request/response TypeScript types for all endpoints | `tests/resources/types/apiV2.types.ts` |
| API v2 constants | Base URLs, default pagination values, status enums | `tests/resources/constants/apiV2.ts` |

---

## Risks & Notes

### Risks
- **No API key available yet** — spec is Draft v0.2; test execution blocked until dev provides test partner API keys
- **Webhook testing infra** — requires a webhook receiver endpoint (e.g., webhook.site or custom server) to capture and validate events
- **Open Questions unresolved** — 3 open questions in spec affect test expectations (building create ACL, accountNumber visibility, interval granularity)
- **v1/v2 coexistence** — registration endpoints may overlap with existing v1 `/register` endpoint; need clarification on whether both remain active
- **Partner scoping test data** — need at least 2 partner API keys with distinct building sets to verify isolation
- **pdfURL signed URL testing** — URLs may expire quickly; automated tests need to fetch immediately

### Notes
- Existing v1 register tests at [register_endpoint.spec.ts](tests/api_tests/register/register_endpoint.spec.ts) provide the pattern for API test structure (helper class + types + cleanup)
- Test file structure: `tests/api_tests/v2/{resource}/` (e.g., `tests/api_tests/v2/buildings/`, `tests/api_tests/v2/customers/`)
- All test users created via registration endpoints must be cleaned up in `afterAll` hooks
- Buildings created via `POST /buildings/create` should be deleted or use unique names to avoid pollution
- The `POST /customers/auth` SSO endpoint is the most complex — it involves flow routing logic that touches existing move-in, verify, and savings flows

### Test Case Summary
| Category | Count |
|----------|-------|
| Authentication & Authorization | 8 |
| Buildings (list, get, create) | 15 |
| Properties (list, get, bills) | 16 |
| Customers (get, property, bills, bill, intervals) | 16 |
| Customer Search | 8 |
| Customer SSO Auth | 14 |
| Registration (move-in, savings) | 20 |
| Utilities (list, zip) | 12 |
| Webhooks | 10 |
| Error Handling | 10 |
| Data Conventions | 8 |
| **Total** | **137** |
