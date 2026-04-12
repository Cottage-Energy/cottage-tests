# Test Plan: Utility Company Management in PG-Admin

## Overview
**Ticket**: ENG-2674
**PR**: [services#393](https://github.com/Cottage-Energy/services/pull/393) (MERGED)
**Source**: Linear ticket + PR diff + Supabase schema inspection
**Date**: 2026-04-09
**Tester**: Christian

## Scope

### In Scope
- List view: search, filter, sort, column visibility (URL-synced state)
- Create utility company modal with validation
- Preview sheet: 3 tabs (Company Info, OCR Settings, Audit Settings)
- Edit/Update operations on all 3 tabs
- Copy Audit Template (JSON to clipboard)
- Row selection + CSV export
- Deep linking via `?utilityCompanyId=X`
- Sidebar navigation ("Utilities" group)
- Data refresh button
- DB verification of CRUD operations

### Out of Scope
- Existing Building Management page (separate feature)
- Utility Health / Account Health Metrics dashboards (read-only, unchanged)
- Auth/permissions (PG-Admin access control is pre-existing)

### Prerequisites
- Access to PG-Admin dev: `https://dev.publicgrid.co/utility-companies`
- Admin credentials for PG-Admin
- Supabase dev access for DB verification (`wzlacfmshqvjhjczytan`)

### Database Context
| Table | Columns | Records (dev) | Notes |
|-------|---------|---------------|-------|
| `UtilityCompany` | 49 columns | 84 (42 ACTIVE, 42 NOT_ACTIVE) | Primary table — no BETA records exist |
| `UtilityCompanyOCRSettings` | 12 columns | 2 | Most utilities show empty state |
| `UtilityCompanyAuditSettings` | 11 columns | 12 | ~14% have settings |

**Key enums**:
- `utilityCompanyStatus`: `ACTIVE`, `BETA`, `NOT_ACTIVE`
- `utilityIntegrationType`: `automation`, `utilityCode`, `other`
- `utilitiesHandled`: currently only `electricity` in use
- `websocket_enum`: `default`, `browserless`, `steel`
- `proxy_providers_enum`: `default` + others

## Test Cases

### List View — Happy Path

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | Page loads with all utility companies | 1. Navigate to `/utility-companies` | Data table loads with 84 rows. Default columns visible: Name, Utility Code, Status, Website, Phone, Integration Type, Utilities Handled | P0 | Yes |
| TC-002 | Search filters by company name | 1. Type "Con Edison" in search input | Table filters to show only matching companies. Results update in real-time | P0 | Yes |
| TC-003 | Search partial match | 1. Type "Atlantic" in search | Shows "Atlantic City Electric" and any other matches | P1 | Yes |
| TC-004 | Search no results | 1. Type "ZZZZNONEXISTENT" | Table shows empty state / no results message | P1 | Yes |
| TC-005 | Filter by Status = ACTIVE | 1. Apply Status filter = ACTIVE | Only ACTIVE companies shown (42). Filter state persists in URL query params | P0 | Yes |
| TC-006 | Filter by Status = NOT_ACTIVE | 1. Apply Status filter = NOT_ACTIVE | Only NOT_ACTIVE companies shown (42). URL updated | P1 | Yes |
| TC-007 | Filter by Integration Type | 1. Apply filter Integration Type = "automation" | Only automation-type companies shown. URL updated | P1 | Yes |
| TC-008 | Filter by Utilities Handled | 1. Apply filter Utilities Handled = "electricity" | All companies shown (only type in use). URL updated | P2 | No |
| TC-009 | Column sort ascending | 1. Click "Name" column header | Table sorts A-Z by name. Sort state in URL | P0 | Yes |
| TC-010 | Column sort descending | 1. Click "Name" column header twice | Table sorts Z-A. URL reflects desc sort | P1 | Yes |
| TC-011 | Sort by Status column | 1. Click "Status" header | Sorted by status. URL updated | P1 | No |
| TC-012 | Column visibility toggle | 1. Open column visibility menu 2. Hide "Phone" column | Phone column hidden. Toggle reflects state | P1 | Yes |
| TC-013 | Multiple columns hidden | 1. Hide Phone, Website, Integration Type | Only remaining columns visible. Other data intact | P2 | No |
| TC-014 | URL state persistence — filter | 1. Apply Status=ACTIVE filter 2. Copy URL 3. Open in new tab | New tab loads with same filter applied, showing only ACTIVE companies | P0 | Yes |
| TC-015 | URL state persistence — sort | 1. Sort by Name desc 2. Copy URL 3. Open in new tab | New tab loads with same sort applied | P1 | Yes |
| TC-016 | Status badge colors | 1. View table with mixed statuses | ACTIVE=green, BETA=orange, NOT_ACTIVE=gray badges | P1 | Yes |
| TC-017 | Refresh button | 1. Click refresh/reload button | Button shows spinner, disables during refetch. Data reloads | P1 | Yes |
| TC-018 | Combined search + filter | 1. Set Status=ACTIVE 2. Search "Electric" | Results match both criteria (ACTIVE + name contains "Electric") | P1 | No |

### Create Utility Company

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | Create button opens modal | 1. Click "Create Utility Company" button | 90vh dialog opens with form fields | P0 | Yes |
| TC-021 | Required field validation — empty ID | 1. Open create modal 2. Leave ID empty 3. Submit | Validation error on ID field. Form does not submit | P0 | Yes |
| TC-022 | Required field validation — empty Name | 1. Open create modal 2. Leave Name empty 3. Submit | Validation error on Name field | P0 | Yes |
| TC-023 | Duplicate ID error | 1. Open create modal 2. Enter ID = "ACE" (existing) 3. Submit | Error message: ID already taken. No duplicate record created | P0 | Yes |
| TC-024 | Successful creation — minimal fields | 1. Enter unique ID (e.g., "QA-TEST-001") 2. Enter Name 3. Submit | New company created, appears in table, dialog closes | P0 | Yes |
| TC-025 | Successful creation — all fields | 1. Fill all fields: ID, Name, Status, Website, Phone, utilityCode, Integration Type, Utilities Handled, all boolean flags 2. Submit | Company created with all fields populated. Verify in DB | P1 | No |
| TC-026 | Utilities Handled multi-select | 1. Open create modal 2. Click Utilities Handled dropdown | Multi-select dropdown appears with options (electricity, etc.) | P1 | Yes |
| TC-027 | Boolean fields layout | 1. Open create modal 2. Inspect boolean fields | Inline checkbox-first layout (checkbox label, not toggle) | P2 | No |
| TC-028 | Fields disabled during save | 1. Fill valid data 2. Click Submit 3. Observe form state | All fields disabled while save is in progress | P1 | No |
| TC-029 | Cancel/close create modal | 1. Open create modal 2. Fill some fields 3. Close/cancel | Modal closes. No record created. Table unchanged | P1 | Yes |

### Preview Sheet

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-030 | Click company name opens sheet | 1. Click a company name (e.g., "Con Edison") in the table | Right-side preview sheet (1040px) opens with company details | P0 | Yes |
| TC-031 | Header displays correctly | 1. Open preview sheet | Header shows: company name, ID (with copy button), status badge | P0 | Yes |
| TC-032 | Copy ID button | 1. Open sheet 2. Click copy icon next to ID | ID copied to clipboard | P1 | Yes |
| TC-033 | Three tabs present | 1. Open preview sheet | Tabs visible: "Company Info", "OCR Settings", "Audit Settings" | P0 | Yes |
| TC-034 | Default tab is Company Info | 1. Open preview sheet | Company Info tab is selected and content loaded | P1 | Yes |
| TC-035 | Close preview sheet | 1. Open sheet 2. Click close/X | Sheet closes. URL param removed | P1 | Yes |

### Deep Linking

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-040 | Deep link opens preview sheet | 1. Navigate to `/utility-companies?utilityCompanyId=CON-ED` | Page loads, preview sheet auto-opens for Con Edison | P0 | Yes |
| TC-041 | Deep link with invalid ID | 1. Navigate to `/utility-companies?utilityCompanyId=NONEXISTENT` | Page loads gracefully. Either shows error in sheet or doesn't open sheet | P1 | Yes |
| TC-042 | URL updates on sheet open | 1. Click a company name | URL updates to include `?utilityCompanyId=<id>` | P1 | Yes |
| TC-043 | URL clears on sheet close | 1. Open sheet 2. Close sheet | `utilityCompanyId` param removed from URL | P1 | Yes |

### Company Info Tab — Edit/Update

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-050 | View mode — fields read-only | 1. Open preview sheet → Company Info | All fields displayed in read-only mode. Grouped sections: Identity, Integration, Billing, Move-In, Thresholds, Features | P0 | Yes |
| TC-051 | Edit button enables fields | 1. Click Edit button | Form fields become editable. Save/Cancel buttons appear | P0 | Yes |
| TC-052 | ID field read-only in edit | 1. Enter edit mode | ID field remains read-only (cannot change after creation) | P0 | Yes |
| TC-053 | Edit name field | 1. Edit mode 2. Change company name 3. Save | Name updated in DB and UI. Sheet exits edit mode | P0 | Yes |
| TC-054 | Edit status field | 1. Edit mode 2. Change status to BETA 3. Save | Status updated. Badge color changes to orange | P1 | Yes |
| TC-055 | Edit boolean fields | 1. Edit mode 2. Toggle `isHandleBilling`, `isSSNRequired` 3. Save | Boolean values flipped in DB | P1 | Yes |
| TC-056 | Edit URL fields | 1. Edit mode 2. Update website URL 3. Save | URL updated. Displays as clickable link in view mode | P1 | Yes |
| TC-057 | Edit threshold fields | 1. Edit mode 2. Change `lastAuditThreshold` to 10 3. Save | Numeric value updated in DB | P1 | No |
| TC-058 | Cancel discards changes | 1. Edit mode 2. Modify several fields 3. Click Cancel | All fields revert to original values. Edit mode exits | P0 | Yes |
| TC-059 | Fields disabled during save | 1. Edit fields 2. Click Save 3. Observe | All fields disabled while save in progress | P1 | No |
| TC-060 | URL fields as clickable links | 1. View a company with website/registrationURL set | URL fields render as clickable links opening in new tab | P2 | No |

### OCR Settings Tab

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-070 | Empty state — no OCR settings | 1. Open preview for a company without OCR settings (most companies) | Shows "No OCR settings for [name]" with Create button | P0 | Yes |
| TC-071 | Create OCR settings from empty | 1. On empty state, click Create | Form opens in edit mode with default values. No infinite loop | P0 | Yes |
| TC-072 | Save new OCR settings | 1. Create from empty 2. Set `shouldOCR=true` 3. Save | New `UtilityCompanyOCRSettings` row created in DB with matching `id` | P0 | Yes |
| TC-073 | View existing OCR settings | 1. Open a company that has OCR settings (2 exist) | OCR form displays with populated fields | P0 | Yes |
| TC-074 | Tag input — add value | 1. Edit mode 2. Focus `trustedOCRFields` tag input 3. Type "amount" + Enter | Tag "amount" appears as a chip/tag | P1 | Yes |
| TC-075 | Tag input — remove value | 1. With existing tags 2. Click remove (X) on a tag | Tag removed from the field | P1 | Yes |
| TC-076 | Tag input — multiple array fields | 1. Edit mode 2. Test `autoApproveTrustedFields`, `autoApproveSuspiciousTerms`, `autoApproveCoverageStates`, `autoApproveDisqualifyingFields` | All array fields support tag input add/remove | P1 | No |
| TC-077 | Edit boolean OCR fields | 1. Toggle `shouldOCR`, `autoApproveEnabled`, `bypassTesseract` 2. Save | Booleans updated in DB | P1 | Yes |
| TC-078 | Edit numeric OCR field | 1. Change `autoApproveDateToleranceDays` 2. Save | Numeric value updated | P2 | No |
| TC-079 | Lazy loading on tab switch | 1. Open sheet (Company Info loads) 2. Switch to OCR tab | OCR data fetched on demand (network request fires on tab switch) | P1 | No |
| TC-080 | Tab caching | 1. Load OCR tab 2. Switch to Company Info 3. Switch back to OCR | OCR data loaded from cache (no new network request) | P2 | No |

### Audit Settings Tab

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-090 | Empty state — no audit settings | 1. Open preview for a company without audit settings | Shows "No custom audit settings for [name]" | P0 | Yes |
| TC-091 | Create audit settings from empty | 1. Empty state 2. Enter edit mode | Shows "Saving will create a new audit settings record" message | P0 | Yes |
| TC-092 | Save new audit settings | 1. Edit from empty 2. Set values 3. Save | New `UtilityCompanyAuditSettings` row created in DB | P0 | Yes |
| TC-093 | View existing audit settings | 1. Open a company with audit settings (12 exist) | Form displays with populated fields | P0 | Yes |
| TC-094 | Settings Preview JSON | 1. Open audit settings tab (with data) | Formatted JSON preview section visible at bottom of form | P1 | Yes |
| TC-095 | Edit audit fields | 1. Edit `maxConcurrency`, `withProxy`, `useFirefox` 2. Save | Values updated in DB | P1 | Yes |
| TC-096 | Copy Audit Template — with settings | 1. Open audit tab for company with settings 2. Click "Copy Audit Template" | JSON copied to clipboard. Contains merged company audit settings + runtime defaults (isTest, maxTasks, statusFilters, debugUser, isHeadless, headlessBatchSize, useLocalPaymentMethods, isReviewBilling, scraperVersion) | P0 | Yes |
| TC-097 | Copy Audit Template — no settings | 1. Open audit tab for company WITHOUT settings 2. Click "Copy Audit Template" | Template generated with default values. Clipboard contains valid JSON | P1 | Yes |
| TC-098 | Edit WebSocket enum | 1. Edit mode 2. Change `webSocket` dropdown (default/browserless/steel) 3. Save | Enum value updated in DB | P2 | No |
| TC-099 | Edit Proxy Provider enum | 1. Edit mode 2. Change `proxyProvider` dropdown 3. Save | Enum value updated in DB | P2 | No |
| TC-100 | Lazy loading on tab switch | 1. Switch to Audit tab | Data fetched on demand, cached for subsequent visits | P1 | No |

### Row Selection & CSV Export

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-110 | Select single row | 1. Click checkbox on one row | Row highlighted. Action bar appears | P1 | Yes |
| TC-111 | Select multiple rows | 1. Click checkboxes on 3 rows | All 3 selected. Action bar shows count | P1 | Yes |
| TC-112 | Select all rows | 1. Click header checkbox | All visible rows selected | P2 | No |
| TC-113 | Export CSV — selected rows | 1. Select 3 rows 2. Click "Export CSV" | CSV file downloaded with 3 rows of data. Columns match visible table columns | P1 | Yes |
| TC-114 | Deselect clears action bar | 1. Select rows 2. Deselect all | Action bar disappears | P2 | No |

### Navigation & Sidebar

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-120 | Sidebar "Utilities" group | 1. View sidebar navigation | "Utilities" group visible containing "Utility Companies" link | P0 | Yes |
| TC-121 | Sidebar link navigates | 1. Click "Utility Companies" in sidebar | Navigates to `/utility-companies` route. Page loads | P0 | Yes |
| TC-122 | Active state in sidebar | 1. Navigate to `/utility-companies` | Sidebar item shows active/selected state | P2 | No |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-130 | Create with special chars in ID | 1. Create modal 2. ID = "QA-TEST/SPECIAL@123" 3. Submit | Either rejected with validation error OR accepted and deep link still works | P2 | No |
| TC-131 | Create with very long name | 1. Create modal 2. Name = 200+ char string 3. Submit | Handled gracefully — truncated, error, or accepted | P2 | No |
| TC-132 | Rapid tab switching | 1. Open sheet 2. Rapidly switch between all 3 tabs | No errors, no duplicate requests, data loads correctly | P2 | No |
| TC-133 | Edit + tab switch without saving | 1. Edit Company Info 2. Switch to OCR tab | Unsaved changes either prompt warning OR are discarded cleanly | P1 | Yes |
| TC-134 | Concurrent edit (same company) | 1. Open sheet for "ACE" 2. In another tab, update "ACE" in DB 3. Refresh data | Updated data reflects after refresh | P2 | No |
| TC-135 | Search with special characters | 1. Type `<script>alert(1)</script>` in search | No XSS. Search treats as literal text | P1 | No |
| TC-136 | Filter + sort + search combined | 1. Set Status=ACTIVE 2. Sort by Name desc 3. Search "Electric" | All three constraints applied simultaneously. URL has all params | P1 | No |
| TC-137 | Empty table after filter | 1. Apply very restrictive filter combination | Empty state displayed. No JS errors | P2 | No |
| TC-138 | Preview sheet responsiveness | 1. Open sheet on smaller viewport | Sheet doesn't overflow. Content remains usable | P2 | No |

### Database Verification

| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-150 | Create — DB record | After TC-024: `SELECT * FROM "UtilityCompany" WHERE "id" = 'QA-TEST-001'` | Record exists with correct field values | P0 |
| TC-151 | Update — DB record | After TC-053: `SELECT "name" FROM "UtilityCompany" WHERE "id" = '<id>'` | Name matches updated value | P0 |
| TC-152 | OCR create — DB record | After TC-072: `SELECT * FROM "UtilityCompanyOCRSettings" WHERE "id" = '<id>'` | New OCR row exists with correct values | P0 |
| TC-153 | Audit create — DB record | After TC-092: `SELECT * FROM "UtilityCompanyAuditSettings" WHERE "id" = '<id>'` | New audit row exists with correct values | P0 |
| TC-154 | Create — no orphan OCR/Audit | After TC-024 (create company only): check OCR + Audit tables | No OCR/Audit rows auto-created — only created on explicit save | P1 |
| TC-155 | Boolean defaults | After TC-024: check boolean columns | Match DB defaults: `isHandleBilling=false`, `isSSNRequired=true`, `status=NOT_ACTIVE`, etc. | P1 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | Create modal | ID field is free-text with no format guidance | Users may create inconsistent IDs (spaces, lowercase, etc.) | Add placeholder/hint text showing expected format (e.g., "UTILITY-CODE" uppercase with hyphens) |
| UX-002 | List view — 84 rows | No pagination visible in AC — unclear if all 84 load at once | May become slow as utility companies grow | Confirm virtualization or pagination is in place for scalability |
| UX-003 | Edit mode — tab switch | No mention of unsaved changes warning when switching tabs | Users could lose edits by accidentally switching tabs | Add "unsaved changes" confirmation dialog |
| UX-004 | OCR/Audit empty state | "Create" button on empty state — unclear if it saves immediately or enters edit mode | Users may be confused about what "Create" does | Clarify button label: "Add OCR Settings" or "Configure OCR" |
| UX-005 | Copy Audit Template | Template has runtime config defaults hardcoded | Ops team may need to understand which fields come from settings vs defaults | Add tooltip or visual distinction for overridden vs default values in JSON preview |
| UX-006 | CSV Export | Only exports selected rows — no "Export All" option | Ops team may want full data dump | Consider adding "Export All" to complement row selection export |
| UX-007 | Preview sheet width | Fixed 1040px sheet width | May be too wide on smaller monitors, too narrow for wide JSON previews | Consider responsive width or collapsible sections |

> These are not test failures — the feature works as specified. These are opportunities to improve the user experience identified during test planning. File actionable ones as improvement tickets via `/log-bug`.

## Automation Plan
- **Smoke**: TC-001, TC-020, TC-024, TC-030, TC-040, TC-120, TC-121 (core navigation + CRUD basics)
- **Regression**: TC-002–TC-018 (list view), TC-021–TC-029 (create), TC-031–TC-035 (preview), TC-050–TC-058 (edit), TC-070–TC-077 (OCR), TC-090–TC-096 (audit), TC-110–TC-113 (export)
- **Exploratory only**: TC-008, TC-011, TC-013, TC-018, TC-025, TC-027–TC-028, TC-059–TC-060, TC-076, TC-078–TC-080, TC-098–TC-100, TC-112, TC-114, TC-122, TC-130–TC-138

**Note**: PG-Admin e2e tests would be a new test area — no existing PG-Admin tests in cottage-tests. Exploratory testing is the primary validation method for this ticket.

## Test Data

### Existing utilities to use for testing
| Company | ID | Status | Has OCR | Has Audit | Integration |
|---------|-----|--------|---------|-----------|-------------|
| Atlantic City Electric | ACE | ACTIVE | Check | Check | automation |
| Con Edison | CON-ED | ACTIVE | Check | Check | automation |
| Rocky Mountain Power | ROCKY-MOUNTAIN-POWER | NOT_ACTIVE | Unlikely | Check | utilityCode |

### Test data to create
| ID | Name | Purpose | Clean up? |
|----|------|---------|-----------|
| QA-TEST-2674-001 | QA Test Utility 001 | Create flow validation | Yes — delete after test |
| QA-TEST-2674-DUP | QA Test Duplicate | Duplicate ID error test | Yes |

### Cleanup queries
```sql
DELETE FROM "UtilityCompanyOCRSettings" WHERE "id" LIKE 'QA-TEST-2674%';
DELETE FROM "UtilityCompanyAuditSettings" WHERE "id" LIKE 'QA-TEST-2674%';
DELETE FROM "UtilityCompany" WHERE "id" LIKE 'QA-TEST-2674%';
```

## Risks & Notes
- **First PG-Admin page in test suite** — no existing POM classes, fixtures, or test patterns for PG-Admin. Exploratory testing is primary validation.
- **PR is MERGED** — testing against live dev environment, not a preview branch.
- **Write operations** — creating/editing utility companies in dev could affect other dev workflows. Use `QA-TEST-2674-*` prefix and clean up after.
- **No BETA status companies exist** — BETA badge (orange) can only be tested via create or edit flow.
- **Only 2 OCR / 12 Audit records** — most testing for these tabs will exercise the empty→create path.
