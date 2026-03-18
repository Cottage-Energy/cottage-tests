# Test Plan: Transfer Incomplete Email Reminder Job

## Overview
**Ticket**: [ENG-2429](https://linear.app/public-grid/issue/ENG-2429/task-transfer-incomplete-email-reminder-job)
**PR**: [services#291](https://github.com/Cottage-Energy/services/pull/291) (`feat/transfer-incomplete-email-job`)
**Date**: 2026-03-17
**Tester**: Christian

## Feature Summary

Three Inngest functions in the `services` repo that form an email reminder chain for users with `TRANSFER_INCOMPLETE` accounts:

1. **Trigger** (`transfer-incomplete-trigger`) — Daily cron (10 AM ET in prod) or dev event. Queries `ElectricAccount` and `GasAccount` for `TRANSFER_INCOMPLETE` accounts with `startDate` ≤ 14 days from now, `transferIncompleteEmailSentAt IS NULL`, and non-null `cottageUserID`/`propertyID`. Fans out one `onboarding/transfer-incomplete-process` event per matching account.

2. **Process** (`transfer-incomplete-process`) — Per-property processor, deduped by `propertyID` via Inngest idempotency. Sends initial "Complete your registration" email with JWT resume URL (7d expiry) and opt-out URL. Marks all matching accounts at the property with `transferIncompleteEmailSentAt`. Schedules first reminder.

3. **Reminder** (`transfer-incomplete-reminder`) — Waits 24h (prod) / 3m (dev), checks if accounts are still `TRANSFER_INCOMPLETE`, sends reminder if so. Max 3 reminders (4 total emails). Final attempt checks overdue status. Deduped by `propertyID + attempt`.

### Code Location
- `packages/inngest/functions/onboarding/transfer-incomplete-chain.ts` (371 lines)
- Registered in `packages/lambda/src/inngest.ts`

---

## Scope

### In Scope
- Trigger function: account selection criteria (AC-1 through AC-5)
- Process function: email send, DB marking, dedup, skip conditions (AC-6 through AC-10)
- Reminder function: wait/check/send chain, max attempts, overdue logic, dedup (AC-11 through AC-18)
- Re-trigger safety (AC-19)
- Resume URL / finish-registration page navigation
- Email content verification via Fastmail

### Out of Scope
- Finish-registration form completion flow (covered by existing transfer flow tests)
- Opt-out URL behavior (separate feature, not implemented in this PR)
- Email template rendering/design (handled by mailing service)
- Inngest infrastructure reliability (platform responsibility)

### Prerequisites
- Dev environment access with Inngest event triggering capability
- Test accounts with `TRANSFER_INCOMPLETE` status in `ElectricAccount`/`GasAccount`
- Fastmail access for email verification (existing infrastructure)
- Supabase access for DB state setup and verification
- `INNGEST_EVENT_KEY` for dev environment (needed for direct event sends)

### Dependencies
- Inngest event bus (`onboarding/transfer-incomplete-trigger`, `onboarding/transfer-incomplete-process`, `onboarding/transfer-incomplete-reminder`, `email.send`)
- Fastmail client for email interception
- JWT secret (`EXTERNAL_API_JWT_SECRET`) for resume URL generation
- Frontend `/finish-registration` page for resume URL handling

---

## Test Cases

### Trigger Function — Account Selection

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-001 | Correct accounts selected — TRANSFER_INCOMPLETE, no email sent, startDate within 14 days | AC-1 | 1. Set up ElectricAccount: `status=TRANSFER_INCOMPLETE`, `transferIncompleteEmailSentAt=NULL`, `startDate` = 7 days from now, non-null `cottageUserID`/`propertyID` 2. Trigger event `onboarding/transfer-incomplete-trigger` in dev 3. Wait for processing 4. Query account | `transferIncompleteEmailSentAt` is now set (account was picked up and processed) | P0 | Yes |
| TC-002 | Already-emailed accounts excluded | AC-2 | 1. Set up account with `transferIncompleteEmailSentAt` already set to a past timestamp 2. Trigger event 3. Query account | `transferIncompleteEmailSentAt` unchanged — account was NOT re-processed | P0 | Yes |
| TC-003 | Far-future accounts excluded (>14 days) | AC-3 | 1. Set up TRANSFER_INCOMPLETE account with `startDate` = 30 days from now 2. Trigger event 3. Query account | `transferIncompleteEmailSentAt` remains NULL — account was NOT picked up | P1 | Yes |
| TC-004 | Overdue accounts included (startDate in past) | AC-4 | 1. Set up TRANSFER_INCOMPLETE account with `startDate` = 7 days ago 2. Trigger event 3. Query account | `transferIncompleteEmailSentAt` is set — account WAS picked up (no lower bound filter) | P1 | Yes |
| TC-005 | Accounts with NULL cottageUserID excluded | AC-5 | 1. Set up TRANSFER_INCOMPLETE account with `cottageUserID = NULL` 2. Trigger event 3. Query account | `transferIncompleteEmailSentAt` remains NULL | P1 | Yes |
| TC-006 | Accounts with NULL propertyID excluded | AC-5 | 1. Set up TRANSFER_INCOMPLETE account with `propertyID = NULL` 2. Trigger event 3. Query account | `transferIncompleteEmailSentAt` remains NULL | P1 | Yes |
| TC-007 | GasAccount also selected | AC-1 | 1. Set up qualifying GasAccount (same criteria as TC-001 but on GasAccount table) 2. Trigger event 3. Query GasAccount | `transferIncompleteEmailSentAt` is set on GasAccount | P1 | Yes |
| TC-008 | No matching accounts — trigger returns early | — | 1. Ensure no TRANSFER_INCOMPLETE accounts match criteria 2. Trigger event | Function returns `{ accountsCount: 0 }`, no events emitted | P2 | No |

### Process Function — Email Send & DB Updates

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-009 | Property-level dedup — two accounts, one email | AC-6 | 1. Set up 1 ElectricAccount + 1 GasAccount at same `propertyID`, both TRANSFER_INCOMPLETE 2. Trigger full chain 3. Check Fastmail inbox | Only 1 email received (not 2) — Inngest idempotency on `propertyID` dedupes | P0 | Yes |
| TC-010 | Email sent with correct subject | AC-7 | 1. Trigger chain for qualifying account 2. Fetch email from Fastmail | Subject = "Complete your registration with Public Grid" | P0 | Yes |
| TC-011 | Email contains valid resume URL | AC-7 | 1. Trigger chain 2. Fetch email body 3. Extract `resumeUrl` 4. Navigate to URL in Playwright | URL contains `/finish-registration?token=...`, page loads successfully, JWT is valid | P0 | Yes |
| TC-012 | Email contains opt-out URL | AC-7 | 1. Fetch email body 2. Extract `optOutUrl` | URL = `resumeUrl` + `&optOutOption=true` | P1 | Yes |
| TC-013 | Email contains formatted start date | AC-7 | 1. Set up account with `startDate = '2026-04-15'` 2. Trigger chain 3. Fetch email body | Email body contains "April 15, 2026" (MMMM D, YYYY format) | P1 | Yes |
| TC-014 | Initial email has isOverdue = false | AC-7 | 1. Trigger chain 2. Verify email content | Email does NOT contain overdue messaging | P2 | Yes |
| TC-015 | Start date uses earliest across all accounts at property | AC-7 | 1. Set up ElectricAccount `startDate = '2026-04-20'` + GasAccount `startDate = '2026-04-10'` at same property 2. Trigger chain 3. Fetch email | Email contains "April 10, 2026" (the earlier date) | P1 | Yes |
| TC-016 | All matching accounts marked with timestamp | AC-8 | 1. Set up 1 electric + 1 gas TRANSFER_INCOMPLETE at same property 2. Trigger chain 3. Query both accounts | Both have `transferIncompleteEmailSentAt` set to approximately current timestamp | P0 | Yes |
| TC-017 | No email if user has no email | AC-9 | 1. Set up qualifying account where `CottageUsers.email` is NULL for the `cottageUserID` 2. Trigger chain 3. Check Fastmail + DB | No email sent, function returns `{ status: "skipped" }`, accounts NOT marked | P1 | No |
| TC-018 | First reminder scheduled after initial send | AC-10 | 1. Trigger chain for qualifying account 2. Check Inngest dashboard or wait for reminder | `onboarding/transfer-incomplete-reminder` event emitted with `attempt: 0` | P1 | No |

### Reminder Function — 24h Chain

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-019 | Reminder waits before sending (dev: 3m) | AC-11 | 1. Trigger initial chain 2. Note timestamp 3. Wait for reminder email 4. Note reminder timestamp | Reminder email arrives ~3 minutes after initial (in dev) | P1 | No |
| TC-020 | Reminder stops if all accounts resolved | AC-12 | 1. Trigger chain for qualifying account 2. Before reminder fires, update all accounts at property to a non-TRANSFER_INCOMPLETE status 3. Wait for reminder window | No reminder email sent, function returns `{ status: "skipped" }` | P0 | Yes |
| TC-021 | Reminder sends if still TRANSFER_INCOMPLETE | AC-13 | 1. Trigger chain 2. Leave accounts as TRANSFER_INCOMPLETE 3. Wait for reminder | Reminder email received with subject "Reminder: Complete your registration with Public Grid" + fresh JWT URL | P0 | Yes |
| TC-022 | Max 4 emails total (1 initial + 3 reminders) | AC-14 | 1. Trigger chain 2. Leave accounts unresolved through full chain 3. Count all emails in Fastmail | Exactly 4 emails: 1 initial + 3 reminders (attempts 0, 1, 2). No 5th email. | P0 | No |
| TC-023 | Final reminder — overdue (startDate in past) | AC-15 | 1. Set up account with `startDate` in the past 2. Run full chain through attempt 3 3. Fetch final email | Subject = "Final step: Complete your registration with Public Grid", `isOverdue: true` | P1 | No |
| TC-024 | Final reminder — not overdue (startDate in future) | AC-16 | 1. Set up account with `startDate` in the future 2. Run full chain through attempt 3 3. Fetch final email | Subject = "Reminder: Complete your registration with Public Grid", `isOverdue: false` | P1 | No |
| TC-025 | Reminder uses fresh email from CottageUsers | AC-17 | 1. Trigger chain for user with email A 2. Before reminder fires, update `CottageUsers.email` to email B 3. Wait for reminder | Reminder sent to email B (not email A) | P2 | No |
| TC-026 | Reminder dedup — duplicate events | AC-18 | 1. Send duplicate `onboarding/transfer-incomplete-reminder` events with same `propertyID + attempt` 2. Wait for processing | Only 1 reminder email sent (Inngest idempotency: `propertyID + attempt`) | P2 | No |

### Re-trigger Safety

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-027 | No duplicate chains on next cron run | AC-19 | 1. Trigger chain — account gets `transferIncompleteEmailSentAt` set 2. Trigger cron again 3. Check if account re-processed | Account NOT picked up again — `transferIncompleteEmailSentAt IS NULL` filter excludes it, even though still TRANSFER_INCOMPLETE | P0 | Yes |

### Resume URL / Finish Registration

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-028 | Resume URL navigates to finish-registration | AC-7 | 1. Extract resume URL from email 2. Navigate to `{baseUrl}/finish-registration?token=...` in Playwright 3. Verify page loads | Finish registration page loads, user context populated from JWT claims | P0 | Yes |
| TC-029 | Resume URL contains correct JWT claims | AC-7 | 1. Extract token from resume URL 2. Decode JWT (without verification) 3. Check claims | JWT contains: `email`, `leaseId` (= cottageUserID), `userID` (= cottageUserID), `iat`, `exp` (7d from iat) | P1 | No |
| TC-030 | Opt-out URL includes optOutOption param | AC-7 | 1. Extract opt-out URL from email | URL = resume URL + `&optOutOption=true` | P2 | Yes |

### Edge Cases

| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-031 | Electric-only property (no gas account) | 1. Set up property with only ElectricAccount (TRANSFER_INCOMPLETE) 2. Trigger chain | Email sent, only ElectricAccount marked | P2 | Yes |
| TC-032 | Gas-only property (no electric account) | 1. Set up property with only GasAccount (TRANSFER_INCOMPLETE) 2. Trigger chain | Email sent, only GasAccount marked | P2 | Yes |
| TC-033 | Multiple properties for same user | 1. Set up 2 properties with TRANSFER_INCOMPLETE accounts for same `cottageUserID` 2. Trigger chain | 2 separate emails sent (one per property), each with correct property context | P2 | No |
| TC-034 | Account with NULL startDate | 1. Set up TRANSFER_INCOMPLETE account with `startDate = NULL` 2. Trigger chain | Account NOT picked up (`lte("startDate", twoWeeksFromNow)` — NULL comparison returns false) | P3 | No |
| TC-035 | Boundary: startDate exactly 14 days from now | 1. Set up account with `startDate` = exactly 14 days from today 2. Trigger chain | Account IS picked up (`lte` includes the boundary) | P2 | No |
| TC-036 | Boundary: startDate 15 days from now | 1. Set up account with `startDate` = 15 days from today 2. Trigger chain | Account NOT picked up (exceeds 14-day window) | P2 | No |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-037 | transferIncompleteEmailSentAt column exists on ElectricAccount | `SELECT column_name FROM information_schema.columns WHERE table_name='ElectricAccount' AND column_name='transferIncompleteEmailSentAt'` | Column exists, type = `timestamp with time zone`, nullable | P0 |
| TC-038 | transferIncompleteEmailSentAt column exists on GasAccount | Same query for GasAccount | Column exists, type = `timestamp with time zone`, nullable | P0 |
| TC-039 | Existing accounts unaffected by new column | Query accounts that are NOT TRANSFER_INCOMPLETE | `transferIncompleteEmailSentAt` is NULL on all non-TRANSFER_INCOMPLETE accounts | P1 |
| TC-040 | markEmailSent updates correct accounts only | Set up 3 accounts: 2 TRANSFER_INCOMPLETE + 1 ACTIVE at same property. Trigger chain. | Only the 2 TRANSFER_INCOMPLETE accounts get `transferIncompleteEmailSentAt` set; ACTIVE account unchanged | P1 |

---

## Automation Plan

### Automated (Smoke / Regression)
- **Smoke**: TC-001, TC-009, TC-010, TC-016, TC-027, TC-028
  - Core happy path: trigger selects correct accounts, dedup works, email sent, accounts marked, no re-trigger, resume URL works
- **Regression**: TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-011, TC-012, TC-013, TC-015, TC-020, TC-021, TC-031, TC-032, TC-037, TC-038, TC-039, TC-040
  - Selection filters, email content, reminder stop/continue, edge cases, DB verification

### Exploratory / Manual Only
- TC-008 (empty trigger), TC-017 (null email user), TC-018 (Inngest dashboard check), TC-019 (timing verification), TC-022 (full 4-email chain — ~9 min in dev), TC-023 (overdue final), TC-024 (not overdue final), TC-025 (fresh email), TC-026 (reminder dedup), TC-029 (JWT decode), TC-033 (multi-property), TC-034 (null startDate), TC-035/TC-036 (boundary dates)
- These require timing coordination, Inngest dashboard observation, or manual DB manipulation that's impractical for automated runs

### Infrastructure Needed for Automation
1. **Inngest event trigger utility** — function to send `onboarding/transfer-incomplete-trigger` event via Inngest REST API or SDK (needs `INNGEST_EVENT_KEY`)
2. **New Fastmail helper** — `Check_Transfer_Incomplete_Email(email, expectedSubject)` in `fastmail_actions.ts`
3. **DB setup/teardown helpers** — create and clean up TRANSFER_INCOMPLETE accounts with specific `startDate`, `cottageUserID`, `propertyID` values
4. **Wait utility** — configurable wait for Inngest processing + email delivery (~30-60s for initial, ~3-4 min for reminders in dev)

---

## Test Execution Strategy

### Phase 1: Exploratory Testing (Recommended First)
Use Playwright MCP + Supabase MCP to:
1. Find existing TRANSFER_INCOMPLETE accounts in dev DB
2. Trigger the Inngest event manually via Inngest dashboard or API
3. Monitor Inngest dashboard for function execution
4. Check Fastmail for email delivery
5. Navigate to resume URL
6. Verify DB state changes

### Phase 2: Automated Test Scaffolding
After exploratory confirms behavior:
1. Create `tests/e2e_tests/transfer-incomplete-email/` test directory
2. Scaffold DB setup utilities for TRANSFER_INCOMPLETE test accounts
3. Implement Fastmail email verification for transfer-incomplete subjects
4. Build smoke + regression specs

---

## Risks & Notes

1. **Inngest triggering in dev**: Requires `INNGEST_EVENT_KEY` or Inngest dashboard access. If event key is not available, testing is limited to observing the daily cron in production (not ideal).
2. **Timing sensitivity**: Reminder chain uses 3m sleep in dev — automated tests that verify the full chain will be slow (~12-15 min for 4 emails). Consider isolating trigger/process tests from reminder chain tests.
3. **Test data isolation**: Creating TRANSFER_INCOMPLETE accounts for testing must not interfere with real dev data or trigger real emails to real users. Use dedicated test email addresses (Fastmail).
4. **No existing Inngest test infrastructure**: This is the first Inngest job being tested. Any utilities built here (event triggering, wait patterns) should be designed for reuse by future Inngest job tests.
5. **`transferIncompleteEmailSentAt` column is new**: Verify the migration ran in dev before testing. If the column doesn't exist, all queries will fail.
6. **Idempotency keys are per-function-run**: Inngest idempotency for the process function is `event.data.propertyID` — this means if a previous run already processed a property, a new event for the same property will be deduped. Test data should use unique property IDs or understand the idempotency window.
7. **Resume URL JWT expiry**: Token expires in 7 days. Tests should verify the URL works immediately, not after expiry.
