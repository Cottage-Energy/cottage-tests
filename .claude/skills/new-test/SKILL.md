---
name: new-test
description: Scaffold a new Playwright e2e test spec following project conventions
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Create a New Test Spec

When the user asks to create a new test, follow these steps:

## 1. Determine Placement
- Ask which feature area: `connect-account`, `cottage-user-move-in`, `homepage`, `payment`, or a new one
- Place the file in `tests/e2e_tests/<feature>/`
- Name it `{feature}_{scenario}.spec.ts`

## 2. Required Imports
Always import from barrel exports:
```typescript
import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { log } from '../../resources/utils/logger';
```
Adjust relative paths based on file depth.

## 3. Structure Template
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

## 4. Rules (never violate)
- Use `TEST_TAGS` constants for tags — never raw strings like `'@smoke'`
- Use `TIMEOUTS` constants — never magic numbers like `30000`
- Use structured logger — never `console.log`
- No `any` types — import proper types from `tests/resources/types/`
- Always include `afterEach` with cleanup logic
- Use `test.describe.configure({ mode: "serial" })` only if tests share state
- Use page objects for all UI interactions — never raw selectors in test files

## 5. After Creating
- Read `CODE_STANDARDS.md` to verify compliance
- Check existing tests in the same feature folder for patterns to follow
