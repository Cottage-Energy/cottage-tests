import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * Page Object for the Connect Utility Modal on the overview page.
 * This modal opens when clicking "Connect utility" on the auto-apply savings card.
 *
 * Modal states: Form → Connecting → MFA → Success / Error
 * Form view is the only state automatable without BLNK dependency.
 */
export class ConnectUtilityModalPage {
    readonly page: Page;

    // Form view elements
    readonly modalTitle: Locator;
    readonly providerCard: Locator;
    readonly providerDescription: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly credentialSecurityNotice: Locator;
    readonly cancelButton: Locator;
    readonly connectButton: Locator;
    readonly uploadBillLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Form view
        this.modalTitle = page.getByText(/Connect your account/i);
        this.providerCard = page.locator('[class*="bg-brown-50"]').first();
        this.providerDescription = page.getByText(/Enter your .+ login details/i);
        this.emailInput = page.getByRole('textbox', { name: /email/i });
        this.passwordInput = page.getByRole('textbox', { name: /password/i })
            .or(page.locator('input[type="password"]'));
        this.credentialSecurityNotice = page.getByText(/Credentials are protected and never stored/i);
        this.cancelButton = page.getByRole('button', { name: /Cancel/i });
        this.connectButton = page.getByRole('button', { name: /^Connect$/i });
        this.uploadBillLink = page.getByText(/Upload bill/i).last();
    }

    /**
     * Verify the form view is displayed with all expected elements
     */
    async verifyFormView(): Promise<void> {
        await expect(this.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.cancelButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.connectButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the credential security notice is visible
     */
    async verifySecurityNotice(): Promise<void> {
        await expect(this.credentialSecurityNotice).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the "Upload bill" alternative link is visible
     */
    async verifyUploadBillLinkVisible(): Promise<void> {
        await expect(this.uploadBillLink).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Click "Upload bill" to switch to the bill upload modal
     */
    async clickUploadBill(): Promise<void> {
        await this.uploadBillLink.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }

    /**
     * Click Cancel to close the modal
     */
    async clickCancel(): Promise<void> {
        await this.cancelButton.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }
}

export default ConnectUtilityModalPage;
