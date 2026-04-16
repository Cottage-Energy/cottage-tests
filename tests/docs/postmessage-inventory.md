# PostMessage Inventory — cottage-nextjs (TanStack)

Generated 2026-04-15 from `apps/tanstack-main/src/` (+ fallback to `apps/main/app/` for shared handlers). Every iframe-facing postMessage the app can emit, and where each one originates.

## Core utility
`apps/tanstack-main/src/utils/post-message.ts`

```ts
sendPostMessage(message)  // window.parent.postMessage(message, '*')
handlePostOnLoad()        // sends { pageStatus: 'ready' }
```

## Message types

### 1. `{ pageStatus: 'ready' }`
- **Sent by**: `handlePostOnLoad()` on page load for any flow embedded in an iframe
- **Callers**: `move-in/forms/form-wizard.tsx`, `move-in/forms/resident-sets-up/index.tsx`
- **Purpose**: Partner iframe host knows the page is mounted

### 2. Move-in completion — `MessageForPartner`
```ts
| { status: 'error' }
| {
    status: 'completed',
    flowType: 'transfer',
    accountNumber: string | null,
    electric: { setup: boolean, utilityCompanyName: string | null, utilityCompanyID: string | null } | null,
    gas:      { setup: boolean, utilityCompanyName: string | null, utilityCompanyID: string | null } | null,
  }
```
- **Sent by**: `move-in/machines/post-message-handler/partner-message-handler.ts` → `handlePartnerPostRequest`
- **Callers**: `encouraged-conversion/index.ts` (sendPostMessage state), `resident-sets-up/index.ts` (sendPostMessage state)
- **Triggers**: move-in flow reaches completion (success) or hits terminal error. "I'll set it up myself" dialog also goes through this handler.
- **State naming clue**: `sendPostMessage` / `handlePostMessageTimeout` xstate states

### 3. Transfer completion/failure/cancel — `TransferPostMessage`
```ts
| { status: 'failed' }
| { status: 'canceled' }
| { status: 'completed', newServiceRequested: boolean, accountNumber: string | null }
```
- **Sent by**: `transfer/machines/post-message-handler/handle-post.ts` → `handleTransferPostMessageLogic`
- **Callers**: `transfer/machines/transfer.tsx`, `transfer/transfer-widget.tsx`
- **Triggers**:
  - `canceled` — user on "unavailable" screen clicks "Go back" (added in PR #1173 / ENG-2632)
  - `failed` — transfer submission fails server-side
  - `completed` — transfer completes (with newServiceRequested / PG account number)
- **Iframe delay**: `POST_MESSAGE_TIMEOUT_MS` (8s) when in iframe, immediate otherwise

### 4. Bill upload / Verify utilities completion — `PostMessagePayload`
```ts
{
  status: 'completed',
  pgAccountNumber: string | null,
  flowType: 'verified'           // added in messageBuilder
}
```
- **Sent by**: `(bill-upload)/shared/utils/post-message.ts` → `sendCompletionMessage`
- **Triggers**: user reaches the bill-upload or verify-utilities success page

### 5. Light move-in — Light xstate `handlePostMessage`
- **Sent by**: `move-in/light/light-machine.tsx` — handlePostMessage states at lines 1950/1953/1957
- **Routes through**: same `sendPostMessage` utility
- **Triggers**: Light flow completion (success) or error
- Payload shape mirrors (2) since Light reuses `MessageForPartner` via shared handler (confirmed empirically by Apr 14 session)

### 6. 3-D Secure verification complete — inline in `routes/secure-verifying/index.tsx`
```ts
window.top.postMessage({
  type: '3ds-verification-complete',
  piSecret: paymentIntentClientSecret,
}, '*')
```
- **Triggered**: 1s after the `/secure-verifying` route renders
- **Target**: `window.top` (parent of the Stripe verification popup)
- **Purpose**: Signal Stripe 3DS challenge completion to the parent window

## Flow → postMessages mapping

| Flow | Messages emitted |
|------|------------------|
| Standard move-in (autotest) | 1 on load, 2 on completion |
| Encouraged conversion (pgtest) | 1 on load, 2 on completion, also 2 from "Set it up myself" dialog |
| Non-billing move-in | 1 on load, 2 on completion (with `electric.setup=false` depending on path) |
| Light move-in | 1 on load, 5 (Light) on completion |
| Transfer | 1 on load, 3 on "Go back" (canceled), 3 on success (completed), 3 on failure (failed) |
| Bill upload | 1 on load, 4 on success |
| Verify utilities | 1 on load, 4 on success |
| TX bill drop | 1 on load, 4 on savings reached, 5 on Light switch completion |
| Connect | 1 on load, 2 on completion |
| Finish registration | 1 on load, 2 on completion |
| 3DS payment verification | 6 after 1s delay |

## Test strategy

Wrap each flow with a page-level listener:

```js
await page.addInitScript(() => {
  window.__pgMessages = [];
  const orig = window.parent.postMessage;
  window.parent.postMessage = (msg, target) => {
    window.__pgMessages.push({ msg, target, at: Date.now() });
    orig.call(window.parent, msg, target);
  };
});
// ... run flow ...
const messages = await page.evaluate(() => window.__pgMessages);
```

Assert: shape matches expected type, timing matches iframe-delay semantics when applicable.
