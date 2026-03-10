# QA Test Cases — Connect & Overview Updates (Full Stack)

> Consolidated test plan covering the frontend branch `feat/connect-and-overview-updates` and the backend task/services layers it calls into.

---

## Inconsistencies Between Frontend & Backend Ticket

> **These must be resolved before testing begins.**

| # | Issue | Details | Recommendation |
|---|-------|---------|----------------|
| **I-1** | `saving_credentials` metadata status not handled by frontend | The backend state machine includes `saving_credentials` between `fetching_account_info` and `complete`. The frontend `RunMetadataStatus` type and switch statement do **not** include this status — it would be a no-op (no UI update). | Either add `saving_credentials` → connecting step 2 in the frontend, or confirm the task never actually emits it. If the task does emit it, the UI will appear to "freeze" between step 2 and success. |
| **I-2** | No 5-minute MFA countdown in frontend | Backend ticket (test 2.2) states "5-minute countdown visible". The MFA view in `connect-utility-views.tsx` has **no countdown timer** — just a code input, Cancel, and Verify buttons. | Either add a countdown to the MFA view or remove the expectation from backend tests. Users currently have no indication of the timeout window. |
| **I-3** | `credentialsSaved` never read by frontend | Backend tests (1.4, 7.1, 7.8, 16.1) reference `credentialsSaved` in task output. The frontend defines it in the `RunOutput` type but **never reads or displays it**. | If the distinction matters to the user (e.g., inactive account = credentials not saved), the success view should communicate it. Otherwise, backend tests should note this is a backend-only verification. |
| **I-4** | `accountInfo.isActive` never checked by frontend | Backend test 7.1 implies different behavior for inactive accounts. The frontend **ignores** `isActive` — it shows the success view with account number regardless. | Decide: should inactive accounts show a different success message, or is the current "always show success" behavior intentional? |
| **I-5** | Success view shows account number only, not "active status" | My original frontend test 2.4 said "shows account number and active status". The success view only renders `Account #[number]` — no active/inactive indicator. | Correct the test expectation (done below). |
| **I-6** | `account_not_found` / `account_locked` sourcing unclear | Frontend maps these from `output.error` string, but backend output `status` enum is only `SUCCESS | INVALID_CREDENTIALS | MFA_TIMEOUT | MFA_FAILED | SYSTEM_ERROR`. The `error` field must contain the string `"account_not_found"` or `"account_locked"` for the frontend to display those specific messages. | Confirm the task actually sets `output.error` to these exact strings. If it only ever sets `"INVALID_CREDENTIALS"`, users will always see the generic "wrong credentials" message, never the "account not found" or "account locked" variants. |

---

## Part 1 — Frontend

### 0. Non-Bill-Upload Users (Regression — No Changes Expected)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 0.1 | Overview page renders normally for standard billing customers | Log in as a user with `isBillingCustomer = true`, no connect account | Overview layout, savings cards, setup tracker, billing history all render exactly as before |
| 0.2 | Setup tracker steps unchanged | Same user as above | Steps 0 → 1 → 1.5 (if error) → 2 → 3 visible, same labels and states as production |
| 0.3 | Billing History button visible | Navigate to billing page | "Billing History" button shows in recent-bill footer |
| 0.4 | Renewable energy card shows for eligible billing customers | User with billing account + utility supports renewables + no active subscription | Renewable energy offer card appears in tracker |
| 0.5 | Savings cards render unchanged | User with various account statuses (ACTIVE, PENDING, etc.) | Savings card type matches existing production logic |
| 0.6 | No connect modals appear unprompted | Browse overview, billing, and settings pages | No connect-utility modal or bill-upload modal surfaces |

---

### 1. Connect Registration Flow (`/connect`)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1.1 | Page loads with address input | Navigate to `/connect` | Address field with Google Places autocomplete renders |
| 1.2 | Address auto-detects utility company | Enter a valid US address | Primary utility company auto-selects for that zip code |
| 1.3 | Utility dropdown hidden for LIGHT/TX-DEREG providers | Enter address in a LIGHT or TX-DEREG service area | Utility company selector is hidden |
| 1.4 | Form validation — empty fields | Submit form with empty email/name | Zod validation errors shown for each missing field |
| 1.5 | Form validation — invalid email | Enter `notanemail` and submit | Email format error displayed |
| 1.6 | Successful registration | Fill valid address, email, first name, last name → submit | API call to `/api/registration/create-from-connect` succeeds; user auto-logged in and redirected to `/app/overview` |
| 1.7 | Duplicate email | Register with an email that already exists | 409 error; user-friendly message about existing account |
| 1.8 | Created user has correct DB state | After 1.6, check Supabase | `cottageConnectUserType = 'BILL_UPLOAD'`, `enrollmentPreference = 'manual'`, `isRegistrationComplete = true`, ElectricAccount status `ELIGIBLE`, `isConnectAccount = true` |
| 1.9 | Slack notification fires | After 1.6 | Slack message in `dev-connect` (staging) or `prod-connect` (prod) channel |

---

### 2. Connect Utility Modal (Post-Signup)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 2.1 | Modal opens from setup tracker | As a bill upload user, click "Connect utility" on tracker | Connect utility modal opens in `form` state |
| 2.2 | Modal opens from auto-apply savings card | Click "Connect utility" on the auto-apply card | Same modal opens |
| 2.3 | Submit valid credentials | Enter utility email + password → submit | Modal transitions: `form` → `connecting` with 3-step progress: "Connecting to [Provider]" → "Validating your credentials" → "Pulling in your account details" |
| 2.4 | Successful connection | Credentials valid, no MFA | Modal shows `success` state with account number displayed as "Account #[number]" |
| 2.5 | MFA required | Utility provider requires MFA | Modal transitions to `mfa` state showing "Verify your identity" heading with code input field |
| 2.6 | MFA timeout | Do NOT submit MFA code for 5+ minutes | Error state: "Something went wrong on our end. Try again in a moment — if it keeps happening, upload your bill instead." + "Upload bill" button |
| 2.7 | Wrong credentials | Enter incorrect password | Error: "The email or password you entered doesn't match your [Provider] account. Try again or you can upload your utility bill instead" |
| 2.8 | Account not found | Enter email with no matching account (**see I-6**) | Error: "We couldn't find a [Provider] account with this email. Double-check your email or upload your bill instead." |
| 2.9 | Account locked | Trigger rate-limit on utility (**see I-6**) | Error: "Your [Provider] account has been temporarily locked after too many attempts. Try again in 30 minutes or upload your bill instead." |
| 2.10 | Network/system error | Trigger.dev task crashes or returns SYSTEM_ERROR | Error: "Something went wrong on our end. Try again in a moment — if it keeps happening, upload your bill instead." |
| 2.11 | Cancel mid-connection | Click cancel/close while in `connecting` state | Trigger.dev run cancelled via `/api/connect/cancel`; modal closes; state resets |
| 2.12 | Post-success UI refresh | Complete successful connection, click Done | Modal closes; `router.refresh()` fires; overview page reflects updated account state |
| 2.13 | Error screen actions | On any error screen | "Try again" resets to form state; "Upload bill" opens bill upload modal |

---

### 3. Bill Upload Modal

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 3.1 | Modal opens | Click "Upload a bill" from tracker or auto-apply card | Bill upload modal opens in `idle` state with drag-and-drop zone |
| 3.2 | Select file via drag-and-drop | Drag a PDF/JPG/PNG onto the drop zone | File name displayed; state transitions to `ready` |
| 3.3 | Select file via file picker | Click browse and select a file | Same as 3.2 |
| 3.4 | File size exceeds 10MB | Select a file > 10MB | Error message about file size limit |
| 3.5 | Upload file | With file in `ready` state, click submit | Progress bar shows 0–100%; state goes `uploading` → `success` |
| 3.6 | Account status update on upload (ELIGIBLE) | Upload bill when account status is `ELIGIBLE` | ElectricAccount status changes to `REVIEW_UPLOAD_BILL` |
| 3.7 | Account status update on upload (ISSUE_UPLOAD_BILL) | Upload bill when account status is `ISSUE_UPLOAD_BILL` | ElectricAccount status changes to `REVIEW_UPLOAD_BILL` |
| 3.8 | Re-upload option | After selecting file, click re-upload | File selection resets; user can pick a new file |
| 3.9 | Upload error | Simulate Supabase storage failure | Error state shown with retry button |
| 3.10 | "Connect account" alternative | From idle state in bill upload modal, click "Connect account" | Switches to connect utility modal |
| 3.11 | Cache invalidation | After successful upload | Resident properties data refreshes; overview page reflects new status |

---

### 4. Overview Page — Bill Upload User Rendering

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 4.1 | Auto-apply savings card shown for ELIGIBLE bill upload user | Log in as bill upload user with `ELIGIBLE` status | Auto-apply savings card renders with provider name, 3 benefits listed, "Connect utility" + "Upload a bill" buttons |
| 4.2 | Setup tracker shown for REVIEW_UPLOAD_BILL | Same user after uploading bill | Setup tracker visible with appropriate step states |
| 4.3 | Setup tracker shown for ISSUE_UPLOAD_BILL | User whose bill upload had an issue | Tracker header shows error message + "Upload utility bill" action button |
| 4.4 | Bill upload tracker steps differ from standard | Compare tracker steps | Bill upload users see steps 0 → 1 → (1.5 if error) → 2; **no** step 3 for renewable energy (unless error) |
| 4.5 | Sidebar shows "Looking for savings" card | Auto-apply user views overview | `SavingsLookingForSavings` card in sidebar |
| 4.6 | FAQ section visible | Scroll down on overview | FAQ section renders below main content |
| 4.7 | Billing History hidden for non-billing active accounts | User with active account but `isBillingCustomer = false` | "Billing History" button hidden in recent-bill footer |
| 4.8 | Wider layout for auto-apply users | Inspect container width | Container is `52rem` (wider than standard) |

---

### 5. Renewable Energy Card

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 5.1 | Shows only for billing customers | Billing customer with renewable-eligible utility | Renewable energy card appears in setup tracker |
| 5.2 | Hidden for non-billing customers | Bill upload user (non-billing customer) | Renewable energy card does **not** appear |
| 5.3 | Hidden when subscription already active | Billing customer with existing renewable subscription | Card does not appear |

---

### 6. Frontend API Route Validation

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 6.1 | `/api/registration/create-from-connect` rejects invalid body | POST with missing required fields | 400 with field-level Zod errors |
| 6.2 | `/api/connect/login` rejects missing provider | POST without `provider` field | 400 error |
| 6.3 | `/api/connect/cancel` rejects missing runId | POST without `runId` | 400 error |
| 6.4 | Removed routes return 404 | Hit old endpoints: `/api/connect/authorize-connect-request`, `/api/connect/link`, `/api/connect/rtc-link`, `/api/connect/sso-signup`, `/api/connect/validate-token` | 404 — these routes no longer exist |

---

### 7. Data Layer

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 7.1 | `isConnectAccount` flag populated | Fetch resident properties for a connect user | `isConnectAccount = true` in response |
| 7.2 | `isConnectReady` on utility company | Fetch resident properties with utility that supports connect | `isConnectReady = true` on `ResidentUtilityCompany` |
| 7.3 | Non-connect user has `isConnectAccount = false` | Fetch resident properties for standard user | `isConnectAccount = false` |

---

## Part 2 — Task Layer (Trigger.dev `validate-credentials`)

### 8. Happy Path — Login Without MFA

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 8.1 | Valid credentials, no MFA | Submit valid email/password for a non-MFA account | Metadata transitions: `starting` → `logging_in` → `fetching_account_info` → `complete`. Output: `{ status: "SUCCESS" }` |
| 8.2 | Credentials are persisted | After 8.1, check backend API | POST sent to `UPSERT_CREDENTIALS_URL` with `userId`, `email`, `password`, `provider`, `utilityType`, `retainEmail: true`, and `accountNumber` |
| 8.3 | Frontend reflects all metadata states | Watch the UI during 8.1 | Connecting step 0 ("Connecting to [Provider]") → step 1 ("Validating your credentials") → step 2 ("Pulling in your account details") → success |
| 8.4 | `credentialsSaved: true` in output | Inspect `run.output` after 8.1 | `credentialsSaved` is `true` when account is active (**Note: frontend does not display this — backend-only check, see I-3**) |

### 9. Happy Path — Login With MFA

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 9.1 | MFA triggered, code accepted | Submit valid creds for MFA-enabled account → enter correct code | Metadata: `logging_in` → `waiting_for_mfa` → `verifying_mfa` → `fetching_account_info` → `complete`. Output: `{ status: "SUCCESS" }` |
| 9.2 | MFA form appears with token | During `waiting_for_mfa` state | Frontend receives `mfaTokenId` and `mfaPublicAccessToken` in metadata. MFA input form renders with "Verify your identity" heading (**Note: no countdown timer — see I-2**) |
| 9.3 | Wait token completes correctly | Submit MFA code via `completeMfaToken({ code })` | Task resumes from paused state within seconds |
| 9.4 | MFA method selection (Email) | Account with multiple MFA methods available | Handler selects Email method (internal to task — not user-visible) |

### 10. Invalid Credentials

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 10.1 | Wrong password | Submit valid email + wrong password | Metadata → `login_failed`. Output: `{ status: "INVALID_CREDENTIALS" }`. Credentials NOT saved |
| 10.2 | Non-existent email | Submit unregistered email | Same as 10.1 |
| 10.3 | Empty fields | Submit blank email or password | Frontend form validation prevents submission (required fields) |

### 11. MFA Failure Scenarios

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 11.1 | Wrong MFA code | Submit invalid code | Metadata → `mfa_failed`. Output: `{ status: "MFA_FAILED" }`. Frontend shows "wrong credentials" error. Credentials NOT saved |
| 11.2 | MFA timeout (5 min) | Trigger MFA flow, do NOT submit code for 5+ minutes | Metadata → `mfa_timeout`. Output: `{ status: "MFA_TIMEOUT" }`. Frontend shows "network_error" message. Credentials NOT saved |
| 11.3 | MFA code expired | Wait ~4 minutes, then submit correct code | May be expired server-side. Expect `MFA_FAILED` or retry prompt |

### 12. Rate Limiting / Concurrency

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 12.1 | Single user, sequential | User A submits creds, waits for completion, submits again | Both runs execute successfully in sequence |
| 12.2 | Single user, concurrent | User A submits creds twice rapidly | First run executes immediately. Second run queues (`concurrencyLimit: 1` per user). Second starts only after first completes |
| 12.3 | Multiple users, parallel | User A and User B submit simultaneously | Both execute in parallel (separate queues: `credential-validation-{userId}`) |

### 13. Provider Coverage

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 13.1 | ComEd (`COMED`) | Valid ComEd creds | Login via `secure1.comed.com`, success |
| 13.2 | PECO (`PECO`) | Valid PECO creds | Login via `secure.peco.com`, success |
| 13.3 | BGE (`BGE`) | Valid BGE creds | Login via `secure.bge.com`, success |
| 13.4 | PEPCO (`PEPCO`) | Valid PEPCO creds | Login via `secure.pepco.com`, success |
| 13.5 | ACE (`ACE`) | Valid ACE creds | Login via `secure.atlanticcityelectric.com`, success |
| 13.6 | Delmarva (`DELMARVA`) | Valid Delmarva creds | Login via `secure.delmarva.com` (maps to `DPL`), success |
| 13.7 | Unsupported provider | Submit with provider `"XCEL"` | `getHandler()` throws → `SYSTEM_ERROR`. Credentials NOT saved |

### 14. Task Error Handling & Edge Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 14.1 | Account inactive | Valid creds, deactivated utility account | Login succeeds, `getAccountInfo` returns `isActive: false`. Output: `{ status: "SUCCESS", credentialsSaved: false }`. **Frontend still shows success view with account number (see I-4)** |
| 14.2 | Fallback credential save | Login succeeds, then `getAccountInfo` throws | Credentials saved despite error (fallback). Output: `{ status: "SYSTEM_ERROR", credentialsSaved: true }` |
| 14.3 | Network failure during login | Simulate network timeout to utility API | Task throws, no retry (`maxAttempts: 1`). Frontend shows network_error |
| 14.4 | Missing `userId` | Trigger task without `userId` in payload | Login proceeds normally, but `trySaveCredentials` returns `false`. Output: `{ credentialsSaved: false }` |
| 14.5 | `shouldSaveCredentials: false` | Trigger with flag set to `false` | Login and MFA succeed, but credentials are NOT saved |

### 15. Realtime / Frontend Integration

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 15.1 | SSE subscription receives all states | Subscribe via `useRealtimeRun()` before triggering | All metadata state transitions received in order |
| 15.2 | Public token scoping | Create token with `read.runs: [runId]` | Token can only read specified run. Other runs return 403 |
| 15.3 | Token expiration | Token created with `expirationTime: "10m"` | After 10 minutes, SSE disconnects / returns 401 |
| 15.4 | MFA wait token scoping | Check public token created for MFA wait | Token scoped to `waitTokenId` only |
| 15.5 | Page refresh during MFA | Refresh browser while MFA form is displayed | Run still in `waiting_for_mfa`. Frontend re-subscribes, re-renders MFA form |

### 16. Task Security

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 16.1 | Credentials not in logs | Run a full flow, check Trigger.dev run logs | Password never appears in `logger` output |
| 16.2 | No credentials returned to frontend | Check `run.output` in SSE stream | Output contains `status`, `accountInfo`, `credentialsSaved` — never raw password |
| 16.3 | Rate limit prevents brute force | Same user triggers 10 rapid attempts | Only 1 executes at a time; queue prevents parallel credential guessing |

### 17. Task Infrastructure

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 17.1 | Machine preset | Check task config | Runs on `micro` machine (0.25 vCPU, 0.25 GB) |
| 17.2 | No retries | Task fails with unhandled error | Task does NOT retry (`maxAttempts: 1`) |
| 17.3 | Task ID consistency | Trigger via `tasks.trigger("validate-credentials", ...)` | Matches task `id: "validate-credentials"` |
| 17.4 | Deploy succeeds | `npx trigger.dev deploy` | Task registers, no build errors |

---

## Part 3 — Services Layer (Lambda Endpoints)

### 18. `/connect-account` Endpoint (NEW)

**Route:** `POST admin.{domain}/connect-account` — **Auth:** `Authorization` header must match `API_KEY`

| # | Test Case | Request Body | Expected Result |
|---|-----------|--------------|-----------------|
| 18.1 | Happy path — electric, no account number | `{ userId, email, provider, utilityType: "electric" }` | 200, credentials upserted, `@publicgrid.me` email generated |
| 18.2 | Happy path — gas, with account number | `{ userId, email, provider, utilityType: "gas", accountNumber: "12345" }` | 200, credentials upserted, `GasAccount` updated with `accountNumber: "12345"` and `status: "ACTIVE"` |
| 18.3 | Happy path — electric, with account number | `{ userId, email, provider, utilityType: "electric", accountNumber: "67890" }` | 200, credentials upserted, `ElectricAccount` updated with `accountNumber` and `status: "ACTIVE"` |
| 18.4 | With `retainEmail: true` | `{ userId, email, provider, utilityType: "electric", retainEmail: true }` | 200, credential stored using user's real email (not `@publicgrid.me` alias) |
| 18.5 | With explicit password | `{ userId, email, provider, utilityType: "electric", password: "MyP@ss123" }` | 200, credential stored with `"MyP@ss123"` (not auto-generated) |
| 18.6 | With `characterOverride` | `{ userId, email, provider, utilityType: "gas", characterOverride: "abc" }` | 200, auto-generated password uses override characters |
| 18.7 | `password` takes precedence over `characterOverride` | `{ ..., password: "explicit", characterOverride: "abc" }` | 200, `password` used; `characterOverride` ignored |
| 18.8 | Invalid auth token | Valid body, `Authorization: "wrong-key"` | 400, `"Invalid access token"` |
| 18.9 | No auth header | Valid body, no `Authorization` header | 400, `"Invalid access token"` |
| 18.10 | Missing required field (`userId`) | `{ email, provider, utilityType }` (no `userId`) | 500, Zod validation error |
| 18.11 | Invalid `userId` format | `{ userId: "not-a-uuid", ... }` | 500, Zod validation error |
| 18.12 | Invalid email format | `{ email: "not-an-email", ... }` | 500, Zod validation error |
| 18.13 | Invalid `utilityType` | `{ utilityType: "water", ... }` | 500, Zod validation error (must be `"gas"` or `"electric"`) |

### 19. `/upsert-credentials` Endpoint (UPDATED)

**Route:** `POST admin.{domain}/upsert-credentials` — **Auth:** `Authorization` header must match `API_KEY`

| # | Test Case | Request Body | Expected Result |
|---|-----------|--------------|-----------------|
| 19.1 | Existing behavior unchanged | `{ userId, email, provider, utilityType: "electric" }` | 200, credentials upserted with auto-generated password and `@publicgrid.me` email |
| 19.2 | With new `password` field | `{ ..., password: "UserPass1!" }` | 200, credential stored with `"UserPass1!"` instead of auto-generated |
| 19.3 | With new `retainEmail` field | `{ ..., retainEmail: true }` | 200, credential stored using user's actual email, no `@publicgrid.me` alias |
| 19.4 | Both new fields together | `{ ..., password: "P@ss", retainEmail: true }` | 200, uses real email AND provided password |
| 19.5 | Without new fields (backward compat) | `{ userId, email, provider, utilityType }` | 200, identical to pre-update behavior |

### 20. Credential Logic (`upsertCredentials`)

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| 20.1 | `retainEmail: false`, no existing pgEmail | Generates `username@publicgrid.me`, checks for duplicates via RPC |
| 20.2 | `retainEmail: false`, existing pgEmail | Reuses the existing `@publicgrid.me` email from DB |
| 20.3 | `retainEmail: true` | Skips pgEmail generation, uses user's original email as-is |
| 20.4 | `existingPassword` provided | Uses it directly, skips password generation |
| 20.5 | `existingPassword` undefined, `characterOverride` set | Uses `generatePasswordOverride(characterOverride, 10)` |
| 20.6 | Both undefined | Uses `generateAlphanumericStringWithSymbols(10)` |
| 20.7 | `existingPassword` wins over `characterOverride` | When both provided, `existingPassword` is used |

### 21. Database Side Effects

| # | Verification | Table | Condition |
|---|-------------|-------|-----------|
| 21.1 | Credentials upserted correctly | `admin_upsert_credentials` RPC | Encrypted password, pgEmail, providerId, iv all stored |
| 21.2 | `CottageUsers.pgEmail` updated | `CottageUsers` | `pgEmail` matches expected value for the user |
| 21.3 | Account number set (connect flow) | `ElectricAccount` or `GasAccount` | `accountNumber` matches input, `status = "ACTIVE"` |
| 21.4 | Account status set to ACTIVE | `ElectricAccount` or `GasAccount` | Only rows matching `cottageUserID` are updated |
| 21.5 | No account update when `accountNumber` omitted | `ElectricAccount` / `GasAccount` | No changes to account rows |

### 22. Services Security

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 22.1 | Auth on `/connect-account` | Call without valid API key | 400 returned |
| 22.2 | Auth on `/upsert-credentials` | Call without valid API key | 400 returned |
| 22.3 | Password encryption | Inspect DB after credential save | Password is encrypted (not plaintext). `iv` column populated |
| 22.4 | Lambda secrets linked | Check infra config | `SUPABASE_ADMIN_CREDENTIALS`, `API_KEY`, `ENCRYPTION_KEY` all bound |

---

## Part 4 — End-to-End Integration

### 23. Full Flow — Frontend → Task → Endpoint → Database

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 23.1 | Login without MFA, credential save | Frontend triggers task → task logs in → task calls endpoint → verify DB | `CottageUsers.pgEmail` set. Credential row created with encrypted password. `credentialsSaved: true` in task output. Frontend shows success with account number |
| 23.2 | Login with MFA, credential save | Frontend triggers → MFA flow → task calls endpoint → verify DB | Same as 23.1, with MFA states observed in between |
| 23.3 | Task sends correct `password` | Intercept/log the POST to endpoint | Body contains user's actual utility password (not auto-generated) |
| 23.4 | Task sends `retainEmail: true` | Intercept/log the POST to endpoint | Body contains `retainEmail: true`. User's real email stored as `pgEmail` (no `@publicgrid.me` alias) |
| 23.5 | Task sends `accountNumber` | Intercept/log the POST to endpoint | Body contains `accountNumber` from fetched account info. `ElectricAccount`/`GasAccount` row updated to `status: "ACTIVE"` |
| 23.6 | Fallback save omits `accountNumber` | Login succeeds, `getAccountInfo` throws | Task calls endpoint without `accountNumber`. Credentials saved, but no account activation. `status: "SYSTEM_ERROR"`, `credentialsSaved: true` |
| 23.7 | Inactive account, no save | Login succeeds, account inactive | Task does NOT call endpoint. `credentialsSaved: false`. No DB changes. **Frontend still shows success view (see I-4)** |

---

## Environment Requirements

- **Test accounts**: At least one valid account per provider (ComEd, PECO, BGE, PEPCO, ACE, Delmarva), with and without MFA enabled
- **Env vars (task)**: `UPSERT_CREDENTIALS_URL`, `ADMIN_API_KEY` configured in Trigger.dev environment
- **Env vars (Lambda)**: `SUPABASE_ADMIN_CREDENTIALS`, `API_KEY`, `ENCRYPTION_KEY` linked
- **Env vars (frontend)**: `NEXT_PUBLIC_TRIGGER_API_URL` (falls back to `https://big.publicgrid.cloud`)
- **Trigger.dev**: Dev server running (`npx trigger.dev dev`) or deployed to staging
- **Services**: Lambda deployed to dev stage
- **Frontend**: Next.js app with `@trigger.dev/react-hooks` installed
- **DB access**: Read access to Supabase for verifying `CottageUsers`, `ElectricAccount`, `GasAccount` rows

---

## Key Regression Notes

- **All existing non-bill-upload user flows must work identically** — the rendering logic branches on `isConnectAccount` and `cottageConnectUserType`, so standard billing customers should see zero UI changes.
- **Old connect API routes are removed** — verify no other frontend code references `/api/connect/authorize-connect-request`, `/link`, `/rtc-link`, `/sso-signup`, or `/validate-token`.
- **Utility company field** — minor change to the shared component; verify it still works correctly in all contexts where it's used (registration, settings, etc.).
- **`/upsert-credentials` backward compatibility** — the endpoint must behave identically when `password` and `retainEmail` are omitted (suite 19).
- **Fallback save path** — when `getAccountInfo` throws, the fallback `trySaveCredentials()` call has no `accountNumber` — account activation won't happen, but credentials are still saved. This is by design.
