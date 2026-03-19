# Test Plan: ENG-2396 + ENG-2399 + ENG-2374 — Overview Sidebar & Non-Billing Subscriptions

## Overview
**Tickets**:
- [ENG-2396](https://linear.app/public-grid/issue/ENG-2396/task-overview-page-enhancements-dedicated-right-hand-sidebar) — Overview Page Enhancements: Dedicated Right-Hand Sidebar
- [ENG-2399](https://linear.app/public-grid/issue/ENG-2399/task-non-billing-subscriptions-front-end) — Non-billing Subscriptions (Front-end) — *sub-task of ENG-2396*
- [ENG-2374](https://linear.app/public-grid/issue/ENG-2374/task-enable-subscriptions-for-non-billing-users-services) — Enable subscriptions for non-billing users (Services)

**PRs**:
- [cottage-nextjs#1099](https://github.com/Cottage-Energy/cottage-nextjs/pull/1099) — Overview sidebar enhancement (ENG-2396, 28 files)
- [cottage-nextjs#1100](https://github.com/Cottage-Energy/cottage-nextjs/pull/1100) — Non-billing subscriptions FE (ENG-2399, 12 files)
- [services#281](https://github.com/Cottage-Energy/services/pull/281) — Non-billing subscriptions backend (ENG-2374, 1 file)

**Sources**:
- Linear: 3 tickets + implementation plan comments + DB migration + RLS policies
- Notion: [Overview Right-Hand Side Bar](https://www.notion.so/Overview-Right-Hand-Side-Bar-312ac7268ffc800e91c7ef5c79a1d494) — sidebar visibility conditions with CHANGE notes
- Figma: Inaccessible (file permission error) — nodes referenced: 4995:6780, 5121:11052, 4446:26247
- DB: Schema confirmed — `Building.offerRenewableEnergyDashboard` deployed, Subscription RLS updated

**Date**: 2026-03-18
**Tester**: Christian
**Created by**: Butch Castro (ENG-2396, ENG-2399), Cian Laguesma (ENG-2374)

---

## Context

### Why These Tickets Are Combined
ENG-2399 is a sub-task (parentId) of ENG-2396, and ENG-2374 is the backend counterpart to ENG-2399. Together they form one feature: **rebuild the overview sidebar AND extend subscriptions to non-billing users** across frontend and backend.

### Feature Summary

**ENG-2396 — Overview Sidebar**: Replaces 4 fragmented right-column rendering paths in `overview-components.tsx` with a unified `<OverviewSidebar>` component. The sidebar renders state-dependent cards in priority order. Desktop: 360px (22.5rem) alongside left content. Mobile: max 550px (34.375rem), stacks below.

**ENG-2399 — Non-billing Subscriptions (FE)**: Removes `isBillingCustomer` gates across 6 files so non-billing residents (`maintainedFor = null`) can see the Subscription tab, Payment tab, renewable energy cards, and manage subscriptions. Non-billing users without a payment method see subscriptions as "paused".

**ENG-2374 — Non-billing Subscriptions (Backend)**: Adds `cottageUserID` fallback in `getUserIDByPropertyID()` (services repo, `packages/users/repository.ts`) when `maintainedFor` is null, enabling subscription payment processing for non-billing users.

### Key Concepts

**Billing vs Non-billing**: `isBillingCustomer = !!account.maintainedFor`. When `maintainedFor` is null → non-billing. The `cottageUserID` on the ElectricAccount is the direct owner.

**Sidebar card priority order** (always top-to-bottom):
1. Inactive Account Card
2. Scheduled Move-Out Card
3. Recommended for You
4. Savings Card
5. Renewable Energy Card
6. GridRewards Card

**Sidebar visibility** (from Notion CHANGE):
- Sidebar renders for ALL users EXCEPT when `cottageConnectUserType = 'CUSTOMER'` AND the electric account status is a move-in status (NEW, NEED_VERIFICATION, etc.) that renders the setup tracker
- Returns `null` when no cards would qualify → page collapses to single-column

**Recommendation item visibility rules**:
- **"Search for savings"**: `enrollmentPreference === null` OR `enrollmentPreference === 'verification_only'` *(Notion CHANGE — implementation plan comment says only null; Notion confirms both)*
- **"Go 100% renewable"**: `building.offerRenewableEnergyDashboard = true` + `subscriptionConfiguration` exists + NO active subscription *(no isBillingCustomer gate — removed by ENG-2399)*
- **"Get paid to save energy"**: `electricAccountID` exists + `shouldShowDemandResponse = true` + `demandResponseProviderID` exists + `isOwner = true` + DR status NOT `ENROLLED` or `PENDING_ENROLLMENT`

**Renewable energy card states** (gate: `offerRenewableEnergyDashboard` + `subscriptionConfiguration` + active subscription):
| State | Condition | Shows |
|-------|-----------|-------|
| Paused | Active subscription, NO payment method | Orange info + "Add payment method" CTA |
| Active | Active subscription + payment method | kWh impact, "Manage" link, "See full impact" accordion |

**Savings card conditions** (from Notion):
- `enrollmentPreference` is NOT `verification_only`
- `savingsCardType` is NOT `none`

**New DB column**: `Building.offerRenewableEnergyDashboard` (boolean, NOT NULL, default `true`) — separate from move-in `offerRenewableEnergy` flag. Confirmed deployed in dev.

**RLS changes** (from ENG-2399 comments — confirmed deployed):
```sql
-- Subscription read + update policies now use OR logic:
ea."maintainedFor" = auth.uid() OR ea."cottageUserID" = auth.uid()
-- Same pattern for GasAccount
```

### Files Changed

**PR #1099 — Sidebar (28 files)**:
- New: `overview/_components/sidebar/` — `index.tsx`, `recommended-for-you.tsx`, `recommendation-item.tsx`, `use-recommendation-items.ts`, `renewable-card.tsx`, `grid-rewards-card.tsx`, `how-renewable-works-sheet.tsx`, `search-for-savings-sheet.tsx`, `inactive-account-card.tsx`, `scheduled-move-out-card.tsx`
- Modified: `overview-components.tsx` (all 4 rendering paths), `render-logic.ts`, savings cards, `monitor-savings-bill-upload.tsx`, `setup-tracker/tracker.tsx`
- New icons: `seedling.svg`, `search-refraction.svg`, `savings-active.svg`, `renewable-variant.svg`, `renewable-co2.svg`, `renewable-tree.svg`, `renewable-car.svg`
- Types: `database-generated.types.ts`, `resident-details.ts`

**PR #1100 — Non-billing FE (12 files)**:
- `account-tabs.tsx` — remove `isBillingCustomer` from `showSubscriptionsTab`
- `user-dropdown.tsx` — ungate subscription/payment menu items
- `property-card.tsx` — show RE card for non-billing, wrap savings header in billing check
- `requirements-resolver.ts` — remove `isUtilityHandleBilling` gate from `isOfferingRenewableEnergy()`
- `move-in.tsx` — remove `hasSelectedRenewableEnergy → true` early return in `shouldSetupPayment`
- `tracker-setup-renewable-energy.tsx` — ungate RE offer in setup tracker
- `subscription-status-badge.tsx`, `subscription-action-button.tsx`, `subscription-row.tsx`, `subscription-row-mobile.tsx` — subscription UI adjustments
- `subscriptions/types.ts`, `subscriptions/utils.ts` — type/utility updates

**PR #281 — Non-billing backend (1 file)**:
- `packages/users/repository.ts` — `getUserIDByPropertyID()` adds `cottageUserID` fallback

### Discrepancies Found

| Item | Implementation Comment | Notion (latest) | Resolution |
|------|----------------------|-----------------|------------|
| "Search for savings" visibility | Only when `enrollmentPreference === null` | `null` OR `verification_only` (CHANGE note) | **Test Notion version** — Notion has explicit CHANGE note |
| "Go 100% renewable" | Requires `isBillingCustomer = true` | No `isBillingCustomer` gate | **Test Notion version** — aligns with ENG-2399 removing gate |
| Savings card `switch` type | Listed in savingsCardType table as "verification_only retargeting" | Savings card suppressed when `verification_only` | **Flag to dev** — `switch` card may never render if savings card is hidden for `verification_only` users |

---

## Scope

### In Scope
- Overview sidebar layout, responsiveness, and card rendering for all account states
- Sidebar visibility/hidden logic per Notion CHANGE (CUSTOMER + move-in status)
- Recommendation card visibility per all 3 items' rules
- Recommendation item interactions (sheet/modal opens)
- Savings card all 7 savingsCardType states
- Renewable energy card: paused + active states
- GridRewards card: enrolled + pending states
- Card priority ordering
- Non-billing user: Subscription tab, Payment tab, dropdown menu visibility
- Non-billing user: activate, cancel, view subscription
- Non-billing user: paused subscription + add payment method flow
- Non-billing user: renewable card in overview sidebar
- Non-billing user: RE offer during move-in (no forced payment for non-billing)
- Non-billing user: backend subscription payment processing (getUserIDByPropertyID fallback)
- Supabase RLS: non-billing read + update on Subscription table
- Billing user regression: all existing subscription + overview flows unchanged

### Out of Scope
- Energy events card (designs to follow — per ticket)
- Stripe payment processing internals
- Inngest subscription processing logic (covered in ENG-2440 test plan)
- Figma pixel-perfect comparison (Figma inaccessible; visual regression not set up)
- `SavingsAlertsSwitchCard` removal + `'switch'` savingsCardType removal (per ticket, but needs dev confirmation)

### Prerequisites
- All 3 PRs deployed to dev: cottage-nextjs #1099 + #1100, services #281
- `Building.offerRenewableEnergyDashboard` column deployed (confirmed)
- Subscription RLS policies updated (confirmed)
- Test users across billing states (see Test Data)
- Buildings with various feature flag combinations

### Dependencies
- cottage-nextjs deployment (PRs #1099, #1100)
- services deployment (PR #281)
- `SubscriptionConfiguration` must exist for test utility companies (links to pricing)

---

## Test Cases

### 1. Sidebar Visibility & Layout

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-001 | Sidebar renders at 360px on desktop | Active user with at least 1 qualifying card, desktop viewport | 1. Sign in 2. Navigate to `/app/overview` 3. Inspect sidebar element width | Sidebar is 360px (22.5rem) wide in a flex row alongside left-column content | P1 | Yes |
| TC-002 | Sidebar stacks below main content on mobile | Same user, mobile viewport (e.g., Mobile Safari project) | 1. Sign in on mobile 2. Navigate to overview | Sidebar stacks below main content, max 550px (34.375rem) wide | P1 | Yes |
| TC-003 | Sidebar returns null when no cards qualify | User with `enrollmentPreference: 'automatic'`, building has `shouldShowDemandResponse: false`, `offerRenewableEnergyDashboard: false`, no subscription, no DR enrollment, `savingsCardType: 'none'` | 1. Sign in 2. Navigate to overview | Page is single-column; no sidebar element rendered | P1 | Yes |
| TC-004 | Sidebar hidden for CUSTOMER + move-in status | `cottageConnectUserType = 'CUSTOMER'`, `electricAccountStatus` is a move-in status (e.g., NEW, NEED_VERIFICATION) that renders setup tracker | 1. Sign in 2. Navigate to overview | No sidebar; only setup tracker in main column | P0 | Yes |
| TC-005 | Sidebar SHOWN for CUSTOMER with non-move-in status | `cottageConnectUserType = 'CUSTOMER'`, `electricAccountStatus = 'ACTIVE'` | 1. Sign in 2. Navigate to overview | Sidebar IS visible with qualifying cards (CHANGE: sidebar shows for all non-move-in states) | P0 | Yes |
| TC-006 | Sidebar shown for BILL_UPLOAD user | `cottageConnectUserType = 'BILL_UPLOAD'`, any status | 1. Sign in 2. Navigate to overview | Sidebar visible with qualifying cards | P1 | Yes |
| TC-007 | Sidebar shown for non-connect user (standard move-in) | Regular move-in user, `electricAccountStatus = 'ACTIVE'` | 1. Sign in 2. Navigate to overview | Sidebar visible with qualifying cards | P1 | Yes |

### 2. Recommended For You — Item Visibility

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-010 | All 3 recommendations for brand new user | `enrollmentPreference: null`, no subscription, no DR enrollment, `isOwner: true`, building: `shouldShowDemandResponse: true`, `offerRenewableEnergyDashboard: true`, `subscriptionConfiguration` exists | 1. Sign in 2. Navigate to overview | "Recommended for you" card with 3 items: "Search for savings" (piggy bank icon, "Alerts only, no strings attached"), "Go 100% renewable" (seedling icon, "$X.XX/mo"), "Get paid to save energy" (dollar icon, "~$100/year · Free SMS program") | P0 | Yes |
| TC-011 | "Search for savings" shows for verification_only user | `enrollmentPreference: 'verification_only'`, no subscription, no DR, `isOwner: true`, building supports DR + renewable | 1. Sign in 2. Navigate to overview | "Recommended for you" with all 3 items — "Search for savings" IS shown (Notion CHANGE) | P0 | Yes |
| TC-012 | "Search for savings" hidden after savings opt-in (automatic) | `enrollmentPreference: 'automatic'`, no subscription, no DR, building supports DR + renewable | 1. Sign in 2. Navigate to overview | "Recommended for you" with 2 items: "Go 100% renewable" + "Get paid to save energy". "Search for savings" NOT shown | P0 | Yes |
| TC-013 | "Search for savings" hidden after savings opt-in (manual) | `enrollmentPreference: 'manual'`, same building | 1. Sign in 2. Navigate to overview | "Search for savings" NOT shown; 2 items remain | P1 | Yes |
| TC-014 | "Go 100% renewable" hidden when active subscription exists | Active subscription (any state), building supports renewable | 1. Sign in 2. Navigate to overview | "Go 100% renewable" NOT in recommendations (renewable card shows instead) | P0 | Yes |
| TC-015 | "Go 100% renewable" hidden when offerRenewableEnergyDashboard is false | `offerRenewableEnergyDashboard: false` on building | 1. Sign in 2. Navigate to overview | "Go 100% renewable" NOT shown | P1 | Yes |
| TC-016 | "Go 100% renewable" hidden when no subscriptionConfiguration | Building has `offerRenewableEnergyDashboard: true` but no `SubscriptionConfiguration` record | 1. Sign in 2. Navigate to overview | "Go 100% renewable" NOT shown (no pricing available) | P1 | No |
| TC-017 | "Go 100% renewable" shows for non-billing user | Non-billing user (`maintainedFor: null`), building supports renewable, no subscription | 1. Sign in 2. Navigate to overview | "Go 100% renewable" IS shown (isBillingCustomer gate removed by ENG-2399) | P0 | Yes |
| TC-018 | "Get paid to save energy" hidden for non-owner | `isOwner: false`, building supports DR, not enrolled | 1. Sign in as non-owner 2. Navigate to overview | "Get paid to save energy" NOT shown; other items visible | P1 | Exploratory |
| TC-019 | "Get paid to save energy" hidden when DR enrolled | DR status: `ENROLLED`, building supports DR | 1. Sign in 2. Navigate to overview | "Get paid to save energy" NOT shown; GridRewards card appears instead | P1 | Yes |
| TC-020 | "Get paid to save energy" hidden when DR pending | DR status: `PENDING_ENROLLMENT` | 1. Sign in 2. Navigate to overview | "Get paid to save energy" NOT shown; GridRewards pending card appears | P1 | Yes |
| TC-021 | "Get paid to save energy" hidden when shouldShowDemandResponse is false | `shouldShowDemandResponse: false`, not enrolled | 1. Sign in 2. Navigate to overview | "Get paid to save energy" NOT shown | P1 | No |
| TC-022 | No recommendations when all fulfilled | `enrollmentPreference: 'automatic'`, active subscription, DR enrolled | 1. Sign in 2. Navigate to overview | No "Recommended for you" card at all | P0 | Yes |
| TC-023 | No recommendations in building without DR or renewable | `shouldShowDemandResponse: false`, `offerRenewableEnergyDashboard: false`, `enrollmentPreference: 'automatic'` | 1. Sign in 2. Navigate to overview | No "Recommended for you" card | P1 | Yes |
| TC-024 | Recommended for you hidden during inactive status | `utilityStatus: 'inactive'`, building supports DR + renewable | 1. Sign in 2. Navigate to overview | NO "Recommended for you" card (Notion CHANGE: hidden for INACTIVE) | P0 | Yes |
| TC-025 | Recommended for you hidden during pending-stop-service | `utilityStatus: 'pending-stop-service'`, building supports DR + renewable | 1. Sign in 2. Navigate to overview | NO "Recommended for you" card (Notion CHANGE: hidden for PENDING_STOP_SERVICE) | P0 | Yes |

### 3. Recommended For You — Interactions

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-030 | "Search for savings" click opens SearchForSavingsSheet | `enrollmentPreference: null`, building supports savings | 1. Sign in 2. Click "Search for savings" item | SearchForSavingsSheet dialog opens with: savings info, alerts toggle, auto-apply toggle, enrollment preference update | P1 | Yes |
| TC-031 | "Go 100% renewable" — "More" opens HowRenewableWorksSheet | No active subscription, building has `subscriptionConfiguration` | 1. Sign in 2. Click "More" on "Go 100% renewable" | HowRenewableWorksSheet opens with: how it works, pricing from `subscriptionConfiguration.monthlyFee`, CTA button | P1 | Yes |
| TC-032 | "Go 100% renewable" shows dynamic pricing | `subscriptionConfiguration.monthlyFee` configured | 1. Sign in 2. Check "Go 100% renewable" description | Shows "$X.XX/mo" with actual `monthlyFee` from config (NOT hardcoded $3.29) | P1 | Exploratory |
| TC-033 | "Get paid to save energy" — "More" opens DemandResponseEnrollModal | `shouldShowDemandResponse: true`, `isOwner: true`, not enrolled | 1. Sign in 2. Click "More" on "Get paid to save energy" | DemandResponseEnrollModal opens | P1 | Yes |

### 4. Status Cards (Inactive / Scheduled Move-Out)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-040 | Inactive account card at TOP of sidebar | `utilityStatus: 'inactive'` | 1. Sign in 2. Navigate to overview | InactiveAccountCard at top of sidebar showing deactivation date. NO "Recommended for you" card. Other qualifying cards (savings, renewable, GridRewards) appear below | P1 | Exploratory |
| TC-041 | Scheduled move-out card at TOP of sidebar | `utilityStatus: 'pending-stop-service'` | 1. Sign in 2. Navigate to overview | ScheduledMoveOutCard at top showing move-out info + "Cancel move-out?" button. NO "Recommended for you" card | P1 | Exploratory |
| TC-042 | Cancel move-out confirmation modal | Same as TC-041 | 1. Click "Cancel move-out?" button 2. Verify modal | Confirmation modal appears with cancel option | P2 | Exploratory |
| TC-043 | Cancel move-out action succeeds | Same as TC-041 | 1. Click "Cancel move-out?" 2. Confirm in modal | Move-out cancelled; card disappears; sidebar re-evaluates (Recommended for you may now appear) | P2 | Exploratory |

### 5. Savings Card

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-050 | No savings card when enrollmentPreference is null | `enrollmentPreference: null` | 1. Sign in 2. Navigate to overview | No savings card in sidebar (user hasn't opted in yet) | P1 | Yes |
| TC-051 | No savings card when enrollmentPreference is verification_only | `enrollmentPreference: 'verification_only'` | 1. Sign in 2. Navigate to overview | No savings card in sidebar (user opted out) | P1 | Yes |
| TC-052 | Savings card — setup_complete state | `enrollmentPreference: 'automatic'`, `savingsCardType: 'setup_complete'` | 1. Sign in 2. Navigate to overview | Savings card shows "Looking for savings" with "Searching" badge | P1 | Yes |
| TC-053 | Savings card — not_enabled state | `savingsCardType: 'not_enabled'` | 1. Sign in 2. Navigate to overview | Savings card shows "Looking for savings" searching state | P1 | No |
| TC-054 | Savings card — in_progress state | `savingsCardType: 'in_progress'` | 1. Sign in 2. Navigate to overview | Savings card shows "Looking for savings" searching state | P1 | Yes |
| TC-055 | Savings card — enrolled_programs state | `savingsCardType: 'enrolled_programs'`, active savings | 1. Sign in 2. Navigate to overview | Savings card shows enrolled programs with green "Active" badge + lifetime savings amount | P0 | Yes |
| TC-056 | Savings card — auto_apply maps to searching in sidebar | `savingsCardType: 'auto_apply'`, bill upload user | 1. Sign in 2. Navigate to overview | Sidebar shows "Looking for savings" card (searching state). Auto-apply card renders in LEFT column only | P2 | Exploratory |
| TC-057 | Savings card — none state | `savingsCardType: 'none'` | 1. Sign in 2. Navigate to overview | No savings card in sidebar | P1 | No |

### 6. Renewable Energy Card

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-060 | Renewable card — Active state | Active subscription + payment method on file, `offerRenewableEnergyDashboard: true`, `subscriptionConfiguration` exists | 1. Sign in 2. Navigate to overview | Renewable energy card shows: kWh of lifetime clean energy stat, renewable illustration, "Manage" link | P0 | Yes |
| TC-061 | Renewable card — "See full impact" accordion | Same as TC-060 | 1. Click "See full impact" | Accordion expands showing: lbs CO2 prevented (icon), trees planted (icon), fewer miles driven (icon) | P1 | Yes |
| TC-062 | Renewable card — "Manage" navigates to subscriptions tab | Same as TC-060 | 1. Click "Manage" link | Navigates to `/app/account?tabValue=subscriptions` | P1 | Yes |
| TC-063 | Renewable card — Paused state (no payment method) | Active subscription + NO payment method | 1. Sign in 2. Navigate to overview | Orange info icon with concentric rings, "Add a payment method to activate your clean energy subscription." message, "Add payment method" button (not full-width), "Manage" link | P0 | Yes |
| TC-064 | Renewable card — "Add payment method" opens sheet | Same as TC-063 | 1. Click "Add payment method" | PaymentMethodFormSheet opens for payment method entry | P1 | Yes |
| TC-065 | Renewable card — Paused still hides renewable recommendation | Active subscription (paused), no payment method | 1. Sign in 2. Check "Recommended for you" | "Go 100% renewable" NOT in recommendations (subscription exists, just paused) | P1 | Exploratory |
| TC-066 | No renewable card when no subscription | No active subscription, building supports renewable | 1. Sign in 2. Navigate to overview | No renewable energy card; "Go 100% renewable" appears in Recommended instead | P1 | Yes |
| TC-067 | No renewable card when offerRenewableEnergyDashboard is false | `offerRenewableEnergyDashboard: false`, active subscription | 1. Sign in 2. Navigate to overview | No renewable energy card (gate fails) | P1 | No |
| TC-068 | No renewable card when no subscriptionConfiguration | `offerRenewableEnergyDashboard: true`, no config, active subscription | 1. Sign in 2. Navigate to overview | No renewable energy card (gate fails) | P2 | No |

### 7. GridRewards Card

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-070 | GridRewards — Enrolled state (owner) | DR status: `ENROLLED`, `isOwner: true` | 1. Sign in 2. Navigate to overview | GridRewards card with green "Enrolled" badge, status text, "Manage enrollment" button | P1 | Yes |
| TC-071 | GridRewards — Enrolled state (non-owner) | DR status: `ENROLLED`, `isOwner: false` | 1. Sign in 2. Navigate to overview | GridRewards card with "Enrolled" badge but NO "Manage enrollment" button | P1 | Exploratory |
| TC-072 | GridRewards — Pending state | DR status: `PENDING_ENROLLMENT` | 1. Sign in 2. Navigate to overview | GridRewards card with orange "Pending" badge, processing message, NO "Manage enrollment" button | P1 | Yes |
| TC-073 | GridRewards shows regardless of shouldShowDemandResponse flag | DR enrolled, `shouldShowDemandResponse: false` | 1. Sign in 2. Navigate to overview | GridRewards card STILL appears (user already in program) | P2 | Exploratory |
| TC-074 | GridRewards — "Manage enrollment" opens modal | DR enrolled, `isOwner: true` | 1. Click "Manage enrollment" | DemandResponseManageModal opens | P1 | Exploratory |

### 8. Card Priority Order

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-080 | Full card stack — correct order | User with: inactive status + savings (enrolled_programs) + active renewable + DR enrolled | 1. Sign in 2. Navigate to overview 3. Verify card order top-to-bottom | 1. InactiveAccountCard → 2. Savings (Active) → 3. Renewable → 4. GridRewards. NO Recommended (inactive hides it) | P1 | Yes |
| TC-081 | Active user — all cards present | `enrollmentPreference: 'automatic'`, savings searching + active renewable + DR enrolled | 1. Sign in 2. Navigate to overview | No Recommended (all fulfilled) → Savings (searching) → Renewable (active) → GridRewards (enrolled) | P1 | Yes |
| TC-082 | Status card always at top | Scheduled move-out + savings + GridRewards | 1. Sign in 2. Verify order | ScheduledMoveOutCard first, then Savings, then GridRewards | P1 | Exploratory |

### 9. Bill Upload / Connect User — Sidebar Specifics

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-085 | Bill upload user sidebar | `cottageConnectUserType: 'BILL_UPLOAD'`, `enrollmentPreference: 'manual'`, `savingsCardType: 'auto_apply'`, building supports DR + renewable, `isOwner: true` | 1. Sign in 2. Navigate to overview | Left column: SetupComplete + SavingsAutoApply + FAQs. Sidebar: "Recommended for you" (renewable + DR items), "Searching for savings" card (auto_apply → in_progress in sidebar) | P2 | Exploratory |
| TC-086 | Non-billing connect user with RE offer in setup tracker | Non-billing user, `cottageConnectUserType: 'BILL_UPLOAD'`, building offers renewable | 1. Sign in 2. Navigate to overview | Setup tracker shows RE offer (ungated by ENG-2399 `tracker-setup-renewable-energy.tsx` change) | P1 | Exploratory |

---

### 10. Non-Billing Subscriptions — Tab & Menu Visibility (ENG-2399)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-100 | Non-billing user sees Subscription tab | Non-billing user (`maintainedFor = null`), utility has `SubscriptionConfiguration` | 1. Sign in 2. Navigate to `/app/account` | "Subscriptions" tab visible in account tabs | P0 | Yes |
| TC-101 | Non-billing user sees Payment tab (via subscription) | Non-billing user with `showSubscriptionsTab = true` | 1. Sign in 2. Navigate to `/app/account` | "Payment" tab visible (`canEditPaymentMethod = isBillingCustomer \|\| showSubscriptionsTab`) | P0 | Yes |
| TC-102 | Non-billing user sees subscription in header dropdown | Non-billing user, utility offers RE | 1. Sign in 2. Click user avatar/dropdown | "Subscriptions" and "Payment" items visible in dropdown menu | P1 | Yes |
| TC-103 | Non-billing user — no Subscription tab when utility doesn't offer RE | Non-billing user, utility has no `SubscriptionConfiguration` | 1. Sign in 2. Navigate to `/app/account` | No "Subscriptions" tab | P1 | Exploratory |
| TC-104 | Billing user still sees tabs (regression) | Billing user (`maintainedFor` set), utility offers RE | 1. Sign in 2. Navigate to `/app/account` | "Subscriptions" and "Payment" tabs visible — no regression | P0 | Yes |

### 11. Non-Billing Subscriptions — View / Activate / Cancel (ENG-2399)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-110 | Non-billing user views subscription details | Non-billing user with active subscription | 1. Sign in 2. Go to Account → Subscriptions tab | Subscription row visible: plan name, price (`monthlyFee`), status badge, action button | P0 | Yes |
| TC-111 | Non-billing user activates new subscription | Non-billing user, no existing subscription, utility offers RE | 1. Sign in 2. Go to Subscriptions tab 3. Click activate 4. Add payment method if prompted 5. Confirm | New subscription created; status badge shows active/pending; subscription row appears | P0 | Yes |
| TC-112 | Non-billing user cancels subscription | Non-billing user with active subscription | 1. Sign in 2. Go to Subscriptions tab 3. Click cancel action 4. Confirm cancellation | Subscription cancelled; status updated; row reflects cancelled state | P0 | Yes |
| TC-113 | Non-billing user — paused subscription (no payment method) | Non-billing user, active subscription, NO payment method on file | 1. Sign in 2. Go to Subscriptions tab OR overview | Subscription shows as "Paused" with prompt to add payment method | P0 | Yes |
| TC-114 | Non-billing user — add payment method from paused prompt | Same as TC-113 | 1. Click "Add payment method" prompt 2. Enter valid test card (4242...) 3. Submit | Payment method saved; subscription status changes from paused | P0 | Yes |
| TC-115 | Non-billing user sees renewable card in overview sidebar | Non-billing user with active subscription + payment method | 1. Sign in 2. Navigate to overview | Renewable energy card appears in sidebar (not gated by isBillingCustomer) | P1 | Yes |
| TC-116 | Non-billing user — PropertyCard shows RE section only (no savings header) | Non-billing user, building supports RE | 1. Sign in 2. Navigate to overview | RE section visible in PropertyCard; "Savings" header + divider NOT shown (wrapped in isBillingCustomer check per PR #1100) | P1 | Exploratory |
| TC-117 | Billing user activate/cancel still works (regression) | Billing user with subscription | 1. Activate subscription 2. Cancel subscription | Both actions succeed — no regression | P0 | Yes |

### 12. Non-Billing Subscriptions — Move-in Flow (ENG-2399)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-120 | Non-billing user sees RE option during onboarding | Non-billing building (`isHandleBilling: false`), utility offers RE | 1. Start move-in flow 2. Reach renewable energy step | Renewable energy subscription option is available (isOfferingRenewableEnergy no longer gated by isUtilityHandleBilling) | P1 | Exploratory |
| TC-121 | Non-billing user selects RE — NO forced payment setup | Same as TC-120 | 1. Select renewable subscription 2. Continue flow | Flow does NOT force payment setup step (shouldSetupPayment falls through to isHandleBilling=false). User completes registration without payment | P1 | Exploratory |
| TC-122 | Non-billing user skips RE — no payment step | Non-billing building, user does NOT select RE | 1. Start move-in 2. Skip RE 3. Continue | No payment setup step | P1 | Exploratory |
| TC-123 | Billing user with RE still gets payment step (regression) | Billing building (`isHandleBilling: true`), user selects RE | 1. Start move-in 2. Select RE | Payment setup step IS required — no regression | P1 | Exploratory |

### 13. Non-Billing Subscriptions — Backend & RLS (ENG-2374)

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-130 | Subscription charge generated for non-billing user | Non-billing user with active subscription + payment method + pending `SubscriptionMetadata` | 1. Trigger `transaction-generation-trigger` via Inngest 2. Trigger `subscriptions-payment-trigger` 3. Check `Payment` table | Payment record created for non-billing user with correct amount and `contributions.renewableSubscriptionID` | P0 | Exploratory |
| TC-131 | Non-billing user receives renewal reminder email | Non-billing user with upcoming charge (within `notificationLeadDays`) | 1. Trigger reminder flow 2. Check email inbox | Renewal reminder email received at user's email | P1 | Exploratory |
| TC-132 | Non-billing user — missing payment method triggers email (not silent failure) | Non-billing user, active subscription, NO payment method | 1. Trigger subscription payment 2. Check email | "Update payment method" email sent | P1 | Exploratory |
| TC-133 | RLS — non-billing user can read own Subscription | Non-billing user, active subscription | 1. Sign in as non-billing user 2. Navigate to Subscriptions tab | Subscription data loads successfully (RLS: `cottageUserID = auth.uid()` path) | P0 | Yes |
| TC-134 | RLS — non-billing user can update own Subscription | Non-billing user, active subscription | 1. Sign in 2. Cancel subscription (triggers UPDATE) | Cancellation succeeds; row updated (RLS update policy uses same OR logic) | P0 | Yes |
| TC-135 | RLS — billing user still reads via maintainedFor (regression) | Billing user, active subscription | 1. Sign in 2. Navigate to Subscriptions tab | Subscription data loads (RLS: `maintainedFor = auth.uid()` path still works) | P0 | Yes |
| TC-136 | getUserIDByPropertyID resolves non-billing user | Non-billing user's property | Verify via backend log or DB: `getUserIDByPropertyID()` returns `cottageUserID` when `maintainedFor` is null | Returns correct user UUID | P0 | Unit test (services repo) |
| TC-137 | Billing user payment still processes (regression) | Billing user with active subscription + pending metadata | 1. Trigger payment flow 2. Check Payment table | Payment processed correctly — `maintainedFor` path still resolves | P0 | Exploratory |

### 14. Billing User Overview Regression

| ID | Title | Preconditions | Steps | Expected Result | Priority | Automate? |
|----|-------|---------------|-------|-----------------|----------|-----------|
| TC-140 | Billing user overview sidebar renders correctly | Billing user, various feature flags, active savings | 1. Sign in 2. Navigate to overview | Sidebar renders with correct cards — savings, recommendations, etc. match billing user's state. No visual regression from sidebar refactor | P0 | Yes |
| TC-141 | Billing user PropertyCard shows savings header + RE section | Billing user, building supports RE | 1. Sign in 2. Navigate to overview | PropertyCard shows "Savings" header with badge + divider + RE section (both visible for billing users) | P1 | Yes |

---

## Database Verification

| ID | Title | Query/Check | Expected Result | Priority |
|----|-------|-------------|-----------------|----------|
| TC-150 | `offerRenewableEnergyDashboard` column exists and defaults true | `SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'Building' AND column_name = 'offerRenewableEnergyDashboard'` | Column exists, `data_type = boolean`, `column_default = true` | P0 |
| TC-151 | Subscription RLS read policy includes OR logic | `SELECT policyname, qual FROM pg_policies WHERE tablename = 'Subscription' AND cmd = 'SELECT'` | `Enable read access for owner` policy includes `maintainedFor = auth.uid() OR cottageUserID = auth.uid()` for both ElectricAccount and GasAccount | P0 |
| TC-152 | Subscription RLS update policy includes OR logic | Same query with `cmd = 'UPDATE'` | `Owner can update subscription` policy includes same OR logic | P0 |
| TC-153 | SubscriptionConfiguration linked to test utility | Query SubscriptionConfiguration for test utility's config | Config exists with `monthlyFee`, `name`, `type` populated | P1 |

---

## Automation Plan

### Smoke (P0 — critical path)
TC-004, TC-005, TC-010, TC-011, TC-017, TC-022, TC-024, TC-025, TC-055, TC-060, TC-063, TC-100, TC-101, TC-104, TC-110, TC-111, TC-112, TC-113, TC-114, TC-117, TC-133, TC-134, TC-135, TC-140

### Regression (P1 — broader coverage)
TC-001–TC-003, TC-006–TC-007, TC-012–TC-015, TC-019–TC-020, TC-023, TC-030–TC-031, TC-033, TC-050–TC-052, TC-054, TC-061–TC-062, TC-064, TC-066, TC-070, TC-072, TC-080–TC-081, TC-102, TC-115, TC-141

### Exploratory Only (manual — complex state or timing)
TC-018, TC-032, TC-040–TC-043, TC-056, TC-065, TC-067–TC-068, TC-071, TC-073–TC-074, TC-082, TC-085–TC-086, TC-103, TC-116, TC-120–TC-123, TC-130–TC-132, TC-137

### Unit/Integration Tests (recommend to dev team)
- TC-136: `getUserIDByPropertyID()` fallback — unit test in services repo
- `isOfferingRenewableEnergy()` without `isUtilityHandleBilling` gate — unit test
- `shouldSetupPayment` guard with non-billing + RE selected — unit test
- `use-recommendation-items` hook — all 3 items visibility matrix — component test
- Renewable card state resolution (paused vs active) — component test
- `savingsCardType` → sidebar card mapping — component test

---

## Test Data Requirements

| User Type | Key Fields | Purpose |
|-----------|-----------|---------|
| **Billing user (active)** | `maintainedFor` set, `ACTIVE` status, savings enrolled, building supports DR + RE | Regression baseline: TC-104, TC-117, TC-135, TC-137, TC-140, TC-141 |
| **Non-billing user (active)** | `maintainedFor = null`, `ACTIVE`, utility with `SubscriptionConfiguration` | Core non-billing tests: TC-100–TC-116, TC-130–TC-134 |
| **Non-billing user with subscription** | Same + active `Subscription` record | Subscription management: TC-110–TC-115, TC-133–TC-134 |
| **Non-billing user (no payment method)** | Same + subscription but no Stripe payment method | Paused state: TC-063, TC-113–TC-114 |
| **Brand new user** | `enrollmentPreference: null`, no subscription, no DR | Recommendation visibility: TC-010, TC-050 |
| **Verification-only user** | `enrollmentPreference: 'verification_only'` | "Search for savings" CHANGE test: TC-011, TC-051 |
| **Automatic savings user** | `enrollmentPreference: 'automatic'`, savings searching | Savings card + reduced recommendations: TC-012, TC-052–TC-054 |
| **Fully active user** | Savings enrolled + RE subscription (active + payment) + DR enrolled | All fulfilled: TC-022, TC-055, TC-060, TC-070, TC-081 |
| **Inactive account user** | `utilityStatus: 'inactive'` | Status card: TC-024, TC-040, TC-080 |
| **Scheduled move-out user** | `utilityStatus: 'pending-stop-service'` | Status card: TC-025, TC-041–TC-043, TC-082 |
| **CUSTOMER + move-in status** | `cottageConnectUserType: 'CUSTOMER'`, status = `NEW` or `NEED_VERIFICATION` | Sidebar hidden: TC-004 |
| **CUSTOMER + active status** | `cottageConnectUserType: 'CUSTOMER'`, status = `ACTIVE` | Sidebar shown: TC-005 |
| **BILL_UPLOAD user** | `cottageConnectUserType: 'BILL_UPLOAD'`, `auto_apply` state | Bill upload sidebar: TC-006, TC-085–TC-086 |
| **Building (full features)** | `shouldShowDemandResponse: true`, `offerRenewableEnergyDashboard: true`, `SubscriptionConfiguration` exists, `demandResponseProviderID` set | Most sidebar tests |
| **Building (no features)** | `shouldShowDemandResponse: false`, `offerRenewableEnergyDashboard: false`, no config | Null sidebar: TC-003, TC-023 |

### DB Discovery Queries
```sql
-- Note: User table is "CottageUsers" (plural). Property FK discovery needed.
-- Discover Property columns for user join
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Property' ORDER BY ordinal_position;

-- Find non-billing users
SELECT ea."cottageUserID", ea."maintainedFor", ea.status, ea."propertyID"
FROM "ElectricAccount" ea
WHERE ea."maintainedFor" IS NULL AND ea.status = 'ACTIVE'
LIMIT 10;

-- Find billing users
SELECT ea."cottageUserID", ea."maintainedFor", ea.status, ea."propertyID"
FROM "ElectricAccount" ea
WHERE ea."maintainedFor" IS NOT NULL AND ea.status = 'ACTIVE'
LIMIT 10;

-- Find active subscriptions with billing type
SELECT s.id, s.status, s."propertyID", ea."maintainedFor",
       CASE WHEN ea."maintainedFor" IS NULL THEN 'non-billing' ELSE 'billing' END as type
FROM "Subscription" s
JOIN "ElectricAccount" ea ON ea."propertyID" = s."propertyID"
WHERE s.status = 'active'
LIMIT 10;

-- Find buildings with renewable support
SELECT b.id, b."offerRenewableEnergyDashboard", b."shouldShowDemandResponse",
       b."demandResponseProviderID"
FROM "Building" b
WHERE b."offerRenewableEnergyDashboard" = true
LIMIT 10;

-- Verify RLS policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'Subscription';

-- Check SubscriptionConfiguration
SELECT * FROM "SubscriptionConfiguration" LIMIT 5;
```

---

## Risks & Notes

1. **Discrepancy: "Search for savings" visibility** — Implementation plan comment says only `enrollmentPreference === null`. Notion CHANGE note says `null` OR `verification_only`. **Test the Notion version** and flag if implementation doesn't match.

2. **`savingsCardType: 'switch'` may be dead code** — Notion says savings card is suppressed when `verification_only`, but `switch` type is described as "for verification_only retargeting". If the card is hidden for `verification_only` users, the `switch` state can never render. **Confirm with dev team** whether `switch` is being removed (ticket mentions removing `SavingsAlertsSwitchCard`).

3. **Non-billing test users may be scarce** — Most dev test users are billing (`maintainedFor` set). May need to create new users via non-billing buildings or modify `maintainedFor` to null in DB.

4. **Three PRs must be co-deployed** — Sidebar (PR #1099) and non-billing FE (PR #1100) are in cottage-nextjs; backend (PR #281) is in services. Testing requires all three deployed to dev simultaneously.

5. **Sidebar refactor is HIGH-RISK** — PR #1099 touches all 4 rendering paths in `overview-components.tsx` (28 files total). Regression risk for existing billing users is significant. Prioritize TC-140 (billing overview regression) early.

6. **RLS verified deployed** — Subscription read + update policies already include the `cottageUserID` OR logic in dev. DB verification tests (TC-150–TC-152) are confirmation only.

7. **Figma inaccessible** — All 3 Figma nodes returned access errors. Cannot verify pixel-level design specs. Rely on implementation plan descriptions + Notion content for expected UI.

8. **`offerRenewableEnergyDashboard` vs `offerRenewableEnergy`** — Two separate flags. The dashboard flag (new, defaults `true`) gates the sidebar renewable card + "Go 100% renewable" recommendation. The existing `offerRenewableEnergy` flag gates the move-in RE offer. Do not confuse them.

9. **Hardcoded pricing risk** — Ticket notes HowRenewableWorksSheet "currently hardcoded $3.29 — should use dynamic `subscriptionConfiguration.monthlyFee`". TC-032 checks this explicitly.

10. **GasAccount in RLS** — The RLS policies check both `ElectricAccount` and `GasAccount` via OR. If testing with gas-only properties, verify subscription access works through the gas path too.
