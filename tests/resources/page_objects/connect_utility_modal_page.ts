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

    // Connecting progress elements
    readonly connectingHeading: Locator;
    readonly connectingSubtext: Locator;

    // Error state elements
    readonly connectFailedHeading: Locator;
    readonly connectFailedMessage: Locator;
    readonly tryAgainButton: Locator;
    readonly uploadBillFallbackButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Scope form locators to the dialog to avoid collisions with page-level inputs
        const dialog = page.getByRole('dialog');

        // Form view
        this.modalTitle = page.getByText(/Connect your account/i);
        this.providerCard = page.locator('[class*="bg-brown-50"]').first();
        this.providerDescription = page.getByText(/Enter your .+ login details/i);
        this.emailInput = dialog.locator('input[name="email"]');
        this.passwordInput = dialog.locator('input[name="password"]');
        this.credentialSecurityNotice = page.getByText(/Credentials are protected and never stored/i);
        this.cancelButton = dialog.getByRole('button', { name: /Cancel/i });
        this.connectButton = dialog.getByRole('button', { name: /^Connect$/i });
        this.uploadBillLink = page.getByText(/Upload bill/i).last();

        // Connecting progress
        this.connectingHeading = page.getByRole('heading', { name: /Connecting your account/i });
        this.connectingSubtext = page.getByText(/This usually takes a few seconds/i);

        // Error state
        this.connectFailedHeading = dialog.getByRole('heading', { name: /Connect failed/i });
        this.connectFailedMessage = dialog.getByText(/email or password you entered doesn.t match/i);
        this.tryAgainButton = dialog.getByRole('button', { name: /Try again/i });
        this.uploadBillFallbackButton = dialog.getByRole('button', { name: /Upload bill/i });
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
     * Fill credentials and click Connect
     */
    async fillCredentialsAndConnect(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.connectButton.click();
    }

    /**
     * Verify the connecting progress view is displayed
     */
    async verifyConnectingView(): Promise<void> {
        await expect(this.connectingHeading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.connectingSubtext).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the connect failed error view is displayed
     */
    async verifyConnectFailedView(): Promise<void> {
        await expect(this.connectFailedHeading).toBeVisible({ timeout: TIMEOUTS.LONG });
        await expect(this.connectFailedMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.tryAgainButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.uploadBillFallbackButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Click "Try again" on the error view to return to credential form
     */
    async clickTryAgain(): Promise<void> {
        await this.tryAgainButton.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }

    /**
     * Click "Upload bill" fallback on the error view
     */
    async clickUploadBillFallback(): Promise<void> {
        await this.uploadBillFallbackButton.click();
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
