# Test Plan: ENG-2474 — Include Unit Number in Onboarding Email Address

## Overview
**Ticket**: ENG-2474
**PR**: [services #312](https://github.com/Cottage-Energy/services/pull/312) (merged 2026-03-24)
**Date**: 2026-03-25
**Tester**: Christian

## Context
The "Preparing for Move" onboarding touchpoint email was constructed with `street, city, state zip, USA` — omitting the unit number for residents in multi-unit buildings. PR #312 adds `Property.unitNumber` to the formatted address via a new `formatUnitNumber()` utility, and also reads `Address.country` instead of hardcoding "USA".

### Changes
| File | Change |
|------|--------|
| `touchpoints.ts` | Destructures `unitNumber` from `property`, conditionally includes it in `formattedAddress` |
| `preparing-for-move.tsx` | Template refactored to use resolved vars + mock data for dev preview (mock includes `"Apt 4B"`) |
| `string.ts` | New `formatUnitNumber(unit)` — prefixes plain values with `"Apt "`, passes through already-prefixed values |

### `formatUnitNumber` Logic
```
Input starts with APT/UNIT/APARTMENT/SUITE/# (case-insensitive) → return as-is
Otherwise → return "Apt {unit}"
```

### Address Format
- **With unitNumber**: `{street} {formatUnitNumber(unit)}, {city}, {state} {zip}, {country ?? "USA"}`
- **Without unitNumber (null/undefined)**: `{street}, {city}, {state} {zip}, {country ?? "USA"}`

### Inngest Trigger
- **Function ID**: `preparing-for-move`
- **Dev**: Event-triggered via `preparing-for-move` event
- **Production**: Cron `TZ=America/New_York 0 9 * * *` (daily 9 AM EST)

## Scope

### In Scope
- Service address formatting in "Preparing for Move" email with/without unit number
- `formatUnitNumber()` behavior for various input formats
- Country field usage and fallback
- Email template rendering (content, layout)
- Dev mock data correctness

### Out of Scope
- Other onboarding emails (start service, non-billing welcome, etc.)
- Email delivery infrastructure (Resend/SES)
- Touchpoint eligibility logic (which users qualify for the email)
- Production cron trigger behavior

### Prerequisites
- PR #312 merged and deployed to dev ✅
- `INNGEST_EVENT_KEY` for services (pg-payments app) in `.env`
- Fastmail access for reading test emails
- Test users with properties that have/lack unitNumber

### Test Data (Dev)
| Property ID | unitNumber | Street | Building | Notes |
|-------------|-----------|--------|----------|-------|
| 16129 | `85475s` | 808 Chicago Ave, Dixon, IL | autotest | Plain number → "Apt 85475s" |
| 16074 | `APT 523` | 2900 Canton St, Dallas, TX | pgtest | Already prefixed → "APT 523" |
| 16611 | `321V` | 808 Chicago Ave, Dixon, IL | autotest | Plain alphanumeric → "Apt 321V" |
| 585 | *(empty)* | 4200 W Flagler St, Coral Gables, FL | — | No unit → address without unit |
| 10467 | *(empty)* | 456 E 138th St, Bronx, NY | — | No unit → address without unit |

## Test Cases

### Happy Path — Address Formatting
| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Unit number included in email for multi-unit property | User with property that has unitNumber (e.g., "4B") completes move-in | 1. Complete move-in at multi-unit building 2. Trigger `preparing-for-move` Inngest event 3. Read email via Fastmail | Service Address shows: `{street} Apt 4B, {city}, {state} {zip}, {country}` | P0 | Yes |
| TC-002 | No unit number for single-unit property | User with property that has null unitNumber | 1. Complete move-in at single-unit building (no apt) 2. Trigger `preparing-for-move` Inngest event 3. Read email via Fastmail | Service Address shows: `{street}, {city}, {state} {zip}, {country}` — no unit | P0 | Yes |
| TC-003 | Already-prefixed unit number passes through | Property with unitNumber = "APT 523" | 1. Trigger touchpoint for user at property 16074 2. Read email | Address shows `2900 Canton St APT 523, Dallas, TX 75226, US` — NOT "Apt APT 523" | P0 | Yes |
| TC-004 | Plain number gets "Apt" prefix | Property with unitNumber = "321V" | 1. Trigger touchpoint for user at property 16611 2. Read email | Address shows `808 Chicago Ave Apt 321V, Dixon, IL 61021, US` | P1 | Yes |
| TC-005 | Country field used from Address table | Property with Address.country = "US" | 1. Trigger touchpoint 2. Read email | Address ends with `, US` (from DB) not hardcoded `, USA` | P1 | Yes |

### Edge Cases — `formatUnitNumber` Input Variations
| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Unit prefixed with "UNIT" | Property.unitNumber = "UNIT 12" | 1. Set unitNumber to "UNIT 12" on test property 2. Trigger touchpoint 3. Read email | Address shows `{street} UNIT 12, ...` (unchanged) | P1 | Yes |
| TC-011 | Unit prefixed with "Suite" | Property.unitNumber = "Suite 3A" | 1. Set unitNumber to "Suite 3A" 2. Trigger touchpoint 3. Read email | Address shows `{street} Suite 3A, ...` (unchanged) | P2 | No |
| TC-012 | Unit prefixed with "#" | Property.unitNumber = "#5" | 1. Set unitNumber to "#5" 2. Trigger touchpoint 3. Read email | Address shows `{street} #5, ...` (unchanged) | P2 | No |
| TC-013 | Unit prefixed with "APARTMENT" | Property.unitNumber = "APARTMENT 7C" | 1. Set unitNumber to "APARTMENT 7C" 2. Trigger touchpoint 3. Read email | Address shows `{street} APARTMENT 7C, ...` (unchanged) | P2 | No |
| TC-014 | Plain numeric unit | Property.unitNumber = "42" | 1. Set unitNumber 2. Trigger touchpoint 3. Read email | Address shows `{street} Apt 42, ...` | P1 | Yes |
| TC-015 | Unit with leading/trailing spaces | Property.unitNumber = " 4B " | 1. Set unitNumber with spaces 2. Trigger touchpoint 3. Read email | Address shows `{street} Apt 4B, ...` (trimmed) — note: `formatUnitNumber` trims before regex check | P2 | No |

### Negative Tests — Null/Empty Handling
| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Null unitNumber excluded from address | Property.unitNumber = NULL | 1. Trigger touchpoint for property with null unit 2. Read email | Address: `{street}, {city}, {state} {zip}, {country}` — no "Apt null" or "Apt undefined" | P0 | Yes |
| TC-021 | Empty string unitNumber excluded | Property.unitNumber = "" | 1. Set unitNumber to "" 2. Trigger touchpoint 3. Read email | Address: `{street}, {city}, {state} {zip}, {country}` — treated same as null | P1 | Yes |
| TC-022 | Country field null falls back to "USA" | Address.country = NULL (if possible) | 1. Verify Address record has country 2. If null, trigger touchpoint | Address ends with `, USA` (fallback) | P1 | No |

### Negative Tests — Touchpoint Eligibility Window
Validates that emails are ONLY sent when `dayjs().diff(startDate, 'day') === -1` (startDate ~24-48 hours away). Past dates and dates too far in the future must NOT trigger emails.

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-025 | startDate 2 days ago — no email sent | Set startDate to 2 days in the past | 1. Set startDate 2 days ago 2. Trigger `preparing-for-move` event 3. Check email | No email received — diff = +2, not -1 | P1 | No |
| TC-026 | startDate yesterday — no email sent | Set startDate to yesterday | 1. Set startDate to yesterday 2. Trigger event 3. Check email | No email received — diff = +1, not -1 | P1 | No |
| TC-027 | startDate today — no email sent | Set startDate to today | 1. Set startDate to today midnight 2. Trigger event 3. Check email | No email received — diff = 0, not -1 | P1 | No |
| TC-028 | startDate tomorrow — no email sent | Set startDate to tomorrow | 1. Set startDate to tomorrow midnight 2. Trigger event 3. Check email | No email received — diff = 0 (partial day truncated), not -1 | P1 | No |
| TC-029 | startDate +2 days — email IS sent | Set startDate to 2 days from now | 1. Set startDate to +2 days 2. Trigger event 3. Check email | Email received — diff = -1 (the only qualifying value) | P0 | Yes |
| TC-030-a | startDate +3 days — no email sent | Set startDate to 3 days from now | 1. Set startDate to +3 days 2. Trigger event 3. Check email | No email received — diff = -2, not -1 | P1 | No |

### Database Verification
| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-030 | Property stores unitNumber from move-in | After move-in at multi-unit building, query `SELECT "unitNumber" FROM "Property" WHERE id = {new_property_id}` | unitNumber matches what was entered during move-in | P0 |
| TC-031 | Address.country populated | `SELECT "country" FROM "Address" WHERE id = {addressID}` | Country field is non-null for properties in test buildings | P1 |
| TC-032 | Properties without units have null unitNumber | Query properties at single-unit addresses | unitNumber is NULL or empty string | P1 |

### Email Template Rendering
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | "Preparing for Move" email displays all fields | 1. Trigger touchpoint for billing user 2. Read email | Email shows: name, account type, start date, service address (with unit), billing section | P0 | Yes |
| TC-041 | Non-billing user sees correct content | 1. Trigger for non-billing user (maintainedFor IS NULL) 2. Read email | Email shows address with unit but NO "Quick Reminder — What is Public Grid?" section | P1 | Yes |
| TC-042 | Billing user sees PG explainer section | 1. Trigger for billing user (maintainedFor IS NOT NULL) 2. Read email | Email includes "Quick Reminder" section with account type | P1 | Yes |

## Automation Plan
- **Smoke**: TC-001, TC-002 (core with/without unit number)
- **Regression**: TC-003, TC-004, TC-005, TC-010, TC-014, TC-020, TC-021, TC-030, TC-040, TC-041, TC-042
- **Exploratory only**: TC-011, TC-012, TC-013, TC-015, TC-022 (edge cases requiring manual DB manipulation of unitNumber format)

## Test Approach

### Triggering the Email
1. **E2E flow**: Complete a move-in at `autotest` (multi-unit) → wait for touchpoint to fire OR trigger manually
2. **Direct Inngest trigger**: `curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" -H "Content-Type: application/json" -d '{"name": "preparing-for-move", "data": {}}'`
   - Note: This runs for ALL qualifying accounts, not a specific user — the function queries accounts internally
3. **Email verification**: Use Fastmail JMAP API to read incoming email, search for "Preparing" or "Move-In Details" subject/body

### Verifying the Address
- Parse the email body (HTML) for the `<li>Service Address: ...</li>` element
- Assert the address string matches expected format based on the user's property data
- For DB manipulation tests: update `Property.unitNumber` → trigger → verify → restore original value

## Risks & Notes
- **Inngest event triggers ALL qualifying accounts**: The `preparing-for-move` function runs a batch query, not per-user. Triggering in dev will send emails to all qualifying dev accounts. May need to narrow test data or accept batch behavior.
- **Email delivery delay**: Inngest function execution + email delivery may take seconds to minutes. Build in polling/wait when reading via Fastmail.
- **Country field**: All dev Address records show `country = "US"`, not "USA". The fallback `?? "USA"` only applies when country is null. Verify no visual regression (was "USA" before, now shows "US").
- **Empty string vs null**: The code checks `property?.unitNumber` which is truthy check — empty string `""` is falsy so treated same as null. Confirmed safe.
- **`formatUnitNumber` trim**: The regex uses `unit.trim()` before testing, but the returned value is untrimmed if it matches a prefix. Edge case: `" APT 4B"` → trimmed for check → matches → returns `" APT 4B"` (with leading space). Low risk since DB values are typically clean.
