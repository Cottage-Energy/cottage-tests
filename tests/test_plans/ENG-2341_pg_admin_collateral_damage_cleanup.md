# Test Plan: ENG-2341 — PG Admin Collateral Damage Cleanup (PR #558)

## Overview
**Ticket**: [ENG-2341](https://linear.app/public-grid/issue/ENG-2341)
**Source**: [pg-admin PR #558](https://github.com/Cottage-Energy/pg-admin/pull/558) (merged 2026-03-24)
**Date**: 2026-03-24
**Tester**: Christian
**Related**: [ENG-2341 DB Audit test plan](ENG-2341_database_audit_unused_tables_columns.md) (75 cases, 59/59 PASS on 2026-03-17)

## Context
PR #558 removes all code-level "collateral damage" from pg-admin after the DB tables and columns were dropped. The DB drops and cottage-nextjs cleanup (PR #1086) were already verified. This plan covers the **admin app UI and service layer cleanup** only.

**Key removals:**
- Plane ticket integration (UI + hooks + edge function)
- Manual Remittances feature (component + service layer)
- Dropped column/table type references (regenerated DB types)
- Crisp `crispID` usage
- Community solar bill OCR mapping
- Community solar SQL views

## Scope

### In Scope
- pg-admin profile page regression (Plane ticket buttons, Manual Remittances table removed)
- pg-admin property selector regression (Plane ticket buttons removed)
- pg-admin account actions regression (Unlink option removed)
- pg-admin OCR bill review regression (community solar bill field removed)
- pg-admin Crisp chat regression (crispID removed)
- pg-admin community solar admin views
- pg-admin build health (no TS errors from stale type references)
- Plane webhook edge function removal verification

### Out of Scope
- DB schema verification (already tested — 53/53 PASS)
- cottage-nextjs FE changes (already tested via PR #1086)
- Customer-facing app regression (already tested — 59/59 PASS)
- Production deployment verification
- Staging verification (separate pass before release)

### Prerequisites
- pg-admin PR #558 merged and deployed to dev admin environment
- Access to pg-admin dev instance via Playwright MCP
- Admin user credentials for pg-admin
- A test resident with electric + gas accounts (for profile page testing)

---

## Test Cases

### A. Plane Ticket Removal — Profile Page

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-001 | Profile page loads without Plane ticket buttons | 1. Navigate to pg-admin profile page for a resident 2. Inspect the utility accounts header area | No "View Plane Ticket" buttons visible, no console errors | P0 | Smoke |
| TC-002 | Electric account header renders cleanly | 1. Open a resident with an electric account 2. Inspect the account header section | Account header shows status, tags, edit/save buttons — no Plane ticket sheet or loading spinner where it used to be | P0 | Smoke |
| TC-003 | Gas account header renders cleanly | 1. Open a resident with a gas account 2. Inspect the gas account header | Same as TC-002 for gas — no Plane-related UI remnants | P0 | Smoke |
| TC-004 | Account actions dropdown — no Unlink option | 1. Open a resident with both electric and gas accounts (same Plane ticket) 2. Click the account actions dropdown (⋯ menu) | Dropdown shows Add Electric/Gas, Delete Electric/Gas options — "Unlink Electric and Gas Statuses" option is gone | P0 | Regression |
| TC-005 | Account actions dropdown — all remaining actions work | 1. Open account actions dropdown 2. Click each remaining action | Add Electric, Add Gas, Delete Electric, Delete Gas actions all function correctly | P1 | Regression |
| TC-006 | Profile page — no console errors on load | 1. Open browser console 2. Navigate to a resident profile | No new console errors related to `planeTicketID`, `PlaneTicketSheet`, `usePlaneMoveInIssue`, or `useCreateMoveInTicket` | P0 | Smoke |

### B. Plane Ticket Removal — Property Selector

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-007 | Property selector cards render without Plane buttons | 1. Open a resident with multiple properties 2. View property selector cards | Property cards show electric/gas status badges but no "View Plane Ticket" buttons, no "No Plane Ticket" text | P0 | Smoke |
| TC-008 | Property selector — switching properties works | 1. Click between different property cards 2. Verify account details update | Property selection still works, account details load for selected property — no errors from removed Plane hooks | P1 | Regression |

### C. Manual Remittances Removal

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-009 | Profile page — no Manual Remittances section | 1. Navigate to a resident profile 2. Scroll through all profile sections/tabs | "Manual Remittances" card/table is no longer visible anywhere on the profile page | P0 | Smoke |
| TC-010 | Profile page — no errors from removed remittances hook | 1. Open console 2. Navigate to profile of a user who previously had manual remittances | No console errors related to `useManualRemittances`, `getManualRemittances`, or `remittancesQueries` | P1 | Regression |

### D. Crisp Integration

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-011 | Crisp chat sender uses PG avatar | 1. Open a resident profile 2. Send a Crisp message from the admin panel | Message sends successfully; admin avatar is the PG team avatar (not a broken image from missing crispID lookup) | P1 | Regression |
| TC-012 | Crisp chat — no console errors | 1. Open console 2. Trigger Crisp message send | No errors referencing `crispID` | P2 | Regression |

### E. OCR Bill Review

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-013 | OCR bill transformer — no communitySolarBill field | 1. Open a billing page with OCR run data 2. Review the OCR key-value display | `communitySolarBill` / "Community Solar Bill" key no longer appears in OCR output. All other bill fields display correctly | P2 | Regression |

### F. Community Solar Admin Views

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-014 | Community solar admin view loads | 1. Navigate to community solar admin section 2. Verify the CS admin view renders | View loads without SQL errors; dropped columns (`enrollment`, `capacity`, `coverageServiceGroupID`) no longer referenced | P1 | Regression |
| TC-015 | Community solar consent tracker loads | 1. Navigate to CS consent tracker view | Consent tracker renders without errors | P1 | Regression |

### G. Plane Webhook Edge Function

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-016 | Plane webhook — state change handlers removed | 1. Check Supabase edge functions list for `plane-webhook` 2. Verify function still deploys/exists if not fully removed | If function still exists: no runtime errors on invocation. If fully removed: 404 on webhook URL is expected | P2 | Regression |
| TC-017 | No orphaned Plane webhook triggers | 1. Check if any external systems still call the plane-webhook endpoint | No unexpected 500 errors in Supabase function logs from calls to removed handlers | P2 | Edge Case |

### H. Build Health & Type Safety

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-018 | pg-admin builds without TS errors | 1. Check CI/CD build status for the merged PR 2. Or run `npm run build` locally | Clean build — no TypeScript errors from stale references to dropped tables/columns/types | P0 | Smoke |
| TC-019 | No stale imports in remaining files | 1. Search codebase for imports of removed files (`PlaneTicketSheet`, `usePlane`, `ManualRemittances`, `manual-remittance-queries`, `remittances/`) | Zero import references to deleted modules | P1 | Regression |

### I. General Admin App Regression

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-020 | Admin sign-in works | 1. Navigate to pg-admin sign-in 2. Sign in with admin credentials | Successful sign-in, dashboard loads | P0 | Smoke |
| TC-021 | Resident search and profile navigation | 1. Search for a resident 2. Click to open their profile | Profile page loads fully, all tabs render | P0 | Smoke |
| TC-022 | Billing tab on profile | 1. Open resident profile 2. Click Billing tab | Bill list loads, bill details accessible — no errors from removed `communitySolarBill` column type | P1 | Regression |
| TC-023 | Utility account editing still works | 1. Open a resident profile 2. Click Edit on a utility account 3. Modify a field and save | Account update succeeds — form submission works without removed `planeTicketID`/`linearTicketId` fields | P1 | Regression |
| TC-024 | Property balance display | 1. Open resident with active charge accounts 2. Verify balance info renders | Property balance displays correctly — no errors from removed type references | P1 | Regression |
| TC-025 | Subscription table on profile | 1. Open resident with subscriptions 2. View subscription section | `ProviderGroupedSubscriptionsTable` renders — unaffected by removed Plane/remittance code nearby | P1 | Regression |
| TC-026 | Document tab on profile | 1. Open resident profile 2. Click Documents tab | Documents table loads — verifies `PropertyAccounts` component works after Plane code removal | P2 | Regression |
| TC-027 | Console error sweep across admin pages | 1. Navigate through: dashboard, residents list, profile, billing, community solar 2. Monitor console throughout | No new runtime errors referencing dropped tables, columns, Plane, or remittances | P0 | Smoke |

---

## Automation Plan
- **No automated tests exist for pg-admin** in cottage-tests — all verification is manual/exploratory via Playwright MCP
- **Smoke (P0)**: TC-001, TC-004, TC-006, TC-007, TC-009, TC-018, TC-020, TC-021, TC-027 — execute first
- **Regression (P1)**: TC-002, TC-003, TC-005, TC-008, TC-010, TC-011, TC-014, TC-015, TC-019, TC-022–TC-025 — execute after smoke passes
- **Low priority (P2)**: TC-012, TC-013, TC-016, TC-017, TC-026 — execute if time permits
- **Future**: When pg-admin test infrastructure is built (per cross-platform testing strategy), key cases from this plan should become automated regression tests

## Execution Order
1. **Build health** (TC-018) — confirm clean build before any UI testing
2. **Admin sign-in + navigation** (TC-020, TC-021) — baseline access
3. **Profile page smoke** (TC-001, TC-004, TC-006, TC-007, TC-009, TC-027) — verify removed features don't leave broken UI
4. **Profile page regression** (TC-002, TC-003, TC-005, TC-008, TC-010, TC-022–TC-026) — deeper functional checks
5. **Crisp** (TC-011, TC-012) — messaging still works
6. **Community solar views** (TC-014, TC-015) — admin views load
7. **OCR** (TC-013) — low priority spot check
8. **Webhook** (TC-016, TC-017) — edge function verification

## Risks & Notes
- **Plane ticket removal is the highest-risk area** — it touched 7 components and was integrated into the profile page's core layout (header, property selector, account details, actions dropdown). Any missed reference will surface as a runtime error or broken render.
- **Manual Remittances had active UI** — the component was rendered on the profile page. Its removal should be clean, but verify no parent component still tries to render it.
- **No pg-admin test infrastructure** — all testing is manual via Playwright MCP or visual inspection. This limits coverage and repeatability.
- **Plane webhook handlers were modified, not all fully deleted** — some handler files still exist but with changed behavior. If any external system still calls the webhook, it could behave differently.
- **`crispID` removal is low risk** — the avatar was already falling back to the PG avatar when `crispID` was null, which it was for most admin users.
- **SQL view changes** (`get_cs_admin_view.sql`, `get_cs_consent_tracker.sql`) — these are admin-specific views. If community solar admin pages load, the views are working.
