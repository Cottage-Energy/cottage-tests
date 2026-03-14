---
name: exploratory-test
description: Investigate behavior, reproduce bugs, and validate edge cases — interactively or via scaffolded specs
user-invokable: true
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
- Example: one agent tests Safari rendering, another tests company override logic, a third explores transfer flow
- Consolidate findings from all agents before posting to Linear
- This significantly reduces total exploration time

---

## 10. Common Blockers & Workarounds

| Blocker | Symptom | Workaround |
|---------|---------|------------|
| Password reset dialog | `[role="alertdialog"]` with "Set up your new password" blocks the page | `page.evaluate(() => document.querySelector('[role="alertdialog"]').remove())` |
| `/sign-out` 404 | Direct navigation to `/sign-out` returns 404 | Clear cookies via `page.evaluate` then navigate to `/sign-in` |
| GitHub MCP 404 | `mcp__github__get_pull_request` returns "Not Found" for cottage-nextjs PRs | Fall back to `gh pr view <number> --repo Cottage-Energy/cottage-nextjs --json ...` |
| Linear MCP auth expires | Linear tools not found in ToolSearch | Re-run `ToolSearch` with `select:mcp__linear__save_comment` — may re-trigger auth |
| OTP email pollution | Interactive sessions trigger OTP emails that accumulate for shared test accounts | After exploration, note which test accounts had OTPs triggered — automated tests using those accounts may fail until emails clear. Consider using `getLatestOTP()` pattern (take most recent email) instead of asserting exactly 1 email |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-13 (ENG-2402 Connect Account)
- **Supabase column discovery**: Wasted 4+ attempts guessing column names. Added instruction to always query `information_schema.columns` first.
- **OTP email pollution**: Two exploratory sessions triggered multiple OTP emails for the same shared test users. This caused the subsequent `/new-test` spec to fail because `Get_OTP` asserts exactly 1 email. Added to Common Blockers table.
- **Mutually exclusive cards**: Connect ELIGIBLE users see auto-apply card; non-connect users see renewable energy card. These are exclusive — never both. This kind of business logic discovery is valuable to capture in the session summary.
