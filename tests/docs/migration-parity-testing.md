# Migration Parity Testing Guide

> Last updated: 2026-04-14
> Author: Christian (QA)
> Source: Lessons learned from ENG-2188 (Next.js → TanStack Start migration)

## Overview

When testing a framework migration, the goal is **behavioral parity** — every flow, component, and data path must produce the same result on the target deployment as on the source. This guide documents the methodology learned from ENG-2188.

## Key Lessons from ENG-2188

1. **We tested the wrong deployment for weeks.** `dev.publicgrid.energy` was still Next.js. `tanstack-dev.onepublicgrid.com` was the actual TanStack deployment. Issues that were already fixed on Next.js passed our tests, masking 8 CRITICAL bugs on TanStack.

2. **Happy path ≠ parity.** A flow that "completes successfully" can still have broken URL params, wrong toggle defaults, missing field attributes, or incorrect component visibility. Parity means every observable detail matches.

3. **Code audits find what QA misses.** Anton's line-by-line code audit found issues in hours that QA missed over 20+ sessions. The QA equivalent is side-by-side testing with field-level inspection.

## Methodology

### Step 1: Confirm Deployment

Before ANY testing, verify you're on the right deployment:

```javascript
// Check for Next.js
curl -s https://<host>/move-in | grep '_next/static' | head

// Check for TanStack  
// Look for TanStack devtools in browser, absence of _next/static
```

### Step 2: Side-by-Side Parity Testing

For every flow being tested:

1. Open source deployment (e.g., `dev.publicgrid.energy`) in one browser
2. Open target deployment (e.g., `tanstack-dev.onepublicgrid.com`) in another
3. Walk through the SAME flow on both
4. At each step, compare:

| What to compare | How |
|-----------------|-----|
| URL params | Read URL bar — check for encoded characters (`%22` = literal quotes) |
| Toggle/checkbox defaults | Are they ON or OFF by default? (opt-in vs opt-out) |
| Field attributes | `browser_evaluate`: check `disabled`, `name`, `value`, `checked`, `placeholder` |
| Component visibility | Is a button/link shown for guest? For logged-in? Compare both |
| Form submission | Does the form actually submit all fields? Check `name` attribute exists |
| Error states | What happens on invalid input, network error, empty state? |
| Navigation | Does back/forward preserve state? Does the URL update? |

### Step 3: Inspect DOM, Not Just Visuals

Visual appearance can lie. A field can look editable but have `disabled=true`. A form field can appear correct but have no `name` attribute (so it won't submit).

```javascript
// Check all form fields on a page
() => {
  const inputs = Array.from(document.querySelectorAll('input'));
  return inputs.map(i => ({
    value: i.value,
    disabled: i.disabled,
    name: i.name || '(no name)',
    checked: i.checked,
    type: i.type
  }));
}
```

### Step 4: Code Audit → Test Cases

When a developer posts a code-level audit:

1. **Read every item** — don't skim
2. **Triage into buckets:**
   - **UI-testable** — observable from browser (URL params, field states, component visibility, HTTP status codes)
   - **Network-testable** — observable from request/response payloads
   - **Code-only** — only verifiable via code review or unit tests
   - **Blocked on data/access** — needs specific user state or external system access
3. **Test UI-testable items IMMEDIATELY** — don't wait to be asked
4. **For blocked items, create the conditions** — new user via move-in, DB flag via Supabase, etc.

### Step 5: Payment Pipeline Testing

For payment testing on a migration:

1. **Create user via move-in flow** (not DB insert) — ensures all Stripe/BLNK/ChargeAccount records are created correctly
2. **Set ElectricAccount to ACTIVE** via Supabase
3. **Insert bill as `approved`** — let the `balance-ledger-batch` cron process it naturally
4. **Wait for cron** — `*/5` schedule. First cycle: BLNK transaction + bill → `processed` + Payment `requires_capture`. Second cycle: `stripe-payment-capture-batch` → Payment `succeeded`.
5. **Do NOT manually set `ingestionState` or `paymentStatus`** — this creates inconsistencies between BLNK ledger and Supabase
6. **Keep the browser session alive** — don't clear cookies between move-in and billing page

### Checklist for Migration QA

- [ ] Confirmed deployment URL (target, not source)
- [ ] Entry points (all shortcodes, flows, static pages)
- [ ] Full move-in with payment (autotest shortcode)
- [ ] Encouraged conversion flow (pgtest shortcode)
- [ ] Light move-in (txtest + ESI address)
- [ ] Transfer flow (guest + logged-in)
- [ ] Waitlist flow (unsupported address)
- [ ] Post-auth pages (overview, billing, services, household, account tabs)
- [ ] Payment: manual pay successful
- [ ] Payment: manual pay failed (declined card)
- [ ] Payment: auto-pay successful (cron pipeline)
- [ ] Payment: auto-pay failed
- [ ] Payment emails (content verification, not just count)
- [ ] Portal pages (Light user: overview, billing, account, support)
- [ ] SetPasswordModal (app + portal contexts)
- [ ] Partner theming (Venn, Funnel, Renew, Moved)
- [ ] DR consent (opt-in, not opt-out)
- [ ] Household invite (send, email, accept)
- [ ] Drop-off resume (guid URL)
- [ ] Canada flow (shortCode + country=ca — NOT just country=ca alone)
- [ ] Non-billing flow ("I will manage payments myself")
- [ ] Finish registration (API → URL → 3-step flow)
- [ ] TX bill drop full flow (ZIP 75063 → savings → Light switch → payment)
- [ ] Bill upload full flow (ZIP → upload real PDF → success → verify DB)
- [ ] Verify utilities full flow (ZIP → upload → results)
- [ ] Connect full flow (address + email → dashboard)
- [ ] Forgot password (submit email → verify reset email arrives)
- [ ] OTP sign-in (send code → fetch from Fastmail → verify → sign in)
- [ ] RE subscription (Activate → fill card → Save → verify Active in DB → cancel → verify)
- [ ] Household invite (send → DB check → email content check)
- [ ] Side-by-side field inspection on every form
- [ ] Email content verification for EVERY flow (read body, check for blank `<template></template>`)

## Test Users Created (ENG-2188, Apr 14)

| Email | Purpose | EA ID |
|-------|---------|-------|
| `pgtest+tsk-pay-001@joinpublicgrid.com` | Manual pay + failed pay testing | 20222 |
| `pgtest+tsk-light-001@joinpublicgrid.com` | Light user portal testing | — (LightUser) |
| `pgtest+tsk-autopay-001@joinpublicgrid.com` | Auto-pay testing (cron bug found) | 20223 |
| `pgtest+tsk-autopay-002@joinpublicgrid.com` | Auto-pay clean user (cron bug confirmed) | 20224 |
| `pgtest+tsk-manualpay-001@joinpublicgrid.com` | Confirm $0 outstanding before cron | 20227 |
| `pgtest+tsk-enc-001@joinpublicgrid.com` | Encouraged conversion | — |
| `pgtest+tsk-nonbill-001@joinpublicgrid.com` | Non-billing move-in | — |
| `pgtest+tsk-billupload-001@joinpublicgrid.com` | Bill upload (BILL_UPLOAD) | 20230 |
| `pgtest+tsk-verifyutil-001@joinpublicgrid.com` | Verify utilities (ACCOUNT_VERIFICATION) | 20231 |
| `pgtest+tsk-connect-001@joinpublicgrid.com` | Connect (isConnectAccount=true) | 20232 |
| `pgtest+tsk-transfer-001@joinpublicgrid.com` | Transfer (2 EAs: PENDING_STOP + NEW) | 20233/20234 |
| `pgtest+tsk-canada-001@joinpublicgrid.com` | Canada + RE subscription + household | — |
| `pgtest+tsk-finishreg-001@joinpublicgrid.com` | Finish registration (VERIFY_UTILITIES) | 20236 |
| `pgtest+tsk-txbilldrop-002@joinpublicgrid.com` | TX bill drop + Light switch (Bug #6) | — (LightUser) |

## Bugs Found

| Ticket | Description |
|--------|-------------|
| ENG-2700 | Payment Failed email shows "Unknown ending in ****" instead of card brand + last4 |
| ENG-2421 comment | `balance-ledger-batch` creates BLNK APPLIED entry but doesn't update ElectricBill to `processed` or create Payment |
