---
name: new-test
description: Scaffold a new Playwright e2e test spec following project conventions
user-invokable: true
---

# Create a New Test Spec

When the user asks to create a new test, follow these steps:

## 1. Check for Existing Test Plan
Before writing test cases from scratch, check if a test plan already exists:
- `Glob` for `tests/test_plans/*` matching the feature name or ticket ID
- If a plan exists → read it and align the new test to the planned test cases (IDs, priorities, scope)
- If no plan exists → proceed with gathering context from the user

## 2. Determine Placement
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

**Trigger Inngest functions via API** using `INNGEST_EVENT_KEY` from `.env`:
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

**Wait for processing**: Inngest functions are async. After triggering, poll the DB for expected state changes (e.g., metadata status `pending` → `completed`, new `Payment` record) with a timeout. Do NOT use fixed `sleep` — use a polling helper.

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

## 8. Validate Before Done
After creating the test (and any supporting POMs/fixtures), run a standards check:
- No `any` types in any created/modified file
- All timeouts use `TIMEOUTS` constants
- All tags use `TEST_TAGS` constants
- Logger used instead of `console.log`
- Proper type imports
- Cleanup in `afterEach`
- No magic numbers
- No raw selectors in spec files — all through page objects
- Check existing tests in the same feature folder for patterns to follow

## 9. Run the Test
Always run the new test locally to verify it works before declaring done:
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e_tests/<feature>/<new_file>.spec.ts
```
- If it passes → done
- If it fails → diagnose and fix immediately (don't leave a broken test)
- If it depends on specific test data or environment → note the prerequisites clearly in the spec comments

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
