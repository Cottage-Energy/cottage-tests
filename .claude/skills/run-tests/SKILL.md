---
name: run-tests
description: Run tests locally, trigger CI runs, or interactively walk through flows via Playwright MCP
user-invocable: true
---

# Run Tests

Three execution modes — pick the right one based on what the user needs.

## 1. Choose Execution Mode

| Mode | When to use | Tools |
|------|-------------|-------|
| **Local** | Quick validation — run a file, feature, scope, or tag on your machine | `Bash` (`npx playwright test`) |
| **CI (Remote)** | Full regression, cross-browser, staging/dev environment | `Bash` (`gh workflow run`) |
| **Interactive** | Walk through a flow live, visually verify UI, debug step-by-step | **Playwright MCP** |

---

## 2. Local Execution

### Determine what to run
| Intent | Command |
|--------|---------|
| Specific file | `npx playwright test tests/e2e_tests/path/to/file.spec.ts` |
| Feature area | `npx playwright test tests/e2e_tests/<feature>/` |
| Smoke suite | `npx playwright test --grep /@smoke/ --project=Chromium` |
| Regression scope | `npx playwright test --grep /@regression1/ --project=Chromium` |
| By tag | `npx playwright test --grep /@move-in/` |
| Exploratory | `npx playwright test --project=Exploratory` |
| All tests | `npx playwright test` |

### Run mode flags
| Mode | Flag | When to use |
|------|------|-------------|
| Headless (default) | (none) | Standard execution, CI-like |
| Headed | `--headed` | Watch the test run live |
| Debug | `--debug` | Step through with Playwright Inspector |
| Specific browser | `--project=Chromium\|Firefox\|Safari\|Mobile_Chrome\|Mobile_Safari` | Cross-browser check |

### Execute
Always include `PLAYWRIGHT_HTML_OPEN=never` to prevent the report browser from blocking.

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test [path/grep] [--project=X] [--headed/--debug]
```

Timeouts by scope:
- Single file: 120000ms (2 min)
- Feature area: 300000ms (5 min)
- Full scope (Smoke/Regression): 600000ms (10 min)

---

## 3. CI Execution (Remote)

### Trigger a run
**Required parameters:**
| Parameter | Options | Default |
|-----------|---------|---------|
| `scope` | `Smoke`, `Regression1`-`Regression7` | `Smoke` |
| `environment` | `dev`, `staging` | `dev` |
| `logLevel` | `INFO`, `DEBUG`, `TRACE` | `INFO` |
| `notify` | `true`, `false` | `false` |

```bash
gh workflow run main-workflow.yml -f scope=Smoke -f environment=staging -f logLevel=INFO -f notify=false
```

**Examples:**
```bash
# Smoke on staging
gh workflow run main-workflow.yml -f scope=Smoke -f environment=staging -f logLevel=INFO -f notify=false

# Regression1 (Chromium) on dev
gh workflow run main-workflow.yml -f scope=Regression1 -f environment=dev -f logLevel=INFO -f notify=false

# Regression3 (Safari) on staging with notifications
gh workflow run main-workflow.yml -f scope=Regression3 -f environment=staging -f logLevel=INFO -f notify=true
```

### Monitor the run
```bash
# Watch live
gh run watch

# Check status of latest run
gh run list --workflow=main-workflow.yml --limit 5

# View failed logs
gh run view <run_id> --log-failed
```

Chain to `/analyze-failure` to get a structured summary of results.

---

## 4. Interactive Execution (Playwright MCP)

Use the Playwright MCP browser tools to manually walk through a flow, visually verify UI state, or debug a specific interaction.

### Steps
1. **Navigate** — `mcp__playwright__browser_navigate` to the target URL
2. **Snapshot** — `mcp__playwright__browser_snapshot` to capture the accessibility tree and see what's on screen
3. **Interact** — `mcp__playwright__browser_click`, `mcp__playwright__browser_fill_form`, `mcp__playwright__browser_select_option` to step through the flow
4. **Screenshot** — `mcp__playwright__browser_take_screenshot` to capture visual state at any point
5. **Verify UI** — compare what you see against expected behavior from test plan or Figma designs
6. **Verify DB** — use Supabase MCP to check database state after interactions:
   - `mcp__supabase__execute_sql` to query tables and verify data was created/updated/deleted correctly
   - Check that the UI action actually persisted the right data (e.g., after move-in form submit, verify user record exists in DB)
   - Compare expected vs. actual data state
7. **Network** — `mcp__playwright__browser_network_requests` to check API calls being made
8. **Console** — `mcp__playwright__browser_console_messages` to check for errors

### When to use interactive mode
- Debugging a failing test — see what the app actually shows at the failure point
- Verifying a fix — walk through the flow manually before running the automated test
- Exploratory testing — investigate behavior that's hard to capture in a script
- Building a page object — inspect the live UI to get correct locators
- Comparing against Figma — screenshot the live app and compare to design
- Verifying data flow — interact via browser, then check DB to confirm data landed correctly

---

## 5. Interpret Results

### All Passed
```
## Test Run Results — [scope/file]

Status: ALL PASSED
Tests: [N] passed
Duration: [time]
Browser: [project]
```

### Some Failed
```
## Test Run Results — [scope/file]

Status: [N] PASSED, [M] FAILED
Duration: [time]
Browser: [project]

### Failed Tests
| Test | File | Error |
|------|------|-------|
| [name] | [path] | [brief error] |

### Recommended Action
- `/analyze-failure` to classify root cause
- `/fix-test` to fix [specific test]
```

### All Failed
Flag as likely environment or setup issue — check base URL, browser install, env vars.

## 6. Post-Run Actions
Based on results, suggest next steps:
- **All green** → "Tests passing. Ready to commit or push."
- **Failures after `/create-test`** → "New test has issues. Want me to `/fix-test`?"
- **Failures after `/fix-test`** → "Fix didn't hold. Let me re-investigate."
- **Flaky (passes on retry)** → "Test is flaky — passed on retry [N]. Consider `/fix-test` to stabilize."
- **CI failures** → Chain to `/analyze-failure`

## 7. Tools Used

| Tool | Purpose |
|------|---------|
| `Bash` | `npx playwright test` (local), `gh workflow run` and `gh run` (CI triggers and monitoring) |
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` — interactive mode |
| **Supabase MCP** | `execute_sql` — verify database state after UI interactions during interactive mode |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
