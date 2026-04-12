---
name: test-plan
description: Generate a structured test plan from a ticket, PR, or feature description — includes PR analysis and risk scoring when PR link is found
user-invocable: true
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

### API Spec / Documentation Link
When the source is an API design doc, OpenAPI spec, PDF, or live docs site:
- **Prefer live docs over PDF exports** — PDFs go stale fast. Ask for a docs site URL (Cloudflare Pages, ReadMe, Swagger UI, etc.) if a PDF is provided
- Use `WebFetch` to crawl the docs site — get overview, authentication, each endpoint reference, schemas, pagination, errors, and rate limiting pages
- **Probe the live API before finalizing test cases** — specs drift from implementation. Use `curl` to hit each endpoint and capture actual response shapes. Compare against what docs say.
- For each endpoint, extract: HTTP method, path, path params, query params, request body fields (required vs optional), response schema, error codes
- Categorize planned test cases as: happy path, validation (400), auth (401/403), not found (404), conflict (409), pagination, data format conventions
- **Always note spec-vs-reality discrepancies** — flag as "API bug" (code wrong), "doc bug" (docs wrong), or "improvement" (works but could be better)
- Cross-reference with `tests/api_tests/` for existing API test patterns (e.g., `RegisterApi` helper pattern)

### GitHub PR Link
- Use `mcp__github__get_pull_request` and `mcp__github__get_pull_request_files` to read the diff
- `mcp__github__get_pull_request_status` to check CI status — are tests already failing on this PR?
- **If GitHub MCP returns 404** (common for `services`, `cottage-nextjs`, `pg-admin`), fall back to CLI: `gh pr view <number> --repo Cottage-Energy/<repo> --json title,body,state,files` and `gh pr diff <number> --repo Cottage-Energy/<repo>`
- Identify UI changes, API changes, DB changes, business logic changes
- **When a PR link is found** (provided directly or linked in a Linear ticket) → automatically run Step 1c PR Analysis

### Inngest Function Source (when ticket involves backend/email/async jobs)
When a ticket references the `services` repo or mentions Inngest, email templates, or async processing:
- **Read the function source** via GitHub API: `gh api repos/Cottage-Energy/services/contents/<path> --jq '.content' | base64 -d`
- Identify: trigger mechanism (cron vs event + event name), eligibility criteria (what DB conditions must be met), what data the function uses
- This is critical for writing accurate test preconditions and understanding the testable window
- Cross-reference with `tests/docs/inngest-functions.md` for known event names and patterns

### Linear Project Link (multi-milestone planning)
When the user provides a Linear **project** URL (e.g., `linear.app/public-grid/project/<slug>/overview`):
- Use `mcp__linear__get_project` with the **full slug** from the URL (e.g., `multi-processor-payment-system-54806c1fd524`) — short name alone may not match
- Pass `includeMembers: true`, `includeMilestones: true`, `includeResources: true` to get full context
- Use `mcp__linear__list_issues` with `project: "<Project Name>"` to pull all tickets
- **Large result handling**: Project issue lists can be very large (70+ tickets = 100K+ chars). Parse with `node -e` to group by `projectMilestone.name` — do NOT try to read the raw JSON file directly
- Group tickets by milestone and create a **milestone-phased test plan**:
  - Each milestone gets its own test case section
  - Add a **Ticket → Test Case Mapping** table so test cases can be activated as individual tickets move to development
  - Identify epic/parent tickets vs. task tickets (epics often have no milestone assignment)
- Template adjustments for project-level plans:
  - File naming: `{project_name}.md` (no ticket ID prefix)
  - Overview includes milestone summary table with ticket counts and risk levels
  - "Phased Activation" section in Automation Plan — which tests activate per milestone
  - "Test Infrastructure Changes" section — new POMs, fixtures, types, test data needed
- After saving, offer to save a memory file for the project so future sessions have context when individual tickets arrive

### Linear Ticket (optional)
- Use `mcp__linear__get_issue` for requirements, labels, linked issues
- **Check ticket comments**: Use `mcp__linear__list_comments` to read all comments on the ticket — comments often contain linked tickets, Figma URLs, Notion links, PR references, and contextual decisions not captured in the description
- **Follow linked tickets**: For each linked/related ticket mentioned in comments or the description, use `mcp__linear__get_issue` to pull its context too. Related tickets often contain acceptance criteria, edge cases, and technical details that expand the test scope significantly.
- Follow any links to Notion docs, Figma screens, or PRs from the ticket
- **When the ticket references a flow by name** (e.g., "bill upload", "verify utilities", "move-in"), look it up in `tests/docs/onboarding-flows.md` to confirm the exact URL, entry point, and code path. Similar-sounding flows can be completely different code paths — e.g., Bill Upload and Verify Utilities share a Next.js route group `(bill-upload)` but have separate `page.tsx` files. A PR fixing one may not fix the other.

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

## 1c. PR Analysis (auto-triggers when PR link is found)

When a PR link is found — either provided directly or discovered in a Linear ticket — run this analysis to enrich the test plan with code-level context. Skip if no PR link exists.

### Classify Changes Per File
For each changed file in the PR, classify:

| Category | Examples |
|----------|---------|
| **UI** | New/modified components, pages, forms, modals, changed text/labels/buttons (affects POM locators) |
| **API** | New/modified endpoints, request/response shapes, changed validation, error handling |
| **Database** | Migrations, new tables/columns, changed constraints, queries, feature flags |
| **Business Logic** | Validation rules, calculations, state transitions, permissions, conditional rendering |
| **Configuration** | Env vars, feature flags, third-party integrations, build/deploy config |

### Assess Risk Level

| Level | Criteria |
|-------|----------|
| **High** | Shared UI components (affects multiple pages), DB schema changes, auth/authz changes, navigation/routing changes, move-in or payment flow changes |
| **Medium** | Single feature UI/logic changes, new API endpoints, feature flag gating |
| **Low** | Styling-only, documentation, test-only, dev tooling, CI config |

### Map Test Impact
- `Glob` + `Grep` in `tests/e2e_tests/` for tests covering the changed feature area
- Check `tests/resources/page_objects/` for locators referencing changed elements → list POMs to update
- Check `tests/resources/fixtures/` for queries hitting changed tables → list fixtures to update
- Identify new functionality with no test coverage → feed into test case generation (Step 4)

### Visual Diff (when PR has UI changes and is deployed to dev)
If the PR is merged/deployed and includes UI changes:
1. `mcp__playwright__browser_navigate` to affected page(s) on dev
2. `mcp__playwright__browser_take_screenshot` to capture live state
3. If Figma link available → `mcp__figma__get_screenshot` for design comparison
4. Check: layout, typography, colors, component states, responsive behavior
5. Flag differences as **Bug** (wrong vs design), **Improvement** (could be better), or **Intentional** (PR changed this on purpose)

### PR Analysis Output (included in triage summary)
```
### PR Analysis: #[NUMBER] — [TITLE]
**Repo**: [owner/repo] | **CI**: [passing/failing] | **Risk**: [HIGH/MEDIUM/LOW]

| File | Category | Change |
|------|----------|--------|
| [file] | UI | [what changed] |
| [file] | Database | [what changed] |

**Test Impact**:
- Existing tests to verify: [list]
- POMs to update: [list or "none"]
- Fixtures to update: [list or "none"]
- New tests needed: [fed into Step 4]
```

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

## 3b. Identify UX & Improvement Opportunities
While analyzing the feature context (designs, live app, PRs, ticket), actively note anything that could be improved from a user experience perspective — even if it's working as coded. You're reviewing the feature more thoroughly than most people on the team, so use that perspective.

**Look for:**
- **Flow friction** — unnecessary steps, redundant inputs, state lost on navigation
- **Confusing UI** — ambiguous labels, unclear icons, screens that require re-reading
- **Inconsistency** — same action worded differently across flows, mismatched patterns
- **Missing feedback** — no loading indicator, no success confirmation, unhelpful error messages
- **Accessibility** — missing labels, poor keyboard flow, low contrast
- **Empty/error states** — generic or missing messaging when things go wrong or data is absent
- **Mobile gaps** — touch targets, overflow, content not adapted for small screens

Capture these in the "UX & Improvement Opportunities" section of the test plan. They don't block test planning — they're a valuable byproduct of your analysis.

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

### UX & Improvement Opportunities
| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | [where in the flow] | [what could be better — friction, confusion, inconsistency, missing feedback] | [user impact — drop-off risk, confusion, frustration] | [concrete improvement idea] |
| UX-002 | [where] | [observation] | [impact] | [suggestion] |

> These are not test failures — the feature works as specified. These are opportunities to improve the user experience identified during test planning. File actionable ones as improvement tickets via `/log-bug`.

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

### UX Observations
- [Count] improvement opportunities identified (see full plan for details)

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
- `/create-test` to scaffold automated test cases (will reference this plan)
- `/exploratory-test` to interactively investigate items marked "Exploratory only"
- `/log-bug` if issues are found during analysis
- `/run-tests` to execute tests after they're created

### Documentation Check
After saving the test plan, check if the feature involves a backend flow or Inngest function not yet documented:
- New Inngest event name or function? → Update `tests/docs/inngest-functions.md`
- New onboarding flow variant, email template, or integration pattern? → Create/update a doc in `tests/docs/`
- This keeps the docs folder current as a byproduct of test planning, not as a separate chore

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
| **Exa MCP** | `web_search_exa` — search for testing patterns, edge cases, and domain context; `get_code_context_exa` — find code examples for similar test scenarios; `crawling_exa` — fetch and parse external documentation URLs |
| `Glob`, `Grep` | Find existing test coverage in the repo |
| `Write` | Save the test plan to `tests/test_plans/` |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-26 (Multi-Processor Payment System — Project-level plan)
- **New input type: Linear Project link**. First time planning at the project level (not single ticket). Required `mcp__linear__get_project` + `mcp__linear__list_issues` with project filter. Added "Linear Project Link" section to Step 1.
- **`get_project` needs full URL slug**: Short name (`multi-processor-payment-system`) returned "not found". Full slug from URL (`multi-processor-payment-system-54806c1fd524`) worked.
- **Large issue lists overflow tool output**: 72 tickets = 106K chars, too large to read directly. Must parse with `node -e` and group by `projectMilestone.name` (not `milestone` — that field doesn't exist on project issues).
- **Ticket-to-test-case mapping was essential**: With 72 tickets across 7 milestones, a mapping table (ticket → test case IDs) makes the plan actionable as tickets roll through development one by one.
- **Milestone-phased structure worked well**: Each milestone as its own test case section + a "Phased Activation" plan for when to enable tests. Also added "Test Infrastructure Changes" section for new POMs/fixtures/types needed.
- **Save project context to memory**: Created a memory file so future conversations can pick up individual tickets with full project context.

### Session: 2026-03-13 (ENG-2402 Connect Account)
- **Missed ticket comments and linked tickets**: The original test plan was built from the main ticket description + PR diff only. The user had to explicitly ask to check linked tickets (ENG-2365, ENG-2363, ENG-2370, ENG-2371, ENG-2372) which contained critical ACs that expanded the test plan from ~85 to 108 cases. Added `mcp__linear__list_comments` step and explicit "follow linked tickets" instruction to Step 1.
- **Database context was essential**: Understanding `isConnectReady`, `isConnectAccount`, `cottageConnectUserType`, and account status fields was critical for writing accurate test preconditions. The DB context step worked well once we queried `information_schema.columns` first.
