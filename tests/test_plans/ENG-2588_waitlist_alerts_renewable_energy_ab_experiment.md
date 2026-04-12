# Test Plan: Waitlist Alerts, Renewable Energy A/B Experiment, and Tracking

## Overview
**Ticket**: ENG-2588
**Source**: [Linear](https://linear.app/public-grid/issue/ENG-2588) | [PR #1154](https://github.com/Cottage-Energy/cottage-nextjs/pull/1154)
**Date**: 2026-03-31
**Tester**: Christian

## Scope

### In Scope
- Waitlist Slack alerts across all 4 entry points (move-in, transfer, join-wait-list, email-ask)
- Renewable energy A/B experiment — all 3 variants (control, variant-b, variant-c) on encouraged conversion welcome page
- Variant-b card selection validation (submit gating, wobble animation, error badge)
- Variant-c enhanced toggle (confetti, nudge badge, dynamic copy)
- Partner theming on variant components (primaryColor propagation)
- Feature flag fallback to `control` on failure/loading/unexpected value
- `renewable_energy_offer_exposed` PostHog event — once-per-mount, correct properties
- `legal_link_clicked` PostHog event — Terms, Privacy Policy, LPOA
- Copy updates on encouraged conversion welcome page
- "I will call and setup myself" button style change
- Start-service-type inline upsell — exposure tracking added (control variant only)

### Out of Scope
- Slack message content/formatting (can only verify via `#wait-list` channel manually)
- PostHog dashboard configuration (flag variant setup is a PostHog admin task)
- PostHog event data accuracy beyond property names (analytics team owns data validation)
- Demand response consent toggle (unchanged by this PR)

### Prerequisites
- PostHog feature flag `move_in_renewable_energy_upsell` configured with `control`, `variant-b`, `variant-c` variants
- Building with `offerRenewableEnergy = true` and linked `SubscriptionConfiguration` (e.g., `pgtest` or `autotest` with ComEd)
- Access to `#wait-list` Slack channel to verify alert messages
- Browser DevTools or network interception to verify PostHog events
- Partner-themed shortcodes for theming tests: `autotest` (Moved/blue), `funnel4324534` (Funnel/navy), `venn325435435` (Venn/coral)

### Dependencies
- PostHog feature flag service must be accessible in dev
- `/api/send-alert` endpoint must be functional for waitlist alerts
- `SubscriptionConfiguration` must exist for the utility to show renewable energy options

## Test Cases

### Waitlist Slack Alerts — Move-in Flow

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Waitlist alert fires on standard move-in (unsupported area) | 1. Navigate to `/move-in?shortCode=autotest` 2. Enter an address in an unsupported area (no matching utility) 3. Observe waitlist page renders | Waitlist page appears with "We haven't reached your area yet". Slack `#wait-list` receives message with customer name, email, address/zip, "via standard move-in", timestamp | P1 | Partial — can verify page, not Slack |
| TC-002 | Waitlist alert fires on encouraged conversion move-in (unsupported area) | 1. Navigate to `/move-in?shortCode=pgtest` 2. Enter an unsupported address 3. Observe waitlist page | Slack message includes "via encouraged conversion" (not "standard move-in") | P1 | Partial |
| TC-003 | Waitlist alert includes all available context fields | 1. Start move-in with name, email, and full address filled 2. Reach waitlist state | Slack message includes: firstName, lastName, email, addressString, zip, flow type, timestamp | P2 | No — Exploratory |
| TC-004 | Waitlist alert handles missing fields gracefully | 1. Reach waitlist state with minimal context (e.g., no email set yet) | Alert fires without crashing; message omits missing fields (no "undefined" in message) | P2 | No — Exploratory |

### Waitlist Slack Alerts — Transfer Flow

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-005 | Waitlist alert fires on transfer unsupported address | 1. Sign in as active user 2. Navigate to transfer flow 3. Enter a new address in an unsupported area | Unsupported page renders. Slack receives message with address components, "via transfer", timestamp | P1 | Partial |
| TC-006 | Transfer alert builds address from components | 1. Enter new address with street, city, state, zip 2. Reach unsupported state | Slack message shows full address string (street, city, state, zip joined) | P2 | No — Exploratory |

### Waitlist Slack Alerts — Join Wait List Form

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-007 | Waitlist signup alert fires on form submission | 1. Navigate to `/join-wait-list` 2. Fill in name, email, zip 3. Submit form | Form submits successfully. Slack receives "New WAIT LIST signup" message with name, email, zip, timestamp | P1 | Partial |
| TC-008 | Signup alert includes email (new field) | 1. Submit join-wait-list form with email filled | Slack message includes the email address (previously was not sent) | P2 | No — Exploratory |

### Waitlist Slack Alerts — Email Ask (Existing Utility)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-009 | Waitlist signup alert fires from email-ask flow | 1. Start move-in 2. Reach existing utility/email ask step 3. Submit email for waitlist signup | Slack receives signup alert with email, address, and utility detail ("Existing Utility [electric] [gas]") | P1 | No — Exploratory |

### Waitlist Alerts — Error Handling

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Alert failure does not crash the app | 1. Simulate `/api/send-alert` failure (e.g., network block) 2. Trigger any waitlist flow | User flow continues normally. No error shown to user. No unhandled rejection in console | P1 | No — Exploratory |
| TC-011 | Alerts are fire-and-forget (non-blocking) | 1. Trigger waitlist flow 2. Observe that page transition happens immediately | Page does not wait for alert response before rendering waitlist page | P2 | No — Exploratory |

### Renewable Energy A/B — Control Variant

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Control variant shows original inline toggle | 1. Set PostHog flag to `control` 2. Navigate to encouraged conversion welcome page (`/move-in?shortCode=pgtest`) 3. Reach welcome page where renewable energy is offered | Original inline toggle with ♻️ icon, monthly price, and "Learn more" modal link. Switch role present | P0 | Exploratory |
| TC-021 | Control toggle on/off works as before | 1. On control variant 2. Toggle switch on 3. Toggle switch off | Switch toggles between checked/unchecked. No visual regression from existing behavior | P1 | Exploratory |

### Renewable Energy A/B — Variant B (Card Selection)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Variant-b shows two selectable cards | 1. Set PostHog flag to `variant-b` 2. Reach encouraged conversion welcome page | Two cards visible: "Clean energy" (sun icon, daily cost, monthly price) and "Standard mix" (moon icon, "$0 (default)"). Radiogroup with `aria-label="Energy preference"` | P0 | Exploratory |
| TC-031 | Variant-b requires explicit selection before submit | 1. On variant-b 2. Do NOT select a card 3. Click submit/continue button | Form submission blocked. Cards wobble (0.5s animation). Red error badge appears: "Select an energy preference to continue" | P0 | Exploratory |
| TC-032 | Variant-b error clears on card selection | 1. Trigger validation error (TC-031) 2. Select either card | Error badge disappears. Wobble stops. Card shows selected state (colored border + background) | P0 | Exploratory |
| TC-033 | Select "Clean energy" card | 1. Click "Clean energy" card | Card gets colored border + tinted background. Radio circle filled with primaryColor. `aria-checked="true"`. Other card shows `aria-checked="false"` | P1 | Exploratory |
| TC-034 | Select "Standard mix" card | 1. Click "Standard mix" card | Card gets selected state. Clean energy card deselected. `hasSelectedRenewableEnergy` set to `false` | P1 | Exploratory |
| TC-035 | Switch selection between cards | 1. Select "Clean energy" 2. Select "Standard mix" 3. Select "Clean energy" again | Selection toggles between cards. Only one selected at a time. No stale error state | P1 | Exploratory |
| TC-036 | Daily cost math is correct | 1. On variant-b, note the monthly fee from SubscriptionConfiguration 2. Check displayed daily cost | Daily cost = `Math.round(monthlyFee / 30)` cents. Monthly shown as `centsToDollars(monthlyFee)/mo` | P1 | Exploratory |
| TC-037 | Keyboard navigation works on cards | 1. Tab to first card 2. Press Enter or Space 3. Tab to second card 4. Press Enter or Space | Cards are selectable via keyboard. `tabIndex={0}` on both. Enter/Space triggers selection | P2 | No |
| TC-038 | Multiple submit attempts without selection increase error count | 1. Click submit 3 times without selecting a card | Wobble animation re-triggers on each submit attempt (errorTriggerCount increments). Error badge stays visible | P2 | Exploratory |
| TC-039 | "Learn more" modal accessible from variant-b | 1. On variant-b 2. Find and click "Learn more" link | RenewableEnergyLearnMoreModal opens (same modal as control variant) | P2 | Exploratory |
| TC-040 | Partner name in card description | 1. Use partner shortcode (e.g., `autotest` → "Moved") 2. Check card description | Text reads "Most Moved residents choose clean energy." (uses partner name) | P2 | Exploratory |
| TC-041 | No partner name fallback | 1. Navigate without shortcode or with no partner name 2. Check card description | Text reads "Most residents choose clean energy." (no partner name) | P2 | Exploratory |

### Renewable Energy A/B — Variant C (Enhanced Toggle)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Variant-c shows enhanced toggle with sun icon and nudge | 1. Set PostHog flag to `variant-c` 2. Reach encouraged conversion welcome page | Enhanced toggle with: sun icon (gray when off), "Power your home with clean energy" heading, daily + monthly cost, "Try it on" bouncing badge, Switch component | P0 | Exploratory |
| TC-051 | Toggle ON triggers confetti and copy change | 1. Toggle switch ON | Confetti burst animation (24 particles, 1.8s). Copy changes to "You're powered by clean energy!". Daily cost text changes to "Active for just X¢/day". Sun icon turns primaryColor. "Try it on" badge disappears. Border/background tinted with primaryColor | P0 | Exploratory |
| TC-052 | Toggle OFF reverts copy (no confetti) | 1. Toggle switch ON 2. Toggle switch OFF | Copy reverts to "Power your home with clean energy". Cost reverts to "Just X¢/day ($/mo)". Sun icon returns to gray. No confetti on toggle off. Border/background revert | P1 | Exploratory |
| TC-053 | "Try it on" badge disappears permanently after first toggle | 1. Observe "Try it on" badge bouncing 2. Toggle ON 3. Toggle OFF | Badge does not reappear after toggle off (showNudge set to false on first interaction) | P1 | Exploratory |
| TC-054 | Confetti only on toggle ON (not repeated toggle off/on) | 1. Toggle ON → confetti 2. Toggle OFF 3. Toggle ON again | Confetti fires again on second toggle ON (showConfetti resets). No confetti on toggle OFF | P2 | Exploratory |
| TC-055 | Responsive copy — mobile vs desktop | 1. On variant-c mobile view 2. Check subtext | Mobile shows "100% renewable." + line break + "Cancel anytime." Desktop shows "100% renewable. No commitment. Cancel anytime." | P2 | Exploratory |

### Partner Theming

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-060 | Partner primaryColor applied to variant-b cards | 1. Use `funnel4324534` shortcode (dark navy) 2. Set flag to `variant-b` 3. Select a card | Selected card border and radio circle use partner's primary color (not default #0370F3 blue) | P1 | Exploratory |
| TC-061 | Partner primaryColor applied to variant-c toggle | 1. Use `venn325435435` shortcode (coral/orange) 2. Set flag to `variant-c` 3. Toggle ON | Sun icon, active cost text, border, background, and "Try it on" badge all use coral/orange color | P1 | Exploratory |
| TC-062 | Default blue when no partner theme | 1. Navigate to encouraged conversion without a partner shortcode 2. Check renewable energy UI | Components use default `#0370F3` blue | P2 | Exploratory |
| TC-063 | themeColor takes precedence over partnerThemeObject | 1. Use shortcode where `themeColor` is set and non-default 2. Check | themeColor used over partnerThemeObject.primaryColor (per code logic) | P3 | Exploratory |

### Feature Flag Fallback

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | Defaults to control on flag loading | 1. Add network throttling 2. Navigate to encouraged conversion before flag resolves | Control variant (inline toggle) renders immediately. No flash of wrong variant | P1 | Exploratory |
| TC-071 | Defaults to control on unexpected flag value | 1. Set PostHog flag to an unexpected value (e.g., `variant-d`) | Control variant renders (allowlist validation rejects unknown values) | P2 | No — requires PostHog admin |
| TC-072 | Defaults to control when flag is disabled/null | 1. Disable PostHog flag entirely | Control variant renders | P2 | No — requires PostHog admin |

### Exposure Tracking — `renewable_energy_offer_exposed`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-080 | Exposure event fires on encouraged conversion | 1. Open DevTools Network tab, filter PostHog 2. Navigate to encouraged conversion welcome page with renewable energy available | One `renewable_energy_offer_exposed` event with properties: `variant` (matching flag), `flow_type: 'encouraged-conversion'`, `monthly_fee_cents`, `is_pre_selected` | P1 | No — Exploratory (DevTools) |
| TC-081 | Exposure event fires on start-service-type | 1. Open DevTools Network tab 2. Navigate to start-service-type page with renewable energy visible | One `renewable_energy_offer_exposed` event with `flow_type: 'start-service-type'` | P1 | No — Exploratory (DevTools) |
| TC-082 | No duplicate exposure event on re-render | 1. Fire exposure event (TC-080) 2. Toggle something on the page to trigger re-render | Only ONE exposure event in network log (useRef prevents duplicates) | P1 | No — Exploratory (DevTools) |
| TC-083 | No exposure event when renewable energy not offered | 1. Set `offerRenewableEnergy: false` on building 2. Navigate to encouraged conversion | No `renewable_energy_offer_exposed` event fires (isExposed is false) | P2 | No — Exploratory |

### Legal Link Click Tracking — `legal_link_clicked`

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-090 | Terms link fires tracking event | 1. Open DevTools Network tab 2. Click "Terms" link anywhere in the app | `legal_link_clicked` PostHog event fires with `link: 'terms'`. Link still opens `/terms-of-service` in new tab | P1 | No — Exploratory (DevTools) |
| TC-091 | Privacy Policy link fires tracking event | 1. Click "Privacy Policy" link | `legal_link_clicked` event with `link: 'privacy_policy'` | P1 | No — Exploratory (DevTools) |
| TC-092 | LPOA link fires tracking event | 1. Click "LPOA" link | `legal_link_clicked` event with `link: 'lpoa'` | P1 | No — Exploratory (DevTools) |
| TC-093 | Legal links still navigate correctly | 1. Click Terms → opens `/terms-of-service` 2. Click Privacy → opens `/privacy-policy` 3. Click LPOA → opens `/lpoa` | All 3 links open correct URLs in new tabs. Adding PostHog tracking doesn't break navigation | P0 | Yes |
| TC-094 | Legal links work when PostHog fails to load | 1. Block PostHog script 2. Click legal links | Links still work as normal `<a>` elements (PostHog call is optional chaining `posthog?.capture`) | P2 | No — Exploratory |

### Copy Updates

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-100 | "Save time" copy on encouraged conversion | 1. Navigate to encouraged conversion welcome page | Text reads "Save time with two-click setup" (NOT "Save hours") | P1 | Yes |
| TC-101 | "Ongoing savings monitoring" copy | 1. On encouraged conversion welcome page | Text reads "Ongoing savings monitoring" (NOT "We monitor your bill for ways to save you money") | P1 | Yes |
| TC-102 | HR divider before renewable energy section | 1. On encouraged conversion welcome page 2. Inspect area above renewable energy UI | Horizontal rule (`<hr>`) separating benefits list from renewable energy section | P2 | Exploratory |
| TC-103 | "I will call and setup myself" button smaller text | 1. On encouraged conversion welcome page 2. Inspect skip button | Button text is `text-sm` and `text-gray-cold-700` (was `text-base`) | P2 | Exploratory |

### Regression — Existing Move-in Flow

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-110 | Standard move-in with renewable toggle still works (control) | 1. Ensure flag returns `control` 2. Run existing `move_in_shortcode.spec.ts` tests | All existing tests pass. `getByRole('switch')` locator still matches the control toggle | P0 | Yes (existing) |
| TC-111 | Encouraged conversion happy path not broken | 1. Navigate to `/move-in?shortCode=pgtest` 2. Complete full encouraged conversion flow | Flow completes end-to-end. Welcome page renders. Form submits. No new blockers introduced | P0 | Exploratory |
| TC-112 | Start-service-type inline upsell still works | 1. Navigate standard move-in to start-service-type step 2. Observe renewable energy inline toggle | Toggle renders (control variant). Exposure tracking added but UI unchanged | P1 | Exploratory |
| TC-113 | Transfer flow completes for supported address | 1. Start transfer with a supported address | Transfer completes normally. Waitlist alert code path not triggered for supported addresses | P1 | Exploratory |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-120 | Building `offerRenewableEnergy` flag controls renewable section visibility | `SELECT "offerRenewableEnergy" FROM "Building" WHERE "shortCode" = 'pgtest'` | When `true`: renewable energy section appears on welcome page. When `false`: section hidden | P1 |
| TC-121 | SubscriptionConfiguration exists for test building | `SELECT * FROM "SubscriptionConfiguration" WHERE "utilityCompanyID" IN (SELECT id FROM "UtilityCompany" WHERE name = 'ComEd')` | Config record exists with `monthlyFee` value. This drives the pricing shown in all 3 variants | P1 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Variant-b card selection | No visual feedback when hovering over cards — both cards look static until clicked | Users may not realize the cards are interactive, especially on desktop | Add hover state (slight border color change or shadow lift) to make cards feel clickable |
| UX-002 | Variant-b validation error | Error badge says "Select an energy preference to continue" but is at the bottom — user may not see it if they're looking at the submit button area | Validation error could be missed on larger screens where cards and button are far apart | Consider scrolling to the error badge or showing the error near the submit button |
| UX-003 | Variant-c "Try it on" badge | Badge bounces indefinitely (`infinite` animation) which could be distracting for users who are reading the page | Perpetual motion can feel anxious/pushy for some users | Consider stopping the bounce after 3-5 cycles, or only bouncing on initial load |
| UX-004 | Variant-c confetti | Confetti fires every time the user toggles ON — if they're toggling back and forth to explore, repeated confetti may feel excessive | Repeated celebration cheapens the moment | Consider firing confetti only on the first toggle-ON (use a ref like the exposure tracking hook) |
| UX-005 | Copy change — "I will call and setup myself" | Button was downgraded from `text-base` to `text-sm text-gray-cold-700` making it visually less prominent | This is the "exit ramp" for users who want to self-manage — making it harder to find could trap users who genuinely prefer self-setup | Monitor whether this reduces self-setup rate vs. just making the button harder to find |

> These are not test failures — the feature works as specified. These are opportunities to improve the user experience identified during test planning. File actionable ones as improvement tickets via `/log-bug`.

## Automation Plan

### Automatable Now
- **TC-093** (legal links navigate correctly) — straightforward locator + URL assertions
- **TC-100, TC-101** (copy updates) — text assertions on encouraged conversion page
- **TC-110** (existing move-in regression) — already automated in `move_in_shortcode.spec.ts`

### Automatable with Feature Flag Mocking
If PostHog feature flag responses are intercepted via `page.route()` to force a specific variant:
- **TC-030–TC-041** (variant-b card selection) — card visibility, validation, selection state
- **TC-050–TC-055** (variant-c enhanced toggle) — toggle behavior, copy changes
- **TC-060–TC-063** (partner theming) — color assertions on styled elements

This would require a new test utility to mock PostHog `decide` API responses.

### Exploratory Only
- **TC-001–TC-011** (waitlist Slack alerts) — Slack message verification is manual
- **TC-070–TC-072** (flag fallback) — requires PostHog admin manipulation
- **TC-080–TC-083** (exposure tracking) — DevTools network inspection
- **TC-090–TC-092** (legal link tracking) — DevTools network inspection
- **TC-094** (PostHog failure resilience) — requires blocking PostHog script

### Smoke Suite
- TC-093 (legal links), TC-100 (copy update), TC-110 (existing regression)

### Regression Scope
- TC-093, TC-100, TC-101, TC-110, TC-111, TC-112, TC-113

## Risks & Notes

1. **PostHog feature flag not testable in e2e without mocking** — All A/B variant tests are exploratory because we can't control which variant a test user gets. To automate, we'd need to intercept PostHog's `/decide` API via `page.route()` and return a forced variant. This is a reusable pattern worth building if more A/B experiments are planned.

2. **Existing POM locator fragility** — `Move_In_Renewable_Energy_Switch` uses `getByRole('switch')`. This works for control and variant-c (both have a Switch component) but NOT for variant-b (card selection has no switch — uses `role="radiogroup"` instead). If variant-b becomes the winner and is rolled out to all users, existing tests will break. Plan locator updates if that happens.

3. **Waitlist alert verification is Slack-dependent** — The only way to verify alert content is by watching `#wait-list` Slack channel during exploratory testing. The code is fire-and-forget with try/catch, so failures are silently swallowed. Consider adding logging for failed alerts in production.

4. **`'use client'` added to legal-links.tsx** — This adds a client-side boundary to a component that was previously server-renderable. All consumers are already client components (per PR description), but worth confirming no SSR regression.

5. **Confetti and animations** — CSS animations (`wobble`, `confetti-fall`, `nudge-bounce`) are difficult to assert in e2e tests. Visual verification is best done during exploratory testing.

6. **`separate_screen` variant removed** — The old `RenewableEnergyVariant` type included `'separate_screen'` which is now replaced by `'variant-b' | 'variant-c'`. If any code in the codebase still references `separate_screen`, it will get `control` fallback (safe but unintended).

## Test Data Requirements

| Data | Value | Purpose |
|------|-------|---------|
| Encouraged conversion shortcode | `pgtest` | `useEncourageConversion = TRUE`, renewable energy available |
| Partner shortcodes (theming) | `autotest` (Moved/blue), `funnel4324534` (navy), `venn325435435` (coral) | Verify primaryColor propagation |
| Unsupported address (waitlist) | Address with no matching utility | Triggers waitlist state in move-in/transfer |
| PostHog flag | `move_in_renewable_energy_upsell` | Must have `control`, `variant-b`, `variant-c` configured |
| Active user for transfer | Existing user with `ACTIVE` ElectricAccount | Transfer flow prerequisite |
| Join wait-list URL | `/join-wait-list` | Direct entry for waitlist form testing |
