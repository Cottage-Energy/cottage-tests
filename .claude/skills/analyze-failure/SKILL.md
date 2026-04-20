---
name: analyze-failure
description: CI health check, failure analysis, root cause classification — morning pre-flight through deep diagnosis
user-invocable: true
---

# Analyze Failures

Two modes depending on context:
- **Morning check / CI monitoring** → run Phase 0 (health + triage), then drill into failures with Phase 1+
- **Specific failure** → skip to Phase 1 if the user already has a specific failure to investigate

---

## Phase 0: CI Health & Triage

Quick check: is the environment healthy? What's the CI dashboard look like? Any flaky trends?

### 0a. Environment Pre-flight (run first)

Before checking CI results, verify the test environment is healthy. This prevents wasting time investigating "failures" caused by environment issues.

**Dev environment:**
- `mcp__playwright__browser_navigate` to `https://dev.publicgrid.energy` — does it load? Check for 5xx errors.
- `mcp__playwright__browser_navigate` to `https://dev.publicgrid.energy/sign-in` — does sign-in page render?
- `mcp__supabase__execute_sql` with a simple query (e.g., `SELECT 1`) on the dev project (`wzlacfmshqvjhjczytan`) — is the DB reachable?

**Quick verdict:**
- All healthy → proceed to CI check
- Environment down → flag it immediately, skip CI analysis (failures are likely env-related)
- Partial (e.g., DB up but app down) → note it, proceed with caution

### 0b. Fetch Latest Workflow Runs
- Use `Bash` with `gh run list --workflow=main-workflow.yml --limit 10` to get recent runs from `Cottage-Energy/cottage-tests`
- Or use GitHub MCP tools to query workflow run status
- Extract: run ID, scope (Smoke/Regression1-7), status (pass/fail), timestamp, duration

### 0c. Summarize by Scope

Present a dashboard-style summary:

```
## CI Health — [date]

### Environment Status
- Dev app: [Healthy / Down / Degraded]
- Supabase: [Reachable / Unreachable]

### Overview
- Total scopes: [X] passed, [Y] failed
- Last full regression: [date/time]
- Next scheduled: daily at 5 AM UTC

### Dashboard
| Scope | Last Run | Status | Duration | Failed Tests |
|-------|----------|--------|----------|-------------|
| Smoke | [time] | Pass/Fail | [duration] | [count] |
| Regression1 (Chromium) | [time] | Pass/Fail | [duration] | [count] |
| Regression2 (Firefox) | [time] | Pass/Fail | [duration] | [count] |
| Regression3 (Safari) | [time] | Pass/Fail | [duration] | [count] |
| Regression4 (Mobile Chrome) | [time] | Pass/Fail | [duration] | [count] |
| Regression5 (Mobile Safari) | [time] | Pass/Fail | [duration] | [count] |
| Regression6 (Mobile Chrome) | [time] | Pass/Fail | [duration] | [count] |
| Regression7 (Mobile Safari) | [time] | Pass/Fail | [duration] | [count] |
```

### 0d. Surface Failed Tests
For any failed runs:
- Use `Bash` with `gh run view <run_id> --log-failed` to get failure details
- List each failed test: file path, test name, error summary
- Flag if the same test failed across multiple scopes (cross-browser issue)

### 0e. Cross-reference with Linear
For each failed test, check if there's already a known bug or in-progress fix:
- `mcp__linear__search_issues` with keywords from the failing test's feature area or error message
- If a bug exists → note it: "Known issue: BUG-XXX — [status]"
- If a fix PR is in progress → note it: "Fix in progress: PR #XXX"
- If no bug exists and the failure is a product issue → flag for `/log-bug`

This prevents duplicate bug reports and gives context on whether failures are being addressed.

### 0f. Flaky Test Trending
Compare the last 5-10 CI runs to identify flaky tests (tests that intermittently pass and fail):

- `gh run list --workflow=main-workflow.yml --limit 10 --json databaseId,conclusion,startedAt` to get run IDs
- For each failed run: `gh run view <id> --log-failed` to collect failed test names
- A test is **flaky** if it failed in some runs but passed in others within the window
- A test is **persistently broken** if it failed in every run

```
### Flaky Test Trend (last [N] runs)
| Test | Fail Rate | Last 5 Runs | Pattern |
|------|-----------|-------------|---------|
| `path/test.spec.ts` > "test name" | 3/5 (60%) | PFPFP | Intermittent — likely timing/data issue |
| `path/test2.spec.ts` > "test name" | 5/5 (100%) | FFFFF | Persistent — broken, not flaky |
| `path/test3.spec.ts` > "test name" | 2/5 (40%) | PPFFP | Recent regression — started failing 2 runs ago |
```

**Actions by pattern:**
- Intermittent (20-60% fail rate) → Phase 1 for stabilization (likely timing, data, or race condition)
- Persistent (80-100% fail rate) → Phase 1 for root cause (likely product bug or test rot)
- Recent regression (started failing in last 1-2 runs) → correlate with recent PRs via `gh pr list --state merged --limit 5`

### 0g. Phase 0 Decision Point

After the dashboard is complete:
- **All green** → report clean health, suggest next morning check
- **Failures found** → proceed to Phase 1 for each failure (or group of related failures)
- **Environment down** → flag it, skip Phase 1 (re-check after env is restored)

---

## Phase 1: Gather Failure Data

### Auto-fetch from CI (default)
Don't wait for the user to paste logs — pull them directly:
- `gh run list --workflow=main-workflow.yml --limit 5` via Bash to find the failed run
- `gh run view <run_id> --log-failed` via Bash to get the failure output
- Or use `mcp__github__get_pull_request` + `mcp__github__get_pull_request_files` if the failure is on a PR check

### Check for CI Timeout (not a test failure)
- Look for "The job has exceeded the maximum execution time" in run annotations — this is a job timeout, not a test failure.
- For timeout issues: check how many tests are in the scope, how many browsers, and whether payment tests (which need `*/5` min cron waits, ~30 min each) are included.
- Pull actual test execution logs with `gh run view --job=<jobId> --log` and grep for test progress markers `[N/M]` to see which test was running when cancelled.
- Payment tests should run in Regression1 (Chromium only), not Smoke (2 browsers). Max 1 payment test per scope.

### From local run
- Read the Playwright HTML report or test output provided by the user

### Read the test code
- Read the failing spec file and its dependencies (page objects, fixtures, query modules)
- Understand what the test expects to happen

---

## Phase 2: Extract Failure Details

From the failure output, extract:
- **Error message** — the assertion or exception that caused the failure
- **Stack trace** — which file/line failed
- **Screenshot/trace** — if available from Playwright artifacts
- **Timing** — did it timeout? How long did it run vs expected?
- **Retry behavior** — did it fail on all retries (consistent) or just some (flaky)?
- **Scope** — which CI scope (Smoke, Regression1-7)? Which browser project?

---

## Phase 3: Correlate with Recent Changes

### Check recent commits
- `mcp__github__list_commits` on `cottage-nextjs` to find what changed recently
- Focus on commits in the same feature area as the failing test
- Identify: did the failure start after a specific commit?

### Check recent PRs
- `mcp__github__list_pull_requests` for recently merged PRs
- `mcp__github__get_pull_request_files` on suspicious PRs
- Look for: UI changes, API changes, DB migrations, shared component modifications

### Check database state
- `mcp__supabase__execute_sql` to verify test data, feature flags, account states
- Check: is the test data still valid? Did a migration change the schema? Is a feature flag toggled off?

### Check for existing bugs
- `mcp__linear__list_issues` or `mcp__linear__search_issues` to search for bugs mentioning the failing test or feature area
- If a bug already exists → link to it instead of filing a duplicate
- If a related ticket is in progress → the failure may be expected until the fix lands

---

## Phase 4: Reproduce Interactively (when root cause is unclear)

If the logs and code aren't enough to diagnose, reproduce the failure live:

- `mcp__playwright__browser_navigate` to the URL the test visits
- `mcp__playwright__browser_snapshot` to see current UI state
- Walk through the test steps:
  - `mcp__playwright__browser_click`, `browser_fill_form`, `browser_select_option`
  - After each step, snapshot to compare against test expectations
- `mcp__playwright__browser_take_screenshot` at the point where the test fails
- `mcp__playwright__browser_network_requests` to check for API failures
- `mcp__playwright__browser_console_messages` for JS errors

This confirms whether the issue is the app (product bug) or the test (stale locator/logic).

---

## Phase 5: Classify the Root Cause

### Product Bug
- Test logic is correct but the application behaves unexpectedly
- A feature that previously worked is now broken
- **Evidence**: snapshot shows broken UI, DB shows wrong data, API returns errors
- **Action**: `/log-bug` to file in Linear, link the failed test as evidence

### Test Code Issue
- Flaky locator that doesn't match the current UI
- Race condition in test setup/teardown
- Incorrect test data or assertions
- **Evidence**: snapshot shows the element exists but with a different name/role
- **Action**: `/fix-test` to fix the test

### Environment / Infrastructure
- CI runner issues (network, browser install, timeout)
- Staging/test environment is down or unstable
- **Evidence**: all tests failing, or network-related errors across multiple tests
- **Action**: re-run the workflow, or investigate environment

### Data Dependency
- Test relies on specific database state that has changed
- External service (email/OTP, payment provider) was unavailable
- **Evidence**: Supabase query shows missing/changed data
- **Action**: fix test data setup, or update test to create its own data

### UI Change (Expected)
- A PR intentionally changed the UI and tests haven't been updated yet
- **Evidence**: GitHub MCP shows a recent PR changed the component, snapshot shows new structure
- **Action**: `/fix-test` to update page objects and flow logic (this is expected maintenance)

### Flaky (Intermittent)
- Fails on some retries but passes on others in the same run
- **Evidence**: retry log shows inconsistent results
- **Action**: `/fix-test` to stabilize, or `/exploratory-test` to investigate the root timing issue

### External Workflow Engine Regression (PostHog / Inngest / Resend)
- Test expects an email / event side-effect driven by an engine outside the app (PostHog Workflow, Inngest function chain, Resend template, Stripe webhook)
- App emits the correct events per network capture + DB state, but the downstream effect (email sent, DB updated via async job, notification delivered) doesn't happen
- **Evidence**: Decoded PostHog `/flags/` payload shows person_properties match the workflow's filter; Inngest dashboard shows no function run for the event; Fastmail shows no email despite eligible user
- **Do NOT conclude the test is wrong from outside.** The engine config is ground truth for whether effects fire. Ticket text and app code alone are not sufficient.
- **Action** (PostHog-driven — do these via MCP before asking Cian):
  1. `mcp__posthog__workflows-get <uuid>` — confirm `status: active`, inspect trigger/filter/gates/waits/email-step configs + `updated_at` per action
  2. `mcp__posthog__activity-log-list scope=HogFlow item_id=<uuid>` — check edit history; correlate with the silent-period date (next section)
  3. `mcp__posthog__query-run` (HogQL) — confirm the test user emitted the trigger event with correct person_properties. Example: `SELECT event, timestamp, person.properties.email FROM events WHERE person.properties.email = '<email>' AND timestamp >= now() - INTERVAL 2 DAY ORDER BY timestamp DESC`
  4. If steps 1–3 all PASS (workflow active, filter matches, user emitted event with right props) → the blind spot is the Invocations / Metrics tab (runtime telemetry) and integration health — these are NOT reachable via personal-API-key MCP. Ask Cian for a screenshot of the workflow's Invocations tab for the last 48h filtered to the test user's email. Classify as PostHog-side bug, NOT Product Bug.
- **Action** (Inngest-driven): read function source via `gh api repos/Cottage-Energy/services/contents/<path>`; check Inngest dashboard's Runs tab for the event ID.
- **Action** (Resend-driven): check template IDs in app code; Resend dashboard for send logs.
- If the engine shows 0 invocations or a step error, file under the engine's area — not as a Product Bug in the app. See `feedback_posthog_workflow_verification.md`, `tests/docs/posthog-workflows.md` (MCP capability matrix), and `feedback_http_mcp_header_substitution.md` (if the PostHog MCP needs reconnecting).

### Diagnostic signal: silent period in historical data
- If historical email / notification / webhook records show a sudden stop at a specific date (e.g. 18 emails Feb–March, then 39 days of silence), treat that date as the likely regression point
- Check git log / PR merges around that date for changes to the engine, template, or event emission
- Flag to the owner and ask them to check the engine's Logs tab for that day

---

## Phase 6: Output Format

```
## Failure Analysis — [test name or scope]

### Environment Status
- Dev app: [Healthy / Down / Degraded]
- Supabase: [Reachable / Unreachable]

### CI Dashboard
[scope table from Phase 0c — include if running full analysis]

### Failed Test(s)
| File | Test Name | Scope/Browser | Retries | Error |
|------|-----------|---------------|---------|-------|
| `tests/e2e_tests/path/file.spec.ts` | "test name" | Regression1/Chromium | 0/2 passed | [brief error] |

### Error Details
```
[error message and relevant stack trace]
```

### What Changed
- **Recent commits**: [relevant commits with dates]
- **Recent PRs**: [PR #X merged Y ago — changed Z]
- **Database state**: [relevant findings from Supabase]
- **Existing bugs**: [Linear BUG-XXX if already filed]

### Flaky Trend
[flaky table from Phase 0f — include if relevant]

### Root Cause Classification
**Category**: [Product Bug / Test Code Issue / Environment / Data Dependency / UI Change / Flaky]

**User Impact**: [If product bug: what the user experiences. If test/env issue: "No user impact — test infrastructure only"]

**Analysis**:
[Explanation of why this failed, supported by evidence from CI logs, GitHub commits, Supabase queries, and/or Playwright MCP investigation]

### Recommended Action
- [ ] [Specific action — e.g., `/fix-test` to update POM locator for changed button]
- [ ] [Secondary action if needed]

### Related
- [Linear ticket if applicable]
- [PR that caused the change]
- [Similar past failures if known]
```

---

## Batch Analysis

When multiple tests fail in the same run:
- Group failures by root cause category
- Identify common patterns:
  - All failures in the same feature area → likely a product change or PR
  - All failures across all features → likely environment/infrastructure
  - Same test failing across multiple scopes → cross-browser issue
  - Random tests failing once then passing → flakiness
- Prioritize: product bugs > test code issues > environment issues
- For each group, provide a single recommendation instead of per-test analysis

---

## Next Steps

Based on the classification, chain to the right skill:
- **Product Bug** → `/log-bug` to file in Linear
- **Test Code Issue** → `/fix-test` to fix the test
- **Environment** → re-run or investigate infrastructure
- **Data Dependency** → fix data setup, then `/fix-test`
- **UI Change** → `/test-plan` to understand the change (PR analysis), then `/fix-test` to update tests
- **Flaky** → `/fix-test` to stabilize, or `/exploratory-test` to investigate timing

---

## Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` — env pre-flight + reproduce failures interactively |
| **Supabase MCP** | `execute_sql`, `list_tables` — env pre-flight + check data state, feature flags, schema changes |
| **GitHub MCP** or `Bash` (`gh` CLI) | Fetch workflow runs, failure logs, commits, PRs, and run history for flaky trending |
| **Linear MCP** | `search_issues`, `list_issues` — cross-reference failures with existing bugs |
| `Read` | Read test code, page objects, fixtures |
| `Grep`, `Glob` | Cross-reference failures with local test files |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
