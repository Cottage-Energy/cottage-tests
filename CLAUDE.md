# Cottage Tests

Playwright e2e test suite for the Cottage Energy web application.

## QA Workflow & Role Context

I am the solo QA engineer on the Cottage Energy team. My workflow:

1. **Triage** — Read Linear tickets tagged for Testing/QA
2. **Research** — Tickets may link to Notion docs, Figma screens, or GitHub PRs; gather context from all sources
3. **Test Planning** — Write test plans and test cases based on requirements
4. **Exploratory Testing** — Manual/scripted exploration to find edge cases and bugs
5. **Automation** — Convert findings into Playwright e2e tests in this repo
6. **Bug Reporting** — Log discovered bugs in Linear with reproduction steps
7. **Test Execution** — Run automated suites via GitHub Actions CI/CD

### Main Outputs
- Test plans and test cases
- Automated Playwright test scripts
- Test documentation (in Notion)
- Bug reports (in Linear)
- Test execution results (exploratory + scripted)

## MCP Servers (always prefer these over alternatives)

**Always use MCP server tools when available.** Do not fall back to CLI commands, web fetches, or manual workarounds when an MCP tool exists for the task. Use `ToolSearch` to load the appropriate MCP tool before calling it.

| Server | Purpose | Use for |
|--------|---------|---------|
| **Linear** | Read tickets for Testing/QA, log bugs, track test-related issues | `mcp__linear__get_issue`, `mcp__linear__save_issue`, `mcp__linear__search_issues`, `mcp__linear__list_issues` |
| **GitHub** | Read PRs from cottage repos, review code changes to understand what to test, CI/CD pipeline | `mcp__github__get_pull_request`, `mcp__github__get_pull_request_files`, `mcp__github__list_commits`, `mcp__github__search_code` |
| **Supabase** | Query/manipulate database during testing — check data state, toggle flags, verify DB changes from tickets | `mcp__supabase__execute_sql`, `mcp__supabase__list_tables` |
| **Playwright** | Browser automation for test execution and interactive debugging | `mcp__playwright__browser_navigate`, `mcp__playwright__browser_snapshot`, `mcp__playwright__browser_click` |
| **Notion** | Documentation hub — feature docs, test plans, test cases *(auth pending)* | Will use MCP tools once authenticated |
| **Figma** | UI screens to verify visual correctness and test flows *(not yet configured)* | Will use MCP tools once configured |
| **context7** | Look up latest library/framework documentation | `mcp__context7__resolve-library-id`, `mcp__context7__query-docs` |

## Commands
- `npx playwright test --grep /@smoke/ --project=Chromium` — run smoke tests
- `npx playwright test tests/e2e_tests/path/to/file.spec.ts` — run a single test file
- `npx playwright test --grep /@regression1/ --project=Chromium` — run regression suite
- `npx playwright install --with-deps` — install browsers
- `npm ci` — install dependencies

## Code Rules (enforced — do not violate)
- No `any` types — use types from `tests/resources/types/`
- No `console.log` — use structured logger from `tests/resources/utils/logger.ts`
- No magic numbers — use `TIMEOUTS` and `RETRY_CONFIG` from `tests/resources/constants/`
- No raw tag strings — use `TEST_TAGS` constants (e.g., `TEST_TAGS.SMOKE`, not `'@smoke'`)
- All page interactions through POM classes in `tests/resources/page_objects/`
- Tests must clean up created data in `afterEach` hooks
- See `CODE_STANDARDS.md` for full coding standards

## Structure
- `tests/e2e_tests/` — test specs organized by feature (move-in, payment, homepage, connect-account)
- `tests/resources/page_objects/` — Page Object Model classes (register new ones in `base/baseFixture.ts` and `index.ts`)
- `tests/resources/fixtures/` — Playwright fixtures, test utilities, database query modules
- `tests/resources/constants/` — `TEST_TAGS`, `TIMEOUTS`, `RETRY_CONFIG`, companies
- `tests/resources/types/` — TypeScript type definitions (`moveIn.types.ts`, `user.types.ts`, `database.types.ts`)
- `tests/resources/utils/` — logger, Supabase client, Fastmail client, test helpers
- `playwright.config.ts` — browser projects (Chromium, Firefox, Safari, Mobile) + tag-based suites (Smoke, Regression1–7)

## Tech Stack
TypeScript, Playwright, Supabase (database), Fastmail (email/OTP verification)

## CI/CD
Tests run via GitHub Actions (`main-workflow.yml`) with scopes: Smoke, Regression1–7.
Each regression scope maps to a browser project. Scheduled regressions run daily at 5 AM UTC.
