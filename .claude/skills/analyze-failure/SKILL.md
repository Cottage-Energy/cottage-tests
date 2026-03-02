---
name: analyze-failure
description: Analyze test failures from CI/local runs, classify root cause, and recommend next steps
user-invocable: true
---

# Analyze Test Failures

When tests fail in CI (GitHub Actions) or locally, investigate the failure, classify the root cause, and recommend the appropriate action.

## 1. Gather Failure Data
Depending on the source, collect:
- **GitHub Actions**: Use GitHub MCP tools or `gh run view` / `gh run view --log-failed` to fetch the failed run details
- **Local run**: Read the Playwright HTML report or test output provided by the user
- **Test file**: Read the failing test spec and its dependencies (page objects, fixtures)

## 2. Read the Error
Extract from the failure output:
- **Error message** — the assertion or exception that caused the failure
- **Stack trace** — which file/line failed
- **Screenshot/trace** — if available from Playwright artifacts
- **Timing** — did it timeout? How long did it run?
- **Retry behavior** — did it fail on all retries or just some (flaky)?

## 3. Classify the Root Cause

### Product Bug
- Test logic is correct but the application behaves unexpectedly
- A feature that previously worked is now broken
- **Action**: Log bug with `/log-bug`, link the failed test as evidence

### Test Code Issue
- Flaky locator that doesn't match the current UI
- Race condition in test setup/teardown
- Incorrect test data or assertions
- **Action**: Fix with `/fix-test`

### Environment / Infrastructure
- CI runner issues (network, browser install, timeout)
- Staging/test environment is down or unstable
- Database state is inconsistent
- **Action**: Re-run the workflow, or investigate environment with Supabase MCP

### Data Dependency
- Test relies on specific database state that has changed
- External service (email/OTP) was unavailable
- **Action**: Check Supabase for data state, update test data setup

### UI Change (Expected)
- A PR changed the UI and tests haven't been updated yet
- **Action**: Fix with `/fix-test` (it handles page object updates)

## 4. Output Format

```
## Failure Analysis

### Failed Test
- **File**: `tests/e2e_tests/path/to/test.spec.ts`
- **Test name**: "descriptive test name"
- **Run**: [GitHub Actions link or local]
- **Failed on**: [all retries / intermittent]

### Error
```
[error message and relevant stack trace]
```

### Root Cause Classification
**Category**: [Product Bug / Test Code Issue / Environment / Data Dependency / UI Change]

**Analysis**:
[Explanation of why this failed and the evidence]

### Recommended Action
- [ ] [Specific action 1]
- [ ] [Specific action 2]

### Related
- [Linear ticket if applicable]
- [PR that may have caused the change]
- [Similar past failures if known]
```

## 5. Batch Analysis
When multiple tests fail in the same run:
- Group failures by root cause category
- Identify common patterns (e.g., all failures in the same feature area = likely a product change)
- Prioritize: product bugs > test code issues > environment issues

## 6. Next Steps
Based on the classification:
- **Product Bug** → `/log-bug` to file in Linear
- **Test Code Issue** → `/fix-test` to fix the test
- **Environment** → Re-run or investigate infrastructure
- **UI Change** → `/review-pr` to understand the change, then update tests
- **Flaky test** → `/fix-test` to stabilize, or `/exploratory-test` to investigate the flakiness
