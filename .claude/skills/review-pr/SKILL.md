---
name: review-pr
description: Review a GitHub PR to understand code changes and identify what needs testing
user-invocable: true
---

# Review a PR for Testing

When the user provides a GitHub PR (URL, number, or repo/number), analyze the changes and identify testing implications.

## 1. Fetch the PR
- Use GitHub MCP tools (`mcp__github__get_pull_request`, `mcp__github__get_pull_request_files`) to read the PR
- Extract: title, description, changed files, diff, linked issues, comments

## 2. Analyze the Changes
For each changed file, identify:
- **UI changes** — new/modified components, pages, forms, modals
- **API changes** — new/modified endpoints, request/response shapes
- **Database changes** — migrations, schema changes, new queries
- **Business logic** — validation rules, calculations, state transitions
- **Configuration** — environment variables, feature flags, permissions

## 3. Map to Test Impact
Determine:
- **New tests needed** — for new functionality introduced by the PR
- **Existing tests affected** — tests that may break due to the changes
- **Page objects to update** — if UI selectors/structure changed
- **Database fixtures to update** — if schema or data shape changed

## 4. Cross-reference with Existing Tests
- Use Glob/Grep to find existing test files related to the changed feature area
- Check if page objects reference changed selectors or UI elements
- Identify tests in `tests/e2e_tests/` that cover the modified flows

## 5. Output Format
Present a structured analysis:

```
## PR: [TITLE] (#[NUMBER])
**Repo**: [owner/repo]
**Branch**: [branch name]

### Changes Summary
- [file1] — description of change
- [file2] — description of change

### Testing Impact

#### New Tests Needed
- [ ] Test case 1 — reason
- [ ] Test case 2 — reason

#### Existing Tests to Verify
- [ ] `tests/e2e_tests/path/to/test.spec.ts` — may be affected because...
- [ ] `tests/e2e_tests/path/to/test2.spec.ts` — may be affected because...

#### Page Objects to Update
- [ ] `tests/resources/page_objects/page_name.ts` — selector X may have changed

#### Database Changes
- [ ] Table/column changes to verify via Supabase

### Suggested Approach
1. Run existing smoke tests to check for regressions
2. Create new tests for [new functionality]
3. Update [page object] to reflect UI changes
```

## 6. Next Steps
After review, the user can:
- Use `/new-test` to scaffold tests for new functionality
- Use `/exploratory-test` to investigate changed behavior
- Use `/fix-test` if existing tests are now failing
