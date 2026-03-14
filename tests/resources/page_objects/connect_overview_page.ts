import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * Page Object for the connect account overview page elements
 * Covers auto-apply savings card, renewable energy card, setup tracker,
 * and other connect-specific overview components
 */
export class ConnectOverviewPage {
    readonly page: Page;

    // Greeting
    readonly greetingText: Locator;

    // Auto-apply savings card (connect ELIGIBLE users)
    readonly autoApplyHeading: Locator;
    readonly autoApplyDescription: Locator;
    readonly autoApplyBenefitAutoApply: Locator;
    readonly autoApplyBenefitNoChanges: Locator;
    readonly autoApplyBenefitWeHandle: Locator;
    readonly uploadBillButton: Locator;
    readonly connectUtilityButton: Locator;

    // Renewable energy card (non-connect users)
    readonly renewableEnergyHeading: Locator;
    readonly renewableEnergyPrice: Locator;
    readonly activateOfferButton: Locator;
    readonly learnMoreLink: Locator;

    // Savings sidebar card
    readonly savingsHeading: Locator;
    readonly searchingForSavingsHeading: Locator;
    readonly manageAlertsLink: Locator;

    // Setup tracker (connect account with REVIEW_UPLOAD_BILL)
    readonly trackerStep1Text: Locator;
    readonly trackerStep2AutoApplyText: Locator;

    // Electricity card
    readonly electricityHeading: Locator;

    // Navigation
    readonly overviewNavLink: Locator;
    readonly billingNavLink: Locator;
    readonly servicesNavLink: Locator;
    readonly householdNavLink: Locator;

    // Billing elements (non-connect users)
    readonly billingHistoryButton: Locator;
    readonly accountDetailsButton: Locator;
    readonly reportOutageButton: Locator;
    readonly outstandingBalance: Locator;
    readonly invoiceAutopay: Locator;

    // Password reset dialog
    readonly passwordResetDialog: Locator;
    readonly passwordResetTitle: Locator;

    constructor(page: Page) {
        this.page = page;

        // Greeting
        this.greetingText = page.getByText(/Good (morning|afternoon|evening)/);

        // Auto-apply savings card
        this.autoApplyHeading = page.getByText('Get savings applied automatically');
        this.autoApplyDescription = page.getByText(/Connect your utility account so we can auto-apply/i);
        this.autoApplyBenefitAutoApply = page.getByText('Auto-apply savings when we find them');
        this.autoApplyBenefitNoChanges = page.getByText('No changes on your utility side', { exact: true });
        this.autoApplyBenefitWeHandle = page.getByText('We handle everything after you connect');
        this.uploadBillButton = page.getByRole('button', { name: 'Upload bill' });
        this.connectUtilityButton = page.getByRole('button', { name: 'Connect utility' });

        // Renewable energy card
        this.renewableEnergyHeading = page.getByText(/Upgrade to 100% renewable energy/i);
        this.renewableEnergyPrice = page.getByText('$3.29/mo');
        this.activateOfferButton = page.getByRole('button', { name: 'Activate offer' });
        this.learnMoreLink = page.getByText('Learn more');

        // Savings sidebar card
        this.savingsHeading = page.getByText('Savings').first();
        this.searchingForSavingsHeading = page.getByText('Searching for savings...');
        this.manageAlertsLink = page.getByRole('link', { name: 'Manage alerts' });

        // Setup tracker
        this.trackerStep1Text = page.getByText("We're checking your bill has everything we need");
        this.trackerStep2AutoApplyText = page.getByText('Savings applied automatically');

        // Electricity card
        this.electricityHeading = page.getByText('Electricity').first();

        // Navigation
        this.overviewNavLink = page.getByRole('link', { name: 'Overview' });
        this.billingNavLink = page.getByRole('link', { name: 'Billing & Payments' });
        this.servicesNavLink = page.getByRole('link', { name: 'Services' });
        this.householdNavLink = page.getByRole('link', { name: 'Household' });

        // Billing elements (non-connect)
        this.billingHistoryButton = page.getByRole('button', { name: 'Billing History' });
        this.accountDetailsButton = page.getByRole('button', { name: 'Account details' });
        this.reportOutageButton = page.getByRole('button', { name: 'Report an outage' });
        this.outstandingBalance = page.locator('p').filter({ hasText: /^\$\d+\.\d{2}$/ }).first();
        this.invoiceAutopay = page.getByText('Invoice autopay');

        // Password reset dialog
        this.passwordResetDialog = page.getByRole('alertdialog', { name: /Set up your new password/i });
        this.passwordResetTitle = page.getByRole('heading', { name: /Set up your new password/i });
    }

    /**
     * Wait for the overview page to load
     */
    async waitForOverviewLoad(): Promise<void> {
        await this.page.waitForURL('**/app/overview', { timeout: TIMEOUTS.DEFAULT });
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.greetingText).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }

    /**
     * Dismiss password reset dialog if present
     */
    async dismissPasswordResetDialog(): Promise<void> {
        const isVisible = await this.passwordResetDialog.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
        if (isVisible) {
            await this.page.evaluate(() => {
                const dialog = document.querySelector('[role="alertdialog"]');
                if (dialog) dialog.remove();
            });
            await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
        }
    }

    /**
     * Verify auto-apply savings card is visible with all expected elements
     */
    async verifyAutoApplyCardVisible(): Promise<void> {
        await expect(this.autoApplyHeading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.autoApplyDescription).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.autoApplyBenefitAutoApply).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.autoApplyBenefitNoChanges).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.autoApplyBenefitWeHandle).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.uploadBillButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify auto-apply savings card is NOT visible
     */
    async verifyAutoApplyCardNotVisible(): Promise<void> {
        await expect(this.autoApplyHeading).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify renewable energy card is visible with expected elements
     */
    async verifyRenewableEnergyCardVisible(): Promise<void> {
        await expect(this.renewableEnergyHeading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.renewableEnergyPrice).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.activateOfferButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify renewable energy card is NOT visible
     */
    async verifyRenewableEnergyCardNotVisible(): Promise<void> {
        await expect(this.renewableEnergyHeading).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify billing UI elements are visible (non-connect users)
     */
    async verifyBillingUIVisible(): Promise<void> {
        await expect(this.billingHistoryButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.accountDetailsButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify billing UI elements are NOT visible (connect users)
     */
    async verifyBillingUINotVisible(): Promise<void> {
        await expect(this.billingHistoryButton).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.accountDetailsButton).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify Services nav link is visible
     */
    async verifyServicesNavVisible(): Promise<void> {
        await expect(this.servicesNavLink).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify Services nav link is NOT visible
     */
    async verifyServicesNavNotVisible(): Promise<void> {
        await expect(this.servicesNavLink).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Select a property from the summary page (for multi-property users)
     */
    async selectFirstProperty(): Promise<void> {
        const viewButton = this.page.getByRole('button', { name: 'View' }).first();
        const isPropertySelector = await viewButton.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
        if (isPropertySelector) {
            await viewButton.click();
            await this.waitForOverviewLoad();
        }
    }

    /**
     * Verify password reset dialog is visible
     */
    async verifyPasswordResetDialogVisible(): Promise<void> {
        await expect(this.passwordResetDialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.passwordResetTitle).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }
}

export default ConnectOverviewPage;
