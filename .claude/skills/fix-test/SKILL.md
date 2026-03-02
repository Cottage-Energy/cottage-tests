---
name: fix-test
description: Investigate and fix a failing or flaky Playwright test
user-invocable: true
---

# Fix a Failing Test

## 1. Investigate
- Read the failing test file completely
- Read all page objects and fixtures it depends on
- Check the error message or failure screenshot if provided
- Look at recent git changes that may have introduced the failure

## 2. Common Failure Patterns

### Flaky Locator
- Symptom: element not found intermittently
- Fix: replace fragile CSS/ID selectors with `getByRole`, `getByText`, or `getByTestId` in the page object
- Do NOT add arbitrary waits — fix the locator

### Timing Issue
- Symptom: timeout waiting for element/navigation
- Fix: use `await expect(locator).toBeVisible()` or Playwright auto-waiting
- If a longer timeout is genuinely needed, use `TIMEOUTS` constants
- Do NOT use `page.waitForTimeout()` with magic numbers

### State Dependency
- Symptom: test passes alone but fails in suite
- Fix: ensure proper cleanup in `afterEach`, check for shared state between tests
- Consider `test.describe.configure({ mode: "serial" })` if order matters

### Environment Issue
- Symptom: passes locally, fails in CI
- Fix: check environment variables, base URL configuration in `playwright.config.ts`, and `environmentBaseUrl.ts`

## 3. Update Page Objects When Needed
If the UI changed and selectors are stale:
- Fix locators in the POM file — never in the test spec
- Locator preference: `getByRole` > `getByText` > `getByLabel` > `getByTestId` > `locator('css')` (last resort)
- All locators must be `readonly` class properties
- All methods must have explicit return types
- If a page needs a new POM, create it: export from `index.ts` and register in `baseFixture.ts`

## 4. Update Fixtures When Needed
If database queries or test utilities are broken or missing:
- Fix query modules in `tests/resources/fixtures/database/`
- Fix test utilities in `tests/resources/fixtures/`
- Ensure exports are updated in the relevant `index.ts` barrel files

## 5. Fix Rules
- Fix the root cause — don't mask with retries or sleeps
- Keep changes minimal — only modify what's needed
- Maintain code standards: no `any`, no `console.log`, use constants
- If the page object locator is wrong, fix it in the POM — not in the test file
- Run the specific test after fixing to verify: `npx playwright test path/to/file.spec.ts`

## 6. Validate After Fixing
Run a standards check on all modified files:
- No `any` types
- All timeouts use `TIMEOUTS` constants
- All tags use `TEST_TAGS` constants
- Logger used instead of `console.log`
- No magic numbers
- No raw selectors in spec files

## 7. After Fixing
- Check if the same issue exists in similar tests
- If multiple tests broke from the same UI change, fix all affected page objects
