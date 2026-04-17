---
name: log-bug
description: Create a structured bug report or improvement ticket in Linear from test findings
user-invocable: true
---

# Log a Bug or Improvement in Linear

Create well-structured tickets in Linear from test findings — both for **bugs** (something broken) and **improvements** (something that could be better).

## Ticket Types

| Type | When to use | Title prefix | Priority mapping |
|------|-------------|--------------|-----------------|
| **Bug** | Something is broken — behavior deviates from spec, data is wrong, feature doesn't work | `[BUG]` | Severity-based (Blocker→Urgent, Critical→High, Major→Medium, Minor→Low) |
| **Improvement** | Something works but could be better — UX friction, inconsistency, missing feedback, accessibility gap, flow optimization | `[IMPROVEMENT]` | Impact-based (High user impact→High, Moderate friction→Medium, Nice-to-have→Low) |

Determine the type from context:
- Chaining from `/exploratory-test` Phase 1/2 FAIL result → **Bug**
- Chaining from `/exploratory-test` UX & Improvement Observations → **Improvement**
- Chaining from `/test-plan` UX & Improvement Opportunities → **Improvement**
- User says "this is broken" / "this doesn't work" → **Bug**
- User says "this could be better" / "this is confusing" / "suggest improvement" → **Improvement**
- When unclear → ask the user

---

---

## 1. Gather Details

### For Bugs
#### From conversation or preceding skill
If chaining from `/exploratory-test` or `/analyze-failure`, carry forward:
- Steps to reproduce (already captured during the session)
- Screenshots (already taken via Playwright MCP)
- Database state (already queried via Supabase MCP)
- Console/network errors (already captured)

#### From user description
Ask for or extract from context:
- **What happened** — the observed behavior
- **What was expected** — the correct behavior
- **Steps to reproduce** — exact sequence of actions
- **Environment** — browser, device, URL, test data used

### For Improvements
#### From preceding skill
If chaining from `/exploratory-test` or `/test-plan` UX observations, carry forward:
- Screen/step where the observation was made
- What was observed and why it matters
- Suggested improvement (if already identified)
- Screenshots showing current state

#### From user description
Ask for or extract from context:
- **Where** — which screen, flow, or step
- **What could be better** — the current experience
- **Why it matters** — user impact (confusion, friction, drop-off risk, accessibility)
- **Suggestion** — concrete improvement idea

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

## 2b. Verify Against Figma Design (before filing)

**CRITICAL**: When the bug is an AC-vs-implementation mismatch (the AC says X but the app does Y), check the Figma design BEFORE filing. The design is the source of truth, not the AC text.

- If a Figma link is on the ticket → `mcp__figma__get_design_context` or `mcp__figma__get_screenshot` to check the design
- If Figma MCP returns access errors (password-protected file) → ask the user for a manual screenshot
- If the **design matches the implementation** → the AC text is wrong. Flag as an AC/design discrepancy in a comment, NOT as a bug.
- Only file a bug when the implementation deviates from **both** the AC and the design.

This step prevents false-positive bugs that waste developer time and create noise.

---

## 3. Identify Suspected Cause

### Check recent PRs
- `mcp__github__list_pull_requests` for recently merged PRs in the **affected repo** (not just `cottage-nextjs` — could be `pg-admin`, `services`, etc.)
- `mcp__github__get_pull_request_files` on suspicious PRs
- If a recent PR likely introduced the bug, note it in the report as "Suspected cause: PR #X"
- **GitHub MCP 404 workaround**: If `mcp__github__list_pull_requests` returns "Not Found" for a repo, fall back to CLI: `gh pr list --repo Cottage-Energy/<repo> --state merged --limit 10 --json number,title,mergedAt,author`

### Check recent commits
- `mcp__github__list_commits` to find changes in the affected feature area
- Correlate: when did this behavior start? What changed around that time?

---

## 4. Classify Severity / Impact

### For Bugs — Severity Framework
| Severity | Definition | Examples |
|----------|-----------|----------|
| **Blocker** | Prevents a core flow from completing. No workaround. | Can't submit move-in form. Payment fails for all users. Login broken. |
| **Critical** | Core flow works but produces wrong results. Data corruption risk. | Wrong amount charged. User data saved to wrong account. Enrollment created with wrong status. |
| **Major** | Feature broken but core flow has a workaround. Affects subset of users. | Modal doesn't close via Esc key (can use X button). Feature broken on Safari only. Edge case causes error. |
| **Minor** | Cosmetic, UX annoyance, or edge case with easy workaround. | Button misaligned. Typo in label. Tooltip doesn't show on hover. |

### For Improvements — Impact Framework
| Impact | Definition | Examples |
|--------|-----------|----------|
| **High** | Affects a core flow. Likely causes user confusion, drop-off, or support tickets. Wide reach. | Onboarding step with no loading indicator — users double-click and create duplicates. Confusing label causes wrong selection on payment form. |
| **Medium** | Noticeable friction in a common flow. Users can complete the task but the experience is suboptimal. | Form doesn't remember state after back navigation. Inconsistent button labels across similar flows. Error message says "something went wrong" with no guidance. |
| **Low** | Nice-to-have polish. Doesn't block or confuse but would improve the experience. | Success toast could be more descriptive. Empty state could suggest an action. Minor spacing inconsistency between mobile and desktop. |

---

## 5. Check for Duplicates

- `mcp__linear__list_issues` with `query` parameter to search for similar bugs using keywords from the bug title and affected feature (note: `search_issues` does not exist — use `list_issues` with `query`)
- If a duplicate exists → suggest commenting on the existing issue with new evidence instead of creating a new one
- If a related (but different) bug exists → note it as "Related: BUG-XXX"

---

## 6. Format the Ticket

Use the appropriate template based on ticket type.

### Bug Report Template

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

## User Impact
<What the user experiences — describe in concrete, non-technical terms. Example: "User gets no indication the creation failed — they may think it succeeded" rather than "409 error is unhandled">

## Severity
<Blocker/Critical/Major/Minor> — <brief justification>
```

### Improvement Ticket Template

```
Title: [IMPROVEMENT] <concise description of the improvement>

## Current Experience
<What the user sees/does today — describe the friction, confusion, or gap>
- URL: <exact URL or flow step>
- Screenshot: [current state]

## Suggested Improvement
<Concrete description of what could be better — be specific and actionable>

## Why This Matters
<User impact — confusion risk, drop-off likelihood, support ticket potential, accessibility concern>
- Who is affected: <all users / specific user type / specific flow>
- How often: <every time / under specific conditions>

## Evidence
- Screenshot: [current state showing the issue]
- Comparison: [Figma design vs live app, if relevant]
- User perspective: [what a first-time user would think/feel]

## Context
- Discovered during: [exploratory session / test planning / PR review — link to ticket if applicable]
- Related flows: [other screens or flows with the same pattern]
- Related tickets: [existing tickets addressing similar areas]

## User Impact
<What the user experiences — describe the friction, confusion, or frustration in concrete terms. Keep it user-centric, not technical>

## Impact
<High/Medium/Low> — <brief justification>
```

---

## 7. Create the Issue

- `mcp__linear__create_issue` to create the ticket in Linear
- Set fields based on ticket type:

### For Bugs
  - **Title**: `[BUG] concise description`
  - **Labels**: "Bug" + severity label if your team uses them
  - **Priority**: map from severity (Blocker→Urgent, Critical→High, Major→Medium, Minor→Low)
  - **Link to parent ticket**: if the bug was found while testing a specific ticket
  - **Assignee**: assign to the appropriate team or developer (if known from suspected PR)

### For Improvements
  - **Title**: `[IMPROVEMENT] concise description`
  - **Labels**: "Improvement" (or "Enhancement" — match your team's label convention)
  - **Priority**: map from impact (High→High, Medium→Medium, Low→Low)
  - **Link to parent ticket**: if found while testing a specific ticket
  - **Assignee**: leave unassigned or assign to product/design for triage — improvements are suggestions, not assignments

---

## 8. After Logging

- Share the created issue link/ID with the user

### For Bugs
- If the bug is reproducible with automation → suggest `/create-test` to create a regression test
- If the bug came from an exploratory session → suggest `/exploratory-test` to create a scripted reproduction
- If the bug blocks existing tests → link the bug to the failing test for tracking

### For Improvements
- If there are more UX observations from the same session → offer to batch-file them
- If the improvement affects an existing test plan → update the plan's UX section with the ticket ID
- If the improvement is high-impact → suggest discussing with product/design before the next sprint

---

## 9. Tools Used

| Tool | Purpose |
|------|---------|
| **Linear MCP** | `save_issue` — create the bug report; `list_issues` (with `query` param) — check for duplicates |
| **Playwright MCP** | `browser_navigate`, `browser_click`, `browser_take_screenshot`, `browser_snapshot`, `browser_console_messages`, `browser_network_requests` — capture evidence |
| **Supabase MCP** | `execute_sql` — capture database state as evidence |
| **GitHub MCP** | `list_pull_requests`, `get_pull_request_files`, `list_commits` — identify suspected cause |
| **gh CLI** (fallback) | `gh pr list --repo ...` — when GitHub MCP returns 404 for a repo |

---

## 10. Common Blockers & Workarounds

| Blocker | Symptom | Workaround |
|---------|---------|------------|
| GitHub MCP 404 | `mcp__github__list_pull_requests` returns "Not Found" for pg-admin, cottage-nextjs | Use `gh pr list --repo Cottage-Energy/<repo> --state merged --limit 10 --json number,title,mergedAt,author` |
| Linear `search_issues` missing | No `mcp__linear__search_issues` tool exists | Use `mcp__linear__list_issues` with `query` parameter instead |
| Labels not applied | `labels: ["Bug"]` in `save_issue` results in empty labels array | Label name may need exact match or label ID — verify label exists in workspace first |

---

## Retrospective
After completing this skill, check: did any step not match reality? Did a tool not work as expected? Did you discover a better approach? If so, update this SKILL.md with what you learned.

### Session: 2026-03-16 (ENG-2406 Consent Config — Add Row bug)
- **`mcp__linear__search_issues` doesn't exist**: Step 5 referenced it but the actual tool is `mcp__linear__list_issues` with a `query` param. Updated step 5 and tools table.
- **GitHub MCP 404 for pg-admin**: `mcp__github__list_pull_requests` returned "Not Found" for `Cottage-Energy/pg-admin`. Had to fall back to `gh pr list` CLI. Added to step 3 and Common Blockers table.
- **Labels not applied via `save_issue`**: Passed `["Bug"]` but created issue had empty labels. Likely a name mismatch or MCP limitation. Added to Common Blockers.
- **Identify the right repo**: Step 3 previously only mentioned `cottage-nextjs`. PG Admin bugs come from the `pg-admin` repo. Updated to say "affected repo".

### Session: 2026-04-09 (ENG-2627 Revamped Subscriptions — ENG-2672 false positive)
- **Always use real system pipeline data, not manually inserted DB records, when reproducing bugs**: ENG-2672 was filed because subscription cancel didn't void pending `SubscriptionMetadata`. The metadata was manually INSERTed via `INSERT INTO "SubscriptionMetadata"` — missing `transactionID` and other pipeline-set fields. When retested with metadata generated by the real Inngest `transaction-generation-trigger`, cancel correctly set status to `canceled`. Manual inserts can create data that doesn't match production conditions, leading to false-positive bug reports. Before filing a bug involving system-generated data (payments, metadata, bills), always verify using the real pipeline (Inngest events, cron jobs) rather than direct DB inserts.

### Session: 2026-04-17 (ENG-2715 Matrix — T9d/T9e "Critical bugs" reclassified as by-design)
- **Re-read the AC verbatim before escalating a finding as a bug.** During ENG-2715 matrix exploratory, I flagged `?electricCompany=COSERV` + Casper WY waitlist address (T9d) and `?gasCompany=PSEG` + Dallas TX address (T9e) as "Critical bugs" because the override bypassed waitlist and cross-geography validation. But AC3 verbatim reads: "These params force specific utility companies on the user, **bypassing the standard company lookup**" — which includes waitlist + zip-to-utility mapping. Both findings were feature-working-as-specified, not bugs. Had to revise the Linear comment via `commentUpdate` to downgrade and reframe. Added `feedback_reread_AC_before_flagging_bug.md` to memory — rule: paste the AC text next to the observation before filing. Especially important for override/bypass behaviors where the AC explicitly permits skipping a gate. Applies to exploratory-test chain as well.
- **Verify partner/entity names against the DB before citing in tickets.** I used "Mynd" in ENG-2715 comments + ENG-2717 bug description because the user paraphrased Zack's video that actually said "Mindflow". Cap.so's AI summarizer collapsed "Mindflow" to "Mynd" in one spot. A 30-second query against `MoveInPartner` would have confirmed neither "mynd" nor "mindflow" exists. Had to scrub 3 Linear comments + 1 bug description via `commentUpdate`/`issueUpdate`. Added `feedback_verify_partner_name_against_db.md` — rule: when a partner name enters a persistent artifact (ticket, comment, report), verify via `SELECT name FROM "MoveInPartner" WHERE name ILIKE '%<candidate>%'` before committing.
