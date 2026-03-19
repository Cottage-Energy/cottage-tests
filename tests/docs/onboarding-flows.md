# Onboarding Flows Reference

Complete map of all billing and non-billing onboarding flows — URLs, entry points, shortcodes, and test data requirements.

## Billing Flows
Account's `maintainedFor` is NOT null. Payment method is added or can be added.

### Move-in Flow
- **URL**: `https://dev.publicgrid.energy/move-in`
- **Parameters**: `?shortCode=<building>` to use a specific building
- **XState file**: `app/move-in/forms/form-wizard.tsx`

### Transfer Flow
- **URL**: `https://dev.publicgrid.energy/transfer`
- **Alternative entry**: For users with ElectricAccount status `ACTIVE` or `ELIGIBLE`, go to Services → "Transfer my service" button
- **XState file**: `app/transfer/forms/form-wizard.tsx`

### Light Flow (TX Deregulated)
- **URL**: `https://dev.publicgrid.energy/move-in`
- **How to trigger**: Use the Light Address `2900 Canton St` with a unit number (e.g., `524`). A modal appears offering two paths:
  - Keep original address → TX dereg flow
  - Address with ESD ID → Light flow
- **XState file**: `app/move-in/light/light-form-wizard.tsx`

### TX Bill Drop
- **URL**: Same as Bill Upload / Verify Utilities but with a Light-enabled zip code (e.g., `75063`)

### Finish Registration Flow
- **URL**: Generated via API — the response contains the URL for the user
- **API**: `POST https://api-dev.publicgrd.com/v1/test-partner/register`
- **Auth**: Bearer token (see `.env`)
- **Body example**:
```json
{
  "building": { "internalID": "guid-autotest" },
  "resident": {
    "firstName": "Pgtest",
    "lastName": "API Val",
    "email": "pgtest+moved-guid009@joinpublicgrid.com"
  },
  "enrollment": { "moveInDate": "2026-03-23" },
  "property": { "unitNumber": "102UV", "siteId": "guid-test" }
}
```
- **Modifiable fields**: email, name, moveInDate (use future dates)
- **XState file**: `app/finish-registration/forms/form-wizard.tsx`

## Non-Billing Flows
Account's `maintainedFor` is null. No payment method added and cannot be added.

Triggered when:
- `isHandleBilling` is false on UtilityCompany or Building (via shortCode)
- OR `isBillingRequired` is false → user chooses "I will manage payments myself" at payment step

### Move-in Flow (Non-billing variant)
- Same URL as billing move-in, but building/utility config determines non-billing path

### Transfer Flow (Non-billing variant)
- Same as billing transfer

### Utility Verification Flow
- **URL**: `https://dev.publicgrid.energy/move-in?shortCode=pgtest`
- **Trigger**: Building `pgtest` has `isUtilityVerificationEnabled = TRUE` in Supabase
- **How it works**: When user clicks "I will call and setup myself" link, redirects to Utility Verification flow where user uploads documents

### Bill Upload / Savings Flow
- **URL**: `https://dev.publicgrid.energy/bill-upload/connect-account`
- **Prerequisite**: Utility Company's `isBillUploadAvailable` flag must be TRUE in Supabase
- **Test data**: Zip Code `12249` (Con Edison) has `isBillUploadAvailable = TRUE`
- **If flag is FALSE**: User enters waiting list flow instead
- **Route file**: `app/(bill-upload)/shared/components/page-layout.tsx`

### Verify Utilities Flow
- **URL**: `https://dev.publicgrid.energy/verify-utilities/connect-account`
- **Same prerequisite**: `isBillUploadAvailable = TRUE` on UtilityCompany
- **Test data**: Zip Code `12249` (Con Edison)

### Connect Flow
- **URL**: `https://dev.publicgrid.energy/connect`

## Building Shortcodes

| Shortcode | Description | Key Flags |
|-----------|-------------|-----------|
| `autotest` | Standard move-in flow. Tied to a partner (different color). Same as regular move-in. | Standard |
| `pgtest` | Short version of move-in. | `useEncourageConversion = TRUE`, `isUtilityVerificationEnabled = TRUE` |
| `txtest` | Encourage conversion flow for Light/TX dereg. | `useEncourageConversion = TRUE`, ElectricCompany = `TX-DEREG` |

## Test Data Quick Reference

| Data Point | Value | Notes |
|-----------|-------|-------|
| Light address | `2900 Canton St` | Triggers Light flow modal |
| Light unit number | `524` | Use with Light address |
| Light zip code | `75063` | TX-enabled for TX Bill Drop |
| Bill upload zip | `12249` | Con Edison, `isBillUploadAvailable = TRUE` |
| Finish reg API | `api-dev.publicgrd.com` | Bearer token: see `.env` |
| Finish reg building | `guid-autotest` | Internal ID for test building |
