# PostHog Workflows Reference

Known PostHog workflows that drive product behavior (email re-engagement, notifications, etc.), their trigger events, filter conditions, and how to verify them during QA.

Companion to `inngest-functions.md` — Inngest runs app-side async jobs triggered by events; PostHog workflows run after events are captured by the PostHog client and enroll users based on person-property filters.

## How to Access

Two paths:

**PostHog MCP** (installed 2026-04-20, HTTP transport, `POSTHOG_MCP_API_KEY` personal API key in `.env`). Read-only by protocol — every write requires explicit per-op approval from Christian in the current session, even under `bypassPermissions`. See [feedback_posthog_readonly_approval_required.md](../../memory/feedback_posthog_readonly_approval_required.md).

**Dashboard** (browser) — required for anything the MCP can't reach:
- **Dev project**: `https://us.posthog.com/project/39155/`
- **Workflows list**: `https://us.posthog.com/project/39155/workflows`
- **Individual workflow URL**: `https://us.posthog.com/project/39155/workflows/<uuid>/workflow`
- **Activity timeline**: `https://us.posthog.com/project/39155/activity`

### MCP Capability Matrix (verified 2026-04-20 on ENG-2238 investigation)

| Question | MCP tool | Works with personal API key? |
|---|---|---|
| Does the workflow exist / is it active / paused? | `workflows-list`, `workflows-get` | ✅ |
| Full workflow structure (trigger, filter, waits, branches, Email actions + templates) | `workflows-get` | ✅ |
| Who edited the workflow and when | `activity-log-list` with `scope=HogFlow`, `item_id=<uuid>` | ✅ |
| App-side event emission, person_properties, distinct_ids | `query-run` (HogQL on `events`, `persons`) | ✅ |
| Did a specific user enroll in the workflow? | — | ❌ Hog-flow invocation records are NOT in public `events` stream; `hog_flow_metrics` table not exposed via HogQL |
| Did the Email step fire / succeed / error? | `query-logs`, `cdp-functions-list` | ❌ Logs ingestion is empty (0 services). CDP functions return 0 under personal API key |
| Is the sender integration healthy / when was it last changed? | `integration-get`, `integrations-list`, `activity-log-list scope=Integration` | ❌ Per PostHog docs: *"When authenticated via personal API key, only GitHub integrations are returned."* `integration-get/<non-github-id>` returns 404 |
| Feature flags, cohorts, insights, HogQL SELECT queries, dashboards, annotations | various | ✅ (read-only) |

**When MCP hits the ceiling**: ask Cian or whoever owns PostHog for the workflow's Invocations / Metrics tab for the relevant time window — that surface shows "enrolled / step reached / email sent / error" per user. The MCP currently cannot reach that telemetry under a personal API key.

**Write operations are gated**: workflow/flag/cohort/dashboard/experiment/survey create/update/delete, non-SELECT HogQL, `switch-project`/`switch-organization`, and any toggle operation require explicit per-call approval from Christian. Read-only investigation does NOT need approval.

## How to Verify a Workflow Matches App Emit

PostHog workflows have **three** independent surfaces that all must agree:

1. **Ticket text** — what the spec says about property/event names
2. **App code** — what `posthog.identify()` / `posthog.capture()` actually emits (`posthog-actor/index.ts` + state machines in `apps/main/app/move-in/machines/` or `apps/tanstack-main/src/move-in/machines/`)
3. **PostHog workflow config** — what the live Trigger and filters are keyed on

When retesting a PostHog-backed feature, verify **all three** — the ticket can lie and the code can lie. Only the intersection of code-emit + workflow-filter determines whether an event enters a workflow.

**Common divergence pattern**: ticket specifies one property/event name; code emits a different name; workflow filter matches the code (reconciled on the PostHog side). This was the case for the abandoned-cart workflow (see below). Don't assume the ticket text is authoritative.

## How to Decode PostHog Network Payloads (QA debugging)

PostHog sends two payload shapes to `us.i.posthog.com`:

- **`/flags/?v=2&compression=base64`** — `data=<base64>` body, contains `distinct_id` + `person_properties`. Readable.
- **`/e/?compression=gzip-js` or `/i/v0/e/?compression=gzip-js`** — gzipped event captures. Binary.

### Base64 flags payload (readable in Node)

```bash
# After capturing via browser_network_requests, decode manually:
node -e "
const fs = require('fs');
const content = fs.readFileSync('network-capture.txt', 'utf8');
const blocks = content.split(/\[POST\]/);
for (const block of blocks) {
  if (!block.includes('/flags/')) continue;
  const bodyMatch = block.match(/Request body:\s*data=([^\s]+)/);
  if (!bodyMatch) continue;
  const decoded = Buffer.from(decodeURIComponent(bodyMatch[1]), 'base64').toString('utf8');
  const j = JSON.parse(decoded);
  console.log('distinct_id:', j.distinct_id);
  console.log('person_properties:', Object.keys(j.person_properties||{}).filter(k => !k.startsWith('\$initial_')));
}
"
```

### Gzip event payload — use in-browser DecompressionStream

Text files corrupt binary gzip data. Decode in the browser via `DecompressionStream('gzip')` during a live fetch interceptor:

```javascript
// Install BEFORE navigation if possible
const origFetch = window.fetch;
window.__capturedEvents = [];
window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  const response = await origFetch.apply(this, args);
  if (url.includes('us.i.posthog.com') && url.includes('gzip')) {
    const body = args[1]?.body;
    if (body instanceof Blob) {
      const ds = new DecompressionStream('gzip');
      const stream = new Response(body).body.pipeThrough(ds);
      const text = await new Response(stream).text();
      window.__capturedEvents.push({ url, text });
    }
  }
  return response;
};
```

**Gotcha**: the interceptor misses events fired during initial page load (before install). Navigate to `about:blank` first, install the interceptor, then navigate to the target URL — or use `browser_network_requests` with `filename` and decode server-side (though gzip bytes get lossy in the UTF-8 text dump — use base64 flags payloads for person-property verification instead).

## Active Workflows (as of 2026-04-20)

### Encouraged Conversion — Abandoned Cart

**Ticket**: [ENG-2238](https://linear.app/public-grid/issue/ENG-2238/task-abandoned-cart-email-workflow-posthog)
**PR**: [cottage-nextjs#945](https://github.com/Cottage-Energy/cottage-nextjs/pull/945) (merged 2026-01-28)
**Workflow UUID**: `019be8dc-083f-0000-f520-95706f67db67`

**Purpose**: Re-engage users who enter the encouraged-conversion move-in flow with a prefilled email and then drop off without completing.

**Trigger — two events, same 3 filters on each**:

| Event | Filter 1 | Filter 2 | Filter 3 |
|---|---|---|---|
| `user entered welcome encouraged conversion` | `abandonedCartEnabled = true` | `moveInType = encouraged-conversion` | `Email address is set` |
| `user entered building selecting encouraged conversion` | same | same | same |

- **Frequency**: "Every time the trigger fires"
- **Filter out internal/test users**: OFF (so `pgtest+*` users flow through during QA)
- **Exit condition**: "Exit only once workflow reaches the end" (workflow does NOT re-evaluate filters mid-sequence — if partner flag flips off mid-wait, user still gets emails)

**Event emit site** — `apps/main/app/move-in/machines/encouraged-conversion/index.ts`:
- Line 537–540 (welcome state entry): `postHogCapture` with `screen: 'welcome encouraged conversion'`
- Line 455–465 (buildingSelection state entry): `postHogCapture` with `screen: 'building selecting encouraged conversion'`
- `posthog-actor/index.ts` line 261: ``getProgressionCaptureMessage = screen => `user entered ${screen}` `` → final event name

**Wait / Email / Branch chain** (3 cycles):
1. Wait Until `hasCompletedMoveIn = true` OR timeout (prod: 24h, **dev as of 2026-04-20: 1 minute** per Cian's temporary config)
2. Conditional branch: if `willDoItThemselves = true` → exit (no email); else → Email #1 ("Finish setting up electricity" per Fastmail history)
3. Repeat cycle twice more (Email #2, Email #3 "Final reminder to finish your electricity setup")

**Eligible partners** (as of 2026-04-20 — `MoveInPartner.abandonedCartEnabled = true`, treated as read-only by QA):

| Partner | `referralCode` prefix | Partner `useEncouragedConversion` | Eligible? |
|---|---|---|---|
| Moved | `moved` | ✅ true | ✅ Yes |
| Venn | `venn` | ✅ true | ✅ Yes |
| Virtuo | `virtuo` | ✅ true | ✅ Yes (but `isThemed=false` natively) |
| UDR | `udr` | ❌ false | ❌ **Dead flag** — workflow filter excludes via `moveInType` |

**ShortCodes that resolve to eligible partners**:

| shortCode | Resolution path | Eligible? |
|---|---|---|
| `moved5439797test`, `moved` | Partner referralCode (`startsWith('moved')`) | ✅ |
| `venn73458test`, `venn` | Partner referralCode (`startsWith('venn')`) | ✅ |
| `virtuo` | Partner referralCode | ✅ |
| **`pgtest`** | **Building → `moveInPartnerID` → Moved** | ✅ **⚠️ Pollutes every pgtest test with abandoned-cart enrollment** |
| `autotest` | Building → Moved, but `bldg.useEncouragedConversion = false` | ❌ Standard flow, not encouraged |
| `TFB-01` | Building → Venn, but `bldg.useEncouragedConversion = false` | ❌ |
| `funnel4324534` | Partner referralCode → Funnel (`abandonedCartEnabled=false`) | ❌ |
| `udr*`, `txtest` | Partner / Building → UDR | ❌ Dead flag |

**Known gotchas**:

1. **`pgtest` enrolls users in the Moved abandoned-cart workflow** — any test using `pgtest` + prefilled email triggers the workflow. If CI runs frequent pgtest smoke tests with prefilled emails, they pollute the workflow queue.
2. **Ticket text diverges from reality** — ticket says property `abandonedCartEligible` and event `personalInfoScreenViewed`, but the PostHog workflow actually filters on `abandonedCartEnabled` and triggers on `user entered welcome/building selecting encouraged conversion`. The PostHog side was reconciled to match what the app emits; the ticket wasn't updated.
3. **Case-sensitive `startsWith`** — `shortCode=MOVED` does NOT match `referralCode=moved` → falls back to Simpson (not enabled) → workflow does NOT enroll.
4. **Virtuo's `isThemed=false` natively** — the CTA URL's `isThemed=false` override is a no-op for Virtuo users since they were never themed.

**CTA URL structure** (sent in the workflow's Email step):

```
https://onepublicgrid.com/move-in?shortCode=<partnerCode>&email=<user>&firstName=<user>&streetAddress=<addr>&city=<city>&state=<state>&zip=<zip>&isThemed=false&isRetarget=true&utm_source=abandoned_cart
```

App-side handling of CTA params (`apps/main/app/move-in/page.tsx`):
- `isThemed=false` → forces Public Grid styling, overrides partner `isThemed`
- `isRetarget=true` → sets `shouldSkipSuccessScreen=false`, so the PG success screen renders instead of the 15-second partner redirect
- `utm_source=abandoned_cart` → captured by PostHog auto-pageview attribution

**Test data setup** (for end-to-end abandonment test):

```
# Positive path (eligible user who abandons)
URL: https://dev.publicgrid.energy/move-in?shortCode=venn73458test
     &email=pgtest+ab-cart-<unique>@joinpublicgrid.com
     &firstName=<name>
     &streetAddress=808+Chicago+Ave
     &city=Evanston
     &state=IL
     &zip=60202

Action: navigate, let welcome screen render, close browser (do NOT complete, do NOT click "I will call and setup myself")

Wait: ~90 seconds (1-min PostHog wait + dispatch buffer)

Verify: Fastmail JMAP query for recipient; expect email from support@onepublicgrid.com with subject "Finish setting up electricity"
```

**Known email history** (from Fastmail QA observations):

- First observed: 2026-02-02
- Last observed: **2026-03-12**
- ~18 emails delivered in that window across multiple test users
- **39+ day silence** since then despite apparent workflow configuration
- **2026-04-20 MCP investigation** ([ENG-2238 comment 0863a5b2](https://linear.app/public-grid/issue/ENG-2238/task-abandoned-cart-email-workflow-posthog#comment-0863a5b2)) ruled out: workflow paused, config regression, trigger filter drift, app emission failure, gate logic skipping users, email template regression. Remaining candidates (out of MCP reach under personal API key): sender integration 158269 health, email-provider delivery failure, hog-flow runtime issue. Cian made 7 workflow edits 2026-04-20 00:54–07:30 UTC — likely active remediation. Wait for Cian's confirmation + re-run positive path after fix lands.

**DB config** — `MoveInPartner.abandonedCartEnabled` is a boolean added in PR #945. View `ViewMoveInPartnerReferral.referralCode` is the prefix used by the partner-matching code. Treat `MoveInPartner` as read-only during QA (current protocol).

**Verification queries**:

```sql
-- Which partners are abandoned-cart-eligible right now
SELECT name, "referralCode", "abandonedCartEnabled", "useEncouragedConversion"
FROM "ViewMoveInPartnerReferral"
WHERE "abandonedCartEnabled" = true
ORDER BY name;

-- Which buildings inherit the flag via partner link
SELECT mip.name AS partner, COUNT(b.id) AS bldg_count,
       COUNT(b.id) FILTER (WHERE b."useEncouragedConversion" = true) AS eligible_bldgs
FROM "MoveInPartner" mip
LEFT JOIN "Building" b ON b."moveInPartnerID" = mip.id
WHERE mip."abandonedCartEnabled" = true
GROUP BY mip.name ORDER BY mip.name;

-- Does a specific test shortCode resolve to an enabled partner?
SELECT b."shortCode", b."useEncouragedConversion" AS bldg_encouraged,
       mip.name AS partner, mip."abandonedCartEnabled" AS partner_flag,
       mip."useEncouragedConversion" AS partner_encouraged
FROM "Building" b
LEFT JOIN "MoveInPartner" mip ON mip.id = b."moveInPartnerID"
WHERE b."shortCode" = '<shortCode>';
```

## Adding a New Workflow Entry

When a new PostHog-backed feature ships:

1. Get the workflow UUID from the PostHog dashboard URL
2. Request Trigger node screenshot + all Wait Until / Conditional Branch / Email step screenshots from the PostHog owner
3. Find the event emit sites in app code (search for the exact trigger event strings)
4. Document the person-property filters + their app-code sources
5. Document the shortCode / partner / feature-flag gates that determine who's eligible
6. Run a pre-flight test with a known-eligible user + a known-ineligible user to confirm the filters actually select correctly
7. Add the entry to this file, follow the Abandoned Cart pattern above

## Related

- [onboarding-flows.md](./onboarding-flows.md) — shortCode → partner / building / utility resolution
- [inngest-functions.md](./inngest-functions.md) — app-side async event handlers (complementary to PostHog workflows)
- [ENG-2238 test plan](../test_plans/ENG-2238_abandoned_cart_email_workflow.md)
