# Connect Flow

Complete reference for the connect account flow — registration, connect utility, upload bill, and overview states.

## Overview

The connect flow is the onboarding path for users who sign up via `/connect`. These users register with an address and utility, then land on an overview page with options to either **connect their utility account** (credential-based linking) or **upload a bill** (document-based verification).

```
User                              Public Grid                        Utility Provider
  |                                    |                                    |
  |--- GET /connect ----------------->|                                    |
  |--- Fill form + Get started ------>|                                    |
  |                                    |-- Create user, EA, Property       |
  |<-- Redirect to /app/overview -----|                                    |
  |                                    |                                    |
  |  [Option A: Connect Utility]       |                                    |
  |--- Click "Connect utility" ------>|                                    |
  |--- Enter utility credentials ---->|--- Trigger.dev real-time run ----->|
  |                                    |<-- Validate credentials ----------|
  |                                    |<-- MFA challenge (optional) ----->|
  |--- Enter MFA code --------------->|--- Verify MFA ------------------->|
  |                                    |<-- Account details ---------------|
  |<-- "You're connected!" ----------|                                    |
  |                                    |                                    |
  |  [Option B: Upload Bill]           |                                    |
  |--- Click "Upload bill" ---------->|                                    |
  |--- Select file + Upload --------->|-- Store + process document         |
  |<-- Overview shows tracker --------|                                    |
```

## Entry Points

| Entry | URL | Description |
|-------|-----|-------------|
| Connect page | `/connect` | Public registration form |
| Overview — Connect utility | `/app/overview` → "Connect utility" button | Credential-based utility linking |
| Overview — Upload bill | `/app/overview` → "Upload bill" button | Document upload verification |
| Connect modal — Upload bill | Connect modal footer → "Upload bill" link | Fallback from connect modal |
| Connect error — Upload bill | Connect failed screen → "Upload bill" button | Fallback after credential failure |

## Registration Form (`/connect`)

**Fields:**
- Address (Google Places autocomplete)
- Unit / Apartment (optional)
- Utility company (auto-detected or dropdown for TX deregulated / multi-utility states)
- Email
- First name, Last name

**Behavior:**
- "Get started" button disabled until required fields filled
- On submit: creates user → redirects to `/app/overview`
- Password reset dialog appears on first overview visit (set password)
- ESCO notice may appear for NY addresses (dismiss with "Got it!")

**Building/Utility Detection:**
- TX addresses (deregulated): utility combobox shown, must select retail provider
- NY, MA, IL addresses: utility combobox shown, select from list
- Other states: utility may be auto-detected, combobox may not appear

## Overview Page — Auto-Apply Savings Card

After registration, connect users with `ELIGIBLE` status see the auto-apply savings card:

**Elements:**
- "Electricity via {Utility}" header with verified badge
- "Get savings applied automatically" heading
- Three benefit items (auto-apply, no changes, we handle)
- "Connect utility" button (only if `isConnectReady=true` on utility)
- "Upload bill" button (always visible)
- Sidebar: "Recommended for you" (renewable energy), "Savings — Searching"

**`isConnectReady` Visibility:**

| Feature | isConnectReady=true | isConnectReady=false |
|---------|--------------------|--------------------|
| "Connect utility" button | Visible | Hidden |
| "Connect account" link in upload bill modal | Visible | Hidden |
| "Upload bill" button | Visible | Visible |
| Auto-apply savings card | Visible | Visible |

**Utilities with `isConnectReady=true`:** Con Edison, ComEd, National Grid MA

## Connect Utility Flow

### Step 1: Credential Form
- Modal title: "Connect your account"
- Shows utility name + "Enter your {Utility} login details"
- Email and Password fields
- "Credentials are protected and never stored" notice
- Cancel / Connect buttons
- Footer: "No {Utility} account? Upload bill" link

### Step 2: Connecting Progress
- "Connecting your account" heading
- "This usually takes a few seconds" subtext
- Three-step progress indicator:
  1. Connecting to {Utility}
  2. Validating your credentials
  3. Pulling in your account details

### Step 3a: MFA Verification (if required)
- "Verify your identity" heading
- "{Utility} sent a verification code to your email or phone"
- Verification code input
- "Didn't receive a code? Resend code" link
- Cancel / Verify buttons

### Step 3b: Success
- "You're connected!" heading
- "Your {Utility} account is linked. We'll automatically find and apply savings for you."
- Account card showing utility name + account number
- "Done" button

### Step 3c: Error (bad credentials)
- "Connect failed" heading with red error icon
- "The email or password you entered doesn't match your {Utility} account. Try again or you can upload your utility bill instead"
- "Upload bill" button (fallback) / "Try again" button (returns to credential form)

### Known Bug: ENG-2478
After successful connect (Step 3b → "Done"), the overview page does **not** update. The auto-apply card remains with "Connect utility" and "Upload bill" buttons visible, as if the connection never happened. The upload bill flow correctly updates the overview — this is specifically a connect success callback issue (missing data refetch).

## Upload Bill Flow (from Overview)

### Step 1: Upload Modal
- Modal title: "Upload document"
- Drop zone: "Click to upload or drag and drop your file here"
- Cancel button, Upload button (disabled until file selected)
- Footer: "Have a {Utility} account? Connect account" link (only if `isConnectReady=true`)

### Step 2: File Selected (Ready View)
- File name displayed (e.g., "PGsample.pdf")
- "Made a mistake? Re-upload" link
- Upload button enabled
- File size is NOT displayed

### Step 3: Uploading
- Progress percentage shown (e.g., "54% (Uploading)")
- Modal auto-dismisses on completion

### Step 4: Overview Updates to Tracker
After upload, the auto-apply card is replaced by a progress tracker:
1. **"We're checking your bill has everything we need"** (active) — reviewing upload to confirm account details
2. **"Savings applied automatically"** (pending) — once verified, will scan for savings

## Test Data

### Addresses & Utilities

| Key | Address | Utility | isConnectReady |
|-----|---------|---------|----------------|
| CON_EDISON | 88 S 1st St, Brooklyn, NY 11249 | Con Edison | true |
| COMED | 808 Chicago Ave, Dixon, IL 61021 | ComEd | true |
| NGMA | 52 Plymouth St, Cambridge, MA 02141 | National Grid MA | true |
| TX_DEREG | 1301 University Ave, Lubbock, TX 79401 | THINK ENERGY | false |
| TX_LIGHT | 2900 Canton St, Dallas, TX 75226 | THINK ENERGY | false |
| PECO | 1500 Market St, Philadelphia, PA 19102 | PECO | false |
| PSEG | 80 Park Pl, Newark, NJ 07102 | PSEG | false |
| EVERSOURCE | 100 Pearl St, Hartford, CT 06103 | Eversource | false |
| DUKE_ENERGY | 550 S Tryon St, Charlotte, NC 28202 | Duke Energy | false |
| GEORGIA_POWER | 241 Ralph McGill Blvd, Atlanta, GA 30308 | Georgia Power | false |
| FPL | 700 Universe Blvd, Juno Beach, FL 33408 | Florida Power and Light | false |
| BGE | 2 Center Plz, Baltimore, MD 21201 | Baltimore Gas and Electric | false |
| DTE | 1 Energy Plz, Detroit, MI 48226 | DTE | false |
| ORANGE_ROCKLAND | 390 W Route 59, Spring Valley, NY 10977 | Orange & Rockland | false |

Data file: `tests/resources/data/connect_flow-data.json`

## Automated Test Coverage

### Spec Files (26 tests total)

| Spec | Tests | Coverage |
|------|-------|---------|
| `connect_registration_form.spec.ts` | 5 | Form UI: image, fields, disabled state, legal links, TX utility |
| `connect_registration_and_overview.spec.ts` | 2 | Full registration + overview, duplicate email error |
| `connect_utility_modal.spec.ts` | 3 | Modal form view, upload bill link, modal switch |
| `auto_apply_card.spec.ts` | 5 | Card layout, isConnectReady visibility, upload bill opens modal, connect→upload switch |
| `upload_bill_modal.spec.ts` | 5 | Modal idle view, connect account link, ready view, file size, re-upload |
| `connect_utility_error.spec.ts` | 4 | Connect failed error UI, try again, upload bill fallback, upload bill e2e submission |
| `setup_tracker.spec.ts` | 1 | Tracker component (Eversource) |
| `connect_regression.spec.ts` | 1 | No billing UI for connect users |

### Auth Pattern — StorageState

All specs that need post-registration pages use:
1. `beforeAll`: Register user(s) via `/connect`, save `storageState` to temp file
2. Each test: Restore cookies + localStorage via `restoreSession()`, navigate to `/app/overview`
3. `afterAll`: Clean up temp auth files with `fs.rmSync`

### Dialog Handling

After restoring session and navigating to overview:
1. `dismissPasswordResetIfPresent(page)` — fills password fields and submits
2. `dismissESCONoticeIfPresent(page)` — `.last().click({ force: true })` for NY duplicate alertdialog

## Gaps — Not Automatable

| Flow | Blocker | Workaround |
|------|---------|------------|
| Connect utility success e2e | Real utility credentials + third-party MFA OTP (ComEd sends to user email/phone, not our Fastmail) | Manual exploratory via Playwright MCP with human OTP entry |
| Post-connect overview state | ENG-2478 — overview doesn't update after connect success | Blocked until bug is fixed |
| Connect utility with real MFA in CI | No sandbox/mock mode for Trigger.dev connect flow | Request mock mode from dev team |

### Recommendation

Request a **test/sandbox mode** for the connect utility flow from the dev team. A flag that bypasses real utility API calls and returns predictable success/error responses would unblock full CI automation. The upload bill flow is fully automatable and serves as the primary happy path for CI.

## Page Objects

| POM | File | Purpose |
|-----|------|---------|
| `ConnectPage` | `connect_page.ts` | `/connect` registration form |
| `ConnectOverviewPage` | `connect_overview_page.ts` | `/app/overview` for connect users |
| `UploadBillModalPage` | `upload_bill_modal_page.ts` | Upload bill modal (from auto-apply card) |
| `ConnectUtilityModalPage` | `connect_utility_modal_page.ts` | Connect utility modal (credential form + error states) |

## Related Tickets

| Ticket | Description | Status |
|--------|-------------|--------|
| ENG-2402 | Connect flow test automation | Done |
| ENG-2370 | Overview page eligible status view updates | Done |
| ENG-2363 | Reusable connect utility modal component | Done |
| ENG-2478 | Overview doesn't update after connect utility success | Triage (assigned to Butch) |
