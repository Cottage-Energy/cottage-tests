---
name: log-bug
description: Create a structured bug report in Linear from test findings
user-invokable: true
---

# Log a Bug in Linear

When a bug is found during testing (exploratory, automated, or manual), create a well-structured bug report with evidence.

---

## 1. Gather Bug Details

### From conversation or preceding skill
If chaining from `/exploratory-test` or `/analyze-failure`, carry forward:
- Steps to reproduce (already captured during the session)
- Screenshots (already taken via Playwright MCP)
- Database state (already queried via Supabase MCP)
- Console/network errors (already captured)

### From user description
Ask for or extract from context:
- **What happened** — the observed behavior
- **What was expected** — the correct behavior
- **Steps to reproduce** — exact sequence of actions
- **Environment** — browser, device, URL, test data used

---

## 2. Capture Evidence (if not already captured)

### Screenshots via Playwright MCP
If the bug is reproducible and no screenshots exist yet:
- `mcp__playwright__browser_navigate` to the page where the bug occurs
- Walk through reproduction steps using `browser_click`, `browser_fill_form`, etc.
- `mcp__playwright__browser_take_screenshot` at the point of failure
- `mcp__playwright__browser_snapshot` to capture the accessibility tree (useful for locator-related bugs)

### Database state via Supabase MCP
If the bug involves data:
- `mcp__supabase__execute_sql` to capture the current state of relevant records
- Show: what the data looks like vs what it should look like
- Include: table name, relevant columns, actual values

### Console/network errors via Playwright MCP
If the bug involves errors:
- `mcp__playwright__browser_console_messages` for JS errors
- `mcp__playwright__browser_network_requests` for failed API calls, error responses

---

## 3. Identify Suspected Cause

### Check recent PRs
- `mcp__github__list_pull_requests` for recently merged PRs in `cottage-nextjs`
- `mcp__github__get_pull_request_files` on suspicious PRs
- If a recent PR likely introduced the bug, note it in the report as "Suspected cause: PR #X"

### Check recent commits
- `mcp__github__list_commits` to find changes in the affected feature area
- Correlate: when did this behavior start? What changed around that time?

---

## 4. Classify Severity

Use this framework to set severity consistently:

| Severity | Definition | Examples |
|----------|-----------|----------|
| **Blocker** | Prevents a core flow from completing. No workaround. | Can't submit move-in form. Payment fails for all users. Login broken. |
| **Critical** | Core flow works but produces wrong results. Data corruption risk. | Wrong amount charged. User data saved to wrong account. Enrollment created with wrong status. |
| **Major** | Feature broken but core flow has a workaround. Affects subset of users. | Modal doesn't close via Esc key (can use X button). Feature broken on Safari only. Edge case causes error. |
| **Minor** | Cosmetic, UX annoyance, or edge case with easy workaround. | Button misaligned. Typo in label. Tooltip doesn't show on hover. |

---

## 5. Check for Duplicates

- `mcp__linear__search_issues` to search for similar bugs using keywords from the bug title and affected feature
- If a duplicate exists → suggest commenting on the existing issue with new evidence instead of creating a new one
- If a related (but different) bug exists → note it as "Related: BUG-XXX"

---

## 6. Format the Bug Report

Structure the Linear issue with this template:

```
Title: [BUG] <concise description of the bug>

## Description
<Brief summary — one or two sentences>

## Steps to Reproduce
1. Navigate to [URL]
2. [Action]
3. [Action]
4. Observe: [what's wrong]

## Expected Result
<What should happen>

## Actual Result
<What actually happens>

## Evidence
- Screenshot: [attached or described]
- Database state: [relevant query results]
- Console errors: [if any]
- Network errors: [if any]

## Environment
- Browser: <Chromium/Firefox/Safari/Mobile Chrome/Mobile Safari>
- Environment: <dev/staging/production>
- URL: <exact URL where bug occurs>
- Test data: <user email, account, or other identifying info>

## Suspected Cause
- PR #[number]: [title] — [brief explanation of why]
- Or: Unknown — needs investigation

## Related
- Testing ticket: [Linear ticket ID if testing a specific ticket]
- Test file: [path to automated test if it caught this]
- Related bugs: [BUG-XXX if similar issues exist]

## Severity
<Blocker/Critical/Major/Minor> — <brief justification>
```

---

## 7. Create the Issue

- `mcp__linear__save_issue` to create the bug in Linear
- Set fields:
  - **Title**: `[BUG] concise description`
  - **Labels**: "Bug" + severity label if your team uses them
  - **Priority**: map from severity (Blocker→Urgent, Critical→High, Major→Medium, Minor→Low)
  - **Link to parent ticket**: if the bug was found while testing a specific ticket
  - **Assignee**: assign to the appropriate team or developer (if known from suspected PR)

---

## 8. After Logging

- Share the created issue link/ID with the user
- If the bug is reproducible with automation → suggest `/new-test` to create a regression test
- If the bug came from an exploratory session → suggest `/exploratory-test` to create a scripted reproduction
- If the bug blocks existing tests → link the bug to the failing test for tracking

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| **Linear MCP** | `save_issue` — create the bug report; `search_issues` — check for duplicates |
| **Playwright MCP** | `browser_navigate`, `browser_click`, `browser_take_screenshot`, `browser_snapshot`, `browser_console_messages`, `browser_network_requests` — capture evidence |
| **Supabase MCP** | `execute_sql` — capture database state as evidence |
| **GitHub MCP** | `list_pull_requests`, `get_pull_request_files`, `list_commits` — identify suspected cause |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.
