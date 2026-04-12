# Test Plan: ENG-2639 — Renew x Public Grid Energy Savings Alerts Enrollment API

## Overview
**Ticket**: [ENG-2639](https://linear.app/public-grid/issue/ENG-2639/task-renew-x-public-grid-energy-savings-alerts-enrollment-api)
**PR**: [services PR #386](https://github.com/Cottage-Energy/services/pull/386) — `feat: add shared enrollment flow`
**Date**: 2026-04-08
**Tester**: Christian
**Status**: Testing/QA

## Summary
New backend API endpoint `POST /v1/resident/alerts-enrollment` that allows partners (starting with Renew) to enroll residents in energy savings alerts via a single API call. The endpoint creates a full user account (Supabase auth + Stripe + CottageUser), maps address to a utility company via zip, creates charge accounts (BLNK), and sends a welcome email. The resident never leaves the partner's platform.

**Key design decisions from code review:**
- Shared/generic — any valid partner in `PARTNER_NAMES` can use it (`moved`, `venn`, `roofstock`, `virtuo`, `renew`)
- Non-billing flow: `maintainedFor = null`, `is_handle_billing = false`
- `externalLeaseID` is set to the user's email (not a lease ID)
- `propertyType` hardcoded as `APARTMENT`
- Email normalized via Zod `.email().transform(v => v.trim().toLowerCase())`
- `consentDate` stored as `termsAndConditionsDate` on CottageUsers
- Referral only created if `PARTNER_MOVE_IN_PARTNER_ID[partnerCode]` is non-empty

## Endpoint Details
| Field | Value |
|-------|-------|
| URL | `POST /v1/resident/alerts-enrollment` |
| Auth | Bearer token (`RENEW_STATIC_API_KEY`) |
| Content-Type | `application/json` |
| Server | Partner API (`api-dev.publicgrd.com`) |

### Request Schema (Zod)
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `partnerCode` | string | Yes | Enum: `moved`, `venn`, `roofstock`, `virtuo`, `renew` |
| `firstName` | string | Yes | `min(1)` — no max length |
| `lastName` | string | Yes | `min(1)` — no max length |
| `email` | string | Yes | `.email().transform(trim + lowercase)` |
| `streetAddress` | string | Yes | `min(1)` — no max length |
| `unitNumber` | string | No | Optional |
| `city` | string | Yes | `min(1)` — no max length |
| `state` | string | Yes | `length(2)` (exact) |
| `zip` | string | Yes | `length(5)` (exact) |
| `consentDate` | string | No | `z.iso.datetime()` optional |

### Response Shapes
| Status | Shape | When |
|--------|-------|------|
| 200 | `{ success: true, message: "User successfully enrolled in savings alerts" }` | Success |
| 400 | `{ statusCode: 400, code: "FST_ERR_VALIDATION", error: "Bad Request", message: "..." }` | Zod validation failure |
| 400 | `{ success: false, message: "User with email X already exists" }` | Duplicate email |
| 400 | `{ success: false, message: "No utility company found for zip code X" }` | No utility for zip |
| 401 | `{ error: "missing authorization header" }` | No Bearer token |
| 401 | `{ error: "invalid authorization header" }` | Wrong token |
| 404 | `{ message: "Route METHOD:/.../alerts-enrollment not found", ... }` | Wrong HTTP method |
| 415 | `{ statusCode: 415, code: "FST_ERR_CTP_INVALID_MEDIA_TYPE", ... }` | Missing Content-Type |
| 500 | `{ success: false, message: "Internal server error. Please retry." }` | Internal failure |

### DB Records Created (on success)
| Table | Key Fields |
|-------|------------|
| `auth.users` | email, password (random), `email_confirm: true`, `referralCode` in metadata |
| `CottageUsers` | stripeCustomerID, `enrollmentPreference: "manual"`, `isEligibleForRetargeting: true`, `termsAndConditionsDate` (if consentDate provided) |
| `Address` | street, city, state, zip, `country: "US"` |
| `Property` | `type: "APARTMENT"`, unitNumber, `externalLeaseID: email`, addressID |
| `ElectricAccount` | `status: "ELIGIBLE"`, utilityCompanyID (from zip lookup), `maintainedFor: null` |
| `Referrals` | referred = userId, referredBy = partner ID, `referralStatus: "complete"` (**only if partner has non-empty MoveInPartnerID**) |
| `ResidentIdentity` | cottageUserID (upsert) |
| Stripe | Customer with email, name, cottageUserID metadata |
| BLNK | Charge accounts for electric account |

---

## Test Cases

### 1. Happy Path — Successful Enrollment

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 1.1 | POST with all required fields + valid `renew` partnerCode, MA zip (02101) | 200, success message, all DB records created | P0 |
| 1.2 | POST with `unitNumber` included | 200, `Property.unitNumber` populated | P0 |
| 1.3 | POST with `consentDate` (valid ISO 8601) | 200, `CottageUsers.termsAndConditionsDate` matches | P0 |
| 1.4 | POST without `consentDate` | 200, `termsAndConditionsDate` is null | P1 |
| 1.5 | POST without `unitNumber` | 200, `Property.unitNumber` is null | P1 |

### 2. Cross-Partner Enrollment

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 2.1 | POST with `partnerCode: "moved"` | 200, Referral record created with moved partner ID | P0 |
| 2.2 | POST with `partnerCode: "venn"` | 200, Referral record created with venn partner ID | P1 |
| 2.3 | POST with `partnerCode: "roofstock"` | 200, **no Referral record** (empty PARTNER_MOVE_IN_PARTNER_ID) | P1 |
| 2.4 | POST with `partnerCode: "virtuo"` | 200, **no Referral record** (empty PARTNER_MOVE_IN_PARTNER_ID) | P1 |

### 3. Utility Company Mapping

| # | Test Case | Zip | Expected Utility | Priority |
|---|-----------|-----|------------------|----------|
| 3.1 | Valid zip with primary utility | `02101` (Boston, MA) | Eversource | P0 |
| 3.2 | Valid zip with different utility | `10007` (New York, NY) | Con Edison | P0 |
| 3.3 | Valid zip with ComEd | `60601` (Chicago, IL) | ComEd | P1 |
| 3.4 | Zip with no matching utility | `82609` (Casper, WY) | 400 "No utility company found for zip code 82609" | P0 |
| 3.5 | TX zip (deregulated market) | `75063` | Check if TX-DEREG utility maps correctly | P2 |

### 4. DB Record Verification

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 4.1 | Verify `CottageUsers.enrollmentPreference` = `"manual"` | Correct | P0 |
| 4.2 | Verify `CottageUsers.isEligibleForRetargeting` = `true` | Correct | P0 |
| 4.3 | Verify `ElectricAccount.status` = `"ELIGIBLE"` | Correct | P0 |
| 4.4 | Verify `ElectricAccount.maintainedFor` = `null` | Correct (non-billing) | P0 |
| 4.5 | Verify `Property.type` = `"APARTMENT"` | Correct | P1 |
| 4.6 | Verify `Property.externalLeaseID` = email | Correct | P1 |
| 4.7 | Verify `Address.country` = `"US"` | Correct | P2 |
| 4.8 | Verify Stripe customer has `cottageUserID` in metadata | Correct | P1 |
| 4.9 | Verify `Referrals.referralStatus` = `"complete"` | Correct | P1 |
| 4.10 | Verify auth.users `email_confirm` = `true` | User can log in without email verification | P1 |

### 5. Authentication

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 5.1 | No `Authorization` header | 401 `{ error: "missing authorization header" }` | P0 |
| 5.2 | Invalid Bearer token | 401 `{ error: "invalid authorization header" }` | P0 |
| 5.3 | Empty `Authorization: Bearer ` (no token value) | 401 | P1 |
| 5.4 | Auth header without "Bearer" prefix | 401 | P2 |

### 6. Zod Validation Errors (400)

| # | Test Case | Expected Error | Priority |
|---|-----------|---------------|----------|
| 6.1 | Empty body `{}` | 400, lists all required fields | P0 |
| 6.2 | Missing single required field (email) | 400, specific field error | P0 |
| 6.3 | Invalid `partnerCode` (not in enum) | 400, lists valid options | P0 |
| 6.4 | Invalid `email` format (`"not-an-email"`) | 400, "Invalid email address" | P0 |
| 6.5 | `state` too short (1 char: `"M"`) | 400, "Too small: expected string to have >=2 characters" | P1 |
| 6.6 | `state` too long (3 chars: `"MAS"`) | 400, "Too big: expected string to have <=2 characters" | P1 |
| 6.7 | `zip` too short (4 digits: `"0210"`) | 400, "Too small: expected string to have >=5 characters" | P1 |
| 6.8 | `zip` too long (6 digits: `"021019"`) | 400, "Too big: expected string to have <=5 characters" | P1 |
| 6.9 | Empty string for `firstName` | 400, "Too small: expected string to have >=1 characters" | P1 |
| 6.10 | Empty strings for all `min(1)` fields | 400, multiple field errors | P1 |
| 6.11 | Invalid `consentDate` (`"not-a-date"`) | 400, "Invalid ISO datetime" | P1 |
| 6.12 | Wrong type: number for `firstName` | 400, "expected string, received number" | P2 |
| 6.13 | Wrong type: boolean for `lastName` | 400, "expected string, received boolean" | P2 |
| 6.14 | Wrong type: number for `zip` | 400, "expected string, received number" | P2 |

### 7. Business Logic Errors (400)

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 7.1 | Duplicate email (enroll same email twice) | 400 `{ success: false, message: "User with email X already exists" }` | P0 |
| 7.2 | Email case insensitive duplicate (`USER@EXAMPLE.COM` after `user@example.com`) | 400, duplicate detected (Zod normalizes to lowercase) | P0 |
| 7.3 | Zip with no utility company (`82609`) | 400 `{ success: false, message: "No utility company found for zip code 82609" }` | P0 |

### 8. HTTP Method & Content-Type

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 8.1 | GET method | 404 "Route GET:/v1/resident/alerts-enrollment not found" | P1 |
| 8.2 | PUT method | 404 | P1 |
| 8.3 | DELETE method | 404 | P2 |
| 8.4 | PATCH method | 404 | P2 |
| 8.5 | Missing `Content-Type` header | 415 Unsupported Media Type | P1 |

### 9. Edge Cases & Boundary Tests

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 9.1 | Email with leading/trailing whitespace (`"  user@example.com  "`) | 400 (Zod email validation rejects pre-trim whitespace) | P1 |
| 9.2 | Extra unknown fields in body | Silently stripped, 200 success | P1 |
| 9.3 | Very long `firstName` (250+ chars) | **BUG: Returns 500** — no `maxLength` validation | P0 |
| 9.4 | Unicode characters in name (`"José"`, `"Müller"`) | Should succeed | P2 |
| 9.5 | Special characters in `streetAddress` (`"123 Main St #4B"`) | Should succeed | P2 |
| 9.6 | `consentDate` in different ISO 8601 formats (`"2026-04-15"` vs `"2026-04-15T14:30:00Z"`) | Verify which formats accepted | P2 |
| 9.7 | `consentDate` in the past | Should succeed (consent already given) | P2 |
| 9.8 | HTML/script injection in name fields (`<script>alert(1)</script>`) | Stored as-is in DB (XSS risk for admin UIs) | P1 |

### 10. Slack Notifications

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 10.1 | Success → Slack message to `partner-alerts-enrollment` | Contains partner, email, userId | P2 |
| 10.2 | Failure → Slack message to `partner-alerts-enrollment` | Contains partner, errorType, masked email | P2 |
| 10.3 | Slack message masks email domain (`@***`) in failure notifications | Privacy protection | P2 |

### 11. Welcome Email (Inngest)

| # | Test Case | Expected | Priority |
|---|-----------|----------|----------|
| 11.1 | Successful enrollment triggers `email.send` event with `emailType: "self-service-alert"` | Email received with correct subject/firstName | P1 |
| 11.2 | Email send failure does not block enrollment | 200 returned even if Inngest fails (try/catch) | P2 |

---

## Exploratory Testing Results (2026-04-08)

### Probing Summary
All probing done against live dev API: `https://api-dev.publicgrd.com/v1/resident/alerts-enrollment`
- **Token**: `Mm5miQvplYCPTfLmDknHnV3JH8CFEDE0`
- **Test user created**: `john@example.com` (Supabase ID: `d5bc1986-a807-4236-9658-1c51e118b4e1`)

### Results by Category

#### Happy Path — PASS
| Probe | Result | Status |
|-------|--------|--------|
| Full payload with renew + consentDate | 200 success | PASS |
| DB: CottageUser created with correct fields | enrollmentPreference=manual, isEligibleForRetargeting=true, termsAndConditionsDate matches | PASS |
| DB: Address created | street=123 Main St, city=Boston, state=MA, zip=02101, country=US | PASS |
| DB: Property created | type=APARTMENT, unitNumber=4B, externalLeaseID=john@example.com | PASS |
| DB: ElectricAccount created | status=ELIGIBLE, utilityCompanyID=EVERSOURCE, maintainedFor=null | PASS |
| DB: Referral created | referredBy=renew partner ID, referralStatus=complete | PASS |
| DB: ResidentIdentity created | cottageUserID present | PASS |
| Cross-partner: moved | 200, Referral created | PASS |
| Cross-partner: roofstock | 200, NO Referral (empty partner ID — expected) | PASS |

#### Validation — PASS
| Probe | Result | Status |
|-------|--------|--------|
| Empty body | 400, all required fields listed | PASS |
| Invalid partnerCode | 400, enum options listed | PASS |
| Invalid email | 400, "Invalid email address" | PASS |
| State too short (1 char) | 400 | PASS |
| State too long (3 chars) | 400 | PASS |
| Zip too short (4 digits) | 400 | PASS |
| Zip too long (6 digits) | 400 | PASS |
| Empty strings for min(1) fields | 400 | PASS |
| Invalid consentDate | 400 | PASS |
| Wrong types (number, boolean) | 400, specific type errors | PASS |

#### Business Logic — PASS
| Probe | Result | Status |
|-------|--------|--------|
| Duplicate email | 400 "User with email john@example.com already exists" | PASS |
| Email case normalization (`JOHN@EXAMPLE.COM`) | Detected as duplicate (normalized) | PASS |
| No utility for zip 82609 | 400 "No utility company found for zip code 82609" | PASS |

#### Auth — PASS
| Probe | Result | Status |
|-------|--------|--------|
| No auth header | 401 "missing authorization header" | PASS |
| Wrong token | 401 "invalid authorization header" | PASS |

#### HTTP/Content-Type — PASS
| Probe | Result | Status |
|-------|--------|--------|
| GET method | 404 | PASS |
| PUT method | 404 | PASS |
| Missing Content-Type | 415 | PASS |

#### Edge Cases
| Probe | Result | Status |
|-------|--------|--------|
| Email with whitespace | 400 "Invalid email address" | PASS |
| Extra unknown fields | Silently stripped, 200 success | PASS |
| Long firstName (288 chars) | **500 Internal Server Error** | **FAIL** |
| XSS in firstName | Stored as-is in DB (referralCode) | **OBSERVATION** |

---

## Bugs Found

### BUG-1: Long firstName causes 500 Internal Server Error (P1)
- **Steps**: POST with `firstName` of 250+ characters, all other fields valid
- **Expected**: 400 validation error OR 200 success with truncation
- **Actual**: 500 `{ success: false, message: "Internal server error. Please retry." }`
- **Root cause**: No `maxLength` on Zod string fields. Likely fails at Stripe customer creation (name limit) or auth user metadata (referralCode = `firstName.toUpperCase() + 6 random chars`)
- **Impact**: Partners sending long names will get unhelpful 500s. Also creates orphaned partial records (Address exists, but user creation fails mid-flow).
- **Fix**: Add `.max(100)` (or similar) to `firstName`, `lastName`, `streetAddress`, `city` in Zod schema

### BUG-2 (Low): XSS content stored in DB without sanitization
- **Steps**: POST with `firstName: "<script>alert(1)</script>"`, valid payload
- **Actual**: Stored as-is in `auth.users.raw_user_meta_data.referralCode` and in Stripe customer name
- **Impact**: Low — parameterized queries prevent SQL injection. XSS only a risk if admin UIs render these fields unescaped.
- **Recommendation**: Consider input sanitization or HTML escaping for name fields

---

## Improvement Suggestions

### [IMPROVEMENT-1] Add maxLength validation to all string fields
Currently `firstName`, `lastName`, `streetAddress`, `city` have `min(1)` but no max. This allows arbitrarily long inputs that can cause downstream failures (Stripe, auth metadata). Suggest `.max(100)` for names, `.max(255)` for address fields.

### [IMPROVEMENT-2] Include `errorType` in 400 error responses
The duplicate_email and no_utility_company 400 responses use `{ success: false, message: "..." }` but don't include the `errorType` field that exists in the service layer. Including it would help partners programmatically distinguish error types.

### [IMPROVEMENT-3] Consistent 401 response shape
Auth errors return `{ error: "..." }` without `statusCode` in the body, while Zod errors return `{ statusCode: 400, ... }`. Consider adding `statusCode` to auth error responses for consistency.

### [IMPROVEMENT-4] Rate limiting
No rate limiting observed on the endpoint. A partner could send unlimited requests creating users. Consider adding rate limiting per API key.

### [IMPROVEMENT-5] Document roofstock/virtuo Referral behavior
When `PARTNER_MOVE_IN_PARTNER_ID` is empty string, no Referral record is created. This is likely intentional (not yet configured) but should be documented so QA and partners understand the gap.

### [IMPROVEMENT-6] Idempotency / partial rollback
If enrollment fails mid-flow (e.g., after Address creation but before auth user), orphaned records remain. Consider wrapping the flow in a transaction or adding cleanup on failure.

---

## Test Data

### API Key
- Token: `Mm5miQvplYCPTfLmDknHnV3JH8CFEDE0` (stored as `RENEW_STATIC_API_KEY` in infra)

### Test Addresses by Utility
| Address | Zip | State | Maps To |
|---------|-----|-------|---------|
| 123 Main St, Boston | 02101 | MA | Eversource |
| 233 Broadway, New York | 10007 | NY | Con Edison |
| 155 N Nebraska Ave, Casper | 82609 | WY | No utility (400) |

### Valid Partner Codes
`moved`, `venn`, `roofstock`, `virtuo`, `renew`

### Sample cURL (happy path)
```bash
curl -X POST https://api-dev.publicgrd.com/v1/resident/alerts-enrollment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer Mm5miQvplYCPTfLmDknHnV3JH8CFEDE0" \
  -d '{
    "partnerCode": "renew",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "streetAddress": "123 Main St",
    "unitNumber": "4B",
    "city": "Boston",
    "state": "MA",
    "zip": "02101",
    "consentDate": "2026-04-15T14:30:00Z"
  }'
```

---

## Automation Status

**26 tests automated, all passing** (2026-04-08)

- **Spec**: `tests/api_tests/v1/alerts-enrollment/alerts_enrollment.spec.ts`
- **Helper**: `tests/resources/fixtures/api/alertsEnrollmentApi.ts`
- **Types**: `tests/resources/types/alertsEnrollment.types.ts`
- **Env var**: `RENEW_API_KEY` in `.env`
- **Run**: `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/api_tests/v1/alerts-enrollment/ --project=Chromium`

| Category | Automated | Test IDs |
|----------|-----------|----------|
| Happy Path | 3 | 1.1, 1.4, 1.5 |
| Cross-Partner | 2 | 2.1, 2.3 |
| Utility Mapping | 2 | 3.1, 3.4 |
| Auth | 2 | 5.1, 5.2 |
| Validation | 7 | 6.1, 6.3, 6.4, 6.6, 6.8, 6.9, 6.11, 6.12 |
| Business Logic | 2 | 7.1, 7.2 |
| HTTP Methods | 4 | 8.1-8.4 |
| Edge Cases | 3 | 9.2, 9.3, 9.6 |

### Learnings During Automation
- `sendMethod()` must NOT send Content-Type — Fastify validates body before route, returns 400 instead of 404
- `create_resident_from_utility_verification` RPC sets `termsAndConditionsDate` to NOW() even without `consentDate`

---

## Acceptance Criteria Verification Matrix

| AC | Status | Evidence |
|----|--------|----------|
| `POST /v1/resident/alerts-enrollment` endpoint exists | PASS | 200 on valid request |
| Authenticated via Bearer token | PASS | 401 on missing/invalid token |
| Request payload validated via Zod | PASS | 400 with specific field errors |
| `partnerCode` validated as enum | PASS | Lists valid options on invalid code |
| `state` 2-letter, `zip` 5-digit | PASS | Exact length(2) and length(5) |
| `unitNumber` and `consentDate` optional | PASS | 200 without these fields |
| Success returns 200 with success message | PASS | Exact match |
| Validation error returns 400 | PASS | Zod format |
| Internal error returns 500 with retry message | PASS | Confirmed via long name bug |
| Duplicate email returns 400 | PASS | Specific message |
| No utility company returns 400 | PASS | Specific message with zip |
| Creates: auth user, Stripe customer, Address, Resident, ElectricAccount (ELIGIBLE), charge accounts, Referral, ResidentIdentity | PASS | All verified in DB |
| Stores `consentDate` as `termsAndConditionsDate` | PASS | DB verified |
| Sends `self-service-alert` welcome email via Inngest | NOT VERIFIED | Need to check email delivery |
| Slack notification on success and failure | NOT VERIFIED | Need Slack channel access |
| Secrets added to `infra/secrets.ts` | PASS | Confirmed in PR diff |
| "renew" registered in partner maps | PASS | Confirmed in types.ts |
| Endpoint is shared/generic | PASS | Works with moved, roofstock, venn |
