# Transfer / Move-Out Flow — Test Plan

**Linear Issue:** [ENG-2280](https://linear.app/public-grid/issue/ENG-2280/task-move-outtransfer-flow)
**Feature:** Move-out / Transfer flow for shutting down or transferring electricity accounts when customers move
**RPC Under Test:** `create_transfer`, `cancel_move_out`
**Status:** Not Implemented
**Created:** 2026-02-27

---

## Table of Contents

1. [Overview](#overview)
2. [Scope](#scope)
3. [Prerequisites](#prerequisites)
4. [User Flows](#user-flows)
5. [Test Cases — E2E Workflows](#test-cases--e2e-workflows)
6. [Test Cases — UI Validations](#test-cases--ui-validations)
7. [Test Cases — OTP & Property Selector](#test-cases--otp--property-selector)
8. [Test Cases — Database Verification](#test-cases--database-verification)
9. [Test Cases — Edge Cases](#test-cases--edge-cases)
10. [Test Cases — Error Handling](#test-cases--error-handling)
11. [Test Cases — Cancel Move-Out](#test-cases--cancel-move-out)
12. [Automation Notes](#automation-notes)

---

## Overview

The transfer/move-out flow allows customers to shut down their electricity (and gas) accounts when moving. It is accessible both internally (Public Grid app) and externally (white-labeled for partners like Moved, Funnel). The flow handles:

- **Logged-in users** with known data and existing properties
- **Logged-out users** who verify via OTP and may have existing accounts
- **New users** who have never interacted with the system
- **Move-out only**, **move-out + new service**, **move-out + estimated move-in**, and **move-in only** scenarios

The primary RPC (`create_transfer`) orchestrates multiple database operations across `CottageUsers`, `Property`, `ElectricAccount`, `GasAccount`, `Resident`, and `ResidentIdentity` tables.

---

## Scope

### In Scope

- E2E workflows for all user types (logged-in, OTP-verified, new)
- UI form validations (address, date, phone, email, identity fields)
- OTP verification and property selector modal behavior
- Database state verification after RPC execution
- `cancel_move_out` RPC behavior
- Edge cases (missing utility in ServiceZip, no Building, null dates, re-runs)
- Error handling and transaction rollback

### Out of Scope

- Partner-specific GUID handling (deferred to partner integration tests)
- Payment processing after transfer (covered by existing payment test suites)
- Email/notification verification post-transfer (separate test suite)

---

## Prerequisites

| Requirement | Details |
|---|---|
| Seed user (existing) | `CottageUsers` row with at least one `Property` linked to `ElectricAccount` and `GasAccount` |
| Seed user (new) | Auth user created via signUp trigger with no existing properties |
| Address with ServiceZip | At least one `Address` whose zip appears in `ServiceZip` with `isPrimaryUtility = TRUE` |
| Address without ServiceZip | At least one `Address` whose zip has no `ServiceZip` entry (for edge case testing) |
| Building | At least one `Building` linked to an address |
| Utility company | Valid `electricCompanyID` from `UtilityCompany` |
| Transfer-eligible statuses | Properties with accounts in: `PENDING_FIRST_BILL`, `ACTIVE`, `ROADBLOCKED`, `ELIGIBLE`, `TRANSFER_READY`, `NEEDS_OFF_BOARDING`, `SETUP_COMPLETE` |
| Non-eligible statuses | Properties with accounts in: `INACTIVE`, `NEW`, `PENDING_CREATE` |

---

## User Flows

```
                        ┌─────────────────┐
                        │   Entry Point   │
                        │  /transfer page │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │             │
              ┌─────▼─────┐ ┌───▼────┐  ┌────▼─────┐
              │ Logged-in  │ │  OTP   │  │ New User │
              │   User     │ │ Verify │  │ (no OTP) │
              └─────┬──────┘ └───┬────┘  └────┬─────┘
                    │            │             │
                    │     ┌──────▼──────┐      │
                    │     │  Property   │      │
                    │     │  Selector   │      │
                    │     │   Modal     │      │
                    │     └──┬───┬───┬──┘      │
                    │        │   │   │         │
                    │   Select  Manual  Dismiss│
                    │   Exist.  Addr.   (back) │
                    │   (A1)   (A2)            │
                    │        │   │             │
              ┌─────▼────────▼───▼─────────────▼─────┐
              │         Move-Out Section (A)          │
              │  A1: Update existing accounts         │
              │  A2: Create new property + accounts   │
              └──────────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
        ┌─────▼──────┐  ┌───────▼────────┐  ┌──────▼───────┐
        │ Move-out   │  │ Move-out +     │  │ Move-out +   │
        │ only       │  │ new service    │  │ est. move-in │
        │            │  │                │  │ (no addr)    │
        └────────────┘  │ Section B:     │  │              │
                        │ New Property + │  │ Placeholder  │
                        │ ElectricAcct   │  │ Property +   │
                        │                │  │ TRANSFER_    │
                        │ Section C:     │  │ INCOMPLETE   │
                        │ Resident +     │  │ account      │
                        │ Consent        │  └──────────────┘
                        │                │
                        │ Section D:     │
                        │ Identity       │
                        └────────────────┘
```

---

## Test Cases — E2E Workflows

### TC-TF-001: Logged-in user — Move-out only (existing property)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-001 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@existing-user` |
| **Precondition** | User is logged in with at least one property that has an active ElectricAccount and GasAccount |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads with user's properties listed |
| 2 | Select existing property to move out of | Property selected, move-out date picker appears |
| 3 | Enter move-out date (future date) | Date accepted |
| 4 | Select "No" for starting new service | New service section is skipped |
| 5 | Submit transfer form | Form submits, success confirmation displayed |
| 6 | **DB Check:** Query ElectricAccount for selected property | `status = 'PENDING_STOP_SERVICE'`, `endDate = move-out date`, `previousStatus` = original status |
| 7 | **DB Check:** Query GasAccount for selected property | `status = 'PENDING_STOP_SERVICE'`, `endDate = move-out date`, `previousStatus` = original status |
| 8 | **DB Check:** Verify no new Property created | Property count unchanged |
| 9 | **DB Check:** Verify no Resident or ResidentIdentity upserted | No new rows |
| 10 | Clean up: restore account statuses | Accounts reverted to original status |

---

### TC-TF-002: Logged-in user — Move-out + new service

| Field | Value |
|---|---|
| **Test ID** | TC-TF-002 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@move-in`, `@existing-user` |
| **Precondition** | User is logged in with at least one active property |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Select existing property to move out of | Property selected |
| 3 | Enter move-out date | Date accepted |
| 4 | Select "Yes" for starting new service | New service form section appears |
| 5 | Enter new address (valid, with ServiceZip entry) | Address accepted, utility company auto-resolved |
| 6 | Enter unit number | Unit number accepted |
| 7 | Enter move-in date | Date accepted |
| 8 | Enter first name, last name, phone | Personal info accepted |
| 9 | Consent to text messages | Checkbox checked |
| 10 | Enter identity verification (SSN/license) | Identity fields accepted |
| 11 | Submit transfer form | Success confirmation displayed |
| 12 | **DB Check:** Old ElectricAccount | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 13 | **DB Check:** Old GasAccount | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 14 | **DB Check:** New Property created | `addressID` matches new address, `type = 'APARTMENT'` (unit provided), `buildingID` set if Building exists |
| 15 | **DB Check:** New ElectricAccount | `status = 'NEW'`, `startDate = move-in date`, `utilityCompanyID` = selected company, `propertyID` = new property |
| 16 | **DB Check:** Resident upserted | `firstName`, `lastName`, `phone`, `startServiceDate` match input |
| 17 | **DB Check:** CottageUsers consent | `isAbleToSendTextMessages = true`, `dateOfTextMessageConsent` set |
| 18 | **DB Check:** ResidentIdentity upserted | All identity fields stored correctly |
| 19 | Clean up: delete created records | New property, accounts, resident identity removed |

---

### TC-TF-003: Logged-in user — Move-out + estimated move-in (no new address)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-003 |
| **Priority** | P2 |
| **Tags** | `@e2e`, `@move-out`, `@existing-user` |
| **Precondition** | User is logged in with at least one active property |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Select existing property to move out of | Property selected |
| 3 | Enter move-out date | Date accepted |
| 4 | Indicate estimated move-in date but no new address yet | Estimated move-in date field appears |
| 5 | Enter estimated move-in date | Date accepted |
| 6 | Submit transfer form | Success confirmation displayed |
| 7 | **DB Check:** Old ElectricAccount | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 8 | **DB Check:** Old GasAccount | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 9 | **DB Check:** Placeholder Property created | `addressID = NULL`, `buildingID = NULL` |
| 10 | **DB Check:** Placeholder ElectricAccount | `status = 'TRANSFER_INCOMPLETE'`, `startDate = estimated move-in date`, `utilityCompanyID = NULL`, `propertyID` = placeholder property |
| 11 | **DB Check:** No Resident or ResidentIdentity | No new rows |
| 12 | Clean up | Remove placeholder records |

---

### TC-TF-004: OTP-verified existing user — Move-out only (selects existing property)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-004 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@existing-user`, `@otp` |
| **Precondition** | User is logged out but has an existing account with transfer-eligible properties |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Enter move-out address manually | Address accepted |
| 3 | Fill in About You form (name, email of existing user, phone) | Form completed |
| 4 | Submit About You — email recognized as existing | OTP sent to email |
| 5 | Retrieve OTP from Fastmail | OTP code obtained |
| 6 | Enter OTP code | OTP verified, properties fetched |
| 7 | Verify property selector modal appears | Modal displays eligible properties + manually-entered address |
| 8 | Select an existing property from the modal | Property selected, `selectedPropertyID` set |
| 9 | Click Continue | Modal closes, flow proceeds with path A1 |
| 10 | Enter move-out date | Date accepted |
| 11 | Submit transfer form | Success confirmation displayed |
| 12 | **DB Check:** ElectricAccount for selected property | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 13 | **DB Check:** GasAccount for selected property | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 14 | Clean up | Restore account statuses |

---

### TC-TF-005: OTP-verified existing user — Move-out only (selects manual address)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-005 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@existing-user`, `@otp` |
| **Precondition** | User is logged out but has an existing account with transfer-eligible properties |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Enter move-out address manually | Address accepted |
| 3 | Complete About You form and OTP verification | OTP verified, modal appears |
| 4 | Select manually-entered address ("You entered" badge) | `selectedPropertyID = null` |
| 5 | Click Continue | Modal closes, flow proceeds with path A2 |
| 6 | Enter move-out date | Date accepted |
| 7 | Submit transfer form | Success confirmation |
| 8 | **DB Check:** Utility company lookup | Looked up from `ServiceZip` via address zip |
| 9 | **DB Check:** New Property created | `addressID` = manual address, correct `type` |
| 10 | **DB Check:** New ElectricAccount created | `status = 'PENDING_STOP_SERVICE'`, `endDate` set |
| 11 | Clean up | Remove created records |

---

### TC-TF-006: OTP-verified existing user — Move-out + new service

| Field | Value |
|---|---|
| **Test ID** | TC-TF-006 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@move-in`, `@existing-user`, `@otp` |
| **Precondition** | User is logged out but has an existing account with transfer-eligible properties |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Enter move-out address, complete About You + OTP | OTP verified, modal appears |
| 3 | Select existing property from modal | Property selected (path A1) |
| 4 | Enter move-out date | Date accepted |
| 5 | Select "Yes" for starting new service | New service section appears |
| 6 | Enter new address, unit, move-in date | Fields accepted |
| 7 | Select utility company | Company selected |
| 8 | Enter personal info (name, phone, consent) | Fields accepted |
| 9 | Enter identity verification | Identity fields accepted |
| 10 | Submit transfer form | Success confirmation |
| 11 | **DB Check:** Old accounts | `status = 'PENDING_STOP_SERVICE'` with `endDate` |
| 12 | **DB Check:** New Property | Created at new address with correct type/buildingID |
| 13 | **DB Check:** New ElectricAccount | `status = 'NEW'`, correct `startDate`, `utilityCompanyID`, `propertyID` |
| 14 | **DB Check:** Resident | Upserted with correct personal info |
| 15 | **DB Check:** CottageUsers consent | `isAbleToSendTextMessages` and `dateOfTextMessageConsent` set |
| 16 | **DB Check:** ResidentIdentity | All identity fields stored |
| 17 | Clean up | Remove created records, restore old account statuses |

---

### TC-TF-007: New user — Move-out only (new address)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-007 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@new-user` |
| **Precondition** | User has never interacted with the system |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Enter move-out address | Address accepted |
| 3 | Enter move-out date | Date accepted |
| 4 | Fill in About You (name, email, phone, consent) | Form completed, new auth user created |
| 5 | Submit transfer form | Success confirmation |
| 6 | **DB Check:** CottageUsers | `cottageConnectUserType = 'CUSTOMER'`, `termsAndConditionsDate` set, `isReceivingSetupReminders = TRUE`, `didDropOff = TRUE` |
| 7 | **DB Check:** Utility lookup | `utilityCompanyID` resolved from `ServiceZip` (or NULL if no entry) |
| 8 | **DB Check:** New Property | Created at move-out address, correct `type`, `buildingID` if Building exists |
| 9 | **DB Check:** New ElectricAccount | `status = 'PENDING_STOP_SERVICE'`, `startDate = NOW`, `endDate = move-out date` |
| 10 | **DB Check:** Resident | Created with `firstName`, `lastName`, `phone` |
| 11 | **DB Check:** CottageUsers consent | `isAbleToSendTextMessages` matches input |
| 12 | **DB Check:** No ResidentIdentity | No row created (move-out only, no identity verification) |
| 13 | Clean up | Delete user, property, accounts, resident |

---

### TC-TF-008: New user — Move-out + new service

| Field | Value |
|---|---|
| **Test ID** | TC-TF-008 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@move-out`, `@move-in`, `@new-user` |
| **Precondition** | User has never interacted with the system |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Enter move-out address and date | Fields accepted |
| 3 | Select "Yes" for starting new service | New service section appears |
| 4 | Enter new address, unit number, move-in date | Fields accepted |
| 5 | Select utility company | Company selected |
| 6 | Fill in About You (name, email, phone, consent) | New user created |
| 7 | Enter identity verification | Identity fields accepted |
| 8 | Submit transfer form | Success confirmation |
| 9 | **DB Check:** CottageUsers | `cottageConnectUserType = 'CUSTOMER'`, setup flags set |
| 10 | **DB Check:** Move-out Property | Created at move-out address |
| 11 | **DB Check:** Move-out ElectricAccount | `status = 'PENDING_STOP_SERVICE'`, `startDate = NOW`, `endDate = move-out date` |
| 12 | **DB Check:** Move-in Property | Created at new address, correct `type`, `buildingID` |
| 13 | **DB Check:** Move-in ElectricAccount | `status = 'NEW'`, `startDate = move-in date`, `utilityCompanyID` matches |
| 14 | **DB Check:** Resident | Created with all personal info |
| 15 | **DB Check:** ResidentIdentity | All identity fields stored |
| 16 | Clean up | Delete all created records |

---

### TC-TF-009: Move-in only (no move-out) — New user

| Field | Value |
|---|---|
| **Test ID** | TC-TF-009 |
| **Priority** | P2 |
| **Tags** | `@e2e`, `@move-in`, `@new-user` |
| **Precondition** | User has never interacted with the system |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Indicate not moving out, only starting new service | Move-out section skipped |
| 3 | Enter new address, unit number, move-in date | Fields accepted |
| 4 | Select utility company | Company selected |
| 5 | Fill in About You (name, email, phone, consent) | New user created |
| 6 | Enter identity verification | Identity fields accepted |
| 7 | Submit transfer form | Success confirmation |
| 8 | **DB Check:** CottageUsers | `cottageConnectUserType = 'CUSTOMER'`, setup flags set |
| 9 | **DB Check:** No move-out records | No existing accounts modified, no move-out property created |
| 10 | **DB Check:** New Property | Created at new address, correct `type`, `buildingID` |
| 11 | **DB Check:** New ElectricAccount | `status = 'NEW'`, `startDate = move-in date`, `utilityCompanyID` matches |
| 12 | **DB Check:** Resident | Created with personal info |
| 13 | **DB Check:** ResidentIdentity | Created if identity type provided, skipped if NULL |
| 14 | Clean up | Delete created records |

---

### TC-TF-010: Move-in only (no move-out) — Existing user

| Field | Value |
|---|---|
| **Test ID** | TC-TF-010 |
| **Priority** | P2 |
| **Tags** | `@e2e`, `@move-in`, `@existing-user` |
| **Precondition** | User is logged in with existing account |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Transfer page loads |
| 2 | Indicate not moving out, only starting new service | Move-out section skipped |
| 3 | Enter new address, unit number, move-in date | Fields accepted |
| 4 | Select utility company | Company selected |
| 5 | Enter personal info and identity | Fields accepted |
| 6 | Submit transfer form | Success confirmation |
| 7 | **DB Check:** CottageUsers | Row NOT modified by Section 0 (`p_is_new_user = false`) |
| 8 | **DB Check:** Existing accounts unchanged | No status changes on existing ElectricAccount/GasAccount |
| 9 | **DB Check:** New Property + ElectricAccount | Created with correct values |
| 10 | **DB Check:** Resident | Updated (not duplicated) via ON CONFLICT |
| 11 | Clean up | Delete new records |

---

## Test Cases — UI Validations

### TC-TF-UI-001: Move-out address validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-001 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page | Page loads with address field |
| 2 | Submit without entering address | Validation error displayed |
| 3 | Enter partial/invalid address | Validation error or no autocomplete match |
| 4 | Enter valid address from autocomplete | Address accepted, utility info resolved |

---

### TC-TF-UI-002: Move-out date validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-002 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to transfer page with address filled | Date picker visible |
| 2 | Try to select a past date | Past dates disabled or validation error shown |
| 3 | Select a valid future date | Date accepted |
| 4 | Clear the date field and submit | Validation error displayed |

---

### TC-TF-UI-003: New service address validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-003 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-in` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enable new service section | New address field appears |
| 2 | Submit without entering new address | Validation error displayed |
| 3 | Enter valid new address | Address accepted |
| 4 | Optionally enter unit number | Field accepts alphanumeric input |

---

### TC-TF-UI-004: Move-in date validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-004 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-in` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enable new service section | Move-in date picker visible |
| 2 | Try to select a date before move-out date | Validation prevents it |
| 3 | Select a valid future date after move-out | Date accepted |

---

### TC-TF-UI-005: About You form validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-005 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to About You step | Form fields visible |
| 2 | Submit with empty fields | Validation errors on required fields |
| 3 | Enter invalid email format | Email validation error |
| 4 | Enter invalid phone format | Phone validation error |
| 5 | Fill all fields correctly | Form accepts input, proceed enabled |

---

### TC-TF-UI-006: Identity verification field validation

| Field | Value |
|---|---|
| **Test ID** | TC-TF-UI-006 |
| **Priority** | P2 |
| **Tags** | `@ui`, `@move-in` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to identity verification step | Identity type selector visible |
| 2 | Select SSN | SSN input field appears |
| 3 | Enter SSN with fewer than required digits | Validation error |
| 4 | Enter valid SSN | Field accepted |
| 5 | Select Driver's License | License input field appears |
| 6 | Enter valid license number | Field accepted |

---

## Test Cases — OTP & Property Selector

### TC-TF-OTP-001: OTP verification — happy path

| Field | Value |
|---|---|
| **Test ID** | TC-TF-OTP-001 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@otp` |
| **Precondition** | Existing user with known email, logged out |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Fill About You form with existing user's email | Form accepted |
| 2 | Submit form | System recognizes existing email, sends OTP |
| 3 | Retrieve OTP from Fastmail inbox | OTP code obtained |
| 4 | Enter OTP code | Verification succeeds |
| 5 | Verify About You form is frozen | Form visible but pointer-events-none, action buttons hidden |

---

### TC-TF-OTP-002: Property selector — eligible properties shown

| Field | Value |
|---|---|
| **Test ID** | TC-TF-OTP-002 |
| **Priority** | P1 |
| **Tags** | `@e2e`, `@otp` |
| **Precondition** | OTP-verified user with properties in transfer-eligible statuses |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Complete OTP verification | Properties fetched |
| 2 | Verify property selector modal appears | Dialog modal visible |
| 3 | Verify eligible properties displayed | Properties with "Current account" badge shown |
| 4 | Verify manually-entered address displayed | Address with "You entered" badge shown |
| 5 | Select an existing property | Property highlighted |
| 6 | Click Continue | Modal closes, `selectedPropertyID` set to chosen property |

---

### TC-TF-OTP-003: Property selector — no eligible properties (modal skipped)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-OTP-003 |
| **Priority** | P2 |
| **Tags** | `@e2e`, `@otp` |
| **Precondition** | OTP-verified user whose properties all have non-eligible statuses (`INACTIVE`, `NEW`, `PENDING_CREATE`) |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Complete OTP verification | Properties fetched and filtered |
| 2 | Verify zero eligible properties | `properties.length === 0` |
| 3 | Verify modal is NOT shown | Flow proceeds directly, no Dialog |
| 4 | Verify `selectedPropertyID = null` | Path A2 (manual address) used |

---

### TC-TF-OTP-004: Property selector — user dismisses modal

| Field | Value |
|---|---|
| **Test ID** | TC-TF-OTP-004 |
| **Priority** | P2 |
| **Tags** | `@e2e`, `@otp` |
| **Precondition** | OTP-verified user with eligible properties |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Complete OTP verification | Modal appears with properties |
| 2 | Click X button to dismiss modal | Modal closes |
| 3 | Verify auth state reset | `isLoggedIn = false`, `wasOTPVerified = false`, `properties = []`, `userID = ''` |
| 4 | Verify About You form re-appears | Form visible with all previous data pre-filled |
| 5 | Verify user can edit and resubmit | Fields are editable |
| 6 | Resubmit with same email | OTP flow repeats, modal reappears |

---

## Test Cases — Database Verification

### TC-TF-DB-001: ElectricAccount status transition — existing property (path A1)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-001 |
| **Priority** | P1 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Record original ElectricAccount status | Status noted (e.g., `ACTIVE`) |
| 2 | Execute `create_transfer` with `p_selected_property_id` | RPC returns `{ "success": true }` |
| 3 | Query ElectricAccount | `previousStatus` = original status, `status = 'PENDING_STOP_SERVICE'`, `endDate` = `p_move_out_date` |

---

### TC-TF-DB-002: GasAccount status transition — existing property (path A1)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-002 |
| **Priority** | P1 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Record original GasAccount status | Status noted |
| 2 | Execute `create_transfer` with `p_selected_property_id` | RPC returns `{ "success": true }` |
| 3 | Query GasAccount | `previousStatus` = original status, `status = 'PENDING_STOP_SERVICE'`, `endDate` = `p_move_out_date` |

---

### TC-TF-DB-003: New Property + ElectricAccount — manual address (path A2)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-003 |
| **Priority** | P1 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with `p_move_out_address_id` (no `p_selected_property_id`) | RPC returns `{ "success": true }` |
| 2 | Query new Property | `addressID` = `p_move_out_address_id`, `buildingID` set if Building exists, `type = 'APARTMENT'` if unit provided else `'HOME'` |
| 3 | Query new ElectricAccount | `status = 'PENDING_STOP_SERVICE'`, `startDate = NOW`, `endDate = p_move_out_date`, `utilityCompanyID` from ServiceZip |

---

### TC-TF-DB-004: Placeholder property — estimated move-in, no address

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-004 |
| **Priority** | P2 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with `p_estimated_move_in_date`, `p_new_address_id = NULL`, `p_is_starting_new_service = false` | RPC returns `{ "success": true }` |
| 2 | Query placeholder Property | `addressID = NULL`, `buildingID = NULL` |
| 3 | Query placeholder ElectricAccount | `status = 'TRANSFER_INCOMPLETE'`, `startDate = p_estimated_move_in_date`, `utilityCompanyID = NULL` |

---

### TC-TF-DB-005: Resident ON CONFLICT — re-running transfer

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-005 |
| **Priority** | P2 |
| **Tags** | `@api` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with user who already has a Resident row | RPC returns `{ "success": true }` |
| 2 | Query Resident table | Row updated (not duplicated), latest `firstName`, `lastName`, `phone`, `startServiceDate` |
| 3 | Count Resident rows for user | Exactly 1 row |

---

### TC-TF-DB-006: ResidentIdentity ON CONFLICT — re-running transfer

| Field | Value |
|---|---|
| **Test ID** | TC-TF-DB-006 |
| **Priority** | P2 |
| **Tags** | `@api` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with user who already has a ResidentIdentity row and new identity data | RPC returns `{ "success": true }` |
| 2 | Query ResidentIdentity table | Row updated with latest identity fields |
| 3 | Count ResidentIdentity rows for user | Exactly 1 row |

---

## Test Cases — Edge Cases

### TC-TF-EDGE-001: No utility in ServiceZip for move-out address

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-001 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with address whose zip has no ServiceZip entry | RPC returns `{ "success": true }` (no error) |
| 2 | Query new ElectricAccount | `utilityCompanyID = NULL` |

---

### TC-TF-EDGE-002: No Building for address

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-002 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with address that has no linked Building | RPC returns `{ "success": true }` (no error) |
| 2 | Query new Property | `buildingID = NULL` |

---

### TC-TF-EDGE-003: Property has ElectricAccount but no GasAccount

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-003 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with property where `gasAccountID = NULL` | RPC returns `{ "success": true }` (no error) |
| 2 | Query ElectricAccount | `status = 'PENDING_STOP_SERVICE'` |
| 3 | Verify no GasAccount error | No exception thrown |

---

### TC-TF-EDGE-004: Property has GasAccount but no ElectricAccount

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-004 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with property where `electricAccountID = NULL` | RPC returns `{ "success": true }` (no error) |
| 2 | Query GasAccount | `status = 'PENDING_STOP_SERVICE'` |
| 3 | Verify no ElectricAccount error | No exception thrown |

---

### TC-TF-EDGE-005: Move-out date is NULL

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-005 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with `p_move_out_date = NULL` | RPC returns `{ "success": true }` |
| 2 | Query ElectricAccount | `endDate = NULL` |
| 3 | Query GasAccount | `endDate = NULL` |

---

### TC-TF-EDGE-006: Identity type is NULL (no identity verification required)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-EDGE-006 |
| **Priority** | P3 |
| **Tags** | `@api`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `create_transfer` with `p_identity_type = NULL` | RPC returns `{ "success": true }` |
| 2 | Query ResidentIdentity | No row created or modified |

---

## Test Cases — Error Handling

### TC-TF-ERR-001: Error in CottageUsers update (Section 0)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-001 |
| **Priority** | P2 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section 0 (e.g., invalid user_id) | RPC raises exception |
| 2 | Verify error message | Starts with `Error updating CottageUsers:` |
| 3 | Verify rollback | No partial writes to any table |

---

### TC-TF-ERR-002: Error in move-out handling (Section A)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-002 |
| **Priority** | P2 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section A | RPC raises exception |
| 2 | Verify error message | Starts with `Error handling move-out:` |
| 3 | Verify rollback | No partial writes |

---

### TC-TF-ERR-003: Error in placeholder creation (Section A3)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-003 |
| **Priority** | P3 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section A3 | RPC raises exception |
| 2 | Verify error message | Starts with `Error creating placeholder for incomplete transfer:` |
| 3 | Verify rollback | No partial writes |

---

### TC-TF-ERR-004: Error in new service handling (Section B)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-004 |
| **Priority** | P2 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section B | RPC raises exception |
| 2 | Verify error message | Starts with `Error handling new service:` |
| 3 | Verify rollback | No partial writes |

---

### TC-TF-ERR-005: Error in Resident/Consent upsert (Section C)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-005 |
| **Priority** | P2 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section C | RPC raises exception |
| 2 | Verify error message | Starts with `Error upserting Resident / CottageUsers consent:` |
| 3 | Verify rollback | No partial writes |

---

### TC-TF-ERR-006: Error in ResidentIdentity upsert (Section D)

| Field | Value |
|---|---|
| **Test ID** | TC-TF-ERR-006 |
| **Priority** | P3 |
| **Tags** | `@api`, `@error-handling` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Trigger error in Section D | RPC raises exception |
| 2 | Verify error message | Starts with `Error upserting ResidentIdentity:` |
| 3 | Verify rollback | No partial writes |

---

## Test Cases — Cancel Move-Out

### TC-TF-CANCEL-001: Cancel move-out — reverts ElectricAccount

| Field | Value |
|---|---|
| **Test ID** | TC-TF-CANCEL-001 |
| **Priority** | P1 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up: execute `create_transfer` for an existing property (move-out only) | ElectricAccount `status = 'PENDING_STOP_SERVICE'` |
| 2 | Execute `cancel_move_out(p_property_id)` | Returns `{ "success": true }` |
| 3 | Query ElectricAccount | `status` reverted to `previousStatus` (or `'ACTIVE'` if NULL), `endDate = NULL`, `previousStatus = NULL` |

---

### TC-TF-CANCEL-002: Cancel move-out — reverts GasAccount

| Field | Value |
|---|---|
| **Test ID** | TC-TF-CANCEL-002 |
| **Priority** | P1 |
| **Tags** | `@api`, `@move-out` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up: execute `create_transfer` for a property with GasAccount | GasAccount `status = 'PENDING_STOP_SERVICE'` |
| 2 | Execute `cancel_move_out(p_property_id)` | Returns `{ "success": true }` |
| 3 | Query GasAccount | `status` reverted to `previousStatus` (or `'ACTIVE'` if NULL), `endDate = NULL`, `previousStatus = NULL` |

---

### TC-TF-CANCEL-003: Cancel move-out — account not in PENDING_STOP_SERVICE

| Field | Value |
|---|---|
| **Test ID** | TC-TF-CANCEL-003 |
| **Priority** | P2 |
| **Tags** | `@api`, `@move-out`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `cancel_move_out` on a property whose accounts are NOT in `PENDING_STOP_SERVICE` | Returns `{ "success": true }` |
| 2 | Query accounts | No changes made (WHERE clause filters them out) |

---

### TC-TF-CANCEL-004: Cancel move-out — property with no GasAccount

| Field | Value |
|---|---|
| **Test ID** | TC-TF-CANCEL-004 |
| **Priority** | P3 |
| **Tags** | `@api`, `@move-out`, `@edge-case` |

| Step | Action | Expected Result |
|---|---|---|
| 1 | Execute `cancel_move_out` on a property with `gasAccountID = NULL` | Returns `{ "success": true }` (no error) |
| 2 | Query ElectricAccount | Status reverted correctly |

---

## Automation Notes

### Proposed Test File Structure

```
tests/e2e_tests/transfer-flow/
  standard-workflows/
    transfer_moveout_only.spec.ts          → TC-TF-001, TC-TF-004, TC-TF-005, TC-TF-007
    transfer_moveout_new_service.spec.ts   → TC-TF-002, TC-TF-006, TC-TF-008
    transfer_moveout_estimated.spec.ts     → TC-TF-003
    transfer_movein_only.spec.ts           → TC-TF-009, TC-TF-010
    transfer_cancel_moveout.spec.ts        → TC-TF-CANCEL-001 through 004
  ui/
    transfer_address_validation.spec.ts    → TC-TF-UI-001, TC-TF-UI-003
    transfer_date_validation.spec.ts       → TC-TF-UI-002, TC-TF-UI-004
    transfer_about_you_validation.spec.ts  → TC-TF-UI-005
    transfer_identity_validation.spec.ts   → TC-TF-UI-006
  otp/
    transfer_otp_verification.spec.ts      → TC-TF-OTP-001
    transfer_property_selector.spec.ts     → TC-TF-OTP-002, TC-TF-OTP-003, TC-TF-OTP-004
```

### New Page Objects Needed

- `TransferPage` — main transfer flow page interactions
- `PropertySelectorModal` — OTP property selector dialog
- `TransferAboutYouForm` — About You form specific to transfer flow

### New Types Needed (`tests/resources/types/transfer.types.ts`)

- `TransferParams` — maps to `create_transfer` RPC parameters
- `CancelMoveOutParams` — maps to `cancel_move_out` RPC parameters
- `TransferEligibleStatus` — union of eligible status strings
- `TransferTestUser` — test user data structure for transfer scenarios

### New Database Queries Needed (`tests/resources/fixtures/`)

- `fetchElectricAccountByPropertyId(propertyId)`
- `fetchGasAccountByPropertyId(propertyId)`
- `fetchResidentByCottageUserId(userId)`
- `fetchResidentIdentityByCottageUserId(userId)`
- `executeCreateTransfer(params: TransferParams)`
- `executeCancelMoveOut(propertyId: number)`

### New Constants Needed

- `TEST_TAGS.MOVE_OUT` (`'@move-out'`)
- `TEST_TAGS.TRANSFER` (`'@transfer'`)
- `TEST_TAGS.OTP` (`'@otp'`)
- `TRANSFER_ELIGIBLE_STATUSES` array

### Test Data Cleanup

All tests must clean up created data in `afterEach` hooks:
- Delete created `ResidentIdentity` rows
- Delete created `Resident` rows
- Delete created `ElectricAccount` rows
- Delete created `GasAccount` rows
- Delete created `Property` rows
- Restore modified account statuses via `cancel_move_out` or direct UPDATE
- Delete created auth users (if new user scenarios)
