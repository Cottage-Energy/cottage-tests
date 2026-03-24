# Test Plan: ENG-2455 — Transfer Flow UI Improvements

## Overview
**Ticket**: [ENG-2455](https://linear.app/public-grid/issue/ENG-2455/task-transfer-flow-ui-improvements)
**PR**: [cottage-nextjs #1128](https://github.com/Cottage-Energy/cottage-nextjs/pull/1128) (merged 2026-03-23)
**Figma**: [PG-App node 4689:18530](https://www.figma.com/design/FHkq7ic3lTmqevxGyHR7uC/PG-App?node-id=4689-18530)
**Date**: 2026-03-24
**Tester**: Christian

## Scope

### In Scope
- Exit button persistence, positioning, and navigation across all transfer steps
- Help link ("Help?" / "Need help?") repositioning and responsive variants
- Welcome screen "I agree" label clickability and link propagation behavior
- "Don't need service" card mobile/desktop layout (new-service-question form)
- Move-out form spacing between move-out date and "Your final bill" card
- Desktop padding/spacing on form body container
- Success/done screen — no header bar elements
- Responsive behavior (mobile vs desktop) for all changes

### Out of Scope
- Transfer flow business logic (RPC, DB writes, OTP) — covered in existing plan (ENG-2280)
- Transfer stepper progress logic (unchanged)
- OpenChat/Intercom functionality (only positioning changed)
- Non-transfer flows (move-in, connect, bill-upload)

### Prerequisites
- Active user with eligible property for transfer (or start fresh from `/transfer`)
- Access to dev environment (`https://dev.publicgrid.energy/transfer`)
- Desktop and mobile viewports for responsive checks
- Transfer flow must reach each step (welcome → move-out → new service question → new address → about you → identity → success)

### Dependencies
- PR #1128 merged and deployed to dev
- No feature flags involved — changes are unconditional

## Transfer Flow Steps Reference

| Step | Component | topLevel state |
|------|-----------|---------------|
| Welcome | `welcome.tsx` | `welcome` |
| Move-out Details | `move-out.tsx` | `moveOutDetails` |
| New Service Question | `new-service-question.tsx` | `newServiceQuestion` |
| New Address | `new-address.tsx` | (varies) |
| About You | `about-you.tsx` | (varies) |
| Identity Verification | `identity-verification.tsx` | (varies) |
| Success | `success.tsx` | `done` |

---

## Test Cases

### 1. Exit Button — Persistence & Visibility

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Exit button visible on Welcome screen | 1. Navigate to `/transfer` 2. Observe top-left area | "Exit Flow" text button visible, styled `self-start md:absolute md:top-8 md:left-8` | P0 | Yes |
| TC-002 | Exit button visible on Move-out Details (desktop) | 1. Complete Welcome 2. Reach Move-out step on desktop viewport | "Exit Flow" text button visible, absolutely positioned above stepper (`md:absolute md:top-4 md:left-8`) | P0 | Yes |
| TC-003 | Exit button visible on Move-out Details (mobile) | 1. Complete Welcome 2. Reach Move-out step on mobile viewport | X icon button visible in header row (left position) | P0 | Yes |
| TC-004 | Exit button visible on New Service Question (desktop) | 1. Reach New Service Question on desktop | "Exit Flow" text button visible above stepper | P1 | Yes |
| TC-005 | Exit button visible on New Service Question (mobile) | 1. Reach New Service Question on mobile | X icon button in header row | P1 | Yes |
| TC-006 | Exit button visible on New Address (desktop) | 1. Reach New Address on desktop | "Exit Flow" text button visible above stepper | P1 | Yes |
| TC-007 | Exit button visible on New Address (mobile) | 1. Reach New Address on mobile | X icon button in header row | P1 | Yes |
| TC-008 | Exit button visible on About You (desktop) | 1. Reach About You on desktop | "Exit Flow" text button visible above stepper | P1 | Yes |
| TC-009 | Exit button visible on About You (mobile) | 1. Reach About You on mobile | X icon button in header row | P1 | Yes |
| TC-010 | Exit button visible on Identity Verification (desktop) | 1. Reach Identity Verification on desktop | "Exit Flow" text button visible above stepper | P1 | Yes |
| TC-011 | Exit button visible on Identity Verification (mobile) | 1. Reach Identity Verification on mobile | X icon button in header row | P1 | Yes |
| TC-012 | Exit button hidden on Success/Done | 1. Complete full transfer flow 2. Reach success screen | No exit button, no header bar visible | P0 | Yes |

### 2. Exit Button — Navigation

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-013 | Exit from Welcome navigates to /app/overview | 1. On Welcome screen 2. Click "Exit Flow" | Navigates to `/app/overview` (or auth redirect if not logged in) | P0 | Yes |
| TC-014 | Exit from Move-out Details navigates to /app/overview | 1. On Move-out step 2. Click exit (text or X icon) | Navigates to `/app/overview` | P0 | Yes |
| TC-015 | Exit from New Service Question navigates to /app/overview | 1. On New Service Question 2. Click exit | Navigates to `/app/overview` | P1 | Yes |
| TC-016 | Exit from mid-flow step navigates to /app/overview | 1. On any later step (About You, Identity) 2. Click exit | Navigates to `/app/overview` | P1 | Yes |

### 3. Help Link — Positioning & Responsive Text

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-017 | Help link shows "Help?" on mobile (non-welcome steps) | 1. On mobile viewport 2. Navigate past Welcome to any step | "Help?" text visible in header row, right side | P1 | Yes |
| TC-018 | Help link shows "Need help?" on desktop (non-welcome steps) | 1. On desktop viewport 2. Navigate past Welcome to any step | "Need help?" text visible in stepper row, right side | P1 | Yes |
| TC-019 | Mobile header row layout: [X] [Stepper] [Help?] | 1. Mobile viewport 2. On any non-welcome, non-success step | Left: X icon, Center: stepper, Right: "Help?" — single row, no wrapping | P1 | Yes |
| TC-020 | Desktop header layout: Exit above, stepper + help in row | 1. Desktop viewport 2. On any non-welcome, non-success step | "Exit Flow" positioned above stepper row; stepper and "Need help?" in same row | P1 | Yes |
| TC-021 | Help link hidden on Welcome screen | 1. Navigate to `/transfer` Welcome | No "Help?" or "Need help?" visible (help is only in non-welcome steps) | P2 | Yes |
| TC-022 | Help link hidden on Success/Done | 1. Complete flow, reach success | No help link visible | P1 | Yes |
| TC-023 | Help link opens chat/support | 1. On any step with help visible 2. Click "Help?" or "Need help?" | Opens Intercom/chat widget | P2 | No |

### 4. Welcome Screen — "I agree" Label & Links

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-024 | Clicking "I agree" text toggles checkbox | 1. On Welcome screen 2. Click the "I agree to the..." text (not on checkbox directly) | Checkbox toggles on; clicking again toggles off | P0 | Yes |
| TC-025 | Clicking Terms link opens Terms page without toggling | 1. On Welcome screen 2. Click "Terms" link within the label text | Terms of service opens in new tab; checkbox state does NOT change | P0 | Yes |
| TC-026 | Clicking Privacy Policy link opens without toggling | 1. On Welcome screen 2. Click "Privacy Policy" link within the label text | Privacy policy opens in new tab; checkbox state does NOT change | P0 | Yes |
| TC-027 | Clicking checkbox directly still works | 1. On Welcome screen 2. Click the checkbox element directly | Checkbox toggles normally | P1 | Yes |
| TC-028 | Label has cursor-pointer styling | 1. On Welcome screen 2. Hover over "I agree" text | Cursor changes to pointer (indicating clickability) | P2 | No |
| TC-029 | Rapid toggle via text clicks | 1. Click "I agree" text rapidly 3-4 times | Checkbox toggles correctly each time, no stuck state | P2 | Yes |

### 5. New Service Question — "Don't Need Service" Card Layout

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Mobile: card stacks vertically and centers | 1. Mobile viewport 2. On New Service Question step 3. Select "Moving out" to reveal the card | "Don't need service at your new place?" text and button stacked vertically, centered (`flex-col items-center gap-3`) | P1 | Yes |
| TC-031 | Desktop: card is horizontal | 1. Desktop viewport 2. On New Service Question step 3. Select "Moving out" | Text and button in horizontal row (`md:flex-row md:justify-between`) | P1 | Yes |
| TC-032 | Form card gap is reduced | 1. On New Service Question step 2. Inspect card spacing | Inner gap is `gap-6` (24px) not `gap-7` (28px) | P2 | No |

### 6. Move-out Form — "Your Final Bill" Spacing

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-033 | Gap between move-out date and "Your final bill" card | 1. On Move-out Details step 2. Select a move-out date 3. Observe spacing below date picker | 12px gap (`gap-3`) between the move-out date section and "Your final bill" orange card | P1 | No |
| TC-034 | "Your final bill" card content unchanged | 1. On Move-out Details step 2. Read the card text | Card shows "Your final bill" heading and "final bill will arrive in about 30–45 days" message with warning icon | P2 | Yes |

### 7. Desktop Padding & Spacing

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-035 | Form body has consistent top padding | 1. Desktop viewport 2. On any step 3. Check form body spacing | Form body container has `pt-8` padding-top on both mobile and desktop | P2 | No |
| TC-036 | Welcome screen spacing is consistent | 1. Compare Welcome screen desktop vs mobile | Consistent padding, no cramped or oversized gaps | P2 | No |

### 8. Success/Done Screen — No Header

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-037 | No exit button on success | 1. Complete transfer flow 2. Reach success/done screen | No "Exit Flow" button, no X icon | P0 | Yes |
| TC-038 | No stepper on success | 1. On success screen | No stepper/progress bar visible | P1 | Yes |
| TC-039 | No help link on success | 1. On success screen | No "Help?" or "Need help?" link visible | P1 | Yes |

### 9. Cross-Browser & Responsive Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | Mobile breakpoint transition for exit button | 1. Start at desktop width 2. Resize below `md` breakpoint | "Exit Flow" text hides, X icon appears in header row | P2 | No |
| TC-041 | Mobile breakpoint transition for help text | 1. Start at desktop width 2. Resize below `md` breakpoint | "Need help?" hides, "Help?" appears | P2 | No |
| TC-042 | Safari desktop — exit button positioning | 1. Safari desktop 2. Navigate through transfer steps | "Exit Flow" absolutely positioned correctly, no overlap with stepper | P2 | Yes |
| TC-043 | Mobile Safari — header row layout | 1. Mobile Safari viewport 2. Non-welcome steps | [X] [Stepper] [Help?] layout intact, no overflow | P2 | Yes |
| TC-044 | Small mobile viewport (320px) — no overflow | 1. Set viewport to 320px width 2. On any non-welcome step | Header row [X] [Stepper] [Help?] fits without wrapping or clipping | P2 | No |

---

## Automation Plan

### Smoke (P0 — 7 cases)
TC-001, TC-002, TC-003, TC-012, TC-013, TC-024, TC-037

### Regression (P1 — 21 cases)
TC-004 through TC-011, TC-014 through TC-022, TC-025 through TC-027, TC-031, TC-034, TC-038, TC-039

### Exploratory Only (6 cases)
TC-023 (chat widget), TC-028 (cursor styling), TC-032 (CSS gap inspection), TC-033 (12px gap visual), TC-035–TC-036 (padding inspection), TC-040–TC-041 (resize transitions), TC-044 (320px viewport)

### Automation Notes
- **No transfer POM exists** — `/new-test` will need to scaffold a `TransferPage` POM with locators for exit button, help link, stepper, checkbox, label, and "Don't need service" card
- Desktop vs mobile tests: use Playwright `projects` (Chromium for desktop, Mobile Chrome/Safari for mobile)
- Exit navigation tests require a logged-in user fixture or handling the auth redirect
- Welcome screen label tests (TC-024–TC-029) can be tested without completing the full flow
- Consider splitting into 2 spec files: `transfer_ui_header.spec.ts` (exit + help + success) and `transfer_ui_forms.spec.ts` (welcome label + service card + move-out spacing)

## Risks & Notes
- **Figma access failed** — could not fetch design context; test cases are based entirely on the PR diff and ticket description. Visual pixel-perfect comparison may need manual spot-check against Figma.
- **No existing transfer automation** — move_out.spec.ts is empty, no POM. Full scaffolding needed.
- **Transfer flow requires eligible user** — need test data setup (active user with property eligible for transfer)
- **"Don't need service" card** only appears when user selects the move-out option on the New Service Question step — test must navigate to that state first
- **`stopPropagation` on links** — if any parent handler changes, links could start toggling the checkbox again. Worth regression testing.
