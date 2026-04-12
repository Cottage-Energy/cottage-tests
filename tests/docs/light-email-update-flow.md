# Light User Email Update Flow

## Overview
Enables light users to change their email on `/portal/account`. The update must sync across three systems: Supabase Auth, LightUsers DB table, and the external Light API. Supabase Auth requires email verification before updating, so the flow involves a confirmation email + redirect chain.

**Ticket**: ENG-2080
**PR**: cottage-nextjs #1123 (merged 2026-03-31)

## Entry Points

| URL | User Type | Notes |
|-----|-----------|-------|
| `/portal/account` | LightUser | Click "Edit details" to enable email field |

## Steps

| # | Screen | URL | User Action | What Happens |
|---|--------|-----|-------------|-------------|
| 1 | Account Settings | `/portal/account` | Click "Edit details" | Form enters edit mode — all fields enabled, Cancel/Save buttons appear |
| 2 | Account Settings | `/portal/account` | Change email, click "Save changes" | Non-email fields sent to Light API via PATCH. If email changed: `supabase.auth.updateUser({ email })` called. Email field reverts to old value. |
| 3 | Confirmation Dialog | `/portal/account` | Dialog: "Check your inbox" | User clicks "Okay" to dismiss. Verification email sent to BOTH old and new addresses (Supabase security feature). |
| 4a | Email | inbox | Click verification link (same browser — active session) | Opens `/email-confirmation?code=...` → detects session → redirects to `/session-init` |
| 4b | Email | inbox | Click verification link (different browser — no session) | Opens `/email-confirmation?code=...` → no session → redirects to `/sign-in?emailUpdated=true` |
| 5a | Session Init | `/session-init` | (automatic, from 4a) | Calls `/api/light/init-session` → fetches Light API profile → compares auth email vs Light API email → if different, calls `PATCH /api/light/profile/sync-email` → redirects to `/portal/account?emailUpdated=true` |
| 5b | Sign In | `/sign-in?emailUpdated=true` | (from 4b) User signs in with new email | Orange banner: "Your email has been updated. Please sign in with your new email address." After sign-in → `/session-init` → sync (same as 5a) |
| 6 | Account Settings | `/portal/account?emailUpdated=true` | (automatic) | Success toast: "Email updated — Your email has been successfully updated." `emailUpdated` param cleaned from URL. Email field shows new email. |

## Redirect Chains

### Active session (same browser)
```
/email-confirmation?code=... → /session-init → /portal/account?emailUpdated=true → /portal/account
```

### No session (different browser)
```
/email-confirmation?code=... → /sign-in?emailUpdated=true → [user signs in] → /session-init → /portal/account?emailUpdated=true → /portal/account
```

### Error (expired/invalid link)
```
/email-confirmation?error=...&error_description=... → stays on page, shows error + support link + "Back to Home"
```
- Light users: "Back to Home" → `/portal/overview`
- Cottage users: "Back to Home" → `/app/overview`

### Emails already match (no pending change)
```
/session-init → /portal/overview (no sync needed)
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/light/init-session` | GET | Fetch priority light user via `getPriorityLightUserAndRefreshMetadata`, set `light-access-token` cookie |
| `/api/light/get-user/account-api` | GET/POST | Fetch light user from Light API (moved from dashboard GET) |
| `/api/light/profile/dashboard` | PATCH | Update non-email profile fields (name, phone, DOB) + email via Light app API |
| `/api/light/profile/sync-email` | PATCH | Sync email across ALL LightUser accounts — iterates every `lightDevID`, PATCHes Light API for each, then bulk-updates `LightUsers.email` |

## Key DB State

| Table | Column | Value | Meaning |
|-------|--------|-------|---------|
| `auth.users` | `email` | new email | Updated by Supabase Auth after verification link click |
| `LightUsers` | `email` | new email | Updated by `sync-email` API route (NOT by DB trigger) |
| `auth.users` | `user_metadata.isLightUser` | `true` | Used by `/email-confirmation` and `/session-init` to determine user type |

### DB Trigger Status
- `update_light_users_email` function EXISTS — updates `LightUsers.email` WHERE `id = NEW.id`
- **No trigger attached** — the ticket mentions `light_email_update_on_email_auth` but it does not exist in dev
- The existing trigger `email_update_on_email_auth_change` only updates `CottageUsers` (via `update_cottage_users_email()`)
- Email sync for light users is handled entirely via the API route `/api/light/profile/sync-email`

### Temporary Desync Window
When the user confirms via the no-session path (different browser):
1. `auth.users.email` updates immediately (Supabase Auth handles this on link click)
2. `LightUsers.email` stays stale until the user signs in → `/session-init` → `sync-email`
3. This desync is by design — the sync API only runs from session-init

## Middleware

`rewriteForLightUser` in `middleware.ts` returns `null` (no redirect) for:
- `/email-confirmation` — allows the confirmation landing page to load
- `/session-init` — allows the post-confirmation sync to complete

Without these skips, light users on non-portal routes get redirected to `/portal/overview`, breaking the email flow.

The middleware also delegates to `getPriorityLightUserAndRefreshMetadata` (shared utility from `@/feat/light/utils.ts`) instead of inline Light API fetch + sort logic (AC7 refactor).

## Multi-Account (Multi-Property)

For users with multiple `lightDevID` entries:
1. `sync-email` queries ALL `LightUsers` rows matching the user's `id`
2. Iterates over each `lightDevID`, PATCHes the Light API profile for each
3. Bulk-updates `email` on all matching `LightUsers` rows
4. If ANY Light API PATCH fails, sync stops and returns error

## Edge Cases & Gotchas

- **Verification email to both addresses**: Supabase sends "Confirm Email Change" to both old AND new email. This is a Supabase security feature; team confirmed keeping it (not a bug).
- **Email field reverts on submit**: When email change is submitted, `form.setValue('email', profile.email)` immediately reverts the field to the old email before the dialog appears. The new email only shows after verification + sync.
- **Toast auto-dismisses quickly**: Success/warning toasts appear for ~3 seconds. In automated tests, assert presence immediately after navigation.
- **Password reset dialog may appear**: If the test user's password was recently reset via admin API, a "Set up your new password" dialog blocks the page. Complete it or remove via DOM.
- **Old email still works for sign-in until confirmed**: The auth email doesn't change until the verification link is clicked. If the user never confirms, nothing changes.

## Test Users

| Email | User ID | lightDevIDs | Purpose |
|-------|---------|-------------|---------|
| `pgtest+lite-in002@joinpublicgrid.com` | `c57167ea-...` | 1 (`6ee64590-...`) | Single-account testing (AC1-5, AC7) |
| `pgtest+lite-multi00@joinpublicgrid.com` | `b0c8b8f2-...` | 2 (`51ea8d3e-...`, `6d8a3d09-...`) | Multi-account testing (AC6) |

## Related

- Test plan: `tests/test_plans/ENG-2080_light_email_update_flow.md`
- Automated tests: not yet created
- Linear ticket: ENG-2080
