---
name: ci-health
description: Check CI test health, environment status, flaky test trends — morning pre-flight check
user-invocable: true
---

# CI Test Health Check

Quick morning check: is the environment healthy? How are the tests doing? Any flaky trends?

## 0. Environment Pre-flight (run first)

Before checking CI results, verify the test environment is healthy. This prevents wasting time investigating "failures" caused by environment issues.

### Dev environment
- `mcp__playwright__browser_navigate` to `https://dev.publicgrid.energy` — does it load? Check for 5xx errors.
- `mcp__playwright__browser_navigate` to `https://dev.publicgrid.energy/sign-in` — does sign-in page render?
- `mcp__supabase__execute_sql` with a simple query (e.g., `SELECT 1`) on the dev project (`wzlacfmshqvjhjczytan`) — is the DB reachable?

### Quick verdict
- All healthy → proceed to CI check
- Environment down → flag it immediately, skip CI analysis (failures are likely env-related)
- Partial (e.g., DB up but app down) → note it, proceed with caution

## 1. Fetch Latest Workflow Runs
- Use `Bash` with `gh run list --workflow=main-workflow.yml --limit 10` to get recent runs from `Cottage-Energy/cottage-tests`
- Or use GitHub MCP tools to query workflow run status
- Extract: run ID, scope (Smoke/Regression1-7), status (pass/fail), timestamp, duration

## 2. Summarize by Scope
Present a dashboard-style summary:

```
## CI Health — [date]

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

## 3. Surface Failed Tests
For any failed runs:
- Use `Bash` with `gh run view <run_id> --log-failed` to get failure details
- List each failed test: file path, test name, error summary
- Flag if the same test failed across multiple scopes (cross-browser issue)

## 4. Cross-reference with Linear
For each failed test, check if there's already a known bug or in-progress fix:
- `mcp__linear__search_issues` with keywords from the failing test's feature area or error message
- If a bug exists → note it: "Known issue: BUG-XXX — [status]"
- If a fix PR is in progress → note it: "Fix in progress: PR #XXX"
- If no bug exists and the failure is a product issue → flag for `/log-bug`

This prevents duplicate bug reports and gives context on whether failures are being addressed.

## 5. Identify Patterns
- **Recurring failures** — tests that failed in the last 3+ runs (flaky or persistent bug)
- **Scope-specific failures** — tests that only fail in one browser (browser compatibility issue)
- **New failures** — tests that passed previously but failed in the most recent run (likely regression from a code change)
- **Known issues** — failures linked to existing Linear bugs (expected to fail until fix lands)

## 5b. Flaky Test Trending
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
- Intermittent (20-60% fail rate) → `/fix-test` for stabilization (likely timing, data, or race condition)
- Persistent (80-100% fail rate) → `/analyze-failure` for root cause (likely product bug or test rot)
- Recent regression (started failing in last 1-2 runs) → correlate with recent PRs via `gh pr list --state merged --limit 5`

## 6. Output Format

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
[scope table from Step 2]

### Failed Tests
[grouped by pattern from Step 5]

#### Recurring (3+ runs)
- `tests/e2e_tests/path/test.spec.ts` — "test name" — [error summary] — failed [N] consecutive runs

#### New Failures
- `tests/e2e_tests/path/test.spec.ts` — "test name" — [error summary] — first failure in this run

#### Browser-Specific
- `tests/e2e_tests/path/test.spec.ts` — fails only in [Safari/Firefox/Mobile]

#### Known Issues (bug filed, awaiting fix)
- `tests/e2e_tests/path/test.spec.ts` — "test name" — Known: BUG-XXX [status]

### Recommended Actions
- [Recurring] → `/fix-test` to stabilize or `/log-bug` if product issue
- [New failures] → `/analyze-failure` to classify root cause
- [Browser-specific] → `/exploratory-test` to investigate browser compat
- [Known issues] → no action needed, tracked in Linear
```

## 7. Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | `browser_navigate` — environment pre-flight check (dev app health) |
| **Supabase MCP** | `execute_sql` — environment pre-flight check (DB reachability) |
| **GitHub MCP** or `Bash` (`gh` CLI) | Fetch workflow runs, failure logs, and run history for flaky trending |
| **Linear MCP** | `search_issues` — cross-reference failures with existing bugs |
| `Glob`, `Grep` | Cross-reference failed tests with local test files |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
