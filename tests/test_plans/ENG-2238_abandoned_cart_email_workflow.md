# Test Plan: Abandoned Cart Email Workflow (PostHog)

## Overview
**Ticket**: [ENG-2238](https://linear.app/public-grid/issue/ENG-2238/task-abandoned-cart-email-workflow-posthog)
**PR**: [cottage-nextjs#945](https://github.com/Cottage-Energy/Cottage-Energy/cottage-nextjs/pull/945) (`feat: abandoned cart`, merged 2026-01-28)
**Date**: 2026-04-20
**Tester**: Christian
**Ticket state**: Done (this plan is for **retest** coverage, not initial QA)

## Feature Summary

PostHog-driven re-engagement workflow for users who enter the encouraged-conversion move-in flow with a prefilled email and then drop off before finishing. The flow has three moving pieces:

1. **App emits PostHog identify at personal info screen** — sets person properties including `abandonedCartEnabled` (raw partner flag), `moveInType`, `shortCode`, `email`, `firstName`, `streetAddress`, `city`, `state`, `zip`, `hasCompletedMoveIn`, `willDoItThemselves`.
2. **PostHog workflow** — `Encourage Conversion - Abandoned Cart` — triggers on personal-info-screen event, filters on eligibility, runs a 3-step "Wait Until Condition OR 24h timeout" loop with daily email sends.
3. **Return-from-email flow** — CTA URL has `isThemed=false`, `isRetarget=true`, `utm_source=abandoned_cart` + personalization params. App resolves `isRetarget=true` to `shouldSkipSuccessScreen=false`, which forces a Public Grid success screen (no 15s partner redirect).

### Spec vs Implementation — Resolved via PostHog Dashboard Inspection (2026-04-20)

Ticket text and application code diverged on property/event names, but the PostHog workflow config reconciles them by matching what the app actually emits:

| Area | Ticket spec | Implementation | PostHog workflow filter (verified on dashboard) |
|---|---|---|---|
| Eligibility property | `abandonedCartEligible` (computed) | `abandonedCartEnabled` (raw partner flag) | **`abandonedCartEnabled = true`** — matches app emit ✅ |
| Trigger event | `personalInfoScreenViewed` | Generic `PROGRESSION` capture | **`user entered welcome encouraged conversion`** AND **`user entered building selecting encouraged conversion`** — BOTH events are configured as triggers, each with the same 3 filters; either one firing enters the workflow. Fires on welcome / building-select screens, BEFORE personal info |
| Additional filters | N/A | N/A | `moveInType = "encouraged-conversion"` + `Email address is set` (same on both events) |
| Exit policy | N/A | N/A | "Exit only once workflow reaches the end" — workflow persists even if trigger filters later stop matching (e.g., partner config flipped mid-wait) |
| Wait timeout (spec = 24h) | 24h | N/A | **1 minute** (Cian's temporary config for QA) |

**Net effect**: the workflow IS correctly wired. A user with an enabled partner + prefilled email + encouraged-conversion URL triggers the workflow on **welcome-screen** load (or building-select load — whichever fires first), NOT on personal-info-screen load as the ticket says. Closing the browser at welcome is sufficient to start the 1-minute abandonment timer.

**Documentation gap worth flagging to the team**: the ticket text diverges from both code and PostHog config on property name and event name. Future retesters reading the ticket alone will be confused. Recommend updating the ticket or creating canonical workflow documentation in `tests/docs/`.

### Code Location
- `apps/main/app/move-in/page.tsx` — URL param parsing, partner resolution, `isRetarget`/`isThemed` overrides
- `apps/main/app/move-in/machines/posthog-actor/index.ts` — PostHog identify/capture emit sites
- `apps/main/app/move-in/machines/posthog-actor/events.ts` — event type definitions
- `apps/main/app/move-in/forms/encouraged-conversion/info-encouraged-form.tsx` — personal info screen where abandoned-cart tagging happens
- `apps/tanstack-main/src/server-fns/move-in-loader.ts` — TanStack parity (lines 66–215)

---

## Scope

### In Scope
- Workflow entry: PostHog identify on personal info screen carries correct props (AC-1)
- Workflow non-entry: disabled partner + no-prefill (AC-2, AC-9)
- Workflow exit: `hasCompletedMoveIn=true` and `willDoItThemselves=true` (AC-3, AC-4, AC-6)
- Email dispatch: `abandoned cart email #1` fires after timeout (AC-5)
- Email content: personalization + CTA URL parameters (AC-7)
- Re-entry via CTA: Public Grid styling, prefill, PG success screen (AC-8, AC-10)
- UTM tracking: `utm_source=abandoned_cart` captured (AC-11)
- DB attribution: `Referrals.referredBy` matches expected partner (not Simpson fallback)
- Session establishment: post-completion sign-in works
- Parity: same behavior on TanStack-Dev (blocked by deployment 404 as of 2026-04-20)

### Out of Scope
- PostHog workflow internal configuration (trigger event name, filter predicates, email templates) — requires PostHog dashboard access; surfaced as observation, not tested
- Email template visual design / rendering (handled by PostHog)
- Admin toggle UX on the `MoveInPartner` table (AC-12) — direct DB column, no admin UI in scope
- The 24h cadence itself (AC-5 timing) — Cian will temporarily shorten the wait to 1 minute for testing; production 24h cadence not re-verified in this pass
- Building shortcodes `autotest`, `TFB-01`, `ad012e5e` that link to enabled partners but have `useEncouragedConversion=false` — by definition won't reach the trigger screen

### Prerequisites
- Dev environment: `https://dev.publicgrid.energy`
- PostHog workflow `Encourage Conversion - Abandoned Cart` — **verified 2026-04-20**: triggers on welcome/building-select events, filters on `abandonedCartEnabled=true AND moveInType='encouraged-conversion' AND email is set`, 1-minute wait (Cian's temporary config), exit policy "Exit only once workflow reaches the end"
- Fastmail access for email verification
- Supabase access for DB state verification (read-only on `MoveInPartner` per current protocol)
- Clean test-user emails under `pgtest+ab-cart-*@joinpublicgrid.com` namespace
- TanStack-Dev `https://tanstack-dev.onepublicgrid.com` (check availability at execution time; was 404 earlier in this session)

### Dependencies
- PostHog JS client (identify + capture at personal info screen)
- PostHog Workflow `Encourage Conversion - Abandoned Cart` (external — PostHog dashboard)
- Email dispatch via PostHog (not Resend/Inngest chain like other PG reminder emails)
- `MoveInPartner` DB config (read-only protocol — do NOT modify)
- `MoveInPartner.abandonedCartEnabled` flag per partner

### Test Data — Partners with `abandonedCartEnabled=true` (as of 2026-04-20)

| Partner | `referralCode` (prefix) | `useEncouragedConversion` | shortCodes that resolve here | Abandoned-cart testable? |
|---|---|---|---|---|
| Moved | `moved` | ✅ true (partner) | `moved`, `moved5439797test`, `pgtest` (via Building link, encouraged=true), `autotest` (via Building link, encouraged=**false**) | ✅ Yes via `moved5439797test` or `pgtest` |
| Venn | `venn` | ✅ true (partner) | `venn`, `venn73458test`, `venn325435435`. All 474 Venn-linked Buildings have encouraged=false so Building route is dead | ✅ Yes via `venn73458test` |
| Virtuo | `virtuo` | ✅ true (partner) | `virtuo` (no Building route — 0 linked buildings) | ✅ Yes via `virtuo` |
| UDR | `udr` | ❌ false (partner) | `udr`, `txtest` (Building link) | ❌ Dead flag — workflow filter excludes non-encouraged |

### Test Data — Partners where abandoned-cart is OFF (negative cases)

| Partner | Reason ineligible | shortCodes |
|---|---|---|
| Funnel | `abandonedCartEnabled=false` | `funnel4324534`, `ad012e5e` (building) |
| Renew | Not in enabled list | `renew4543665999` |
| Simpson (fallback) | Not in enabled list | Any unknown/unmatched shortCode |

### DB Config Drift (Observations, not test cases)

| Observation | Ticket intent | DB state |
|---|---|---|
| O-1 | "Initially enable for Venn and Funnel" | Venn=true ✅ · Funnel=**false** ❌ |
| O-2 | "Do NOT enable for Moved (requires direct status updates)" | Moved=**true** ❌ |
| O-3 | UDR `abandonedCartEnabled=true` but `useEncouragedConversion=false` | Dead flag — will never trigger |
| O-4 | Virtuo `abandonedCartEnabled=true` but `isThemed=false` | `isThemed=false` URL override on re-entry is a no-op for this partner |

---

## Test Cases

### Positive Path — Workflow Entry & Tagging

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-001 | Venn + prefilled email → PostHog identify carries abandonedCartEnabled=true + trigger event fires | AC-1 | 1. Create fresh test user email `pgtest+ab-cart-venn001@joinpublicgrid.com` 2. Navigate to `/move-in?shortCode=venn73458test&email=<url-encoded>&firstName=VennTest&streetAddress=808+Chicago+Ave&city=Evanston&state=IL&zip=60202` 3. Let welcome / building-select screens render 4. Capture PostHog `/flags/` and `/e/` calls via network tab 5. Decode base64 body + inspect captured event names | Events `user entered welcome encouraged conversion` and/or `user entered building selecting encouraged conversion` fire. PostHog identify payload contains: `email`, `moveInType='encouraged-conversion'`, `abandonedCartEnabled=true`, `hasCompletedMoveIn=false`, `willDoItThemselves=false`, `firstName='VennTest'`, `streetAddress='808 Chicago Avenue'`, `city='Evanston'`, `state='IL'`, `zip='60202'`, `shortCode='venn73458test'` | P0 | Yes |
| TC-002 | Moved via `moved5439797test` (partner-referralCode path) → same tagging as Venn | AC-1 | Same as TC-001 but `shortCode=moved5439797test` + fresh email | Identify payload has `abandonedCartEnabled=true`, `shortCode='moved5439797test'`, correct partner resolution | P1 | Yes |
| TC-003 | Moved via `pgtest` (Building-linked path) → same tagging | AC-1 | Same as TC-001 but `shortCode=pgtest` + fresh email | Identify payload has `abandonedCartEnabled=true`, `shortCode='pgtest'`, partner correctly resolves to Moved despite shortCode not starting with `moved` | P1 | Yes |
| TC-004 | Virtuo via bare `virtuo` shortCode → workflow eligible | AC-1 | Same as TC-001 but `shortCode=virtuo` + fresh email | Identify payload has `abandonedCartEnabled=true`, `shortCode='virtuo'` | P2 | Yes |

### Negative Path — Workflow Non-Entry

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-005 | Funnel (`abandonedCartEnabled=false`) → identify shows abandonedCartEnabled=false | AC-2 | 1. Navigate to `/move-in?shortCode=funnel4324534&email=<fresh>&firstName=Funnel&streetAddress=...` 2. Reach personal info screen 3. Decode identify payload | `abandonedCartEnabled: false`, user does not qualify for workflow entry | P0 | Yes |
| TC-006 | No prefilled email → workflow filter rejects on `email IS NOT NULL` | AC-9 | 1. Navigate to `/move-in?shortCode=venn73458test` (no `email` param) 2. Reach personal info screen | Either: (a) `abandonedCartEnabled=true` set but `email` is null → workflow filter excludes; or (b) identify never fires until user types email. Either outcome is acceptable per AC-9 | P0 | Yes |
| TC-007 | UDR partner (encouraged=false) → workflow should not fire even if user reaches a personal info screen | AC-2 | 1. Navigate to `/move-in?shortCode=txtest&email=<fresh>` 2. Follow whatever flow the txtest-UDR config drives 3. Check identify payload | If `moveInType !== 'encouraged-conversion'`, PostHog workflow filter excludes. Confirm which flow txtest actually runs (Building encouraged=true vs Partner encouraged=false) | P1 | Yes |
| TC-008 | Unknown shortCode → Simpson fallback → no tagging | AC-2 | 1. Navigate to `/move-in?shortCode=bogusRandomCode&email=<fresh>` 2. Reach personal info screen (or equivalent) 3. Decode identify | `abandonedCartEnabled=false`, `shortCode='bogusRandomCode'`, partner fallback to Simpson | P2 | No |

### Workflow Exits Mid-Sequence

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-009 | User completes Finish setup before email #1 → `hasCompletedMoveIn=true` → workflow exits | AC-3 | 1. Run TC-001 setup through personal info screen 2. Fill remaining required fields and Finish setup 3. Verify post-submit identify | Subsequent identify shows `hasCompletedMoveIn=true`. No abandoned cart email arrives in Fastmail after 1-minute wait | P0 | Yes |
| TC-010 | User clicks "I will call and setup myself" → `willDoItThemselves=true` → workflow exits | AC-4 | 1. Run TC-001 setup to personal info screen 2. Return to previous screen 3. Click "I will call and setup myself" 4. Complete contact-provider screen | Identify shows `willDoItThemselves=true`. No abandoned cart email arrives | P1 | Yes |
| TC-011 | User completes mid-sequence (after email #1 but before email #2) | AC-6 | 1. Abandon at personal info screen 2. Wait for email #1 (1 min) 3. Do NOT click email; return to `/move-in?...` directly and complete Finish setup 4. Check Fastmail | `hasCompletedMoveIn=true`, no further abandoned-cart emails | P2 | No |

### Email Arrival & Content (after Cian's 1-minute wait)

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-012 | Email #1 arrives after 1-minute wait | AC-5 | 1. Run TC-001 through personal info screen 2. Close browser tab without completing 3. Poll Fastmail for ~2 minutes via JMAP | Email arrives addressed to the prefilled email. Subject matches PostHog template (exact string TBD on first observation) | P0 | No (manual until template confirmed) |
| TC-013 | Email body contains personalization — firstName | AC-7 | 1. TC-012 + fetch email body 2. Parse HTML | Body references `firstName` value from URL (e.g., "Hi VennTest,") | P0 | Yes |
| TC-014 | Email CTA URL contains all required parameters | AC-7 | 1. TC-012 + extract CTA href from email body 2. Parse query string | CTA contains `shortCode`, `email`, `firstName`, `streetAddress`, `city`, `state`, `zip`, `isThemed=false`, `isRetarget=true`, `utm_source=abandoned_cart` | P0 | Yes |
| TC-015 | No email sent for TC-005 (Funnel, disabled) | AC-2 | 1. Run TC-005 → abandon at personal info screen 2. Wait 2 minutes 3. Check Fastmail | No abandoned-cart email received for Funnel test user | P0 | No |
| TC-016 | No email sent for TC-006 (no prefill) | AC-9 | 1. Run TC-006 → abandon 2. Wait 2 minutes 3. Check Fastmail (at any mailbox — no prefill means we have no address to check) | No abandoned-cart email sendable — no email address associated with the PostHog person | P1 | No |

### Return From Email — CTA Click-Through

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-017 | Click CTA → land on Public Grid-styled move-in (not Venn-themed) | AC-8 | 1. TC-014 + click CTA URL 2. Observe landing page | No Venn logo/header, no Venn cream background. Only utility (ComEd) logo visible inline with the main card. Body uses Public Grid default styling | P0 | Yes |
| TC-018 | Personal info pre-filled from URL params | AC-8 | 1. TC-017 + walk to personal info screen 2. Inspect form fields | `firstName`, `email`, `streetAddress`, `city`, `state`, `zip` pre-populated from URL | P0 | Yes |
| TC-019 | Complete Finish setup → Public Grid success screen (no 15s partner countdown) | AC-10 | 1. TC-018 + fill remaining required fields (lastName, phone, DOB, SSN, previous address) 2. Click Finish setup 3. Observe success page | "Great! You are all set" + "Continue to My Account" button + "Start a New Move-In Request" link. No Venn branding. No countdown timer. No auto-redirect to partner URL | P0 | Yes |
| TC-020 | `utm_source=abandoned_cart` captured in PostHog analytics | AC-11 | 1. Run TC-017–TC-019 with PostHog network capture 2. Inspect `/e/` event bodies for utm attribution | `utm_source: 'abandoned_cart'` appears in captured event properties (either on the pageview or subsequent events) | P1 | No |

### DB Attribution & Session (CLAUDE.md-enforced, beyond ticket ACs)

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-021 | `Referrals.referredBy` resolves to Venn (not Simpson fallback) | — | 1. TC-019 complete 2. SQL: `SELECT mip.name FROM Referrals r JOIN CottageUsers cu ON cu.id = r.referred JOIN MoveInPartner mip ON mip.id = r.referredBy WHERE cu.email = '<test email>';` | `attributed_partner = 'Venn'`. Not Simpson (which would indicate the ENG-2694 split-code-path attribution bug recurring on the isRetarget=true branch) | P0 | Yes |
| TC-022 | `CottageUsers` row exists with correct email | — | 1. TC-019 complete 2. SQL: `SELECT id, email, "createdAt" FROM "CottageUsers" WHERE email = '<test>';` | One row, recent `createdAt`, correct email | P0 | Yes |
| TC-023 | User can sign in with test credentials after completion | — | 1. TC-019 complete 2. Sign out 3. Sign in at `/sign-in` with test email and set password | `/app/overview` loads authenticated, property visible, no session error. Proves auth cookies are set correctly (guards ENG-2721-style cookie-drop) | P0 | Yes |

### Positive — Other Partners (Breadth Coverage)

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-024 | Moved `moved5439797test` — full end-to-end | AC-1, AC-5, AC-7, AC-8, AC-10, CLAUDE.md | TC-001 through TC-023 with `shortCode=moved5439797test` | Same as TC-001 through TC-023 but attribution must be Moved. Critical because Moved was explicitly called out as "do NOT enable" in ticket — confirms what production users actually experience | P1 | Yes |
| TC-025 | Moved `pgtest` (Building-linked) — full end-to-end | Same as TC-024 | Same as TC-024 but `shortCode=pgtest` | Attribution: Moved. Validates Building-linked resolution path (different code branch from referralCode prefix match) | P2 | No |
| TC-026 | Virtuo `virtuo` — full end-to-end | Same | Same with `shortCode=virtuo` | Attribution: Virtuo. Virtuo has `isThemed=false` natively → CTA `isThemed=false` override is a no-op; behavior should match untouched | P2 | No |

### Edge Cases

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-027 | Case sensitivity: `shortCode=MOVED` does not match `moved` referralCode | — | 1. Navigate `/move-in?shortCode=MOVED&email=<fresh>` 2. Reach personal info 3. Check identify | `abandonedCartEnabled=false` — `startsWith('moved')` is case-sensitive, falls back to Simpson | P2 | No |
| TC-028 | Re-entry loop protection — click CTA, reach personal info, close again | — | 1. TC-017 (click CTA) → reach personal info 2. Close browser without completing 3. Wait 2 min | Verify PostHog workflow does NOT start a second 3-email cycle for the same distinct_id (cooldown / dedupe needed) | P2 | No |
| TC-029 | `isThemed=true` override + `isRetarget=true` — conflicting intent | — | 1. Manually construct URL with `isThemed=true&isRetarget=true` 2. Land on move-in | User-facing behavior documented — does `isThemed=true` win (partner styling), does `isRetarget=true` still skip partner redirect? Edge behavior worth documenting | P2 | No |
| TC-030 | Invalid email in URL (e.g., `email=not-an-email`) → PostHog captures garbage | — | 1. Navigate `/move-in?shortCode=venn73458test&email=not-an-email` 2. Reach personal info | PostHog workflow may send to invalid address → bounce. App should validate email at this touchpoint | P2 | No |

### Parity — TanStack-Dev

| ID | Title | AC | Steps | Expected Result | Priority | Automate? |
|----|-------|----|-------|-----------------|----------|-----------|
| TC-031 | Same positive-path run on TanStack-Dev | All | Repeat TC-001, TC-012, TC-017–TC-023 against `https://tanstack-dev.onepublicgrid.com` | Identical behavior to Dev. Code review (`apps/tanstack-main/src/server-fns/move-in-loader.ts`) suggests parity at lines 66–215 | P1 | Yes |
| TC-032 | Verify no cookie-loss regression on TanStack (ENG-2721 shape) | — | After TC-031 TC-023 equivalent, sign-in must succeed on TanStack exactly as on Dev | Auth cookies preserved through CTA flow. Guards against Response.redirect cookie-drop recurrence | P1 | Yes |

**NOTE**: TanStack-Dev is returning 404 as of 2026-04-20 on root and `/move-in`. TC-031 and TC-032 are BLOCKED pending deployment restoration.

---

## Execution Plan

### Phase 1 — PostHog workflow pre-flight ✅ COMPLETE (2026-04-20)
- Verified via PostHog dashboard screenshots from Cian
- Trigger events: `user entered welcome encouraged conversion` AND `user entered building selecting encouraged conversion` (both with same 3 filters)
- Filters on each: `abandonedCartEnabled = true`, `moveInType = "encouraged-conversion"`, `Email address is set`
- 1-minute wait confirmed live
- Exit policy: "Exit only once workflow reaches the end"
- No blocking config issues — workflow is ready to produce emails for eligible test users

### Phase 2 — Positive path (TC-001, TC-012, TC-017–TC-023)
- Single end-to-end Venn flow — confirms the whole chain works at least once before we branch into negatives and other partners

### Phase 3 — Negatives (TC-005, TC-006, TC-015, TC-016)
- Prove the workflow respects its filters

### Phase 4 — Exits (TC-009, TC-010, TC-011)
- Prove `hasCompletedMoveIn` / `willDoItThemselves` correctly short-circuit

### Phase 5 — Other partners (TC-024, TC-025, TC-026)
- Breadth coverage for Moved and Virtuo

### Phase 6 — Edge cases (TC-027–TC-030)
- Lower-priority; can be sampled

### Phase 7 — TanStack parity (TC-031, TC-032)
- BLOCKED on deployment. Schedule when `tanstack-dev.onepublicgrid.com` is restored.

### Phase 8 — Test-data cleanup
- Delete test users: `pgtest+ab-cart-*@joinpublicgrid.com` via Supabase admin API
- Do NOT modify `MoveInPartner` rows (read-only protocol)

---

## Known Risks / Open Questions

1. ~~**PostHog workflow wiring unknown**~~ — **RESOLVED 2026-04-20** via dashboard inspection. Filter uses `abandonedCartEnabled`, matches app emit; 1-min wait live; both welcome/building-select events trigger.
2. **DB config drift vs ticket intent** — Moved/Funnel/UDR/Virtuo configurations don't match ticket's "initially enable Venn and Funnel only" instruction. Not a test blocker, but surfaces as an observation. `MoveInPartner` is read-only under current protocol — do not attempt to modify.
3. **TanStack-Dev availability** — was 404 earlier today; recheck at execution time. If down, Phase 7 (TC-031, TC-032) is blocked.
4. **Email template content not yet observed** — exact subject, sender address, and HTML structure are unknown until the first real email arrives. Tests TC-013/TC-014 may need refinement after first observation.
5. ~~**Property-name mismatch**~~ — **RESOLVED 2026-04-20** at PostHog layer. PostHog filter is on `abandonedCartEnabled` (matches app emit), not `abandonedCartEligible` (ticket text). Documentation gap remains — ticket text could mislead future retesters but doesn't affect behavior.
6. **"Exit only once workflow reaches the end" policy** — workflow does NOT re-evaluate trigger filters after entry. If `MoveInPartner.abandonedCartEnabled` is flipped off while a user is mid-wait, they'll still receive the email. Noted for product awareness; not tested in this pass.

---

## Notes

- **MoveInPartner is read-only** for this test pass. All four enabled partners (Moved, Venn, Virtuo, UDR) will remain in their current state.
- Test passwords: `PG#12345` (standard) per `feedback_test_password.md`.
- Fastmail JMAP preferred for email verification (Node.js script, no `jq`).
- Every flow in this plan must be completed end-to-end per CLAUDE.md Flow Completion Rule. "Email received" alone is **BLOCKED, not PASS** — must click link, complete destination form, verify downstream effect (DB + session).
- Partner-attribution DB verification (TC-021) is non-negotiable per CLAUDE.md Phase 1d2 given the `isRetarget=true` split-code-path shape matches ENG-2694.
