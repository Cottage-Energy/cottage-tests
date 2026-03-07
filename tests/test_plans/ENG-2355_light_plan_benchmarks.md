# Test Plan: Light Plan Comparison Benchmarks (A/B Test)

## Overview
**Ticket**: [ENG-2355](https://linear.app/public-grid/issue/ENG-2355/task-light-plan-benchmarks)
**PR**: [cottage-nextjs#1038](https://github.com/Cottage-Energy/cottage-nextjs/pull/1038) (MERGED)
**Date**: 2026-03-03
**Tester**: Christian

## Scope

### In Scope
- Light encouraged conversion flow — Plan/LOA step (overview page)
- A/B test behavior: control vs. test variant via PostHog `light-plan-comparison-benchmarks`
- Price comparison card rendering, content, and calculations modal
- Copy changes across encouraged flow steps (address, personal info, payment)
- Graceful degradation (API failure, PostHog blocked, insufficient savings)
- Mobile responsiveness of comparison card and modal

### Out of Scope
- PostHog experiment creation/configuration (infra task)
- Light.dev API correctness (third-party)
- Standard (non-encouraged) Light flows
- Full move-in completion (focus is on the new UI elements)

### Prerequisites
- PostHog experiment `light-plan-comparison-benchmarks` with `control` and `test` variants
- `LIGHT_API_KEY` and `LIGHT_BASE_URL` env vars set
- Use **Texas zip codes**: 75201 (Dallas), 77001 (Houston), or 78701 (Austin)
- Ability to override PostHog variant per user (PostHog feature flag override)

## Test Cases

### Happy Path

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Test variant — comparison card renders | PostHog variant = `test`, TX zip | 1. Navigate to Light encouraged flow 2. Reach Plan/LOA step | "What you'd pay" card appears above "Public Grid will:" with two columns, savings banner, and social proof badge | P0 | Yes |
| TC-002 | Test variant — card content is correct | PostHog variant = `test`, TX zip | 1. Reach Plan/LOA step 2. Inspect card content | "With Public Grid" column shows dollar amount + term. "Avg. in your area" column shows dollar amount + term. Green savings banner shows "Save ~$X/mo" | P0 | Yes |
| TC-003 | Test variant — calculations modal | PostHog variant = `test`, TX zip | 1. Reach Plan/LOA step 2. Click "Show calculations" | Modal opens with energy, delivery, base charge, plan fee rows for both PG and market. Savings line matches banner. Footnote mentions 850 kWh and TDU name | P1 | Yes |
| TC-004 | Test variant — updated copy | PostHog variant = `test` | 1. Walk through address, personal info, payment steps | Address: "Confirm your address" / "Let us handle your electricity". Overview heading: "Public Grid will:". Checklist: "Secure service...", "Ensure no lapse...", "Monitor your plan..." | P1 | Yes |
| TC-005 | Control variant — no card shown | PostHog variant = `control` | 1. Navigate to Light encouraged flow 2. Reach Plan/LOA step | No comparison card. Subtitle: "Your building has partnered with Public Grid...". Heading: "What's included". Original 3 checklist items | P0 | Yes |
| TC-006 | Control variant — original copy preserved | PostHog variant = `control` | 1. Walk through address, personal info, payment steps | Original copy on all steps (no updated text) | P1 | Yes |

### Edge Cases

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | Savings <= $5 — card hidden | `test` variant, area where PG and market are similar | 1. Reach Plan/LOA step with zip that yields < $5 savings | Card not shown, page falls back to control layout | P2 | Exploratory |
| TC-011 | Non-TX zip code | `test` variant, non-TX zip | 1. Enter non-TX address 2. Reach Plan/LOA step | Light.dev API returns no data, card not shown, no errors | P2 | Exploratory |
| TC-012 | Calculations modal close | `test` variant | 1. Open calculations modal 2. Close it (X button, outside click, Esc) | Modal closes cleanly, card still visible | P2 | Yes |

### Negative Tests

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-020 | API failure — graceful degradation | `test` variant, API unreachable/broken | 1. Break or block `/api/light/benchmarks` 2. Reach Plan/LOA step | No card rendered, control layout shown, `lightBenchmarksError` event fires, no JS console errors, rest of flow works | P1 | Exploratory |
| TC-021 | PostHog blocked — defaults to control | `test` variant, block PostHog SDK | 1. Block PostHog 2. Navigate to flow | `useFeatureFlagVariantKey` returns undefined, defaults to control, no card, no API call, no errors | P1 | Exploratory |
| TC-022 | API timeout (> 3s) | `test` variant, simulate slow API | 1. Throttle `/api/light/benchmarks` to > 3s 2. Reach Plan/LOA step | Request times out, no card shown, error event fires | P2 | Exploratory |

### Mobile Responsiveness

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | Comparison card on mobile | `test` variant, mobile viewport | 1. Open flow on mobile 2. Reach Plan/LOA step | "What you'd pay" and badge stack vertically. Two-column grid adjusts. SVG icons stay 20x20 | P2 | Yes |
| TC-031 | Calculations modal on mobile | `test` variant, mobile viewport | 1. Open calculations modal on mobile | Modal opens full-screen, content is scrollable, all rows visible | P2 | Yes |

### PostHog Events Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | lightBenchmarksDisplayed fires | `test` variant, valid data | 1. Card renders successfully | Event fires with: `variant`, `pgMonthlyEstimate`, `marketMonthlyEstimate`, `monthlySavings`, `usageKwh` | P1 | Exploratory |
| TC-041 | lightBenchmarksError fires on failure | `test` variant, API broken | 1. Card fails to render | Event fires with: `variant`, `reason` | P2 | Exploratory |
| TC-042 | No events in control | `control` variant | 1. Reach Plan/LOA step | No `lightBenchmarksDisplayed` or `lightBenchmarksError` events | P2 | Exploratory |

## Automation Plan

| Suite | Test Cases | Notes |
|-------|-----------|-------|
| **Regression** | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-012, TC-030, TC-031 | Core A/B test behavior — automate in `tests/e2e_tests/light-user-move-in/encourage-conversion-light-flows/` |
| **Exploratory only** | TC-010, TC-011, TC-020, TC-021, TC-022, TC-040, TC-041, TC-042 | Require PostHog overrides, API manipulation, or DevTools inspection — manual/exploratory |

### New artifacts needed
- **Page objects**: Light encouraged overview page, comparison card component, calculations modal
- **Test data**: TX zip codes, PostHog variant override mechanism
- **Spec files**: Use existing placeholder files in `encourage-conversion-light-flows/`

## Risks & Notes
- PostHog variant override mechanism needs to be established — how do we force control/test in e2e tests?
- Light.dev API availability in test environment — may need to mock or ensure staging access
- The `circle-check` SVG fix (`fill-rule` → `fillRule`) is a shared component in `packages/assets` — low risk but worth a visual check on other pages that use it
- Existing Light move-in test files are empty placeholders — this is greenfield coverage
