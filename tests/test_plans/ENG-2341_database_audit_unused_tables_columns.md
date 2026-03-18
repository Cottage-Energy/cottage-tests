# Test Plan: ENG-2341 — Database Audit (Drop Unused Tables, Columns, and Archive)

## Overview
**Ticket**: [ENG-2341](https://linear.app/public-grid/issue/ENG-2341)
**Source**: Linear ticket, [Notion DB Audit](https://www.notion.so/public-grid/DB-Audit-312e16f7944b8004ad0aedba837944ca), PR #1086 (cottage-nextjs)
**Date**: 2026-03-17
**Tester**: Christian
**Assignee**: Anton Benitez

## Scope

### In Scope
- Verify 26 tables were dropped from dev database
- Verify columns were dropped from 8 tables
- Verify 2 tables were archived to `archive` schema before deletion
- Verify new GasBill `updatedAt` DB trigger
- Verify FE type exports removed (PR #1086)
- Regression testing of all user-facing flows that touch modified tables
- Spot-check dev app for runtime errors

### Out of Scope
- Production deployment (this is dev verification only)
- Staging verification (will be a separate pass before release)
- Column audit items marked "Keep" in the Notion doc
- Other schemas (pg_catalog, auth, extensions, pgsodium, storage, blnk)

### Prerequisites
- Dev environment with DB changes applied (confirmed via Linear comments 2026-03-17)
- PR #1086 merged (confirmed 2026-03-11)
- Access to Supabase dev project for schema queries
- Existing e2e test suites passing as baseline

---

## Test Cases

### A. Database Schema Verification — Tables Dropped

| ID | Title | Query/Check | Expected Result | Priority | Type |
|----|-------|-------------|-----------------|----------|------|
| TC-001 | Verify RenewableSubscriptions dropped | `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='RenewableSubscriptions')` | `false` | P0 | Smoke |
| TC-002 | Verify RenewableSubscriptionPlan dropped | Same query pattern for `RenewableSubscriptionPlan` | `false` | P0 | Smoke |
| TC-003 | Verify RenewableSubscriptionPayments dropped | Same pattern for `RenewableSubscriptionPayments` | `false` | P0 | Smoke |
| TC-004 | Verify UtilityAPIReferrals dropped | Same pattern for `UtilityAPIReferrals` | `false` | P0 | Smoke |
| TC-005 | Verify ElectricBillSavings dropped | Same pattern for `ElectricBillSavings` | `false` | P0 | Smoke |
| TC-006 | Verify Building_ServiceAccounts dropped | Same pattern for `Building_ServiceAccounts` | `false` | P0 | Smoke |
| TC-007 | Verify UtilityCompany_ServiceAccounts dropped | Same pattern for `UtilityCompany_ServiceAccounts` | `false` | P0 | Smoke |
| TC-008 | Verify UtilityAutomationLog dropped | Same pattern for `UtilityAutomationLog` | `false` | P0 | Smoke |
| TC-009 | Verify EmissionFactor dropped | Same pattern for `EmissionFactor` | `false` | P0 | Smoke |
| TC-010 | Verify GreenButtonMeterReadingMetadata dropped | Same pattern for `GreenButtonMeterReadingMetadata` | `false` | P0 | Smoke |
| TC-011 | Verify GreenButtonMeterReadings dropped | Same pattern for `GreenButtonMeterReadings` | `false` | P0 | Smoke |
| TC-012 | Verify MeterReadings_plain dropped | Same pattern for `MeterReadings_plain` | `false` | P0 | Smoke |
| TC-013 | Verify LinkAccountJob dropped | Same pattern for `LinkAccountJob` | `false` | P0 | Smoke |
| TC-014 | Verify RegistrationJob dropped | Same pattern for `RegistrationJob` | `false` | P0 | Smoke |
| TC-015 | Verify ConnectCache dropped | Same pattern for `ConnectCache` | `false` | P0 | Smoke |
| TC-016 | Verify SequelizeMeta dropped | Same pattern for `SequelizeMeta` | `false` | P0 | Smoke |
| TC-017 | Verify ServiceGroup dropped | Same pattern for `ServiceGroup` | `false` | P0 | Smoke |
| TC-018 | Verify ApiKey dropped | Same pattern for `ApiKey` | `false` | P0 | Smoke |
| TC-019 | Verify ResourceMix dropped | Same pattern for `ResourceMix` | `false` | P0 | Smoke |
| TC-020 | Verify UtilityCompanyRefreshSettings dropped | Same pattern for `UtilityCompanyRefreshSettings` | `false` | P0 | Smoke |
| TC-021 | Verify BuildingManager dropped | Same pattern for `BuildingManager` | `false` | P0 | Smoke |
| TC-022 | Verify ConnectRequest dropped | Same pattern for `ConnectRequest` | `false` | P0 | Smoke |
| TC-023 | Verify ManualRemittances dropped | Same pattern for `ManualRemittances` | `false` | P0 | Smoke |
| TC-024 | Verify GreenButtonOAuth dropped | Same pattern for `GreenButtonOAuth` | `false` | P0 | Smoke |
| TC-025 | Verify UtilityRemittanceRecord dropped | Same pattern for `UtilityRemittanceRecord` | `false` | P0 | Smoke |
| TC-026 | Verify payment_etl.payment_status_history dropped | `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='payment_etl' AND table_name='payment_status_history')` | `false` | P1 | Smoke |

### B. Database Schema Verification — Archive Tables

| ID | Title | Query/Check | Expected Result | Priority | Type |
|----|-------|-------------|-----------------|----------|------|
| TC-027 | Verify archive schema exists | `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name='archive')` | `true` | P0 | Smoke |
| TC-028 | Verify archive.ManualRemittances exists | `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='archive' AND table_name='ManualRemittances')` | `true` | P0 | Smoke |
| TC-029 | Verify archive.UtilityRemittanceRecord exists | Same pattern for `archive.UtilityRemittanceRecord` | `true` | P0 | Smoke |
| TC-030 | Verify archive.ManualRemittances has archived_at | `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='archive' AND table_name='ManualRemittances' AND column_name='archived_at')` | `true` | P0 | Smoke |
| TC-031 | Verify archive.UtilityRemittanceRecord has archived_at | Same pattern for `archive.UtilityRemittanceRecord` | `true` | P0 | Smoke |
| TC-032 | Verify archive.UtilityRemittanceRecord row count | `SELECT COUNT(*) FROM archive."UtilityRemittanceRecord"` | 1464 rows (as confirmed) | P1 | Regression |
| TC-033 | Verify archive.ManualRemittances row count | `SELECT COUNT(*) FROM archive."ManualRemittances"` | 0 rows (as confirmed) | P1 | Regression |
| TC-034 | Verify archived data has expected columns | Check `archive."UtilityRemittanceRecord"` has: id, created_at, historyRecord, ledgerTransactionID, payment, paymentMethodTransactionId, remittance_status, archived_at | All present | P1 | Regression |

### C. Database Schema Verification — Columns Dropped

| ID | Title | Query/Check | Expected Result | Priority | Type |
|----|-------|-------------|-----------------|----------|------|
| TC-035 | CommunitySolarPlan.deletedAt dropped | `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CommunitySolarPlan' AND column_name='deletedAt')` | `false` | P0 | Smoke |
| TC-036 | CommunitySolarProvider.enrollment dropped | Same pattern | `false` | P0 | Smoke |
| TC-037 | CommunitySolarProvider.capacity dropped | Same pattern | `false` | P0 | Smoke |
| TC-038 | CommunitySolarProvider.coverageServiceGroupID dropped | Same pattern | `false` | P0 | Smoke |
| TC-039 | ElectricAccount.accountType dropped | Same pattern | `false` | P0 | Smoke |
| TC-040 | ElectricAccount.electricGeneratingEquipment dropped | Same pattern | `false` | P0 | Smoke |
| TC-041 | ElectricAccount.hasElectricVehicle dropped | Same pattern | `false` | P0 | Smoke |
| TC-042 | ElectricAccount.vehicleMakeModel dropped | Same pattern | `false` | P0 | Smoke |
| TC-043 | ElectricAccount.communitySolarSavingsConfig dropped | Same pattern | `false` | P0 | Smoke |
| TC-044 | ElectricAccount.linearTicketId dropped | Same pattern | `false` | P0 | Smoke |
| TC-045 | ElectricAccount.planeTicketID dropped | Same pattern | `false` | P0 | Smoke |
| TC-046 | GasAccount.linearTicketId dropped | Same pattern | `false` | P0 | Smoke |
| TC-047 | GasAccount.planeTicketID dropped | Same pattern | `false` | P0 | Smoke |
| TC-048 | ElectricBill.communitySolarBill dropped | Same pattern | `false` | P0 | Smoke |
| TC-049 | ElectricSupplyPlan.deletedAt dropped | Same pattern | `false` | P0 | Smoke |
| TC-050 | PGAdminUsers.crispID dropped | Same pattern | `false` | P0 | Smoke |
| TC-051 | Property.isRenewablePaidFor dropped | Same pattern | `false` | P0 | Smoke |

### D. Database — New Trigger Verification

| ID | Title | Query/Check | Expected Result | Priority | Type |
|----|-------|-------------|-----------------|----------|------|
| TC-052 | GasBill updatedAt trigger exists | `SELECT tgname FROM pg_trigger WHERE tgrelid = '"GasBill"'::regclass AND tgname LIKE '%updated%'` | Trigger found | P0 | Smoke |
| TC-053 | GasBill updatedAt trigger function | Verify trigger function updates `updatedAt` on row modification | `updatedAt` auto-updates on UPDATE | P1 | Regression |

### E. FE Code Changes — PR #1086

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-054 | ConnectRequest type exports removed | Check `packages/types/src/models/index.ts` no longer exports ConnectRequest | Export removed | P1 | Smoke |
| TC-055 | RenewableSubscription* type exports removed | Same file, check RenewableSubscriptionPayments, RenewableSubscriptionPlan, RenewableSubscriptions | Exports removed | P1 | Smoke |
| TC-056 | ServiceGroup type export removed | Same file | Export removed | P1 | Smoke |
| TC-057 | GreenButtonOAuth type export removed | Same file | Export removed | P1 | Smoke |
| TC-058 | cottage-nextjs builds without errors on dev | Check dev deployment or build logs | Clean build, no TS errors | P0 | Regression |

### F. Application Regression — Connect Flow

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-059 | Connect registration form loads | 1. Navigate to `/connect` 2. Verify registration form renders | Form loads without errors | P0 | Smoke |
| TC-060 | Connect flow e2e suite passes | Run `tests/e2e_tests/connect-flow/` suite | All tests pass | P0 | Regression |
| TC-061 | /connect/validate-token route removed | Send request to `/api/connect/validate-token` | Returns 404 or route not found | P1 | Regression |
| TC-062 | /connect/authorize-connect-request route removed | Send request to `/api/connect/authorize-connect-request` | Returns 404 or route not found | P1 | Regression |

### G. Application Regression — Move-In Flow

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-063 | Move-in form loads and works | 1. Navigate to move-in flow 2. Verify all form steps render | No errors, all fields present | P0 | Smoke |
| TC-064 | Move-in e2e suite passes | Run `tests/e2e_tests/cottage-user-move-in/` suite | All tests pass | P0 | Regression |
| TC-065 | ElectricAccount creation still works | Complete a move-in, verify ElectricAccount is created in DB | Account created without dropped columns | P1 | Regression |

### H. Application Regression — Payment Flow

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-066 | Payment page loads | 1. Sign in as test user 2. Navigate to payment page | Page renders, bill data displayed | P0 | Smoke |
| TC-067 | Payment e2e suite passes | Run `tests/e2e_tests/payment/` suite | All tests pass | P1 | Regression |
| TC-068 | ElectricBill data displays correctly | Verify bill amounts, dates, and status show on payment page | All bill data intact (dropped columns were unused) | P1 | Regression |

### I. Application Regression — General

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-069 | Full smoke suite passes | Run `npx playwright test --grep /@smoke/ --project=Chromium` | All smoke tests pass | P0 | Smoke |
| TC-070 | Sign-in page loads without errors | Navigate to `/sign-in`, check console for errors | No runtime errors | P0 | Smoke |
| TC-071 | Dashboard loads without errors | Sign in, navigate to dashboard, check console | No runtime errors related to dropped types | P1 | Regression |
| TC-072 | Community solar page loads | Navigate to community solar section | Page loads without errors (CommunitySolarPlan/Provider columns dropped were unused) | P1 | Regression |
| TC-073 | Transfer flow loads | Navigate to transfer flow | No errors related to Property.isRenewablePaidFor removal | P2 | Regression |
| TC-074 | No console errors on key pages | Check browser console on sign-in, dashboard, payment, connect pages | No new errors referencing dropped tables/columns | P1 | Regression |

### J. Housekeeping

| ID | Title | Steps | Expected Result | Priority | Type |
|----|-------|-------|-----------------|----------|------|
| TC-075 | Regenerate database.types.ts | Run Supabase type generation to update `tests/resources/utils/database.types.ts` | File updated, no references to dropped tables/columns | P2 | Maintenance |

---

## Automation Plan
- **Smoke (TC-069)**: Run existing smoke suite — no new tests needed, just verify pass/fail
- **Regression**: TC-060, TC-064, TC-067 — run existing e2e suites
- **DB Verification (TC-001 to TC-053)**: Execute via Supabase MCP during exploratory testing — not automated as e2e tests (one-time verification)
- **Exploratory only**: TC-058, TC-061, TC-062, TC-070–TC-074 — manual spot-checks via Playwright MCP

## Execution Order
1. **DB Schema Verification** (TC-001 to TC-053) — confirm all drops/archives/triggers are in place
2. **Smoke Suite** (TC-069) — baseline regression check
3. **FE Spot Checks** (TC-070 to TC-074) — runtime error check on key pages
4. **Connect Flow Suite** (TC-060) — highest risk area since ConnectRequest was active
5. **Move-In Suite** (TC-064) — ElectricAccount/GasAccount changes
6. **Payment Suite** (TC-067) — ElectricBill changes
7. **Housekeeping** (TC-075) — regenerate types after all verification passes

## Risks & Notes
- **ConnectRequest was the highest-risk drop** — it had 1.5M seq_scans in prod and active FE code (validate-token + authorize-connect-request routes). PR #1086 removed the code references, but this is the area most likely to surface runtime errors.
- **ManualRemittances had 636K seq_scans** on an empty table — the query path that was scanning this table should no longer produce errors after the drop, but worth monitoring.
- **GasBill trigger** is new behavior — verify it doesn't interfere with existing gas bill processing.
- **Columns dropped from ElectricAccount/GasAccount** were all confirmed unused (null_frac = 1 for all). Low regression risk.
- **No cottage-tests test files reference any dropped table or column** — existing test suite should be unaffected.
- **database.types.ts** in cottage-tests still has stale references — needs regeneration but won't cause runtime failures.
