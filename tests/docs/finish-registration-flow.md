# Finish Registration Flow

Complete reference for the partner-initiated finish-registration flow (RealPage / Zapier integration).

## Overview

The finish-registration flow is a **two-phase, token-based** onboarding path for residents whose registration is initiated by a property management partner (e.g., RealPage via Zapier or Direct API). The partner submits resident data → Public Grid creates an account → resident receives an email with a secure link → resident completes identity verification or utility proof upload.

```
Partner (RealPage/Zapier)          Public Grid (Backend)                  Resident
        |                                  |                                  |
        |--- POST /register ------------->|                                  |
        |                                  |-- Create user, EA, Property     |
        |                                  |-- Generate JWT + URL            |
        |                                  |-- Send welcome email ---------->|
        |<-- 201 { finishRegURL } --------|                                  |
        |                                  |-- Daily reminders ------------->|
        |                                  |                                  |
        |                                  |                     Click link  |
        |                                  |<--- GET /finish-registration ---|
        |                                  |                                  |
        |                                  |     (move-in): DOB + SSN + addr |
        |                                  |     (verification): email + ID  |
        |                                  |                                  |
        |                                  |<--- Submit form ----------------|
        |                                  |-- Registration complete         |
```

## API Endpoint

### Dev
```
POST https://api-dev.publicgrd.com/v1/{partner}/register
Authorization: Bearer <FINISH_REG_TOKEN>   # stored in .env as FINISH_REG_TOKEN
Content-Type: application/json
```

### Production
```
POST https://api.onepublicgrid.com/v1/partners/realpage/register
```

### Partner Slug
The `{partner}` path parameter is matched against `ViewMoveInPartnerReferral.referralCode`. If no match, `partnerID = null` (non-blocking — registration still proceeds).

Known partner slugs: `realpage`, `test-partner` (dev testing), `greystar`, `elevated`, `renew`, `funnel`, `venn`, `moved`.

## Request Payload

### Full Payload (all fields)
```json
{
  "leaseID": "lease-id-123",
  "building": {
    "internalID": "building_789",
    "name": "Community Name",
    "managementCompanyID": "",
    "managementCompanyName": ""
  },
  "resident": {
    "internalID": "rp_user_12345",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@email.com",
    "phone": "5551234567",
    "dateOfBirth": "1990-05-15"
  },
  "property": {
    "street": "123 Main St",
    "unitNumber": "4B",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "siteId": "uuid-or-text"
  },
  "enrollment": {
    "moveInDate": "2026-04-01",
    "type": "move-in"
  }
}
```

### Field Requirements

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `leaseID` | string | No* | If absent, both `resident.internalID` AND `property.siteId` required |
| `building.internalID` | string | No | Partner's building identifier |
| `building.name` | string | No | Community name |
| `building.managementCompanyID` | string | No | |
| `building.managementCompanyName` | string | No | |
| `resident.internalID` | string | No* | Fallback identifier (part 1) |
| `resident.firstName` | string | **Yes** | |
| `resident.lastName` | string | **Yes** | |
| `resident.email` | string | **Yes** | Validated as email, trimmed, lowercased |
| `resident.phone` | string | No | 10-digit format |
| `resident.dateOfBirth` | date | No | ISO format: `YYYY-MM-DD` |
| `property.siteId` | string | No* | Fallback identifier (part 2) |
| `property.street` | string | No | |
| `property.unitNumber` | string | No | |
| `property.city` | string | No | |
| `property.state` | string | No | 2-letter code |
| `property.zip` | string | No | 5-digit |
| `enrollment.type` | string | **Yes** | `"move-in"` or `"verification"`. Defaults to `"move-in"` if omitted |
| `enrollment.moveInDate` | date | No | ISO format. Cannot be more than 3 days in the past |

**Minimal viable payload**: `firstName`, `lastName`, `email`, `enrollment.type` + `leaseID` (or both fallback fields).

The `enrollment` object itself IS required (400 if omitted), but `type` within it defaults to `"move-in"`.

## Lease ID Resolution

```
externalLeaseID = leaseID ?? (resident.internalID && property.siteId
  ? `${resident.internalID}|${property.siteId}`
  : null)
```

| Scenario | Result |
|----------|--------|
| `leaseID: "ABC"` | `externalLeaseID = "ABC"` |
| No `leaseID`, `internalID: "X"`, `siteId: "Y"` | `externalLeaseID = "X\|Y"` |
| `leaseID: "ABC"` + both fallback fields present | `externalLeaseID = "ABC"` (root wins) |
| No `leaseID`, missing either fallback field | 400 validation error |
| `leaseID: ""` (empty string) | **BUG** — returns 201 but creates nothing (ENG-2477) |

The resolved `externalLeaseID` is:
- Stored in `Property.externalLeaseID` in the database
- Used for duplicate detection (`doesExternalLeaseIDExist()`)
- Appended to the finish-registration URL as `leaseID={value}`

## Response

### Success (201)
```json
{
  "success": true,
  "userId": "uuid",
  "status": "REGISTRATION_INCOMPLETE",
  "message": "Resident registered successfully. Finish registration via the provided URL.",
  "finishRegistrationURL": "https://dev.onepublicgrid.com/finish-registration?token=...&email=...&leaseID=..."
}
```

- `enrollment.type = "move-in"` → `status: "REGISTRATION_INCOMPLETE"`
- `enrollment.type = "verification"` → `status: "VERIFICATION_INCOMPLETE"`

### Error Responses

| HTTP | Error | Cause |
|------|-------|-------|
| 400 | `"body/ Either provide leaseID or provide both resident.internalID and property.siteId"` | Missing lease identifier |
| 400 | `"body/enrollment moveInDate cannot be more than 3 days in the past"` | Date too old |
| 400 | `"body/resident/email Invalid email address"` | Invalid email |
| 400 | `"body/enrollment/type Invalid option: expected one of \"move-in\"\|\"verification\""` | Bad enrollment type |
| 400 | `"body/resident/firstName Invalid input: expected string, received undefined"` | Missing required field |
| 400 | `"body/leaseID Invalid input: expected string, received null"` | Sent `null` instead of omitting |
| 409 | `"User with email X already exists"` | Duplicate email |
| 409 | `"Resident with external lease ID X already exists"` | Duplicate lease identifier |
| — | `"missing authorization header"` | No Bearer token |

**Note**: Error response format is inconsistent — schema validation returns Fastify format `{ statusCode, code, error, message }`, service errors return `{ error }` only, and duplicate email returns 409.

## Finish-Registration URL

### Structure
```
https://dev.onepublicgrid.com/finish-registration
  ?token=<JWT>
  &email=<resident-email>
  &leaseID=<resolved-externalLeaseID>
  &streetAddress=<street>        # only if ALL 4 address fields present
  &city=<city>                   # all-or-nothing for address
  &state=<state>
  &zip=<zip>
  &unitNumber=<unit>             # independent of address group
  &dateOfBirth=<YYYY-MM-DD>      # if provided in request
```

### JWT Token Claims
```json
{
  "email": "resident@email.com",
  "leaseId": "<property.siteId || userId>",
  "userID": "<userId>",
  "iat": 1774357467,
  "exp": 1774962267
}
```

**Important**: The JWT `leaseId` claim uses `property.siteId || userId`, NOT the resolved `externalLeaseID`. The URL query param `leaseID` has the correct resolved value. These are different.

### Address Param Logic
Address fields (`streetAddress`, `city`, `state`, `zip`) are included **only if ALL four are present** in the request. If any is missing, none are included. `unitNumber` is independent.

### URL Encoding
Special characters in `leaseID` are URL-encoded: `|` → `%7C`, `/` → `%2F`, `&` → `%26`, `#` → `%23`.

## Frontend Behavior

### XState Form Wizard
**File** (cottage-nextjs): `app/finish-registration/forms/form-wizard.tsx`

The page is an XState-driven multi-step form. Step 1 is always "Enter your address".

### Enrollment Type → Page Behavior

| `enrollment.type` | Step 2+ | User Action |
|-------------------|---------|-------------|
| `move-in` | "Complete your registration" — DOB, SSN (or ID upload), prior address | "Verify & Complete" |
| `verification` | "Let's verify your utility account setup" — email, proof of utility account upload | "Continue" |

### Address Prefill
The page geocodes address params from the URL. Example: `streetAddress=123+Main+St&city=New+York&state=NY&zip=10001` renders as "1-23 Main St, Queens, NY 10001" (normalized by geocoder).

### Auto-Redirect Blocker
The finish-registration page triggers `mi-session/start` API which can auto-redirect within seconds. For testing, intercept fetch immediately after navigation:
```javascript
window.__origFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]?.includes?.('mi-session/start') ||
      (typeof args[0] === 'string' && args[0].includes('mi-session/start')))
    return new Promise(() => {});
  return window.__origFetch.apply(this, args);
};
```

## Email Chain (Inngest)

### Functions (all in `pg-payments` app — reachable via `INNGEST_EVENT_KEY`)

| Function | Event | Purpose |
|----------|-------|---------|
| `start-finish-reg-chain` | `registration/start-finish-reg-chain` | Triggered after registration. Starts the email reminder loop |
| `send-finish-reg-reminder` | `registration/send-finish-reg-reminder` | Sends daily reminder email until registration is complete or move-in date passes |

### Email Subjects
- **Welcome**: "Complete your registration with Public Grid" (sent immediately on registration)
- **Reminder**: "Reminder: Complete your registration with Public Grid" (daily until complete)

### Trigger Reminder Manually (dev)
```bash
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "registration/send-finish-reg-reminder",
    "data": {
      "email": "user@example.com",
      "finishRegistrationURL": "https://dev.onepublicgrid.com/finish-registration?token=...",
      "firstName": "John"
    }
  }'
```

**Note**: `send-finish-reg-reminder` has ~29% failure rate in production as of 2026-03-24.

## Backend Processing

### What the register endpoint creates
1. **Auth user** (Supabase `auth.users`) — email + generated password
2. **Stripe customer** — for future payment setup
3. **CottageUsers record** — resident profile (name, phone, DOB)
4. **ElectricAccount** — via `create_electric_account_and_property` RPC
5. **Property** — with `externalLeaseID`, address, building link
6. **MoveInReferral** — if partner was matched
7. **Inngest event** — `registration/start-finish-reg-chain` for email chain

### Database Verification Query
```sql
SELECT p."externalLeaseID", p."electricAccountID", ea."cottageUserID", ea."status",
       cu."email", cu."firstName", cu."lastName"
FROM "Property" p
JOIN "ElectricAccount" ea ON p."electricAccountID" = ea."id"
JOIN "CottageUsers" cu ON ea."cottageUserID" = cu."id"
WHERE cu."email" = '<email>';
```

### Status Values
- `REGISTRATION_INCOMPLETE` — move-in enrollment, identity verification pending
- `VERIFICATION_INCOMPLETE` — verification enrollment, utility proof pending

## Integration Paths

| Path | Flow | When |
|------|------|------|
| **Zapier** (pilot) | RealPage form submit → Zapier webhook → Public Grid API | Current/initial |
| **Direct API** (future) | RealPage backend → HTTPS POST → Public Grid API | Migration target |

Same payload structure — no changes needed on Public Grid side when migrating from Zapier to Direct API.

## Test Data

### Building Shortcodes (for `building.internalID`)
- `guid-autotest` — standard test building

### Email Pattern
`pgtest+{purpose}@joinpublicgrid.com` — all test emails route to Fastmail

### Phone
`1111111111` — safe test phone number

## Known Issues

| Issue | Status | Details |
|-------|--------|---------|
| ENG-2477 | Open | Empty/whitespace `leaseID` returns 201 success but creates no records |
| Reminder failure rate | Observation | `send-finish-reg-reminder` has ~29% failure rate in production |
| Error format inconsistency | Observation | Schema errors vs service errors vs 409 — no consistent contract |
| `leaseID: null` rejected | By design | Zod expects string or undefined, not null. Partners must omit field, not send null |

## Related Tickets
- **ENG-2407** — Register endpoint change for RealPage (leaseID at root, fallback logic)
- **ENG-2430** — GUID & LeaseID parity (frontend handling of leaseID param)
- **ENG-2439** — Scroll behavior fix (includes finish-registration scroll tests)
- **ENG-2429** — Transfer incomplete email reminder (similar finish-reg URL pattern)
- **ENG-2477** — Empty leaseID bug (found during ENG-2407 testing)
