---
name: qa-summary
description: Generate a weekly/sprint QA summary — tickets tested, bugs filed, improvements suggested, CI trends
user-invocable: true
---

# QA Summary Report

Aggregate QA activity across Linear, GitHub, CI, and test plans into a team-visible summary.

## 1. Gather Data

### Linear — Tickets & Bugs
- `mcp__linear__list_issues` with `query` for tickets in Testing/QA status (or recently completed by QA)
- `mcp__linear__list_issues` with `query` for `[BUG]` and `[IMPROVEMENT]` tickets created in the period
- For each: ID, title, status, severity/impact, assignee

### GitHub — CI & PRs
- `gh run list --workflow=main-workflow.yml --limit 20` to get CI runs in the period
- Calculate: total runs, pass rate, average duration
- `gh pr list --repo Cottage-Energy/cottage-tests --state merged --limit 10` for test repo activity
- Count: new tests added, tests fixed, tests deleted

### Test Plans
- `Glob` for `tests/test_plans/*.md` modified in the period
- Count: plans created, total test cases across plans

### Test Coverage Delta
- `Glob` for `tests/e2e_tests/**/*.spec.ts` — count total specs and tests
- Compare against previous count if available (from memory or git log)

## 2. Output Format

```
## QA Summary — [start date] to [end date]

### Highlights
- [1-3 bullet points — most important items from the week]

### Tickets Tested
| Ticket | Title | Status | Result | Notes |
|--------|-------|--------|--------|-------|
| ENG-XXXX | [title] | Done | [X/Y ACs pass] | [brief note] |

### Bugs Filed
| Bug | Title | Severity | Status | Found During |
|-----|-------|----------|--------|-------------|
| ENG-XXXX | [BUG] title | [severity] | [status] | [which ticket/session] |

### Improvements Suggested
| Ticket | Title | Impact | Status | Area |
|--------|-------|--------|--------|------|
| ENG-XXXX | [IMPROVEMENT] title | [High/Med/Low] | [status] | [feature area] |

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

## 3. Distribution
- Post to Linear as a comment on a tracking ticket (if one exists) or as a standalone document
- Or share directly with the user for manual distribution

---

## Tools Used

| Tool | Purpose |
|------|---------|
| **Linear MCP** | `list_issues` — pull tickets tested, bugs filed, improvements suggested |
| **GitHub MCP** or `Bash` (`gh` CLI) | CI run history, PR activity, test repo commits |
| `Glob`, `Grep` | Count test specs, test plans, coverage delta |

---

## Retrospective
After completing this skill, check: did any step not match reality? Update this SKILL.md with what you learned.
