---
name: create-test
description: Scaffold a new Playwright e2e or API test spec following project conventions
user-invocable: true
---

# Create a New Test Spec

When the user asks to create a new test, follow these steps:

## 1. Check for Existing Test Plan
Before writing test cases from scratch, check if a test plan already exists:
- `Glob` for `tests/test_plans/*` matching the feature name or ticket ID
- If a plan exists → read it and align the new test to the planned test cases (IDs, priorities, scope)
- If no plan exists → proceed with gathering context from the user

## 1b. Determine Test Type
Detect whether this is an **e2e test** (UI interaction), **API test** (endpoint validation), or **performance test** (page load metrics):

| Signal | Type |
|--------|------|
| User says "API test", "endpoint test", "register endpoint" | API |
| Target is a REST endpoint, webhook, or backend service | API |
| User says "test this flow", "test this page", references a URL | E2E |
| Target involves UI interaction, forms, navigation | E2E |
| User says "performance test", "page load", "web vitals", "LCP", "TTFB" | Performance |
| Target is measuring speed, bundle size, or load time | Performance |

- **E2E** → continue to Step 2 (below)
- **API** → skip to Step 2-API
- **Performance** → skip to Step 2-Perf

## 2-Perf. Performance Test Placement
- Place in `tests/performance_tests/`
- Add page to `PUBLIC_PAGES` or `AUTHENTICATED_PAGES` array in the existing spec (prefer extending existing specs over creating new ones)
- If the page needs custom thresholds, add to `PAGE_SPECIFIC_THRESHOLDS` in `tests/resources/constants/performanceThresholds.ts`
- Tag with `TEST_TAGS.PERFORMANCE`
- Import from `@playwright/test` directly (NOT from page_objects — perf tests don't need POM fixtures)
- Use `performanceHelper` functions: `injectPerformanceObservers`, `collectPerformanceMetrics`, `assertPerformanceThresholds`, `logPerformanceSummary`
- See `tests/docs/performance-testing-guide.md` for full architecture and patterns

## 2. Determine Placement (E2E)
- Ask which feature area: `connect-account`, `cottage-user-move-in`, `homepage`, `payment`, or a new one
- Place the file in `tests/e2e_tests/<feature>/`
- Name it `{feature}_{scenario}.spec.ts`
- Check existing tests in the same folder with `Glob` to follow naming and structural patterns

## 3. Required Imports
Always import from barrel exports:
```typescript
import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('FeatureName');
```
Adjust relative paths based on file depth. Note: use `createLogger('Name')` — NOT `import { log }`.

## 4. Structure Template
```typescript
let result: SomeType | null = null;

test.describe('Feature: Description', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test.afterEach(async ({ page }) => {
    // Cleanup created test data
    if (result?.pgUserEmail) {
      await CleanUp.Test_User_Clean_Up(result.pgUserEmail);
    }
    await page.close();
  });

  test('descriptive test name', { tag: [TEST_TAGS.REGRESSION1] }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    // Implementation
  });
});
```

## 5. Create Page Objects as Needed
If the test interacts with a page that doesn't have a POM yet, create one:
- **Use Playwright MCP to inspect the live page** — navigate with `mcp__playwright__browser_navigate`, then use `mcp__playwright__browser_snapshot` to capture the accessibility tree and identify correct roles, names, and labels for locators
- Place in `tests/resources/page_objects/{page_name}_page.ts`
- All locators as `readonly` class properties
- Locator preference: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')` (last resort)
- Use `TIMEOUTS` constants for any timeout values
- All methods must have explicit return types
- Register it: export from `tests/resources/page_objects/index.ts` AND add to `tests/resources/page_objects/base/baseFixture.ts`

```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

export class ExamplePage {
  readonly page: Page;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click({ timeout: TIMEOUTS.MEDIUM });
  }
}
```

## 6. Create Fixtures / Query Modules as Needed
If the test needs database queries or utilities that don't exist yet:

**First, inspect the actual schema** — use Supabase MCP to get accurate table/column info:
- `mcp__supabase__list_tables` to see available tables
- `mcp__supabase__execute_sql` to inspect column names, types, constraints, and relationships for the relevant tables
- This ensures query modules use correct table names, column names, and types — no guessing

**Database query module** — place in `tests/resources/fixtures/database/{name}Queries.ts`:
```typescript
import { createClient } from '../../utils/supabase';
import { createLogger } from '../../utils/logger';

const log = createLogger('ModuleQueries');

export class ModuleQueries {
  private supabase;
  constructor() { this.supabase = createClient(); }

  async getRecord(id: string): Promise<RecordType> {
    log.info('Fetching record', { id });
    const { data, error } = await this.supabase.from('table').select('*').eq('id', id).single();
    if (error) { log.error('Failed', { id, error: error.message }); throw error; }
    return data;
  }
}
```
Export from `tests/resources/fixtures/database/index.ts`.

**Test utility** — place in `tests/resources/fixtures/{name}Utilities.ts`, follow patterns from `paymentUtilities.ts` or `billUploadUtilities.ts`.

## 6b. Inngest-Dependent Tests
When tests require async backend processing (subscriptions, bill ingestion, payment processing):

**Two types of Inngest functions:**

1. **Event-triggered** (can be triggered via API):
```typescript
import { execSync } from 'child_process';

function triggerInngest(eventName: string): void {
  const key = process.env.INNGEST_EVENT_KEY;
  execSync(`curl -s -X POST "https://inn.gs/e/${key}" -H "Content-Type: application/json" -d '{"name": "${eventName}", "data": {}}'`);
}
```

Key event names (dev only — production uses cron):
- `transaction-generation-trigger` — creates pending `SubscriptionMetadata`
- `subscriptions-payment-trigger` — processes pending metadata into payments
- `preparing-for-move` — pre-move-in reminder email (2 days before startDate)
- `email.send` — generic email dispatch

2. **Cron-only** (CANNOT be triggered via event API — must wait for `*/5` schedule):
- `balance-ledger-batch` — processes approved bills → `processed`, creates Payment in `requires_capture`
- `stripe-payment-capture-batch` — captures payments → `succeeded`
- Sending events to `inn.gs/e/` returns 200 but is a no-op for cron functions

**Full reference**: See `tests/docs/inngest-functions.md` for all known event names, apps, eligibility criteria, and gotchas.

**Wait for processing**: Inngest functions are async. After triggering (or after cron fires), poll the DB for expected state changes with a timeout. Do NOT use fixed `sleep` — use a polling helper like `billQueries.checkElectricBillIsProcessed()`.

**Bill test data setup pattern** (for tests that need processed bills on the overview):
1. Create user via move-in **with billing path** ("Public Grid handles everything" + Stripe card) — non-billing users (`maintainedFor = null`) can't process bills
2. Activate account: `ElectricAccount.status = 'ACTIVE'`, `isActive = true`, `registrationJobCompleted = true`
3. Ensure `Resident.isRegistrationComplete = true`
4. Insert bills with `ingestionState = 'approved'` via `billQueries.insertApprovedElectricBill()`
5. Wait for `balance-ledger-batch` cron (*/5 min) — polls via `billQueries.checkElectricBillIsProcessed()`
6. Pipeline is **sequential**: ledger batch processes bill → creates payment in `requires_capture` → `stripe-payment-capture-batch` captures → only then next bill can process
7. For FE-only tests (e.g., chart rendering), set 2nd+ bills directly to `processed` via SQL to avoid waiting for full pipeline

**Prerequisites for subscription tests**:
- `ElectricAccount.status` must be `ACTIVE`
- `SubscriptionConfiguration.dayOfMonth` must match today
- `Subscription.startDate` must be at least 1 billing cycle in the past

See `CLAUDE.md` → Inngest Integration for full details.

## 6c. Stripe Payment Method Entry in Tests
When a test needs to add a payment method via the UI (subscription activation, paused-to-active flow):

**Stripe iframe IS accessible via Playwright** — use `frameLocator`:
```typescript
// Fill Stripe card form
const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242');
await stripeFrame.getByRole('textbox', { name: /Expiration/ }).fill('12 / 30');
await stripeFrame.getByRole('textbox', { name: 'Security code' }).fill('123');
await stripeFrame.getByLabel('Country').selectOption('United States');
await stripeFrame.getByRole('textbox', { name: 'ZIP code' }).fill('10001');

// Click save on parent page (not inside iframe)
await page.getByRole('button', { name: 'Save details' }).click();
```

**Important**: The iframe `name` attribute changes per session (`__privateStripeFrame{N}`). Use the `title` selector which is stable: `iframe[title="Secure payment input frame"]`.

## 6d. Move-in Flow Tests (Onboarding)
When scaffolding tests for the move-in/transfer/bill-upload flows:

**mi-session/start interceptor is mandatory** — without it, the page auto-redirects:
```typescript
// Install BEFORE the page loads content
await page.addInitScript(() => {
  const origFetch = window.fetch;
  window.fetch = function(...args: Parameters<typeof fetch>) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
    if (url.includes('mi-session/start')) {
      return new Promise(() => {}); // Block forever
    }
    return origFetch.apply(window, args);
  };
});
await page.goto('https://dev.publicgrid.energy/move-in?shortCode=autotest');
```

**Building flag alignment for RE tests** — all three must be true for RE option to appear:
1. `Building.offerRenewableEnergy = true`
2. `UtilityCompany.offerRenewableEnergy = true`
3. `UtilityCompany.subscriptionConfigurationID` is set (not null)

Use DB setup in `beforeEach` and restore in `afterEach`.

## 6e. DB Flag Manipulation for Test Preconditions
When tests need specific feature flag states, create setup/teardown helpers:

```typescript
// In beforeEach — set flags
await supabase.from('Building').update({ isHandleBilling: false }).eq('shortCode', 'autotest');
await supabase.from('UtilityCompany').update({ offerRenewableEnergy: true }).eq('id', 'SDGE');

// In afterEach — ALWAYS restore
await supabase.from('Building').update({ isHandleBilling: true }).eq('shortCode', 'autotest');
await supabase.from('UtilityCompany').update({ offerRenewableEnergy: false }).eq('id', 'SDGE');
```

Key flags used in sidebar/subscription tests:
- `Building.isHandleBilling` — billing vs non-billing
- `Building.offerRenewableEnergyDashboard` — sidebar renewable card + recommendation
- `Building.offerRenewableEnergy` — move-in flow RE option
- `Building.shouldShowDemandResponse` — GridRewards recommendation
- `UtilityCompany.offerRenewableEnergy` — RE resolution
- `UtilityCompany.subscriptionConfigurationID` — links to pricing config
- `CottageUsers.enrollmentPreference` — null/verification_only/automatic/manual → controls "Search for savings"
- `SubscriptionConfiguration.dayOfMonth` — billing day (set to today for Inngest tests)
- `Subscription.startDate` — must be in past for Inngest processing

## 6f. Session Clearing Between Users
When a test needs to switch between users:

```typescript
async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('https://dev.publicgrid.energy/sign-in');
}
```

## 6g. Password Reset for Test Users
When a test needs to sign in as a user with unknown password:

```typescript
import { execSync } from 'child_process';

function resetPassword(userId: string, password: string = 'PG#12345'): void {
  const serviceKey = process.env.SUPABASE_API_KEY;
  const url = process.env.SUPABASE_URL;
  execSync(`curl -s -X PUT "${url}/auth/v1/admin/users/${userId}" -H "Authorization: Bearer ${serviceKey}" -H "apikey: ${serviceKey}" -H "Content-Type: application/json" -d '{"password": "${password"}'`);
}
```

**Note**: Supabase blocks password reuse — if the user already has `PG#12345`, the reset will return 422. Handle the password reset dialog via DOM removal if needed.

## 2-API. Determine Placement (API Tests)
- Place in `tests/api_tests/<feature>/`
- Name it `{feature}_{scenario}.spec.ts`
- Check existing API tests with `Glob` for `tests/api_tests/**/*.spec.ts` to follow patterns (e.g., `tests/api_tests/register/`, `tests/api_tests/v2/`)

## 2b-API. Probe Live Endpoints Before Writing Types
**CRITICAL: Do NOT write TypeScript types from a spec alone.** Specs drift from implementation. Before creating types or assertions:
1. **`curl` each endpoint** to capture the actual response shape — fields, types, nesting, pagination structure
2. **Compare spec vs actual** — note discrepancies as potential bugs or spec drift
3. **Write types from actual responses**, not from the spec. Add comments where actual differs from spec.
4. **Use `process.env` for test data IDs from the start** — don't rely on "first item in list" from paginated endpoints. Wire env vars (e.g., `API_V2_TEST_PROPERTY_UUID`) into `beforeAll` setup immediately.
5. **Categorize findings** as: API bug (code wrong), doc bug (docs wrong), improvement (works but suboptimal), not-a-bug (intended)

Example probe:
```bash
curl -s "https://api-dev.publicgrd.com/v2/buildings?limit=1" \
  -H "Authorization: Bearer $API_KEY" | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log('Keys:', Object.keys(d));
  console.log('Item keys:', d.data?.[0] ? Object.keys(d.data[0]) : 'empty');
"
```

This prevents the expensive rewrite cycle of: write types from spec → tests fail → discover actual shape → rewrite everything.

## 3-API. API Helper Class
Create a reusable API helper following the `RegisterApi` or `PublicGridApiV2` pattern at `tests/resources/fixtures/api/`:

```typescript
import { createLogger } from '../../utils/logger';

const log = createLogger('FeatureApi');

interface FeaturePayload { /* request body type */ }
interface FeatureResponse { /* response body type */ }

export class FeatureApi {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createResource(payload: FeaturePayload): Promise<{ status: number; body: FeatureResponse }> {
    log.info('POST /endpoint', { payload });
    const response = await fetch(`${this.baseUrl}/endpoint`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    return { status: response.status, body };
  }
}
```

Export from `tests/resources/fixtures/api/index.ts`.

## 4-API. API Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { FeatureApi } from '../../resources/fixtures/api';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('FeatureApiTest');

test.describe('API: Feature Name', () => {
  let api: FeatureApi;

  test.beforeAll(async () => {
    api = new FeatureApi(process.env.API_BASE_URL!, process.env.API_TOKEN!);
  });

  test('returns 201 for valid payload', { tag: [TEST_TAGS.REGRESSION1] }, async () => {
    const { status, body } = await api.createResource({ /* valid payload */ });
    expect(status).toBe(201);
    expect(body).toHaveProperty('id');
  });

  test('returns 400 for missing required field', { tag: [TEST_TAGS.REGRESSION1] }, async () => {
    const { status } = await api.createResource({ /* incomplete payload */ });
    expect(status).toBe(400);
  });
});
```

**Key patterns:**
- Group tests: happy path (2xx), validation (4xx), auth (401/403), edge cases
- Verify DB side effects via Supabase MCP or query modules
- Use `test.describe.configure({ mode: 'serial' })` only if tests share state
- Clean up created resources in `afterAll`/`afterEach`
- After API scaffolding is done → proceed to Step 7 (Rules), Step 8 (Validate), Step 9 (Run)

## 7. Rules (never violate)
- Use `TEST_TAGS` constants for tags — never raw strings like `'@smoke'`
- Use `TIMEOUTS` constants — never magic numbers like `30000`
- Use structured logger (`createLogger('Name')`) — never `console.log`
- No `any` types — import proper types from `tests/resources/types/`
- Always include `afterEach` with cleanup logic
- Use `test.describe.configure({ mode: "serial" })` only if tests share state
- Use page objects for all UI interactions — never raw selectors in test files
- **Prefer regex locators** in POMs for text-based locators — e.g., `page.getByRole('heading', { name: /Upload document/i })` instead of exact `'Upload document'`. Regex survives minor UI text changes without breaking tests.
- **OTP-based tests**: Do NOT use `FastmailActions.Get_OTP()` for shared test accounts — it asserts `content.length === 1` which breaks when prior sessions left stale OTP emails. Instead, create a custom `getLatestOTP()` that takes the most recent email. Import `Email` type from `tests/resources/utils/fastmail/types` for proper typing.
- **Tests sharing the same OTP user** should be combined into a single test or run sequentially with a single sign-in, to avoid triggering multiple OTP emails that pollute each other.
- **NEVER use `page.evaluate()` to fill form inputs** — it sets the DOM value but does NOT trigger React controlled component state. Form validation will still see the field as empty. Always use Playwright's native `fill()` method (`page.locator(...).fill(value)` or `browser_fill_form` via MCP).
- **Password dialog for new users**: ALL freshly-created move-in users get a "Set up your new password" alertdialog. Tests must call `overviewPage.Setup_Password()` before `Accept_New_Terms_And_Conditions()`.
- **ChargeAccount prerequisite for bill tests**: `balance-ledger-batch` requires a `ChargeAccount` with `ledgerBalanceID`. This is created by the registration Inngest pipeline, NOT by manually setting `status = ACTIVE`. If your test user has no ChargeAccount, inserted bills will stay `approved` forever.

## 8. Validate Before Done (Verification Before Completion)

**Iron rule: no test is "done" without fresh, real verification evidence.** Do not claim a test works based on reasoning alone. The phrase "should pass" is banned — show output.

### Standards check on all created/modified files:
- No `any` types in any created/modified file
- All timeouts use `TIMEOUTS` constants
- All tags use `TEST_TAGS` constants
- Logger used instead of `console.log`
- Proper type imports
- Cleanup in `afterEach`
- No magic numbers
- No raw selectors in spec files — all through page objects
- `test.skip()` requires a reason string (ticket or data-precondition)
- Check existing tests in the same feature folder for patterns to follow

### Verify standards before claiming done (RUN THIS)
`/create-test` creates new `.spec.ts` files. Do NOT report done based on reading the file top-to-bottom — machine-check it. Takes 30 seconds and catches violations skim-reading misses:

```bash
FILES="<the new .spec.ts + .ts files you created this session>"
grep -nE "page\.(getByRole|getByText|getByLabel|getByTestId|locator)\(" $FILES    # POM
grep -nE ":\s*any\b|as\s+any\b" $FILES                                            # any
grep -nE "console\.(log|error|warn|info|debug)" $FILES                            # console
grep -nE "tag:\s*\[\s*['\"]@" $FILES                                              # raw tags
grep -nE "(setTimeout|waitForTimeout)\([0-9]+\)|timeout:\s*[0-9]{3,}" $FILES      # magic timeouts
grep -nE "test\.skip\(\s*\)" $FILES                                               # naked skips
```

ANY output from ANY grep = refactor, do NOT report done. POM compliance is per-line — skipped tests, edge-case locators, and failure-terminus assertions (invalid-cred errors, auth-code-error pages) all count. Acceptable `page.*` calls in specs: `page.goto`, `page.waitForURL`, `page.waitForResponse`, `page.waitForTimeout`, `page.context`, `page.addInitScript`, `page.on`, `page.evaluate` (framework primitives, not UI interactions).

**Why:** On 2026-04-18 I shipped 3 specs, told the user "follows CODE_STANDARDS.md," then the user asked me to verify. 30-second grep found 14 POM violations in my own files. See `memory/feedback_run_standards_audit_before_claiming_compliance.md` and `memory/feedback_pom_compliance_is_per_line.md`.

### Anti-rationalization guards — STOP if you catch yourself thinking:
| Thought | What to do instead |
|---------|---------------------|
| "The test logic looks correct, it should pass" | Run it. "Looks correct" is not evidence. |
| "I'll skip running it — it's straightforward" | The simplest tests catch the most surprising bugs. Run it. |
| "It failed but that's just a data issue, the test is fine" | A test that can't run is not a test. Fix the data setup. |
| "I'll mark it as `.skip` for now and come back later" | No. Either make it pass or don't create it yet. |
| "The POM locators match what I saw in the snapshot" | Snapshots are a moment in time. Run the test to prove they work in the full flow. |

## 9. Run the Test and Show Evidence
Always run the new test locally to verify it works before declaring done:
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/<feature>/<new_file>.spec.ts
```
- **Paste the actual test output** — pass count, duration, any warnings
- If it passes → proceed to cleanup
- If it fails → diagnose and fix immediately (don't leave a broken test). Return to Step 8 after fixing.
- If it depends on specific test data or environment → note the prerequisites clearly in the spec comments
- **After any fix attempt**, re-run from scratch — do NOT assume a code change fixed the issue without fresh evidence

## 10. Cleanup Artifacts
After running the test (pass or fail), clean up generated artifacts before declaring done:

1. **`test-results/` directory** — Playwright generates traces, screenshots, and videos on failure; remove after diagnosis
2. **`.playwright-mcp/` directory** — if Playwright MCP was used to inspect UI for locators, remove session data
3. **Local screenshots** — any PNGs taken during development/debugging in the project root

```bash
rm -rf test-results/                 # test runner artifacts
rm -rf .playwright-mcp/              # Playwright MCP session data
rm -f *.png                          # screenshots in project root
```

Do NOT skip cleanup — leftover artifacts bloat the repo and can be accidentally committed.

## 11. Next Steps
After the test is created and passing:
- `/run-tests` to run it in CI or with different browsers
- `/exploratory-test` if the test revealed areas needing further investigation
- `/fix-test` if it exposed issues in existing page objects or fixtures
- Update the test plan in `tests/test_plans/` to mark the test case as automated (if a plan exists)

### Documentation Check
- Did you build a new testing pattern (email verification, API testing, Inngest pipeline)? → Document the reusable pattern in `tests/docs/`
- Did you create new fixtures or helpers that future tests should reuse? → Note them in the relevant doc or in `tests/docs/inngest-functions.md` if Inngest-related

---

## 12. Tools Used

| Tool | Purpose |
|------|---------|
| **Playwright MCP** | `browser_navigate`, `browser_snapshot` — inspect live UI for accurate POM locators |
| **Supabase MCP** | `list_tables`, `execute_sql` — inspect actual schema before writing query modules |
| `Glob`, `Grep` | Find existing test plans, tests, and patterns to follow |
| `Write`, `Edit` | Create spec files, POMs, fixtures |
| `Bash` | Run the test locally to verify it works |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-04-11 (Payment test overhaul)
- **Payment specs import directly from fixture files**: Payment specs import from `tests/resources/fixtures/payment/` (AutoPaymentChecks, ManualPaymentChecks, FailedPaymentChecks). No facade class — each fixture file exports its own class.
- **Every payment utility method includes BLNK ledger verification**: After payment success/failure, the utility methods verify the corresponding BLNK ledger transactions. This is built into the payment fixtures, not the spec files.
- **Encouraged conversion flow is 2-step**: Use `newUserMoveInEncouraged()` for pgtest/funnel/partner shortcodes — NOT the standard 6-step `newUserStandardMoveIn()`.

### Session: 2026-03-13 (ENG-2402 Connect Flow Tests)
- **Logger import was wrong**: Template said `import { log }` but actual codebase pattern is `import { createLogger } from '../../resources/utils/logger'` + `const log = createLogger('Name')`. Fixed in Step 3.
- **`FastmailActions.Get_OTP()` is fragile**: Asserts `content.length === 1` which fails when prior exploratory sessions left stale OTP emails. Created custom `getLatestOTP()` that iterates `bodyValues` keys and takes the most recent match. Added to Rules.
- **Regex locators prevent breakage**: `BillUploadPage.uploadBillHeading` broke when UI text changed from "Upload your bill" to "Upload document". Using `/Upload document/i` regex would have survived the change. Added regex preference to Rules.
- **Combined TC-096 + TC-097**: Originally separate tests for the same non-connect user, but each triggered a new OTP causing email pollution. Combined into one test with a single sign-in. Added to Rules.
- **`Email` type import**: `import type { Email } from '../../resources/utils/fastmail/types'` for proper typing of Fastmail API responses — avoids `any[]`.

### Session: 2026-03-20 (ENG-2396/2399/2374/2453 Exploratory → Automation Patterns)
- **Stripe iframe accessible via Playwright**: Added section 6c with `frameLocator` pattern. Key: use `iframe[title="Secure payment input frame"]` (stable) not `iframe[name="__privateStripeFrame{N}"]` (dynamic).
- **mi-session/start interceptor for onboarding tests**: Added section 6d. Without it, move-in/transfer pages auto-redirect. Use `page.addInitScript()` for spec-based tests (more reliable than runtime `page.evaluate`).
- **DB flag manipulation is essential for sidebar/subscription tests**: Added section 6e with all key flags. Building + Utility + SubscriptionConfig must all be aligned. Always restore in afterEach.
- **Session clearing between users**: Added section 6f. Cookie + localStorage + sessionStorage clear pattern.
- **Password reset for unknown test users**: Added section 6g. Supabase admin API pattern.
- **Inngest date alignment**: Updated section 6b with prerequisites — startDate must be 1+ month in past, dayOfMonth must match today.
- **Patterns discovered during exploratory that should become helpers**: stripeHelpers, databaseHelpers (flag manipulation), inngestHelpers (trigger + poll), sessionHelpers (clear/switch user), passwordHelpers (admin reset). These should be created as reusable fixtures when scaffolding the first sidebar/subscription automation specs.

### Session: 2026-03-23 (ENG-2470 Legal Consent Exploration → Automation Patterns)
- **Use `1111111111` for test phone numbers**: In move-in and registration flows, always use this number to avoid sending SMS to real people. Add as a constant or in test data generators.
- **Household invitation tests need Fastmail email parsing**: Invite URL uses Resend tracked links. Extract `inviteCode` from email HTML `href` containing `resident%3FinviteCode`. Resident page is at `/resident?inviteCode={code}`.
- **Legal link assertions pattern**: Reusable pattern for verifying `<LegalLinks />` across flows — check 3 links (Terms, Privacy Policy, LPOA) with correct `href`, `target="_blank"`, `rel="noopener noreferrer"`. Consider a shared assertion helper.
- **DB verification for consent fields**: After registration, verify 4 columns: `termsAndConditionsDate`, `lpoaConsentDate`, `ipAddressTerms`, `ipAddressLPOA`. Add to `userQueries.ts` or create `consentQueries.ts`.
- **Partner theme shortcodes**: `autotest` (Moved), `funnel4324534` (Funnel), `venn325435435` (Venn), `renew4543665999` (Renew). Useful for white-label test coverage.

### Session: 2026-03-26 (ENG-2446 Bill Usage Charts — Test Data Setup Learnings)
- **Billing move-in path required for bill processing**: Non-billing move-in ("I will manage payments myself") sets `maintainedFor = null`. `balance-ledger-batch` silently skips those bills — they stay `approved` forever. Tests that need processed bills MUST use billing move-in ("Public Grid handles everything" + Stripe card).
- **Bill processing pipeline is sequential**: `balance-ledger-batch` (*/5 cron) processes approved bill → creates Payment in `requires_capture` → `stripe-payment-capture-batch` (*/5 cron) captures payment → only then next bill can process. For N sequential bills, worst case ~N×10 min.
- **Cron functions can't be triggered via event API**: `inn.gs/e/balance-ledger.batch` returns 200 but does nothing. Updated section 6b to distinguish event-triggered vs cron-only functions.
- **Shortcut for FE-only tests**: If testing only FE behavior (e.g., chart rendering), first bill goes through real pipeline to validate setup, then set remaining bills directly to `processed` via SQL.
- **Gas account creation**: If a building doesn't have gas, can INSERT a `GasAccount` manually with valid `utilityCompanyID` (e.g., `PEOPLES-GAS`, `DUKE`, `BGE`). Set `maintainedFor`, `status = ACTIVE`, `registrationJobCompleted = true`.

### Session: 2026-04-08 (ENG-2639 Alerts Enrollment API)
- **`sendMethod()` must omit Content-Type**: When testing unsupported HTTP methods (PUT/DELETE/PATCH), do NOT send `Content-Type: application/json`. Fastify validates the body schema before checking the route, returning 400 instead of the expected 404. Omit the header to get the correct 404.
- **`create_resident_from_utility_verification` RPC sets termsAndConditionsDate**: Even when `consentDate` is not provided, the Supabase RPC sets `termsAndConditionsDate` to NOW(). Don't assert null — assert it's a recent timestamp.
- **`enrollRaw()` method pattern**: For validation tests where you need to send invalid types (numbers, booleans) or partial bodies, use a `Record<string, unknown>` overload instead of the typed interface. This avoids TypeScript blocking the invalid payloads you need to test.
- **Partner Referral tracing**: Enrolled users link to MoveInPartner via `Referrals.referredBy` → `MoveInPartner.id`, NOT via Property.buildingID. Property.buildingID is null for API-enrolled users.
- **v1 API tests directory**: `tests/api_tests/v1/` is now the home for v1 partner API tests alongside `tests/api_tests/v2/` for Public Grid API v2.
