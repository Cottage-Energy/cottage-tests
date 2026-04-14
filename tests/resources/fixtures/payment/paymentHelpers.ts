/**
 * Shared helper functions and re-exports for payment module files.
 *
 * All common imports are re-exported from here so individual modules
 * can import from a single location.
 */

// Re-export common dependencies for other payment modules
export { test, expect, type Page } from '@playwright/test';
export { SidebarChat } from '../../page_objects/sidebar_chat';
export { OverviewPage } from '../../page_objects/overview_dashboard_page';
export { BillingPage } from '../../page_objects/billing_page';
export { ProfilePage } from '../../page_objects/account_profile_page';

export { accountQueries, billQueries, paymentQueries, blnkQueries, userQueries } from '../database';
export { supabase } from '../../utils/supabase';
export { FastmailActions } from '../fastmail_actions';
export { logger } from '../../utils/logger';
import PaymentDataJson from '../../data/payment-data.json';
export { PaymentDataJson as PaymentData };
export type { MoveInResult } from '../../types';
export type { TestUser } from '../../types';


// ---------------------------------------------------------------------------
// Helper functions (formerly private methods on PaymentUtilities)
// ---------------------------------------------------------------------------

import type { Page } from '@playwright/test';
import { userQueries } from '../database';
import { supabase } from '../../utils/supabase';
import { accountQueries } from '../database';
import type { MoveInResult } from '../../types';

/**
 * Ensure registration is complete so dashboard shows billing view.
 * Updates Resident + ElectricAccount/GasAccount registration and status.
 */
export async function ensureRegistrationComplete(page: Page, cottageUserId: string): Promise<void> {
    await userQueries.updateRegistrationComplete(cottageUserId, true);

    // Set electric/gas accounts to ACTIVE status with registration complete
    await supabase
        .from('ElectricAccount')
        .update({ registrationJobCompleted: true, isActive: true, status: 'ACTIVE' })
        .eq('cottageUserID', cottageUserId);
    await supabase
        .from('GasAccount')
        .update({ registrationJobCompleted: true, isActive: true, status: 'ACTIVE' })
        .eq('cottageUserID', cottageUserId);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
}

/**
 * Get payment details for a user with a single charge account (electric + gas combined).
 */
export async function getPaymentDetailsSingleChargeAccount(MoveIn: MoveInResult): Promise<{
    cottageUserId: string;
    electricAccountId: string;
    gasAccountId: string;
    chargeAccountId: string;
}> {
    const cottageUserId = MoveIn.cottageUserId;
    const electricAccountId = await accountQueries.getElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.getGasAccountId(MoveIn.cottageUserId);
    if (!electricAccountId || !gasAccountId) {
        throw new Error(`Single CA helper requires both accounts. electric=${electricAccountId}, gas=${gasAccountId}`);
    }
    const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, gasAccountId);

    return {
        cottageUserId,
        electricAccountId,
        gasAccountId,
        chargeAccountId
    };
}

/**
 * Get payment details for a user with multiple charge accounts (separate electric and gas).
 */
export async function getPaymentDetailsMultipleChargeAccounts(MoveIn: MoveInResult): Promise<{
    cottageUserId: string;
    electricAccountId: string;
    gasAccountId: string;
    electricChargeAccountId: string;
    gasChargeAccountId: string;
}> {
    const cottageUserId = MoveIn.cottageUserId;
    const electricAccountId = await accountQueries.getElectricAccountId(MoveIn.cottageUserId);
    const gasAccountId = await accountQueries.getGasAccountId(MoveIn.cottageUserId);
    if (!electricAccountId || !gasAccountId) {
        throw new Error(`Multi CA helper requires both accounts. electric=${electricAccountId}, gas=${gasAccountId}`);
    }
    const electricChargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);
    const gasChargeAccountId = await accountQueries.getCheckChargeAccount(null, gasAccountId);

    return {
        cottageUserId,
        electricAccountId,
        gasAccountId,
        electricChargeAccountId,
        gasChargeAccountId
    };
}
