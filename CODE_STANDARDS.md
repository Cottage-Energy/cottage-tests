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
