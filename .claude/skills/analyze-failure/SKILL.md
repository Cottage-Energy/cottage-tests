---
name: analyze-failure
description: Analyze test failures from CI/local runs, classify root cause, and recommend next steps
user-invocable: true
---

# Analyze Test Failures

When tests fail in CI or locally, investigate the failure, classify the root cause, correlate with recent changes, and recommend the right action.

---

## 1. Gather Failure Data

### Auto-fetch from CI (default)
Don't wait for the user to paste logs — pull them directly:
- `gh run list --workflow=main-workflow.yml --limit 5` via Bash to find the failed run
- `gh run view <run_id> --log-failed` via Bash to get the failure output
- Or use `mcp__github__get_pull_request` + `mcp__github__get_pull_request_files` if the failure is on a PR check

### From local run
- Read the Playwright HTML report or test output provided by the user

### Read the test code
- Read the failing spec file and its dependencies (page objects, fixtures, query modules)
- Understand what the test expects to happen

---

## 2. Extract Failure Details

From the failure output, extract:
- **Error message** — the assertion or exception that caused the failure
- **Stack trace** — which file/line failed
- **Screenshot/trace** — if available from Playwright artifacts
- **Timing** — did it timeout? How long did it run vs expected?
- **Retry behavior** — did it fail on all retries (consistent) or just some (flaky)?
- **Scope** — which CI scope (Smoke, Regression1-7)? Which browser project?

---

## 3. Correlate with Recent Changes

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

## 4. Reproduce Interactively (when root cause is unclear)

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

## 5. Classify the Root Cause

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

---

## 6. Output Format

```
## Failure Analysis — [test name or scope]

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

### Root Cause Classification
**Category**: [Product Bug / Test Code Issue / Environment / Data Dependency / UI Change / Flaky]

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

## 7. Batch Analysis

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

## 8. Failure History

Check if the test has failed before:
- `gh run list --workflow=main-workflow.yml --limit 20` to see recent run statuses
- If the same test failed in 3+ consecutive runs → **recurring failure**, escalate priority
- If it fails intermittently → **flaky test**, needs stabilization
- If this is the first failure → **new failure**, likely caused by a recent change

---

## 9. Next Steps

Based on the classification, chain to the right skill:
- **Product Bug** → `/log-bug` to file in Linear
- **Test Code Issue** → `/fix-test` to fix the test
- **Environment** → re-run or investigate infrastructure
- **Data Dependency** → fix data setup, then `/fix-test`
- **UI Change** → `/review-pr` to understand the change, then `/fix-test` to update tests
- **Flaky** → `/fix-test` to stabilize, or `/exploratory-test` to investigate timing

---

## 10. Tools Used

| Tool | Purpose |
|------|---------|
| **GitHub MCP** | `list_commits`, `list_pull_requests`, `get_pull_request_files` — correlate failures with recent code changes |
| **Linear MCP** | `list_issues`, `search_issues` — check for existing bugs before filing duplicates |
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` — reproduce failures interactively |
| **Supabase MCP** | `execute_sql`, `list_tables` — check data state, feature flags, schema changes |
| `Bash` | `gh run list`, `gh run view --log-failed` — pull CI failure logs |
| `Read` | Read test code, page objects, fixtures |
| `Grep`, `Glob` | Cross-reference failures with local test files |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
