# Abandoned Cart Email Workflow — Testing Guide

Short, step-by-step QA procedure for the PostHog-driven abandoned cart email workflow. For the full reference (trigger event names, filter conditions, code emit sites, DB queries), see [`posthog-workflows.md`](./posthog-workflows.md).

## What the Feature Does

A user who enters the **encouraged-conversion** move-in flow via a partner with `abandonedCartEnabled=true` AND with a **prefilled email in the URL** gets enrolled in a 3-email PostHog workflow if they drop off before completing. Each email contains a CTA URL that re-enters the flow with Public Grid styling (`isThemed=false`), skips the 15s partner redirect (`isRetarget=true`), and tags the session (`utm_source=abandoned_cart`).

## Before You Run a Test

### 1. Confirm who qualifies right now

```sql
-- Partners currently enabled:
SELECT name, "referralCode", "abandonedCartEnabled", "useEncouragedConversion"
FROM "ViewMoveInPartnerReferral"
WHERE "abandonedCartEnabled" = true;

-- ShortCode → partner resolution for your chosen test shortCode:
SELECT b."shortCode", b."useEncouragedConversion" AS bldg_encouraged,
       mip.name AS partner, mip."abandonedCartEnabled" AS partner_flag,
       mip."useEncouragedConversion" AS partner_encouraged
FROM "Building" b
LEFT JOIN "MoveInPartner" mip ON mip.id = b."moveInPartnerID"
WHERE b."shortCode" = 'venn73458test';  -- replace with your shortCode
```

Expected eligibility (as of 2026-04-20):

| shortCode | Eligible? | Why |
|---|---|---|
| `venn73458test` | ✅ | Venn partner, encouraged=true, `abandonedCartEnabled=true` |
| `moved5439797test` | ✅ | Moved partner (via referralCode prefix), all flags on |
| `virtuo` | ✅ | Virtuo partner, all flags on |
| `pgtest` | ✅ | Building → Moved (⚠️ pollutes every pgtest run with abandoned-cart enrollment) |
| `autotest` | ❌ | Building → Moved but `bldg.useEncouragedConversion=false` → standard flow, not encouraged |
| `funnel4324534` | ❌ | Funnel partner, `abandonedCartEnabled=false` |
| `txtest`, `udr*` | ❌ | UDR partner, `useEncouragedConversion=false` (dead flag) |

### 2. Confirm the PostHog workflow is live

The QA account doesn't have PostHog dashboard access. Ask the PostHog owner (Cian) to confirm:

- Workflow `Encourage Conversion - Abandoned Cart` is **Active / Published** (not Draft)
- Wait step 1 timeout is set to your expected value (1 minute for QA, 24h for prod)
- No recent edits have been left unsaved

If the workflow is paused or in draft, no email will arrive regardless of how perfectly the test is executed.

### 3. Pick a fresh test email

Use `pgtest+ab-cart-<unique>@joinpublicgrid.com` — unique suffix avoids PostHog's person-merge logic reusing a completed user.

## Test Procedure — Positive Path

```
1. Open fresh browser (or Playwright MCP)

2. Navigate to:
   https://dev.publicgrid.energy/move-in?shortCode=venn73458test
     &email=pgtest+ab-cart-<unique>@joinpublicgrid.com
     &firstName=<name>
     &streetAddress=808+Chicago+Ave
     &city=Evanston
     &state=IL
     &zip=60202

3. Let the welcome / building-select screen render (address confirmation page
   — "We handle setting up your utility account..." + "Get started" button)

4. (Optional verification) Capture PostHog /flags/ POST body via
   browser_network_requests. Decode base64 (see posthog-workflows.md
   "Decoding PostHog Network Payloads"). Confirm person_properties has:
     - abandonedCartEnabled: true
     - moveInType: "encouraged-conversion"
     - email: <your prefill>
     - shortCode: "venn73458test"
     - firstName / streetAddress / city / state / zip set
     - hasCompletedMoveIn: false
     - willDoItThemselves: false

5. Close the browser tab. DO NOT:
     - Click "Get started" → personal info (fine) then Finish setup (NO — sets hasCompletedMoveIn=true)
     - Click "I will call and setup myself" (NO — sets willDoItThemselves=true)
     - Complete ANY further action that leads to the Dashboard

6. Wait ~90 seconds (1-min PostHog wait + dispatch buffer for QA,
   or 24h+ for production cadence)

7. Poll Fastmail for the email via JMAP:
     - filter by `to = pgtest+ab-cart-<unique>@joinpublicgrid.com`
     - after: Date.now() - 10*60*1000
     - expected from: support@onepublicgrid.com
     - expected subject: "Finish setting up electricity" (based on Feb-March 2026 history)

8. Parse the email HTML body, extract the CTA href. Confirm it contains:
     - shortCode (whatever partner the user came from)
     - email, firstName, streetAddress, city, state, zip (echo of original URL)
     - isThemed=false
     - isRetarget=true
     - utm_source=abandoned_cart

9. Click the CTA (or navigate to it manually) — verify:
     - Landing page uses Public Grid styling (no partner logo/theme)
     - Personal info form is pre-filled from URL params
     - Completing Finish setup lands on the PG-branded success screen
       ("Great! You are all set", "Continue to My Account") — NOT a 15s
       partner countdown

10. DB verification (CLAUDE.md Phase 1d2 — partner attribution check):

    SELECT mip.name AS attributed_partner, p."externalLeaseID"
    FROM "Referrals" r
    JOIN "CottageUsers" cu ON cu.id = r.referred
    LEFT JOIN "ElectricAccount" ea ON ea."cottageUserID" = cu.id
    LEFT JOIN "Property" p ON p."electricAccountID" = ea.id
    JOIN "MoveInPartner" mip ON mip.id = r."referredBy"
    WHERE cu.email = '<your test email>';

    Assert: attributed_partner = your expected partner (e.g. 'Venn'),
    NOT 'Simpson' (fallback — would indicate ENG-2694 split-code-path bug
    recurring on the isRetarget=true branch)

11. Sign-in verification (CLAUDE.md Flow Completion Rule):
    - Sign out, navigate to /sign-in, sign in with the test email
      (password reset to known value via Supabase admin API if needed)
    - Expect /app/overview to load authenticated with property visible
    - Guards against ENG-2721 cookie-drop recurrence on TanStack
```

## Test Procedure — Negative Paths

These should NOT produce an email:

### Disabled partner (Funnel)
- URL: `...shortCode=funnel4324534&email=...` → decoded `/flags/` shows `abandonedCartEnabled: false` → workflow filter excludes
- Wait 2 min, confirm no email

### No prefilled email
- URL: `...shortCode=venn73458test` (no `email=`) → filter `Email address is set` fails
- Wait 2 min, confirm no email (can't poll specific address since none was set — poll general activity instead)

### Non-encouraged flow
- URL: `...shortCode=autotest&email=...` → Building forces standard 6-step flow, `moveInType` doesn't become `encouraged-conversion` → filter excludes
- Wait 2 min, confirm no email

### User completes before timeout
- Run positive path through step 3, then go through Finish setup → `hasCompletedMoveIn=true` → Wait Until exits → no email
- Wait 2 min, confirm no email

### User self-services
- Run positive path to welcome screen, click "I will call and setup myself" → `willDoItThemselves=true` → Conditional branch exits → no email
- Wait 2 min, confirm no email

## Common Failure Modes & Diagnostics

| Symptom | Likely cause | Action |
|---|---|---|
| Person_properties match filter but no email after 2-3x expected wait | Workflow paused / unpublished / Email step broken | Ask Cian to check PostHog Invocations + Logs for your test user |
| Email arrives but CTA missing `isRetarget=true` or `isThemed=false` | Workflow Email step template regression | File bug, include screenshot of the PostHog Email-step template |
| CTA click lands on partner-themed page (not PG) | App `isThemed=false` override regression | Check `apps/main/app/move-in/page.tsx` line ~70 (`isThemedParam` logic) |
| Success screen shows 15-second partner countdown | App `isRetarget=true` override regression | Check `apps/main/app/move-in/page.tsx` line ~219 (`shouldSkipSuccessScreen` override) |
| `Referrals.referredBy = Simpson` after completing via email CTA | Split-code-path attribution bug (ENG-2694 shape) | File critical — the `isRetarget=true` branch is mis-attributing |
| All 3 emails arrive even after user completes mid-sequence | `hasCompletedMoveIn=true` propagation delayed | Check PostHog person_properties via `/flags/` — if flag flipped, workflow should have exited at the next Wait Until |

## Known Risks at This Feature

1. **Email delivery silent since 2026-03-12** — Fastmail history shows ~18 emails Feb 2 – March 12, then 39 days of silence. Reason TBD (workflow paused / Email step regression / template error). Any retest today should treat "no email" as a PostHog-side issue, not a test failure.
2. **`pgtest` test pollution** — `pgtest` is a Moved-linked building with `useEncouragedConversion=true`. Every `pgtest` test with a prefilled email enrolls the test user in the Moved abandoned-cart workflow. Consider using `venn73458test` or a truly synthetic shortCode for non-abandoned-cart tests that shouldn't pollute.
3. **Workflow doesn't re-evaluate filters mid-wait** — exit policy is "Exit only once workflow reaches the end". If a partner's `abandonedCartEnabled` flips to false while a user is mid-sequence, they still receive the remaining emails.

## Related

- Reference: [`posthog-workflows.md`](./posthog-workflows.md)
- Test plan: [`../test_plans/ENG-2238_abandoned_cart_email_workflow.md`](../test_plans/ENG-2238_abandoned_cart_email_workflow.md)
- Onboarding flows: [`onboarding-flows.md`](./onboarding-flows.md)
- Original ticket: [ENG-2238](https://linear.app/public-grid/issue/ENG-2238)
- Original PR: [cottage-nextjs#945](https://github.com/Cottage-Energy/cottage-nextjs/pull/945)
