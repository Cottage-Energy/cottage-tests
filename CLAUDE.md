# Cottage Tests

Playwright e2e test suite for the Cottage Energy web application.

## QA Workflow & Role Context

I am the solo QA engineer on the Cottage Energy team. My workflow maps to skills:

| Step | Activity | Skill |
|------|----------|-------|
| 1. **Triage** | Read Linear tickets tagged for Testing/QA | `/test-plan` (Quick Triage phase) |
| 2. **Research** | Gather context from Notion docs, Figma screens, GitHub PRs | `/test-plan` (PR analysis auto-triggers when PR link found) |
| 3. **Test Planning** | Write test plans, test cases, and UX improvement opportunities from requirements | `/test-plan` |
| 4. **Exploratory Testing** | Interactive exploration to find bugs, edge cases, and UX improvement opportunities | `/exploratory-test` |
| 5. **Automation** | Convert findings into Playwright e2e tests | `/create-test` |
| 6. **Bug & Improvement Reporting** | Log bugs and UX improvement suggestions in Linear with evidence | `/log-bug` |
| 7. **Test Execution** | Run automated suites locally or via CI | `/run-tests` |

### Supporting Skills

| Skill | When to use |
|-------|-------------|
| `/fix-test` | A test is failing or flaky — diagnose and fix |
| `/analyze-failure` | CI health check + failure analysis + root cause classification |
| `/test-coverage` | Map what's automated, find gaps |
| `/test-report` | QA summary, release readiness, or targeted report (optional .md export) |
| `/test-data` | Set up test data — billing users, bills, subscriptions, feature flags |

### Main Outputs
- Test plans and test cases (in `tests/test_plans/`)
- Automated Playwright test scripts (in `tests/e2e_tests/`)
- Test documentation (in Notion)
- Bug reports and improvement tickets (in Linear)
- UX & product improvement suggestions (from test planning and exploratory sessions)
- Test execution results (exploratory + scripted)

### Read-Only Source of Truth Rule (enforced — all external resources)
**NEVER modify, overwrite, or alter content in external resources unless explicitly instructed.** This includes:
- **Linear ticket descriptions** — owned by the creator. Post QA findings as **comments only** (use GraphQL `commentCreate`, NOT `update_issue` with description). To edit an existing QA comment (e.g., consolidated retest status), use `commentUpdate(id, input: { body })` — it's OK to edit your OWN comments to keep a consolidated status current.
- **Linear ticket status** — never move status unless explicitly told to
- **Notion docs** — read-only reference. Add comments or create new pages, don't edit existing content.
- **Figma designs** — observe and screenshot, don't modify
- **GitHub PR descriptions** — read-only. Post review comments, don't edit the PR body.
- **Database records** — only modify test data in dev. Never alter production or shared config data without explicit instruction.
- **Any shared document or config** — treat as source of truth. Observe, reference, comment — don't overwrite.

**Why:** These are the team's source of truth. Overwriting loses original context (ACs, specs, design intent) and breaks trust. QA adds value through comments and separate artifacts, not by altering originals.

### Existing Tests First Rule (enforced — all exploratory and pipeline testing)
**Before ANY exploratory or pipeline testing session, READ the existing automated test specs first.** Use the test code as your checklist — not ad-hoc discovery. This applies to:
- Payment testing → read `tests/resources/fixtures/payment/autoPaymentChecks.ts` for the full step-by-step sequence
- Move-in testing → read `tests/resources/fixtures/newUserFlows.ts` for flow helpers
- Any billing/pipeline testing → read the relevant `*.spec.ts` in `tests/e2e_tests/payment/`

**Rules:**
1. Follow the test sequence as written — each step that fails IS a bug
2. **NEVER manually UPDATE `ingestionState` or `ElectricAccount.status`** — let the Inngest pipeline do it. If it doesn't transition, THAT'S the bug.
3. Create CLEAN users via move-in — don't reuse users with unknown state
4. Check the FULL email trail — bill-arrival email AND payment success/failure email
5. Insert bills using the same pattern as test code (`billQueries.insertElectricBill`, `billQueries.approveElectricBill`) — don't freestyle raw SQL
6. Reference memory files FIRST: `payment-consolidated-learnings.md`, `payment-test-master-context.md`

**Why:** On Apr 16, a full payment-matrix session ignored 14+ existing payment session files AND the `autoPaymentChecks.ts` step-by-step sequence. Went ad-hoc, manually manipulated test data (`UPDATE ingestionState='processed'`), broke the natural pipeline, then wrongly dismissed a real Critical bug as "test data interference." The existing test code had every check already defined — just needed to follow it.

### Flow Completion Rule (enforced — all exploratory, interactive, AND retest-matrix testing)
**Every flow MUST be completed to its final page.** "Page renders" or "first 2 steps work" is NOT a pass. For every flow:
1. Complete to success/error/redirect page — no stopping partway
2. Verify DB state: user type, status, flags, relationships
3. Check ALL email content — read the body, not just count. Look for `<template></template>` (blank body)
4. If a flow has a payment step, fill the card and submit — don't stop at "Stripe iframe loaded"
5. If blocked, find another way (OTP sign-in, create new user, use test data) — never mark "untested"

**Evidence-of-artifact is NOT evidence-of-effect.** Receiving an email, extracting a link, seeing a toast, or landing on a page is proof the UPSTREAM step worked. It is NOT proof the DOWNSTREAM effect happened. For any recovery, verification, or state-change flow (forgot-password, email-change, OTP, magic-link, email confirmation, password reset, subscription activate/cancel, payment capture), a PASS requires confirming the STATE the flow attempted to change — not the artifact the flow produced along the way. If you only verified the artifact, the row is **BLOCKED, not PASS**. BLOCKED surfaces the gap; PASS hides it.

Auth recovery flows specifically require: click the link → verify the destination page renders (not a 500) → fill + submit the destination form → verify the effect (session established, password changed, email verified) → sign in with the new creds → confirm old creds / pre-verification state is rejected → confirm the link is single-use. These flows cannot be a one-row check inside a 50-row retest matrix — they require a dedicated flow sweep.

**Why:** On Apr 14 ENG-2188, a CRITICAL bug (Light payment post-confirm fails) was found only because the TX bill drop flow was pushed all the way to the end. Blank email bodies and DB sync bugs were found only through content verification. On Apr 17 a second CRITICAL (ENG-2721: password reset fully broken — `/auth/confirm` 500s) hid for 3 days behind two consecutive "Forgot password ✅ PASS" retest rows whose evidence was only "reset email received (10,482 chars)" — the link was never clicked, the form was never seen, the password was never changed, sign-in was never attempted. See `memory/feedback_email_received_not_pass_on_recovery.md`.

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

### Save Findings Incrementally Rule (enforced — all long-running sessions)
**Never batch findings to end-of-session — write each discrete finding to memory or Linear the moment it's verified.** Applies to any session >30 min, any session with multiple scenarios, and any session accumulating screenshots. Save as each piece lands:
- Each AC result (pass/fail + evidence) → memory file OR Linear comment
- Each bug finding → Linear (via `/log-bug` or direct comment)
- Each new code/DB/pipeline learning → memory reference file
- Each reusable pattern (locator, query, recipe) → feedback memory or skill SKILL.md

**Why:** On 2026-04-15 the "ENG-2188 p3" session accumulated payment-matrix screenshots past the 2000px many-image limit and locked up — every subsequent prompt was rejected before reaching the model, including "save to memory". A verified Scenario 3 bug (no confirmation email 25+ min after manual pay success) and other findings were stranded in the session's message log. The parent session had to reconstruct them from a screenshot after the fact. Incremental saves are cheap; end-of-session saves are load-bearing on a session that can die without warning.

See [feedback_save_findings_incrementally.md](C:/Users/CHRISTIAN/.claude/projects/c--Users-CHRISTIAN-Documents-GitHub-cottage-tests/memory/feedback_save_findings_incrementally.md) and [feedback_screenshot_size_limit.md](C:/Users/CHRISTIAN/.claude/projects/c--Users-CHRISTIAN-Documents-GitHub-cottage-tests/memory/feedback_screenshot_size_limit.md) for context.

## MCP Servers (always prefer these over alternatives)

**Always use MCP server tools when available.** Do not fall back to CLI commands, web fetches, or manual workarounds when an MCP tool exists for the task. Use `ToolSearch` to load the appropriate MCP tool before calling it.

| Server | Purpose | Use for |
|--------|---------|---------|
| **Linear** | Read tickets for Testing/QA, log bugs and improvement suggestions, track test-related issues, update tickets with QA test plans. Uses `@mseep/linear-mcp@latest` (NOT `linear-mcp-server` which has response format bug). **Fallback when MCP auth expires**: use Linear GraphQL API directly with `LINEAR_API_KEY` from `.env`. Endpoint: `https://api.linear.app/graphql`. See `payment-consolidated-learnings.md` for query patterns. | `get_issue`, `search_issues`, `update_issue`, `create_issue`, `list_issues`, `list_projects`, `list_teams` |
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

### Performance Testing
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance` — run full performance suite (8 tests: 6 public + 2 authenticated)
- `BASE_URL=https://tanstack-dev.onepublicgrid.com PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=Performance` — run against TanStack
- `PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/performance_tests/public_pages_perf.spec.ts --project=Performance` — public pages only
- Results saved to `tests/performance_tests/results/` as timestamped JSON baselines (`perf-{env}-{date}.json` + `perf-latest.json`)
- Environment auto-detected from `BASE_URL` / `ENV` — thresholds scale per environment (dev 1.0x, tanstack-dev 1.2x, staging 0.8x, production 0.6x)
- Authenticated tests use `PERF_TEST_EMAIL` from `.env` (default: `pgtest+reminder001@joinpublicgrid.com`); skips gracefully if login fails

### Setup
- `npm ci` — install dependencies
- `npx playwright install --with-deps` — install browsers

## Code Rules (enforced — do not violate)
- No `any` types — use types from `tests/resources/types/`
- No `console.log` — use structured logger from `tests/resources/utils/logger.ts`
- No magic numbers — use `TIMEOUTS` and `RETRY_CONFIG` from `tests/resources/constants/`
- No raw tag strings — use `TEST_TAGS` constants (e.g., `TEST_TAGS.SMOKE`, not `'@smoke'`)
- All page interactions through POM classes in `tests/resources/page_objects/` — POM compliance is measured **per line**, not per file. Skipped tests, edge-case locators, and failure-terminus assertions (invalid-cred errors, auth-code-error pages) all count. Acceptable remaining `page.*` calls in specs: `page.goto`, `page.waitForURL`, `page.waitForResponse`, `page.waitForTimeout`, `page.context`, `page.addInitScript`, `page.on`, `page.evaluate` (framework primitives, not UI interactions).
- Locator priority: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')` (last resort)
- POM locators must be `readonly` class properties; all POM methods must have explicit return types
- Tests must clean up created data in `afterEach` hooks
- `test.skip()` requires a reason string. Allowed forms: `test.skip('title', tag, fn)` (test definition with body skipped), `test.skip(condition, 'reason')` (runtime skip with reason), `test.describe.skip(...)` (parked block). Banned: naked `test.skip()` with no args or boolean-only.
- See `CODE_STANDARDS.md` for full coding standards

### Verify standards before claiming compliance
Before reporting any new/modified spec, POM, or fixture as "done," run the mechanical audit locally. Takes 30 seconds and catches violations reading-top-to-bottom misses:
```bash
# Run against the specific files you changed (not the whole repo)
FILES="<your changed .spec.ts files>"
grep -nE "page\.(getByRole|getByText|getByLabel|getByTestId|locator)\(" $FILES    # POM
grep -nE ":\s*any\b|as\s+any\b" $FILES                                            # any
grep -nE "console\.(log|error|warn|info|debug)" $FILES                            # console
grep -nE "tag:\s*\[\s*['\"]@" $FILES                                              # raw tags
grep -nE "(setTimeout|waitForTimeout)\([0-9]+\)|timeout:\s*[0-9]{3,}" $FILES      # magic timeouts
grep -nE "test\.skip\(\s*\)" $FILES                                               # naked skips
```

Any output = refactor before reporting done. POM compliance is measured per-line — skipped tests, edge-case locators, and failure-terminus assertions (invalid-cred errors, auth-code-error pages) all count. Acceptable remaining `page.*` calls in specs: `page.goto`, `page.waitForURL`, `page.waitForResponse`, `page.waitForTimeout`, `page.context`, `page.addInitScript`, `page.on`, `page.evaluate` (framework primitives, not UI interactions).

**Why:** On 2026-04-18 I told the user "all 3 specs follow CODE_STANDARDS.md" before running the audit. 30-second grep found 14 POM violations in my own specs plus 538 pre-existing across 21 other specs. Declaring compliance without a machine check fails repeatedly. See `memory/feedback_run_standards_audit_before_claiming_compliance.md` and `memory/feedback_pom_compliance_is_per_line.md`.

## Structure
- `tests/e2e_tests/` — test specs organized by feature (move-in, payment, homepage, connect-account)
- `tests/api_tests/` — API endpoint tests (Partner API v2, alerts enrollment, register, moved-embed)
- `tests/performance_tests/` — performance smoke tests (page load, Web Vitals, resource counts)
- `tests/performance_tests/results/` — JSON baseline snapshots (gitignored, local only)
- `tests/test_plans/` — structured test plans generated by `/test-plan`
- `tests/test_reports/` — QA reports (migration comparisons, release readiness)
- `tests/resources/page_objects/` — Page Object Model classes (register new ones in `base/baseFixture.ts` and `index.ts`)
- `tests/resources/fixtures/` — Playwright fixtures, test utilities, database query modules
- `tests/resources/constants/` — `TEST_TAGS`, `TIMEOUTS`, `RETRY_CONFIG`, companies, `performanceThresholds`
- `tests/resources/types/` — TypeScript type definitions (`moveIn.types.ts`, `user.types.ts`, `performance.types.ts`, etc.)
- `tests/resources/utils/` — logger, Supabase client, Fastmail client, test helpers, `performanceHelper`
- `playwright.config.ts` — browser projects (Chromium, Firefox, Safari, Mobile) + tag-based suites (Smoke, Regression1–7, Performance)
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
| Address UX improvements (ENG-2715, PR #1217, merged 2026-04-17) | Validation state (green check / red X) on LightAddressAutocomplete; prefilled TX address cleared on 0-match; `?electricCompany=X` / `?gasCompany=X` URL overrides skip ESI confirmation modal | Check/X applies to 3 files only: `building-selection.tsx`, `light-encouraged-address.tsx`, `texas-flow/address-search/page.tsx` — NOT `address-encouraged-default-form.tsx` (PR removed LightAddressAutocomplete from it). Override param works even when `UtilityCompany.utilityCode` is NULL. **Utility resolution priority**: URL override > Building shortCode config > Light ESI > zip-based lookup > waitlist. AC3 override "bypasses the standard company lookup" — includes waitlist by design. Prefill behavior differs by shortCode (standard fires AC2 clear; autotest/pgtest preserve; txtest ignores prefill entirely). See [eng-2715-address-ux-session.md](C:/Users/CHRISTIAN/.claude/projects/c--Users-CHRISTIAN-Documents-GitHub-cottage-tests/memory/eng-2715-address-ux-session.md) and `tests/docs/onboarding-flows.md` (ENG-2715 subsection) for full matrix. |

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

### Move-in Payment Step (Step 6)
- Radio group: "Public Grid handles everything" / "I will manage payments myself"
- "Skip for now" button appears ONLY when "Public Grid handles everything" is selected
- Encouraged conversion flow (pgtest, funnel, partner shortcodes) is a 2-step flow, NOT the standard 6-step. Use `newUserMoveInEncouraged()`.

### SMS Verification
- `DialpadSMS` table stores INBOUND SMS only. Outbound reminder SMS goes via Dialpad API directly — verify indirectly via consent flags.

### BLNK Schema (Supabase `blnk` schema)
- `blnk.transactions` — ledger transactions with `reference`, `effective_date`, `created_at`, `status`, `amount`
- `blnk.balances` — charge account balances with `balance_id`, `identity_id`, `balance`, `inflight_balance`
- `blnk.identity` — customer identities (148 in dev) linked to balances via `balances.identity_id`
- Query via `executeSQL()` in `tests/resources/utils/postgres.ts` (Supabase Management API)
- Blnk Migration project (Linear): ENG-2420/2421/2422/2423/2424/2426/2458 — test cases in `payment_comprehensive_test_matrix.md`

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


## Payment UI Reference

### Payment Documentation (READ FIRST — enforced for all payment work)
**Before ANY payment testing, test creation, or payment spec modification, READ these docs:**
- `tests/docs/payment-system.md` — how the payment system works (architecture, DB schema, pipeline, expected states)
- `tests/docs/payment-testing-guide.md` — how to TEST payments (check classes, DB queries, POM methods, email checks, spec coverage, UI state mappings)
- `tests/docs/inngest-functions.md` — Inngest function reference (event names, eligibility, cron schedules)

**Why:** Payment testing involves 69 DB query functions, 26 check methods across 3 classes, 12 spec files with 100 tests, and a sequential pipeline with 10+ state transitions. Skipping the docs means missing checks, wrong assertions, or re-inventing existing infrastructure.

### Payment Testing Sequence (from `autoPaymentChecks.ts` — ALWAYS follow this)
The existing automated tests verify the full pipeline in this exact order. Use this as the checklist for exploratory payment testing:
1. `insertElectricBill` → insert bill (raw, no ingestionState)
2. `approveElectricBill` → set `ingestionState = 'approved'`
3. `checkElectricBillIsProcessed` → WAIT for cron to transition to `processed` (DO NOT manually UPDATE)
4. `Check_Electric_Bill_Is_Ready` → verify **bill-arrival email** via Fastmail ("Your bill is available")
5. `checkPaymentStatus → 'scheduled_for_payment'` → verify Payment row created
6. `checkPaymentStatus → 'requires_capture'` → Payment transitions
7. UI: `Check_Payment_Status → 'Processing'` → Payments tab badge
8. `checkPaymentStatus → 'succeeded'` → Payment captured
9. `Check_Bill_Payment_Confirmation` → verify **success email** via Fastmail
10. `checkUtilityRemittance → 'ready_for_remittance'` → remittance record
11. BLNK ledger verification → entries match Payment
12. UI: outstanding = $0, fee display correct, status badge correct

**Bank-specific**: Steps 5-6 don't apply to bank — bank goes directly to `processing` → `succeeded`. Step 11 (BLNK): bank has NO `fee_transfer`/`transaction_fee` entries. Step 12: fee display = "-" for bank.

**Rules**: NEVER manually UPDATE `ingestionState` or `ElectricAccount.status`. Create CLEAN users via move-in. Insert bills using `billQueries.insertElectricBill` + `billQueries.approveElectricBill`. If a step doesn't complete, THAT'S the bug. **Never reuse users with failed payments** — their new bills may not process (pipeline blocks on outstanding failed state).

### Autopay Disable Mid-Pipeline (edge case — verified 2026-04-16)
The pipeline is **NOT atomic**. If a user disables autopay AFTER the Payment is created (`scheduled_for_payment`) but BEFORE capture, the payment gets **`canceled`** — NOT completed.
- Step 9 (`validate-payment-and-user-state`) checks `isAutoPaymentEnabled` before proceeding to capture
- If OFF → payment transitions to `canceled`, bill stays outstanding, user must pay manually
- BLNK entries remain QUEUED/INFLIGHT (not immediately VOID'd)
- This is the **correct/safe behavior** — no double-charge risk, respects user intent

### Pay Bill Modal
- Submit button text is "Pay bill" (NOT "Pay now"). Use `Submit_Pay_Bill_Modal()` scoped to dialog.
- `Select_Pay_In_Full_If_Flex_Enabled()` must ALWAYS click "Pay in full" when visible — it reveals the Stripe iframe. Without clicking, the Stripe form never loads.
- Flex option appears in the "Paying with" radiogroup as "Split your bills into smaller payments" — NOT a radio in the Amount section.
- Partial payment: "Other Amount" radio reveals a `$` textbox for custom amount. Fee + total recompute dynamically.
- **Fee calculation**: `Math.ceil(billAmount × percentage + fixed)` — currently 3% + 30¢ fixed per `FeeStructure`. Copy says "3% processing fee" but doesn't mention the 30¢ (ENG-2710).
- **Pay bill button visibility**: appears when there's a `processed` bill visible in Bill History + outstanding > $0. NOT based on autopay state.

### Card vs Bank Payment (us_bank_account) — key differences
| Aspect | Card | Bank (`us_bank_account`) |
|--------|------|--------------------------|
| UI fields | Card # + expiry + CVC + country + ZIP (when US) | Email + full name + bank typeahead + OAuth tiles + "Enter manually" link |
| Setup time | Instant | Instant (OAuth via Stripe Financial Connections) OR 1–2 business days (manual routing → microdeposit) |
| Fee (current config) | **3%** surcharge per payment | **Fee-free** |
| Fee config | `FeeStructure.targetPaymentMethodTypes` array — which payment types get the fee |
| Recovery on failure | Retryable via `isPaymentAttemptRecoverable` (unless advice code `confirm_card_data`/`do_not_try_again`) | **HARD-CODED non-recoverable** — `paymentMethod !== "us_bank_account"` in [const.ts](https://github.com/Cottage-Energy/services/blob/main/packages/payments/stripe/const.ts) |
| Reconciliation path | Normal pipeline | **Only** `auto-pay-reconciliation-trigger` after user updates method |
| Stripe iframes | 1 (main) | 2 (main + "Bank search results" Financial Connections) |
| Verification reminder | N/A | `microdeposit-verification-reminder` Inngest (event `billing/microdeposit.verification.required`), 1-day reminder |
| `CottageUsers.stripePaymentMethodType` | `'card'` | `'us_bank_account'` |
| Payment method detail shape | `{ brand: 'visa', last4: '4242' }` | `{ brand: bank_name, last4: '6789' }` — `bank_name` reused as `brand` |
| Account page Payment tab | Shows "3% fee" badge inline | No fee badge (tested 2026-04-15 on tanstack-dev) |
| Move-in Step 6 copy | "Cards have a 3% fee. Bank payments are fee-free. Public Grid does not add any fees to your bills." | — |
| Account tab URL param | `?tabValue=paymentMethod` (**camelCase** on tanstack-dev; lowercase `paymentmethod` auto-redirects) | — |

Test cards: `4242424242424242` (success), `4000000000000341` (declined).
Test banks: use Stripe test tiles "Test (OAuth)" / "Test (Non-OAuth)" in bank search. Manual routing: `110000000`, account `000123456789` (standard Stripe test values).
Test bank accounts (OAuth): `Success ••••6789` (success), `Failure ••••1116` (fails), `Insufficient Funds ••••2227` (fails).

### Bank vs Card — Payment Lifecycle & Failure Behavior (verified 2026-04-16)
| Aspect | Card | Bank (`us_bank_account`) |
|--------|------|--------------------------|
| **Payment lifecycle** | `scheduled_for_payment` → `requires_capture` → `succeeded` (authorize+capture) | `processing` → `succeeded` (single-step ACH) |
| **On failure: autopay** | Stays ON (recoverable) | **DISABLED** (`isAutoPaymentEnabled` → false) |
| **Failure email subject** | "Payment Failed - Action Required" | "[Urgent] - Update Your Payment Method" |
| **BLNK fee entries** | `transaction_fee` + `fee_transfer` created | **NO fee entries** (bank is fee-free) |
| **BLNK on failure** | Entries VOID'd | Entries VOID'd + compensating VOID entry created |
| **Fee transition (cross-method)** | Bank→Card recovery: fee entries APPEAR in BLNK | Card→Bank: fee entries would disappear |
| **Pipeline after failure** | New bills still process | **New bills may NOT process** (failed payment + autopay OFF blocks pipeline) |

### AutopayPaymentModal
- Triggered by **Overview page "Enable" button** (TIP section) — NOT by Account page switch toggle.
- **TanStack parity change (ENG-2713)**: Account page switch now shows "Disabling autopay?" confirmation dialog with Disable / Keep it buttons. Next.js dev was silent toggle.
- Role is **`alertdialog`** (NOT `dialog`). Do not use `getByRole('dialog')` to find it.
- Contents: "Thanks for enabling autopay!" + "Outstanding balance: $XX.XX" + "Pay now" / "Do it later" buttons.
- Only appears when user has outstanding balance + valid card.
- **"Automatic Payment Failed" banner (ENG-2711)**: shows even on MANUAL pay failure when autopay is ON — misleading copy.

### Account Page — Payment Tab
- Tab is "Payment" (not "Payment Information"), button is "Edit details" (not "Edit"), save is "Save details" (not "Save").
- Auto-pay toggle on Account page is a `switch` role (not checkbox). In edit mode it IS a checkbox.

### Password Dialog (affects ALL new move-in users — NEVER DISMISS, ALWAYS COMPLETE)
- Supabase triggers "Set up your new password" `alertdialog` for ALL freshly-created move-in users in dev.
- Appears BEFORE the terms modal (if both are pending). Blocks all page interactions.
- Tests must call `Setup_Password()` before `Accept_New_Terms_And_Conditions()` to handle it.
- `getByText` detection of the dialog is unreliable — prefer `page.locator('[role="alertdialog"]')` for detection.
- DOM removal (`document.querySelector('[role="alertdialog"]').remove()`) does NOT survive `page.reload()` — must complete the form.
- **ENG-2714**: Dialog reappears after EVERY page navigation even after being dismissed via form. Must be re-dismissed on each page load.
- **ENFORCED: When this dialog appears during Playwright MCP sessions, ALWAYS fill both password fields with `PG#12345` and click "Set new password". NEVER dismiss it, NEVER remove it via DOM, NEVER skip it. This is a 3-second operation — there is no excuse to bypass it.**

### Open Payment Bugs (as of 2026-04-16)
| Ticket | Severity | Title |
|--------|----------|-------|
| **ENG-2709** | Critical | `balance-ledger-application` silently fails after BLNK entry — bills stuck approved, no emails, no autopay |
| **ENG-2712** | High | Billing page shows Outstanding balance but "No bills yet" simultaneously |
| **ENG-2714** | High | Password dialog reappears after every navigation on fresh users |
| **ENG-2711** | Medium | "Automatic Payment Failed" banner shows on manual pay failure when autopay is ON |
| **ENG-2710** | Medium | Card fee copy says "3%" but actual formula is 3% + $0.30 fixed |
| **ENG-2713** | Low | TanStack adds "Disabling autopay?" confirm dialog — POM update needed |
| **ENG-2570** | — | Same-company single CA, gas-only 25+ overdue → neither offboarded |
| **ENG-2451** | — | Balance endpoint nearestDueDate = today+0 with NULL dueDates |

### Payment Test Users
| User | Type | Password | Notes |
|------|------|----------|-------|
| `pgtest+reminder001` | Separate CAs (SDGE+ComEd), auto-pay OFF | PG#12345 | |
| `pgtest+reminder002` | Single CA (SDGE+SDGE), auto-pay OFF | PG#12345 | |
| `pgtest+flex-msg00` | ComEd, Flex-enabled, $85 outstanding | PGTest#2026! | |
| `pgtest+tsk-ts-pay-001` | ComEd+NGMA, autopay ON, card 4242 | PublicGrid#1 | tanstack-dev, 3 bills paid |
| `pgtest+tsk-ts-autopay-002` | ComEd+NGMA, autopay ON, card 4242 | PublicGrid#1 | tanstack-dev, clean user, bill 81539 stuck (ENG-2709) |

### SMS Verification
- `DialpadSMS` table stores INBOUND SMS only. Outbound reminder SMS goes via Dialpad API directly — verify indirectly via consent flags.

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
| `auto-pay-reconciliation-trigger` | `auto-pay-reconciliation-trigger` | **Retries failed autopay after user updates payment method.** Entry point of 3-function chain: fetches all users with `isAutoPaymentEnabled=true` + `stripePaymentMethodID IS NOT NULL`, batches into groups of 25, emits `auto-pay-reconciliation.batch`. In prod: cron `0 11 * * *` EST (currently commented out). See [auto-pay-reconciliation-trigger-pipeline.md](C:/Users/CHRISTIAN/.claude/projects/c--Users-CHRISTIAN-Documents-GitHub-cottage-tests/memory/auto-pay-reconciliation-trigger-pipeline.md) for full recipe. |
| `auto-pay-reconciliation-batch` | `auto-pay-reconciliation.batch` | Internal fan-out. Filters batch to users with outstanding balance ≥ Stripe minimum. Emits one `auto-pay-reconciliation` event per qualifying user. |
| `auto-pay-reconciliation` | `auto-pay-reconciliation` | Per-user payment processor with `paymentType: "auto-pay-reconciliation"`. Uses the user's **current** `stripePaymentMethodID` — so fresh-after-failure cards/banks are what get charged. |

**Cron-only functions** (cannot be triggered via event API — must wait for `*/5` schedule or invoke from Inngest dashboard):

| Function | Cron | Purpose |
|----------|------|---------|
| `balance-ledger-batch` | `*/5 * * * *` (TZ America/New_York) | Processes approved bills → `processed`, recalculates balances, creates Payment in `requires_capture` |
| `stripe-payment-capture-batch` | `*/5 * * * *` | Captures payments in `requires_capture` → `succeeded` |

**Bill processing pipeline** (sequential — verified against `autoPaymentChecks.ts`):
1. Insert bill → `ingestionState = 'approved'`
2. `balance-ledger-batch` (cron) → fans out to `balance-ledger-application` per property
3. `balance-ledger-application` runs these steps IN ORDER:
   - Step 2: `process-bills-create-transactions` → BLNK APPLIED entry created
   - Step 3: `mark-bills-processed` → bill `ingestionState = 'processed'`
   - Step 5: `check-payment-method-configuration` → validates user has valid PM
   - Step 6: `calculate-payment-amounts` → computes fee via `FeeStructure`
   - Step 7: `send-email-notification` → bill-arrival email ("Your bill is available") via `sendLedgerEmail`
   - Step 7b: `send-first-bill-sms` → SMS notification (first bill only)
   - Step 8: `create-scheduled-payment-entry` → autopay Payment in `scheduled_for_payment` / `requires_capture` (only if `isAutoPaymentEnabled`)
   - Step 8b: `step.sleepUntil(getWaitUntil())` → prod: next day 12 PM EST, dev: +1 min
   - Step 9: `validate-payment-and-user-state` → pre-capture validation
   - Step 10: `process-payment` → Stripe charge
4. `stripe-payment-capture-batch` (cron) → captures `requires_capture` → `succeeded`
5. `payment_success_process` → sends "Your Bill Payment Confirmation" email
6. **Requires billing user** (`maintainedFor` IS NOT NULL) — non-billing users' bills stay `approved` forever
7. **Requires ChargeAccount with `ledgerBalanceID`** — without this, `balance-ledger-batch` silently skips the bill
8. **ENG-2709 (FIXED 2026-04-16)**: `balance-ledger-application` previously failed silently after Step 2. Now fixed — full pipeline operational. Verified across 11 bills in 9 payment scenarios.
6. **Requires ChargeAccount with `ledgerBalanceID`** — without this, `balance-ledger-batch` silently skips the bill. ChargeAccount is created by the registration Inngest pipeline during move-in, NOT by manually setting `ElectricAccount.status = 'ACTIVE'`. If a test user has no ChargeAccount, bills will stay `approved` forever even though the cron runs.

**Important**: Inngest API always returns 200 — doesn't mean a function handled the event. Event names must match exactly. Cron functions return 200 to event sends but are NOT triggered by them.
**In production**: Event-triggered functions above are cron-triggered (1PM/3PM EST) — can only invoke manually via Inngest dashboard.

**Reading Inngest function source**: When a ticket involves an Inngest function, read the source via GitHub API to understand trigger mechanism and eligibility criteria:
`gh api repos/Cottage-Energy/services/contents/<path> --jq '.content' | base64 -d`

**TanStack Inngest integration**: The TanStack migration has its own Inngest package at `packages/tanstack-inngest/src/functions/` in cottage-nextjs. These are local server-side functions (NOT the `services` repo). TanStack server-side errors appear in the browser console with a `[Server] LOG` prefix. When debugging TanStack email/event issues, check both the browser console for `[Server]` errors and the network tab for the `_serverFn/` POST calls.

### BLNK Assertions in Payment Flows (enforced — embed ticket ACs into existing flows)
**When testing payment flows, embed BLNK migration ticket ACs as additional assertions** rather than testing them separately. The payment flow IS the test vehicle for BLNK — don't create separate test sessions.

| During this flow... | Also verify these BLNK ACs |
|---------------------|---------------------------|
| Insert + approve bill | **ENG-2420**: Check no duplicate BLNK entries for same reference |
| Bill processed (BLNK APPLIED) | **ENG-2421/2422**: Check `effective_date` + `meta_data.dueDate` set correctly |
| New user created via move-in | **ENG-2458**: Check `blnk.balances.identity_id` is linked |
| Payment succeeded | Verify BLNK chain: bill entry → payment → fee (card only) → remittance → fee_transfer (card only) |
| Payment failed | **ENG-2424**: Check BLNK VOID entry created, check `#dev-ledgers-alerts` Slack |
| Batch bills (multiple at once) | **ENG-2420**: Verify exactly 1 BLNK entry per bill, 0 duplicates |
| Cross-method recovery (bank→card) | Verify fee entries APPEAR in BLNK after method switch |

**Why:** BLNK is the ledger layer underneath payments. Testing BLNK in isolation requires the same bill/payment setup anyway. Embedding ACs into payment flows is more efficient and tests them in realistic user journeys.

### BLNK Webhook Monitoring
- **Slack channel**: `#dev-ledgers-alerts` (dev) / `#prod-ledgers-alerts` (prod)
- **Handler**: `packages/lambda/src/webhooks/blnk.ts` in `services` repo
- **Events that alert to Slack**: `system.error`, `transaction.rejected`, `bulk_transaction.failed`
- **Events logged only**: `transaction.void`, `transaction.applied`, `transaction.inflight`, `transaction.scheduled`
- **⚠️ As of 2026-04-16**: Webhooks NOT configured in dev — channel is empty. Blocker for ENG-2423/2424.

## Environments
Environment base URLs are configured in `tests/resources/utils/environmentBaseUrl.ts`. Tests select the environment via the `ENVIRONMENT` env var.

| Environment | URL | When to use |
|-------------|-----|-------------|
| `dev` | `https://dev.publicgrid.energy` | **Next.js** deployment — default for local runs and most CI runs |
| `tanstack-dev` | `https://tanstack-dev.onepublicgrid.com` | Dedicated **TanStack Start** preview for ENG-2188 migration QA. Has its own Supabase auth — dev credentials (e.g., `pgtest+reminder002`) may not work here. Confirm via absence of `_next/static` bundles + presence of TanStack devtools. |
| `staging` | `https://staging.*` | Pre-release validation, `/test-report` release checks |
| `production` | `https://onepublicgrid.com` | Read-only verification only — never run destructive tests |

## Migration / Parity Testing (enforced for framework migrations)

**READ FIRST**: `tests/docs/migration-qa-learnings.md` — 50+ learnings from 20+ ENG-2188 sessions covering methodology, TanStack-specific findings, session management, bug discovery techniques, and tool/workflow patterns.

When testing a framework migration (e.g., Next.js → TanStack), follow this methodology:

1. **Verify deployment URL first** — confirm you're on the TARGET deployment, not the source. Check for stack markers (`_next/static` = Next.js, TanStack devtools = TanStack).
2. **Side-by-side parity** — for every flow, open source AND target deployments. Screenshot both. Compare: URL params, field values, toggle defaults, button visibility, checkbox initial state, field attributes.
3. **Inspect beyond happy path** — don't just check "did the flow complete?" Inspect: URL bar for encoded params, form field `disabled`/`name`/`checked` attributes via `browser_evaluate`, component visibility for different user states (guest vs logged in).
4. **Code audit = test cases** — when a developer posts a code audit, every item becomes a test case. Triage into UI-testable vs code-only, then test the UI-testable ones immediately.
5. **Create test conditions** — never mark something "untested" because you lack a specific user/state. Create the user, set the flag, trigger the condition.

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

### CI Notes — Payment Tests
- Payment tests take ~30 min each (move-in 5 min + bill pipeline crons `*/5` min x multiple cycles). Limit to 1 payment test per CI scope.
- Smoke scope runs 2 browsers (Chromium + Mobile Safari) — payment tests can timeout the job. Use Regression1 (Chromium only) for payment test runs.
- API v2 tests require `API_V2_KEY` in CI secrets — currently only configured in `.env` locally.
- **DemandResponseEnrollment FK constraint**: cleanup must delete `DemandResponseEnrollment` before `ElectricAccount` to avoid FK violation.

## Skill Chaining

Skills route to each other based on outcomes. Common chains:

- **Ticket lands** → `/test-plan` → `/test-data` (setup) → `/create-test` → `/run-tests`
- **Exploratory session** → `/exploratory-test` → `/log-bug` (bugs + improvements) → `/create-test` (regression tests)
- **CI failure / Morning check** → `/analyze-failure` (env health + CI dashboard + root cause) → `/fix-test` (test issue) or `/log-bug` (product bug)
- **PR review** → `/test-plan` (PR analysis auto-triggers) → `/exploratory-test` or `/create-test`
- **Release check** → `/test-report` release mode (CI + bugs + PRs + feature flags → go/no-go)
- **Weekly reporting** → `/test-report` summary mode (Linear + GitHub + CI + test plans)
- **Test data needed** → `/test-data` (recipes for billing users, bills, subscriptions, flags)

After completing any skill, suggest the logical next skill based on the outcome.

## Continuous Improvement

After completing any skill execution, do a quick retrospective:

1. **Did any step not work as described?** — If a skill instruction was wrong, outdated, or missing a step, update the SKILL.md immediately
2. **Did you discover a better approach?** — If a different tool, MCP server, or sequence worked better than what the skill prescribes, update the skill
3. **Did you learn a new pattern?** — If a reusable pattern emerged (e.g., a better locator strategy, a common edge case, a useful Supabase query), add it to the relevant skill or to MEMORY.md
4. **Did a code convention change?** — If the codebase evolved (new POM pattern, new fixture structure, new constant), update CLAUDE.md and the affected skills

Do NOT update skills speculatively — only update based on concrete evidence from actual usage. The goal is that skills get more accurate and complete over time, not more verbose.
