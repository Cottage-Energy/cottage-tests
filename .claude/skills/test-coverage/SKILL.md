---
name: test-coverage
description: Map automated test coverage by feature area, tag, and browser — identify gaps
user-invocable: true
---

# Test Coverage Summary

Scan the test suite and report what's covered, what's not, and where the gaps are.

## 1. Scan Test Files
- Use `Glob` to list all `*.spec.ts` files under `tests/e2e_tests/`, `tests/api_tests/`, and `tests/performance_tests/`
- Group by feature area: `cottage-user-move-in`, `light-user-move-in`, `payment`, `connect-account`, `homepage`, `exploratory`, `api`, `performance`

## 2. Extract Tags from Each Test
- Use `Grep` to find all `tag:` declarations in spec files
- Map each test to its tags: scope (`@smoke`, `@regression1-7`), feature (`@move-in`, `@payment`), priority (`@p1-p3`), browser coverage

## 3. Build Coverage Matrix

```
# Test Coverage Report — [date]

## Summary
- Total spec files: [N]
- Total test cases: [N]
- Feature areas: [N]

## Coverage by Feature Area
| Feature Area | Spec Files | Test Cases | Smoke | Regression | Exploratory |
|-------------|-----------|------------|-------|------------|-------------|
| cottage-user-move-in | [N] | [N] | [N] | [N] | [N] |
| light-user-move-in | [N] | [N] | [N] | [N] | [N] |
| payment | [N] | [N] | [N] | [N] | [N] |
| connect-account | [N] | [N] | [N] | [N] | [N] |
| homepage | [N] | [N] | [N] | [N] | [N] |
| exploratory | [N] | [N] | — | — | [N] |
| api | [N] | [N] | — | — | — |
| performance | [N] | [N] | — | — | — |

## Coverage by Regression Scope
| Scope | Browser | Test Count |
|-------|---------|-----------|
| Smoke | Chromium + Mobile Safari | [N] |
| Regression1 | Chromium | [N] |
| Regression2 | Firefox | [N] |
| Regression3 | Safari | [N] |
| Regression4 | Mobile Chrome | [N] |
| Regression5 | Mobile Safari | [N] |
| Regression6 | Mobile Chrome | [N] |
| Regression7 | Mobile Safari | [N] |

## Coverage by Priority
| Priority | Count |
|----------|-------|
| P1 (Critical) | [N] |
| P2 (Normal) | [N] |
| P3 (Low) | [N] |
| Untagged | [N] |
```

## 4. Identify Gaps
- **Feature areas with no automation** — features that exist in the app but have zero spec files
- **Smoke gaps** — critical flows not tagged `@smoke`
- **Browser gaps** — features only tested in one browser (no cross-browser regression tags)
- **Priority gaps** — tests without priority tags (hard to triage when they fail)
- **Unbalanced scopes** — regression scopes with very few or very many tests (uneven CI run times)

## 5. Gap Report

```
## Gaps & Recommendations

### Missing Automation
- [Feature/flow with no test coverage] — suggest `/create-test`

### Smoke Coverage Gaps
- [Critical flow not in smoke suite] — consider adding `@smoke` tag

### Browser Coverage Gaps
- [Feature only tested in Chromium] — consider adding regression tags for other browsers

### Unbalanced Scopes
- Regression[X] has [N] tests, Regression[Y] has [M] tests — consider rebalancing

### Stale Exploratory Tests
- [Exploratory tests that should be graduated or deleted]
```

## 6. Tools Used

| Tool | Purpose |
|------|---------|
| `Glob` | Find all spec files under `tests/e2e_tests/` |
| `Grep` | Extract tags, count test cases, map coverage |
| `Read` | Inspect specific files when needed for detail |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
