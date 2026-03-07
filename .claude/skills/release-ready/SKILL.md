---
name: release-ready
description: Generate a release readiness report — CI results, open bugs, blockers, go/no-go recommendation
user-invokable: true
---

# Release Readiness Report

Aggregate CI results, open bugs, open PRs, feature flag states, and blockers into a go/no-go recommendation for release.

## 1. Check CI Status
- Use `Bash` with `gh run list --workflow=main-workflow.yml --limit 10` to get latest runs from `Cottage-Energy/cottage-tests`
- Identify the most recent run for each scope (Smoke, Regression1-7)
- Flag any scope that has not run in the last 24 hours as **stale**
- Flag any scope that has not run in the last 48 hours as **very stale — re-run required**

## 2. Check Open Bugs in Linear
- Use `mcp__linear__list_issues` to find open bugs with "Bug" label
- Categorize by severity: Blocker, Critical, Major, Minor
- Note any bugs linked to the feature being released (if specified)
- For each blocker/critical: check if a fix PR exists and its status

## 3. Check Open Testing Tickets
- Use `mcp__linear__list_issues` to find tickets in Testing/QA status that are still open
- These represent testing work that hasn't been completed yet
- Flag any that are blockers for the release

## 4. Check Open PRs Expected in Release
- `mcp__github__list_pull_requests` to find open PRs in `cottage-nextjs`
- Identify PRs that are:
  - Approved but not merged — should they be in this release?
  - Linked to release-related Linear tickets — are they blocking?
  - Failing CI — will they introduce regressions if merged last-minute?
- Flag any PRs that are expected to be in the release but haven't merged yet

## 5. Check Feature Flags and Database State
- `mcp__supabase__execute_sql` to check feature flag states relevant to the release:
  - Are new feature flags set correctly for the target environment (dev/staging/production)?
  - Are flags that should be off in production actually off?
  - Are flags that should be on actually on?
- `mcp__supabase__execute_sql` to check for pending or recent migrations:
  - Were all expected migrations applied?
  - Any migration that needs to run before the release?
- Note any data state that could affect the release (e.g., test data in production, stale caches)

## 6. Assess Test Coverage
- Use `Glob` to scan `tests/e2e_tests/` and count specs per feature area
- If the user specifies a feature being released, check whether that feature has automated test coverage
- Note any feature areas with zero or minimal coverage
- Cross-reference with test plans in `tests/test_plans/` to check if planned tests have been implemented

## 7. Generate Report

```
# Release Readiness Report — [date]

## CI Status
| Scope | Last Run | Status | Age | Notes |
|-------|----------|--------|-----|-------|
| Smoke | [time] | Pass/Fail | [hours ago] | [stale?] |
| Regression1-7 | [time] | Pass/Fail | [hours ago] | [stale?] |

**CI Verdict**: [All green / X scopes failing / Stale results — re-run needed]

## Open Bugs
| Severity | Count | Key Issues | Fix PR Status |
|----------|-------|------------|---------------|
| Blocker | [N] | [issue titles + IDs] | [merged/open/none] |
| Critical | [N] | [issue titles + IDs] | [merged/open/none] |
| Major | [N] | [issue titles + IDs] | — |
| Minor | [N] | [issue titles + IDs] | — |

**Bug Verdict**: [No blockers / X blockers need resolution]

## Open PRs
| PR | Title | Status | CI | Linked Ticket |
|----|-------|--------|-------|---------------|
| #[N] | [title] | [approved/changes requested] | [pass/fail] | [ticket ID] |

**PR Verdict**: [All expected PRs merged / X PRs still open]

## Feature Flags
| Flag | Expected State | Actual State | Status |
|------|---------------|--------------|--------|
| [flag_name] | ON | ON | OK |
| [flag_name] | OFF (production) | ON | MISMATCH |

**Flag Verdict**: [All correct / X flags need adjustment]

## Incomplete Testing
- [ ] [Ticket ID] — [description] — [status]

**Testing Verdict**: [All testing complete / X items outstanding]

## Coverage Gaps
- [Feature area with low/no automation]

## Recommendation
**GO / NO-GO / CONDITIONAL**

Reasoning:
- [bullet points explaining the recommendation]

Conditions (if conditional):
- [ ] [What must be resolved before release]
```

## 8. Recommendation Logic
- **GO** — All scopes green, no blocker bugs, all expected PRs merged, feature flags correct, testing complete
- **NO-GO** — Any blocker bugs open, Smoke failing, critical regression failures, feature flags misconfigured, expected PRs not merged
- **CONDITIONAL** — Minor failures in non-critical scopes, non-blocker bugs with known workarounds, or stale CI results that need a re-run. List conditions that must be met.

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| **GitHub MCP** or `Bash` (`gh` CLI) | CI run status, open PRs for the release |
| **Linear MCP** | `list_issues`, `search_issues` — open bugs, testing tickets, fix PR status |
| **Supabase MCP** | `execute_sql` — feature flag states, migration status, data checks |
| `Glob` | Test coverage scan, cross-reference with test plans |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
