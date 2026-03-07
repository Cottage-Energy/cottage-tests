---
name: log-bug
description: Create a structured bug report in Linear from test findings
user-invocable: true
---

# Log a Bug in Linear

When the user finds a bug during testing, help them create a well-structured bug report in Linear.

## 1. Gather Bug Details
Ask the user for (or extract from conversation context):
- **What happened** — the observed behavior
- **What was expected** — the correct behavior
- **Steps to reproduce** — exact sequence of actions
- **Environment** — browser, device, URL, test data used
- **Severity** — blocker, critical, major, minor
- **Related ticket** — the Linear ticket being tested (if any)
- **Screenshots/logs** — any evidence from test execution

## 2. Check for Duplicates
- Use `mcp__linear__search_issues` to search for similar bugs before creating a new one
- If a duplicate exists, suggest commenting on the existing issue instead

## 3. Format the Bug Report
Structure the Linear issue with this template:

```
Title: [BUG] <concise description of the bug>

## Description
<Brief summary of the issue>

## Steps to Reproduce
1. Navigate to ...
2. Click on ...
3. Observe ...

## Expected Result
<What should happen>

## Actual Result
<What actually happens>

## Environment
- Browser: <Chromium/Firefox/Safari/Mobile>
- URL: <environment URL>
- Test data: <relevant user/account info>

## Evidence
<Screenshots, logs, test output>

## Related
- Testing ticket: <Linear ticket ID>
- Test file: <path to test if automated>

## Severity
<Blocker/Critical/Major/Minor>
```

## 4. Create the Issue
- Use `mcp__linear__save_issue` to create the bug in Linear
- Set appropriate labels (e.g., "Bug", severity label)
- Link to the parent ticket if applicable
- Assign to the appropriate team

## 5. After Logging
- Share the created issue link with the user
- If the bug is reproducible with automation, suggest using `/exploratory-test` to create a reproduction script
- If a regression test is needed, suggest `/new-test`
