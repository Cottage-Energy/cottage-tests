---
name: triage-ticket
description: Read a Linear ticket, extract test requirements, and outline what needs testing
user-invocable: true
---

# Triage a Linear Ticket

When the user provides a Linear ticket (ID, URL, or description), analyze it and extract testing requirements.

## 1. Fetch the Ticket
- Use the Linear MCP tools (`mcp__linear__get_issue`) to read the ticket
- Extract: title, description, labels, assignee, linked issues, attachments
- Note any links to Notion docs, Figma screens, or GitHub PRs

## 2. Follow Linked Resources
- **GitHub PRs**: Use GitHub MCP tools to read the PR diff and understand code changes
- **Notion links**: Note them for the user (if Notion MCP is authenticated, fetch the content)
- **Figma links**: Note them for the user (if Figma MCP is configured, fetch screen details)
- **Database changes**: If the ticket has database-related labels, note which tables/columns may be affected

## 3. Extract Test Requirements
From the gathered context, identify:
- **Feature under test**: What functionality is being added/changed
- **Happy path scenarios**: The main expected flows
- **Edge cases**: Boundary conditions, error states, empty states
- **Database impacts**: Any data changes to verify via Supabase
- **UI changes**: New screens/components from Figma or PR diff
- **Regression risks**: What existing functionality could break

## 4. Output Format
Present a structured summary:

```
## Ticket: [TITLE] ([ID])

### Summary
Brief description of what the ticket is about.

### Test Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Linked Resources
- PR: [link] — changes to [files/components]
- Notion: [link] — feature documentation
- Figma: [link] — UI screens

### Suggested Test Approach
- Exploratory: [what to investigate manually]
- Automated: [what to script as e2e tests]
- Database: [what to verify in Supabase]

### Regression Risk
- [Existing features that may be affected]
```

## 5. Next Steps
After triaging, the user can:
- Use `/test-plan` to generate a detailed test plan
- Use `/new-test` to scaffold automated tests
- Use `/exploratory-test` to investigate edge cases
- Use `/log-bug` if issues are found during exploratory testing
