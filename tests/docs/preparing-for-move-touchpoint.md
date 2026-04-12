# Preparing for Move — Onboarding Touchpoint Email

Pre-move-in reminder email sent to residents whose start service date is approaching.

## Source
- **Function**: `packages/inngest/functions/onboarding/touchpoints.ts` in `services` repo
- **Function ID**: `preparing-for-move`
- **Email template**: `packages/mail/emails/onboarding/preparing-for-move.tsx`
- **App**: `pg-payments`

## Trigger
| Environment | Trigger | Schedule |
|-------------|---------|----------|
| **Production** | Cron | `TZ=America/New_York 0 9 * * *` (daily 9 AM EST) |
| **Dev/Staging** | Event | `preparing-for-move` via Inngest API |

### How to trigger in dev
```bash
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "preparing-for-move", "data": {}}'
```
- Uses `INNGEST_EVENT_KEY` from `.env` (routes to `pg-payments` app)
- Inngest API always returns 200 — doesn't mean the function handled the event
- Allow ~45 seconds for processing + email delivery

## Eligibility Criteria

The function queries ALL users via `PropertyUserRepository.getPropertyUsers()`, then filters per-account:

### `shouldSendEmail` conditions (both must be true)
1. **Account status** is one of: `PENDING_FIRST_BILL`, `ACTIVE`, `LINK_ONLINE_ACCOUNT`, `CREATE_ONLINE_ACCOUNT`
2. **`dayjs().diff(startDate, 'day') === -1`** — startDate is in the qualifying window

### Date math (important gotcha)

`dayjs().diff(date, 'day')` truncates partial days toward zero. This means:

| startDate relative to now | diff value | Qualifies? |
|---------------------------|-----------|------------|
| 2+ days ago | +2 or more | No |
| Yesterday | +1 | No |
| Today | 0 | No |
| Tomorrow | 0 (partial day truncated) | No |
| **+2 days** | **-1** | **Yes** |
| +3 days | -2 | No |

**The email fires when startDate is ~24-48 hours away, which means +2 calendar days — NOT "tomorrow".**

In production (9 AM EST cron), this effectively sends emails 2 calendar days before the move-in date.

### To set up a test user for eligibility
```sql
-- Set startDate to 2 days from today (the ONLY qualifying value)
UPDATE "ElectricAccount"
SET "startDate" = '<2 days from today> 00:00:00+00'
WHERE "id" = <electric_account_id>;
```

## Email Content

### Address format (updated by ENG-2474, PR services#312)
- **With unit**: `{street} {formatUnitNumber(unit)}, {city}, {state} {zip}, {country}`
- **Without unit**: `{street}, {city}, {state} {zip}, {country}`

### `formatUnitNumber` logic
| Input | Output | Rule |
|-------|--------|------|
| `4B` | `Apt 4B` | Plain value gets "Apt " prefix |
| `APT 523` | `APT 523` | Already prefixed — unchanged |
| `UNIT 12` | `UNIT 12` | Already prefixed — unchanged |
| `Suite 3A` | `Suite 3A` | Already prefixed — unchanged |
| `#5` | `#5` | Already prefixed — unchanged |

Regex: `/^(APT|UNIT|APARTMENT|SUITE|#)/i` — case-insensitive, checks trimmed input.

### Country field
- Reads from `Address.country` (e.g., `"US"`)
- Falls back to `"USA"` if `country` is null
- Dev data uses `"US"` — slightly different from the previous hardcoded `"USA"`

### Conditional sections
| Condition | Section shown |
|-----------|-------------- |
| `maintainedFor IS NOT NULL` (billing) | "Quick Reminder — What is Public Grid?" explainer |
| `maintainedFor IS NULL` (non-billing) | Section hidden |

### Email subject
`Your {accountType} Account is Ready for your Move-in on {formatted startDate}!`

Where `accountType` is `Electric`, `Gas`, or `Electric and Gas` depending on which accounts qualify.

## Data model

```
CottageUser (auth.users)
  └── ElectricAccount (status, startDate, maintainedFor, propertyID)
        └── Property (unitNumber, addressID, buildingID)
              └── Address (street, city, state, zip, country)
```

- `Property.unitNumber` — nullable text, stored directly on Property (not on Address)
- `Address.country` — varchar, NOT NULL
- `ElectricAccount.maintainedFor` — nullable UUID; non-null = billing customer

## Batch behavior

The function processes ALL qualifying accounts in a single run — it is NOT per-user. Triggering the event in dev sends emails to every user who meets the eligibility criteria at that moment. There is no way to target a specific user.

**Implication for testing**: When manipulating startDates, be aware that other test accounts with startDate +2 days will also receive emails. Restore startDates immediately after testing.

## Verification via Fastmail

After triggering, check emails via Fastmail JMAP API:
```javascript
// Filter by recipient and recent timestamp
filter: {
  to: 'pgtest+<user>@joinpublicgrid.com',
  after: new Date(Date.now() - 5*60*1000).toISOString()
}
```

The service address is in the email body inside a `<li>` element:
```
Service Address: <!-- -->100 Broadway Apt 1A, Manhattan, NY 10005, US
```
