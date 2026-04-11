# Cottage Tests

Playwright e2e test suite for the Cottage Energy web application.

## QA Workflow & Role Context

I am the solo QA engineer on the Cottage Energy team. My workflow maps to skills:

| Step | Activity | Skill |
|------|----------|-------|
| 1. **Triage** | Read Linear tickets tagged for Testing/QA | `/test-plan` (Quick Triage phase) |
| 2. **Research** | Gather context from Notion docs, Figma screens, GitHub PRs | `/review-pr` (for PRs), `/test-plan` (multi-source) |
| 3. **Test Planning** | Write test plans, test cases, and UX improvement opportunities from requirements | `/test-plan` |
| 4. **Exploratory Testing** | Interactive exploration to find bugs, edge cases, and UX improvement opportunities | `/exploratory-test` |
| 5. **Automation** | Convert findings into Playwright e2e tests | `/new-test` |
| 6. **Bug & Improvement Reporting** | Log bugs and UX improvement suggestions in Linear with evidence | `/log-bug` |
| 7. **Test Execution** | Run automated suites locally or via CI | `/run-tests` |

### Supporting Skills

| Skill | When to use |
|-------|-------------|
| `/fix-test` | A test is failing or flaky — diagnose and fix |
| `/analyze-failure` | Classify CI/local failures, identify root cause |
| `/ci-health` | Morning pre-flight — env health, CI pass/fail, flaky test trends |
| `/test-coverage` | Map what's automated, find gaps |
| `/release-ready` | Go/no-go report before a release |
| `/test-data` | Set up test data — billing users, bills, subscriptions, feature flags |
| `/qa-summary` | Weekly/sprint QA summary for the team — tickets, bugs, improvements, CI trends |

### Main Outputs
- Test plans and test cases (in `tests/test_plans/`)
- Automated Playwright test scripts (in `tests/e2e_tests/`)
- Test documentation (in Notion)
- Bug reports and improvement tickets (in Linear)
- UX & product improvement suggestions (from test planning and exploratory sessions)
- Test execution results (exploratory + scripted)

### User Impact Rule (enforced — all QA outputs)
**Every bug, improvement, finding, and observation MUST include a User Impact statement** — describe what the user experiences in concrete, non-technical terms. This applies to:
- Bug reports posted to Linear
- Improvement tickets
- Exploratory session summaries (bugs table, edge cases, UX observations)
- Test plan UX observations
- PR review findings
- Failure analysis (product bugs)
- Release readiness reports (open bugs)
- QA summaries (bugs and improvements)

Good: "User gets no indication the creation failed — they may think it succeeded"
Bad: "409 error is unhandled in the catch block"

## MCP Servers (always prefer these over alternatives)

**Always use MCP server tools when available.** Do not fall back to CLI commands, web fetches, or manual workarounds when an MCP tool exists for the task. Use `ToolSearch` to load the appropriate MCP tool before calling it.

| Server | Purpose | Use for |
|--------|---------|---------|
| **Linear** | Read tickets for Testing/QA, log bugs and improvement suggestions, track test-related issues, comment test plans back to tickets | `get_issue`, `save_issue`, `save_comment`, `list_comments`, `search_issues`, `list_issues`, `list_issue_statuses` |
| **GitHub** | Read PRs, review code changes, CI/CD pipeline | `get_pull_request`, `get_pull_request_files`, `get_pull_request_status`, `list_pull_requests`, `list_commits`, `search_code` |
| **Supabase** | Query/manipulate database — check data state, toggle flags, verify DB changes | `execute_sql`, `list_tables`, `list_migrations` |
| **Playwright** | Browser automation for interactive testing and debugging. **Note**: PG-Admin (`dev.publicgrid.co`) uses Google SSO — closing the browser kills the session. Keep browser open for full PG-Admin sessions; fall back to Supabase for DB-level testing if session expires. | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_fill_form`, `browser_select_option`, `browser_take_screenshot`, `browser_network_requests`, `browser_console_messages` |
| **Figma** | UI screens to verify visual correctness and compare against implementation. **Note**: PG-App file is password-protected — MCP token auth cannot pass link passwords. Request manual screenshots when MCP returns access errors. | `get_design_context`, `get_screenshot` |
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

## Partner API v2

Public Grid exposes a REST API for third-party partners. Tests are in `tests/api_tests/v2/`.

| Environment | Base URL |
|-------------|----------|
| Dev | `https://api-dev.publicgrd.com/v2` |
| Staging | `https://api-staging.publicgrd.com/v2` |
| Production | `https://api.onepublicgrid.com/v2` |

- **Live docs**: `https://0bb57b59.developers-dkm.pages.dev/` (source of truth — NOT the PDF spec)
- **Auth**: Bearer token via `API_V2_KEY` env var
- **Base URL config**: `tests/resources/utils/environmentBaseUrl.ts` (has `api_v2` field per environment)
- **Test data**: customer `pgtest+funnel+final0002@joinpublicgrid.com`, property UUID `67c3e4a3...`, 4 bills, lease `qa-apiv2-lease-001`
- **Ticket**: ENG-2585
- **Pattern**: helpers in `tests/resources/fixtures/api/` extend `PublicGridApiV2` base class

## Commands

Always prefix local test runs with `PLAYWRIGHT_HTML_OPEN=never` to prevent the report browser from blocking.

### Local Test Execution
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/path/to/file.spec.ts` — run a single test file
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/<feature>/` — run a feature area
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Chromium` — run smoke tests
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@regression1/ --project=Chromium` — run regression scope
- `BASE_URL=http://localhost:3001 PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Chromium` — run tests against TanStack local
- Add `--headed` to watch the browser, `--debug` for Playwright Inspector

### TanStack Local Testing
- `BASE_URL=http://localhost:3001 PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Chromium` — run against TanStack local
- `BASE_URL=http://localhost:3001 PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Smoke` — smoke suite (use `--project=Smoke`, NOT `--project=Chromium --grep /@smoke/`)

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
| Verify Utilities | `/verify-utilities/connect-account` | Same `isBillUploadAvailable` prerequisite. **Separate `page.tsx`** from Bill Upload despite shared `(bill-upload)` route group |
| Connect | `/connect` | |

### Special Flows
| Flow | Entry Point | Notes |
|------|-------------|-------|
| Canada | Add `?country=ca` to encourage conversion URL (e.g., `?shortCode=pgtest&country=ca`) | Manual address form: Address, Unit, City, Province dropdown, Postal code, Country=Canada |
| Flex (bill splitting) | Dashboard → flex badge "More" (requires ACTIVE ElectricAccount) | "Split this bill" via getflex.com. 2% fee + 1% credit card. Create ComEd user → set status ACTIVE |
| Light Address Revamp (ENG-2347) | TX shortcodes use Light type-ahead. "Can't find?" → Google fallback modal | See `tests/docs/onboarding-flows.md` for full gate logic and test addresses |

### Building Shortcodes
| Shortcode | Description |
|-----------|-------------|
| `autotest` | Standard move-in (partner-branded). Default for tests |
| `pgtest` | Short move-in (`useEncourageConversion=TRUE`, `isUtilityVerificationEnabled=TRUE`) |
| `txtest` | TX dereg encourage conversion (`useEncourageConversion=TRUE`, ElectricCompany=`TX-DEREG`) |

### User Types & Post-Auth Routes
| User Type | DB Table | Post-Auth Route | Entry |
|-----------|----------|-----------------|-------|
| CottageUser | `CottageUsers` | `/app/*` (Overview, Billing, Services, Household) | Standard move-in, transfer, finish-reg |
| LightUser | `LightUsers` | `/portal/*` | Light move-in (ESI ID path) |

### "Set it up myself" Test Paths
| Flow | Button | Result |
|------|--------|--------|
| Standard move-in | "I will do the setup myself" (Utility Setup) | Savings alert page |
| Encourage (pgtest) | "I will call and setup myself" | Contact Provider page (utility verification) |
| Light (any) | "I will do/set it up myself" | Contact Provider page (via encourage page on TanStack) |

### Partner Theme Shortcodes
| Shortcode | Theme | Brand Color | Flow Type | Notes |
|-----------|-------|-------------|-----------|-------|
| `autotest` | Moved | Blue | Standard 6-step | RE available on utility setup step |
| `moved5439797test` | Moved | Blue | Standard 5-step | RE available on utility setup step |
| `venn73458test` | Venn | Coral/orange `rgb(234,117,85)` | Encouraged conversion | RE NOT enabled (MoveInPartner) |
| `funnel4324534` | Funnel | Dark navy | Standard (not Building) | Partner shortcode, not in Building table |
| `venn325435435` | Venn | Coral/orange | Standard (not Building) | Partner shortcode, not in Building table |
| `renew4543665999` | Renew | Deep indigo | Standard (not Building) | Partner shortcode, not in Building table |

### Waitlist Test Addresses
Waitlist can appear in: **move-in**, **transfer**, **bill-upload**, **verify-utilities**, and **encouraged conversion** flows.

| Address / ZIP | Flow | Result |
|---------------|------|--------|
| `155 N Nebraska Ave, Casper, WY 82609` | Standard move-in (no shortCode) | Waitlist page + Slack alert fires |
| `155 N Nebraska Ave, Casper, WY 82609` | Transfer flow | "Not able to service this area" + Slack alert fires |
| `155 N Nebraska Ave, Casper, WY 82609` | Encouraged conversion (MoveInPartner, e.g. `venn73458test`) | "We couldn't find service" dialog → `isUtilityVerificationEnabled=OFF` → waitlist; ON → utility verification (PR #1170) |
| `155 N Nebraska Ave, Casper, WY 82609` | Encouraged conversion (Building, e.g. `pgtest`) | No dialog — Building shortcodes use pre-configured utilities, zip lookup bypassed |
| `500 N Capitol Ave, Lansing, MI 48933` | Standard move-in / Transfer | Also triggers waitlist (no matching utility) |
| ZIP `12249` | Bill upload / Verify utilities | Waitlist — "We haven't reached 12249 yet" |

### Bill Upload Test ZIPs
| ZIP | Utility | Result |
|-----|---------|--------|
| `10001` | Con Edison | Bill upload available — proceeds to upload page |
| `12249` | National Grid MA | Waitlist — "We haven't reached 12249 yet" |
| `75063` | TX-DEREG | Texas bill drop flow |


## Tech Stack
TypeScript, Playwright, Supabase (database), Fastmail (email/OTP verification), Inngest (async job triggers)

Email content verification uses Fastmail JMAP API via Node.js — see `tests/docs/preparing-for-move-touchpoint.md` for the pattern.

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
| `preparing-for-move` | `preparing-for-move` | Pre-move-in reminder email (2 days before startDate) |
| `send-email` | `email.send` | Generic email dispatch |
| `trigger-ledger-payment-reminders` | `ledger.payment.reminders` | Payment reminder pipeline — supports `data.emails` filter in dev |
| `trigger-accounts-offboarding-reconciliation` | `trigger.accounts.offboarding.reconciliation` | Reconciles NEEDS_OFF_BOARDING → ACTIVE after payment |

**Cron-only functions** (cannot be triggered via event API — must wait for `*/5` schedule or invoke from Inngest dashboard):

| Function | Cron | Purpose |
|----------|------|---------|
| `balance-ledger-batch` | `*/5 * * * *` (TZ America/New_York) | Processes approved bills → `processed`, recalculates balances, creates Payment in `requires_capture` |
| `stripe-payment-capture-batch` | `*/5 * * * *` | Captures payments in `requires_capture` → `succeeded` |

**Bill processing pipeline** (sequential — each step needs a cron cycle):
1. Insert bill with `ingestionState = 'approved'`
2. `balance-ledger-batch` → bill becomes `processed`, Payment created in `requires_capture`
3. `stripe-payment-capture-batch` → Payment becomes `succeeded`
4. Only then can the next approved bill be processed
5. **Requires billing user** (`maintainedFor` IS NOT NULL) — non-billing users' bills stay `approved` forever

**Important**: Inngest API always returns 200 — doesn't mean a function handled the event. Event names must match exactly. Cron functions return 200 to event sends but are NOT triggered by them.
**In production**: Event-triggered functions above are cron-triggered (1PM/3PM EST) — can only invoke manually via Inngest dashboard.

**Reading Inngest function source**: When a ticket involves an Inngest function, read the source via GitHub API to understand trigger mechanism and eligibility criteria:
`gh api repos/Cottage-Energy/services/contents/<path> --jq '.content' | base64 -d`

**TanStack Inngest integration**: The TanStack migration has its own Inngest package at `packages/tanstack-inngest/src/functions/` in cottage-nextjs. These are local server-side functions (NOT the `services` repo). TanStack server-side errors appear in the browser console with a `[Server] LOG` prefix. When debugging TanStack email/event issues, check both the browser console for `[Server]` errors and the network tab for the `_serverFn/` POST calls.

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

- **Ticket lands** → `/test-plan` → `/test-data` (setup) → `/new-test` → `/run-tests`
- **Exploratory session** → `/exploratory-test` → `/log-bug` (bugs + improvements) → `/new-test` (regression tests)
- **CI failure** → `/ci-health` → `/analyze-failure` → `/fix-test` (test issue) or `/log-bug` (product bug)
- **PR review** → `/review-pr` → `/test-plan` → `/exploratory-test` or `/new-test`
- **Release check** → `/release-ready` (aggregates `/ci-health` + Linear bugs + open PRs + feature flags)
- **Weekly reporting** → `/qa-summary` (aggregates Linear + GitHub + CI + test plans)
- **Morning check** → `/ci-health` (env health + CI + flaky trends) → `/fix-test` or `/analyze-failure` as needed
- **Test data needed** → `/test-data` (recipes for billing users, bills, subscriptions, flags)

After completing any skill, suggest the logical next skill based on the outcome.

## Continuous Improvement

After completing any skill execution, do a quick retrospective:

1. **Did any step not work as described?** — If a skill instruction was wrong, outdated, or missing a step, update the SKILL.md immediately
2. **Did you discover a better approach?** — If a different tool, MCP server, or sequence worked better than what the skill prescribes, update the skill
3. **Did you learn a new pattern?** — If a reusable pattern emerged (e.g., a better locator strategy, a common edge case, a useful Supabase query), add it to the relevant skill or to MEMORY.md
4. **Did a code convention change?** — If the codebase evolved (new POM pattern, new fixture structure, new constant), update CLAUDE.md and the affected skills

Do NOT update skills speculatively — only update based on concrete evidence from actual usage. The goal is that skills get more accurate and complete over time, not more verbose.
