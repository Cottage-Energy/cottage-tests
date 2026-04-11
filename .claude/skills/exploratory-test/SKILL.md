---
name: exploratory-test
description: Investigate behavior, reproduce bugs, and validate edge cases — interactively or via scaffolded specs
user-invocable: true
---

# Exploratory Test

Two execution modes — pick based on intent.

| Mode | When to use | Primary tools |
|------|-------------|---------------|
| **Interactive** | "Explore this ticket" — systematically test ACs, expand to edge cases, find bugs live | Playwright MCP, Supabase MCP, Figma MCP, Linear MCP |
| **Scripted** | Repeatable investigation — scaffold a spec to run multiple times, share with team, or graduate to regression | Write, Edit |

---

## 1. Gather Context (both modes)

Before investigating, understand what you're looking at. Process all available sources.

### From a Linear ticket (primary trigger for interactive exploration)
- `mcp__linear__get_issue` to pull description, acceptance criteria, reproduction steps, severity, linked PRs, linked Figma/Notion
- **Extract and number every acceptance criterion** — these become the Phase 1 checklist
- Note the environment, user type, and any preconditions mentioned
- **When the ticket references a flow by name** (e.g., "bill upload", "verify utilities", "move-in", "transfer"), look it up in `tests/docs/onboarding-flows.md` to confirm the exact URL, entry point, and code path. Flow names can be ambiguous — e.g., "verify utilities" is a specific onboarding flow at `/verify-utilities/connect-account`, NOT the overview re-upload for `ISSUE_VERIFICATION` users.

### From a Figma link (visual bug or UI verification)
- `mcp__figma__get_design_context` with fileKey and nodeId from the URL
- `mcp__figma__get_screenshot` for the expected design state
- Extract: expected UI components, states, layouts, responsive behavior

### From a PR link (verifying a fix or code change)
- `mcp__github__get_pull_request` + `mcp__github__get_pull_request_files` to understand what changed
- Extract: what code was modified? What behavior should be different?

### From conversation (verbal description)
- User describes the issue — extract what needs to be tested and expected behavior

### Check existing coverage
- `Glob` + `Grep` in `tests/e2e_tests/` to find any existing tests for the area under investigation
- Note what's already automated and what gaps exist

### Check database context
- `mcp__supabase__list_tables` to understand relevant tables
- **Always query `information_schema.columns` first** to discover exact column names before writing data queries — Supabase uses PascalCase with quoted identifiers (e.g., `"cottageConnectUserType"`, `"isConnectAccount"`), and guessing column names wastes time
- `mcp__supabase__execute_sql` to check current data state, feature flags, or preconditions mentioned in the ticket

---

## 2. Interactive Mode — Guided Exploratory Session

When the user says "explore this ticket" or "test this interactively," run a structured three-phase session.

### Phase 1 — AC Validation (test what's specified)

Walk through each acceptance criterion from the ticket, one by one.

For **each AC**:

#### a. Set up the starting state
- `mcp__playwright__browser_navigate` to the target URL
- `mcp__supabase__execute_sql` to set up preconditions if needed (feature flags, user state, test data)

#### b. Snapshot before acting
- `mcp__playwright__browser_snapshot` to see the current accessibility tree
- `mcp__playwright__browser_take_screenshot` to capture the "before" state

#### c. Walk through the AC steps
Interact with the UI step by step:
- `mcp__playwright__browser_click` — buttons, links, toggles, checkboxes
- `mcp__playwright__browser_fill_form` — text inputs, email, address fields
- `mcp__playwright__browser_select_option` — dropdowns
- `mcp__playwright__browser_press_key` — Escape, Enter, Tab
- `mcp__playwright__browser_hover` — tooltips, hover states

After each significant interaction, `mcp__playwright__browser_snapshot` to see the updated state.

#### d. Verify the expected outcome
- **UI verification** — snapshot/screenshot to confirm the expected state rendered
- **DB verification** — `mcp__supabase__execute_sql` to confirm data was created/updated/deleted correctly
- **Network verification** — `mcp__playwright__browser_network_requests` to check API calls succeeded
- **Console check** — `mcp__playwright__browser_console_messages` for JS errors

#### e. Compare against Figma (if design link provided)
- `mcp__figma__get_screenshot` for the expected design
- `mcp__playwright__browser_take_screenshot` for the live app at matching viewport
- **Structured comparison checklist:**
  - Layout & spacing — element positioning, margins, padding
  - Typography — font sizes, weights, line heights
  - Colors — backgrounds, text, borders (use `window.getComputedStyle()` for exact values)
  - Component states — hover, active, disabled, error, empty
  - Responsive — check at mobile (375px), tablet (768px), desktop (1280px) if design includes breakpoints
  - Content — placeholder text, labels, button copy match design
- Flag differences as either **Bug** (wrong implementation) or **Improvement** (design could be better)

#### f. Record the AC result
For each AC, log:
- **PASS** — behavior matches expectation, screenshot captured
- **FAIL** — behavior deviates → immediately chain to `/log-bug` with:
  - Steps to reproduce (exact clicks performed)
  - Expected vs actual behavior
  - Screenshots (before/after)
  - Database state
  - Console/network errors
- **BLOCKED** — can't test due to environment, data, or dependency issue

### Phase 2 — Edge Case Expansion (test beyond the spec)

After all ACs are validated, systematically expand. For each AC that passed, explore variations:

#### Input variations
- Empty/blank inputs — what happens with no data?
- Boundary values — min, max, just over limits
- Special characters — emoji, unicode, HTML, SQL injection patterns
- Very long inputs — exceed expected field lengths
- **Case sensitivity** — for ID/code fields, test lowercase vs uppercase vs mixed case (e.g., `comed` vs `COMED`). Postgres text PKs are case-sensitive by default — near-duplicates can slip through

#### State variations
- Toggle cycling — ON → OFF → ON, does final state persist?
- Back/forward navigation — does state survive browser navigation?
- Refresh mid-flow — does the page recover or break?
- Multiple tabs — same flow open in two tabs simultaneously

#### User/role variations
- Different user types (owner vs roommate, admin vs regular)
- Users with different account states (active, pending, suspended)
- Users with different data states (has electric account vs doesn't, has enrollment vs doesn't)

#### UI interaction variations
- Close modals via X button, Escape key, outside click, "Cancel" button
- Keyboard-only navigation (Tab through form, Enter to submit)
- Rapid double-click on submit buttons
- Resize browser during flow (responsive breakpoints)

#### Data manipulation — progressive isolation
When an AC seems "not testable from UI," manipulate the underlying data through the real system pipeline to create exact conditions. Don't accept "blocked" too quickly.

**Technique: Progressive isolation**
1. Test with valid/normal data first → confirm baseline works
2. Change ONE variable (e.g., NULL one bill's dueDate) → observe what changes
3. Change ALL variables (e.g., NULL every dueDate) → expose the real fallback behavior
4. This narrows down exactly where behavior diverges from expected

**Technique: Pay-then-insert cycle** (for billing/payment scenarios)
1. Pay all outstanding bills via UI → balance = $0
2. Manipulate existing data via Supabase if needed (e.g., NULL dueDates)
3. Insert new record with specific test data via Supabase, set `ingestionState = 'approved'`
4. Wait 7 minutes for Inngest to process (sets to `processed`, recalculates balances)
5. Verify DB state before testing — confirm ingestionState, field values, balance
6. Reload page and test

**Key rule**: Use the real system pipeline (UI payments, Inngest processing), NOT manual DB hacks to set balances or states. Manual hacks create inconsistencies between the DB and what backend APIs return.

**Technique: Inngest API trigger** (for subscription and async job testing)
Inngest functions in `services` repo can be triggered via REST API in dev using `INNGEST_EVENT_KEY` from `.env`:
```bash
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "<event-name>", "data": {}}'
```
Key event names:
- `transaction-generation-trigger` — creates pending `SubscriptionMetadata` for active subscriptions
- `subscriptions-payment-trigger` — processes pending metadata into payments

**Important**: Inngest API always returns 200 regardless of whether a function handled the event. Event names must match exactly (check `services` repo source for correct names). In production these are cron-triggered, not event-triggered.

**Cron-only functions** (CANNOT be triggered via event API — must wait for `*/5` schedule or invoke from Inngest dashboard):
- `balance-ledger-batch` — processes approved bills → `processed`, creates Payment in `requires_capture`
- `stripe-payment-capture-batch` — captures payments in `requires_capture` → `succeeded`
- Pipeline is sequential: ledger batch → stripe capture → then next bill can process
- **Requires billing user** (`maintainedFor` IS NOT NULL) — non-billing users' bills stay `approved` forever

**Full Inngest event reference**: See `tests/docs/inngest-functions.md` for all known event names, apps, and eligibility criteria.

**Technique: Email touchpoint testing** (for Inngest-triggered emails)
When a ticket involves backend-triggered emails (onboarding touchpoints, payment notifications, reminders):

1. **Read the Inngest function source** to understand eligibility criteria:
   ```bash
   gh api repos/Cottage-Energy/services/contents/<path-to-function> --jq '.content' | base64 -d
   ```
   Key things to identify: event name, cron vs event trigger, what DB conditions qualify a user, what data the email uses.

2. **Set up eligible test users** via Supabase — manipulate the specific fields the function checks (e.g., `startDate`, `status`, feature flags). Record original values for restoration.

3. **Trigger the Inngest event**:
   ```bash
   source .env; curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name": "<event-name>", "data": {}}'
   ```

4. **Wait ~45 seconds** for Inngest processing + email delivery.

5. **Verify email content via Fastmail JMAP** (Node.js — no `jq` on Windows):
   ```javascript
   // Search by recipient + recent timestamp
   filter: { to: 'pgtest+<user>@joinpublicgrid.com', after: new Date(Date.now() - 5*60*1000).toISOString() }
   // Parse HTML body for specific content (addresses, names, links, conditional sections)
   ```

6. **Capture email screenshots** — save email HTML to file, serve via local HTTP server (`node -e "require('http').createServer(...)"`), navigate Playwright MCP to `http://localhost:<port>/<file>.html`, take screenshot. Note: `file://` URLs are blocked in Playwright MCP.

7. **Restore all DB changes** immediately after verification.

**Key gotchas**:
- Batch Inngest functions (like `preparing-for-move`) process ALL qualifying users — you can't target one user. Be aware other test accounts may also receive emails.
- `dayjs().diff(date, 'day')` truncates partial days toward zero — a startDate "tomorrow" may actually need to be +2 calendar days for `diff === -1`.
- Test both positive (email sent) AND negative (email NOT sent for ineligible dates/statuses) boundaries.

**Technique: Fetch interceptor for API payload capture**
When you need to inspect request/response bodies for internal API calls (e.g., `generate-token`, any Next.js API route), install a `window.fetch` override via `browser_evaluate` BEFORE triggering the action:
```javascript
window.__interceptedCalls = [];
const origFetch = window.fetch;
window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  const response = await origFetch.apply(this, args);
  if (url.includes('your-endpoint')) {
    const clone = response.clone();
    let body = null;
    try { body = await clone.json(); } catch(e) {}
    let reqBody = null;
    if (args[1]?.body) { try { reqBody = JSON.parse(args[1].body); } catch(e) {} }
    window.__interceptedCalls.push({ url, method: args[1]?.method || 'GET', status: response.status, requestBody: reqBody, responseBody: body });
  }
  return response;
};
```
Then read: `window.__interceptedCalls.filter(c => c.url.includes('your-endpoint'))`

This captures full payloads including request body, which `browser_network_requests` doesn't provide.

#### UX & Improvement Observations
As you walk through each AC and edge case, actively look for opportunities to improve the product — not just things that are broken. You're the person touching every flow end-to-end, so your perspective is uniquely valuable.

**What to look for:**
- **Flow friction** — steps that feel unnecessary, redundant clicks, forms that don't remember state after back navigation
- **Confusing UI** — labels that are ambiguous, icons without clear meaning, screens where you (with full context) have to pause and think
- **Inconsistency** — different wording for the same action across flows, different button styles for the same intent, behaviors that differ without reason between shortcodes/themes
- **Missing feedback** — actions with no loading state, success without confirmation, errors without helpful messages
- **Accessibility gaps** — elements missing roles/labels (you'll notice these from locator priority), poor keyboard navigation, low contrast
- **Empty/error state quality** — what does the user see when there's no data? When something fails? Is the messaging helpful or generic?
- **Information architecture** — is the right info visible at the right time? Is the user forced to navigate away to find something they need in context?
- **Mobile responsiveness** — touch targets too small, content overflow, horizontal scrolling where it shouldn't exist

**How to capture:** For each observation, note:
1. **Where** — exact screen/step/URL
2. **What** — what you observed
3. **Why it matters** — impact on user experience (confusion, friction, drop-off risk)
4. **Suggestion** — a concrete improvement idea

These go into the Phase 3 summary under "UX & Improvement Observations" and can be filed as improvement tickets via `/log-bug` (which supports both bug and improvement types).

#### Error/failure conditions
- Network offline or slow (use `mcp__playwright__browser_evaluate` to simulate)
- API returning errors (observe console/network for unexpected failures)
- Missing required data — skip required fields and attempt to proceed

#### Analytics & side effects
- Check PostHog events fire correctly via `mcp__playwright__browser_network_requests` (filter for posthog.com)
- Check no duplicate events on page refresh or re-render
- Verify no events fire for actions that shouldn't trigger them

For each variation:
1. Interact via Playwright MCP
2. Observe the result
3. If unexpected behavior → capture evidence and chain to `/log-bug`
4. If working as expected → note it and move on

### Phase 2b — Accessibility Quick Audit (optional, run when requested or when UX observations flag a11y gaps)

Run on the primary page(s) under test. This is a focused check, not a full WCAG audit.

#### Automated scan via axe-core
```javascript
// Inject axe-core and run scan via browser_evaluate
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';
document.head.appendChild(script);
// After load:
const results = await axe.run();
return { violations: results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length })) };
```

#### Keyboard navigation
- Tab through the entire page — does focus order make sense?
- Can every interactive element (buttons, links, inputs, toggles) be reached via Tab?
- Can modals be closed with Escape?
- Does Enter/Space activate buttons and links?
- Is there a visible focus indicator on every element?

#### Screen reader labels
- `mcp__playwright__browser_snapshot` gives the accessibility tree — check:
  - Do images have alt text?
  - Do form inputs have labels?
  - Do buttons have descriptive text (not just icons)?
  - Are ARIA roles used correctly (not overused)?

#### Contrast spot-check
- Use `window.getComputedStyle()` on text elements to get `color` and `backgroundColor`
- Flag any text that appears light-on-light or dark-on-dark

**Output**: Add findings to the Phase 3 summary under "Accessibility" column in Edge Cases table, or as UX Improvement observations if they're not outright failures.

### Phase 3 — Session Summary

After both phases, produce a structured summary:

```
## Exploratory Session Summary — [ticket ID or feature]

### AC Results
| # | Acceptance Criterion | Result | Notes |
|---|---------------------|--------|-------|
| 1 | [AC description] | PASS/FAIL/BLOCKED | [brief note] |
| 2 | [AC description] | PASS/FAIL/BLOCKED | [brief note] |

### Edge Cases Explored
| Category | Variation | Result | Notes |
|----------|-----------|--------|-------|
| Input | Empty email field | PASS | Shows validation error |
| State | Back button mid-flow | FAIL | Loses form data → BUG-XXX |
| UI | Esc to close modal | PASS | Modal closes, state preserved |

### Bugs Filed
| Bug ID | Title | Severity | User Impact | Found During |
|--------|-------|----------|-------------|-------------|
| BUG-XXX | [title] | [severity] | [what the user experiences — concrete, non-technical] | Phase 1 AC #2 / Phase 2 edge case |

### UX & Improvement Observations
| # | Screen/Step | Observation | Impact | Suggestion | Filed? |
|---|------------|-------------|--------|------------|--------|
| 1 | [where] | [what you noticed] | [why it matters — confusion, friction, drop-off risk] | [concrete improvement idea] | [TICKET-ID or "Not filed"] |
| 2 | [where] | [what you noticed] | [impact] | [suggestion] | [TICKET-ID or "Not filed"] |

> These are not bugs — the feature works as coded. These are opportunities to make the product better. File as improvement tickets via `/log-bug` when the suggestion is actionable.

### Coverage Assessment
- ACs tested: [N] / [total]
- Edge cases explored: [N]
- Bugs found: [N]
- Areas NOT tested (and why): [list]

### Recommended Next Steps
- `/new-test` to automate [specific AC or edge case]
- `/fix-test` if existing tests need updating
- `/test-plan` if the feature needs full test plan coverage
- `/log-bug` to file improvement tickets for UX observations worth acting on

### Documentation Check
- Did you discover an Inngest function, flow, or data pattern not yet documented? → Create/update a doc in `tests/docs/`
- Did you discover a new Inngest event name or eligibility criteria? → Update `tests/docs/inngest-functions.md`
- Did you map a new flow (email, onboarding variant, admin process)? → Offer to generate a flow doc (see Phase 4)
```

### Phase 4 — Flow Documentation (optional, offer when a new flow was walked)

When the session walked through a flow not yet documented in `tests/docs/`, offer to generate a flow doc. This turns the exploratory session into reusable team knowledge.

**When to offer**: you walked through 3+ sequential steps in a flow that doesn't have a doc yet.

**Template** — save to `tests/docs/{flow-name}.md`:
```markdown
# {Flow Name}

## Overview
Brief description of the flow's purpose and entry points.

## Entry Points
| URL | Shortcode | Notes |
|-----|-----------|-------|
| [URL] | [shortcode or N/A] | [conditions] |

## Steps
| # | Screen | URL | User Action | What Happens |
|---|--------|-----|-------------|-------------|
| 1 | [screen name] | [URL] | [what user does] | [result] |
| 2 | ... | ... | ... | ... |

## Key DB State
| Table | Column | Value | Meaning |
|-------|--------|-------|---------|
| [table] | [column] | [value] | [what it controls] |

## Edge Cases & Gotchas
- [anything surprising discovered during the session]

## Related
- Test plan: [link if exists]
- Automated tests: [file paths if exist]
- Linear tickets: [related tickets]
```

---

## 3. Scripted Mode (Scaffold a spec)

Create a reusable exploratory spec when you need to:
- Run the investigation multiple times (flaky behavior)
- Share reproduction steps with the team
- Capture PostHog events or intercept network requests
- Graduate the test to regression later

### Placement
- Place in `tests/e2e_tests/exploratory/`
- Subdirectories by purpose: `bug-investigation/`, `edge-cases/`, `ui-validation/`
- Name: `explore_{what_you_are_investigating}.spec.ts`

### Required imports
```typescript
import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
```
Import fixtures only as needed:
```typescript
import { generateTestUserData, CleanUp } from '../../resources/fixtures';
```

### Structure template
```typescript
const log = createLogger('Exploratory');

test.describe('Explore: <brief description of investigation>', () => {
  test.describe.configure({ retries: 0 });

  test.afterEach(async ({ page }) => {
    // Include cleanup if test creates data; omit if read-only investigation
    await page.close();
  });

  test('<what you are investigating>', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    // Navigate, set initial state

    log.section('Investigation');
    log.step(1, 'Describe what this step checks');
    // ... page interactions via page objects ...
    log.info('Observed behavior', { /* relevant data */ });

    log.section('Findings');
    // Soft assertions — use expect.soft() so the test continues past failures
    expect.soft(/* observed */).toBe(/* expected */);
  });
});
```

### Key conventions
| Aspect | Exploratory Test | Standard Test |
|---|---|---|
| Tag | `TEST_TAGS.EXPLORATORY` | `TEST_TAGS.REGRESSION*` / `TEST_TAGS.SMOKE` |
| Timeout | `TIMEOUTS.TEST_EXPLORATORY` (5min) | `TIMEOUTS.TEST_MOVE_IN` etc. |
| Assertions | Prefer `expect.soft()` to capture all findings | Hard `expect()` |
| Logging | Verbose — `log.section()`, `log.step()`, `log.info()` heavily | Minimal |
| Cleanup | Required only if test creates data | Always required |
| Retries | `retries: 0` — no retries, the point is observing | CI default (2) |

### Building page objects for the investigation
If the test interacts with a page that doesn't have a POM yet, use Playwright MCP to inspect the live page first:
1. `mcp__playwright__browser_navigate` to the target URL
2. `mcp__playwright__browser_snapshot` to capture the accessibility tree
3. Use the snapshot to identify correct roles, names, and labels for locators
4. Build the POM with the locator hierarchy: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')`

### Verifying database state in scripted tests
If the investigation involves checking data persistence:
1. `mcp__supabase__list_tables` to find relevant tables
2. `mcp__supabase__execute_sql` to inspect schema (column names, types)
3. Add database queries in the spec or create a fixture in `tests/resources/fixtures/database/`

### Running scripted exploratory tests
```bash
# All exploratory tests
npx playwright test --project=Exploratory

# Specific investigation
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts

# Headed (live observation)
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts --headed

# Debug (step-by-step with Inspector)
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts --debug
```

---

## 4. Cleanup After Session

**CRITICAL: Upload screenshots BEFORE deleting local files.** The cleanup sequence must be: (1) upload to tmpfiles.org, (2) embed in Linear ticket **comment** via `save_comment`, (3) THEN delete local PNGs. Deleting before uploading loses evidence permanently. **NEVER modify the ticket description** — it belongs to the creator/dev.

Before finishing any exploratory session (interactive or scripted), clean up generated artifacts:

1. **Screenshots** — delete local PNG files ONLY AFTER they've been uploaded to tmpfiles.org and embedded in Linear ticket **comments**
2. **`.playwright-mcp/` directory** — Playwright MCP creates this in the project root; delete it after the session
3. **`test-results/` directory** — if scripted exploratory tests were run and failed, remove generated trace/screenshot artifacts
4. **Browser sessions** — ensure `mcp__playwright__browser_close` is called to release the browser

```bash
# Cleanup commands
rm -f *.png                          # screenshots in project root
rm -rf .playwright-mcp/              # Playwright MCP session data
rm -rf test-results/                 # test runner artifacts (only if safe to remove)
```

Do NOT skip cleanup — leftover artifacts bloat the repo and can be accidentally committed.

---

## 5. Graduating an Exploratory Test

When the investigation is complete:
1. **Found a bug** → `/log-bug` to file in Linear, then `/new-test` to create a regression test that guards against recurrence
2. **Validated an edge case** → convert to a formal test with hard assertions and a regression tag using `/new-test`
3. **Confirmed expected behavior** → delete the exploratory test — it served its purpose
4. **Inconclusive** → document findings in the spec comments and keep for future investigation

Do not let exploratory tests accumulate indefinitely — they should be graduated or deleted.

---

## 6. Rules (never violate)
- Use `TEST_TAGS.EXPLORATORY` — never raw strings like `'@exploratory'`
- Use `TIMEOUTS` constants — never magic numbers
- Use structured logger (`createLogger`) — never `console.log`
- No `any` types — import proper types from `tests/resources/types/`
- Use page objects for UI interactions in scripted tests — never raw selectors in spec files
- Set `retries: 0` — exploratory tests should not retry
- Do NOT add exploratory tests to regression/smoke suites

---

## 7. Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_select_option`, `browser_press_key`, `browser_hover`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` — interactive exploration |
| **Supabase MCP** | `list_tables`, `execute_sql` — verify database state, check preconditions, confirm data persistence |
| **Figma MCP** | `get_design_context`, `get_screenshot` — compare live app against expected design |
| **Linear MCP** | `get_issue` — pull ticket context and ACs; chain to `/log-bug` to file bugs found during session |
| **GitHub MCP** | `get_pull_request`, `get_pull_request_files` — understand code changes when investigating a fix or regression |
| `Glob`, `Grep` | Find existing tests and coverage for the area under investigation |
| `Write`, `Edit` | Scaffold scripted exploratory specs |

---

## 8. Screenshot Evidence & Linear Attachment

When capturing screenshots during exploratory sessions and needing to attach them to Linear tickets:

### Upload workflow
1. `mcp__playwright__browser_take_screenshot` to save PNG files locally
2. Upload to **tmpfiles.org**: `curl -s -o /tmp/upload.json -F "file=@screenshot.png" https://tmpfiles.org/api/v1/upload && cat /tmp/upload.json` — returns a JSON with URL
3. Convert URL: replace `tmpfiles.org/` with `tmpfiles.org/dl/` for the direct link
4. **Post screenshots in a ticket comment**: Use `mcp__linear__save_comment` with the `issueId` to embed images. **NEVER modify the ticket description** — it belongs to the creator/dev. tmpfiles.org links expire in ~1 hour, but the comment preserves the test record.
5. Clean up local PNG files after upload

**Why not base64 directly?** MCP tool parameters can't handle large base64-encoded images. The tmpfiles.org upload → URL embed in comment pattern is the reliable workaround.

**Why comments, not descriptions?** The ticket description belongs to the creator. Overwriting it with QA results loses the original ACs and spec. Always use comments for QA findings.

### Screenshot naming convention
Name screenshots descriptively: `{area}-{detail}-{viewport}.png`
- e.g., `sign-in-desktop-chrome.png`, `onboarding-step2-mobile.png`, `transfer-address-card-confirmed.png`

---

## 9. Parallel Sub-Agents for Independent Test Areas

When multiple independent test areas need exploration (e.g., different browsers, different flows), use parallel sub-agents via the Agent tool:
- Each sub-agent gets its own Playwright browser session
- **Limit to 2-3 concurrent Playwright agents** — more than that causes 429 rate limiting on dev server
- Use additional agents for non-browser work (DB queries, code analysis) to stay productive
- Example: one agent tests sidebar cards, another tests subscription tabs, a third runs DB verification queries
- Consolidate findings from all agents before posting to Linear
- This significantly reduces total exploration time

---

## 10. Common Blockers & Workarounds

| Blocker | Symptom | Workaround |
|---------|---------|------------|
| Password reset dialog | `[role="alertdialog"]` with "Set up your new password" blocks the page | `page.evaluate(() => document.querySelector('[role="alertdialog"]').remove())` |
| `/sign-out` 404 | Direct navigation to `/sign-out` returns 404 | Clear cookies via `page.evaluate` then navigate to `/sign-in` |
| GitHub MCP 404 | `mcp__github__get_pull_request` or `list_pull_requests` returns "Not Found" for cottage-nextjs, pg-admin, or other repos | Fall back to `gh pr list --repo Cottage-Energy/<repo> --state merged --limit 10 --json number,title,mergedAt,author` or `gh pr view <number> --repo Cottage-Energy/<repo> --json ...` |
| Linear MCP auth expires | Linear tools not found in ToolSearch | Re-run `ToolSearch` with `select:mcp__linear__save_comment` — may re-trigger auth |
| OTP email pollution | Interactive sessions trigger OTP emails that accumulate for shared test accounts | After exploration, note which test accounts had OTPs triggered — automated tests using those accounts may fail until emails clear. Consider using `getLatestOTP()` pattern (take most recent email) instead of asserting exactly 1 email |
| Start Service Date dialog | Every save on accounts with date discrepancy (Start Date ≠ Start Service Date) triggers "Start Service Date Change Detected" dialog | Dismiss with Cancel to avoid committing date changes. This is unrelated to the feature under test — don't mistake it for feature behavior |
| Unknown test user password | Can't sign in to customer FE as a test user because password is unknown/expired | Use Supabase admin API: `source .env && curl -X PUT "https://wzlacfmshqvjhjczytan.supabase.co/auth/v1/admin/users/<user-id>" -H "Authorization: Bearer $SUPABASE_API_KEY" -H "apikey: $SUPABASE_API_KEY" -H "Content-Type: application/json" -d '{"password": "NewPassword123!"}'`. Both `Authorization` and `apikey` headers are required. Env var is `SUPABASE_API_KEY` (not `SUPABASE_SERVICE_ROLE_KEY`). |
| Large PG Admin snapshots | `browser_snapshot` output >50KB gets truncated in tool results | Use `filename` parameter to save to file, then `grep` the file for specific patterns (dialog names, button refs, status values) |
| mi-session/start redirect | Onboarding pages (`/move-in`, `/transfer`, `/bill-upload`, `/finish-registration`) auto-redirect within seconds via `mi-session/start` API | Intercept fetch immediately after `browser_navigate`: `window.fetch = function(...args) { if (args[0]?.includes?.('mi-session/start') \|\| (typeof args[0] === 'string' && args[0].includes('mi-session/start'))) return new Promise(() => {}); return window.__origFetch.apply(this, args); };` (save `__origFetch` first) |
| Short page content | Pages don't have enough content to scroll for scroll testing | `browser_resize` to width 1280, height 400 to force scrollable content |
| Playwright MCP is Chromium-only | Cannot test Safari bfcache or Firefox behavior via MCP | Note as limitation in results. True cross-browser tests need `npx playwright test --project=Safari` via the test runner |
| Parallel agents rate limiting | 4+ concurrent Playwright agents hitting dev server causes 429 errors | Limit to 2-3 concurrent browser agents; use extra agents for DB/code work |
| Parallel move-in agents | Multiple agents doing move-in share browser session — autocomplete cross-contamination, wrong emails, incomplete registrations | **NEVER** run move-in flows in parallel via Playwright MCP. Run them sequentially, one at a time. Non-browser agents (DB, Inngest) can run in parallel. |
| Cron-dependent testing | Waiting 15+ min for cron jobs wastes time | Poll every 3 min instead of sleeping for the full expected duration. Check DB state each poll. |
| Stripe iframe | Previously thought cross-origin Stripe iframes were inaccessible | Playwright MCP CAN access Stripe iframe content — snapshot includes `f{N}e{N}` refs. Use `browser_fill_form` with those refs. Pattern: card=`4242424242424242`, exp=`12 / 30`, CVC=`123`, country=`United States`, ZIP=`10001` |
| ESCO notice (NY) | New York addresses trigger regulatory `alertdialog` "Because you live in New York..." | Dismiss with `browser_click` on "Got it!" button. Don't confuse with feature behavior |
| Multi-property user | User lands on `/app/summary` instead of `/app/overview` | Click "View" on the specific property card. Users with 2+ properties always see the picker first |
| tmpfiles.org upload output lost | `curl -s -F "file=@img.png" https://tmpfiles.org/api/v1/upload` returns empty in bash pipelines | Write to temp file: `curl -s -o /tmp/upload.json -F "file=@img.png" https://tmpfiles.org/api/v1/upload && cat /tmp/upload.json`. Direct URL: replace `tmpfiles.org/` with `tmpfiles.org/dl/` |
| Password reuse on reset | Supabase admin password reset with same password returns 422 | Remove the dialog via `document.querySelector('[role="alertdialog"]').remove()` instead of completing the form |
| Supabase project ID wrong | `mcp__supabase__execute_sql` returns "Forbidden resource" | Dev = `wzlacfmshqvjhjczytan`, Staging = `euztcfcsytpxtyepvdcj`. Use `mcp__supabase__list_projects` to verify. |
| OTP needed in interactive session | Can't call `FastmailActions.Get_OTP` outside Playwright test runner | Use Node.js JMAP script: `cd cottage-tests && node -e "require('dotenv').config(); /* fetch email via axios */"` — see memory `fastmail-otp-retrieval.md` for full pattern |
| No `jq` on Windows | bash JSON parsing fails | Use `node -e` with `JSON.parse()` instead of `curl | jq` |
| Inngest cron functions not triggerable via event API | `inn.gs/e/balance-ledger.batch` returns 200 but does nothing — cron functions ignore event sends | Wait for `*/5` cron cycle (~5 min) or invoke from Inngest dashboard. Don't waste time retrying event sends. |
| Bills stuck in `approved` | `balance-ledger-batch` won't process bills for non-billing users | User must have `maintainedFor` IS NOT NULL on ElectricAccount — requires billing move-in path ("Public Grid handles everything" + Stripe card). Non-billing users (`maintainedFor = null`) stay `approved` forever. |
| Second bill won't process | First bill's payment is in `requires_capture`, blocking next bill | Pipeline is sequential: ledger batch → stripe capture → then next bill. Wait for `stripe-payment-capture-batch` cron, or set 2nd bill directly to `processed` for FE-only testing. |
| Light session caching | Second Light flow test skips to success page | Close browser or clear cookies/localStorage/sessionStorage between each Light flow test |
| Light phone validation | `1111111111` returns 400 Invalid phone number | Use `(646) 437-6170` for Light flow, `1111111111` for standard move-in |
| Quoted URL params in TanStack | ZIP appears as `zip="10001"` instead of `zip=10001` — causes verify-utilities to hang and TX flow wrong routing | Known TanStack bug — same root cause for both. Bill-upload works because it passes ZIP differently |
| Verify-utilities stuck on "Checking availability..." | Button stays disabled with spinner indefinitely after entering ZIP | Caused by quoted URL params bug. Use bill-upload flow instead for testing until fixed |
| Tab clicks blocked by dialogs | Password reset / terms dialogs block tab element clicks; `evaluate`-based clicks don't trigger React state | Use URL params: `browser_navigate` to `/app/account?tabValue=subscriptions` (or `?tabValue=payment`, etc.) instead of clicking tab elements |
| Figma MCP access denied | PG-App Figma file is password-protected; all MCP calls fail with "could not be accessed" | Ask the user for a manual Figma screenshot. Don't retry MCP — it's a known limitation with password-protected files |
| Radix calendar blocks clicks | `data-radix-popper-content-wrapper` intercepts pointer events on buttons beneath it; Next button click times out | Click a date in the calendar to close it naturally, THEN click Next. **NEVER remove the popper via DOM** — causes fatal React `removeChild` crash |
| Transfer flow null address | Properties with `addressID: null` show "Address unavailable"; Next won't advance on move-out date screen | Find test users with valid addresses: query with `JOIN "Address" ON "Address"."id" = "Property"."addressID"` and `"street" IS NOT NULL` |
| Playwright MCP browser dead | `Target page, context or browser has been closed` after force-killing Chrome | MCP connection is unrecoverable. Fallback: use `node -e "const { chromium } = require('playwright'); ..."` script to take screenshots programmatically. Each flow needs its own `browser.newContext()` to avoid session contamination. |
| AC vs implementation mismatch | AC text says one thing, implementation does another — tempting to file as bug | **Always check Figma design first.** Design is source of truth. If design matches implementation, the AC text is wrong — flag as discrepancy, don't file a bug. Learned from ENG-2442 AC30 false positive. |
| PG-Admin dialog scroll | `fullPage: true` screenshots don't capture dialog/sheet inner scroll. `scrollIntoView` from main page doesn't work. | Find the dialog's scroll container and set `scrollTop` directly: `document.querySelector('.h-full.overflow-y-auto').scrollTop = 500`. Take screenshots after each scroll position. |
| Manually inserted SubscriptionMetadata | Cancel endpoint doesn't process manually INSERTed metadata (missing `transactionID`). Leads to false-positive bugs. | **Always use Inngest-generated metadata** for subscription cancel/payment testing. Run the full `transaction-generation-trigger` pipeline to create metadata, never `INSERT INTO "SubscriptionMetadata"` directly. ENG-2672 was a false positive from this exact mistake. |
| PG-Admin session expiry | Closing Playwright MCP browser loses PG-Admin auth. Reopening navigates to `/login` (Google SSO) which can't be automated via MCP. | Keep the browser open during the full PG-Admin session. If session expires, fall back to **DB-level testing via Supabase** for business logic validation (e.g., case-sensitive ID checks, constraint testing). For UI retesting, ask user to sign in manually or use a fresh browser session. |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-13 (ENG-2402 Connect Account)
- **Supabase column discovery**: Wasted 4+ attempts guessing column names. Added instruction to always query `information_schema.columns` first.
- **OTP email pollution**: Two exploratory sessions triggered multiple OTP emails for the same shared test users. This caused the subsequent `/new-test` spec to fail because `Get_OTP` asserts exactly 1 email. Added to Common Blockers table.
- **Mutually exclusive cards**: Connect ELIGIBLE users see auto-apply card; non-connect users see renewable energy card. These are exclusive — never both. This kind of business logic discovery is valuable to capture in the session summary.

### Session: 2026-03-16 (ENG-2406 PG Admin Deep Testing)
- **PG Admin inline edit patterns**: Two distinct patterns discovered — (1) **contenteditable** for free-text fields (External Signing ID, Notes): double-click cell button → type with `pressSequentially(slowly: true)` → Enter to save; (2) **combobox dropdowns** for select fields (State, Provider, Consent Method): double-click cell button → dropdown appears → click option to select. These are TanStack Table patterns, not standard HTML forms.
- **`pressSequentially` vs `fill` for search**: `pressSequentially("Zack")` only typed "k" in a search field. `browser_fill_form` with `fill()` set the full value correctly. Prefer `fill()` for search/text inputs; reserve `pressSequentially` for contenteditable cells.
- **GitHub MCP 404 affects pg-admin too**: Not just cottage-nextjs. Updated Common Blockers to mention all repos and the CLI fallback pattern.

### Session: 2026-03-16 (ENG-2406 Full Consent Framework — 6 phases)
- **Multi-phase sessions need explicit phase tracking**: This was the largest exploratory session to date — 6 phases, 106/108 test cases, 5 bugs filed, 14 observations. Tracking progress via TodoWrite and posting phase summaries to Linear after each phase kept the session organized. Without phase-by-phase posting, the final summary would be overwhelming.
- **DB trigger testing is high-value**: Testing `create_community_solar_consent()` trigger directly via SQL INSERT uncovered the wildcard config gap (TC-096) that UI testing alone would miss. Always include direct DB trigger/function testing when the feature has server-side logic.
- **Supabase admin API for password resets**: When test user passwords are unknown/expired, use `curl -X PUT "https://<project>.supabase.co/auth/v1/admin/users/<user-id>" -H "Authorization: Bearer <service_role_key>" -d '{"password": "NewPassword123!"}'` instead of guessing credentials. This saved significant time in both ENG-2406 and ENG-2395.
- **DocuSeal embed testing pattern**: For third-party embeds (DocuSeal, Documenso), the embed loads inside the app's modal/dialog. Test with valid URLs first, then invalid/null URLs to verify graceful degradation. Invalid URLs = infinite spinner (filed as bug); null URLs = graceful "documents being prepared" message.
- **Observations table pattern**: For complex features, collecting non-bug findings (data inconsistencies, UX nits, potential issues) into a numbered observations table and posting to Linear gives the team actionable context beyond just pass/fail.

### Session: 2026-03-16 (ENG-2395 NEVER_VERIFIED Status)
- **Large snapshots need file-based approach**: PG Admin pages produce snapshots >50KB that exceed tool output limits. Using `browser_snapshot` with `filename` parameter and then `grep`-ing the saved file for specific patterns (dialog names, button refs) is much more reliable than trying to parse truncated inline output.
- **Start Service Date dialog is a recurring red herring**: Every save on the Newark International account triggers a "Start Service Date Change Detected" dialog due to a date discrepancy (Start Date vs Start Service Date). This is NOT related to the feature under test. When testing account saves, expect and dismiss this dialog — don't mistake it for feature behavior.
- **`CottageUser` table not directly queryable**: `SELECT FROM "CottageUser"` fails with 42P01. User data lives in `auth.users`. Use `auth.users` for user lookups, not CottageUser.
- **Password reset dialog**: For PG Admin customer FE testing, use the Supabase admin API to set a known password rather than trying to guess or reset via UI. This was essential for testing the customer FE side of NEVER_VERIFIED.
- **Shared Account Management**: When testing status changes on accounts with both Electric and Gas (shared utility company), a single status change in PG Admin updates BOTH accounts simultaneously. Always verify both account IDs in DB after a status change.

### Session: 2026-03-17 (ENG-2417 Flex Token Retest + PR #271)
- **Fetch interceptor for API payload capture**: When you need to inspect request/response bodies for API calls (e.g., `generate-token`), install a `window.fetch` override via `browser_evaluate`. This captures full payloads including request body, which `browser_network_requests` doesn't provide. Pattern: `window.__interceptedCalls = []; const origFetch = window.fetch; window.fetch = async function(...args) { /* clone response, capture body, push to array */ };`
- **Inngest bill processing for test data setup**: Insert bills in `ElectricBill` with `ingestionState = 'approved'` via Supabase. Inngest picks them up every ~5 mins and sets to `processed`, which updates balances naturally. Wait 7 mins to be safe. Do NOT manually set `ingestionState = 'processed'` — let Inngest do it so the full pipeline runs (balance recalculation, etc.).
- **Balance endpoint vs Flex bill endpoint are separate code paths**: The frontend's `generate-token` payload gets `nearestDueDate` from the balance endpoint (`/property/{id}/balance`), NOT from `bill-formatter.ts`. When testing backend changes to due dates or balances, verify WHICH endpoint the frontend actually calls. Don't assume a change to one endpoint affects the other.
- **Pay-then-insert pattern for realistic test scenarios**: Pay existing bills via UI (card payment), wait for $0 balance, then insert new bills with specific data via Supabase + Inngest. This creates controlled AC scenarios with real payment history.
- **Session clearing between users**: For reliable sign-out via Playwright MCP, clear cookies + localStorage + sessionStorage: `document.cookie.split(";").forEach(...)` + `localStorage.clear()` + `sessionStorage.clear()`, then navigate to `/sign-in`.
- **`dueDate` column default is `now()`**: When inserting bills with explicit `NULL` for dueDate, the NULL overrides the default. But Inngest may compute a display date (statementDate + 3 days) shown in the frontend — this is frontend-only, DB stays NULL.

### Session: 2026-03-18 (ENG-2439 Scroll Behavior + ENG-2396/2399/2374 Overview Sidebar)
- **mi-session/start auto-redirect is the #1 blocker for onboarding flow testing**: Every onboarding page (`/move-in`, `/transfer`, `/bill-upload`, `/finish-registration`) triggers `mi-session/start` API that redirects within seconds. MUST intercept fetch immediately after every `browser_navigate`. Added to Common Blockers table.
- **Parallel agents cause rate limiting**: Running 4 Playwright MCP agents simultaneously against dev server caused 429 errors, blocking Light + Transfer flow tests. Limit to 2-3 concurrent browser agents. Updated Section 9 with this constraint.
- **Playwright MCP is Chromium-only**: Cannot test Safari bfcache or Firefox via MCP. True cross-browser tests need the Playwright test runner with browser projects. Added to Common Blockers.
- **Viewport height matters for scroll testing**: Many onboarding pages fit within standard viewports (812px). Must reduce to 400px height to force scrollable content and get meaningful scroll position values.
- **CottageUsers table is plural**: `"CottageUsers"` not `"CottageUser"`. The DB verification agent wasted attempts on the wrong name. Always query `information_schema.tables` first for unfamiliar tables.
- **PR deployment timing affects testing**: PR #1100 was merged 2h before testing but wasn't deployed to dev yet. Always check merge time vs deployment status before reporting FAILs. The non-billing FE failures were deployment timing, not code bugs.
- **`enrollmentPreference` is NOT on ElectricAccount**: Despite code references to `enrollmentPreference`, the column doesn't exist on `ElectricAccount`. It's tracked in a separate table. Always verify column existence via `information_schema.columns` before assuming column locations from code.
- **0 ENROLLED DR users in dev**: Only PENDING and CANCELLED. Had to manually update one record to ENROLLED status for GridRewards enrolled card testing. Test user: `pgtest+grid-007@joinpublicgrid.com`.

### Session: 2026-03-20 (ENG-2396/2399/2374/2453 Full Sidebar + Non-billing + Inngest Pipeline)
- **Stripe iframe IS accessible via Playwright MCP**: Previously assumed cross-origin Stripe iframes couldn't be filled. The snapshot DOES include iframe content with `f{N}e{N}` refs. Fill pattern: `browser_fill_form` with refs from the iframe snapshot works — Playwright MCP uses `page.locator('iframe[name="__privateStripeFrame..."]').contentFrame().getByRole(...)`. No manual intervention needed for Stripe card entry.
- **tmpfiles.org upload output gets swallowed in bash pipelines**: Multi-command chains with `&&` lose output. Use `curl -s -o /tmp/file.json -F "file=@screenshot.png" https://tmpfiles.org/api/v1/upload && cat /tmp/file.json` pattern — write to temp file then read separately.
- **Building + Utility + SubscriptionConfig must ALL be aligned for RE**: `Building.offerRenewableEnergy = true` is not enough. The `UtilityCompany` must also have `offerRenewableEnergy = true` AND `subscriptionConfigurationID` linked. Missing any one = RE option won't appear in move-in or sidebar.
- **Inngest testing requires date alignment**: `Subscription.startDate` must be in the past (at least 1 month) AND `SubscriptionConfiguration.dayOfMonth` must match today's date for the `transaction-generation-trigger` to create `SubscriptionMetadata`. Always set both before triggering.
- **Subscription status enum is American spelling**: `active` | `canceled` (one L, not `cancelled`).
- **Password reuse blocked on reset**: `PUT /auth/v1/admin/users/{id}` with `{"password": "PG#12345"}` works for first reset, but Supabase returns 422 if the same password was used before. The password reset dialog can be removed via `document.querySelector('[role="alertdialog"]').remove()` instead.
- **Multi-property users go to /app/summary**: Users with multiple properties (like `pgtest+tf-in002`) land on a property picker page instead of `/app/overview`. Must click "View" on the specific property to test.
- **ESCO notice for NY addresses**: New York addresses trigger an ESCO regulatory notice (`alertdialog` with "Because you live in New York..."). Dismiss with "Got it!" button before proceeding. Don't confuse with feature behavior.
- **AC-first then data manipulation is non-negotiable**: Session started with ad-hoc screenshot collection. User corrected to follow the skill structure: pull ACs first, walk through each systematically, THEN expand to edge cases with data manipulation. The structured approach found both bugs (ENG-2465, ENG-2467) that ad-hoc testing missed.
- **Data manipulation is the highest-value exploratory technique**: Setting `enrollmentPreference` to null/verification_only/automatic, flipping `offerRenewableEnergyDashboard`, `shouldShowDemandResponse`, `isHandleBilling` on buildings, and manipulating `SubscriptionConfiguration.dayOfMonth` + `Subscription.startDate` for Inngest — these DB-level manipulations tested more AC combinations than UI-only exploration ever could.
- **`enrollmentPreference` lives on `CottageUsers` table**: Confirmed and used extensively for data manipulation testing. Not on ElectricAccount, not on Property.

### Session: 2026-03-23 (ENG-2470 Legal Consent Links, LPOA Tracking, IP Capture)
- **Household invitation testing**: Owner invites from `/app/household` → "Add member" → email → "Send invite". Invitation email uses Resend tracked links (`resend-links.com`). Invite URL in email uses `dev.onepublicgrid.com` NOT `dev.publicgrid.energy`. Actual page: `/resident?inviteCode={code}`. Extract inviteCode by parsing `href` containing `resident%3FinviteCode` from email HTML.
- **TermsAndConditions table for modal testing**: `TermsAndConditions` table has `versionDate` column. Outdated-terms modal triggers when user's `termsAndConditionsDate < latest versionDate`. Null-terms modal triggers when `termsAndConditionsDate IS NULL`. Set user's date to before latest `versionDate` (currently `2026-03-20`) to trigger outdated modal.
- **Partner theme testing pattern**: Use `venn73458test` (Venn/coral, encouraged conversion) or `moved5439797test` (Moved/blue, standard 5-step). Old shortcodes (`funnel4324534`, `venn325435435`) are NOT in Building table — resolve via MoveInPartner API. Verify link color via `window.getComputedStyle(link).color`. Note: RE variant components don't inherit partner `primaryColor` (bug ENG-2617).
- **Password auth avoids OTP rate limiting**: When a test user has a known password (e.g., `PG#12345!`), use password sign-in instead of OTP. Multiple OTP requests to same email cause Supabase 429 rate limits that persist for minutes.
- **Move-in "MM/DD/YYYY" field is move-in date, NOT DOB**: The date field on "About You" step is the move-in start date (must be within 3 days of today). DOB is on the identity step. Use tomorrow's date for move-in.
- **Use `1111111111` for test phone numbers**: Prevents sending real SMS to random numbers.
- **SSO not testable in dev**: `isSSOEnabled = false` on all utilities. `/sign-up` always goes to wait list.
- **ALWAYS take screenshots**: User requires screenshot evidence for every AC and edge case in exploratory sessions. Post to Linear with tmpfiles.org hosting.

### Session: 2026-03-23 (ENG-2430 GUID & LeaseID Parity)
- **Fastmail OTP retrieval via Node.js**: Can fetch OTPs directly without asking the user. Pattern: `cd cottage-tests && node -e "require('dotenv').config(); /* axios JMAP calls */"` using `FASTMAIL_API_KEY` from `.env`. Search emails by `to` address, extract 6-digit code from HTML body. No `jq` on Windows — must use Node.js instead of bash+curl+jq.
- **Supabase dev project ID**: `wzlacfmshqvjhjczytan` (NOT `jruifrkxfqmaimtodssv`). Use `mcp__supabase__list_projects` to discover correct ID if unsure.
- **Property table join path**: `Property` has no `cottageUserID` column. Join via `ElectricAccount`: `Property.electricAccountID → ElectricAccount.id`, then `ElectricAccount.cottageUserID → auth.users.id`. Always check `information_schema.columns` first.
- **Drop-off / resume testing pattern**: Create user with guid → complete to Payment step → clear cookies → navigate with same guid (should resume, console logs `refreshed in progress session`) → navigate with same value as leaseID (should NOT resume, starts fresh). This tests `checkIfGuidInProgress` isolation without needing complex provider state.
- **Non-billing path is faster for exploratory**: "I will manage payments myself" skips Stripe iframe entirely. Use this when payment method isn't the thing under test — saves 30+ seconds per flow.
- **Always test shortCode variations**: Different shortCodes trigger different flow variants (`autotest` = standard 6-step, `pgtest` = encourage conversion address-first, `txtest` = TX dereg address-first, no shortCode = generic 5-step). URL param behavior (guid/leaseID) should work identically across all. User explicitly called this out as a gap.

### Session: 2026-03-30 (ENG-2571 Savings Alert Preference — Onboarding Paths)
- **Never modify ticket descriptions**: Ticket descriptions belong to the creator/dev. Always post QA results and screenshots in **comments** via `save_comment`. tmpfiles.org links expire in ~1 hour, but the comment preserves the test record. Learned from ENG-2675 — overwrote the original ACs with QA results and had to revert.
- **Path-dependent enrollment defaults are by design**: Non-billing onboarding flows (bill upload, connect, move-in non-billing) include a savings preference step that sets `enrollmentPreference` to `manual`. Billing flows don't include this step, so preference stays NULL. When testing features that depend on `enrollmentPreference`, check users from DIFFERENT onboarding paths — they'll have different initial states.
- **Efficient multi-user testing via Supabase password reset**: When testing across many users from different onboarding paths, batch-reset passwords via Supabase admin API (`PUT /auth/v1/admin/users/{id}`) instead of running full move-in flows. Query DB to find existing users from each path first, only create fresh users when no suitable one exists.
- **Use precise terminology in tickets**: "No account user" is ambiguous. Say "user with no valid account number" and specify what that means (NULL, empty, or "PENDING"). The codebase has `hasValidAccountNumber()` that defines this.

### Session: 2026-03-30 (ENG-2188 TanStack Migration — 6 exploratory sessions)
- **Always compare with dev before reporting parity issues**: Christian emphasized this repeatedly. Without dev comparison, we risk false positives. For every suspected bug, run the same flow on dev.publicgrid.energy first, screenshot both, then report only real differences. This caught the txtest Light plan page bug and TX bill drop routing bug.
- **Clear cookies between Light flow tests**: Light flow session data persists in cookies. Running a second Light test without clearing causes the flow to skip directly to success (skipping plan, identity, payment). Close browser or clear cookies/localStorage/sessionStorage between each Light flow test.
- **Light API phone validation stricter than standard**: `1111111111` works for standard move-in but fails on Light with `400 | phone_number: Invalid phone number`. Use `(646) 437-6170` for Light flow testing.
- **ESI ID = Light flow, no ESI ID = TX-DEREG**: In the Light address modal, "Use verified address" (with ESI ID) goes to Light flow (LightUser). "Keep original" (no ESI ID) goes to TX-DEREG move-in (CottageUser). Two completely different user types and DB tables.
- **txtest vs pgtest for Light encourage conversion**: txtest is the true Light encourage conversion entry (TX ESI address lookup). pgtest + Light address is a move-in → Light transition. They show different plan pages on dev but TanStack renders them the same (bug).
- **`BASE_URL` env var for TanStack testing**: Added to playwright.config.ts. Use `BASE_URL=http://localhost:3001` to run automated tests against TanStack. POM locator mismatches block ~35+ tests (terms checkbox, sign-in title/email/OTP).

### Session: 2026-04-01 (ENG-2080 Light Email Update Flow)
- **Supabase admin API requires both headers**: `Authorization: Bearer $SUPABASE_API_KEY` AND `apikey: $SUPABASE_API_KEY`. Missing the `apikey` header returns "No API key found in request". The env var is `SUPABASE_API_KEY`, not `SUPABASE_SERVICE_ROLE_KEY`. Updated the Common Blockers table.
- **No-session email confirmation creates temporary DB desync**: When a light user confirms an email change from a different browser (no session), `auth.users.email` updates immediately but `LightUsers.email` stays stale. The sync only happens when the user signs in and goes through `/session-init`. This is by design — the `sync-email` API route runs from session-init, not from email-confirmation. Important for test assertions: don't assert LightUsers is synced until after sign-in.
- **Toast auto-dismisses within ~3 seconds**: The success/warning toasts on `/portal/account` appear briefly after redirect and auto-dismiss. To capture in screenshots, use `waitFor` text matching immediately after navigation, or take the screenshot within 2 seconds of page load. In automated tests, assert toast presence quickly or use Playwright's `toBeVisible` with a short timeout.
- **Fastmail JMAP for verification email links**: The email confirmation link is a Resend tracked URL that redirects to Supabase verify, which redirects to `/email-confirmation`. Extract with regex: `body.match(/href="([^"]+)"/g)` then filter for links containing `token_hash` or `email_change`. Decode `&amp;` to `&`.
- **Light email update test users**: `pgtest+lite-in002@joinpublicgrid.com` (single lightDevID, ACTIVE) and `pgtest+lite-multi00@joinpublicgrid.com` (2 lightDevIDs, ACTIVE) are good test accounts for this flow. Multi-account user is essential for AC6 testing.

### Session: 2026-04-01 (ENG-2588 Renewable Energy A/B Experiment)
- **PostHog A/B experiment override technique**: PostHog is NOT on `window.posthog` in Next.js — must find via React fiber tree traversal: walk `__reactFiber$` from `document.documentElement`, look for `pendingProps.value.client.getFeatureFlag`. Then call `posthog.featureFlags.override({ flag: 'variant' })`. Must trigger re-render (Edit → Next) for the component to pick up the new flag.
- **`page.route()` for PostHog flags interception**: Use `page.route(url => url.href.includes('posthog.com') && url.href.includes('/flags'), ...)` to intercept flag responses BEFORE navigation. Override `body.featureFlags['flag_name']` in the response. This works for the initial load; combine with fiber override for subsequent re-renders.
- **Crisp chat blocks Playwright clicks**: Crisp widget intercepts pointer events. Block with `page.route('**crisp.chat**', route => route.abort())` BEFORE navigation. Do NOT remove Crisp via DOM — it re-creates itself.
- **PostHog flag returns stale `separate_screen` value**: Old variant name persisted in PostHog after PR removed it. Hook's allowlist validation correctly rejects unknown values → falls back to control. Always check what the flag server returns vs what the code expects.
- **Partner shortcodes resolve via MoveInPartner, not Building**: `venn73458test`, `moved5439797test` are NOT in the `Building` table — they resolve through `MoveInPartner` table which has its own `offerRenewableEnergy`, `useEncouragedConversion`, `themeID` fields. Query `MoveInPartner` for partner-level config.
- **Encouraged conversion has no waitlist state for unsupported addresses**: Standard move-in and transfer correctly redirect to waitlist, but encouraged conversion always shows welcome page. User can complete full form → API returns 400 (`electricCompanyID` missing). Filed as ENG-2618.
- **Toast polling pattern for auto-dismiss capture**: Toast appears ~3.5s after action and auto-dismisses. Poll every 500ms for up to 5s: `document.querySelectorAll('[data-sonner-toast]')` or check `[aria-label="Notifications (F8)"] ol` children. Screenshot immediately when found.
- **Waitlist test addresses**: Use `155 N Nebraska Ave, Casper, WY 82609` or `500 N Capitol Ave, Lansing, MI 48933` — neither has a matching utility. Standard move-in + transfer show waitlist; encouraged conversion does NOT (bug).
- **Radix RadioGroup needs real browser clicks**: Synthetic JS `.click()` and `dispatchEvent` don't work with Radix radio groups. Use Playwright's native `page.getByText('Clean energy', { exact: true }).click()` or `page.locator('[role="radio"][value="clean"]').click()`. Keyboard works: focus radiogroup → Space to select → ArrowRight/ArrowLeft to switch.

### Session: 2026-04-06 (ENG-2442 Subscriptions Tab + Renewable Energy Allocation)
- **Always check Figma before filing AC mismatch bugs**: Filed ENG-2624 for AC30 ("How does it work?" missing from active state) based on AC text alone. After Cian provided the Figma link, the design intentionally excluded it. Had to cancel the bug. **Figma design is source of truth, not AC text.** Added Step 2b to `/log-bug` skill and new Common Blockers entry.
- **URL params for tab navigation**: Password reset + terms dialogs block tab clicks. `evaluate`-based clicks don't trigger React state changes. Direct URL with `?tabValue=subscriptions` (or `payment`, etc.) bypasses all blockers reliably. Added to Common Blockers.
- **Figma MCP cannot access PG-App file**: File `FHkq7ic3lTmqevxGyHR7uC` is password-protected with a link sharing password. MCP token auth can't pass file passwords. Must ask user for manual screenshots. Added to Common Blockers and CLAUDE.md.
- **Allocation DB-to-UI verification pattern**: Query `RenewableEnergyAllocation` table, calculate expected sum with 500 kWh gap-fill for missing months, compare to UI. COMED Jan(53.56) + Feb(500) + Mar(500 gap-fill) = 1,053.56 kWh matched exactly. This pattern should be standard for any data-driven display testing.
- **Household invite is fully testable end-to-end via MCP**: Owner invite → Fastmail JMAP email fetch → extract invite link (`/resident?inviteCode=X`) → accept → member signed in. Takes ~2 minutes. Reusable for any household permission test.
- **Design gap detection via Figma comparison**: Figma showed a "Statement" column with "Download" links in billing history that wasn't implemented. This kind of design-vs-live diff is valuable — flag to dev for scope confirmation rather than filing as a bug.
- **State transition cycle testing**: For features with multiple states (Active/Inactive/Paused), always test the full Activate → Cancel → Re-activate cycle with TWO user profiles: one WITH existing data (payments, history) and one WITHOUT. This catches data persistence bugs — e.g., billing history table disappearing after cancellation was found and fixed during this session. The "no data" user verifies the table doesn't appear as a ghost when there's nothing to show.

### Session: 2026-04-06/07 (ENG-2618 + ENG-2616 Retesting)
- **MoveInPartner vs Building shortcodes have different unsupported-address behavior**: MoveInPartner shortcodes (e.g., `venn73458test`) rely on zip lookup → unsupported addresses trigger the "We couldn't find service" dialog. Building shortcodes (e.g., `pgtest`) have pre-configured utilities at the building level → zip lookup is bypassed entirely, no dialog. Always test BOTH types when validating waitlist/unsupported-address fixes.
- **`isUtilityVerificationEnabled` controls routing for unsupported addresses**: When the dialog appears (MoveInPartner only): OFF → waitlist, ON → utility verification flow. Toggle this flag via Supabase to test both paths. Remember to restore the original value after testing.
- **Expired email-confirmation corrupts auth session across tabs**: Opening `/email-confirmation?error=access_denied&error_code=otp_expired&...` in a new tab while signed in corrupts the Supabase auth tokens. The original tab's portal/overview then returns 500 on refresh. This is a session-level side effect, not a UI bug — the email-confirmation error processing invalidates the auth state.
- **MoveInPartner table uses UUID `id`, not shortCode**: The `MoveInPartner` table doesn't have a `shortCode` column. Shortcodes like `venn73458test` resolve through the API, not directly in the DB. Query by `name` (ILIKE '%venn%') to find the record, then use the UUID `id` for updates.

### Session: 2026-04-07 (ENG-2188 TanStack Full Retest — Sessions 15-17)
- **TanStack server-side errors in browser console**: TanStack server function errors appear in the browser console with a `[Server] LOG` or `[Server] ERROR` prefix. This is different from client-side errors. When debugging TanStack issues, always check `browser_console_messages` for `[Server]` entries — they reveal server-side failures that don't produce HTTP errors (the `_serverFn/` POST still returns 200).
- **Inngest event gap is systemic, not per-function**: Initially reported as household invite email not sent. Confirmed via automated smoke tests that post-registration confirmation emails also don't fire. The root cause is that ALL TanStack `createServerFn` replacements need Inngest event dispatches added. The TanStack Inngest package lives at `packages/tanstack-inngest/src/functions/` in cottage-nextjs (NOT the `services` repo).
- **Empty error objects in TanStack catch blocks**: `ERROR SENDING EMAIL {}` — JavaScript error objects don't serialize with `JSON.stringify()` by default. Suggest `JSON.stringify(error, Object.getOwnPropertyNames(error))` to capture `message`, `stack`, and custom properties. This is a common TanStack debugging pitfall.
- **Fastmail JMAP is the definitive email delivery test**: For any email-related bug, checking Fastmail via JMAP API is the ground truth. UI success ("Invitation sent!") + DB record created + HTTP 200 does NOT mean the email was sent. Always verify via Fastmail within 10-15 seconds.
- **Smoke suite against TanStack reveals email-dependent test failures**: 3 of 5 e2e smoke failures were caused by missing post-registration emails (Inngest gap), not UI failures. The move-in flows complete successfully — it's the email verification step that times out. Tests that don't verify emails pass fine.

### Session: 2026-04-08 (ENG-2663 Geocoding API Replacement)
- **Upload screenshots BEFORE cleanup — not after**: Took 8 screenshots via Playwright MCP, then deleted them in the cleanup phase before uploading to tmpfiles.org. User caught the missing evidence. Updated Section 4 with explicit ordering: upload → embed in Linear → verify re-host → THEN delete local files. This was already a known requirement but the cleanup section didn't enforce the ordering.
- **Headless Playwright script as MCP fallback**: When force-killing Chrome processes breaks the MCP browser connection (`Target page, context or browser has been closed`), use `node -e "const { chromium } = require('playwright'); ..."` to take screenshots programmatically. Each flow needs its own `browser.newContext()` to avoid session contamination across tests. This saved the session when MCP was unrecoverable.
- **Backend API swap testing is efficient with URL params + DB verification**: For `generatePreFilledAddress` (server-side function), the fastest test approach was: navigate to `/move-in?streetAddress=...&city=...&zip=...`, observe the address step UI, then query the `Address` table in Supabase. No need to complete full move-in flows — the Address record is created when the address step renders. Tested 8 address variations in ~15 minutes.
- **`generate-address-data.ts` bypass logic matters for test scope**: Light/TX-DEREG + `useEncouragedConversion=true` bypasses `generatePreFilledAddress`. SDGE + encouraged (`pgtest`) does NOT bypass. Must read the caller code to understand which shortcodes exercise the changed function vs which bypass it.

### Session: 2026-04-08 (ENG-2632 Transfer PostMessage + Iframe Delays + moveInDate)
- **Iframe testing via Playwright MCP works**: Create `<iframe src="/transfer">` on the parent page. `window.self !== window.top` correctly returns `true` inside the iframe. Parent's `window.addEventListener('message', ...)` captures postMessages from the iframe. Use `MutationObserver` on button elements to capture exact timing of state changes (disabled, spinner). This is a reusable pattern for any iframe/postMessage testing.
- **Synthetic dispatchEvent triggers React handlers in iframes**: Dispatch `PointerEvent` + `MouseEvent` sequence (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`) through the iframe's `contentWindow` context with `{ bubbles: true, cancelable: true, composed: true }`. React receives these properly — confirmed by postMessage firing and button state changing to disabled+spinner.
- **NEVER remove Radix calendar popup via DOM**: `data-radix-popper-content-wrapper` intercepts pointer events on the Next button. Removing the element via `document.querySelector().remove()` causes a fatal React `removeChild` crash (`NotFoundError: The node to be removed is not a child of this node`). Instead: click a date in the calendar to close it naturally, THEN click Next. Added to Common Blockers.
- **Transfer flow requires non-null addressID**: Properties with `addressID: null` show "Address unavailable" and the Next button on the move-out date screen won't advance. When finding test users for transfer testing, always query with `JOIN "Address" a ON a."id" = p."addressID"` and `a."street" IS NOT NULL`.
- **Deployment verification — prefer functional test over bundle search**: Searching JS bundles via `performance.getEntriesByType('resource')` + fetch works but minified function names may not match (e.g., `isInIframe` not found despite being deployed). A functional test is more reliable: navigate with `?moveInDate=05/01/2026`, walk to the date picker screen, check if the date is prefilled.

### Session: 2026-04-09 (ENG-2627 Revamped Subscriptions)
- **Manually inserted SubscriptionMetadata produces false-positive bugs**: ENG-2672 was filed because cancel didn't void pending metadata — but the metadata was manually INSERTed (no `transactionID`). When retested with Inngest-generated metadata (via `transaction-generation-trigger`), cancel correctly set status to `canceled`. Always use the full Inngest pipeline to create test data for subscription cancel/payment testing. Added to Common Blockers table.
- **PG-Admin subscription card requires charge accounts**: The subscription management component lives within the charge account section of the Properties tab. Properties without charge accounts (e.g., property 21135 for `cian+4apr7`) show no subscription card at all. Property 20043 (`subsrace01`) with charge accounts renders correctly. Always verify test users have charge accounts before testing PG-Admin subscription management.
- **PG-Admin dialog scroll container**: PG-Admin user profile opens in a dialog with its own scroll container (`div.h-full.overflow-y-auto`). `fullPage: true` screenshots capture the main page scroll, not the dialog. `scrollIntoView` from the main page doesn't work either. Must set `scrollTop` directly on the dialog container: `document.querySelector('.h-full.overflow-y-auto').scrollTop = X`. Added to Common Blockers table.
- **SubscriptionMetadata has no `voided` status**: Enum values are `pending`, `completed`, `canceled`. Test plans and assertions should use `canceled`, not `voided`.
- **AC15 (non-billing renewal email) is by design same as billing**: The team decided billing and non-billing users get identical renewal email wording. The "estimated" disclaimer only appears on the FE subscription tab. ENG-2673 reclassified as by-design.
- **Restore `dayOfMonth` immediately after metadata creation**: After triggering `transaction-generation-trigger`, restore `SubscriptionConfiguration.dayOfMonth` to 7 before triggering `subscriptions-payment-trigger`. Leaving it at today's date risks generating metadata for other subscriptions on the next cron cycle.
- **PG-Admin navigation pattern**: Search auto-filters → click user name → profile panel (dialog/sheet). Tabs: Profile, Properties, Registration, Fastmail, Sent Mail, Actions, History. Faster than direct URL navigation.

### Session: 2026-04-09 (ENG-2674 Utility Company Management)
- **Case-sensitive ID fields are a hidden near-duplicate risk**: Postgres text PKs are case-sensitive — `COMED` and `comed` coexist as separate records. Always test ID/code fields with lowercase, uppercase, and mixed case variations when the feature has a create/duplicate-check flow. Verified via DB INSERT: `comed` succeeded when `COMED` existed. Added case sensitivity to Phase 2 Input Variations checklist.
- **PG-Admin uses Google SSO — session dies on browser close**: Closing Playwright MCP browser kills the PG-Admin auth session. Reopening navigates to `/login` with Google SSO iframe, which can't be automated via MCP. **Keep the browser open for the entire PG-Admin session.** If session expires, fall back to DB-level testing via Supabase for business logic (constraints, case sensitivity, defaults). Added to Common Blockers.
- **DB-level testing validates business logic when UI is blocked**: When PG-Admin session expired, testing case-sensitive ID behavior via `INSERT INTO "UtilityCompany"` directly in Supabase was faster and more conclusive than UI testing. This is a reusable pattern: for CRUD pages, test constraint/validation logic at the DB level, then test UX/feedback at the UI level.
- **Create form defaults vs DB column defaults are separate concerns**: The PG-Admin create form uses its own defaults (e.g., `isSSNRequired=false`, thresholds `30/30`) that differ from DB column defaults (`isSSNRequired=true`, thresholds `5/25`). Note these as observations, not bugs — the form explicitly sets all values on submit. But flag when form defaults contradict business expectations (e.g., SSN should be required by default for most utilities).
- **Unhandled 409 causes React error #520**: TanStack server function returning 409 (duplicate ID) wasn't caught by the frontend error handler. The React boundary caught it as error #520, and the dialog closed silently with no user feedback. When testing CRUD create flows, always test duplicate/conflict scenarios — 409 handling is frequently missed.
