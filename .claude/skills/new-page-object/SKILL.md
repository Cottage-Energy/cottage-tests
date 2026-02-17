---
name: new-page-object
description: Create a new Page Object Model class following project patterns
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Create a New Page Object

## 1. Create the Class File
- Place in `tests/resources/page_objects/{page_name}_page.ts`
- Follow the naming pattern of existing POMs

## 2. Class Template
```typescript
import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

export class ExamplePage {
  readonly page: Page;
  readonly someButton: Locator;
  readonly someInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.getByRole('button', { name: 'Submit' });
    this.someInput = page.getByLabel('Email');
  }

  async clickSubmit(): Promise<void> {
    await this.someButton.click({ timeout: TIMEOUTS.MEDIUM });
  }
}
```

## 3. Locator Preferences (in order)
1. `page.getByRole()` — best accessibility
2. `page.getByText()` — visible text
3. `page.getByLabel()` — form fields
4. `page.getByTestId()` — data-testid attributes
5. `page.locator('css')` — last resort, avoid fragile IDs

## 4. Register the Page Object
After creating the class, do both of these:

**A. Export from barrel** — Add to `tests/resources/page_objects/index.ts`:
```typescript
export { ExamplePage } from './example_page';
```

**B. Add to base fixture** — Register in `tests/resources/page_objects/base/baseFixture.ts` so tests can use it as a fixture parameter.

## 5. Rules
- All locators must be `readonly` class properties
- All methods must have explicit return types
- Use `TIMEOUTS` constants for any timeout values
- Use structured logger, never `console.log`
- No `any` types
