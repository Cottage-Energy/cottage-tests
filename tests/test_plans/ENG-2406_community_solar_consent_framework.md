# Test Plan: Community Solar Consent Framework

## Overview
**Ticket**: ENG-2406
**Source**: Linear ticket + PG Admin PR #539 + cottage-nextjs PR #1092 + Supabase schema inspection + Cap recording
**Date**: 2026-03-14
**Tester**: Christian

## Feature Summary
A full consent lifecycle system spanning two applications:
- **PG Admin** (TanStack Start) — Document Template Management, Consent Configuration, Consent Tracker Dashboard
- **Next.js Resident Portal** — Consent gate modal, simplified disclosure, full disclosure (DocuSeal/Documenso), decline flow

Three consent methods: **simplified** (checkbox), **full** (e-signature embed), **pg_consent** (admin-only LOA).

Database trigger auto-creates `CommunitySolarConsent` records when `CommunitySolarPlan` is inserted. Status lifecycle: NOT_REQUIRED → UNCONFIGURED → PENDING → REQUESTED → VIEWED → COMPLETED/DECLINED.

---

## Scope

### In Scope
- **Next.js Resident Portal**: Consent gate, simplified disclosure, full disclosure (DocuSeal + Documenso), decline flow, multiple consent sequencing, status auto-transitions, API route auth
- **PG Admin**: Document Template Management, Consent Config CRUD, Consent Tracker dashboard
- **Database**: Trigger on plan insert, status lifecycle, template snapshots, reconciliation
- **Cross-system**: Config changes reflected in resident experience, end-to-end flows
- **Regression**: Existing modals (ESCO, autopay, move-in) after dialog padding refactor

### Out of Scope
- Server-side PDF generation via pdfme (Phase 2)
- Typed signature rendering (Phase 2)
- Documents record creation and PDF persistence (Phase 2)
- Webhook infrastructure for third-party signing verification (Phase 2)
- Confirmation emails after consent completion/decline (Phase 2)
- Export to Partner CSV (Phase 2)
- supply_agreement and tos document types (Phase 2)

### Prerequisites
- Test user with electric account in a state that has a `CommunitySolarConsentConfig` (currently MA or NY for simplified via Arcadia)
- `CommunitySolarPlan` linked to that electric account
- `CommunitySolarConsent` record in REQUESTED status (for modal trigger)
- `CommunitySolarConsentConfig` for the state+provider combination
- `DocumentTemplate` records with uploaded PDFs for document link testing
- For full disclosure: valid DocuSeal or Documenso signing URL pre-populated on consent record
- PG Admin access for admin-side testing

### Dependencies
- DocuSeal/Documenso external services (for full disclosure embed testing)
- Supabase Storage (for document template PDFs)
- PG Admin app (for config and tracker testing)

---

## Database Context

### Tables Involved
| Table | Purpose |
|-------|---------|
| `CommunitySolarConsent` | One per plan — tracks consent lifecycle (25 columns) |
| `CommunitySolarConsentConfig` | State + provider consent rules (12 columns) |
| `CommunitySolarPlan` | Links electric account to provider |
| `CommunitySolarProvider` | 6 providers: Neighborhood Sun, Power Market, Solstice, Ampion, Arcadia, Common Energy |
| `DocumentTemplate` | PDF template registry (pdfme-based) |

### Enums
- `cs_consent_method`: `full`, `simplified`, `pg_consent`
- `cs_consent_status`: `NOT_REQUIRED`, `UNCONFIGURED`, `PENDING`, `REQUESTED`, `VIEWED`, `COMPLETED`, `DECLINED`

### Current Dev State
| Item | Details |
|------|---------|
| Configs | 4: ""→Neighborhood Sun (full), FL→Neighborhood Sun (full), MA→Arcadia (simplified), NY→Arcadia (simplified) |
| Consents | 5: 1 UNCONFIGURED, 2 PENDING, 1 VIEWED, 1 COMPLETED |
| Templates | 4 active (all draft): agency agreement, 2 solar disclosures, 1 subscriber agreement |

---

## Test Cases

### A. Next.js Resident Portal — Consent Gate

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Consent gate triggers for REQUESTED consent | User has CommunitySolarConsent with status=REQUESTED | 1. Log in as test user 2. Navigate to dashboard | Non-dismissible consent modal appears on top of dashboard | P0 | Yes |
| TC-002 | Consent gate triggers for VIEWED consent | User has consent with status=VIEWED | 1. Log in as test user 2. Navigate to dashboard | Consent modal appears | P0 | Yes |
| TC-003 | No modal when no actionable consents | User has no REQUESTED/VIEWED consents | 1. Log in as test user 2. Navigate to dashboard | No modal, dashboard loads normally | P0 | Yes |
| TC-004 | No modal for COMPLETED consents | User has only COMPLETED consents | 1. Log in 2. Navigate to dashboard | No modal, dashboard interactive | P1 | Yes |
| TC-005 | No modal for PENDING consents | User has consent with status=PENDING (not yet REQUESTED) | 1. Log in 2. Navigate to dashboard | No modal — PENDING means admin hasn't sent request yet | P1 | Yes |
| TC-006 | No modal for NOT_REQUIRED consents | User has consent with pg_consent method, status=NOT_REQUIRED | 1. Log in 2. Navigate to dashboard | No modal | P1 | Yes |
| TC-007 | No modal for DECLINED consents | User has only DECLINED consents | 1. Log in 2. Navigate to dashboard | No modal | P2 | Yes |
| TC-008 | Auto-transition REQUESTED → VIEWED | User has consent with REQUESTED status | 1. Log in 2. Modal renders 3. Check DB | consentStatus=VIEWED, consentPageViewedAt populated | P0 | Yes |
| TC-009 | Dashboard renders underneath modal | User has REQUESTED consent | 1. Log in 2. Observe page | Dashboard content visible behind modal, modal is non-dismissible (no X button, no click-outside dismiss) | P1 | Exploratory |
| TC-010 | Modal blocks dashboard interaction | User has REQUESTED consent | 1. Log in 2. Try clicking dashboard elements behind modal | Cannot interact with dashboard — modal blocks all interaction | P1 | Exploratory |

### B. Next.js — Simplified Disclosure Flow

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-011 | Simplified modal layout renders correctly | REQUESTED simplified consent with config + templates | 1. Log in 2. Modal appears | Header ("Good news!"), intro text, accordion ("What is community solar?"), 3-step overview, checkboxes with doc links, disclaimer, buttons | P0 | Yes |
| TC-012 | "What is community solar?" accordion | Modal visible | 1. Click accordion header | Expands to show plain-language explanation; collapsed by default | P2 | Yes |
| TC-013 | Document links open PDFs | Simplified modal with document templates configured | 1. Click document link (e.g., "Community Solar Subscription Agreement") | PDF opens in new tab via Supabase signed URL | P0 | Yes |
| TC-014 | Submit button disabled until all checkboxes checked | Multiple checkboxes rendered | 1. Check some but not all boxes | "Looks good to me!" button stays disabled | P0 | Yes |
| TC-015 | Submit button enables when all checkboxes checked | Modal with checkboxes | 1. Check all checkboxes | "Looks good to me!" button becomes enabled | P0 | Yes |
| TC-016 | Successful consent completion | All checkboxes checked | 1. Check all boxes 2. Click "Looks good to me!" | Success screen ("You're all set!") appears, modal closes | P0 | Yes |
| TC-017 | DB state after simplified completion | Consent completed | 1. Complete consent 2. Query DB | consentStatus=COMPLETED, authorizationBasis=resident_click, ipAddress populated, consentCapturedAt set, template IDs snapshotted (disclosureTemplateUsedID, subscriberAgreementTemplateUsedID, agencyAgreementTemplateUsedID) | P0 | Yes |
| TC-018 | Checkboxes adapt to config (agency agreement toggle) | Config has requiresAgencyAgreement=false | 1. Log in 2. Check modal checkboxes | Agency agreement checkbox/link not shown when not required | P1 | Yes |
| TC-019 | Checkboxes filter by available documents | Config has templates but some basePdfPath missing | 1. Log in 2. Check modal | Only checkboxes with available documents are shown (getActiveCheckboxes filters) | P2 | Exploratory |
| TC-020 | Provider+state-specific checkbox config | Arcadia in IL vs NY | 1. Test consent in different states | Checkbox text and document references match provider+state config in consent/config.ts | P2 | Exploratory |

### C. Next.js — Full Disclosure Flow

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-021 | Full disclosure modal layout renders | REQUESTED full consent with externalSigningURL | 1. Log in 2. Modal appears | Same header/intro/accordion/stepper as simplified, but signing area shows embedded widget instead of checkboxes | P0 | Exploratory |
| TC-022 | DocuSeal embed loads | externalSigningProvider=docuseal, valid URL | 1. Log in 2. Modal renders | DocuSeal signing form loads within modal (withTitle=false, withDecline=true) | P0 | Exploratory |
| TC-023 | Documenso embed loads | externalSigningProvider=documenso, valid URL | 1. Log in 2. Modal renders | Documenso embed loads (darkModeDisabled=true, lockName=true, lockEmail=true) | P0 | Exploratory |
| TC-024 | DocuSeal signing completion | DocuSeal embed loaded | 1. Complete signing in embed 2. onComplete fires | Success screen, consent→COMPLETED, authorizationBasis=docuseal_esign, externalSigningStatus=completed, externalSigningCompletedAt set | P0 | Exploratory |
| TC-025 | Documenso signing completion | Documenso embed loaded | 1. Complete signing in embed | Same as TC-024 but authorizationBasis=documenso_esign | P0 | Exploratory |
| TC-026 | DocuSeal has built-in decline button | DocuSeal embed | 1. Look for decline option in embed | DocuSeal renders its own decline button (withDecline=true) | P1 | Exploratory |
| TC-027 | Documenso shows "No Thanks" button | Documenso embed | 1. Look for decline option | Modal renders its own "No Thanks" button since Documenso has no built-in decline | P1 | Exploratory |
| TC-028 | Document download after DocuSeal completion | Completed DocuSeal consent | 1. Complete signing 2. Click download button | Download button fetches signed docs via GET /api/consent/[consentID]/documents proxy | P1 | Exploratory |
| TC-029 | Full disclosure with missing signing URL | externalSigningURL is null | 1. Log in | Graceful handling — embed area should not crash, possibly show error state | P2 | Exploratory |
| TC-030 | DocuSeal brand styling | DocuSeal embed loaded | 1. Inspect embed styling | Custom CSS applied for PG brand alignment | P3 | Exploratory |
| TC-031 | Documenso brand styling | Documenso embed loaded | 1. Inspect embed styling | CSS vars applied for PG brand alignment | P3 | Exploratory |

### D. Next.js — Decline Flow

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-032 | "No Thanks" opens decline confirmation | Modal visible (simplified or Documenso) | 1. Click "No Thanks" | Decline confirmation screen appears with 4 predefined reason options + "Other" | P0 | Yes |
| TC-033 | Select predefined decline reason and confirm | Decline confirmation visible | 1. Select a reason 2. Confirm decline | Consent→DECLINED, declineReason populated with selected reason | P0 | Yes |
| TC-034 | "Other" decline reason shows textarea | Decline confirmation visible | 1. Select "Other" | Textarea appears for freeform text | P1 | Yes |
| TC-035 | Custom decline reason stored | "Other" selected with text entered | 1. Type custom reason 2. Confirm | declineReason contains the custom text, ipAddress captured | P1 | Yes |
| TC-036 | DB state after decline | Consent declined | 1. Decline consent 2. Query DB | consentStatus=DECLINED, declineReason populated, ipAddress captured | P0 | Yes |

### E. Next.js — Multiple Consents

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-037 | Sequential consent presentation | User has 2 REQUESTED consents | 1. Log in 2. First modal appears 3. Complete first consent | Second modal appears automatically (React Query invalidation) | P0 | Yes |
| TC-038 | Dashboard interactive after all consents resolved | 2 consents, both completed/declined | 1. Resolve first consent 2. Resolve second | Dashboard becomes fully interactive after all resolved | P1 | Yes |
| TC-039 | Mix of complete and decline across multiple | 2 consents | 1. Complete first 2. Decline second | Both actions work, dashboard accessible after | P1 | Yes |
| TC-040 | One REQUESTED + one COMPLETED | 1 REQUESTED, 1 COMPLETED consent | 1. Log in | Only one modal for the REQUESTED consent | P2 | Yes |

### F. Next.js — API Routes & Security

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-041 | GET /api/consent/active requires auth | No session | 1. Call endpoint without auth | 401 Unauthorized | P0 | Yes |
| TC-042 | Ownership verification on consent/active | Authenticated as user A | 1. Call GET /api/consent/active with user B's electricAccountID | 403 Forbidden | P0 | Yes |
| TC-043 | POST /complete requires auth | No session | 1. Call POST /api/consent/[id]/complete without auth | 401 | P1 | Yes |
| TC-044 | POST /decline requires auth | No session | 1. Call POST /api/consent/[id]/decline without auth | 401 | P1 | Yes |
| TC-045 | Complete captures IP address | Valid consent | 1. Complete consent 2. Check DB | ipAddress field populated on CommunitySolarConsent | P1 | Yes |
| TC-046 | GET /api/consent/[id]/documents proxies DocuSeal | Completed DocuSeal consent | 1. Call endpoint | Returns signed document download URLs from DocuSeal API | P2 | Exploratory |

### G. PG Admin — Document Template Management

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-047 | Template list loads | PG Admin access | 1. Navigate to /document-templates | Template list renders with existing templates | P0 | No (manual) |
| TC-048 | Upload new PDF template | PDF file ready | 1. Click upload 2. Fill name, slug, document type, state 3. Submit | Storage upload succeeds, DB record created, version=1, isDraft=true | P0 | No (manual) |
| TC-049 | pdfme Designer opens and functions | Template uploaded | 1. Open designer 2. Drag-drop fields 3. Save | PDF renders as background, fields positionable, templateJSON + fieldNames saved | P0 | No (manual) |
| TC-050 | Upload new version for existing slug | Template with slug exists | 1. Upload PDF with same slug | Old version deactivated, new version = prev+1, templateJSON carried over | P0 | No (manual) |
| TC-051 | Version calculation uses max regardless of isActive | All prior versions inactive | 1. Upload new version | Version = max(existing) + 1 (not 1), no unique constraint violation | P1 | No (manual) |
| TC-052 | Activate/deactivate version safety | Multiple versions exist | 1. Activate a version | Target activated first, then others deactivated (no all-inactive state) | P1 | No (manual) |
| TC-053 | Toggle draft/published | Template exists | 1. Toggle isDraft switch | Status updates correctly, only published+active templates used for generation | P1 | No (manual) |
| TC-054 | Test PDF generation | Template with fields designed | 1. Click "Generate PDF" 2. Fill test values | Preview PDF opens in new tab via @pdfme/generator | P1 | No (manual) |
| TC-055 | Filter by document type | Multiple templates | 1. Select document type filter | List filtered correctly (solar_disclosure, subscriber_agreement, agency_agreement, loa) | P2 | No (manual) |
| TC-056 | Filter by status | Mixed statuses | 1. Select status filter (Draft, Published, Inactive) | Correct templates shown for each status | P2 | No (manual) |
| TC-057 | Search by name/slug/tags | Multiple templates | 1. Type search term (debounced 300ms) | Results filter correctly | P2 | No (manual) |
| TC-058 | Version history browseable | Template with multiple versions | 1. Open detail panel 2. Expand "Versions" section | All versions listed with details | P2 | No (manual) |

### H. PG Admin — Consent Configuration Management

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-059 | Config grid loads | PG Admin access | 1. Navigate to /community-solar-consent-config | DataGrid renders with existing configs | P0 | No (manual) |
| TC-060 | Create new config (simplified) | Templates available | 1. Open add modal 2. Select state(s), provider, method=simplified, assign templates 3. Submit | Config created, matching UNCONFIGURED consents auto-reconcile to PENDING | P0 | No (manual) |
| TC-061 | Create new config (full disclosure) | — | 1. Open add modal 2. Select state, provider, method=full 3. Submit | Config created, template selectors hidden for full method | P0 | No (manual) |
| TC-062 | Create new config (pg_consent) | — | 1. Open add modal 2. Select state, provider, method=pg_consent 3. Submit | Config created | P1 | No (manual) |
| TC-063 | Multi-state batch config creation | — | 1. Select multiple states via "Select All" 2. Submit | One config created per state (all with same provider/method) | P1 | No (manual) |
| TC-064 | Inline grid editing | Config exists | 1. Click cell in grid 2. Edit value 3. Tab out | Cell value saved to DB | P1 | No (manual) |
| TC-065 | Template cells show name, store UUID | Config with templates assigned | 1. View template column | Name displayed via displayAccessorKey, UUID stored | P2 | No (manual) |
| TC-066 | Eye icon opens PDF preview | Config with template | 1. Click eye icon on template cell | TemplatePreviewDialog opens with PDF via signed URL | P1 | No (manual) |
| TC-067 | Bulk edit configs | Multiple configs selected | 1. Select rows 2. Open bulk edit 3. Check fields to update 4. Submit | Only checked field groups updated, unchecked fields unchanged | P1 | No (manual) |
| TC-068 | Delete configs | Config selected | 1. Select row(s) 2. Click delete | Config(s) deleted | P2 | No (manual) |
| TC-069 | Unique constraint (state + providerID) | Config for IL+Arcadia exists | 1. Try creating duplicate config for IL+Arcadia | Error — unique index prevents duplicate | P1 | No (manual) |
| TC-070 | Auto-reconcile on config creation | UNCONFIGURED consents exist for state+provider | 1. Create matching config | Matching UNCONFIGURED consents automatically updated to PENDING | P0 | No (manual) |

### I. PG Admin — Consent Tracker Dashboard

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-071 | Tracker loads with status tabs | PG Admin access | 1. Navigate to /community-solar-consent-tracker | Status tabs render with count badges, data grid loads | P0 | No (manual) |
| TC-072 | Filter by status tab | Multiple consent statuses exist | 1. Click different status tabs | Grid filters to show only matching consents, count badges accurate | P0 | No (manual) |
| TC-073 | Status persists in URL params | — | 1. Select a status tab 2. Copy URL 3. Open in new tab | Same status tab selected | P2 | No (manual) |
| TC-074 | Send Consent Request (row action) | PENDING consent | 1. Click row actions 2. Select "Send Consent Request" | Status→REQUESTED, lastConsentRequestedAt set | P0 | No (manual) |
| TC-075 | Resend Consent Request | REQUESTED consent | 1. Click row actions 2. Select "Resend" | lastConsentRequestedAt updated | P1 | No (manual) |
| TC-076 | Change Status (row action) | Any consent | 1. Row actions → Change Status → select new status | Status updated correctly | P1 | No (manual) |
| TC-077 | Change Consent Method (row action) | Any consent | 1. Row actions → Change Consent Method → select method | Method updated | P1 | No (manual) |
| TC-078 | Override to PG Consent | Any consent | 1. Row actions → Override to PG Consent | method=pg_consent, status=COMPLETED, consentCapturedAt=now | P1 | No (manual) |
| TC-079 | Generate Documents (stubbed) | Any consent | 1. Row actions → Generate Documents | "Not yet implemented" response (Phase 2) | P2 | No (manual) |
| TC-080 | View Details (detail sheet) | Any consent | 1. Row actions → View Details | Slide-over panel with all sections: Header, External Signing, Templates Used, Current Config, Consent Details, Timestamps, Plan & Provider, Resident & Address | P0 | No (manual) |
| TC-081 | Detail sheet — Templates Used (COMPLETED) | COMPLETED consent with template snapshots | 1. View Details | Shows exact template versions frozen at capture time with PDF preview buttons | P1 | No (manual) |
| TC-082 | Detail sheet — Current Config (non-COMPLETED) | PENDING consent | 1. View Details | Shows matching config by providerId + state with current method, templates, agency toggle | P1 | No (manual) |
| TC-083 | Create Config from tracker row | UNCONFIGURED consent | 1. Row actions → Create Config | Opens config creation for this row's provider + state | P1 | No (manual) |
| TC-084 | Bulk Send | Multiple PENDING consents selected | 1. Select rows 2. Action bar → Bulk Send | All selected consents → REQUESTED | P1 | No (manual) |
| TC-085 | Bulk Update Status | Multiple consents selected | 1. Select rows 2. Bulk Update Status → choose status | All selected updated, enum validation prevents invalid values | P1 | No (manual) |
| TC-086 | Bulk Update Method | Multiple consents selected | 1. Select rows 2. Bulk Update Method | Method updated for all selected | P2 | No (manual) |
| TC-087 | Bulk Configure External | Multiple full consents selected | 1. Select rows 2. Configure External → set provider/ID/URL | External signing fields populated | P1 | No (manual) |
| TC-088 | Bulk Create Config | Selected consents from unconfigured state+providers | 1. Select rows 2. Create Config | Configs created for unique provider+state combos | P2 | No (manual) |
| TC-089 | Reconcile button | UNCONFIGURED consents + matching configs now exist | 1. Click Reconcile | UNCONFIGURED consents with matching configs → PENDING (batched in 100s) | P0 | No (manual) |
| TC-090 | Inline edit external signing fields | Full disclosure consent | 1. Edit externalSigningProvider, externalSigningID, externalSigningURL inline | Values saved | P1 | No (manual) |

### J. Database — Trigger & Lifecycle

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-091 | Trigger creates consent on plan insert | INSERT into CommunitySolarPlan → check CommunitySolarConsent | New consent record auto-created with correct method and status | P0 |
| TC-092 | Trigger resolves state from address chain | Insert plan → check consent.state | State matches ElectricAccount → Property → Address chain | P0 |
| TC-093 | Trigger with config: simplified method | Plan for state+provider with simplified config | Consent created with method=simplified, status=PENDING | P0 |
| TC-094 | Trigger with config: full method | Plan for state+provider with full config | Consent created with method=full, status=PENDING | P1 |
| TC-095 | Trigger with config: pg_consent method | Plan for state+provider with pg_consent config | Consent created with method=pg_consent, status=NOT_REQUIRED | P0 |
| TC-096 | Trigger without config | Plan for state+provider with no config | Consent created with status=UNCONFIGURED, method=provider defaultConsentMethod (or 'simplified' fallback) | P0 |
| TC-097 | Template snapshot on COMPLETED | Complete a consent → check template*UsedID columns | disclosureTemplateUsedID, subscriberAgreementTemplateUsedID, agencyAgreementTemplateUsedID populated with current template IDs | P0 |
| TC-098 | Template snapshots null before COMPLETED | PENDING/REQUESTED consent | Template*UsedID columns are null — templates resolved dynamically from config | P1 |
| TC-099 | Consent soft delete | deletedAt field | Tracker excludes consents with deletedAt IS NOT NULL | P2 |
| TC-100 | Unique constraint on config (state + providerID) | Try inserting duplicate | Unique index violation error | P1 |
| TC-101 | Unique constraint on template (slug + version) | Try inserting duplicate slug+version | Unique constraint violation error | P1 |

### K. Regression — Existing Modals (Dialog Padding Refactor)

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-102 | ESCO notice modal renders correctly | 1. Navigate to page with ESCO notice 2. Trigger modal | Modal padding, content, and buttons display correctly after refactor | P1 | Yes (existing tests) |
| TC-103 | Move-in modals render correctly | 1. Run existing move-in test suite | All move-in modals (address, utility, confirmation) unaffected | P1 | Yes (existing tests) |
| TC-104 | Payment/autopay modals render correctly | 1. Check autopay enable/disable modals | Modal layout intact after padding refactor | P1 | Yes (existing tests) |
| TC-105 | About modal renders correctly | 1. Trigger about modal | No visual regression | P2 | Yes (existing tests) |

### L. Cross-System Integration

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-106 | End-to-end simplified flow | 1. Admin creates config in PG Admin 2. Plan inserted (trigger fires) 3. Admin sends consent request 4. Resident logs in 5. Completes consent | Full lifecycle from config → consent creation → resident action → COMPLETED | P0 | Exploratory |
| TC-107 | End-to-end full disclosure flow | 1. Admin sets up config + external signing 2. Resident logs in 3. Signs in embed | Full lifecycle with external provider | P0 | Exploratory |
| TC-108 | UNCONFIGURED recovery flow | 1. Plan created with no config → UNCONFIGURED 2. Admin creates config 3. Auto-reconcile fires 4. Admin sends request 5. Resident completes | UNCONFIGURED → PENDING → REQUESTED → VIEWED → COMPLETED | P1 | Exploratory |

---

## Automation Plan

### Smoke (P0 — automate in cottage-tests)
- TC-001: Consent gate triggers for REQUESTED consent
- TC-003: No modal when no actionable consents
- TC-008: Auto-transition REQUESTED → VIEWED
- TC-011: Simplified modal layout renders
- TC-014: Submit button disabled until all checkboxes checked
- TC-016: Successful consent completion
- TC-017: DB state after simplified completion
- TC-032: "No Thanks" opens decline confirmation
- TC-037: Sequential consent presentation (multiple)

### Regression (automate in cottage-tests)
- TC-002, TC-004, TC-005, TC-006, TC-007: Gate logic for all statuses
- TC-012, TC-013, TC-015, TC-018: Simplified disclosure details
- TC-033, TC-034, TC-035, TC-036: Decline flow variations
- TC-038, TC-039, TC-040: Multiple consent scenarios
- TC-041, TC-042, TC-043, TC-044, TC-045: API auth/security
- TC-102–TC-105: Existing modal regression (via existing test runs)

### Exploratory Only (manual)
- TC-009, TC-010: Modal blocking behavior
- TC-019, TC-020: Checkbox config edge cases
- TC-021–TC-031: Full disclosure (DocuSeal/Documenso embeds — require live external services)
- TC-046: Document download proxy
- TC-047–TC-090: All PG Admin tests (separate app)
- TC-091–TC-101: Database trigger/lifecycle (via Supabase queries)
- TC-106–TC-108: Cross-system integration

### Test Data Setup (for automated tests)
Automated tests will need helper functions to:
1. Create `CommunitySolarPlan` for test user's electric account (triggers consent auto-creation)
2. Create/ensure `CommunitySolarConsentConfig` for the state+provider
3. Update consent status to REQUESTED (to trigger modal)
4. Clean up: delete consent + plan records in `afterEach`

---

## Risks & Notes

1. **Full disclosure tests require external services**: DocuSeal and Documenso signing URLs must be pre-populated by admin. Cannot create signing sessions on-the-fly in tests. These tests will remain exploratory.
2. **Test data isolation**: Creating CommunitySolarPlan triggers a DB trigger that creates the consent. Tests must clean up both records to avoid polluting the dev environment.
3. **All DocumentTemplates are still in draft**: Current dev templates have isDraft=true. Document links in simplified flow may not resolve until templates are published (isDraft=false).
4. **PG Admin is a separate repo**: All PG Admin test cases (TC-047–TC-090) are manual/exploratory. No automated coverage possible in cottage-tests.
5. **Dialog padding refactor risk**: Next.js PR touches ~30 existing modal files for padding changes. Existing test suite should catch regressions, but visual spot-checks recommended.
6. **BLNK payment dependency**: If payment tests are still blocked on BLNK (per prior active work), the autopay modal regression check (TC-104) may need to be deferred.
7. **No confirmation emails yet**: Phase 1 does not send emails after consent actions. No email verification test cases needed.
8. **Consent checkbox config is hardcoded**: Provider+state checkbox configs are in consent/config.ts (Arcadia in IL/MA/MD/NJ/NY + generic fallback). Testing other providers requires code changes.

---

## Test Case Summary

| Category | Count | P0 | P1 | P2 | P3 | Automate |
|----------|-------|----|----|----|----|----------|
| A. Consent Gate | 10 | 3 | 5 | 2 | 0 | 8 Yes, 2 Exploratory |
| B. Simplified Disclosure | 10 | 4 | 2 | 3 | 0 | 7 Yes, 3 Exploratory |
| C. Full Disclosure | 11 | 3 | 4 | 2 | 2 | All Exploratory |
| D. Decline Flow | 5 | 3 | 2 | 0 | 0 | 4 Yes, 1 Exploratory |
| E. Multiple Consents | 4 | 1 | 2 | 1 | 0 | All Yes |
| F. API Routes & Security | 6 | 2 | 3 | 1 | 0 | 5 Yes, 1 Exploratory |
| G. Document Templates (PG Admin) | 12 | 3 | 4 | 4 | 0 | All Manual |
| H. Consent Config (PG Admin) | 12 | 3 | 5 | 3 | 0 | All Manual |
| I. Consent Tracker (PG Admin) | 20 | 4 | 10 | 5 | 0 | All Manual |
| J. Database | 11 | 5 | 3 | 2 | 0 | All Exploratory |
| K. Regression | 4 | 0 | 3 | 1 | 0 | Existing tests |
| L. Cross-System | 3 | 2 | 1 | 0 | 0 | All Exploratory |
| **TOTAL** | **108** | **33** | **44** | **24** | **2** | **24 Yes, ~84 Manual/Exploratory** |
