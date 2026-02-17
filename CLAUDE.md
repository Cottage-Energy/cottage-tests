# Cottage Tests

Playwright end-to-end test suite for the Cottage Energy web application.

## Project Structure

- `tests/e2e_tests/` — Test specs organized by feature (move-in, payment, homepage, connect-account)
- `tests/resources/page_objects/` — Page Object Model classes
- `tests/resources/fixtures/` — Playwright fixtures, test utilities, and database helpers
- `tests/resources/constants/` — Centralized constants (`TEST_TAGS`, `TIMEOUTS`, companies)
- `tests/resources/types/` — TypeScript type definitions
- `tests/resources/utils/` — Utility functions (logger, Supabase client, Fastmail client)
- `tests/resources/data/` — Test data JSON files
- `playwright.config.ts` — Playwright configuration with browser projects and tag-based test suites

## Key Conventions

- See `CODE_STANDARDS.md` for full coding standards
- **Test tagging**: Use `TEST_TAGS` constants (e.g., `TEST_TAGS.SMOKE`, `TEST_TAGS.REGRESSION1`) — never raw strings
- **Timeouts**: Use `TIMEOUTS` constants — no magic numbers
- **Type safety**: No `any` types; use types from `tests/resources/types/`
- **Logging**: Use structured logger from `tests/resources/utils/logger.ts` — no `console.log`
- **Page Objects**: All page interactions go through POM classes in `tests/resources/page_objects/`
- **Cleanup**: Tests must clean up created data in `afterEach` hooks

## Test Execution

Tests run via GitHub Actions (`main-workflow.yml`) with scopes: Smoke, Regression1–7.
Each regression scope targets a specific browser project (Chromium, Firefox, Safari, Mobile Chrome, Mobile Safari).

## Tech Stack

- TypeScript, Playwright, Supabase (database), Fastmail (email/OTP verification)
