# Test Plan: BUG — Demand Response Terms Visibility

## Overview
**Ticket**: [ENG-2589](https://linear.app/public-grid/issue/ENG-2589/bug-demand-response-terms)
**PR**: [cottage-nextjs#1155](https://github.com/Cottage-Energy/cottage-nextjs/pull/1155) (MERGED)
**Date**: 2026-03-31
**Tester**: Christian

## Bug Summary
The demand response authorization text ("I authorize Public Grid to share my utility data with Logical Buildings for enrollment in GridRewards…") and the "(see terms)" link were rendering on the encouraged conversion welcome page for buildings where `demandResponseProviderID` is null — even though `shouldShowDemandResponse` was true.

**Root cause**: The authorization text block was gated only by `hasConsentedToDemandResponse`, missing the `showDemandResponseToggle` check that the toggle itself already had.

**Fix**: Added `showDemandResponseToggle` (`shouldShowDemandResponse && !!demandResponseProviderID`) as an additional guard on the authorization text and terms link.

## Scope

### In Scope
- Encouraged conversion welcome page — demand response toggle visibility
- Encouraged conversion welcome page — authorization text + "(see terms)" link visibility
- Buildings with and without `demandResponseProviderID`
- Regression: DR-enabled buildings still work correctly

### Out of Scope
- Standard move-in flow (not encouraged conversion — `autotest` uses different form)
- Dashboard demand response card (separate component, not touched by this PR)
- Enrollment creation / DB records (not changed)
- PostHog analytics (not changed)

### Prerequisites
- Access to dev environment
- Test buildings: `pgtest` (DR provider), `txtest` (DR provider), `moved1903` (no DR provider)

## Test Cases

### Bug Fix Verification

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | No DR toggle on building without provider | `moved1903`: `shouldShowDemandResponse=true`, `demandResponseProviderID=null` | 1. Navigate to `/move-in?shortCode=moved1903` 2. Progress through terms to the encouraged conversion welcome page 3. Inspect form for demand response UI | No demand response consent toggle visible | P0 | Yes |
| TC-002 | No authorization text on building without provider | Same as TC-001 | 1. Same as TC-001 2. Check the legal agreement checkbox area at bottom of form | No "I authorize Public Grid to share my utility data with Logical Buildings" text. No "(see terms)" link | P0 | Yes |
| TC-003 | No GridRewards terms link on building without provider | Same as TC-001 | 1. Same as TC-001 2. Search page for `logicalbuildings.com` link | No link to `https://admin.logicalbuildings.com/gridrewards/terms/coned` | P0 | Yes |

### Positive Cases — DR-Enabled Buildings

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-004 | DR toggle visible on pgtest | `pgtest`: `shouldShowDemandResponse=true`, `demandResponseProviderID=GridRewards` | 1. Navigate to `/move-in?shortCode=pgtest` 2. Progress to encouraged conversion welcome page | Demand response consent toggle is visible | P0 | Yes |
| TC-005 | Authorization text shows when toggle ON (pgtest) | Same as TC-004 | 1. Reach welcome page 2. Verify toggle defaults ON 3. Check legal agreement area | "I authorize Public Grid to share my utility data with Logical Buildings for enrollment in GridRewards" text visible with "(see terms)" link | P0 | Yes |
| TC-006 | Authorization text hidden when toggle OFF (pgtest) | Same as TC-004 | 1. Reach welcome page 2. Turn demand response toggle OFF 3. Check legal agreement area | Authorization text and "(see terms)" link disappear | P1 | Yes |
| TC-007 | Toggle ON → OFF → ON — terms reappear (pgtest) | Same as TC-004 | 1. Reach welcome page (toggle ON — text visible) 2. Toggle OFF (text disappears) 3. Toggle ON | Authorization text and "(see terms)" link reappear | P1 | Yes |
| TC-008 | DR toggle visible on txtest | `txtest`: `shouldShowDemandResponse=true`, `demandResponseProviderID=GridRewards` | 1. Navigate to `/move-in?shortCode=txtest` 2. Progress to encouraged conversion welcome page | Demand response consent toggle is visible | P1 | Yes |
| TC-009 | Authorization text shows when toggle ON (txtest) | Same as TC-008 | 1. Reach welcome page 2. Verify toggle defaults ON 3. Check legal agreement area | Authorization text and "(see terms)" link visible | P1 | Yes |

### Regression

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | Full move-in completes with DR toggle ON (pgtest) | 1. Complete full encouraged conversion move-in via `pgtest` with DR toggle ON | Move-in completes successfully. User created. No errors | P0 | Yes |
| TC-011 | Renewable energy toggle still works independently | 1. Navigate to encouraged conversion welcome page (`pgtest`) 2. Toggle renewable energy switch independently of DR toggle | Renewable energy toggle works normally. DR toggle state unchanged | P1 | Yes |
| TC-012 | Legal links still present in agreement text | 1. Reach encouraged conversion welcome page 2. Check legal agreement checkbox area | "I agree to Public Grid's [Legal Links]" text is still present regardless of DR toggle state | P1 | Yes |
| TC-013 | Full move-in completes with DR toggle OFF (pgtest) | 1. Complete full encouraged conversion move-in via `pgtest` with DR toggle OFF | Move-in completes successfully. No enrollment created | P1 | Yes |
| TC-014 | Full move-in completes for building without DR provider (moved1903) | 1. Complete full encouraged conversion move-in via `moved1903` | Move-in completes successfully. No DR UI shown at any point. No errors | P1 | Yes |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-015 | No shortCode — default flow (no encouraged conversion) | 1. Navigate to `/move-in` (no shortCode) 2. Complete standard move-in flow | Standard flow used (not encouraged conversion). No DR toggle (different form) | P2 | No |
| TC-016 | autotest — standard move-in, DR provider set but not encouraged | 1. Navigate to `/move-in?shortCode=autotest` 2. Complete move-in | Standard form used (not `welcome-encouraged.tsx`). No DR toggle on this form | P2 | No |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-017 | Verify moved1903 has no DR provider | `SELECT "shouldShowDemandResponse", "demandResponseProviderID" FROM "Building" WHERE "shortCode" = 'moved1903'` | `shouldShowDemandResponse=true`, `demandResponseProviderID=null` | P0 |
| TC-018 | Verify pgtest has DR provider | Same query for `pgtest` | `shouldShowDemandResponse=true`, `demandResponseProviderID` = GridRewards UUID | P0 |
| TC-019 | Verify txtest has DR provider | Same query for `txtest` | `shouldShowDemandResponse=true`, `demandResponseProviderID` = GridRewards UUID | P1 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Welcome encouraged page — DR toggle | The toggle defaults to ON (opt-out model). Users who don't read carefully may unknowingly consent to sharing utility data with a third party | Users may not realize they're opting into GridRewards data sharing | Consider defaulting to OFF (opt-in) or adding a brief inline explanation visible without expanding the collapsible section |
| UX-002 | Authorization text — "(see terms)" link | The terms link `logicalbuildings.com/gridrewards/terms/coned` is hardcoded to "coned" regardless of the user's actual utility | Could be confusing for users on other utilities (e.g., ComEd) seeing Con Edison terms | Make the terms link dynamic based on the user's utility company |

## Automation Plan
- **Smoke**: TC-001, TC-004, TC-005, TC-010 — core bug fix + positive path + regression
- **Regression**: TC-001 through TC-014 — all automatable cases
- **Exploratory only**: TC-015, TC-016 — different form paths, quick manual verification

## Risks & Notes
- **`moved1903` building stability**: This building is used as the negative test case. If someone adds a `demandResponseProviderID` to it, TC-001–TC-003 will need a different building. Consider adding a `beforeEach` DB assertion.
- **Encouraged conversion only**: The fix is in `welcome-encouraged.tsx` — standard move-in (`autotest`) uses a different form and is unaffected. Only buildings with `useEncouragedConversion=true` are in scope.
- **PR already merged**: Feature is live in dev. Test against dev environment.
- **Related test plan**: ENG-2373 covers the full GridRewards feature (42 cases). This plan is a focused supplement for the terms visibility bug.
