# Test Plan: Flex Due Date Fallback + Connect Account Endpoint

## Overview
**PRs**: [services#271](https://github.com/Cottage-Energy/services/pull/271) (Flex due date) | [services#266](https://github.com/Cottage-Energy/services/pull/266) (Connect account)
**Ticket**: [ENG-2372](https://linear.app/public-grid/issue/ENG-2372/feat-connect-account-save-credentials-endpoint) (PR #266)
**Date**: 2026-03-09
**Tester**: Christian

## Summary

| Category | Test Cases | P0 | P1 | P2 | Approach |
|----------|-----------|----|----|----|---------:|
| Flex Due Date Fallback (PR #271) | TC-001 – TC-005 | 2 | 2 | 1 | API + UI |
| Connect Account — Happy Path (PR #266) | TC-010 – TC-016 | 4 | 3 | 0 | API + DB |
| Connect Account — Validation (PR #266) | TC-020 – TC-023 | 1 | 3 | 0 | API |
| Upsert Credentials — Regression (PR #266) | TC-030 – TC-032 | 1 | 2 | 0 | API + DB |
| UI/E2E Regression | TC-040 – TC-041 | 1 | 1 | 0 | Playwright |
| **Totals** | **20** | **9** | **11** | **1** | |

## Scope

### In Scope
- Flex bill `due_date` fallback values (3 code paths in `bill-formatter.ts`)
- New `/connect-account` Lambda endpoint (request validation, credential creation, account activation)
- `UtilityCredentialsClient.upsertCredentials` changes (`retainEmail`, `existingPassword` params)
- Existing `/upsert-credentials` endpoint backward compatibility
- DB state verification (credentials, account status, pgEmail)

### Out of Scope
- Flex payment splitting logic (no changes)
- Stripe payment processing (no changes)
- Scaffold skill files added in PR #266 (dev tooling, not runtime code)
- Infrastructure/SST deployment verification (ops team)

### Prerequisites
- Access to dev environment API endpoints
- Supabase admin access to query `CottageUsers`, `ElectricAccount`, `GasAccount`, utility credentials
- Test user with flex billing enabled (for PR #271 UI verification)
- Test user ID (UUID) for connect-account API calls
- Valid API key for authorization header

---

## Test Cases

### Flex Due Date Fallback (PR #271)

**Changed file**: `packages/flex/services/bill-formatter.ts`
**Change**: All 3 fallback `due_date` values updated — `formatBillResponse` (14→20), `emptyBillResponse` (0→20), `getMockBill` (14→20)

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|-----------------|----------|
| TC-001 | Fallback due date when bills have no due dates | Flex user with bills that have NULL `dueDate` values | 1. Call flex bill endpoint for the user 2. Check `due_date` in response | `due_date` = approximately today + 20 days (format: `YYYY-MM-DD`) | P0 |
| TC-002 | Empty bill response due date | Flex user with no bills / zero balance | 1. Call flex bill endpoint for user with no bills 2. Check `due_date` in response | `due_date` = approximately today + 20 days. `amount_due_in_cents` = 0 | P0 |
| TC-003 | Test mode mock bill due date | Any user (test mode) | 1. Call flex bill endpoint with `?test=true` 2. Check `due_date` in response | `due_date` = approximately today + 20 days. `amount_due_in_cents` = 22500 | P1 |
| TC-004 | Real due dates still used (regression) | Flex user with bills that HAVE `dueDate` populated | 1. Call flex bill endpoint for user with real bills 2. Check `due_date` in response | `due_date` = earliest real bill due date (NOT the +20 day fallback) | P1 |
| TC-005 | UI shows updated due date | Flex-enabled user logged into Cottage app | 1. Log in as flex user 2. Navigate to billing/overview 3. Observe due date display | Due date shown in UI reflects ~20 days from today (when no real due dates exist) | P2 |

**Verification queries**:
```sql
-- Check if a user's bills have NULL due dates (for TC-001 setup)
SELECT id, "dueDate", "totalAmountDue" FROM "ElectricBill"
WHERE "electricAccountID" = (
  SELECT id FROM "ElectricAccount" WHERE "cottageUserID" = '<userId>'
) ORDER BY created_at DESC LIMIT 5;

-- Verify flex status
SELECT "isFlexCustomer" FROM "CottageUsers" WHERE id = '<userId>';
```

---

### Connect Account — Happy Path (PR #266)

**New endpoint**: `POST /connect-account`
**Request body**: `{ userId, email, provider, utilityType, characterOverride?, password?, retainEmail?, accountNumber? }`
**Auth**: `Authorization` header = API key

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|-----------------|----------|
| TC-010 | Electric account — all fields provided | Test user exists in `CottageUsers`, has an `ElectricAccount` | 1. POST `/connect-account` with `utilityType: "electric"`, `password`, `retainEmail: false`, `accountNumber` 2. Query DB | 200 response. Credentials created. `ElectricAccount.accountNumber` = provided value. `ElectricAccount.status` = "ACTIVE" | P0 |
| TC-011 | Gas account — all fields provided | Test user exists, has a `GasAccount` | 1. POST `/connect-account` with `utilityType: "gas"`, `password`, `accountNumber` 2. Query DB | 200 response. Credentials created. `GasAccount.accountNumber` = provided value. `GasAccount.status` = "ACTIVE" | P0 |
| TC-012 | retainEmail=true — user's email preserved | Test user with known email | 1. POST `/connect-account` with `retainEmail: true` 2. Query `CottageUsers.pgEmail` | `pgEmail` = user's original email (not `@publicgrid.me`) | P0 |
| TC-013 | retainEmail=false — publicgrid email generated | Test user | 1. POST `/connect-account` with `retainEmail: false` (or omitted) 2. Query `CottageUsers.pgEmail` | `pgEmail` = `{username}@publicgrid.me` (or de-duplicated variant) | P1 |
| TC-014 | Without accountNumber — no account table update | Test user | 1. POST `/connect-account` without `accountNumber` field 2. Query account table | 200 response. Credentials created. Account table `accountNumber` and `status` unchanged | P1 |
| TC-015 | Without password — system generates one | Test user | 1. POST `/connect-account` without `password` field 2. Query credentials | 200 response. Credentials created with auto-generated password (not empty) | P1 |
| TC-016 | With characterOverride — override password generated | Test user | 1. POST `/connect-account` with `characterOverride: "abc"`, no `password` 2. Query credentials | 200 response. Generated password uses override character set | P0 |

**Verification queries**:
```sql
-- Check credentials were created
SELECT * FROM "admin_upsert_utility_credentials" -- or the relevant credentials table
WHERE p_user = '<userId>';

-- Check account activation
SELECT "accountNumber", status FROM "ElectricAccount" WHERE "cottageUserID" = '<userId>';
SELECT "accountNumber", status FROM "GasAccount" WHERE "cottageUserID" = '<userId>';

-- Check pgEmail
SELECT "pgEmail" FROM "CottageUsers" WHERE id = '<userId>';
```

---

### Connect Account — Input Validation (PR #266)

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|-----------------|----------|
| TC-020 | Invalid auth token | None | 1. POST `/connect-account` with wrong `Authorization` header | 400 response: "Invalid access token" | P0 |
| TC-021 | Invalid userId — not a UUID | None | 1. POST `/connect-account` with `userId: "not-a-uuid"` | 400 response with Zod validation error | P1 |
| TC-022 | Invalid email format | None | 1. POST `/connect-account` with `email: "not-an-email"` | 400 response with Zod validation error | P1 |
| TC-023 | Invalid utilityType | None | 1. POST `/connect-account` with `utilityType: "water"` | 400 response with Zod validation error (expected "gas" or "electric") | P1 |

**Note**: Missing required fields (`userId`, `email`, `provider`) are covered by Zod schema validation and will return 500 (JSON parse or validation error). The endpoint currently returns 500 for non-InputError exceptions.

---

### Upsert Credentials — Regression (PR #266)

**Modified endpoint**: `POST /upsert-credentials`
**Change**: Added optional `password` and `retainEmail` to request schema. Passes through to `upsertCredentials()`.

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|-----------------|----------|
| TC-030 | Existing flow — no new params | Test user | 1. POST `/upsert-credentials` with original schema (userId, email, provider, utilityType, characterOverride) — no `password` or `retainEmail` | 200 response. Credentials created with generated password and `@publicgrid.me` email. Behavior identical to pre-PR | P0 |
| TC-031 | With password param | Test user | 1. POST `/upsert-credentials` with `password: "MyCustomPass123"` | 200 response. Credentials use provided password instead of generated one | P1 |
| TC-032 | With retainEmail param | Test user | 1. POST `/upsert-credentials` with `retainEmail: true` | 200 response. `pgEmail` = user's original email | P1 |

---

### UI/E2E Regression

| ID | Title | Preconditions | Steps | Expected Result | Priority |
|----|-------|---------------|-------|-----------------|----------|
| TC-040 | Connect account UI flow still works | Dev environment with PR #266 deployed | 1. Run existing connect-account e2e tests: `npx playwright test tests/e2e_tests/connect-account/ --project=Chromium` | All existing tests pass | P0 |
| TC-041 | Payment flow regression | Dev environment with PR #271 deployed | 1. Run existing payment e2e tests: `npx playwright test tests/e2e_tests/payment/ --project=Chromium` 2. Verify flex "Pay in full" selection still works | All existing tests pass. `Select_Pay_In_Full_If_Flex_Enabled()` works correctly | P1 |

---

## Sample cURL Commands

> Replace `<API_KEY>` with the valid API key, `<USER_ID>` with a test user UUID, and `<ADMIN_URL>` with the Admin Router base URL.
> The flex bill endpoint URL may differ — confirm with the team.

### PR #271 — Flex Due Date

```bash
# TC-003: Test mode mock bill (easiest to verify — no user setup needed)
curl -s "<FLEX_BILL_ENDPOINT>?test=true" | jq '.due_date, .amount_due_in_cents'
# Expected: due_date ≈ today+20 (YYYY-MM-DD), amount_due_in_cents = 22500

# TC-001: Flex user with NULL due dates on bills
curl -s "<FLEX_BILL_ENDPOINT>?userId=<USER_ID>" | jq '.due_date'
# Expected: due_date ≈ today+20

# TC-002: Flex user with no bills / zero balance
curl -s "<FLEX_BILL_ENDPOINT>?userId=<USER_ID_NO_BILLS>" | jq '.due_date, .amount_due_in_cents'
# Expected: due_date ≈ today+20, amount_due_in_cents = 0

# TC-004: Flex user with real due dates (regression)
curl -s "<FLEX_BILL_ENDPOINT>?userId=<USER_ID_WITH_BILLS>" | jq '.due_date'
# Expected: due_date = earliest real bill due date (NOT today+20)
```

### PR #266 — Connect Account (New Endpoint)

```bash
# TC-010: Electric account — all fields
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "characterOverride": null,
    "password": "TestPass123!",
    "retainEmail": false,
    "accountNumber": "1234567890"
  }'
# Expected: 200 — {"success":true,"message":"Successfully connected electric account for user <USER_ID>"}

# TC-011: Gas account — all fields
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "NGMA",
    "utilityType": "gas",
    "password": "TestPass123!",
    "retainEmail": false,
    "accountNumber": "9876543210"
  }'
# Expected: 200 — {"success":true,"message":"Successfully connected gas account for user <USER_ID>"}

# TC-012: retainEmail=true — keeps user's original email as pgEmail
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "retainEmail": true
  }'
# Expected: 200. Then verify: SELECT "pgEmail" FROM "CottageUsers" WHERE id = '<USER_ID>';
# pgEmail should be "testuser@example.com" (not @publicgrid.me)

# TC-014: Without accountNumber — credentials only, no account table update
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "password": "TestPass123!"
  }'
# Expected: 200. Account table accountNumber and status should be unchanged.

# TC-016: characterOverride — password generated with override chars (no password field)
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "characterOverride": "abc",
    "accountNumber": "1234567890"
  }'
# Expected: 200. Generated password uses "abc" character set.
```

### PR #266 — Connect Account (Validation / Negative)

```bash
# TC-020: Invalid auth token
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: wrong-token" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "email": "test@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric"
  }'
# Expected: 400 — {"success":false,"message":"Invalid access token"}

# TC-021: Invalid userId (not a UUID)
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "not-a-uuid",
    "email": "test@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric"
  }'
# Expected: 500 — Zod validation error (userId must be UUID)

# TC-022: Invalid email
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "email": "not-an-email",
    "provider": "EVERSOURCE",
    "utilityType": "electric"
  }'
# Expected: 500 — Zod validation error (email must be valid)

# TC-023: Invalid utilityType
curl -s -X POST "<ADMIN_URL>/connect-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "email": "test@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "water"
  }'
# Expected: 500 — Zod validation error (utilityType must be "gas" or "electric")
```

### PR #266 — Upsert Credentials (Regression)

```bash
# TC-030: Existing flow — original schema, no new params
curl -s -X POST "<ADMIN_URL>/upsert-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "characterOverride": null
  }'
# Expected: 200. Credentials created with generated password and @publicgrid.me email.

# TC-031: With password param
curl -s -X POST "<ADMIN_URL>/upsert-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "characterOverride": null,
    "password": "MyCustomPass123"
  }'
# Expected: 200. Credentials use "MyCustomPass123" instead of generated password.

# TC-032: With retainEmail param
curl -s -X POST "<ADMIN_URL>/upsert-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: <API_KEY>" \
  -d '{
    "userId": "<USER_ID>",
    "email": "testuser@example.com",
    "provider": "EVERSOURCE",
    "utilityType": "electric",
    "characterOverride": null,
    "retainEmail": true
  }'
# Expected: 200. pgEmail = "testuser@example.com" (not @publicgrid.me).
```

### DB Verification Queries (run after cURL calls)

```sql
-- After TC-010/TC-011: Check account activation
SELECT "accountNumber", status FROM "ElectricAccount" WHERE "cottageUserID" = '<USER_ID>';
SELECT "accountNumber", status FROM "GasAccount" WHERE "cottageUserID" = '<USER_ID>';

-- After TC-012/TC-013/TC-032: Check pgEmail
SELECT "pgEmail", email FROM "CottageUsers" WHERE id = '<USER_ID>';

-- After any connect/upsert: Check credentials exist
SELECT * FROM "UtilityCredential" WHERE "cottageUserID" = '<USER_ID>' ORDER BY created_at DESC LIMIT 5;
```

---

## Password Priority Logic (PR #266 — Reference)

The `upsertCredentials` method now uses this priority for password generation:

```
1. existingPassword (if provided) → use as-is
2. characterOverride (if provided) → generatePasswordOverride(characterOverride, 10)
3. Default → generateAlphanumericStringWithSymbols(10)
```

The `retainEmail` flag:
- `true` → use user's original email as `pgEmail`
- `false`/omitted → generate `@publicgrid.me` email (existing behavior with de-duplication)

---

## Execution Plan

### Phase 1: API Verification (before merge)
1. Call flex bill endpoint with `?test=true` → verify TC-003
2. Call `/connect-account` with electric + gas happy paths → verify TC-010, TC-011
3. Call `/connect-account` with invalid auth → verify TC-020
4. Call `/upsert-credentials` without new params → verify TC-030

### Phase 2: DB Verification
5. Query Supabase for credentials, account status, pgEmail after API calls
6. Verify `retainEmail` behavior (TC-012, TC-013)

### Phase 3: E2E Regression (after merge to dev)
7. Run connect-account tests: `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/connect-account/ --project=Chromium`
8. Run payment tests: `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/payment/ --project=Chromium`

### Phase 4: Flex UI Spot-Check
9. Log in as a flex user, verify due date display (TC-005)
