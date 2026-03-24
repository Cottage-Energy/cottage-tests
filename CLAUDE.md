# Cottage Tests

Playwright e2e test suite for the Cottage Energy web application.

## QA Workflow & Role Context

I am the solo QA engineer on the Cottage Energy team. My workflow maps to skills:

| Step | Activity | Skill |
|------|----------|-------|
| 1. **Triage** | Read Linear tickets tagged for Testing/QA | `/test-plan` (Quick Triage phase) |
| 2. **Research** | Gather context from Notion docs, Figma screens, GitHub PRs | `/review-pr` (for PRs), `/test-plan` (multi-source) |
| 3. **Test Planning** | Write test plans and test cases from requirements | `/test-plan` |
| 4. **Exploratory Testing** | Interactive exploration to find edge cases and bugs | `/exploratory-test` |
| 5. **Automation** | Convert findings into Playwright e2e tests | `/new-test` |
| 6. **Bug Reporting** | Log discovered bugs in Linear with evidence | `/log-bug` |
| 7. **Test Execution** | Run automated suites locally or via CI | `/run-tests` |

### Supporting Skills

| Skill | When to use |
|-------|-------------|
| `/fix-test` | A test is failing or flaky — diagnose and fix |
| `/analyze-failure` | Classify CI/local failures, identify root cause |
| `/ci-health` | Morning check — how are the tests doing? |
| `/test-coverage` | Map what's automated, find gaps |
| `/release-ready` | Go/no-go report before a release |

### Main Outputs
- Test plans and test cases (in `tests/test_plans/`)
- Automated Playwright test scripts (in `tests/e2e_tests/`)
- Test documentation (in Notion)
- Bug reports (in Linear)
- Test execution results (exploratory + scripted)

## MCP Servers (always prefer these over alternatives)

**Always use MCP server tools when available.** Do not fall back to CLI commands, web fetches, or manual workarounds when an MCP tool exists for the task. Use `ToolSearch` to load the appropriate MCP tool before calling it.

| Server | Purpose | Use for |
|--------|---------|---------|
| **Linear** | Read tickets for Testing/QA, log bugs, track test-related issues, comment test plans back to tickets | `get_issue`, `save_issue`, `save_comment`, `list_comments`, `search_issues`, `list_issues`, `list_issue_statuses` |
| **GitHub** | Read PRs, review code changes, CI/CD pipeline | `get_pull_request`, `get_pull_request_files`, `get_pull_request_status`, `list_pull_requests`, `list_commits`, `search_code` |
| **Supabase** | Query/manipulate database — check data state, toggle flags, verify DB changes | `execute_sql`, `list_tables`, `list_migrations` |
| **Playwright** | Browser automation for interactive testing and debugging | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_select_option`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` |
| **Figma** | UI screens to verify visual correctness and compare against implementation | `get_design_context`, `get_screenshot` |
| **Notion** | Documentation hub — feature docs, test plans, test cases *(auth pending)* | Will use MCP tools once authenticated |
| **context7** | Look up latest library/framework documentation | `resolve-library-id`, `query-docs` |
| **Exa** | Web search, code examples, and URL crawling for research during test planning and debugging | `web_search_exa`, `get_code_context_exa`, `crawling_exa` |

## GitHub Repos

| Repo | Owner | Purpose |
|------|-------|---------|
| `cottage-tests` | `Cottage-Energy` | This repo — Playwright e2e test suite |
| `cottage-nextjs` | `Cottage-Energy` | Main application (Next.js) — PRs here trigger test updates |
| `automations` | `Cottage-Energy` | Backend automations and jobs |
| `services` | `Cottage-Energy` | Backend services |
| `pg-property-portal` | `Cottage-Energy` | Property group portal |
| `pg-admin` | `Cottage-Energy` | Property group admin |

Use these as `owner` and `repo` parameters for all GitHub MCP tool calls.

## Commands

Always prefix local test runs with `PLAYWRIGHT_HTML_OPEN=never` to prevent the report browser from blocking.

### Local Test Execution
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/path/to/file.spec.ts` — run a single test file
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/<feature>/` — run a feature area
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Chromium` — run smoke tests
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@regression1/ --project=Chromium` — run regression scope
- Add `--headed` to watch the browser, `--debug` for Playwright Inspector

### CI Triggers
- `gh workflow run main-workflow.yml -f scope=Smoke -f environment=dev -f logLevel=INFO -f notify=false` — trigger CI run
- `gh run list --workflow=main-workflow.yml --limit 5` — check recent run status
- `gh run view <run_id> --log-failed` — get failure logs

### Setup
- `npm ci` — install dependencies
- `npx playwright install --with-deps` — install browsers

## Code Rules (enforced — do not violate)
- No `any` types — use types from `tests/resources/types/`
- No `console.log` — use structured logger from `tests/resources/utils/logger.ts`
- No magic numbers — use `TIMEOUTS` and `RETRY_CONFIG` from `tests/resources/constants/`
- No raw tag strings — use `TEST_TAGS` constants (e.g., `TEST_TAGS.SMOKE`, not `'@smoke'`)
- All page interactions through POM classes in `tests/resources/page_objects/`
- Locator priority: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')` (last resort)
- POM locators must be `readonly` class properties; all POM methods must have explicit return types
- Tests must clean up created data in `afterEach` hooks
- See `CODE_STANDARDS.md` for full coding standards

## Structure
- `tests/e2e_tests/` — test specs organized by feature (move-in, payment, homepage, connect-account)
- `tests/test_plans/` — structured test plans generated by `/test-plan`
- `tests/resources/page_objects/` — Page Object Model classes (register new ones in `base/baseFixture.ts` and `index.ts`)
- `tests/resources/fixtures/` — Playwright fixtures, test utilities, database query modules
- `tests/resources/constants/` — `TEST_TAGS`, `TIMEOUTS`, `RETRY_CONFIG`, companies
- `tests/resources/types/` — TypeScript type definitions (`moveIn.types.ts`, `user.types.ts`, `database.types.ts`)
- `tests/resources/utils/` — logger, Supabase client, Fastmail client, test helpers
- `playwright.config.ts` — browser projects (Chromium, Firefox, Safari, Mobile) + tag-based suites (Smoke, Regression1–7)
- `CODE_STANDARDS.md` — full coding standards reference

## Onboarding Flows

### Billing Flows (maintainedFor IS NOT NULL — payment method added or addable)
| Flow | URL / Entry Point | Notes |
|------|-------------------|-------|
| Move-in | `https://dev.publicgrid.energy/move-in` | Add `?shortCode=<building>` for specific buildings |
| Transfer | `https://dev.publicgrid.energy/transfer` | Or: active/eligible user → Services → "Transfer my service" |
| Light (TX dereg) | `https://dev.publicgrid.energy/move-in` | Use address `2900 Canton St` unit `524` → modal appears |
| TX Bill Drop | Bill Upload / Verify Utilities URLs with TX zip (e.g., `75063`) | Light-enabled zip code |
| Finish Registration | API-generated URL | `POST api-dev.publicgrd.com/v1/test-partner/register` with Bearer token (see `.env`) |

### Non-Billing Flows (maintainedFor IS NULL — no payment method)
Triggered when: `isHandleBilling=false` on utility/building, OR `isBillingRequired=false` + user chooses "I will manage payments myself"

| Flow | URL / Entry Point | Notes |
|------|-------------------|-------|
| Move-in (non-billing) | Same as billing move-in | Building/utility config determines path |
| Transfer | Same as billing transfer | |
| Utility Verification | `/move-in?shortCode=pgtest` | Building has `isUtilityVerificationEnabled=TRUE`; user clicks "I will call and setup myself" |
| Bill Upload / Savings | `/bill-upload/connect-account` | Requires `isBillUploadAvailable=TRUE` on UtilityCompany; zip `12249` (Con Edison) |
| Verify Utilities | `/verify-utilities/connect-account` | Same `isBillUploadAvailable` prerequisite |
| Connect | `/connect` | |

### Building Shortcodes
| Shortcode | Description |
|-----------|-------------|
| `autotest` | Standard move-in (partner-branded). Default for tests |
| `pgtest` | Short move-in (`useEncourageConversion=TRUE`, `isUtilityVerificationEnabled=TRUE`) |
| `txtest` | TX dereg encourage conversion (`useEncourageConversion=TRUE`, ElectricCompany=`TX-DEREG`) |

### Partner Theme Shortcodes
| Shortcode | Theme | Brand Color |
|-----------|-------|-------------|
| `autotest` | Moved | Blue |
| `funnel4324534` | Funnel | Dark navy |
| `venn325435435` | Venn | Coral/orange |
| `renew4543665999` | Renew | Deep indigo |

## Tech Stack
TypeScript, Playwright, Supabase (database), Fastmail (email/OTP verification), Inngest (async job triggers)

## Inngest Integration
Inngest functions in the `services` repo can be triggered via REST API in dev using `INNGEST_EVENT_KEY` from `.env`.

```bash
curl -s -X POST "https://inn.gs/e/$INNGEST_EVENT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "<event-name>", "data": {}}'
```

| Function | Event Name (dev) | Purpose |
|----------|-----------------|---------|
| `trigger-transaction-generation` | `transaction-generation-trigger` | Creates pending `SubscriptionMetadata` for active subscriptions |
| `trigger-subscriptions-payment` | `subscriptions-payment-trigger` | Processes pending metadata into payments |

**Important**: Inngest API always returns 200 — doesn't mean a function handled the event. Event names must match exactly.
**In production**: These are cron-triggered (1PM/3PM EST), not event-triggered — can only invoke manually via Inngest dashboard.

## Environments
Environment base URLs are configured in `tests/resources/utils/environmentBaseUrl.ts`. Tests select the environment via the `ENVIRONMENT` env var.

| Environment | When to use |
|-------------|-------------|
| `dev` | Default for local runs and most CI runs |
| `staging` | Pre-release validation, `/release-ready` checks |
| `production` | Read-only verification only — never run destructive tests |

## CI/CD
Tests run via GitHub Actions (`main-workflow.yml`). Scheduled regressions run daily at 5 AM UTC.

| Scope | Browser Project | Notes |
|-------|----------------|-------|
| Smoke | Chromium + Mobile Safari | Critical paths only |
| Regression1 | Chromium | Desktop baseline |
| Regression2 | Firefox | Desktop cross-browser |
| Regression3 | Safari | Desktop cross-browser |
| Regression4 | Mobile Chrome | Mobile baseline |
| Regression5 | Mobile Safari | Mobile cross-browser |
| Regression6 | Mobile Chrome | Extended mobile |
| Regression7 | Mobile Safari | Extended mobile |

## Skill Chaining

Skills route to each other based on outcomes. Common chains:

- **Ticket lands** → `/triage-ticket` → `/test-plan` → `/new-test` → `/run-tests`
- **Exploratory session** → `/exploratory-test` → `/log-bug` (for bugs found) → `/new-test` (for regression tests)
- **CI failure** → `/ci-health` → `/analyze-failure` → `/fix-test` (test issue) or `/log-bug` (product bug)
- **PR review** → `/review-pr` → `/test-plan` → `/exploratory-test` or `/new-test`
- **Release check** → `/release-ready` (aggregates `/ci-health` + Linear bugs + open PRs + feature flags)

After completing any skill, suggest the logical next skill based on the outcome.

## Continuous Improvement

After completing any skill execution, do a quick retrospective:

1. **Did any step not work as described?** — If a skill instruction was wrong, outdated, or missing a step, update the SKILL.md immediately
2. **Did you discover a better approach?** — If a different tool, MCP server, or sequence worked better than what the skill prescribes, update the skill
3. **Did you learn a new pattern?** — If a reusable pattern emerged (e.g., a better locator strategy, a common edge case, a useful Supabase query), add it to the relevant skill or to MEMORY.md
4. **Did a code convention change?** — If the codebase evolved (new POM pattern, new fixture structure, new constant), update CLAUDE.md and the affected skills

Do NOT update skills speculatively — only update based on concrete evidence from actual usage. The goal is that skills get more accurate and complete over time, not more verbose.
