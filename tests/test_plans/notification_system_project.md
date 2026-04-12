# Test Plan: Notification System Project

## Overview
**Project**: [Notification System](https://linear.app/public-grid/project/notification-system-8684365eff76)
**Lead**: Butch Castro
**Date**: 2026-04-08
**Tester**: Christian
**Status**: In Progress (early milestones)

## Summary
Centralized notification gateway (`@pg/notifications`) that replaces the current fragmented notification system. Today, callers (Inngest functions, Lambdas, FE API routes) directly invoke `email.send`, `@pg/sms` (Dialpad), or `@pg/slack` independently. This project introduces a single `notification.dispatch` Inngest function that routes notification requests to the appropriate delivery handler based on channel (email, SMS, Slack), with user preference support, logging, and webhook-based delivery tracking.

**Current state (before project):**
| Channel | Package | Provider | Trigger |
|---------|---------|----------|---------|
| Email | `@pg/mail` | Resend | `email.send` Inngest event → `send-email` function (32+ templates) |
| SMS | `@pg/sms` | Dialpad | Lambda `/dialpad-sms` endpoint |
| Slack | `@pg/slack` | Slack Web API | Direct calls, default channel `dev-needs-off-boarding` |

**Target state (after project):**
All callers → `notification.dispatch` event → routing by channel + user preferences → `email-send` / `send-sms` / `slack.send` handlers → delivery logging + webhook status tracking

**Key FE events that will migrate (Milestone 7):**
- `registration/create` — welcome email + Slack alert
- `household/invitation` — invitation email
- `otp/email-not-found` — "No Account Found" email + Slack alert
- `sets-it-up-yourself/start-email-chain` — utility verification email + reminders
- `bill-upload/confirmation` — bill upload confirmation email
- `household/status-update` — household lifecycle

## Project Milestones & Test Scope

| # | Milestone | Progress | QA Impact | Test Type |
|---|-----------|----------|-----------|-----------|
| 1 | Database Schema | 25% | High | DB validation (Supabase) |
| 2 | Package, Inngest Functions & Infrastructure | 25% | Medium | Code review, infra validation |
| 3 | Notification Dispatch & Pilot Migration | 25% | **Critical** | E2E delivery, parity |
| 4 | Caller Migration & Cleanup (5 batches) | 4% | **Critical** | Regression per batch |
| 5 | Notification Logging & Webhooks | 0% | High | Log validation, webhook handling |
| 6 | Frontend Preferences & PG-Admin Logs | 0% | **Critical** | E2E (user-facing) |
| 7 | FE Caller Migration | 0% | **Critical** | Full email regression |
| 8 | Slack Notification Integration | 0% | Medium | Slack delivery validation |

---

## Milestone 1: Database Schema

### Context
New tables for notification preferences — enums, tables, seed data, RLS policies, and backfill of existing users.

### Test Cases

#### TC-1.1: Schema Validation
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 1.1.1 | Verify `NotificationTopic` enum exists with expected values (email, sms, slack) | Supabase SQL | High |
| 1.1.2 | Verify `NotificationCategory` enum exists (billing, onboarding, alerts, system, etc.) | Supabase SQL | High |
| 1.1.3 | Verify `NotificationMapping` table exists with correct columns and constraints | Supabase SQL | High |
| 1.1.4 | Verify `NotificationConfig` table exists — links topic + category + scope + user preferences | Supabase SQL | High |
| 1.1.5 | Verify foreign key relationships between notification tables and `CottageUsers`/`LightUsers` | Supabase SQL | High |
| 1.1.6 | Verify seed data populates default notification configurations for all channels | Supabase SQL | High |
| 1.1.7 | Verify RLS policies — users can only read/update their own notification preferences | Supabase SQL | High |
| 1.1.8 | Verify `isLocked` flag prevents user modification of system-required notifications | Supabase SQL | Medium |

#### TC-1.2: Backfill Validation
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 1.2.1 | Verify existing CottageUsers receive default notification preference rows | Supabase SQL | Critical |
| 1.2.2 | Verify existing LightUsers receive default notification preference rows | Supabase SQL | Critical |
| 1.2.3 | Verify backfill is idempotent — running twice doesn't create duplicate rows | Supabase SQL | High |
| 1.2.4 | Verify default preferences match expected opt-in/opt-out state per category | Supabase SQL | High |
| 1.2.5 | Verify users created after migration also get default preferences (trigger or app logic) | Supabase SQL + E2E | High |

#### Validation Queries (to prepare)
```sql
-- Check enum values
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'NotificationTopic';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'NotificationConfig';

-- Verify backfill coverage
SELECT COUNT(*) as total_users,
       COUNT(nc."id") as users_with_prefs
FROM "CottageUser" cu
LEFT JOIN "NotificationConfig" nc ON nc."userId" = cu."id"
GROUP BY cu."id"
HAVING COUNT(nc."id") = 0;  -- users missing preferences
```

---

## Milestone 2: Package, Inngest Functions & Infrastructure

### Context
`@pg/notifications` package creation, `pg-notifications` Inngest app, client factory, serve handler, SST infrastructure.

### Test Cases

#### TC-2.1: Infrastructure Validation
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 2.1.1 | Verify `pg-notifications` Inngest app is deployed and visible in Inngest dashboard (dev) | Manual / Inngest dashboard | High |
| 2.1.2 | Verify `notification.dispatch` function is registered in the Inngest app | Inngest dashboard | High |
| 2.1.3 | Verify `email-send` function exists under the new notification app (or remains in pg-payments) | Inngest dashboard | Medium |
| 2.1.4 | Verify `send-sms` function is registered and routable | Inngest dashboard | High |
| 2.1.5 | Verify SST infrastructure deploys without errors (Lambda/function URLs accessible) | Deploy logs | Medium |

#### TC-2.2: Code Review Checklist
| # | Check | Priority |
|---|-------|----------|
| 2.2.1 | `@pg/notifications` exports a clean public API (dispatch function, types, config) | High |
| 2.2.2 | Inngest client factory uses correct event key routing (separate from `pg-payments`) | Critical |
| 2.2.3 | Error handling — dispatch failures don't crash caller, retries configured | High |
| 2.2.4 | Concurrency/throttle limits match or exceed current `email.send` limits (10 prod / 5 non-prod) | High |
| 2.2.5 | TypeScript types exported for all notification event payloads | Medium |

---

## Milestone 3: Notification Dispatch & Pilot Migration

### Context
The core gateway: `notification.dispatch` routes requests by channel. `sms.send` handler added. One pilot caller proves the full flow. `send_email` removed from `pg-payments`.

### Test Cases

#### TC-3.1: Dispatch Routing
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 3.1.1 | Dispatch with `channel: "email"` routes to email handler and delivers email | Inngest API + Fastmail | Critical |
| 3.1.2 | Dispatch with `channel: "sms"` routes to SMS handler and delivers SMS | Inngest API + Dialpad logs | Critical |
| 3.1.3 | Dispatch with invalid channel returns error / dead-letters gracefully | Inngest API | High |
| 3.1.4 | Dispatch respects user notification preferences — opted-out user does NOT receive notification | Inngest API + Supabase | Critical |
| 3.1.5 | Dispatch for `isLocked: true` notification ignores user opt-out (system-required) | Inngest API + Supabase | High |
| 3.1.6 | Dispatch with missing required fields fails with descriptive error | Inngest API | High |
| 3.1.7 | Dispatch idempotency — same event ID does not send duplicate notifications | Inngest API | High |

#### TC-3.2: Email Delivery Parity (Pilot Caller)
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 3.2.1 | Pilot caller sends email via `notification.dispatch` — email received with correct template | E2E + Fastmail | Critical |
| 3.2.2 | Email content matches previous `email.send` output (subject, body, links, formatting) | Fastmail JMAP comparison | Critical |
| 3.2.3 | Email sender identity is correct (from address, reply-to) | Fastmail JMAP | High |
| 3.2.4 | Rate limiting behavior matches current `email.send` (concurrency 10 prod / 5 non-prod) | Load test | Medium |

#### TC-3.3: SMS Delivery
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 3.3.1 | `sms.send` handler delivers SMS via Dialpad API | Inngest API + Dialpad logs | Critical |
| 3.3.2 | SMS with invalid phone number fails gracefully (no crash, error logged) | Inngest API | High |
| 3.3.3 | SMS content matches expected template/message | Dialpad logs | High |
| 3.3.4 | SMS respects user opt-out preference | Inngest API + Supabase | High |

#### TC-3.4: send_email Removal from pg-payments
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 3.4.1 | `email.send` event no longer handled by `pg-payments` app | Inngest dashboard | Critical |
| 3.4.2 | All callers that previously sent `email.send` now send `notification.dispatch` (or are queued for migration) | Code review | Critical |
| 3.4.3 | No orphaned event listeners — no function is "listening" for `email.send` without a handler | Inngest dashboard | High |

#### Email Verification Pattern
```bash
# Trigger dispatch in dev
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "notification.dispatch",
    "data": {
      "channel": "email",
      "emailType": "<template>",
      "to": "pgtest+notif-test@joinpublicgrid.com",
      "subject": "Test notification",
      ...
    }
  }'

# Verify delivery via Fastmail JMAP (wait ~5s)
# Use fastmail-otp-retrieval pattern from memory
```

---

## Milestone 4: Caller Migration & Cleanup (5 Batches)

### Context
All remaining callers migrate from direct `email.send`/SMS to `notification.dispatch`. This is the highest-risk milestone — any regression means users don't receive critical notifications.

### Known Callers to Migrate (from services repo)
| Caller | Email Type(s) | Priority |
|--------|---------------|----------|
| Billing | `bill-paid`, `bill-payment-failed`, `update-payment-method` | Critical |
| Ledger | `ledger-auto-pay-ready`, `ledger-flex-ready`, `ledger-manual-pay-ready` | Critical |
| Subscriptions | `subscription-renewal-reminder`, `subscription-payment-failed/success` | Critical |
| Onboarding | `finish-registration`, `start-service-email`, `move-in-email` | Critical |
| Light | `light-drop-off`, `light-contract-end` | High |
| Household | `household-invitation`, `self-service-alert` | High |
| Payment reminders | `ledger.payment.reminders` pipeline | Critical |
| Preparing for move | `preparing-for-move` touchpoint email | Medium |

### Test Strategy Per Batch
Each of the 5 migration batches requires:

| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 4.x.1 | **Pre-migration baseline**: Trigger each caller's notification via current path, capture email content | Fastmail JMAP | Critical |
| 4.x.2 | **Post-migration delivery**: Same trigger produces same email via `notification.dispatch` path | Fastmail JMAP | Critical |
| 4.x.3 | **Content parity**: Subject, body HTML, links, dynamic data (name, amount, date) match baseline | Fastmail JMAP diff | Critical |
| 4.x.4 | **Timing parity**: Email arrives within similar timeframe (< 30s for event-triggered) | Fastmail JMAP timestamps | High |
| 4.x.5 | **Error path**: Caller with invalid data still fails gracefully (no silent drops) | Inngest dashboard | High |
| 4.x.6 | **No duplicate sends**: Migration doesn't cause both old and new path to fire | Fastmail JMAP count | Critical |
| 4.x.7 | **Rollback safety**: If new path fails, is there a fallback or clear error? | Code review | High |

### Batch Regression Approach
After each batch merges:
1. Run smoke suite: `PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Smoke`
2. Trigger each migrated caller's notification in dev
3. Verify delivery via Fastmail JMAP
4. Check Inngest dashboard for failed functions
5. Verify no `email.send` events still being emitted by migrated callers

---

## Milestone 5: Notification Logging & Webhooks

### Context
Every dispatch attempt is logged. Webhook handlers for Resend (email) and Dialpad (SMS) track delivery status via `providerMessageID`.

### Test Cases

#### TC-5.1: Notification Logging
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 5.1.1 | Successful email dispatch creates a log entry with status `sent` | Supabase SQL | Critical |
| 5.1.2 | Successful SMS dispatch creates a log entry with status `sent` | Supabase SQL | Critical |
| 5.1.3 | Failed dispatch (invalid recipient, provider error) creates log entry with status `failed` | Supabase SQL | High |
| 5.1.4 | Log entry contains: timestamp, channel, recipient, template/type, providerMessageID, status | Supabase SQL | High |
| 5.1.5 | Opted-out notification creates log entry with status `suppressed` (not `sent`) | Supabase SQL | High |
| 5.1.6 | Log entries are queryable by userId, channel, date range | Supabase SQL | Medium |
| 5.1.7 | Log table has appropriate indexes for common query patterns | Supabase SQL | Medium |

#### TC-5.2: Resend Webhooks (Email)
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 5.2.1 | Resend `email.delivered` webhook updates log entry status to `delivered` | Webhook + Supabase SQL | Critical |
| 5.2.2 | Resend `email.bounced` webhook updates log entry status to `bounced` | Webhook + Supabase SQL | High |
| 5.2.3 | Resend `email.complained` webhook updates log entry status to `complained` | Webhook + Supabase SQL | Medium |
| 5.2.4 | Webhook with unknown `providerMessageID` is handled gracefully (no crash) | Webhook | High |
| 5.2.5 | Webhook signature verification — rejects unsigned/tampered payloads | Webhook | High |

#### TC-5.3: Dialpad Webhooks (SMS)
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 5.3.1 | Dialpad delivery webhook updates log entry status to `delivered` | Webhook + Supabase SQL | Critical |
| 5.3.2 | Dialpad failure webhook updates log entry status to `failed` | Webhook + Supabase SQL | High |
| 5.3.3 | Webhook with unknown `providerMessageID` handled gracefully | Webhook | High |

#### Validation Queries
```sql
-- Check notification log for a specific user
SELECT * FROM "NotificationLog"
WHERE "userId" = '<user-id>'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check delivery status updates from webhooks
SELECT "id", "channel", "status", "providerMessageID", "createdAt", "updatedAt"
FROM "NotificationLog"
WHERE "providerMessageID" = '<resend-message-id>';
```

---

## Milestone 6: Frontend Preferences & PG-Admin Notification Logs

### Context
User-facing notification preferences UI in the customer app (`/app/*`) and notification logs tab in PG-Admin.

### Test Cases

#### TC-6.1: Customer App — Notification Preferences UI
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 6.1.1 | Preferences page is accessible from user settings/account | Playwright E2E | Critical |
| 6.1.2 | All notification categories are displayed with current opt-in/opt-out state | Playwright E2E | Critical |
| 6.1.3 | Toggle a preference OFF → DB `NotificationConfig` updated → notification suppressed | Playwright + Supabase | Critical |
| 6.1.4 | Toggle a preference ON → DB updated → notification delivered | Playwright + Supabase | Critical |
| 6.1.5 | `isLocked` notifications show as non-toggleable (disabled/greyed out with explanation) | Playwright E2E | High |
| 6.1.6 | Email channel preferences shown separately from SMS preferences | Playwright E2E | High |
| 6.1.7 | Changes persist across page reload / re-login | Playwright E2E | High |
| 6.1.8 | New user sees all defaults as opted-in (unless category default is opt-out) | Playwright E2E | High |
| 6.1.9 | Accessibility: all toggles keyboard-navigable, proper ARIA labels | Playwright E2E | Medium |
| 6.1.10 | Mobile responsiveness — preferences page renders correctly on mobile viewports | Playwright E2E | Medium |

#### TC-6.2: PG-Admin — Notification Logs Tab
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 6.2.1 | Notification logs tab is visible on user detail page in PG-Admin | Playwright E2E (admin) | Critical |
| 6.2.2 | Logs display: timestamp, channel, type/template, status, providerMessageID | Playwright E2E (admin) | Critical |
| 6.2.3 | Logs are sorted by most recent first | Playwright E2E (admin) | High |
| 6.2.4 | Filter by channel (email, SMS) works correctly | Playwright E2E (admin) | High |
| 6.2.5 | Filter by status (sent, delivered, failed, bounced, suppressed) works | Playwright E2E (admin) | High |
| 6.2.6 | Filter by date range returns correct results | Playwright E2E (admin) | Medium |
| 6.2.7 | Pagination works for users with many notifications | Playwright E2E (admin) | Medium |
| 6.2.8 | Suppressed notifications clearly marked with reason (user opted out) | Playwright E2E (admin) | Medium |

#### Test Data Setup
```sql
-- Create test user with specific notification preferences for testing
-- (Use move-in flow to create billing user, then modify preferences)
UPDATE "NotificationConfig"
SET "value" = false
WHERE "userId" = '<test-user-id>'
  AND "topic" = 'email'
  AND "category" = 'billing';
```

---

## Milestone 7: FE Caller Migration to notification.dispatch

### Context
Migrate all cottage-nextjs email and SMS sends from direct Inngest functions to `notification.dispatch` events via the shared Inngest event bus. No Lambda endpoint needed — FE sends `notification.dispatch` directly.

### Known FE Events to Migrate
| Current Event | Trigger Location | Notification Type |
|---------------|-----------------|-------------------|
| `registration/create` | `/api/registration/create` | Welcome email + Slack alert |
| `household/invitation` | `/api/household/invite-resident` | Invitation email |
| `otp/email-not-found` | `backend-shared/otp-email-not-found.ts` | "No Account Found" email + Slack alert |
| `sets-it-up-yourself/start-email-chain` | `/api/registration/do-it-later-*` | Utility verification email + reminders |
| `sets-it-up-yourself/send-reminder` | Chained from above | Reminder emails (24h intervals) |
| `household/status-update` | Household lifecycle | Status change notifications |
| `bill-upload/confirmation` | `/api/bill-upload/send-confirmation-email` | Bill upload confirmation |

### Test Cases

#### TC-7.1: Registration Email Parity
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.1.1 | Complete move-in flow → welcome email received with correct content | Playwright + Fastmail | Critical |
| 7.1.2 | Welcome email subject, body, links match pre-migration baseline | Fastmail JMAP comparison | Critical |
| 7.1.3 | Slack alert fires on registration (same channel, same content) | Slack channel check | High |
| 7.1.4 | Finish-registration email still works end-to-end | API + Fastmail | Critical |

#### TC-7.2: Household Invitation Parity
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.2.1 | Invite resident → invitation email received | Playwright + Fastmail | Critical |
| 7.2.2 | Email contains correct invite link, resident name, property address | Fastmail JMAP | Critical |
| 7.2.3 | Invitation email body not blank (regression — `FRONTEND_URL` env var) | Fastmail JMAP | Critical |

#### TC-7.3: OTP / Email-Not-Found Parity
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.3.1 | Sign-in with unregistered email → "No Account Found" email received | Playwright + Fastmail | High |
| 7.3.2 | Slack alert fires on email-not-found event | Slack channel check | Medium |

#### TC-7.4: Utility Verification / Do-It-Later Parity
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.4.1 | "Set it up myself" path → utility verification email received | Playwright + Fastmail | High |
| 7.4.2 | Reminder chain fires at 24h intervals (verify at least first reminder) | Fastmail JMAP + Inngest dashboard | High |

#### TC-7.5: Bill Upload Confirmation Parity
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.5.1 | Complete bill upload → confirmation email received | Playwright + Fastmail | High |
| 7.5.2 | Email content matches pre-migration baseline | Fastmail JMAP | High |

#### TC-7.6: Cross-Cutting FE Migration Checks
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 7.6.1 | No FE code still imports/sends old event names (`registration/create`, `household/invitation`, etc.) | Code review (grep) | Critical |
| 7.6.2 | TanStack server functions dispatch `notification.dispatch` (not old events) | Code review + browser console | Critical |
| 7.6.3 | Inngest event key routing correct — FE events reach `pg-notifications` app (not `pg-payments`) | Inngest dashboard | Critical |
| 7.6.4 | `[Server] LOG` errors in browser console don't show notification dispatch failures | Playwright MCP console | High |

---

## Milestone 8: Slack Notification Integration

### Context
Add Slack as a delivery channel through `notification.dispatch`. Single `NotificationMapping` + `NotificationConfig` row for system Slack notifications. New `slack.send` Inngest function. Migrate all direct Slack API calls.

### Test Cases

#### TC-8.1: Slack Delivery via Gateway
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 8.1.1 | Dispatch with `channel: "slack"` delivers message to correct Slack channel | Inngest API + Slack channel | Critical |
| 8.1.2 | Slack message format includes environment prefix (`[dev]`, `[staging]`, `[prod]`) | Slack channel | High |
| 8.1.3 | Invalid Slack channel fails gracefully with error log | Inngest dashboard + NotificationLog | High |
| 8.1.4 | `isLocked: true` on Slack system notifications — cannot be toggled off by users | Supabase SQL | High |

#### TC-8.2: Slack Caller Migration
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 8.2.1 | Registration Slack alert (services) fires via `notification.dispatch` | Slack channel | High |
| 8.2.2 | Waitlist Slack alert (cottage-nextjs `#wait-list` channel) fires via dispatch | Slack channel | High |
| 8.2.3 | Off-boarding Slack alert (`dev-needs-off-boarding` channel) fires via dispatch | Slack channel | High |
| 8.2.4 | OTP email-not-found Slack alert fires via dispatch | Slack channel | Medium |
| 8.2.5 | No direct `@pg/slack` imports remain in services or cottage-nextjs | Code review (grep) | Critical |

#### TC-8.3: PG-Admin Slack Notification Logs
| # | Test Case | Method | Priority |
|---|-----------|--------|----------|
| 8.3.1 | Notification logs page in PG-Admin shows Slack notifications scoped to `public-grid` configs | Playwright E2E (admin) | High |
| 8.3.2 | Slack notification logs display channel name, message preview, timestamp | Playwright E2E (admin) | Medium |

---

## End-to-End Regression Scenarios

These cross-cutting scenarios should be run after each milestone completes to verify no regressions:

### E2E-1: Move-In → All Notifications
| Step | Action | Verify |
|------|--------|--------|
| 1 | Complete standard move-in (`autotest`) | Welcome email received |
| 2 | Set startDate to +2 days | Preparing-for-move email fires (dev: via Inngest event) |
| 3 | Insert approved bill | Bill-paid email after ledger + capture cron |
| 4 | Fail a payment (expired card) | Payment-failed email received |
| 5 | Trigger payment reminder | Reminder email received |

### E2E-2: Household Invite → Accept → Notifications
| Step | Action | Verify |
|------|--------|--------|
| 1 | Existing user invites new resident | Invitation email with link received |
| 2 | New resident clicks link, completes registration | Welcome email received |
| 3 | Check notification logs in PG-Admin | Both emails logged with `delivered` status |

### E2E-3: Notification Preferences → Suppression
| Step | Action | Verify |
|------|--------|--------|
| 1 | User opts out of billing email notifications | Preference saved in DB |
| 2 | Trigger billing notification (bill-paid) | Email NOT received |
| 3 | Check notification log | Entry with status `suppressed` |
| 4 | User opts back in | Preference updated |
| 5 | Trigger billing notification again | Email received, log status `sent` → `delivered` |

### E2E-4: Multi-Channel Notification
| Step | Action | Verify |
|------|--------|--------|
| 1 | Trigger notification that routes to email + Slack | Both delivered |
| 2 | User opts out of email for that category | Email suppressed, Slack still delivered |
| 3 | Check notification logs | Email: `suppressed`, Slack: `sent` |

---

## Test Data Requirements

| Need | Setup Method | Notes |
|------|-------------|-------|
| Billing user (CottageUser) | Move-in via `autotest` shortcode | `maintainedFor` IS NOT NULL |
| Non-billing user | Move-in via `pgtest` + "set it up myself" | `maintainedFor` IS NULL |
| LightUser | Move-in via Light flow (2900 Canton St, unit 524) | Phone: `(646) 437-6170` |
| User with modified preferences | Supabase SQL update after creation | Toggle specific categories |
| User with bills | Billing move-in + bill insert + cron pipeline | Sequential: approved → ledger → capture |
| Household host + invitee | Move-in host + invite via dashboard | Need 2 email addresses |
| PG-Admin access | Existing admin credentials | For notification logs testing |

### Test Email Pattern
```
pgtest+notif-m{milestone}-{scenario}@joinpublicgrid.com
```
Examples:
- `pgtest+notif-m3-dispatch-email@joinpublicgrid.com`
- `pgtest+notif-m6-prefs-toggle@joinpublicgrid.com`
- `pgtest+notif-m7-registration@joinpublicgrid.com`

---

## Tools & Verification Methods

| Tool | Use For |
|------|---------|
| **Fastmail JMAP** | Verify email delivery, content, subject, timing (Node.js script in memory) |
| **Supabase MCP** | Query notification tables, preferences, logs, verify backfill |
| **Inngest Dashboard** | Verify function registration, event routing, failures, retries |
| **Playwright MCP** | Interactive UI testing (preferences page, admin logs) |
| **Playwright Runner** | Automated E2E specs for preferences UI (Milestone 6+) |
| **GitHub MCP / CLI** | PR review, code search for migration completeness |
| **Slack** | Verify Slack message delivery (manual or API) |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Silent email drops during migration | Critical — users miss billing/payment emails | Pre/post content comparison per batch; monitor Inngest failure dashboard |
| Inngest event key routing mismatch | Critical — events go to wrong app | Verify event key routes to `pg-notifications` app in each environment |
| Duplicate sends during cutover | High — user receives 2x of every email | Verify old handler is removed before/concurrent with new handler activation |
| Preference backfill misses users | High — some users can't manage preferences | Count validation: total users == users with preference rows |
| Webhook signature bypass | Medium — spoofed delivery statuses | Verify signature validation in code review |
| FE `[Server] LOG` errors after migration | Medium — notifications fail silently on TanStack | Monitor browser console during E2E runs for `[Server]` prefixed errors |
| Rate limit changes | Medium — Resend/Dialpad throttle differently under new dispatch | Compare concurrency config; load test in dev |
| `FRONTEND_URL` env var missing (TanStack) | High — blank email bodies (known issue from household invite) | Verify env var in all environments before FE migration |

---

## Automation Candidates

Tests that should become automated Playwright specs:

| Spec | Milestone | Priority |
|------|-----------|----------|
| `notification_preferences_toggle.spec.ts` | M6 | Critical |
| `notification_preferences_locked.spec.ts` | M6 | High |
| `admin_notification_logs.spec.ts` | M6 | High |
| `move_in_welcome_email.spec.ts` (update existing) | M7 | Critical |
| `household_invitation_email.spec.ts` (update existing) | M7 | Critical |
| `notification_dispatch_email.spec.ts` (API test) | M3 | High |
| `notification_dispatch_sms.spec.ts` (API test) | M3 | High |

---

## Test Execution Order

| Phase | When | What |
|-------|------|------|
| **Phase 1** | M1 merges | DB schema validation (TC-1.x) — Supabase queries only |
| **Phase 2** | M2 merges | Infrastructure check (TC-2.x) — Inngest dashboard + code review |
| **Phase 3** | M3 merges | Core dispatch testing (TC-3.x) — first real delivery tests |
| **Phase 4** | M4 per batch | Batch regression (TC-4.x) — repeat per batch, 5 rounds |
| **Phase 5** | M5 merges | Logging + webhook validation (TC-5.x) |
| **Phase 6** | M6 merges | E2E UI testing (TC-6.x) — first Playwright specs |
| **Phase 7** | M7 merges | FE parity regression (TC-7.x) — heaviest testing phase |
| **Phase 8** | M8 merges | Slack integration (TC-8.x) |
| **Final** | All milestones | Full E2E regression scenarios (E2E-1 through E2E-4) |

---

## UX Improvement Opportunities

| # | Observation | Suggestion | Milestone |
|---|-------------|------------|-----------|
| UX-1 | Users may not know notification preferences exist | Add onboarding tooltip or banner when preferences page launches | M6 |
| UX-2 | Bulk opt-out could be dangerous (miss critical billing emails) | Add confirmation dialog for "turn off all" with warning about billing emails | M6 |
| UX-3 | No notification history visible to users (only admin) | Consider read-only notification log for users ("Recent notifications") | M6+ |
| UX-4 | SMS opt-in requires `didConsentTextMessage` from registration but isn't wired | Ensure SMS preferences respect original consent flag; don't enable SMS for users who didn't consent | M3/M6 |
| UX-5 | Locked notifications may confuse users ("why can't I turn this off?") | Clear helper text: "This notification is required for your account" | M6 |
