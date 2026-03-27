---
name: review-pr
description: Review a GitHub PR to understand code changes and identify what needs testing
user-invocable: true
---

# Review a PR for Testing

When the user provides a GitHub PR (URL, number, or repo/number), analyze the changes, assess risk, and identify testing implications.

---

## 1. Fetch the PR

- `mcp__github__get_pull_request` to get title, description, author, branch, status, linked issues
- `mcp__github__get_pull_request_files` to get the full list of changed files and diffs
- `mcp__github__get_pull_request_status` to check CI status — are tests already failing on this PR?

---

## 2. Pull Linked Context

### Linear ticket (if linked)
- `mcp__linear__get_issue` to pull the ticket for requirements and acceptance criteria
- Compare: does the PR implement what the ticket describes? Any gaps?

### Figma design (if linked in ticket or PR description)
- `mcp__figma__get_design_context` + `mcp__figma__get_screenshot` for the expected UI
- Compare: does the PR's UI changes match the design intent?

### Visual diff (when PR has UI changes and is deployed to dev)
If the PR is merged/deployed to dev and includes UI changes:
1. `mcp__playwright__browser_navigate` to the affected page(s) on dev
2. `mcp__playwright__browser_take_screenshot` to capture current live state
3. If Figma link available → `mcp__figma__get_screenshot` for design comparison
4. Check: layout, typography, colors, component states, responsive behavior
5. Flag differences as **Bug** (wrong vs design), **Improvement** (could be better), or **Intentional** (PR changed this on purpose)

### Database changes (if PR touches migrations or schema)
- `mcp__supabase__list_tables` to understand current schema
- `mcp__supabase__execute_sql` to inspect affected tables — columns, types, constraints, relationships
- Identify: what data will tests need to verify after this change?

---

## 3. Analyze the Changes

For each changed file, classify into categories:

### UI Changes
- New/modified components, pages, forms, modals
- Changed text, labels, button names (affects locators in page objects)
- Layout or navigation changes
- Responsive/mobile changes

### API Changes
- New/modified endpoints, request/response shapes
- Changed validation rules
- Error handling changes

### Database Changes
- Migrations, new tables/columns, changed constraints
- Changed queries or data access patterns
- Feature flags added/modified

### Business Logic
- Validation rules, calculations, state transitions
- Permission changes, role-based access
- Conditional rendering logic

### Configuration
- Environment variables, feature flags
- Third-party service integrations
- Build/deploy configuration

---

## 4. Assess Risk to Existing Tests

Classify the PR's risk level:

### High Risk
- Changes shared UI components (affects multiple pages/features)
- Database schema changes (may break data-dependent tests)
- Authentication/authorization changes
- Navigation or routing changes
- Changes to components used in move-in or payment flows

### Medium Risk
- Changes to a single feature's UI or logic
- New API endpoints (existing tests unaffected, but new tests needed)
- Feature flag gating (existing behavior unchanged unless flag is on)

### Low Risk
- Styling-only changes (colors, spacing, fonts)
- Documentation or comment changes
- Test-only changes
- Dev tooling or CI configuration

---

## 5. Map to Test Impact

### Existing tests affected
- `Glob` + `Grep` in `tests/e2e_tests/` to find tests covering the changed feature area
- Check page objects in `tests/resources/page_objects/` for locators referencing changed elements
- Check fixtures in `tests/resources/fixtures/` for database queries hitting changed tables

### Page objects to update
- If UI labels, button names, or component structure changed → POM locators need updating
- List specific locator properties that likely need changes

### New tests needed
- New functionality introduced by the PR that has no test coverage
- New edge cases created by the change
- New error states or validation rules

### Database fixtures to update
- If schema changed → query modules may need column/type updates
- If new tables → new query module may be needed

---

## 6. Output Format

```
## PR Review: [TITLE] (#[NUMBER])

**Repo**: [owner/repo]
**Author**: [author]
**Branch**: [branch] → [base]
**CI Status**: [passing/failing/pending]
**Linked Ticket**: [Linear ID or "none"]

### Risk Assessment: [HIGH / MEDIUM / LOW]
[Brief justification for the risk level]

### Changes Summary
| File | Category | Change Description |
|------|----------|-------------------|
| [file1] | UI | [what changed] |
| [file2] | Database | [what changed] |
| [file3] | Logic | [what changed] |

### Testing Impact

#### Existing Tests to Verify
- [ ] `tests/e2e_tests/path/to/test.spec.ts` — [why it may be affected]
- [ ] `tests/e2e_tests/path/to/test2.spec.ts` — [why it may be affected]

#### Page Objects to Update
- [ ] `tests/resources/page_objects/page_name.ts` — [which locator and why]

#### Database Fixtures to Update
- [ ] `tests/resources/fixtures/database/queries.ts` — [what changed in schema]

#### New Tests Needed
- [ ] [Test case 1] — [reason] — Priority: [P0-P3]
- [ ] [Test case 2] — [reason] — Priority: [P0-P3]

### Design Comparison (if Figma available)
- [Match/Mismatch] — [details of comparison]

### UX & Improvement Observations
- [Any UX friction, inconsistency, or missing feedback noticed while reviewing the changes]

### Suggested Approach
1. [First action — e.g., run smoke tests to check for immediate regressions]
2. [Second action — e.g., update POM for changed button label]
3. [Third action — e.g., create new test for new feature]
```

---

## 7. Next Steps

After review, chain to the appropriate skill:
- `/run-tests` to run existing tests and check for regressions
- `/fix-test` if existing tests are now failing due to the PR's changes
- `/new-test` to scaffold tests for new functionality
- `/test-plan` if the PR introduces a large feature needing full test planning
- `/exploratory-test` to interactively investigate changed behavior

---

## 8. Tools Used

| Tool | Purpose |
|------|---------|
| **GitHub MCP** | `get_pull_request`, `get_pull_request_files`, `get_pull_request_status` — read PR diff, check CI |
| **Linear MCP** | `get_issue` — pull linked ticket for requirements context |
| **Figma MCP** | `get_design_context`, `get_screenshot` — compare UI changes against design |
| **Playwright MCP** | `browser_navigate`, `browser_take_screenshot` — visual diff of deployed UI changes |
| **Supabase MCP** | `list_tables`, `execute_sql` — inspect schema when PR has DB changes |
| `Glob`, `Grep` | Find affected tests, page objects, and fixtures |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
