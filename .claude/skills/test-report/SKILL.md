---
name: test-report
description: QA summary, release readiness, or custom report — weekly recap, go/no-go verdict, or targeted analysis. Optional .md export.
user-invocable: true
---

# Test Report

Generate QA reports in different modes depending on context. Optionally save as a `.md` file.

## Mode Detection

| User says | Mode |
|-----------|------|
| "weekly summary", "sprint summary", "what did we test" | **Summary** |
| "release ready", "go/no-go", "can we ship" | **Release** |
| "report on [feature/ticket]", "status of [area]" | **Targeted** |

If unclear, ask the user which mode they want.

---

## Summary Mode (weekly/sprint)

Aggregate QA activity across Linear, GitHub, CI, and test plans into a team-visible summary.

### 1. Gather Data

**Linear — Tickets & Bugs:**
- `mcp__linear__list_issues` with `query` for tickets in Testing/QA status (or recently completed by QA)
- `mcp__linear__list_issues` with `query` for `[BUG]` and `[IMPROVEMENT]` tickets created in the period
- For each: ID, title, status, severity/impact, assignee

**GitHub — CI & PRs:**
- `gh run list --workflow=main-workflow.yml --limit 20` to get CI runs in the period
- Calculate: total runs, pass rate, average duration
- `gh pr list --repo Cottage-Energy/cottage-tests --state merged --limit 10` for test repo activity
- Count: new tests added, tests fixed, tests deleted

**Test Plans:**
- `Glob` for `tests/test_plans/*.md` modified in the period
- Count: plans created, total test cases across plans

**Test Coverage Delta:**
- `Glob` for `tests/e2e_tests/**/*.spec.ts` — count total specs and tests
- Compare against previous count if available (from memory or git log)

### 2. Summary Output

```
## QA Summary — [start date] to [end date]

### Highlights
- [1-3 bullet points — most important items from the week]

### Tickets Tested
| Ticket | Title | Status | Result | Notes |
|--------|-------|--------|--------|-------|
| ENG-XXXX | [title] | Done | [X/Y ACs pass] | [brief note] |

### Bugs Filed
| Bug | Title | Severity | User Impact | Status | Found During |
|-----|-------|----------|-------------|--------|-------------|
| ENG-XXXX | [BUG] title | [severity] | [what the user experiences] | [status] | [which ticket/session] |

### Improvements Suggested
| Ticket | Title | User Impact | Impact | Status | Area |
|--------|-------|-------------|--------|--------|------|
| ENG-XXXX | [IMPROVEMENT] title | [user friction/confusion] | [High/Med/Low] | [status] | [feature area] |

### CI Health
- Pass rate: [X]% ([Y] passed / [Z] total runs)
- Flaky tests: [count] (fail rate 20-80%)
- Persistent failures: [count]
- Average run duration: [time]

### Test Coverage
- Total specs: [count] (+/- delta from last period)
- Total test cases: [count]
- New tests added: [count]
- Test plans created: [count] ([total test cases] cases)

### Blockers & Risks
- [Any open blockers, environment issues, or testing gaps]

### Next Week Focus
- [Upcoming tickets, planned automation, areas to investigate]
```

---

## Release Mode (go/no-go)

Aggregate CI results, open bugs, open PRs, feature flag states, and blockers into a go/no-go recommendation.

### 1. Check CI Status
- `gh run list --workflow=main-workflow.yml --limit 10` to get latest runs
- Identify the most recent run for each scope (Smoke, Regression1-7)
- Flag any scope not run in last 24h as **stale**, 48h+ as **very stale — re-run required**

### 2. Check Open Bugs in Linear
- `mcp__linear__list_issues` for open bugs
- Categorize by severity: Blocker, Critical, Major, Minor
- For each blocker/critical: check if a fix PR exists and its status

### 3. Check Open Testing Tickets
- `mcp__linear__list_issues` for tickets in Testing/QA status still open
- Flag any that are blockers for the release

### 4. Check Open PRs Expected in Release
- `mcp__github__list_pull_requests` for open PRs in `cottage-nextjs`
- Identify: approved but not merged, linked to release tickets, failing CI
- Flag PRs expected in the release but not merged yet

### 5. Check Feature Flags and Database State
- `mcp__supabase__execute_sql` to check feature flag states:
  - New feature flags set correctly for target environment?
  - Flags that should be off in production actually off?
- `mcp__supabase__execute_sql` for pending/recent migrations
- Note any data state that could affect the release

### 6. Assess Test Coverage
- `Glob` to scan `tests/e2e_tests/` and count specs per feature area
- If user specifies a feature, check whether it has automated coverage
- Cross-reference with `tests/test_plans/` for planned vs implemented tests

### 7. Release Output

```
# Release Readiness Report — [date]

## CI Status
| Scope | Last Run | Status | Age | Notes |
|-------|----------|--------|-----|-------|
| Smoke | [time] | Pass/Fail | [hours ago] | [stale?] |
| Regression1-7 | [time] | Pass/Fail | [hours ago] | [stale?] |

**CI Verdict**: [All green / X scopes failing / Stale results — re-run needed]

## Open Bugs
| Severity | Count | Key Issues | User Impact | Fix PR Status |
|----------|-------|------------|-------------|---------------|
| Blocker | [N] | [issue titles + IDs] | [what users experience] | [merged/open/none] |
| Critical | [N] | [issue titles + IDs] | [what users experience] | [merged/open/none] |
| Major | [N] | [issue titles + IDs] | — | — |
| Minor | [N] | [issue titles + IDs] | — | — |

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

### Recommendation Logic
- **GO** — All scopes green, no blocker bugs, all expected PRs merged, feature flags correct, testing complete
- **NO-GO** — Any blocker bugs open, Smoke failing, critical regression failures, feature flags misconfigured, expected PRs not merged
- **CONDITIONAL** — Minor failures in non-critical scopes, non-blocker bugs with known workarounds, stale CI results needing re-run. List conditions.

---

## Targeted Mode (feature/ticket-specific)

When the user asks about a specific feature area or ticket:
1. Pull Linear tickets for that area
2. Check CI results for tests in that feature folder
3. Check test coverage for that area
4. Produce a focused mini-report with the relevant sections from Summary or Release mode

---

## Optional: Save as .md File

If the user asks to "save it", "export", "create a file", or "write the report":
- Save to `tests/test_reports/[type]_[date].md` (e.g., `tests/test_reports/summary_2026-04-12.md`, `tests/test_reports/release_2026-04-12.md`)
- Create the `tests/test_reports/` directory if it doesn't exist
- Use the full formatted output from the relevant mode
- Confirm the file path after saving

Do NOT auto-save — only save when the user explicitly asks.

---

## Distribution
- Post to Linear as a comment on a tracking ticket (if one exists) or as a standalone document
- Or share directly with the user for manual distribution

---

## Tools Used

| Tool | Purpose |
|------|---------|
| **Linear MCP** | `list_issues`, `search_issues` — tickets tested, bugs, improvements, open testing work |
| **GitHub MCP** or `Bash` (`gh` CLI) | CI run history, PR activity, test repo commits |
| **Supabase MCP** | `execute_sql` — feature flag states, migration status, data checks (release mode) |
| `Glob`, `Grep` | Count test specs, test plans, coverage delta |

---

## Retrospective
After completing this skill, check: did any step not match reality? Update this SKILL.md with what you learned.
