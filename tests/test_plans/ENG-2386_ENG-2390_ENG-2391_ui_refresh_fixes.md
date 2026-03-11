# Test Plan: UI/UX Refresh Fixes (ENG-2386, ENG-2390, ENG-2391)

## Overview

| Field | Value |
|-------|-------|
| **Tickets** | [ENG-2386](https://linear.app/public-grid/issue/ENG-2386), [ENG-2390](https://linear.app/public-grid/issue/ENG-2390), [ENG-2391](https://linear.app/public-grid/issue/ENG-2391) |
| **PRs** | [PR #1079](https://github.com/Cottage-Energy/cottage-nextjs/pull/1079) (feat/cian ui fixes v3), [PR #1080](https://github.com/Cottage-Energy/cottage-nextjs/pull/1080) (fix: company override in query params) |
| **Project** | UI/UX Refresh |
| **Priority** | High |
| **Created By** | Tomy Falgui |
| **Developer** | Cian Laguesma |
| **Environment** | dev |
| **Date** | 2026-03-11 |

## Why Combined

All three tickets are delivered in the **same PR #1079** as part of the UI/UX Refresh project. They share common UI components (Button, Sheet, Card styles) and affect related user flows. Testing them together ensures no cross-regression between the fixes.

---

## Area 1: Payment Method / Pay Bill Button (ENG-2390)

### What Changed
- **Pay Bills sheet** — now full-width on mobile (`w-full`), responsive max-height (`max-h-[60vh]` mobile, `max-h-[98vh]` desktop)
- **Payment method card layout** — restructured from horizontal row to vertical stack with icon, details, and Edit button repositioned to top-right
- **Radio buttons** — only shown when user is a Flex customer AND has a payment method (`showRadio` logic)
- **"Make a Payment" → "Pay bill"** — button text changed, now `w-full`
- **Payment method update footer** — moved from `payment-method-form.tsx` to `pay-bills-modal.tsx` (new `hideFooter` prop); Cancel/Save buttons now in modal footer
- **Flex promo card** — now shows below payment method card (was inline with radio options)
- **Bank account info** — "Bank payments process within 3-5 business days" moved inside the card
- **"Edit details" → "Edit"** — button text shortened
- **Badge "3% fee"** — repositioned to bottom-right of card
- **Badge "2-3% fee"** — now always shows for Flex (removed bank account conditional)
- **DividerBeads** — added responsive margin (`mt-6 md:mt-0`) in viewing state
- **PR #1080** — company override guard added to building-selection state machine (redirects to `companyOverride` state when utility override data exists)

### Test Cases

#### TC-PAY-01: Pay Bills sheet opens and displays correctly (Desktop)
- **Precondition**: User with active account and existing payment method
- **Steps**:
  1. Navigate to Billing page
  2. Click "Pay bill" / trigger pay bills flow
  3. Observe the Pay Bills sheet
- **Expected**:
  - Sheet opens from right side, max-width 32.5rem on desktop
  - Sheet has close button (X)
  - "Pay your bill" header displays
  - Payment method card shows with updated layout
  - "Pay bill" button shows at bottom (full width)

#### TC-PAY-02: Pay Bills sheet — mobile responsive layout
- **Precondition**: Same as TC-PAY-01
- **Steps**:
  1. Open Pay Bills sheet on mobile viewport (or resize to mobile)
  2. Observe layout
- **Expected**:
  - Sheet is full-width on mobile (`w-full`)
  - Content area has max-height 60vh with scrollable overflow
  - DividerBeads has proper top margin on mobile
  - "Pay bill" button is full width

#### TC-PAY-03: Payment method card — non-Flex user with card payment
- **Precondition**: User with credit/debit card, NOT a Flex customer
- **Steps**:
  1. Open Pay Bills sheet
  2. Observe payment method card
- **Expected**:
  - No radio buttons displayed
  - Card icon shows at top-left
  - Card name + "ending in XXXX" displays
  - Expiry info shows below
  - "Edit" link button at top-right
  - "3% fee" badge at bottom-right
  - Flex promo card shows below ("Add flexible payments to your account")

#### TC-PAY-04: Payment method card — non-Flex user with bank account
- **Precondition**: User with bank account, NOT a Flex customer
- **Steps**:
  1. Open Pay Bills sheet
  2. Observe payment method card
- **Expected**:
  - No radio buttons displayed
  - "Bank account ending in XXXX" displays
  - Bank name and account type show
  - "Bank payments process within 3-5 business days" text inside the card
  - No "3% fee" badge (bank accounts exempt)
  - "Edit" link button at top-right
  - Flex promo card shows below

#### TC-PAY-05: Payment method card — Flex customer with payment method (radio buttons)
- **Precondition**: User IS a Flex customer AND has a payment method
- **Steps**:
  1. Open Pay Bills sheet
  2. Observe radio selection
- **Expected**:
  - Radio buttons visible for both "Flex" and "Public Grid" options
  - Selecting Flex highlights with purple background/border
  - Selecting Public Grid highlights with purple background/border
  - "2-3% fee" badge always shows on Flex option
  - Flex logo displays in purple rounded box

#### TC-PAY-06: Payment method card — Flex customer WITHOUT payment method
- **Precondition**: User IS a Flex customer, NO payment method on file
- **Steps**:
  1. Open Pay Bills sheet
  2. Observe display
- **Expected**:
  - Flex option shows but without radio button (showRadio = false because no payment method)
  - No Public Grid payment card shown
  - "Add payment method" button should appear

#### TC-PAY-07: Edit payment method flow
- **Precondition**: User with existing payment method
- **Steps**:
  1. Open Pay Bills sheet
  2. Click "Edit" on payment method card
  3. Observe payment method update view
- **Expected**:
  - Header changes to "Payment method"
  - Payment method form displays WITHOUT its own footer (hideFooter=true)
  - Cancel and "Save details" buttons appear in the modal footer (not the form)
  - Cancel returns to pay bills view
  - "Save details" triggers form submission

#### TC-PAY-08: Pay bill button functionality
- **Precondition**: User with payment method, non-Flex or Flex with Public Grid selected
- **Steps**:
  1. Open Pay Bills sheet
  2. Ensure "Public Grid" payment method is selected (if Flex customer)
  3. Click "Pay bill" button
- **Expected**:
  - Payment submission triggers
  - Button text is "Pay bill" (not "Make a Payment")
  - Button spans full width

#### TC-PAY-09: Close Pay Bills sheet
- **Steps**:
  1. Open Pay Bills sheet
  2. Click X (close) button
- **Expected**:
  - Sheet closes
  - No state leaks on re-open

---

## Area 2: Sign-In Illustration — Safari Fix (ENG-2391)

### What Changed
- **SVG illustrations replaced with PNG images** — `home-chart.svg` and `home-chart-small.svg` deleted, replaced with `home-chart.png` using Next.js `<Image>` component
- **Desktop**: Image 534x327px, hidden on mobile (`md:block hidden`)
- **Mobile**: Image 325x199px, hidden on desktop (`md:hidden block`)
- Both use `loading="lazy"` and `flex-shrink-0`
- SVG files removed from repo entirely

### Test Cases

#### TC-SIGNIN-01: Sign-in page illustration renders on Desktop (Chrome)
- **Steps**:
  1. Navigate to sign-in page (logged out)
  2. Observe the left/background panel
- **Expected**:
  - "Utilities on Autopilot" text displays
  - Home chart PNG image renders correctly (534x327)
  - No broken image icons
  - Image does not overflow or shrink unexpectedly

#### TC-SIGNIN-02: Sign-in page illustration renders on Desktop (Safari)
- **Steps**:
  1. Open sign-in page in Safari (or Safari project)
  2. Observe the illustration panel
- **Expected**:
  - Image renders correctly (this was the reported Safari bug)
  - No blank/missing illustration
  - Layout matches Chrome

#### TC-SIGNIN-03: Sign-in page illustration renders on Mobile
- **Steps**:
  1. Open sign-in page on mobile viewport
  2. Observe illustration
- **Expected**:
  - Smaller image variant shows (325x199)
  - Desktop image is hidden
  - No layout shift or overflow

#### TC-SIGNIN-04: Sign-in page — functional login still works
- **Steps**:
  1. Navigate to sign-in page
  2. Enter valid credentials and sign in
- **Expected**:
  - Sign-in form is not affected by illustration changes
  - Successful login redirects as expected

---

## Area 3: Onboarding Step 2 & Secondary Button (ENG-2386)

### What Changed
- **Address confirmation card** — now has border, background (`border-gray-100 bg-brown-25 rounded-xl`), removed inner gap
- **Edit button** — changed from raw `<div>` with PencilLine icon to proper `<Button variant="link">` with `startIcon={PencilLine}` (custom filled pencil icon)
- **Provider label** — "Electricity provider:" / "Natural Gas Provider:" → "Your provider is:" (unified)
- **Grid gap** — increased from `gap-4` to `gap-6`
- **"Can't find your address?"** — moved inside the Card component (was outside below the card)
- **Secondary button** — `packages/ui/src/button.tsx` change (1 line)
- **Transfer flow (new-address.tsx)** — same Edit button + provider label changes applied
- **Padding fix** — utility provider row changed from `p-4` to `px-4 py-3`
- **PR #1080** — company override state machine guard: when utility override data exists + no building shortcode + prefilled address + hasn't passed through building → redirect to `companyOverride` state

### Test Cases

#### TC-ONBOARD-01: Address confirmation card styling (Step 2)
- **Precondition**: Start move-in flow, complete Step 1 (address search)
- **Steps**:
  1. Select an address in Step 1
  2. Proceed to Step 2 (building selection confirmation)
  3. Observe the address confirmation card
- **Expected**:
  - Card has light brown background (`bg-brown-25`)
  - Card has gray border (`border-gray-100`)
  - Card has rounded corners (`rounded-xl`)
  - Content spacing is `gap-6`

#### TC-ONBOARD-02: Edit button on address card
- **Steps**:
  1. On Step 2, observe the Edit button next to the address
- **Expected**:
  - Shows as a link-style button with filled pencil icon
  - Icon is 16x16px (`h-4 w-4`)
  - Text says "Edit"
  - Clicking opens address edit mode

#### TC-ONBOARD-03: Provider label text
- **Precondition**: Address with detected utility provider
- **Steps**:
  1. On Step 2, observe the utility provider section
- **Expected**:
  - Label reads "Your provider is:" (not "Electricity provider:" or "Natural Gas Provider:")
  - Provider logo displays correctly
  - Applies for both electric-only and gas-only addresses

#### TC-ONBOARD-04: Provider label — dual utility (electric + gas)
- **Precondition**: Address with both electric and gas providers
- **Steps**:
  1. On Step 2, observe provider section
- **Expected**:
  - Both providers display (electric and gas rows)
  - Dual-provider layout is unaffected by label change

#### TC-ONBOARD-05: "Can't find your address?" placement
- **Precondition**: User on Step 2 with light address autocomplete enabled
- **Steps**:
  1. Observe the "Can't find your address?" link
- **Expected**:
  - Link appears inside the card area (not below it)
  - Clicking opens the manual address entry / chat modal

#### TC-ONBOARD-06: Company override redirect (PR #1080)
- **Precondition**: Move-in URL with utility company override query params, prefilled address, no building shortcode
- **Steps**:
  1. Navigate to move-in with company override params
  2. Observe the building selection flow
- **Expected**:
  - Flow redirects to `companyOverride` state
  - Override company data is preserved
  - Does NOT redirect if: building shortcode exists, OR no prefilled address, OR already passed through building

#### TC-ONBOARD-07: Next button / form submission (Step 2)
- **Steps**:
  1. Complete address confirmation on Step 2
  2. Click Next / Continue button
- **Expected**:
  - Proceeds to Step 3
  - Processing state shows while loading
  - No layout regressions from gap/padding changes

#### TC-ONBOARD-08: Transfer flow — address card consistency
- **Precondition**: User in transfer/move flow
- **Steps**:
  1. Complete address selection in transfer flow
  2. Observe the confirmed address card
- **Expected**:
  - Same Edit button style (link variant + pencil icon)
  - Same "Your provider is:" label text
  - Same address card gap removed (`gap-1.5` removed)
  - Layout matches move-in flow

---

## Area 4: Cross-Cutting / Shared UI Components

### What Changed
- **`packages/ui/src/button.tsx`** — 1-line secondary button change
- **`packages/ui/src/sheet.tsx`** — 3-line sheet styling change
- **`packages/styles/globals.css`** — 5 new global styles
- **`packages/styles/tailwind.config.js`** — 2 new config entries

### Test Cases

#### TC-UI-01: Secondary button styling
- **Steps**:
  1. Observe Cancel button in payment method update flow
  2. Check any other secondary buttons across the app
- **Expected**:
  - Secondary button renders with updated variant style
  - No visual regressions on existing secondary buttons

#### TC-UI-02: Sheet component — mobile behavior
- **Steps**:
  1. Open any sheet/modal that uses the Sheet component on mobile
  2. Observe behavior
- **Expected**:
  - Sheet renders correctly on mobile
  - Close button works
  - Content is scrollable when exceeding viewport

---

## Browser Matrix

| Test Area | Chrome | Firefox | Safari | Mobile Chrome | Mobile Safari |
|-----------|--------|---------|--------|---------------|---------------|
| Payment (ENG-2390) | Yes | Yes | Yes | Yes | Yes |
| Sign-In Illustration (ENG-2391) | Yes | Yes | **Critical** | Yes | **Critical** |
| Onboarding Step 2 (ENG-2386) | Yes | Yes | Yes | Yes | Yes |
| Shared UI | Yes | Yes | Yes | Yes | Yes |

Safari is **critical** for ENG-2391 as the original bug was Safari-specific.

---

## Test Priority

### P0 — Must test before sign-off
- TC-SIGNIN-02 (Safari illustration — the reported bug)
- TC-PAY-01 (Pay Bills sheet renders)
- TC-PAY-07 (Edit payment method flow — footer moved)
- TC-ONBOARD-01 (Address card styling)
- TC-ONBOARD-06 (Company override redirect)

### P1 — High priority
- TC-PAY-02 (Mobile responsive pay bills)
- TC-PAY-03, TC-PAY-04, TC-PAY-05 (Payment method variants)
- TC-PAY-08 (Pay bill submission)
- TC-SIGNIN-01, TC-SIGNIN-03 (Illustration on other browsers/viewports)
- TC-ONBOARD-02, TC-ONBOARD-03 (Edit button + provider label)
- TC-ONBOARD-08 (Transfer flow consistency)

### P2 — Nice to have
- TC-PAY-06 (Flex without payment method — edge case)
- TC-PAY-09 (Close sheet)
- TC-SIGNIN-04 (Login functional — regression)
- TC-ONBOARD-04, TC-ONBOARD-05, TC-ONBOARD-07 (Secondary scenarios)
- TC-UI-01, TC-UI-02 (Shared component spot checks)

---

## Automation Candidates

| Test Case | Automatable? | Notes |
|-----------|-------------|-------|
| TC-SIGNIN-01/02/03 | Yes | Visual check — navigate to sign-in, assert image element exists |
| TC-PAY-01/02 | Partial | Requires user with bills — existing payment test fixtures may help |
| TC-ONBOARD-01/02/03 | Yes | Extend move-in flow tests to verify card styling + labels |
| TC-ONBOARD-06 | Yes | Navigate with query params, assert state machine routing |

---

## Risks & Notes

1. **Payment tests are partially blocked** — auto-payment tests depend on ChargeAccount/BLNK server (see [payment-tests-fix.md](../../tests/test_plans/../resources/utils/))
2. **No existing move-in e2e tests** — `tests/e2e_tests/move-in/` is empty; onboarding tests would need new spec files
3. **SVG → PNG swap** — ensure no other pages imported the deleted SVGs (`home-chart.svg`, `home-chart-small.svg`)
4. **`hideFooter` prop** — payment method form footer is now controlled by parent; verify no other consumers of `PaymentMethodForm` break
5. **PR #1080 state machine change** — guard ordering matters; ensure existing flows (shortcode, no-prefill) are unaffected
