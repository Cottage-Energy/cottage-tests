# Cottage Tests - Code Standards & Best Practices

This document outlines the coding standards and best practices for the Cottage Tests automation framework.

## 📁 Project Structure

```
tests/
├── e2e_tests/           # End-to-end test specifications
│   ├── connect-account/
│   ├── cottage-user-move-in/
│   ├── homepage/
│   ├── light-user-move-in/
│   └── payment/
└── resources/           # Shared test resources
    ├── api/             # API clients
    ├── constants/       # Centralized constants
    ├── data/            # Test data (JSON)
    ├── fixtures/        # Playwright fixtures & utilities
    ├── page_objects/    # Page Object Model classes
    ├── types/           # TypeScript type definitions
    └── utils/           # Utility functions
```

## 🎯 Core Principles

### 1. Type Safety First
- **Always** use TypeScript types and interfaces
- **Never** use `any` type - use proper types from `types/` folder
- Import types explicitly: `import type { MoveInResult } from '../types/moveIn.types'`

```typescript
// ❌ Bad
let result: any;

// ✅ Good
let result: MoveInResult | null = null;
```

### 2. Use Constants for Magic Numbers
- Import timeouts from `constants/timeouts.ts`
- Import test tags from `constants/testTags.ts`

```typescript
// ❌ Bad
test.setTimeout(450000);
await page.waitForTimeout(10000);

// ✅ Good
test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
await page.waitForTimeout(TIMEOUTS.MEDIUM);
```

### 3. Use Structured Logging
- Import logger from `utils/logger.ts`
- Use appropriate log levels (debug, info, warn, error)

```typescript
// ❌ Bad
console.log('User ID:', userId);

// ✅ Good
log.info('User retrieved', { userId });
log.debug('User details', { userId, email, status });
```

### 4. Use Helper Functions for Validation
- Use `validateOTP()` instead of manual type checks
- Use `assertDefined()` for null checks

```typescript
// ❌ Bad
if (typeof OTP === 'string') {
  // ...
} else {
  throw new Error('Invalid OTP');
}

// ✅ Good
const otp = validateOTP(await FastmailActions.Get_OTP(email));
```

## 📝 Naming Conventions

### Files
- Test files: `{feature}_{scenario}.spec.ts`
- Page objects: `{page_name}_page.ts`
- Types: `{domain}.types.ts`
- Utilities: `camelCase.ts`

### Variables & Functions
- Variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Classes: `PascalCase`
- Interfaces/Types: `PascalCase`

### Test Tags
- Always use constants from `TEST_TAGS`

```typescript
// ❌ Bad
{tag: ['@smoke', '@regression1']}

// ✅ Good
{tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1]}
```

## ⏱️ Timeout Constants Reference

| Constant | Value | Use Case |
|----------|-------|----------|
| `TIMEOUTS.SHORT` | 5s | Quick checks |
| `TIMEOUTS.MEDIUM` | 10s | Standard waits |
| `TIMEOUTS.DEFAULT` | 30s | Default operations |
| `TIMEOUTS.LONG` | 60s | Extended operations |
| `TIMEOUTS.TEST_MOVE_IN` | 450s | Move-in flow tests |
| `TIMEOUTS.TEST_PAYMENT` | 300s | Payment flow tests |
| `TIMEOUTS.TEST_UI` | 180s | Simple UI tests |
| `TIMEOUTS.UI_STABILIZE` | 1s | UI animations |

## 🧪 Test Structure

```typescript
import { test, expect } from '../../../resources/page_objects';
import { MoveInTestUtilities, validateOTP } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types/moveIn.types';

/** Stores result for cleanup */
let result: MoveInResult | null = null;

test.beforeEach(async ({ page }) => {
  // Setup logic using individual query modules (e.g., utilityQueries, accountQueries)
});

test.afterEach(async ({ page }) => {
  // Cleanup logic
  if (result?.pgUserEmail) {
    await CleanUp.Test_User_Clean_Up(result.pgUserEmail);
  }
  await page.close();
});

test.describe('Feature: Description', () => {
  test('Test case name', { tag: [TEST_TAGS.SMOKE] }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    
    // Test implementation
  });
});
```

## 🔧 Page Object Pattern

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

### Fixing a POM violation — extend the existing POM, don't inline in the spec

When the gate (or a local audit) flags `page.getByRole/Text/Label/TestId/locator` inside a spec, the fix is almost always to add the locator to the POM that already owns that page — not create a new POM and not leave the selector in the spec.

**Pattern:**
1. Find the spec line, e.g. `await page.getByRole('button', { name: 'Enable' }).click()`
2. Identify the owning POM by the URL the test is on (e.g., `/app` → `overview_dashboard_page.ts`).
3. Add a `readonly` field + constructor assignment using the **verbatim selector**:
   ```typescript
   // overview_dashboard_page.ts
   readonly Overview_Enable_Autopay_Button: Locator;
   // …in constructor:
   this.Overview_Enable_Autopay_Button = page.getByRole('button', { name: 'Enable' });
   ```
4. Swap the spec line:
   ```typescript
   await overviewPage.Overview_Enable_Autopay_Button.click();
   ```

**Rule of thumb:** new POM files are for new pages. A new dialog, modal, or control on a page that already has a POM = extend the POM. This is how PR #26 eliminated 13 violations across 4 specs by adding 7 locators to 4 existing POMs.

## 📊 Logger Usage

```typescript
import { loggers, createLogger } from '../utils/logger';

// Use pre-configured loggers
const log = loggers.database.child('UserQueries');

// Or create custom logger
const log = createLogger('MyModule');

// Logging examples
log.info('Operation started', { userId: '123' });
log.debug('Detailed info', { data: complexObject });
log.warn('Potential issue', { warning: 'message' });
log.error('Operation failed', { error: errorMessage });
log.step(1, 'First step description');
log.section('New Test Section');
```

## ✅ Checklist Before Committing

- [ ] No `any` types used
- [ ] All timeouts use `TIMEOUTS` constants
- [ ] Test tags use `TEST_TAGS` constants
- [ ] Logger used instead of `console.log`
- [ ] Proper type imports used
- [ ] Error handling with helper functions
- [ ] Test cleanup in `afterEach`
- [ ] No magic numbers in code
- [ ] `test.skip()` has a reason string (ticket or precondition)
- [ ] All page interactions through POM classes (no raw `page.getByRole/Text/Label/TestId/locator` in spec files)

## 🛂 Enforcement

These rules are enforced in CI on pull requests by `.github/workflows/standards-gate.yml`. The gate is **two-tier + diff-aware**:

### Tier 1 — BLOCKING (violations you introduce)
- **New `.spec.ts` files added by your PR**: full content is checked. Any violation fails the gate.
- **Existing `.spec.ts` files modified by your PR**: only the lines your diff ADDS are checked. A pre-existing violation on an unchanged line does NOT fail. A new violation on a line you added DOES fail.

### Tier 2 — WARN-ONLY (pre-existing violations in files you touched)
Pre-existing violations in files your PR modifies are reported as GitHub `::warning::` annotations. They **do not block merge**. This is the boy-scout-rule nudge: "you're in this file anyway, consider cleaning up what's here."

### What the gate checks (same 6 patterns in both tiers)

| Check | What's banned | Allowed alternative |
|-------|---------------|---------------------|
| POM violations | `page.getByRole/Text/Label/TestId/locator` in spec files | Locator on a POM class in `tests/resources/page_objects/` |
| `any` types | `: any`, `as any` | Proper type import from `tests/resources/types/` |
| `console.*` | `console.log/error/warn/info/debug` | `createLogger('Name')` from `utils/logger.ts` |
| Raw tag strings | `tag: ['@smoke']` | `tag: [TEST_TAGS.SMOKE]` |
| Magic timeouts | `setTimeout(1800000)`, `waitForTimeout(500)`, `timeout: 10000` | `TIMEOUTS.*` constants |
| Naked skips | `test.skip()` with no reason | `test.skip(condition, 'reason tied to a ticket or precondition')` |

### Effect on common workflows

- **`/create-test`** creates new files → Tier 1 full-content check → **must be clean**.
- **`/fix-test`** typically modifies existing files → only diff lines blocked → **your changes must be clean, pre-existing debt in the same file just warns**.
- **PR that doesn't touch `.spec.ts`** → gate skips entirely.

### Exempted framework primitives
Allowed raw in specs (they're not UI interactions): `page.goto`, `page.waitForURL`, `page.waitForResponse`, `page.waitForTimeout`, `page.context`, `page.addInitScript`, `page.on`, `page.evaluate`, `page.keyboard`, `page.mouse`.

### Run the gate locally before pushing

For new files (full content):
```bash
F="your/new/spec.spec.ts"
grep -nE "page\.(getByRole|getByText|getByLabel|getByTestId|locator)\(" "$F"
grep -nE ":\s*any\b|as\s+any\b" "$F"
grep -nE "console\.(log|error|warn|info|debug)" "$F"
grep -nE "tag:\s*\[\s*['\"]@" "$F"
grep -nE "(setTimeout|waitForTimeout)\([0-9]+\)|timeout:\s*[0-9]{3,}" "$F"
grep -nE "test\.skip\(\s*\)" "$F"
```

For modifications to existing files (only your diff):
```bash
git diff --unified=0 main -- path/to/spec.ts | grep -E '^\+[^+]' | grep -E "page\.(getByRole|getByText|getByLabel|getByTestId|locator)\(|:\s*any\b|console\.|tag:\s*\[\s*['\"]@|(setTimeout|waitForTimeout)\([0-9]+\)|test\.skip\(\s*\)"
```

Any output = refactor before opening the PR.

### What the gate does NOT do

- Does NOT run `npm run lint` or `npm run typecheck` against the full repo — pre-existing baseline is 1998 lint errors + TypeScript errors in `database.types.ts`. Running those whole-repo would fail every PR. When the baseline is cleaned up (ENG-2724 Phase 0), add `npm run lint && npm run typecheck` as required CI checks.
- Does NOT run Playwright tests. Test runs happen in `.github/workflows/main-workflow.yml` unchanged.
- Does NOT block PRs on pre-existing debt. The goal is "no new violations" while the historical debt is cleaned up in staged PRs tracked in ENG-2724.
