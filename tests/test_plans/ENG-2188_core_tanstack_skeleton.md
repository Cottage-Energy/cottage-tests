# Test Plan: ENG-2188 — Core TanStack Skeleton (Full Framework Migration)

## Overview
**Ticket**: ENG-2188
**PR**: cottage-nextjs #1039 (1,346 files, 122K additions)
**Preview URL**: `cottage-nextjs-git-feat-tanstack-full-migration-cottage-team.vercel.app`
**Date**: 2026-03-28
**Tester**: Christian
**Assignee**: Tomy Falgui
**QA Tester (dev)**: Cian Laguesma (already logging issues in Linear comments)

## Summary
Complete migration of the customer-facing application from **Next.js (App Router)** to **TanStack Start/Router**. This is not a feature change — it's a framework swap. Every existing user-facing flow must work identically. The test approach is **parity verification**: run existing e2e suites against the TanStack preview, then exploratory-test framework-specific concerns.

### Key Framework Changes
| Concern | Next.js (current) | TanStack (new) | Test Impact |
|---------|-------------------|----------------|-------------|
| Routing | App Router (file-based) | TanStack Router (code-based) | All URL params, shortcodes, redirects |
| Navigation | `router.push()` | `window.location.href` (interim) | Full page reloads instead of SPA transitions |
| Middleware | `middleware.ts` | Custom middleware equivalent | Auth guards, redirects, route protection |
| Images | `next/image` | `unpic` | Image loading, optimization, lazy loading |
| Env vars | `.env.local` / Next.js built-in | `Vite.env.d.ts` / Doppler | All env-dependent features (Stripe, Supabase, API URLs) |
| SSR/Hydration | Next.js RSC + hydration | TanStack SSR | Hydration mismatches, loading states |
| Error handling | `error.tsx` boundaries | TanStack error handling | Error pages, 404s, boundary behavior |

## Scope

### In Scope
- All onboarding flows (move-in, light, transfer, finish-reg, bill-upload, verify-utilities, connect)
- Post-auth flows (overview, billing, services, profile, support)
- URL parameter handling (shortcodes, electricCompany, gasCompany, zip, pre-filled data)
- Routing & middleware (auth guards, redirects, deep links)
- Payment flows (Stripe integration, manual + auto payment)
- Partner theming (Moved, Funnel, Venn, Renew)
- Static pages (/privacy-policy, /terms-of-service)
- Mobile responsiveness
- Cross-browser parity (Chromium, Firefox, Safari)
- Known open issues from Linear comments

### Out of Scope
- Connect app (separate Vercel project — `cottage-nextjs-connect` was IGNORED in deployment)
- Bill analyzer app (separate Vercel project — also IGNORED)
- Backend/API changes (services repo unchanged)
- Inngest function behavior (backend unchanged)
- Admin portal (pg-admin unchanged)

### Prerequisites
- TanStack preview deployed and accessible at Vercel preview URL
- Doppler env vars configured for TanStack preview (Stripe keys, Supabase URL, API endpoints)
- Test can target preview URL by overriding `ENVIRONMENT` or using `baseURL` directly

### Test Environment Strategy
**Phase 1 (Now)**: Test against Vercel preview URL (`cottage-nextjs-git-feat-tanstack-full-migration-cottage-team.vercel.app`)
**Phase 2 (Post-merge)**: Run full regression suite against `dev.publicgrid.energy` after merge to main
**Phase 3 (Pre-release)**: Run against `staging.publicgrid.energy` before production deployment

---

## Test Cases

### Section 1: Framework-Level Parity (Routing, Navigation, Middleware)

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-001 | Base URL loads landing page | 1. Navigate to preview base URL | Landing/homepage renders, no hydration errors in console | P0 | Smoke | Yes (existing) |
| TC-002 | Move-in route loads | 1. Navigate to `/move-in` | Move-in form renders with address step | P0 | Smoke | Yes (existing) |
| TC-003 | Move-in with shortCode param | 1. Navigate to `/move-in?shortCode=autotest` | Partner-branded move-in form loads, shortCode applied | P0 | Smoke | Yes (existing) |
| TC-004 | Move-in with electricCompany param | 1. Navigate to `/move-in?electricCompany=COMED` | Electric company pre-selected in form | P0 | Regression | Yes (existing) |
| TC-005 | Move-in with gasCompany param | 1. Navigate to `/move-in?gasCompany=CONED` | Gas company pre-selected | P1 | Regression | Yes (existing) |
| TC-006 | Move-in with combined params | 1. Navigate to `/move-in?shortCode=autotest&electricCompany=COMED&gasCompany=CONED` | All params applied correctly | P1 | Regression | Yes (existing) |
| TC-007 | Invalid electricCompany param fallback | 1. Navigate to `/move-in?electricCompany=INVALID` | Graceful fallback — no crash, default behavior | P1 | Regression | Yes (existing) |
| TC-008 | Transfer route loads | 1. Navigate to `/transfer` | Transfer form renders | P0 | Smoke | Yes (existing) |
| TC-009 | Bill upload route loads | 1. Navigate to `/bill-upload/connect-account` | Bill upload form renders | P0 | Smoke | Yes (existing) |
| TC-010 | Verify utilities route loads | 1. Navigate to `/verify-utilities/connect-account` | Verify utilities form renders (separate page.tsx from bill-upload) | P1 | Regression | Yes (existing) |
| TC-011 | Connect route loads | 1. Navigate to `/connect` | Connect flow renders | P1 | Regression | Yes (existing) |
| TC-012 | Auth-protected route redirects unauthenticated user | 1. Navigate to `/app/overview` without session | Redirects to sign-in or appropriate auth page | P0 | Smoke | Yes |
| TC-013 | Sign-in route loads | 1. Navigate to `/sign-in` | Sign-in form renders with email/password fields | P0 | Smoke | Yes |
| TC-014 | Privacy policy page | 1. Navigate to `/privacy-policy` | Page renders (KNOWN ISSUE — currently broken) | P1 | Regression | Yes |
| TC-015 | Terms of service page | 1. Navigate to `/terms-of-service` | Page renders (KNOWN ISSUE — currently broken) | P1 | Regression | Yes |
| TC-016 | 404 page for invalid route | 1. Navigate to `/nonexistent-page` | Proper 404 page renders, not a crash | P1 | Regression | Yes |
| TC-017 | Deep link to specific flow step | 1. Navigate directly to a mid-flow URL (e.g., move-in step 2) | Either loads correctly or redirects to step 1 (same as Next.js behavior) | P2 | Edge Case | No |
| TC-018 | Browser back/forward navigation | 1. Navigate through move-in steps 2. Press browser back 3. Press forward | Navigation works without breaking form state (note: `window.location.href` may cause full reloads) | P1 | Regression | No |
| TC-019 | Page refresh mid-flow | 1. Start move-in 2. Fill address step 3. Refresh page | Form state handled gracefully (may reset — verify matches Next.js behavior) | P2 | Edge Case | No |
| TC-020 | Console errors on page load | 1. Navigate to each major route 2. Check browser console | No JavaScript errors, no hydration mismatches, no unhandled promises | P0 | Regression | No |

### Section 2: Move-In Flow (Standard)

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-021 | Standard move-in happy path (autotest) | 1. Go to `/move-in?shortCode=autotest` 2. Complete all steps: address → unit → email → phone → name → DOB → SSN → move-in date → payment → agreement | User registered, redirected to overview/confirmation | P0 | Smoke | Yes (existing) |
| TC-022 | Move-in with pgtest shortcode | 1. Go to `/move-in?shortCode=pgtest` 2. Complete encourage-conversion flow | Encourage-conversion screens shown, registration completes | P0 | Smoke | Yes (existing) |
| TC-023 | Move-in with txtest shortcode | 1. Go to `/move-in?shortCode=txtest` 2. Complete TX dereg flow | TX-specific screens shown, correct utility assignment | P1 | Regression | Yes (existing) |
| TC-024 | Move-in — existing Cottage user | 1. Go to `/move-in` 2. Enter email of existing user | Recognized as existing user, appropriate flow path | P1 | Regression | Yes (existing) |
| TC-025 | Move-in — pre-filled data via URL params | 1. Navigate with pre-filled query params | Fields populated from URL params | P1 | Regression | Yes (existing) |
| TC-026 | Move-in form validation (each step) | 1. Try to advance each step without filling required fields | Validation errors shown for each required field | P1 | Regression | Yes (existing) |
| TC-027 | Move-in — address autocomplete | 1. Start typing address 2. Select from suggestions | Address populated, step advances | P1 | Regression | Yes (existing) |
| TC-028 | Move-in — non-billing path | 1. Use building with `isHandleBilling=false` 2. Complete flow | No payment step, `maintainedFor` is NULL | P1 | Regression | Yes (existing) |
| TC-029 | Move-in — "I will manage payments myself" | 1. Standard move-in 2. At payment step choose self-manage | Non-billing path, no Stripe payment method | P1 | Regression | Yes (existing) |
| TC-030 | Move-in — utility verification enabled (pgtest) | 1. `/move-in?shortCode=pgtest` 2. Choose "I will call and setup myself" | Redirects to utility verification flow | P1 | Regression | Yes (existing) |
| TC-031 | Move-in — partner theme rendering | 1. Test with autotest (Moved/blue) 2. Test with funnel4324534 (dark navy) 3. Test with venn325435435 (coral) 4. Test with renew4543665999 (indigo) | Each partner theme renders correctly — colors, logos, branding | P2 | Regression | No |

### Section 3: Light Flow (TX Deregulated)

> **NOTE**: 6 open bugs reported by Cian on Mar 27. These must be verified as fixed before PASS.

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-032 | Light flow entry via address | 1. Go to `/move-in` 2. Enter `2900 Canton St` unit `524` 3. Modal appears | Modal offers "Keep original" vs Light flow path | P0 | Smoke | Yes (existing) |
| TC-033 | Light — "Keep Original" → TX dereg flow | 1. Light modal → "Keep Original" | Redirected to TX-DEREG flow, NOT waitlist | P0 | Regression | Yes (existing) |
| TC-034 | Light — happy path completion | 1. Enter Light address 2. Choose Light flow 3. Complete all steps | Light user registered, account metadata inserted | P0 | Smoke | Yes (existing) |
| TC-035 | **[KNOWN BUG]** Light — "Learn more" in payment step | 1. Reach payment step in Light flow 2. Click "Learn more" | Should NOT trigger enrollment — needs `preventDefault` | P0 | Regression | No |
| TC-036 | **[KNOWN BUG]** Light — dialog modals (commit 408a5c9) | 1. Trigger dialog modals in Light flow | Modals from commit `408a5c9` should be present and functional | P1 | Regression | No |
| TC-037 | **[KNOWN BUG]** Light — DoB CSS | 1. Reach date-of-birth step in Light flow | DoB styling matches commit `16ef214` changes | P1 | Regression | No |
| TC-038 | **[KNOWN BUG]** Non-encouraged Light → "I will set it up myself" | 1. Non-encouraged Light flow 2. Click "I will set it up myself" | Path works (both util-verif and non-util-verif) | P0 | Regression | No |
| TC-039 | **[KNOWN BUG]** Encouraged Light → /light endpoint | 1. Encouraged Light address entry 2. Navigate to `/light` | Should show encouraged screens, NOT non-encouraged | P0 | Regression | No |
| TC-040 | **[KNOWN BUG]** Light account metadata insertion | 1. Complete Light flow 2. Check DB | `createLightUserDB` inserts account metadata correctly | P0 | Regression | No |
| TC-041 | Light via building shortcode (txtest) | 1. `/move-in?shortCode=txtest` 2. Complete Light flow | txtest encourage-conversion Light flow works | P1 | Regression | Yes (existing) |
| TC-042 | Light via partner shortcode | 1. Light flow with partner shortcode | Partner theming applied in Light flow | P2 | Regression | Yes (existing) |

### Section 4: Transfer Flow

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-043 | Transfer flow happy path | 1. Go to `/transfer` 2. Complete all steps | Transfer processed, user account updated | P0 | Smoke | Yes (existing) |
| TC-044 | Transfer — billing variant | 1. Transfer with billing utility | Payment method step included | P1 | Regression | Yes |
| TC-045 | Transfer — non-billing variant | 1. Transfer with non-billing utility | No payment step, `maintainedFor` NULL | P1 | Regression | Yes |

### Section 5: Finish Registration Flow

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-046 | Finish registration — API-generated URL | 1. POST to register API 2. Get finish-reg URL from response 3. Navigate to URL | Finish registration form loads with pre-filled data | P0 | Smoke | Yes (existing) |
| TC-047 | **[KNOWN BUG]** Finish registration redirect | 1. Complete finish registration flow | Should redirect correctly (NOT to `/_sso/sign-in` which 404s) | P0 | Regression | No |
| TC-048 | Finish registration — complete happy path | 1. Use API-generated URL 2. Fill remaining fields 3. Submit | User registered, redirected to dashboard/overview | P0 | Smoke | Yes (existing) |
| TC-049 | Finish registration — expired/invalid link | 1. Navigate to finish-reg with invalid token | Appropriate error message, not a crash | P2 | Edge Case | No |

### Section 6: Bill Upload & Verify Utilities

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-050 | Bill upload happy path | 1. Go to `/bill-upload/connect-account` 2. Enter zip `12249` (Con Edison) 3. Complete flow | Bill upload flow completes, account created | P0 | Smoke | Yes (existing) |
| TC-051 | Bill upload — utility not available | 1. Enter zip where `isBillUploadAvailable=FALSE` | Waiting list / fallback flow | P1 | Regression | Yes (existing) |
| TC-052 | Verify utilities happy path | 1. Go to `/verify-utilities/connect-account` 2. Enter zip `12249` 3. Complete flow | Verify utilities flow completes (separate page.tsx from bill-upload) | P1 | Regression | Yes (existing) |
| TC-053 | TX Bill Drop | 1. Bill upload flow with TX zip (`75063`) | TX-specific bill drop experience | P1 | Regression | Yes |
| TC-054 | Bill upload middleware | 1. Navigate to `/bill-upload/connect-account` from various entry points | Middleware routes correctly (recently fixed per Tomy's comment) | P1 | Regression | No |

### Section 7: Post-Auth Flows (Dashboard, Billing, Services)

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-055 | Overview dashboard loads | 1. Sign in 2. Navigate to `/app/overview` | Dashboard renders with user data, subscription info, billing summary | P0 | Smoke | Yes |
| TC-056 | Overview sidebar navigation | 1. Click each sidebar nav item (Overview, Billing, Services, Profile, Support) | Each page loads correctly | P0 | Smoke | Yes |
| TC-057 | Billing page loads | 1. Navigate to Billing | Billing history, payment methods, balance displayed | P1 | Regression | Yes |
| TC-058 | Services page loads | 1. Navigate to Services | Subscription status, transfer option visible | P1 | Regression | Yes |
| TC-059 | Profile page loads | 1. Navigate to Profile | User info, email, phone displayed | P1 | Regression | Yes |
| TC-060 | Support/chat page loads | 1. Navigate to Support | Support page or chat widget renders | P2 | Regression | Yes |
| TC-061 | Sign out flow | 1. Click sign out | Session cleared, redirected to sign-in or homepage | P1 | Regression | Yes |
| TC-062 | Add missing info redirect | 1. Sign in as user with missing required info | Redirects to `/add-missing-info` (was broken, fixed per Cian) | P1 | Regression | No |

### Section 8: Payment Flows (Stripe)

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-063 | Stripe payment element loads in move-in | 1. Reach payment step in move-in flow | Stripe iframe loads (Doppler env vars must be configured) | P0 | Smoke | Yes (existing) |
| TC-064 | Manual payment — successful | 1. Sign in as billing user with balance 2. Click "Pay bill" 3. Complete payment | Payment processed, balance updated | P0 | Regression | Yes (existing) |
| TC-065 | Manual payment — failed (declined card) | 1. Attempt payment with test decline card | Error shown, payment not processed | P1 | Regression | Yes (existing) |
| TC-066 | Auto payment — successful | 1. User with auto-pay enabled + pending balance 2. Trigger payment | Auto payment processes successfully | P1 | Regression | Yes (existing) |
| TC-067 | Auto payment — failed | 1. User with auto-pay + declined card | Failure handled gracefully, user notified | P1 | Regression | Yes (existing) |

### Section 9: Image Rendering (unpic migration)

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-068 | Homepage images load | 1. Navigate to homepage 2. Scroll through page | All images render — no broken images, proper sizing | P1 | Regression | No |
| TC-069 | Partner logo in move-in | 1. `/move-in?shortCode=autotest` | Partner logo renders correctly via unpic | P1 | Regression | No |
| TC-070 | Overview dashboard images | 1. Sign in to dashboard | Profile images, icons, illustrations render | P2 | Regression | No |
| TC-071 | Image lazy loading | 1. Navigate to image-heavy page 2. Scroll | Images lazy load (no layout shift, no broken placeholders) | P2 | Edge Case | No |

### Section 10: Cross-Browser & Mobile

| ID | Title | Steps | Expected Result | Priority | Type | Automate? |
|----|-------|-------|-----------------|----------|------|-----------|
| TC-072 | Move-in flow — Firefox | 1. Run move-in smoke test in Firefox project | Flow completes identically to Chromium | P1 | Regression | Yes |
| TC-073 | Move-in flow — Safari | 1. Run move-in smoke test in Safari project | Flow completes identically to Chromium | P1 | Regression | Yes |
| TC-074 | Move-in flow — Mobile Chrome (Pixel 7) | 1. Run move-in smoke in Mobile Chrome | Responsive layout, touch targets functional | P1 | Regression | Yes |
| TC-075 | Move-in flow — Mobile Safari (iPhone 14) | 1. Run move-in smoke in Mobile Safari | Responsive layout, iOS-specific behavior works | P1 | Regression | Yes |
| TC-076 | Overview dashboard — Mobile | 1. Sign in on mobile viewport | Sidebar collapses/hamburger, content reflows | P2 | Regression | Yes |
| TC-077 | Payment flow — Mobile | 1. Reach Stripe payment on mobile | Stripe iframe renders correctly at mobile width | P2 | Regression | Yes |

### Section 11: Known Issues Verification Checklist

| ID | Issue | Source | Status | Verified? |
|----|-------|--------|--------|-----------|
| KI-001 | /privacy-policy not working | Cian (Mar 18) | Open | [x] Verified — still broken |
| KI-002 | /terms-of-service not working | Cian (Mar 18) | Open | [x] Verified — still broken |
| KI-003 | Finish reg redirect → /_sso/sign-in broken | Cian (Mar 18) | Open | [x] Verified — redirect goes to /app/overview correctly (dashboard crashes separately) |
| KI-004 | Light "Learn more" triggers enroll | Cian (Mar 27) | Open | [ ] Not reached — need deeper Light flow |
| KI-005 | Light dialog modals (408a5c9) not applied | Cian (Mar 27) | Open | [ ] Not reached |
| KI-006 | Light DoB CSS (16ef214) not applied | Cian (Mar 27) | Open | [ ] Not reached |
| KI-007 | Non-encouraged + Encouraged Light "setup myself" broken | Cian (Mar 27) | Open | [x] Verified — works but adds extra encourage page step vs dev |
| KI-008 | Encouraged Light → /light shows non-encouraged screens | Cian (Mar 27) | Open | [x] FIXED — encouraged Light now shows correct screens (savings comparison). BUT txtest shows pgtest-style savings instead of "What's included" |
| KI-009 | Light account metadata not inserted | Cian (Mar 27) | Open | [ ] Not verified — would need DB check after full flow |
| KI-010 | TanStack no navigate API (window.location.href) | Tomy (Mar 18) | Known limitation | [x] Confirmed — full page reloads between steps |
| KI-011 | Sentry not integrated | Tomy (Mar 18) | Low priority | [ ] Not checked |

### Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-078 | Move-in creates CottageUser | After move-in: `SELECT * FROM "CottageUser" WHERE email = '<test_email>'` | User record created with correct fields | P0 |
| TC-079 | Move-in creates ElectricAccount | After move-in: `SELECT * FROM "ElectricAccount" WHERE "cottageUserID" = '<id>'` | Account record with correct utility, status = ELIGIBLE or ACTIVE | P0 |
| TC-080 | Light flow creates account metadata | After Light flow: check `ElectricAccount` + related metadata | Light-specific metadata inserted (KNOWN BUG — KI-009) | P0 |
| TC-081 | Non-billing move-in — maintainedFor is NULL | After non-billing move-in: check `ElectricAccount."maintainedFor"` | Value is NULL | P1 |
| TC-082 | Transfer updates account correctly | After transfer: check `ElectricAccount` fields | Old account deactivated, new account created | P1 |
| TC-083 | Finish registration links to existing Property | After finish-reg: check `CottageUser` + `Property` join | User linked to correct property and unit | P1 |

### UX & Improvement Opportunities

| ID | Screen/Step | Observation | Impact | Suggestion |
|----|------------|-------------|--------|------------|
| UX-001 | All navigation | TanStack uses `window.location.href` causing full page reloads instead of SPA transitions | Users experience flicker/white flash between steps, slower perceived performance | Implement TanStack Router's `useNavigate()` or `<Link>` for SPA navigation — this is a temporary workaround per Tomy's comment |
| UX-002 | /privacy-policy, /terms-of-service | Static pages broken — users clicking legal links from move-in flow hit errors | Trust erosion — legal pages are expected to work, especially during onboarding | Prioritize fix before merge — these are linked from agreement/terms steps |
| UX-003 | Finish registration redirect | Redirect to `/_sso/sign-in` fails | Users who complete registration via partner API link are stranded | Fix SSO redirect path or implement fallback to standard sign-in |
| UX-004 | Light flow — "Learn more" | Clicking informational link triggers enrollment action | Accidental enrollment — users lose control of their registration path | Fix is simple (`preventDefault`) but critical for user trust |
| UX-005 | Error boundaries | Framework migration may leave gaps in error handling | Users hit raw error screens instead of friendly error pages | Verify TanStack error boundaries exist for each route segment |
| UX-006 | Light "set it up myself" path | TanStack inserts an extra encourage page step before Contact Provider — dev goes directly | Extra click for users who want to self-manage — adds friction to the opt-out path | Remove the intermediate encourage page for Light off-ramp, route directly to Contact Provider like dev |

---

## Automation Plan

### Phase 1: Run Existing Suite Against TanStack Preview
The highest-value action is pointing the existing 245 tests at the TanStack preview URL. This catches the majority of regressions with zero new test code.

**How to execute:**
```bash
# Override baseURL to point at TanStack preview
PLAYWRIGHT_HTML_OPEN=never BASE_URL=https://cottage-nextjs-git-feat-tanstack-full-migration-cottage-team.vercel.app npx playwright test --project=Chromium
```
> Note: May need to add `BASE_URL` override support in `playwright.config.ts` if not already present, or create a temporary `tanstack` environment in `environmentBaseUrl.ts`.

**Smoke first** (fastest signal):
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Chromium
```

### Phase 2: Exploratory Testing (Manual)
- Framework-specific concerns (TC-017 through TC-020, TC-031, TC-068 through TC-071)
- Known issues verification (KI-001 through KI-011)
- Use Playwright MCP for interactive exploration against preview URL

### Phase 3: Cross-Browser (Post Smoke Pass)
```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Firefox
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Safari
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Mobile_Chrome
PLAYWRIGHT_HTML_OPEN=never npx playwright test --grep /@smoke/ --project=Mobile_Safari
```

### Phase 4: Full Regression (Post-Merge to Dev)
Run Regression1–7 scopes against `dev.publicgrid.energy` after the PR merges.

### Tag Assignments
- **Smoke**: TC-001, TC-002, TC-003, TC-008, TC-021, TC-032, TC-034, TC-043, TC-046, TC-048, TC-050, TC-055, TC-056, TC-063, TC-064
- **Regression1** (Chromium): TC-004–TC-007, TC-009–TC-016, TC-022–TC-030, TC-033, TC-041–TC-042, TC-044–TC-045, TC-051–TC-053, TC-057–TC-061, TC-065–TC-067, TC-072–TC-077
- **Exploratory**: TC-017–TC-020, TC-031, TC-035–TC-040, TC-047, TC-049, TC-054, TC-062, TC-068–TC-071, KI-001–KI-011

### New Tests Needed
No new test specs required for Phase 1 — the existing 46 specs / 245 tests cover the functional surface. New tests may be needed for:
- TanStack-specific navigation behavior (if `window.location.href` is permanent)
- Error boundary verification (if TanStack uses different error patterns)
- Image component assertions (if `unpic` has different loading behavior)

---

## Risks & Notes

### Critical Risks
1. **`window.location.href` navigation** — This causes full page reloads, which may break tests that rely on SPA navigation timing (e.g., `waitForURL`, `waitForNavigation`). Existing tests may need timeout adjustments.
2. **Env var mismatch** — TanStack preview uses Vite/Doppler for env vars. If Stripe keys, Supabase URL, or API endpoints aren't configured, payment and DB-dependent tests will fail.
3. **Preview URL may have different CORS/cookie behavior** — Vercel preview domains handle cookies differently than production domains. Auth-dependent tests may fail if session cookies don't persist.
4. **6 open Light flow bugs** — Light flow is currently broken in multiple ways. Block Light-related smoke tests until fixes land.

### Medium Risks
5. **Hydration mismatches** — TanStack SSR may produce different hydration behavior, causing visual flicker or state loss.
6. **Middleware gaps** — Auth guard middleware was "recently fixed" per Tomy — regression risk is high.
7. **Image rendering** — `unpic` behaves differently from `next/image` (no blur placeholder, different lazy loading strategy).

### Dependencies
- Tomy to fix known issues (KI-001–KI-009) before full QA pass
- Doppler env vars must be configured for TanStack preview
- May need `BASE_URL` or `tanstack` environment support in playwright.config.ts

### Recommended Test Sequence
1. Verify KI-001–KI-009 status with Tomy/Cian → skip tests for unfixed bugs
2. Run Smoke suite against preview URL → establish baseline pass rate
3. Exploratory session for framework-specific concerns (navigation, images, errors)
4. Run Regression1 against preview URL → full desktop coverage
5. Cross-browser smoke (Firefox, Safari, Mobile) → catch rendering differences
6. Post-merge: full Regression1–7 against dev environment

---

## Test Case Summary
| Category | Count | P0 | P1 | P2 |
|----------|-------|----|----|-----|
| Framework Parity (Routing/Nav) | 20 | 5 | 11 | 4 |
| Move-in (Standard) | 11 | 3 | 7 | 1 |
| Light Flow | 11 | 5 | 4 | 2 |
| Transfer | 3 | 1 | 2 | 0 |
| Finish Registration | 4 | 2 | 1 | 1 |
| Bill Upload / Verify Utilities | 5 | 1 | 4 | 0 |
| Post-Auth (Dashboard) | 8 | 2 | 4 | 2 |
| Payment (Stripe) | 5 | 2 | 3 | 0 |
| Images (unpic) | 4 | 0 | 2 | 2 |
| Cross-Browser/Mobile | 6 | 0 | 4 | 2 |
| DB Verification | 6 | 2 | 4 | 0 |
| **Total** | **83** | **23** | **46** | **14** |
| Known Issues | 11 | — | — | — |
| UX Opportunities | 5 | — | — | — |
