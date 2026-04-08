# Partner API v2 — Testing Reference

## Overview

The Public Grid Partner API v2 is tested via Playwright API tests in `tests/api_tests/v2/`.
All endpoint helpers extend `PublicGridApiV2` base class in `tests/resources/fixtures/api/`.

**Live docs**: `https://0bb57b59.developers-dkm.pages.dev/`
**Ticket**: ENG-2585

## Architecture

```
tests/api_tests/v2/
├── auth/                    # AUTH-001–008 (Bearer auth, partner scoping)
├── buildings/               # BLD-001–024 (list, detail, create)
├── customers/               # CUST-001–015, CUST-LIST-001–005, SRCH-001–008, SSO-001–014
├── error-handling/          # ERR-001–010, CONV-001–008
├── properties/              # PROP-001–012, BILL-001–012
├── registration/            # REG-001–011, SAV-001–005
└── utilities/               # UTIL-001–006, ZIP-001–006

tests/resources/fixtures/api/
├── publicGridApiV2.ts       # Base class (auth, HTTP methods, error parsing)
├── buildingsApiV2.ts        # GET /buildings, GET /buildings/{id}
├── propertiesApiV2.ts       # GET /properties, GET /properties/{uuid}, GET .../bills
├── customersApiV2.ts        # GET /customers, GET /customers/{id}, search, auth, bills, intervals
├── registrationApiV2.ts     # POST /registration/move-in, POST .../savings-enrollment
└── utilitiesApiV2.ts        # GET /utilities, GET /utilities/zip/{zip}

tests/resources/types/apiV2.types.ts    # All request/response types
tests/resources/constants/apiV2.ts      # Base URLs, pagination, error codes, regex
```

## Base URL Configuration

Configured in `tests/resources/utils/environmentBaseUrl.ts` under the `api_v2` key.
The `PublicGridApiV2` base class reads `process.env.ENV` to select the right URL.

## Environment Variables

| Var | Purpose |
|-----|---------|
| `API_V2_KEY` | Primary partner API key (required) |
| `API_V2_KEY_SECONDARY` | Second partner key for isolation tests (optional) |
| `API_V2_TEST_CUSTOMER_EMAIL` | Known customer email for search tests |
| `API_V2_TEST_CUSTOMER_ID` | Known customer UUID for GET tests |
| `API_V2_TEST_PROPERTY_UUID` | Known property UUID with bills |
| `API_V2_TEST_LEASE_ID` | Known external lease ID for search-by-lease |

## Test Data (dev environment)

| Data | Value | DB Details |
|------|-------|------------|
| Customer | `pgtest+funnel+final0002@joinpublicgrid.com` | CottageUsers ID: `3a4c161c-3d3a-4ec8-a7a9-530c9da70e67` |
| Property | UUID `67c3e4a3-3570-4b93-a9e3-ec313dc9038d` | Property ID: 13466, unit 3424 |
| Building | `009be2c6-dd00-428b-8e0d-92eb53e8418e` | "99 Suffolk St", partner: Funnel (`33d83d7c...`) |
| Electric Account | ID 12660 | Status: ELIGIBLE, utilityCompanyID: COMED |
| Lease ID | `qa-apiv2-lease-001` | Set on Property.externalLeaseID |
| Bills | IDs 81397–81400 | Jan–Apr 2025, $85–$115, 390–620 kWh, ingestionState: viewable |

### Partner Scoping

The API key `test-api-key-12345` is scoped to the **Funnel** partner (`moveInPartnerID: 33d83d7c-07cb-470c-8137-acfa2d1a89d5`). It can only see buildings/properties/customers linked to this partner.

Resources outside scope return `404 Not Found` (not `403 Forbidden`) — this is documented and intentional.

### Adding Test Data

**Insert a bill** (safe — uses `viewable` state, no payment pipeline):
```sql
INSERT INTO "ElectricBill" (
  "electricAccountID", "totalAmountDue", "totalUsage",
  "startDate", "endDate", "statementDate", "dueDate",
  "createdAt", "visible", "isIncomplete", "isDepositOnlyBill",
  "ingestionState"
) VALUES (
  12660, 8500, 450.5,
  '2025-01-01T00:00:00Z', '2025-01-31T00:00:00Z',
  '2025-02-01T00:00:00Z', '2025-02-15T00:00:00Z',
  NOW(), true, false, false, 'viewable'
);
```

**Set a lease ID** (for search-by-lease test):
```sql
UPDATE "Property"
SET "externalLeaseID" = 'qa-apiv2-lease-001'
WHERE uuid = '67c3e4a3-3570-4b93-a9e3-ec313dc9038d';
```

## Known Discrepancies (docs vs API)

As of 2026-04-08, the live docs site has several differences from the actual API behavior:

| Area | Docs Say | API Returns |
|------|----------|-------------|
| Bill detail | `amount` (dollars), `date`, `daysInCycle`, `usageAmount`, `usageUnit` | `totalAmountDue` (cents), `startDate`/`endDate`, `totalUsage` |
| Property detail address | Flat: `street`, `city` at root | Nested: `address: { street, city, state, zip }` |
| Zip provider ID | `id` | `utilityCompanyID` |
| Zip response | Has `zip` field | No `zip` field |
| Timestamps | ISO 8601 (`date-time`) | Postgres format (`2025-01-01 00:00:00+00`) |

Tests are written against **actual API behavior**, not docs. Comments in test files note where they differ.

## Running Tests

```bash
# Run all API v2 tests
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/api_tests/v2/ --project=Chromium

# Run specific endpoint group
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/api_tests/v2/buildings/ --project=Chromium

# Run specific test by ID
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/api_tests/v2/ -g "BLD-001" --project=Chromium
```
