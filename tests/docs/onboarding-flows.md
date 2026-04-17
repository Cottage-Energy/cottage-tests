# Onboarding Flows Reference

Complete map of all billing and non-billing onboarding flows — URLs, entry points, shortcodes, and test data requirements.

## Billing Flows
Account's `maintainedFor` is NOT null. Payment method is added or can be added.

### Move-in Flow
- **URL**: `https://dev.publicgrid.energy/move-in`
- **Parameters**: `?shortCode=<building>` to use a specific building
- **XState file**: `app/move-in/forms/form-wizard.tsx`

### Transfer Flow
- **URL**: `https://dev.publicgrid.energy/transfer`
- **Parameters**: `?moveInDate=MM/DD/YYYY` prefills estimated move-in date picker (ENG-2632). `?moveOutDate=MM/DD/YYYY` prefills move-out date.
- **Alternative entry**: For users with ElectricAccount status `ACTIVE` or `ELIGIBLE`, go to Services → "Transfer my service" button
- **XState file**: `app/transfer/forms/form-wizard.tsx`
- **Iframe behavior**: In iframe context, "Go back" (unavailable screen) and "Done" (success screen) send postMessage + delay 8s before navigation. Non-iframe navigates immediately.
- **Canceled postMessage**: `{ status: 'canceled' }` sent when user clicks "Go back" on unavailable screen (ENG-2632)
- **Test users**: `pgtest+0ssn+std` (ineligible — unavailable screen), `pgtest+aniyah_bogankvn0vfr5xo91` (eligible, 808 Chicago Ave)
- **Gotcha**: Properties with `addressID: null` show "Address unavailable" and block the flow — must use users with valid addresses

### Light Flow (TX Deregulated)
- **URL**: `https://dev.publicgrid.energy/move-in`
- **How to trigger**: Use the Light Address `2900 Canton St` with a unit number (e.g., `524`). A modal appears offering two paths:
  - Keep original address → TX dereg flow
  - Address with ESD ID → Light flow
- **XState file**: `app/move-in/light/light-form-wizard.tsx`

### Light Address Modal (ESI ID Detection)
When a TX address (e.g., `2900 Canton St`, Dallas) is entered during move-in, a "Confirm your address" modal appears if a matching ESI ID is found:

| Modal Choice | ESI ID? | Flow | User Type | DB Table |
|---|---|---|---|---|
| **Use verified address** | Has ESI ID | Light move-in | LightUser | `LightUsers` |
| **Keep original** | No ESI ID | TX-DEREG move-in | CottageUser | `CottageUsers` + `ElectricAccount` (TX-DEREG) |

**Key**: ESI ID = Light flow. No ESI ID = regular TX-DEREG move-in.

### Light Flow Shortcode Variants
| Entry | ShortCode | Flow Type | Plan Page |
|-------|-----------|-----------|-----------|
| `/move-in` (no shortcode) + Light address | None | Standard Light (non-encouraged) | Rate card (16.1¢/kWh) — 4 steps |
| `/move-in?shortCode=pgtest` + Light address | pgtest | Move-in → Light transition (encouraged) | Savings comparison ($138 vs $156) |
| `/move-in?shortCode=txtest` | txtest | True Light encourage conversion | "What's included" (simpler, no pricing) |

### Light Flow Test Data
- **Phone number**: Use `(646) 437-6170` — Light API rejects `1111111111`
- **Light address**: `2900 Canton St`, Dallas, TX — unit `524` (ESI ID: `10443720007633191`)
- **Must clear cookies** between Light flow tests — session caching causes skipped steps

### "Set it up myself" / Utility Verification Paths
The "set it up myself" button appears in different locations depending on the flow. All paths eventually lead to either a savings alert page or a Contact Provider/utility verification page.

| Flow | Button Text | Location | Destination |
|------|------------|----------|-------------|
| Standard move-in (autotest/no shortcode) | "I will do the setup myself" | Step 3 Utility Setup | Confirmation dialog → "I will do it myself" → Savings alert page (email opt-in) |
| Encourage conversion (pgtest) | "I will call and setup myself" | Encourage page (bottom) | Confirmation dialog → "I will do it myself" → Contact Provider page (upload proof / do it later) |
| Light standard (no shortcode) | "I will do the setup myself" | Plan Selection (bottom) | Redirects to encourage page → "I will call and setup myself" → Dialog → Contact Provider |
| Light encouraged (pgtest/txtest) | "I will set it up myself" | Plan page (bottom) | Dialog → "I will do it myself" → encourage page → "I will call" → Dialog → Contact Provider |

**Note**: On dev (Next.js), Light "set it up myself" goes directly to Contact Provider. On TanStack, it inserts the encourage page as an extra intermediate step.

### Waitlist Test Addresses
Waitlist can appear in 4 flows: **move-in**, **transfer**, **bill-upload**, and **verify-utilities**.

| Address / ZIP | Flows that show waitlist | Flows that DON'T |
|---------------|--------------------------|-------------------|
| `155 N Nebraska Ave, Casper, WY 82609` | Standard move-in, Transfer | Encouraged conversion (see note below) |
| `500 N Capitol Ave, Lansing, MI 48933` | Standard move-in, Transfer | Encouraged conversion (see note below) |
| ZIP `12249` (National Grid MA) | Bill upload, Verify utilities | — |

**Bill upload / Verify utilities waitlist**: Enter a ZIP where `isBillUploadAvailable=FALSE` on the UtilityCompany → "We haven't reached [ZIP] yet" waitlist page appears.

**Encouraged conversion + unsupported address behavior** (post ENG-2641 revert, 2026-04-08):
- **Building shortcodes** (e.g., `pgtest`): Welcome page renders with building's utility (e.g., SDGE) regardless of zip. No waitlist, no error — building config overrides zip lookup.
- **MoveInPartner shortcodes (utilVerif=ON)** (e.g., `venn73458test`): Routes to Contact Provider (utility verification) via `zip-logic.ts`. "Your provider is" shows empty — no provider for unsupported area.
- **MoveInPartner shortcodes (utilVerif=OFF) with no building utilities**: Welcome page with "null" utility name → 400 error on submit (ENG-2618 behavior, no test shortcode exists for this exact config).
- **No Slack waitlist alert fires** in any encouraged conversion path — the encouraged conversion machine never enters the waitlist XState state.

### Bill Upload Test Data
- **ZIP for Con Edison (bill upload available)**: `10001` (NOT `12249` — that maps to National Grid MA which goes to waitlist)
- **ZIP for National Grid MA (waitlist)**: `12249`
- **Test PDF**: `tests/resources/data/PGsample.pdf`

### TX Bill Drop
- **URL**: Same as Bill Upload / Verify Utilities but with a Light-enabled zip code (e.g., `75063`)

### Finish Registration Flow
- **URL**: Generated via API — the response contains the URL for the user
- **API**: `POST https://api-dev.publicgrd.com/v1/test-partner/register`
- **Auth**: Bearer token (see `.env`)
- **Body example**:
```json
{
  "building": { "internalID": "guid-autotest" },
  "resident": {
    "firstName": "Pgtest",
    "lastName": "API Val",
    "email": "pgtest+moved-guid009@joinpublicgrid.com"
  },
  "enrollment": { "moveInDate": "2026-03-23" },
  "property": { "unitNumber": "102UV", "siteId": "guid-test" }
}
```
- **Modifiable fields**: email, name, moveInDate (use future dates)
- **XState file**: `app/finish-registration/forms/form-wizard.tsx`

## Non-Billing Flows
Account's `maintainedFor` is null. No payment method added and cannot be added.

Triggered when:
- `isHandleBilling` is false on UtilityCompany or Building (via shortCode)
- OR `isBillingRequired` is false → user chooses "I will manage payments myself" at payment step

### Move-in Flow (Non-billing variant)
- Same URL as billing move-in, but building/utility config determines non-billing path

### Transfer Flow (Non-billing variant)
- Same as billing transfer

### Utility Verification Flow
- **URL**: `https://dev.publicgrid.energy/move-in?shortCode=pgtest`
- **Trigger**: Building `pgtest` has `isUtilityVerificationEnabled = TRUE` in Supabase
- **How it works**: When user clicks "I will call and setup myself" link, redirects to Utility Verification flow where user uploads documents

### Bill Upload / Savings Flow
- **URL**: `https://dev.publicgrid.energy/bill-upload/connect-account`
- **Prerequisite**: Utility Company's `isBillUploadAvailable` flag must be TRUE in Supabase
- **Test data**: Zip Code `12249` (Con Edison) has `isBillUploadAvailable = TRUE`
- **If flag is FALSE**: User enters waiting list flow instead
- **Route file**: `app/(bill-upload)/shared/components/page-layout.tsx`

### Verify Utilities Flow
- **URL**: `https://dev.publicgrid.energy/verify-utilities/connect-account`
- **Same prerequisite**: `isBillUploadAvailable = TRUE` on UtilityCompany
- **Test data**: Zip Code `12249` (Con Edison)

### Connect Flow
- **URL**: `https://dev.publicgrid.energy/connect`

### Canada Flow
- **Entry**: Add `?country=ca` to any encourage conversion URL (e.g., `/move-in?shortCode=pgtest&country=ca`)
- **Differences from US flow**: Address form shows individual fields instead of Google autocomplete:
  - Address (manual entry), Unit, City, Province dropdown (13 provinces), Postal code (A1A 1A1), Country=Canada
- **No Google autocomplete** — fully manual address entry
- **Test data**: `100 Queen St W`, Unit `5B`, City `Toronto`, Province `Ontario`, Postal `M5H 2N2`

### ENG-2347: Light Address Search Revamp
The Light address search has a fallback system when users can't find their address:

**Gate logic** (`shouldUseLightAddressAutocomplete`):
- Has shortCode → building has TX-DEREG or LIGHT electricCompanyID → Light type-ahead
- No shortCode → check state=TX AND zipCode eligibility > 0.5 → Light type-ahead
- Otherwise → Google autocomplete

**"Can't find your address?" behavior**:
- **Light type-ahead** (TX shortcodes): Opens fallback modal with Google autocomplete + individual fields (Address Line 1, Unit, City, State, ZIP). On Next → checks for ESI ID → shows confirmation modal if found
- **Google autocomplete** (non-TX shortcodes): Opens chat (NOT the modal)

**Address confirmation modal** (runs on every address submit for TX addresses):
- If Light full-address-search returns exactly 1 ESI ID → "Confirm your address" modal with "Use verified address" / "Keep original"
- "Use verified address" → Light flow. "Keep original" → regular sign-up flow
- If 0 or 2+ results → no modal, continue regular flow

**Test addresses**:
- `2900 Canton St, Dallas TX 75226, unit 524` → ESI ID `10443720007633191`
- `14100 Will Clayton Pkwy, Humble TX 77346, unit 21308` → ESI ID `1008901020901561560119`

### ENG-2715: Address Validation, Prefill Clear, Utility Override (PR #1217, merged 2026-04-17)
Built on top of ENG-2347. Three behavior changes plus two Pay Bills modal polish changes.

**AC1 — Validation state (check / X) on `LightAddressAutocomplete`** — renders in 3 places only:
- `app/move-in/forms/building-selection.tsx` (standard `/move-in` when `shouldUseLightAddressAutocomplete=true`)
- `app/move-in/light/encouraged-conversion/light-encouraged-address.tsx` (Light encouraged step; reached via `?shortCode=txtest` or after ESI detection)
- `app/(bill-upload)/texas-flow/address-search/page.tsx` (texas-flow bill upload)

**NOT applied on `address-encouraged-default-form.tsx`** — PR removed `LightAddressAutocomplete` from it. That form now uses Google `AddressAutocomplete`, which has its own pre-existing green-check (unrelated to this PR).

States:
| State | Input | Visual |
|-------|-------|--------|
| Empty | no value | neutral — no indicator, Continue disabled |
| Unresolved | typed, no ESI selected, OR `isAddressSearching`, OR form error | **red border** (invalid) |
| Valid | address picked with ESI ID, no processing, no errors | **green check** `<svg class="lucide lucide-check text-green-500">` |

DOM pattern: state is rendered via CSS classes (NO `data-invalid`/`data-valid`/`aria-invalid` attrs). Green indicator color `rgb(23, 178, 106)`.

**AC2 — Prefilled TX address cleared when Light partial-search returns 0**
- New machine state `checkingPrefilledAddressLight` in `app/move-in/machines/building-selection/index.ts`
- Logic in `light-prefilled-address-check-logic.ts`
- Fires when user arrives at standard `/move-in` with `?streetAddress=...&city=...&state=TX&zip=...` params
- Partial-search 0 results → field cleared, user starts from scratch
- Partial-search ≥1 results → prefill preserved, user can refine
- **Does NOT fire on `?shortCode=txtest` encouraged path** — that route doesn't read address prefill URL params at all (verified empirically — both ESI-covered and non-covered prefills landed empty)

**AC3 — Utility override params skip ESI confirmation modal**
- URL params: `?electricCompany=<utilityCode-or-name>` and/or `?gasCompany=<utilityCode-or-name>`
- Skips `runConfirmationSearch` → proceeds directly to next step
- Changes step count on standard move-in from **5 → 6** (adds utility setup step)
- Works even when `UtilityCompany.utilityCode` is NULL — e.g. `?electricCompany=COSERV` resolves to the CoServ record which has no utilityCode (verified 2026-04-17)
- Use case: Mynd partner onboarding for CoServ/TXDREG-split ZIPs where default zip mapping picks TXDREG

**AC4 — Unregistered shortCode + override still routes correctly**
- `?shortCode=moved&electricCompany=COSERV` — `moved` is a MoveInPartner (not a Building), so building validation fails
- Machine falls through to `companyOverride` path, still applies CoServ, skips confirmation modal
- Lands on encouraged conversion welcome confirmation page with "Service is started with CoServ on your behalf"

**AC6/AC7 — Pay Bills modal polish** (unrelated to address flows):
- `updating` state now has child states `choosing` + `editing`
- Flex-qualifying users (Flex-enabled property + not yet Flex customer) see `PaymentOptionsWithExternal` picker — footer hidden
- Clicking "Pay in full" transitions to `editing` — footer reappears (Save details / Cancel)
- Clicking "Learn more about Flex" closes Pay Bills sheet (matches "Split my bill" behavior)
- **Gotcha**: machine state persists across modal close/reopen — once picker is dismissed via Pay in full, refresh page to re-show picker

**"Can't find your address?" control type varies by context**:
| Context | Control type |
|---------|--------------|
| Standard `/move-in` address step (Google autocomplete, no TX) | inline text + "Open up a chat" link |
| Standard `/move-in` with TX address (LightAddressAutocomplete active) | underlined purple **link** (opens fallback modal) |
| `?shortCode=txtest` Light encouraged | **button** (opens fallback modal) |

**Utility resolution priority order** (verified 2026-04-17 via matrix exploratory):
1. **URL override param** (`?electricCompany=X` / `?gasCompany=X`) — always wins, even over Building config
2. **Building shortCode config** (pgtest→SDGE, autotest→ComEd) — wins over zip-based lookup
3. **Light ESI match** for TX-eligible zips — triggers ESI confirmation modal on standard flow
4. **Zip-based utility mapping** — fallback when no shortCode/override
5. **Waitlist** — when zip has no matching utility

**Prefill behavior differs by shortCode** (verified 2026-04-17):
| Shortcode | TX-eligible prefill (e.g. CoServ/TXDREG) behavior | Provider shown |
|-----------|--------------------------------------------------|----------------|
| standard (none) | AC2 clear fires — field cleared if Light partial-search returns 0; preserved if ≥1 | (from Light/zip lookup) |
| `autotest` (Building + useEncourageConversion=false) | **PRESERVED** on "Is this your address?" confirmation page | Building's ComEd (even for TX address) |
| `pgtest` (Building + useEncourageConversion=true) | **PRESERVED** on encouraged welcome; auto-advances past terms | Building's SDGE/SoCalGas — **logos may be broken** (alt text visible) when utility doesn't match entered zip (see ENG-2717) |
| `txtest` (Light encouraged) | **IGNORED entirely** — empty address field on load regardless of prefill params | N/A |

**Three address-step UI variants exist**:
1. **Standard address step**: "Enter your address" heading + Google/Light autocomplete + Unit field + Can't find link/button (non-Light shortcodes, empty state)
2. **"Is this your address?" confirmation**: appears on `autotest` + URL prefill and on cross-state prefill (e.g., TX zip + IL address → Google re-geocodes). Shows read-only address + "Your provider is: [utility]" + Edit + Back/Continue.
3. **Light encouraged "Confirm your address"**: on `txtest` or any Light-activated path. Has the LightAddressAutocomplete with Light type-ahead (red border on unresolved, green check on ESI-selected).

**AC3 override trust contract** (by design per AC text): `?electricCompany=X` / `?gasCompany=X` "force specific utility companies on the user, bypassing the standard company lookup" — this includes zip-to-utility mapping AND waitlist serviceability gate. Partners using the override take ownership of routing correctness; PG trusts the code. Example verified 2026-04-17: `?electricCompany=COSERV` + Casper WY waitlist address → user completes CoServ signup in WY (no waitlist fall-through). Mitigation: surface utility name on address step so user can catch partner misconfig (tracked as UX-3 in ENG-2715).

### Flex (Bill Splitting)
- **Visibility**: Only appears when ElectricAccount status = `ACTIVE`
- **Where**: Overview dashboard — purple "flex" badge + "Bite-sized payments for your bills — More"
- **Also**: Billing page shows "NEW — Split your bills into smaller payments — Learn more" banner
- **Modal**: "Split this bill into smaller payments" — PG + Flex logos, "Split my bill" button
- **Fee**: 2% bill payment fee + 1% if credit card
- **Provider**: Flex (getflex.com) — line of credit by Lead Bank or Column N.A., Member FDIC
- **Test setup**: Create ComEd user → set ElectricAccount status to ACTIVE via Supabase

### Transfer / Move-Out Flow
- **URL**: `https://dev.publicgrid.energy/transfer`
- **Alternative entry**: Active/eligible user → Services → "Transfer my service"
- **Spec**: See `moveout-transfer-flow-spec.md` in memory for full Move-Out/Transfer technical specification
- **New DB statuses**: `PENDING_STOP_SERVICE`, `TRANSFER_INCOMPLETE`
- **Flow (Net New User)**: Welcome → Move-out confirmation → Move-out date → New service question (3 options: start service / don't have address / skip) → New address → Service area check → Identity → Success
- **Flow (Existing User)**: Property selector → Move-out confirmation → Date → New address decision
- **"Don't have address yet"**: Creates shell account with `TRANSFER_INCOMPLETE` status, reminder email 14 days before estimated move-in
- **Test data**: Any address works. Chicago IL (ComEd) for serviceable, any non-serviceable ZIP for fallback

## Building Shortcodes

| Shortcode | Description | Key Flags |
|-----------|-------------|-----------|
| `autotest` | Standard move-in flow. Tied to a partner (different color). Same as regular move-in. | Standard |
| `pgtest` | Short version of move-in. | `useEncourageConversion = TRUE`, `isUtilityVerificationEnabled = TRUE` |
| `txtest` | Encourage conversion flow for Light/TX dereg. **Note**: Address search does ESI ID lookup — selecting an ESI ID routes to Light flow (`/move-in/light`), NOT `welcome-encouraged.tsx`. Use "Can't find your address?" → manual entry to reach TX-DEREG encouraged conversion page. | `useEncourageConversion = TRUE`, ElectricCompany = `TX-DEREG` |
| `moved1903` | Encouraged conversion, NO demand response provider. Useful as negative test for DR toggle visibility. Has extra "quick questions" step (how long staying, employment, programs) between welcome and About You. | `useEncourageConversion = TRUE`, `shouldShowDemandResponse = TRUE`, `demandResponseProviderID = NULL` |

## Partner Attribution

Partner attribution determines which external partner gets credit for a user — used for commercial commitments (referral fees), analytics dashboards, and partner-specific reporting. It's separate from partner theming.

### Tables involved

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `MoveInPartner` | `id`, `name`, `isThemed`, `useEncouragedConversion`, `imgURL`, `themeID` | Registered external partners (Moved, Venn, Renew, Funnel, Simpson, etc.) |
| `Referrals` | `referred` (→ `CottageUsers.id`), `referredBy` (→ `MoveInPartner.id`), `referralStatus` | Links each completed user registration to exactly one partner |
| `Property` | `externalLeaseID` | Partner-provided unique identifier (e.g., Moved's `internalID` → embed URL `leaseID` → this column). Preserved even when `Referrals.referredBy` falls back. |

### How attribution is resolved (current state, 2026-04-14)

Attribution flows from the `shortCode` URL param to the `MoveInPartner` ID at registration time. The resolver is **not a simple 1:1 map** — different shortcodes resolve to the same partner, and only registered shortcodes resolve at all.

| shortCode (in URL) | Resolves to MoveInPartner | Notes |
|--------------------|---------------------------|-------|
| `autotest`, `pgtest`, `txtest` | Varies by Building config | Resolved via `Building.shortCode` → `MoveInPartner` join |
| `moved5439797test`, `venn73458test`, `funnel4324534`, `renew4543665999` | Moved / Venn / Funnel / Renew | Registered partner shortcodes per the ENG-2588 RE A/B experiment setup |
| `moved` (D2C embed API output) | **Simpson (fallback) — BUG (ENG-2694)** | Not registered; should resolve to Moved. Until fixed, filter by `Property.externalLeaseID LIKE 'moved-%'` to recover D2C users from analytics. |
| Unknown / missing | Simpson (dev default) | Fallback partner when no match; `isThemed=false, useEncouragedConversion=false` |

### Verification query

Use this when testing any partner-integration flow to confirm the user is attributed correctly:

```sql
SELECT
  cu.email,
  mip.name AS attributed_partner,
  r."referralStatus",
  p."externalLeaseID",
  p."unitNumber"
FROM "Referrals" r
JOIN "CottageUsers" cu ON cu.id = r.referred
LEFT JOIN "ElectricAccount" ea ON ea."cottageUserID" = cu.id
LEFT JOIN "Property" p ON p."electricAccountID" = ea.id
JOIN "MoveInPartner" mip ON mip.id = r."referredBy"
WHERE cu.email = '<test user email>';
```

**Attribution correctness rule**: `attributed_partner` must match the expected partner name (e.g., "Moved" for Moved-driven flows). "Simpson" in a partner-integration test = attribution bug, not success.

### The `externalLeaseID` fallback

Partner D2C integrations that pass an `internalID` in their API payload get it stored on `Property.externalLeaseID`. This is independent of `Referrals.referredBy` and survives attribution-resolver failures. It's a useful trace for:
- Cross-referencing PG-side users back to partner-side records
- Filtering partner-specific cohorts in analytics when `Referrals.referredBy` is wrong (see ENG-2694 for an active example)
- Verifying data integrity even when the partner link is broken

## Test Data Quick Reference

| Data Point | Value | Notes |
|-----------|-------|-------|
| Light address | `2900 Canton St` | Triggers Light flow modal |
| Light unit number | `524` | Use with Light address |
| Light zip code | `75063` | TX-enabled for TX Bill Drop |
| Bill upload zip | `12249` | Con Edison, `isBillUploadAvailable = TRUE` |
| Finish reg API | `api-dev.publicgrd.com` | Bearer token: see `.env` |
| Bill upload ZIP (Con Edison) | `10001` | Con Edison, `isBillUploadAvailable = TRUE` |
| Finish reg building | `guid-autotest` | Internal ID for test building |
