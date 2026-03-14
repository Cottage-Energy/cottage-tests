---
name: test-plan
description: Generate a structured test plan from a ticket, PR, or feature description
user-invokable: true
---

# Generate a Test Plan

Create a comprehensive test plan from a Linear ticket, GitHub PR, feature description, or any combination of sources.

## 1. Gather Context
Accept any combination of inputs — a Linear ticket is NOT required. Route by what the user provides:

### Notion Link
- Use `WebFetch` to fetch the Notion page content (interim until Notion MCP auth is complete)
- Parse the page for requirements, acceptance criteria, and flow descriptions
- Extract any **mermaid flowchart** blocks — see Step 1b for interpretation

### Figma Link
- Extract `fileKey` and `nodeId` from the URL (convert `-` to `:` in nodeId)
- Call `mcp__figma__get_design_context` to get component structure, code hints, and annotations
- Call `mcp__figma__get_screenshot` for visual reference
- Extract from the design context:
  - UI components and their states (enabled/disabled, visible/hidden, loading)
  - Form fields, inputs, and validation requirements
  - Navigation flows between screens
  - Edge states visible in design (empty states, error states)
- Map design elements to test interactions and assertions

### GitHub PR Link
- Use `mcp__github__get_pull_request` and `mcp__github__get_pull_request_files` to read the diff
- Identify UI changes, API changes, DB changes, business logic changes

### Linear Ticket (optional)
- Use `mcp__linear__get_issue` for requirements, labels, linked issues
- **Check ticket comments**: Use `mcp__linear__list_comments` to read all comments on the ticket — comments often contain linked tickets, Figma URLs, Notion links, PR references, and contextual decisions not captured in the description
- **Follow linked tickets**: For each linked/related ticket mentioned in comments or the description, use `mcp__linear__get_issue` to pull its context too. Related tickets often contain acceptance criteria, edge cases, and technical details that expand the test scope significantly.
- Follow any links to Notion docs, Figma screens, or PRs from the ticket

### Conversation Context
- User-provided details, pasted content, or verbal descriptions

### Database Context (when DB changes are mentioned)
- Use `mcp__supabase__list_tables` to understand current schema
- Use `mcp__supabase__execute_sql` to inspect table structures, column types, constraints, and existing data relevant to the feature
- Identify: new tables/columns, changed constraints, migration impacts, data that test assertions should verify

### Live App State (quick UI peek)
When planning tests for an existing feature or flow, peek at the live app to ground your test cases in reality:
- `mcp__playwright__browser_navigate` to the page or flow being tested
- `mcp__playwright__browser_snapshot` to see current UI elements, form fields, buttons, and component states
- `mcp__playwright__browser_take_screenshot` to capture the current state for reference
- This prevents writing test cases for UI elements that don't exist or have different names/labels than expected
- Especially useful when Figma designs are outdated or when testing an existing feature with no design link

### Existing Test Coverage
- Search `tests/e2e_tests/` with Glob/Grep for related tests already in the repo

## 1b. Interpret Mermaid Flowcharts
When mermaid flowchart blocks are found in Notion content or pasted by the user:
- **Happy path flows** — main paths through the flowchart become primary test cases
- **Decision branches** — conditions that create alternate paths become edge case / conditional tests
- **Terminal states** — end nodes become expected results for assertions
- **Error/failure paths** — paths leading to error states become negative test cases
- Map each distinct path through the flowchart to one or more test cases in the plan

## 2. Quick Triage Summary
Before writing detailed test cases, present a triage summary so the user can confirm scope:

```
## Triage: [Feature/Ticket Name]

### Summary
Brief description of what's being tested and why.

### Test Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Linked Resources
- Source: [Notion / Figma / PR / Linear — with links]
- Related files/components changed

### Regression Risk
- [Existing features that may be affected]
```

After presenting the triage, ask: **"Want me to continue to a full test plan?"**
- If yes → proceed to Step 3
- If no → stop here (the triage summary is the deliverable)

## 3. Identify Test Scope
From the gathered context, define:
- **In scope**: What this test plan covers
- **Out of scope**: What's explicitly excluded
- **Prerequisites**: Test data, environment setup, feature flags
- **Dependencies**: Other features or services involved

## 4. Write Test Cases
For each scenario, define:
- **Test case ID** — e.g., TC-001
- **Title** — concise description
- **Preconditions** — required state before test
- **Steps** — numbered actions
- **Expected result** — what should happen
- **Priority** — P0 (blocker), P1 (critical), P2 (normal), P3 (low)
- **Type** — Smoke, Regression, Edge Case, Exploratory

## 5. Test Plan Template

```markdown
# Test Plan: [Feature/Ticket Name]

## Overview
**Ticket**: [Linear ID or "N/A"]
**Source**: [Notion doc link / Figma link / PR link — list all inputs used]
**Date**: [date]
**Tester**: Christian

## Scope
### In Scope
- [Feature/flow 1]
- [Feature/flow 2]

### Out of Scope
- [Explicitly excluded items]

### Prerequisites
- [Required test data]
- [Environment/feature flag setup]

## Test Cases

### Happy Path
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-001 | [title] | 1. ... 2. ... | [expected] | P0 | Yes |
| TC-002 | [title] | 1. ... 2. ... | [expected] | P1 | Yes |

### Edge Cases
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-010 | [title] | 1. ... 2. ... | [expected] | P2 | No |

### Negative Tests
| ID | Title | Steps | Expected Result | Priority | Automate? |
|----|-------|-------|-----------------|----------|-----------|
| TC-020 | [title] | 1. ... 2. ... | [expected] | P2 | Yes |

### Database Verification
| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-030 | [title] | [what to check in Supabase] | [expected] | P1 |

## Automation Plan
- **Smoke**: [which test cases to include in smoke suite]
- **Regression**: [which regression scope to assign]
- **Exploratory only**: [which cases stay manual]

## Risks & Notes
- [Known risks or blockers]
- [Dependencies on other teams]
```

## 6. Saving the Test Plan
- Save to `tests/test_plans/` directory
- Naming: `{TICKET_ID}_{feature_name}.md` when a Linear ticket exists, or `{feature_name}.md` when there is no ticket
- If Notion MCP is available: offer to also create it in the Notion testing workspace

### Comment Back to Linear Ticket
When a Linear ticket was used as input (i.e., an `issueId` is available from Step 1):
- Use `mcp__linear__save_comment` to post the test plan back to the ticket
- Pass the `issueId` from the ticket and format the `body` as Markdown:

```markdown
## Test Plan: [Feature Name]

**File**: `tests/test_plans/{filename}.md`
**Date**: [date]
**Tester**: Christian

### Summary
[1-2 sentence summary of what the test plan covers]

### Test Cases ([total count])
- **Happy Path**: [count] cases ([P0/P1 breakdown])
- **Edge Cases**: [count] cases
- **Negative Tests**: [count] cases
- **DB Verification**: [count] cases

### Automation Plan
- **Smoke**: [cases targeted for smoke]
- **Regression**: [cases targeted for regression]
- **Exploratory only**: [cases staying manual]

### Risks
- [Key risks or blockers, if any]

---
*Generated by QA automation — full test plan saved to cottage-tests repo*
```

- Post a **summary**, not the full test plan — Linear comments should be scannable
- Include the file path so team members can find the full plan in the repo
- If the ticket has no linked test plan yet, this makes the QA coverage visible to the whole team

## 7. Next Steps
After the test plan is approved:
- `/new-test` to scaffold automated test cases (will reference this plan)
- `/exploratory-test` to interactively investigate items marked "Exploratory only"
- `/log-bug` if issues are found during analysis
- `/run-tests` to execute tests after they're created

---

## 8. Tools Used

| Tool | Purpose |
|------|---------|
| **Linear MCP** | `get_issue` — pull ticket requirements and linked resources; `list_comments` — read ticket comments for linked tickets, Figma/Notion URLs, and contextual decisions; `save_comment` — post test plan summary back to ticket |
| **GitHub MCP** | `get_pull_request`, `get_pull_request_files` — read PR diffs for code-driven planning |
| **Figma MCP** | `get_design_context`, `get_screenshot` — extract UI components and design expectations |
| **Supabase MCP** | `list_tables`, `execute_sql` — inspect schema, constraints, and data context for DB-related test cases |
| **Playwright MCP** | `browser_navigate`, `browser_snapshot`, `browser_take_screenshot` — peek at live app to ground test cases in reality |
| `WebFetch` | Fetch Notion page content (interim until Notion MCP auth) |
| `Glob`, `Grep` | Find existing test coverage in the repo |
| `Write` | Save the test plan to `tests/test_plans/` |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-13 (ENG-2402 Connect Account)
- **Missed ticket comments and linked tickets**: The original test plan was built from the main ticket description + PR diff only. The user had to explicitly ask to check linked tickets (ENG-2365, ENG-2363, ENG-2370, ENG-2371, ENG-2372) which contained critical ACs that expanded the test plan from ~85 to 108 cases. Added `mcp__linear__list_comments` step and explicit "follow linked tickets" instruction to Step 1.
- **Database context was essential**: Understanding `isConnectReady`, `isConnectAccount`, `cottageConnectUserType`, and account status fields was critical for writing accurate test preconditions. The DB context step worked well once we queried `information_schema.columns` first.
