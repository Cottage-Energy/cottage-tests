---
name: fix-test
description: Investigate and fix a failing or flaky Playwright test
user-invokable: true
---

# Fix a Failing Test

Structured diagnostic workflow: gather evidence → identify what changed → see the live app → fix the root cause → verify.

---

## 1. Gather Failure Evidence

### From CI (GitHub Actions)
- `gh run view <run_id> --log-failed` via Bash to get the failure output
- Or `mcp__github__get_pull_request` if the failure is on a PR check
- Extract: error message, stack trace, screenshot path, retry behavior, duration

### From local run
- Read the Playwright HTML report or test output provided by the user

### Read the test code
- Read the failing spec file completely
- Read all page objects it imports (`tests/resources/page_objects/`)
- Read all fixtures and query modules it depends on (`tests/resources/fixtures/`)

---

## 2. Identify What Changed

### Check recent commits
- `mcp__github__list_commits` on the `cottage-nextjs` or `cottage-tests` repo to find recent changes
- Look for commits that modified:
  - The same feature area as the failing test
  - Shared components (UI library, layout, navigation)
  - Database schema or API endpoints
  - Test infrastructure (fixtures, page objects, config)

### Check recent PRs
- `mcp__github__list_pull_requests` to find recently merged PRs
- `mcp__github__get_pull_request_files` on suspicious PRs to see what changed
- Correlate: did the test start failing after a specific PR merged?

### Check database state
- `mcp__supabase__execute_sql` to verify test data still exists and is in the expected state
- Check: feature flags, user records, account states, enrollment statuses
- `mcp__supabase__list_tables` if you need to discover table structure

---

## 3. See the Live App (Playwright MCP)

Before guessing at fixes, look at what the app actually shows.

### Navigate to the failing page
```
mcp__playwright__browser_navigate → the URL the test visits
```

### Snapshot the accessibility tree
```
mcp__playwright__browser_snapshot → see current roles, names, states
```
Compare the snapshot against the test's locators:
- Does the button the test clicks still exist with the same name/role?
- Did a label change? Did a component get restructured?
- Is an element hidden, disabled, or missing entirely?

### Walk through the flow
Step through the same actions the test performs:
- `mcp__playwright__browser_click` — click what the test clicks
- `mcp__playwright__browser_fill_form` — fill what the test fills
- `mcp__playwright__browser_select_option` — select what the test selects

After each action, snapshot again. Identify where the test's expectations diverge from reality.

### Screenshot the divergence point
```
mcp__playwright__browser_take_screenshot → capture what the test would see
```

### Check network and console
- `mcp__playwright__browser_network_requests` — are API calls failing? Returning unexpected data?
- `mcp__playwright__browser_console_messages` — JS errors that break the page?

---

## 4. Diagnose the Root Cause

### Flaky Locator
- **Symptom**: element not found intermittently
- **Evidence**: snapshot shows the element exists but with a different name/role/label than the test expects
- **Fix**: update the locator in the **page object** (never in the spec). Use the snapshot output to get the correct role/name.
- Locator hierarchy: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')` (last resort)
- **Prefer regex over exact text** — e.g., `page.getByRole('heading', { name: /Upload document/i })` instead of exact `'Upload your bill'`. Regex survives minor text changes (capitalization, rewording) without breaking.
- Do NOT add arbitrary waits — fix the locator

### Timing Issue
- **Symptom**: timeout waiting for element/navigation
- **Evidence**: snapshot shows the page is still loading, or the element appears after a delay
- **Fix**: use `await expect(locator).toBeVisible()` or Playwright auto-waiting
- If a longer timeout is genuinely needed, use `TIMEOUTS` constants
- Do NOT use `page.waitForTimeout()` with magic numbers

### State / Data Dependency
- **Symptom**: test passes alone but fails in suite, or fails on specific environments
- **Evidence**: Supabase query shows test data is missing/changed, or feature flag is off
- **Fix**: ensure proper data setup in `beforeEach`, proper cleanup in `afterEach`
- Check for shared state between tests
- Consider `test.describe.configure({ mode: "serial" })` if order matters

### Environment Issue
- **Symptom**: passes locally, fails in CI (or vice versa)
- **Evidence**: different base URL, missing env vars, browser differences
- **Fix**: check `playwright.config.ts`, `environmentBaseUrl.ts`, and CI workflow config

### Inngest / Async Processing Issue
- **Symptom**: test expects data that should be created by a backend job (e.g., `SubscriptionMetadata`, `Payment`, bill processing) but the data never appears
- **Evidence**: DB query shows expected records are missing or still in `pending` state
- **Possible causes**:
  - Inngest function wasn't triggered or used wrong event name (API always returns 200 even if no function handles the event)
  - Prerequisites not met: `ElectricAccount.status` not `ACTIVE`, `SubscriptionConfiguration.dayOfMonth` doesn't match today, `Subscription.startDate` not in the past
  - Insufficient wait time — Inngest processing is async, need polling not fixed sleep
- **Fix**: verify event name matches exactly (see `CLAUDE.md` → Inngest Integration), check prerequisites, use DB polling with timeout instead of `sleep`
- Trigger Inngest via API: `curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" -H "Content-Type: application/json" -d '{"name": "<event-name>", "data": {}}'`

### UI Changed (App Updated)
- **Symptom**: test was passing, now fails after a PR merged
- **Evidence**: GitHub MCP shows a recent PR changed the component, snapshot shows new UI structure
- **Fix**: update page object locators and flow logic to match the new UI. This is expected maintenance, not a bug.

### Product Bug
- **Symptom**: test logic is correct but the app behaves wrong
- **Evidence**: snapshot/screenshot shows broken UI, DB shows wrong data, network shows error response
- **Action**: don't "fix" the test — chain to `/log-bug` to file the product issue

---

## 5. Apply the Fix

### Update Page Objects (when locators are stale)
- Fix locators in the POM file — **never in the test spec**
- All locators must be `readonly` class properties
- All methods must have explicit return types
- Use `TIMEOUTS` constants for any timeout values
- If a page needs a new POM, create it: export from `index.ts` and register in `baseFixture.ts`

### Update Fixtures (when data setup is broken)
- Fix query modules in `tests/resources/fixtures/database/`
- Fix test utilities in `tests/resources/fixtures/`
- Verify against actual schema: `mcp__supabase__execute_sql` to check column names and types
- Ensure exports are updated in the relevant `index.ts` barrel files

### Update Test Logic (when flow changed)
- Update step sequence in the spec to match the current flow
- Update assertions to match current expected behavior
- Keep changes minimal — only modify what's needed

---

## 6. Verify the Fix

### Run the fixed test locally
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/path/to/file.spec.ts
```

### Run related tests to check for regressions
- If you changed a page object, run all tests that use it
- `Grep` for the POM class name in spec files to find related tests
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/<feature>/
```

### Standards check on all modified files
- No `any` types
- All timeouts use `TIMEOUTS` constants
- All tags use `TEST_TAGS` constants
- Logger used instead of `console.log`
- No magic numbers
- No raw selectors in spec files — all through page objects

---

## 7. Check for Broader Impact

After fixing one test, check if the same issue affects others:
- If a UI component changed → `Grep` for that component's locators across all POMs
- If a fixture broke → `Grep` for that fixture import across all specs
- If a data dependency changed → check all tests in the same feature area
- Fix all affected tests in one pass — don't leave known-broken tests behind

---

## 8. Rules (never violate)
- Fix the root cause — don't mask with retries or sleeps
- Fix locators in page objects — never in test specs
- Keep changes minimal — only modify what's needed
- Maintain code standards: no `any`, no `console.log`, use constants
- Always run the test after fixing to verify
- If the app has a bug, file it (`/log-bug`) — don't make the test accept wrong behavior

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` — see the live app, compare against test expectations |
| **Supabase MCP** | `list_tables`, `execute_sql` — check data state, verify schema, inspect feature flags |
| **GitHub MCP** | `list_commits`, `list_pull_requests`, `get_pull_request_files` — identify what changed that broke the test |
| `Read`, `Edit` | Read test code, apply fixes |
| `Bash` | Run tests locally to verify fixes |
| `Grep`, `Glob` | Find related tests, check for broader impact |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-13 (BillUploadPage locator fix)
- **Exact text locators are brittle**: `BillUploadPage.uploadBillHeading` used `getByRole('heading', { name: 'Upload your bill' })` — broke when PR #1088 changed the heading to "Upload document". Fixed with regex `/Upload document/i`. Added "prefer regex over exact text" recommendation to the Flaky Locator diagnosis section.
- **Fix was quick and isolated**: The structured diagnostic flow (read test → identify change → see live app → fix POM → verify) worked well. Total turnaround was fast because Playwright MCP had already confirmed the new heading text during the exploratory session.
