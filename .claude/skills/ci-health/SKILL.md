---
name: ci-health
description: Check CI test health — latest workflow runs, pass/fail by scope, recurring failures
user-invocable: true
---

# CI Test Health Check

Quick morning check: how are the tests doing? Pull the latest GitHub Actions runs, summarize pass/fail by scope, and surface patterns.

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

## 6. Output Format

```
## CI Health — [date]

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
| **GitHub MCP** or `Bash` (`gh` CLI) | Fetch workflow runs and failure logs |
| **Linear MCP** | `search_issues` — cross-reference failures with existing bugs |
| `Glob`, `Grep` | Cross-reference failed tests with local test files |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
