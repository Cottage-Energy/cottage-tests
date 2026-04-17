# Migration QA Learnings — ENG-2188 TanStack Migration

> Extracted from 20+ sessions (Mar 28 - Apr 16, 2026)
> Author: Christian (QA)
> Applicable to: any framework migration, not just Next.js -> TanStack

---

## 1. Migration QA Methodology

- **Verify you're on the TARGET deployment before any testing.** Check stack markers (`_next/static` = Next.js, TanStack devtools = TanStack). Early sessions tested the source (dev.publicgrid.energy) instead of target (tanstack-dev.onepublicgrid.com), producing false PASSes.

- **Side-by-side parity testing is mandatory.** For every flow, open source AND target simultaneously. Screenshot both. Compare: URL params, field values, toggle defaults, button visibility, checkbox initial state, field attributes (`disabled`, `name`, `checked`).

- **Inspect beyond "did the flow complete?"** Use `browser_evaluate` to inspect DOM attributes. A checkbox can appear unchecked but have `checked=true`. Check URL bar for encoded params like `%22`. Check component visibility for guest vs logged-in users.

- **Code audit items = immediate test cases.** When a developer posts a code audit, every item becomes a test case. Triage into: UI-testable / network-testable / code-only / blocked-on-data. Don't lump all as "not tested."

- **Never accept "not testable" without trying observable boundaries.** Route existence is testable via `curl` + HTTP status. URL param prefill is testable by navigating. Component rendering is testable via snapshot. Reserve "code-only" for genuinely server-internal logic.

- **Create test conditions proactively.** Never mark something "untested" because you lack a user or state. Create the user, set the flag, trigger the condition.

- **Always compare with source (dev) before reporting parity issues.** Without comparison, you risk false positives — flagging expected behavior as bugs.

- **Complete every flow to its final page — cutting corners WILL miss Critical bugs.** On Apr 14, I repeatedly cut corners: testing "step 2 of 5" and calling it PASS, checking "page loads" without completing the form, counting emails without reading content. Christian had to push multiple times to finish flows. What I missed by cutting corners:
  - **Bug #6 (CRITICAL)**: Light payment post-confirm fails — Stripe succeeds but server handler crashes. Only found when Christian said "you are not testing tx bill drop completely."
  - **Blank email content**: I counted 4 emails and called it PASS. Christian said "I saw emails that is empty" — I hadn't read the HTML body. Templates were `<template></template>` (blank).
  - **LightUsers.email sync bug**: Only found by completing the full sign-out + sign-back-in cycle.
  - Every shortcut I took hid a bug. The rule is: reach the final page, verify DB state, read email content. If there's a payment step, fill the card and submit. If blocked, find another way (OTP sign-in, new user). Never mark "PASS" on partial completion.

- **Separate deployments may have separate auth.** Credentials from one environment may not work on another. Always verify or create fresh users on the target.

---

## 2. TanStack-Specific Findings

- **ESI ID double-quoting (`%22...%22`) is by design.** TanStack coerces unquoted numeric search params to JS numbers. ESI IDs exceed `Number.MAX_SAFE_INTEGER`, causing precision loss. Quoting forces string treatment. Same for ZIP codes. Do NOT flag as parity issues.

- **Server-side errors appear in browser console with `[Server] LOG` prefix.** `_serverFn/` POST calls return HTTP 200 even when the server function fails internally. Always check `browser_console_messages` for `[Server]` entries.

- **Inngest event dispatch gaps are systemic.** All `createServerFn` replacements need explicit Inngest event dispatches. The TanStack Inngest package lives at `packages/tanstack-inngest/src/functions/` in cottage-nextjs (NOT the services repo).

- **Empty error objects in catch blocks.** `JSON.stringify(error)` returns `{}` for Error objects. Fix: `JSON.stringify(error, Object.getOwnPropertyNames(error))`.

- **`FRONTEND_URL` missing from Doppler config** caused all email templates to render blank (`<template></template>`).

- **Account page `tabValue` is camelCase on TanStack.** `?tabValue=paymentMethod` (not lowercase `paymentmethod`).

- **TanStack adds "Disabling autopay?" confirmation dialog** (role `alertdialog`) — Next.js was a silent toggle.

- **Drop-off resume via guid URL returns to Step 1** instead of resuming the in-progress session.

---

## 3. Session Management

- **Save findings incrementally, NEVER batch to end-of-session.** A session hit the 2000px image limit and locked — every subsequent prompt was rejected. Verified bug findings were stranded and had to be reconstructed from screenshots.

- **Keep screenshots under 2000px per dimension.** Once exceeded, the session is dead. Prefer viewport screenshots over `fullPage: true`.

- **If a session locks, open a fresh session to reconstruct.** The locked session's history is readable but nothing can be appended.

- **Testing is the work — don't interrupt to save context.** Repeated pauses to save memory delayed finding a Critical bug by hours. Complete ALL testing first, then save.

- **Balance incremental saves with testing flow.** Save each discrete finding (AC result, bug) the moment it's verified — a 30-second Linear comment, not a 10-minute doc effort.

- **Limit parallel Playwright MCP agents to 2-3.** More causes 429 rate limiting. Use extra agents for non-browser work.

- **Never run parallel move-in flows via Playwright MCP.** Shared browser causes cross-contamination (wrong emails, autocomplete bleed).

---

## 4. Bug Discovery Techniques

- **Theme rendering does NOT prove attribution correctness.** UI can render the correct partner theme while backend attributes to a fallback partner. Always verify DB-level `Referrals.referredBy` after any partner flow.

- **Blank email templates are invisible without content verification.** Counting "4 emails received" misses empty bodies. Must read HTML content via Fastmail JMAP.

- **Test duplicate/conflict scenarios for CRUD flows.** 409 handling is frequently missed — React error boundary fires, dialog closes silently.

- **Test case sensitivity on text PK fields.** Postgres text PKs are case-sensitive — `COMED` and `comed` coexist as separate records.

- **Follow existing test sequences exactly.** Ad-hoc data manipulation masked a real Critical pipeline bug. The test code defines the correct verification order for a reason.

- **State transition cycle testing catches persistence bugs.** Test Activate -> Cancel -> Re-activate with users WITH and WITHOUT existing data.

---

## 5. Payment Pipeline Discoveries

- **`balance-ledger-batch` and `stripe-payment-capture-batch` are cron-only.** Cannot be triggered via event API — returns 200 but does nothing. Must wait for `*/5` cron or invoke from Inngest dashboard.

- **Bill processing is strictly sequential.** One bill at a time per charge account. N bills = ~N x 10 min.

- **ChargeAccount with `ledgerBalanceID` is required.** Created by registration Inngest pipeline during move-in, NOT by manually setting status = ACTIVE. Without it, bills silently stay `approved` forever.

- **NEVER manually UPDATE `ingestionState` or `ElectricAccount.status`.** Let the pipeline do it. If a transition doesn't happen, THAT'S the bug.

- **ENG-2709: `balance-ledger-application` silently fails after BLNK entry.** Bills get BLNK APPLIED but never reach `processed`. Intermittent — some users work, others don't.

- **Fee formula includes hidden $0.30 fixed fee.** `Math.ceil(amount * 0.03 + 30)` — the "3% fee" copy is incomplete.

- **Bank failures are hard-coded non-recoverable.** `paymentMethod !== "us_bank_account"` in the recovery check.

- **Auto-pay reconciliation is a 3-function chain** with 5s stagger per batch. Uses the user's CURRENT payment method — so a fresh card after failure is what gets charged.

---

## 6. Tool/Workflow Techniques

- **OTP sign-in via Fastmail JMAP** recovers lost browser sessions when passwords don't work.

- **Linear `commentUpdate`** to edit evolving consolidated QA status comments in-place.

- **Linear GraphQL via `curl`** as fallback when MCP auth expires. Endpoint: `https://api.linear.app/graphql`.

- **`node -e` instead of `jq` on Windows** for JSON parsing in bash.

- **Fetch interceptor** (`window.fetch` override) captures full request/response bodies that `browser_network_requests` doesn't provide.

- **Stripe iframe IS accessible via Playwright MCP.** Use `f{N}e{N}` refs from snapshot.

- **Upload screenshots BEFORE deleting local files.** Upload -> embed in Linear -> verify -> THEN delete.

- **`set -a; source .env; set +a`** to export env vars for Node child processes.

---

## 7. Product Knowledge

- **Password dialog blocks ALL new move-in users in dev.** Must complete the form (fill + submit), not dismiss or DOM-remove. Reappears after every navigation (ENG-2714).

- **Autopay enable modal triggered by Overview "Enable" button** (NOT Account page switch). Role is `alertdialog`. Contains "Pay now" / "Do it later."

- **Light flow vs TX-DEREG create different user types.** "Use verified address" (ESI ID) -> LightUser (`/portal/*`). "Keep original" (no ESI) -> CottageUser (`/app/*`).

- **Light phone validation rejects `1111111111`.** Use `(646) 437-6170` for Light flows.

- **Light session caching causes skipped steps.** Clear cookies between Light tests.

- **MoveInPartner vs Building shortcodes differ on unsupported addresses.** MoveInPartner triggers "can't find service" dialog. Building bypasses zip lookup entirely.

- **Non-billing path is fastest for exploratory testing.** Skips Stripe, ~5 min end-to-end.

- **LightUsers.email sync is session-dependent.** Only syncs via `/session-init` on sign-in, not on email confirmation.

- **`CottageUsers` is plural.** `CottageUser` (singular) doesn't exist.
