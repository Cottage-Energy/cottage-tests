# Partner Direct-to-Consumer (D2C) API Testing

Reference for testing partner-hosted embed integrations where a partner's dashboard calls Public Grid's API to generate a pre-filled iframe URL pointing at the PG move-in flow.

First implementation: **Moved D2C** (ENG-2687). Future partners (Renew, Venn, etc.) are expected to follow the same pattern — use this doc as the template.

> **Same integration class as finish-registration.** D2C is partner-initiated: partner calls a PG API → PG returns a pre-filled URL → user loads that URL and completes a prefilled flow → PG writes partner attribution. Same shape as `POST /v1/{partner}/register` → `finishRegistrationURL` (see [finish-registration-flow.md](finish-registration-flow.md)). Expect the same test-layering pattern: API spec + cross-cutting E2E integration spec + flow doc.
>
> **The flow body is NOT new.** Moved D2C hands off to the existing **encouraged-conversion move-in** flow (5-step `useEncouragedConversion=true` variant — also triggered today by `moved5439797test`, `venn73458test`, `funnel4324534`, etc. — see [onboarding-flows.md](onboarding-flows.md#building-shortcodes)). Same `/move-in` URL, same POMs, same DB tables, same completion behavior. Regression coverage for the flow body stays with the existing encouraged-conversion tests.
>
> **What's genuinely new and needs QA attention:**
> - The API wrapper (`POST /v1/moved/embed`) — so partners don't hardcode shortcodes
> - The expanded prefill surface — D2C passes more URL params (`firstName`, `lastName`, `email`, `phone`, `dateOfBirth`, `moveInDate`, `leaseID`) than static partner shortcodes do
> - The iframe embed contract — partner hosts the URL in an iframe, receives a postMessage on completion (spec pending)
> - The `shortCode=moved` → `MoveInPartner.Moved` attribution mapping (currently mis-wired — ENG-2694)

## Architecture

```
Partner dashboard (Moved PD)
      ↓ 1. GET /v1/utilities/availability/{zip}
      ↓    Response: { utilityProviders: [{ pgEnabled, isPrimaryUtility, ... }] }
      ↓ 2. Decide whether to offer PG setup
      ↓ 3. POST /v1/moved/embed { resident, property }
      ↓    Response: { embedURL: "https://dev.onepublicgrd.com/move-in?shortCode=moved&..." }
      ↓ 4. Load embedURL in iframe
      ↓
Public Grid move-in flow (iframe)
      ↓ User completes encouraged-conversion move-in (5-step variant)
      ↓ On completion: postMessage to parent (SPEC PENDING — not yet documented by backend)
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/utilities/availability/{zip}` | Partner checks which utilities serve a zip and whether PG handles them (`pgEnabled`) |
| POST | `/v1/moved/embed` | Partner POSTs resident + property → PG returns `{ embedURL }` for iframe |

**Base URLs** (per environment):
- Dev: `https://api-dev.publicgrd.com`
- Staging: `https://api-staging.publicgrd.com` (DNS does not resolve as of 2026-04-14 — ENG-2693)
- Production: **Value in CLAUDE.md (`api.onepublicgrid.com`) does not resolve**; real host is `api.publicgrd.com` — ENG-2693 tracks the standardization

**Path note**: `/v1/...` not `/api/v1/...` — the `/api` prefix returns 404 (documented as D1 in ENG-2687 test plan).

## URL Parameter Mapping

The embed URL uses `shortCode=moved` + URL-encoded params from the POST body. Several params are renamed between request body and URL:

| Request body field | Embed URL param | Notes |
|---|---|---|
| `resident.internalID` | `leaseID` | **Renamed.** Stored on `Property.externalLeaseID` at registration. Partner's unique user ID. |
| `resident.firstName` | `firstName` | Prefilled into About You step |
| `resident.lastName` | `lastName` | Prefilled |
| `resident.email` | `email` | Prefilled |
| `resident.phone` | `phone` | Prefilled (any format accepted — spec says "digits only" but is not enforced) |
| `resident.dateOfBirth` | `dateOfBirth` | YYYY-MM-DD; prefill behavior on identity step not yet verified |
| `resident.moveInDate` | `moveInDate` | YYYY-MM-DD; **currently NOT prefilled** into the move-in date picker — ENG-2695 |
| `property.street` | `streetAddress` | **Renamed.** Docs incorrectly list it as `street`. |
| `property.unitNumber` | `unitNumber` | Documented as `unit`; actual is `unitNumber`. |
| `property.city` | `city` | City is **normalized by geocoding** (e.g., "New York" → "Manhattan"). Don't assert equality. |
| `property.state` | `state` | 2-char max, case-insensitive |
| `property.zip` | `zip` | 5-digit US zip; zip is **normalized by geocoding** (e.g., `10001` → `10279`, `75063` → `75226`). |

## Validation Rules

| Rule | Status | Notes |
|------|--------|-------|
| `resident` object required (even if `{}`) | Enforced | Docs imply per-field optional — they aren't; the object is mandatory |
| `property.zip` required, 5 chars | Enforced | |
| `property.state` ≤ 2 chars | Enforced | Sending "New York" → 400 |
| `resident.email` must be valid format | Enforced | |
| `resident.moveInDate` ISO format | Enforced | `01/15/2025` → 400 |
| `resident.moveInDate` not more than 3 days in past | **Leaky** | `-30d` rejected (200 expected), `-4d` has been seen accepted in some sessions — likely timezone drift. Spec says "> 3 days" rejects. |
| `phone` digits-only | **Not enforced** | Formatted phones accepted |
| String `maxLength` | **Not enforced** | 1000-char firstName accepted; partner-side cap recommended |

## Partner Attribution

The embed URL's `shortCode=moved` is meant to signal partner attribution. Today (2026-04-14, ENG-2694 open) this **fails**: users complete the move-in flow with the Moved theme rendered correctly, but `Referrals.referredBy` resolves to the fallback "Simpson" MoveInPartner, not "Moved".

**Until ENG-2694 is fixed:** partner-side analytics cannot rely on `Referrals.referredBy`. Use `Property.externalLeaseID LIKE 'moved-%'` (matching the `leaseID` param passed into the embed URL) to recover D2C-sourced users.

See [onboarding-flows.md](onboarding-flows.md#partner-attribution) for the full attribution resolution model.

## Testing Strategy

Mirror the finish-registration test layering. Three layers, each with distinct ownership:

| Layer | File | Scope | Status |
|-------|------|-------|--------|
| API contract | `tests/api_tests/v1/moved-embed/moved_embed.spec.ts` | Request/response shapes, validation, auth, HTTP methods, schema, security | ✅ 49/49 passing |
| Cross-cutting E2E integration | `tests/e2e_tests/moved-d2c/moved_d2c_move_in.spec.ts` (NOT YET CREATED) | Call API → navigate to `embedURL` → complete flow → verify DB attribution + prefill | ⏸️ **Deferred until ENG-2694 fix lands** (would otherwise bake in broken Simpson attribution) |
| Iframe parent / postMessage | Part of the integration spec above | Host embed URL in an iframe, capture `window.addEventListener('message', ...)` events on completion | ⏸️ Blocked on backend documenting postMessage event name + payload |

### Integration spec outline (for when ENG-2694 is fixed)

Model on [`tests/e2e_tests/finish-registration-flow/finish_reg_move_in.spec.ts`](../e2e_tests/finish-registration-flow/finish_reg_move_in.spec.ts):

```
test.describe('Moved D2C — Move-in E2E', () => {
  // Phase 1: Call API via MovedEmbedApi, capture embedURL + email
  // Phase 2: Navigate to embedURL, verify partner theme + prefill
  //          (firstName, lastName, email, phone, address)
  // Phase 3: Complete flow through non-billing "I will do the setup myself"
  //          (fast path — skips Stripe; About You step confirms prefill)
  // Phase 4: DB verification — query Referrals/MoveInPartner/Property:
  //          - Referrals.referredBy = Moved MoveInPartner id
  //          - Property.externalLeaseID = internalID from API payload
  //          - Property.unitNumber, Address fields, ElectricAccount.status
  // Phase 5: Cleanup via CleanUp.Test_User_Clean_Up(email)
});
```

### Iframe parent harness (when postMessage spec lands)

The direct-navigation approach can't exercise postMessage because the flow likely gates on `window.self !== window.top`. Options:
1. **Hosted parent page**: static HTML page served from the same origin, containing `<iframe src="{embedURL}">` + a `window.addEventListener('message', ...)` listener. Playwright navigates to the parent, walks through iframe via `page.frameLocator`, reads captured events.
2. **`page.addInitScript` injection** into a blank page with programmatically-generated parent HTML. More self-contained, avoids the "where is the server serving from" pitfalls.

### XSS / injection
The embed URL URL-encodes all string params; the move-in frontend escapes them properly via Next.js hydration JSON (`\u003c\u003e`). SQL/XSS payloads accepted by the API are safe in practice but should still be rejected at the API layer (future improvement).

### XSS / injection
The embed URL URL-encodes all string params; the move-in frontend escapes them properly via Next.js hydration JSON (`\u003c\u003e`). SQL/XSS payloads accepted by the API are safe in practice but should still be rejected at the API layer (future improvement).


## Related Tickets

- **ENG-2687** — Moved D2C API (parent ticket)
- **ENG-2693** — [IMPROVEMENT] Host naming inconsistency (prod API host in CLAUDE.md doesn't resolve)
- **ENG-2694** — [CRITICAL] Moved D2C embed mis-attributes users to "Simpson" instead of "Moved"
- **ENG-2695** — [BUG] `moveInDate` URL param not prefilled into About You step

## Related Files

- Types: `tests/resources/types/movedEmbed.types.ts`
- Helper: `tests/resources/fixtures/api/movedEmbedApi.ts`
- API tests: `tests/api_tests/v1/moved-embed/moved_embed.spec.ts`
- Test plan: `tests/test_plans/ENG-2687_moved_direct_to_consumer.md`
