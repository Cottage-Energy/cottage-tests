---
name: review-standards
description: Audit test files for CODE_STANDARDS.md violations and suggest fixes
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Review Code Standards Compliance

Scan the codebase (or specified files) for violations of `CODE_STANDARDS.md`.

## Checks to Run

### 1. No `any` Types
Search for `any` usage in all `.ts` files under `tests/`:
- `let x: any`
- `param: any`
- `as any`
- `: any[]`

### 2. No `console.log`
Search for `console.log`, `console.warn`, `console.error` in all `.ts` files under `tests/`.
Should use structured logger from `tests/resources/utils/logger.ts` instead.

### 3. No Magic Numbers
Search for patterns like:
- `waitForTimeout(` followed by a raw number
- `test.setTimeout(` followed by a raw number
- `timeout:` followed by a raw number
Should use `TIMEOUTS` constants from `tests/resources/constants/timeouts.ts`.

### 4. No Raw Tag Strings
Search for raw tag strings like `'@smoke'`, `'@regression'` in test files.
Should use `TEST_TAGS` constants from `tests/resources/constants/testTags.ts`.

### 5. Missing Cleanup
Check that every `test.describe` block has an `afterEach` with cleanup logic.

### 6. Direct Selectors in Tests
Check that test spec files don't use `page.locator()`, `page.getByRole()`, etc. directly.
All UI interactions should go through page object classes.

## Output Format
Report findings grouped by violation type with:
- File path and line number
- The offending code
- Suggested fix
