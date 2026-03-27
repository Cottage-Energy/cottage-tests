# Test Plan: Bill Usage Charts (Electricity & Gas) for Overview Page

## Overview
**Ticket**: ENG-2446
**Source**: [Linear](https://linear.app/public-grid/issue/ENG-2446), PR cottage-nextjs #1134 (merged 2026-03-25), [Figma](https://www.figma.com/design/FHkq7ic3lTmqevxGyHR7uC/PG-App?node-id=4260-17647&m=dev) (blocked — Starter plan)
**Date**: 2026-03-25
**Tester**: Christian

## Summary
PR #1134 adds Recharts bar charts to the recent bill cards on the overview page. Shows up to 6 bars of historical billing data for both electricity and gas. Chart only renders when 2+ processed/viewable bills exist. Includes custom SVG bars (striped default, gradient on hover), tooltip with cost + usage + date range, and responsive mobile layout. Cost includes `calculateTotalPaddedAdjustments()`.

## Scope

### In Scope
- Chart rendering conditions (0, 1, 2, 3–5, 6, >6 bills)
- Chart data accuracy (cost, usage, date labels, tooltips)
- Hover/tap interactions and tooltip positioning
- Both electricity and gas charts
- Dual-utility accounts (both charts visible)
- Mobile viewport rendering
- Bar styling (striped default, gradient on hover)
- Integration with existing bill card content (no regression)

### Out of Scope
- Insights page (future work, not part of this PR)
- Bill ingestion pipeline (bills already exist)
- Sidebar functionality (already shipped separately)
- Seven-day usage chart (existing, untouched)
- Recharts library internals

### Prerequisites
- Test users with varying bill counts in dev environment (see Test Data section)
- Access to dev overview page (`https://dev.publicgrid.energy/app/overview`)
- Bills must have `ingestionState` = `processed` or `viewable`
- `ElectricAccount.status` = `ACTIVE`

## Test Data

| Scenario | User Email | Electric Bills | Gas Bills | Use For |
|----------|-----------|----------------|-----------|---------|
| Dual utility (>6 each) | `pgtest+jose_grady52@joinpublicgrid.com` | 40 | 30 | TC-001, TC-002, TC-008, TC-013, TC-014, TC-030 |
| >6 bills both types | `pgtest+danielle.kutch@joinpublicgrid.com` | 8 | 7 | TC-005, TC-006, TC-015 |
| Exactly 6 electric | `pgtest+flex-sc1@joinpublicgrid.com` | 6 | — | TC-004 |
| Only 1 electric (no chart) | `pgtest+abraham.thielk5tczw3p95@joinpublicgrid.com` | 1 | — | TC-007, TC-020 |
| Gas-only many bills | `pgtest+elton.leannon@joinpublicgrid.com` | — | 50 | TC-003 |
| Both with exactly 1 each | `pgtest+agnes.schuppe40@joinpublicgrid.com` | 1 | 1 | TC-021 |
| Electric-only many | `pgtest+josh_beatty9@joinpublicgrid.com` | 201 | — | TC-006 extreme |

## Test Cases

### Happy Path — Chart Rendering

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Electric chart renders with 2+ bills | User with 2+ electric bills, active account | 1. Sign in as test user 2. Navigate to overview 3. Locate Electricity card | Bar chart is visible below the bill amount/usage section within the Electricity card | P0 | Yes |
| TC-002 | Gas chart renders with 2+ bills | User with 2+ gas bills, active account | 1. Sign in as test user 2. Navigate to overview 3. Locate Gas card | Bar chart is visible below the bill amount/usage section within the Gas card | P0 | Yes |
| TC-003 | Gas-only account shows gas chart | User with gas bills only | 1. Sign in as gas-only user 2. Navigate to overview | Gas card shows chart; Electricity card absent or has no chart | P1 | Yes |
| TC-004 | Chart renders with exactly 6 bills (max bars) | User with exactly 6 electric bills | 1. Sign in 2. Navigate to overview 3. Count bars in electric chart | Exactly 6 bars displayed | P1 | Yes |
| TC-005 | Chart shows max 6 bars when >6 bills exist | User with >6 electric bills | 1. Sign in 2. Navigate to overview 3. Count bars | Only 6 bars displayed (last 6 bills by date ascending) | P1 | Yes |
| TC-006 | Chart renders with 2-5 bills (bars expand to fill) | User with 2-5 bills | 1. Sign in 2. Navigate to overview 3. Observe bar widths | Bars expand to fill container width with 8px gaps between them | P2 | No |

### Happy Path — Chart Data Accuracy

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-008 | X-axis shows "MMM D" format from endDate | User with 2+ bills | 1. Sign in 2. Navigate to overview 3. Read X-axis labels | Labels show month abbreviation + day (e.g., "Jan 15", "Feb 12") matching bill endDates | P0 | Yes |
| TC-009 | Dollar labels appear above each bar | User with 2+ bills | 1. Sign in 2. Navigate to overview 3. Observe text above bars | Each bar shows "$X" rounded to nearest dollar above it | P1 | Yes |
| TC-010 | Cost values match DB (totalAmountDue + adjustments) | User with known bill amounts | 1. Query DB for bill amounts + adjustments 2. Sign in 3. Compare chart values | Chart dollar values = `centsToDollars(totalAmountDue + totalPaddedAdjustments)` | P0 | Yes |
| TC-011 | Bills sorted ascending by date (oldest left, newest right) | User with 3+ bills | 1. Sign in 2. Read X-axis labels left to right | Dates increase from left to right | P1 | Yes |

### Happy Path — Tooltip Interaction

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-013 | Hover on bar shows tooltip with cost, usage, date range | User with 2+ electric bills | 1. Sign in 2. Hover over a bar in electric chart | Tooltip appears above bar showing: cost (formatted, e.g., "$123.45"), usage with unit ("X kWh"), date range ("MMM D - MMM D") | P0 | Yes |
| TC-014 | Hover on gas bar shows tooltip with therms | User with 2+ gas bills | 1. Sign in 2. Hover over a bar in gas chart | Tooltip shows usage with "therms" unit (not kWh) | P0 | Yes |
| TC-015 | Dollar label hides on hover, reappears on leave | User with 2+ bills | 1. Sign in 2. Note dollar label above bar 3. Hover bar 4. Move mouse away | Dollar label hidden while hovered, visible again after mouse leaves | P1 | Yes |
| TC-016 | Tooltip positioned centered above bar with arrow caret | User with 2+ bills | 1. Sign in 2. Hover over a bar | Tooltip centered horizontally above bar, downward arrow caret points to bar | P1 | No |
| TC-017 | Click/tap toggles tooltip on mobile | User with 2+ bills, mobile viewport | 1. Open in mobile viewport 2. Tap a bar 3. Tap same bar again | First tap shows tooltip, second tap hides it | P1 | No |
| TC-018 | Hover different bar moves tooltip | User with 3+ bills | 1. Hover bar 1 2. Move to bar 2 | Tooltip moves from bar 1 to bar 2, showing bar 2's data | P1 | No |

### Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | Chart NOT rendered with only 1 bill | User with exactly 1 bill | 1. Sign in 2. Navigate to overview | Bill card shows recent bill info (usage, amount, dates) but NO chart section | P0 | Yes |
| TC-021 | Chart NOT rendered with 0 processed bills | User with no processed/viewable bills | 1. Sign in as user with 0 bills or all bills in non-processed state 2. Navigate to overview | No chart rendered; "NoBillContent" shown instead | P0 | Yes |
| TC-022 | Tooltip on first (leftmost) bar doesn't clip left edge | User with 2+ bills | 1. Hover over the leftmost bar | Tooltip visible and readable, not clipped by container edge | P2 | No |
| TC-023 | Tooltip on last (rightmost) bar doesn't clip right edge | User with 2+ bills | 1. Hover over the rightmost bar | Tooltip visible and readable, not clipped by container edge | P2 | No |
| TC-024 | Chart handles bills with $0 amount | User has a bill with totalAmountDue = 0 | 1. Sign in 2. Observe chart | Bar height is 0 (or minimal), "$0" label shown, tooltip shows "$0.00" | P2 | No |
| TC-025 | Chart handles large disparity in amounts | User has bills: one $10, one $500 | 1. Sign in 2. Observe chart | Small bill has proportionally shorter bar; both bars visible | P2 | No |
| TC-026 | Chart with exactly 2 bills (minimum to render) | User with exactly 2 bills | 1. Sign in 2. Navigate to overview | Chart renders with 2 wide bars filling the container | P1 | Yes |

### Mobile & Responsive

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-027 | Chart renders correctly on mobile viewport | User with 6 bills | 1. Open overview in mobile viewport (375px) 2. Scroll to bill card | Chart fits within card, all 6 bars visible, X-axis labels readable | P1 | Yes |
| TC-028 | Chart renders on tablet viewport | User with 6 bills | 1. Open overview in tablet viewport (768px) | Chart renders proportionally, bars fill available width | P2 | No |
| TC-029 | Tooltip readable on mobile (no overflow) | User with 2+ bills | 1. Mobile viewport 2. Tap a bar | Tooltip fully visible within screen bounds, text not truncated | P1 | No |

### Regression — Existing Bill Card Content

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | Recent bill info still displays correctly above chart | User with 2+ bills | 1. Sign in 2. Navigate to overview 3. Check bill card content | "Recent bill" label, date range, Usage value + unit, Bill Amount value all visible and correct — chart appears BELOW these | P0 | Yes |
| TC-031 | Bill card with 1 bill shows info without chart | User with 1 bill | 1. Sign in 2. Navigate to overview | Recent bill info (dates, usage, amount) displays normally; no chart section | P1 | Yes |
| TC-032 | Outstanding balance unaffected | User with bills and outstanding balance | 1. Sign in 2. Check balance card | Outstanding balance displays correctly, not impacted by chart changes | P1 | Yes |
| TC-033 | Pay bill button still functional | User with outstanding balance | 1. Sign in 2. Click "Pay bill" | Payment flow launches correctly | P1 | No |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-040 | Chart shows only processed/viewable bills | Query `ElectricBill` for user, compare `ingestionState` values | Bills with states other than `processed`/`viewable` excluded from chart | P1 |
| TC-041 | Chart uses last 6 bills by date ascending | Query bills sorted by `endDate` ASC, take last 6 | Chart X-axis labels match the last 6 `endDate` values | P1 |
| TC-042 | Cost includes adjustments | Query `BillAdjustment` for bills with adjustments | Tooltip cost = `centsToDollars(totalAmountDue + SUM(adjustments where visible=true))` | P1 |
| TC-043 | Usage values match DB totalUsage | Query `ElectricBill.totalUsage` or `GasBill.totalUsage` | Tooltip usage matches DB `totalUsage` field | P1 |

### Visual / Styling (Exploratory)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | Non-hovered bars show diagonal stripe pattern | 1. Sign in 2. Observe bars in default state | Bars show purple-50 (#F6F0F8) background with purple-100 (#EEE2F3) diagonal stripes at ~70 degrees | P2 | No |
| TC-051 | Hovered bar shows gradient fill | 1. Hover over a bar | Bar changes to 45-degree gradient from purple-700 (#472455) to purple-500 (#9854B4) | P2 | No |
| TC-052 | Bars have 12px border radius | 1. Observe bar corners | All bars have rounded corners (12px radius on all corners) | P2 | No |
| TC-053 | Tooltip styling matches spec | 1. Hover over a bar | Purple-700 background, white semibold cost text, #E6E4E7 for usage and date range, rounded corners, shadow, arrow caret | P2 | No |
| TC-054 | No visual gap/overlap between bill info and chart | 1. Observe spacing between bill amount and chart | Clean visual separation — the `-mt-5` hack should not cause visible overlap or excessive gap | P2 | No |

## Automation Plan

### Smoke (P0 — 7 cases)
- TC-001: Electric chart renders with 2+ bills
- TC-002: Gas chart renders with 2+ bills
- TC-008: X-axis date format correct
- TC-010: Cost values match DB
- TC-013: Hover tooltip shows cost + usage + date range (electric/kWh)
- TC-014: Hover tooltip shows therms for gas
- TC-020: Chart NOT rendered with 1 bill
- TC-030: Existing bill card content unaffected

### Regression (P1 — 10 cases)
- TC-003, TC-004, TC-005, TC-009, TC-011, TC-015, TC-026, TC-027, TC-031, TC-032

### Exploratory Only (P2 — 12 cases)
- TC-006, TC-016, TC-017, TC-018, TC-022, TC-023, TC-024, TC-025, TC-028, TC-029, TC-050–TC-054

### DB Verification (integrated into automated tests)
- TC-040, TC-041, TC-042, TC-043

## Risks & Notes

1. **Figma blocked** (Starter plan) — cannot compare implementation against design spec directly. Visual verification will be done via Playwright screenshots against Butch's implementation notes.
2. **`-mt-5` spacing hack** — Butch flagged this as needing cleanup. May cause visual issues at different viewports or if bill card content changes height. Watch for overlap.
3. **Tooltip edge positioning** — Custom tooltip uses `transform: translate(-50%, -100%)` which could clip on first/last bars if container has `overflow: hidden`.
4. **Performance** — 201 bills for one test user. The transformer slices to 6, but the `useTransformedBills()` hook fetches all. Monitor load time.
5. **Adjustments** — `calculateTotalPaddedAdjustments()` adds to totalAmountDue. If adjustments exist, chart cost won't match raw `totalAmountDue` from DB — need to include `BillAdjustment` in DB verification.
6. **No test-id attributes** — Chart uses custom SVG elements without data-testid. Automation will need to rely on SVG selectors or container-based assertions.
7. **Mobile tap interaction** — `onClick` handler toggles tooltip. Need to verify this works on actual mobile touch events, not just desktop click simulation.
