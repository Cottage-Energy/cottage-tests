import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * Page Object for the Bill Upload Modal on the overview page.
 * This is the modal that opens when clicking "Upload bill" on the auto-apply savings card.
 * NOT the same as BillUploadPage which is for the public /bill-upload/connect-account flow.
 *
 * Modal states: Idle → Ready (file selected) → Uploading → Success
 * Error state reuses Idle view with error message.
 */
export class BillUploadModalPage {
    readonly page: Page;

    // Modal container
    readonly modalDialog: Locator;

    // Idle view elements
    readonly modalTitle: Locator;
    readonly dropZoneClickToUpload: Locator;
    readonly dropZoneDragText: Locator;
    readonly fileInput: Locator;
    readonly cancelButton: Locator;
    readonly uploadButton: Locator;
    readonly connectAccountLink: Locator;

    // Ready view elements (file selected)
    readonly reUploadLink: Locator;

    // Success view elements
    readonly successIcon: Locator;
    readonly doneButton: Locator;

    // Error elements (shown in idle view)
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;

        // Modal container — the dialog/sheet that contains the bill upload form
        this.modalDialog = page.getByRole('dialog').filter({ hasText: /Upload document/i });

        // Idle view
        this.modalTitle = page.getByRole('heading', { name: /Upload document/i });
        this.dropZoneClickToUpload = page.getByText('Click to upload');
        this.dropZoneDragText = page.getByText(/or drag and drop/i);
        this.fileInput = page.locator('input[type="file"]');
        this.cancelButton = page.getByRole('button', { name: /Cancel/i });
        this.uploadButton = page.getByRole('button', { name: /^Upload$/i });
        this.connectAccountLink = page.getByText(/Connect account/i);

        // Ready view (file selected)
        this.reUploadLink = page.getByText(/Re-upload/i);

        // Success view
        this.successIcon = page.locator('[data-testid="alert-success"]')
            .or(page.locator('svg').filter({ hasText: /success/i }));
        this.doneButton = page.getByRole('button', { name: /Done/i });

        // Error elements
        this.errorMessage = page.locator('[role="alert"]')
            .or(page.getByText(/Something went wrong/i))
            .or(page.getByText(/too large/i));
    }

    /**
     * Verify the idle view is displayed with all expected elements
     */
    async verifyIdleView(): Promise<void> {
        await expect(this.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.dropZoneDragText).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.cancelButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.uploadButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the upload button is disabled when no file is selected
     */
    async verifyUploadButtonDisabled(): Promise<void> {
        await expect(this.uploadButton).toBeDisabled({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the upload button is enabled after file selection
     */
    async verifyUploadButtonEnabled(): Promise<void> {
        await expect(this.uploadButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Select a file for upload via the hidden file input
     */
    async selectFile(filePath: string): Promise<void> {
        await this.fileInput.setInputFiles(filePath);
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
    }

    /**
     * Verify the ready view (file selected, ready to upload)
     */
    async verifyReadyView(): Promise<void> {
        await expect(this.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.reUploadLink).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(this.uploadButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Click re-upload and verify return to idle view
     */
    async clickReUpload(): Promise<void> {
        await this.reUploadLink.click();
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
    }

    /**
     * Click the Upload button to submit the file
     */
    async clickUpload(): Promise<void> {
        await expect(this.uploadButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
        await this.uploadButton.click();
    }

    /**
     * Click Cancel to close the modal
     */
    async clickCancel(): Promise<void> {
        await this.cancelButton.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }

    /**
     * Verify the success view is displayed
     */
    async verifySuccessView(): Promise<void> {
        await expect(this.doneButton).toBeVisible({ timeout: TIMEOUTS.LONG });
    }

    /**
     * Click Done on the success view to close modal
     */
    async clickDone(): Promise<void> {
        await this.doneButton.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }

    /**
     * Verify the "Connect account" alternative link is visible
     */
    async verifyConnectAccountLinkVisible(): Promise<void> {
        await expect(this.connectAccountLink).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }

    /**
     * Click "Connect account" to switch to the connect utility modal
     */
    async clickConnectAccount(): Promise<void> {
        await this.connectAccountLink.click();
        await this.page.waitForTimeout(TIMEOUTS.ANIMATION);
    }

    /**
     * Verify error message is displayed in the idle view
     */
    async verifyErrorMessage(expectedText: string): Promise<void> {
        const errorEl = this.page.getByText(expectedText);
        await expect(errorEl).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }

    /**
     * Verify file-too-large error message
     */
    async verifyFileTooLargeError(): Promise<void> {
        await this.verifyErrorMessage('Your file is too large');
    }
}

export default BillUploadModalPage;
