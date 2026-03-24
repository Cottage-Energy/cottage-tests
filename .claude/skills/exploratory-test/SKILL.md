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
- `mcp__playwright__browser_take_screenshot` for the live app
- Compare: layout, spacing, component states, responsive behavior

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
| Bug ID | Title | Severity | Found During |
|--------|-------|----------|-------------|
| BUG-XXX | [title] | [severity] | Phase 1 AC #2 / Phase 2 edge case |

### Coverage Assessment
- ACs tested: [N] / [total]
- Edge cases explored: [N]
- Bugs found: [N]
- Areas NOT tested (and why): [list]

### Recommended Next Steps
- `/new-test` to automate [specific AC or edge case]
- `/fix-test` if existing tests need updating
- `/test-plan` if the feature needs full test plan coverage
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

Before finishing any exploratory session (interactive or scripted), clean up generated artifacts:

1. **Screenshots** — delete local PNG files after they've been uploaded to `0x0.st` and posted to Linear
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
2. Upload to `0x0.st` for hosting: `curl -s -F "file=@screenshot.png" https://0x0.st` — returns a direct URL
3. Post to Linear via `mcp__linear__save_comment` with markdown image syntax: `![description](url)`
4. Clean up local PNG files after upload

**Why not base64 directly?** MCP tool parameters can't handle large base64-encoded images. The 0x0.st upload → URL embed pattern is the reliable workaround.

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
| Unknown test user password | Can't sign in to customer FE as a test user because password is unknown/expired | Use Supabase admin API: `curl -X PUT "https://<project>.supabase.co/auth/v1/admin/users/<user-id>" -H "Authorization: Bearer <service_role_key>" -d '{"password": "NewPassword123!"}'` |
| Large PG Admin snapshots | `browser_snapshot` output >50KB gets truncated in tool results | Use `filename` parameter to save to file, then `grep` the file for specific patterns (dialog names, button refs, status values) |
| mi-session/start redirect | Onboarding pages (`/move-in`, `/transfer`, `/bill-upload`, `/finish-registration`) auto-redirect within seconds via `mi-session/start` API | Intercept fetch immediately after `browser_navigate`: `window.fetch = function(...args) { if (args[0]?.includes?.('mi-session/start') \|\| (typeof args[0] === 'string' && args[0].includes('mi-session/start'))) return new Promise(() => {}); return window.__origFetch.apply(this, args); };` (save `__origFetch` first) |
| Short page content | Pages don't have enough content to scroll for scroll testing | `browser_resize` to width 1280, height 400 to force scrollable content |
| Playwright MCP is Chromium-only | Cannot test Safari bfcache or Firefox behavior via MCP | Note as limitation in results. True cross-browser tests need `npx playwright test --project=Safari` via the test runner |
| Parallel agents rate limiting | 4+ concurrent Playwright agents hitting dev server causes 429 errors | Limit to 2-3 concurrent browser agents; use extra agents for DB/code work |
| Stripe iframe | Previously thought cross-origin Stripe iframes were inaccessible | Playwright MCP CAN access Stripe iframe content — snapshot includes `f{N}e{N}` refs. Use `browser_fill_form` with those refs. Pattern: card=`4242424242424242`, exp=`12 / 30`, CVC=`123`, country=`United States`, ZIP=`10001` |
| ESCO notice (NY) | New York addresses trigger regulatory `alertdialog` "Because you live in New York..." | Dismiss with `browser_click` on "Got it!" button. Don't confuse with feature behavior |
| Multi-property user | User lands on `/app/summary` instead of `/app/overview` | Click "View" on the specific property card. Users with 2+ properties always see the picker first |
| tmpfiles.org upload output lost | `curl -s -F "file=@img.png" https://tmpfiles.org/api/v1/upload` returns empty in bash pipelines | Write to temp file: `curl -s -o /tmp/upload.json -F "file=@img.png" https://tmpfiles.org/api/v1/upload && cat /tmp/upload.json`. Direct URL: replace `tmpfiles.org/` with `tmpfiles.org/dl/` |
| Password reuse on reset | Supabase admin password reset with same password returns 422 | Remove the dialog via `document.querySelector('[role="alertdialog"]').remove()` instead of completing the form |
| Supabase project ID wrong | `mcp__supabase__execute_sql` returns "Forbidden resource" | Dev = `wzlacfmshqvjhjczytan`, Staging = `euztcfcsytpxtyepvdcj`. Use `mcp__supabase__list_projects` to verify. |
| OTP needed in interactive session | Can't call `FastmailActions.Get_OTP` outside Playwright test runner | Use Node.js JMAP script: `cd cottage-tests && node -e "require('dotenv').config(); /* fetch email via axios */"` — see memory `fastmail-otp-retrieval.md` for full pattern |
| No `jq` on Windows | bash JSON parsing fails | Use `node -e` with `JSON.parse()` instead of `curl | jq` |

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
- **Partner theme testing pattern**: Use shortcodes `autotest` (Moved), `funnel4324534` (Funnel), `venn325435435` (Venn), `renew4543665999` (Renew). All use encouraged conversion flow (address → welcome-encouraged page). Verify link color via `window.getComputedStyle(link).color`.
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
