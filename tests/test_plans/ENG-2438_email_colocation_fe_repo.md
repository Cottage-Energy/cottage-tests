# Test Plan: ENG-2438 — Email Co-location for FE Repo

## Overview
**Ticket**: ENG-2438
**Related**: ENG-2340 (Email co-location into services repo)
**PR**: cottage-nextjs #1081 (Refactor/email co-location) — MERGED 2026-03-18
**Services PR**: services #289 (non-billing welcome email fix)
**Date**: 2026-03-19
**Tester**: Christian

## Context
All transactional email templates were migrated from `cottage-nextjs/packages/transactional/` to the `services` repo (`@cottage-energy/mail` package). PR #1081 rewires the FE inngest functions to:
- Replace direct `Resend` usage with `createMailer()` from `@cottage-energy/mail`
- Replace local template imports (`@public-grid/transactional/*`) with `templates.*` from the mailer
- Use `send()` instead of `resend.emails.send()`
- Use `SenderIdentities.WELCOME` instead of hardcoded from addresses

**Risk**: This is a plumbing change — same emails, same triggers, different source for templates and send logic. Primary risk is regression in email delivery or content rendering.

## Scope

### In Scope
- All 13 email types whose inngest functions were modified in PR #1081
- Email delivery verification (email received)
- Email content/rendering verification (matches expected design)
- Sender address and reply-to correctness

### Out of Scope
- Services-side template design/styling (covered by ENG-2340)
- Email performance/delivery speed
- Production email routing (BCC logic)

### Prerequisites
- PR #1081 merged to dev ✅ (2026-03-18)
- Access to Inngest dev dashboard or `INNGEST_EVENT_KEY` for triggering events
- Fastmail access for receiving test emails
- Test user accounts in dev environment

## Emails Affected

### Group A — Standalone Inngest Functions (triggered independently)
| # | Email | Inngest Function | Trigger |
|---|-------|-----------------|---------|
| 1 | OTP Email Not Found | `otp-email-not-found.ts` | Inngest event payload |
| 2 | Household Invitation | `household-invitation.ts` | Inngest event payload |
| 3 | Household Status Update | `household-status-update.ts` | Inngest event payload |
| 4 | Cancel Account | `cancel-account.ts` | Inngest event payload |
| 5 | Bill Upload Confirmation | `bill-upload-confirmation.ts` | Inngest event payload |

### Group B — Utility Verification Chain (do-it-later flow)
| # | Email | Inngest Function | Trigger |
|---|-------|-----------------|---------|
| 6 | Sets It Up Yourself Email Chain | `do-it-later-utility-verification/send-notification.ts` | Inngest event (needs existing account) |
| 7 | Sets It Up Yourself Reminder | `do-it-later-utility-verification/send-reminder.ts` | Inngest event (needs existing account) |

### Group C — Onboarding Flow (multi-step, emailType-driven)
| # | Email | Inngest Function | emailType / Condition |
|---|-------|-----------------|----------------------|
| 8 | Start Service Email | `onboarding-flow.ts` | `emailType: "startService"` |
| 9 | Non-Billing Welcome | `onboarding-flow.ts` | `emailType: "nonBilling"` |
| 10 | Payment Setup Reminder | `onboarding-flow.ts` | `emailType: "setupPayment"` (delayed step) |
| 11 | Move-In Email | `onboarding-flow.ts` | `isMoveIn: true` condition |
| 12 | Educational Email | `onboarding-flow.ts` | Billing customer welcome (delayed step) |

### Group D — Registration
| # | Email | Inngest Function | Condition |
|---|-------|-----------------|-----------|
| 13 | Doc Upload Required | `registration.ts` | `isDocUploadRequired: true` |

## Test Cases

### Happy Path — Email Delivery Verification
| ID | Email | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-001 | OTP Email Not Found | Trigger via Inngest with payload from ticket | Email received with correct content | P0 |
| TC-002 | Household Invitation | Trigger via Inngest with payload from ticket | Email received with owner name, address, invite code | P0 |
| TC-003 | Household Status Update | Trigger via Inngest with payload (status: accepted) | Email received with resident name, status, address | P0 |
| TC-004 | Cancel Account | Trigger via Inngest with payload from ticket | Email received with name, service date, address | P0 |
| TC-005 | Bill Upload Confirmation | Trigger via Inngest with payload (type: join-public-grid) | Email received with correct type content | P0 |
| TC-006 | Sets It Up Yourself Chain | Trigger via Inngest with existing account email | Email chain initiated, first email received | P1 |
| TC-007 | Sets It Up Yourself Reminder | Trigger via Inngest with existing account email | Reminder email received | P1 |
| TC-008 | Start Service Email | Complete move-in flow OR trigger onboarding-flow with emailType=startService | Email received with utility info, PG account #, service date | P0 |
| TC-009 | Non-Billing Welcome | Complete non-billing move-in OR trigger with emailType=nonBilling | Email received with non-billing specific content | P0 |
| TC-010 | Payment Setup Reminder | Wait for delayed step OR trigger with emailType=setupPayment | Reminder email received with firstName | P1 |
| TC-011 | Move-In Email | Complete standard move-in flow (isMoveIn=true) | Move-in specific welcome email received | P0 |
| TC-012 | Educational Email | Complete billing move-in (triggers delayed educational step) | Educational welcome email received | P1 |
| TC-013 | Doc Upload Required | Register with isDocUploadRequired=true building | Doc upload email received with utility name | P1 |

### Content Verification
| ID | Email | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-014 | All emails | Compare received email rendering against ticket screenshots | Visual parity — layout, branding, dynamic fields populated | P0 |
| TC-015 | Start Service | Verify conditional content: electric vs gas display, PG account number visibility | Content matches data flags (showElectric, showGas, showPGAccountNumber) | P1 |
| TC-016 | Non-Billing Welcome | Verify non-billing specific messaging differs from billing welcome | Different content from start service email | P1 |
| TC-017 | Household Status Update | Test with status=accepted, status=declined, status=removed | Different content per status | P2 |

### Sender & Routing
| ID | Check | Expected Result | Priority |
|----|-------|-----------------|----------|
| TC-018 | From address on all emails | `Public Grid Team <welcome@onepublicgrid.com>` (SenderIdentities.WELCOME) | P0 |
| TC-019 | Reply-to on all emails | `support@onepublicgrid.com` | P1 |
| TC-020 | Subject lines | Match expected subjects per email type | P1 |

### Edge Cases
| ID | Title | Steps | Expected Result | Priority |
|----|-------|-------|-----------------|----------|
| TC-021 | Bill Upload — type variations | Trigger bill-upload-confirmation with different `type` values | Correct template variant rendered | P2 |
| TC-022 | Doc Upload fallback | If React template fails, fallback text template sends | Fallback plain text email received | P2 |
| TC-023 | OTP fallback | If React template fails, fallback template sends | Fallback email received | P2 |
| TC-024 | Missing optional fields | Trigger start service with null gasCompanyID, null streetAddress2 | Email renders without errors, fields gracefully hidden | P2 |
| TC-025 | Partner-branded email | Trigger start service with partnerBccEmail and partnerName set | Partner BCC received, partner branding in email | P2 |

### E2E Flow Verification (Regression)
| ID | Flow | Steps | Expected Result | Priority |
|----|------|-------|-----------------|----------|
| TC-026 | Standard move-in | Complete move-in via `autotest` shortcode | Start service + educational emails received | P0 |
| TC-027 | Non-billing move-in | Complete non-billing move-in via `pgtest` shortcode | Non-billing welcome email received | P1 |
| TC-028 | Transfer flow | Complete transfer for active user | Start service email received (isTransferringService=true) | P1 |
| TC-029 | Bill upload flow | Complete bill upload via `/bill-upload/connect-account` | Bill upload confirmation email received | P1 |

## Test Approach
1. **Primary**: Trigger emails via Inngest dev API using the payloads provided in the ticket description — fastest way to verify all 10 listed emails
2. **Secondary**: Run key e2e flows (move-in, non-billing, bill upload) to verify emails are still triggered end-to-end through the actual application
3. **Verification**: Check Fastmail inbox for delivery + compare content against ticket screenshots

## Automation Plan
- **Smoke**: TC-026 (move-in e2e already covers email trigger)
- **Regression**: TC-008, TC-009, TC-011 (core onboarding emails)
- **Manual/Exploratory**: TC-001–TC-007, TC-010, TC-012–TC-025 (Inngest-triggered, not automatable via UI)

## Risks & Notes
- Inngest API always returns 200 — doesn't confirm function execution. Must verify via email receipt.
- Some emails (educational, payment setup reminder) are delayed steps — may need to wait or check Inngest dashboard for step completion.
- "Sets it up yourself" emails (TC-006, TC-007) require an existing account — cannot use fresh test email.
- Doc upload email (TC-013) requires a building with `isDocUploadRequired=true` — need to identify or configure one in dev.
- Move-in email (TC-011) and educational email (TC-012) are sent as part of multi-step onboarding — cannot be triggered in isolation via the ticket payloads.
