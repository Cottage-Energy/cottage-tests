---
name: exploratory-test
description: Scaffold a lightweight exploratory test for investigating behavior, edge cases, or bug reproduction
user-invocable: true
---

# Create an Exploratory Test

Exploratory tests are lightweight, investigation-oriented specs for:
- Reproducing reported bugs
- Investigating unexpected behavior
- Testing edge cases and boundary conditions
- Verifying fixes before writing formal regression tests
- Ad-hoc validation of UI flows or state transitions

## 1. Determine Placement
- Place all exploratory tests in `tests/e2e_tests/exploratory/`
- Create subdirectories by purpose: `bug-investigation/`, `edge-cases/`, `ui-validation/`
- Name files descriptively: `explore_{what_you_are_investigating}.spec.ts`
- Examples: `explore_otp_timeout_behavior.spec.ts`, `explore_duplicate_account_edge_case.spec.ts`

## 2. Required Imports
Always import from barrel exports — adjust relative paths based on file depth:
```typescript
import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { loggers, createLogger } from '../../resources/utils/logger';
```
Import fixtures only as needed:
```typescript
import { generateTestUserData, CleanUp } from '../../resources/fixtures';
```

## 3. Structure Template
Exploratory tests prioritize verbose logging and flexible structure over strict assertions.

```typescript
import { test, expect } from '../../resources/page_objects';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('Exploratory');

test.describe('Explore: <brief description of investigation>', () => {

  test.afterEach(async ({ page }) => {
    // Include cleanup if test creates data; omit if read-only investigation
    await page.close();
  });

  test('<what you are investigating>', {
    tag: [TEST_TAGS.EXPLORATORY],
  }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_EXPLORATORY);

    log.section('Setup');
    // Navigate, set initial state

    log.section('Investigation');
    // Interact with the app, log observations
    log.step(1, 'Describe what this step checks');
    // ... page interactions via page objects ...
    log.info('Observed behavior', { /* relevant data */ });

    log.section('Findings');
    // Soft assertions — use expect.soft() so the test continues past failures
    expect.soft(/* observed */).toBe(/* expected */);
  });
});
```

## 4. Key Differences from Standard Tests
| Aspect | Standard Test | Exploratory Test |
|---|---|---|
| Tag | `TEST_TAGS.REGRESSION*` / `TEST_TAGS.SMOKE` | `TEST_TAGS.EXPLORATORY` |
| Timeout | `TIMEOUTS.TEST_MOVE_IN` etc. | `TIMEOUTS.TEST_EXPLORATORY` (5min) |
| Assertions | Hard `expect()` | Prefer `expect.soft()` to capture all findings |
| Logging | Minimal | Verbose — use `log.section()`, `log.step()`, `log.info()` heavily |
| Cleanup | Always required | Required only if test creates data |
| Retries | CI default (2) | Set `test.describe.configure({ retries: 0 })` — no retries |
| Serial mode | When tests share state | Not needed — exploratory tests should be independent |

## 5. Running Exploratory Tests
```bash
# Run all exploratory tests
npx playwright test --project=Exploratory

# Run a specific exploratory test
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts

# Run with headed browser for live observation
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts --headed

# Run with Playwright Inspector for step-by-step debugging
npx playwright test tests/e2e_tests/exploratory/explore_my_investigation.spec.ts --debug
```

## 6. Rules (never violate)
- Use `TEST_TAGS.EXPLORATORY` — never raw strings like `'@exploratory'`
- Use `TIMEOUTS` constants — never magic numbers
- Use structured logger (`createLogger`) — never `console.log`
- No `any` types — import proper types from `tests/resources/types/`
- Use page objects for UI interactions — never raw selectors in test files
- Set `retries: 0` — exploratory tests should not retry, the point is observing behavior
- Do NOT add exploratory tests to regression/smoke suites — they use only `TEST_TAGS.EXPLORATORY`

## 7. Graduating an Exploratory Test
When the investigation is complete and the behavior is understood:
1. If it found a bug: create a proper regression test in the appropriate feature folder using the `/new-test` skill
2. If it validated an edge case: convert to a formal test with hard assertions and a regression tag
3. Delete or archive the exploratory test — they should not accumulate indefinitely

## 8. After Creating
- Read `CODE_STANDARDS.md` to verify compliance
- Run the test with `--headed` to observe the investigation live
- Add comments documenting what you're investigating and any findings
