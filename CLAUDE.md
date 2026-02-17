# Cottage Tests

Playwright e2e test suite for the Cottage Energy web application.

## Commands
- `npx playwright test --grep /@smoke/ --project=Chromium` — run smoke tests
- `npx playwright test tests/e2e_tests/path/to/file.spec.ts` — run a single test file
- `npx playwright test --grep /@regression1/ --project=Chromium` — run regression suite
- `npx playwright install --with-deps` — install browsers
- `npm ci` — install dependencies

## Code Rules (enforced — do not violate)
- No `any` types — use types from `tests/resources/types/`
- No `console.log` — use structured logger from `tests/resources/utils/logger.ts`
- No magic numbers — use `TIMEOUTS` and `RETRY_CONFIG` from `tests/resources/constants/`
- No raw tag strings — use `TEST_TAGS` constants (e.g., `TEST_TAGS.SMOKE`, not `'@smoke'`)
- All page interactions through POM classes in `tests/resources/page_objects/`
- Tests must clean up created data in `afterEach` hooks
- See `CODE_STANDARDS.md` for full coding standards

## Structure
- `tests/e2e_tests/` — test specs organized by feature (move-in, payment, homepage, connect-account)
- `tests/resources/page_objects/` — Page Object Model classes (register new ones in `base/baseFixture.ts` and `index.ts`)
- `tests/resources/fixtures/` — Playwright fixtures, test utilities, database query modules
- `tests/resources/constants/` — `TEST_TAGS`, `TIMEOUTS`, `RETRY_CONFIG`, companies
- `tests/resources/types/` — TypeScript type definitions (`moveIn.types.ts`, `user.types.ts`, `database.types.ts`)
- `tests/resources/utils/` — logger, Supabase client, Fastmail client, test helpers
- `playwright.config.ts` — browser projects (Chromium, Firefox, Safari, Mobile) + tag-based suites (Smoke, Regression1–7)

## Tech Stack
TypeScript, Playwright, Supabase (database), Fastmail (email/OTP verification)

## CI/CD
Tests run via GitHub Actions (`main-workflow.yml`) with scopes: Smoke, Regression1–7.
Each regression scope maps to a browser project. Scheduled regressions run daily at 5 AM UTC.
