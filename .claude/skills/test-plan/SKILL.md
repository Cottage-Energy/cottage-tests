---
name: test-plan
description: Generate a structured test plan from a ticket, PR, or feature description
user-invocable: true
---

# Generate a Test Plan

Create a comprehensive test plan from a Linear ticket, GitHub PR, feature description, or any combination of sources.

## 1. Gather Context
Collect information from all available sources:
- **Linear ticket** — use `mcp__linear__get_issue` for requirements
- **GitHub PR** — use GitHub MCP tools for code changes
- **Notion docs** — note links or fetch if MCP is authenticated
- **Figma screens** — note links for UI reference
- **Conversation context** — user-provided details
- **Existing tests** — search `tests/e2e_tests/` for related coverage

## 2. Identify Test Scope
From the gathered context, define:
- **In scope**: What this test plan covers
- **Out of scope**: What's explicitly excluded
- **Prerequisites**: Test data, environment setup, feature flags
- **Dependencies**: Other features or services involved

## 3. Write Test Cases
For each scenario, define:
- **Test case ID** — e.g., TC-001
- **Title** — concise description
- **Preconditions** — required state before test
- **Steps** — numbered actions
- **Expected result** — what should happen
- **Priority** — P0 (blocker), P1 (critical), P2 (normal), P3 (low)
- **Type** — Smoke, Regression, Edge Case, Exploratory

## 4. Test Plan Template

```markdown
# Test Plan: [Feature/Ticket Name]

## Overview
**Ticket**: [Linear ID]
**PR**: [GitHub PR link]
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

## 5. Saving the Test Plan
- Ask the user where to save: as a local markdown file in the repo, or just display it
- If saving locally: place in `tests/test_plans/` directory
- If Notion MCP is available: offer to create it in the Notion testing workspace

## 6. Next Steps
After the test plan is approved:
- Use `/new-test` to scaffold automated test cases
- Use `/exploratory-test` for manual investigation items
- Use `/triage-ticket` if more tickets need analysis
