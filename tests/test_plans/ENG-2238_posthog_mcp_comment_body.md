# PostHog MCP-unblocked investigation — 2026-04-20 follow-up

**Supplements** the consolidated retest comment above. PostHog MCP was installed, authenticated via Bearer key, and reached today — unblocking what was previously "can't disambiguate paused vs broken vs template regression without dashboard access."

## Ruled OUT as root causes (with MCP evidence)

| Hypothesis | Evidence via MCP |
|---|---|
| Workflow paused | `status: "active"` via `workflows-get` |
| Workflow config regressed around 2026-03-12 | Activity log shows **zero edits** between Jan 23 (creation) and April 20 morning |
| Trigger filter drift | Filter exactly matches the two app-emitted trigger events: `user entered welcome encouraged conversion` and `user entered building selecting encouraged conversion`, with person props `abandonedCartEnabled=true`, `moveInType='encouraged-conversion'`, `email is_set`. `filter_test_accounts: false` |
| App not emitting trigger event | HogQL confirms the 4 retest users (`pgtest+ab-cart-real001/002/003`, `pgtest+ab-cart-ts001`) emitted the trigger events at 05:49–06:00 UTC yesterday with correct person_properties |
| Gates skipping our users | First wait: ≤1 min for `hasCompletedMoveIn=true` (not met → proceed). Second branch: `willDoItThemselves=true` (not met → proceed to Email 1). 2 min from trigger to first email; our 5-min wait should have sufficed |
| Email template regression | All 3 Email actions last updated **2026-01-23** — untouched during or after the silence period. HTML bodies present (12.5–15.2k chars), Liquid subject templates present |

## Cannot verify via MCP (personal-API-key limitations)

| Question | Why blocked |
|---|---|
| Is integration 158269 (sender) valid/active/verified? | `integration-get/158269` returns 404; `integrations-list` returns 0. Per PostHog docs: *"When authenticated via personal API key, only GitHub integrations are returned."* |
| Did our 4 retest users actually enroll in the workflow? | Hog-flow invocation records are NOT in the public `events` stream. `hog_flow_metrics` table not exposed via HogQL. Logs ingestion empty (0 services in last 24h) |
| Did the email send attempt, and with what error? | Same as above — CDP function invocation telemetry not reachable via personal API key |
| Did integration 158269 change around 2026-03-12? | `activity-log-list scope=Integration` returns empty results |

## Smoking-gun-shaped signal (inconclusive)

Cian made **7 edits to this workflow today between 00:54 and 07:30 UTC** (2026-04-20) — roughly 6–12 hours after the retest comment landed. Edits touched the workflow body (trigger/filter/wait/branch), NOT the Email actions (those still show Jan 23 updated_at). Strongly suggests someone saw the retest and is actively fixing.

## User Impact if silence is still live

Encouraged-conversion users (shortCodes with `useEncourageConversion=true`) who abandon at welcome do not receive the designed 3-email reminder cadence. Expected impact: reduced conversion on abandoned sessions for the duration the silence has been in effect (Fastmail evidence shows silence from 2026-03-12 through at least 2026-04-20).

## Asks for Cian

1. **What did the 7 edits today fix?** (00:54–07:30 UTC on the workflow `Encouraged Conversion - Abandoned Cart`, id `019be8dc-083f-0000-f520-95706f67db67`)
2. **Is integration 158269 healthy?** (sender referenced by all 3 Email steps — MCP cannot read it under a personal API key)
3. **Could you share a screenshot of the workflow's Invocations / Metrics tab for the last 48h?** That surface would show "enrolled / step reached / email sent / error" per test user and resolve the ambiguity immediately
4. **Once confirmed fixed, I'll rerun the positive-path end-to-end** (abandon at welcome with `pgtest+ab-cart-retest001` → wait 90s → verify email arrives → click CTA → complete move-in → DB attribution check)

## MCP capability matrix (for future reference)

| Question | MCP can answer? |
|---|---|
| Workflow exists / active / paused | Yes (`workflows-list`, `workflows-get`) |
| Workflow structure (trigger, filter, gates, waits, email actions, templates) | Yes |
| Who edited the workflow when | Yes (`activity-log-list` with `scope=HogFlow`) |
| App-side event emission + person_properties | Yes (HogQL on `events` / `persons`) |
| Workflow invocations (did a user enroll / did an email send / was there an error) | **No** under personal API key |
| Integration (sender) health + config | **No** under personal API key (only GitHub integrations exposed) |
| CDP function / destination logs | **No** under personal API key |

Escalating via Linear comment is the fastest path forward until either a service-scoped API key is issued or a teammate with dashboard access answers the 3 questions above.

---
*Investigation tooling: PostHog MCP (HTTP transport, personal API key `phx_...`), HogQL for events/persons, activity-log-list for edit history. Read-only throughout — no writes were performed against the PostHog project per ENG-2238 / CLAUDE.md protocol.*
