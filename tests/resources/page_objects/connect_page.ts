import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * Page Object for the /connect registration page
 * Covers the connect account registration form and its elements
 */
export class ConnectPage {
    readonly page: Page;

    // Page elements
    readonly pageHeading: Locator;
    readonly pageSubtext: Locator;
    readonly billSavingsImage: Locator;

    // Form fields
    readonly addressInput: Locator;
    readonly emailInput: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly utilityCombobox: Locator;

    // Buttons
    readonly getStartedButton: Locator;

    // Legal links
    readonly letterOfAuthorizationLink: Locator;
    readonly termsLink: Locator;

    // Toast notifications
    readonly toastNotification: Locator;
    readonly toastTitle: Locator;
    readonly toastDescription: Locator;

    constructor(page: Page) {
        this.page = page;

        // Page elements
        this.pageHeading = page.getByRole('heading', { name: /Find savings on your energy bill/i });
        this.pageSubtext = page.getByText('We scan for better rates and alert you when we find one');
        this.billSavingsImage = page.getByRole('img', { name: 'Energy bill savings' });

        // Form fields
        this.addressInput = page.locator('#address');
        this.emailInput = page.locator('input[name="email"]');
        this.firstNameInput = page.locator('input[name="firstName"]');
        this.lastNameInput = page.locator('input[name="lastName"]');
        this.utilityCombobox = page.getByRole('combobox').first();

        // Buttons
        this.getStartedButton = page.getByRole('button', { name: 'Get started' });

        // Legal links
        this.letterOfAuthorizationLink = page.getByRole('link', { name: 'Letter of Authorization' });
        this.termsLink = page.getByRole('link', { name: 'Terms' });

        // Toast notifications (Sonner toast component)
        this.toastNotification = page.locator('[data-sonner-toast]').or(page.getByRole('status').first());
        this.toastTitle = page.locator('[data-sonner-toast] [data-title]').or(page.getByRole('status').locator('div').first());
        this.toastDescription = page.locator('[data-sonner-toast] [data-description]').or(page.getByRole('status').locator('div').nth(1));
    }

    /**
     * Navigate to the /connect registration page
     */
    async navigateToConnect(): Promise<void> {
        await this.page.goto('/connect', { waitUntil: 'domcontentloaded' });
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Fill the address field and select from autocomplete.
     * Autocomplete suggestions are plain <div> elements (not role="option")
     * that contain the address text appended with ", USA".
     * Retries up to 3 times if Google Places autocomplete is slow.
     */
    async fillAddress(address: string): Promise<void> {
        const streetName = address.split(',')[0].trim();
        const suggestion = this.page.getByText(new RegExp(`${streetName}.*USA`, 'i')).first();

        for (let attempt = 0; attempt < 3; attempt++) {
            await this.addressInput.click();
            await this.addressInput.clear();
            await this.addressInput.fill(address);
            await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

            const hasSuggestion = await suggestion.isVisible({ timeout: TIMEOUTS.MEDIUM }).catch(() => false);
            if (hasSuggestion) {
                await suggestion.click();
                await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
                return;
            }
        }
        throw new Error(`Address autocomplete suggestion not found for "${address}" after 3 attempts`);
    }

    /**
     * Fill the registration form with provided data
     */
    async fillRegistrationForm(data: {
        address: string;
        email: string;
        firstName: string;
        lastName: string;
    }): Promise<void> {
        await this.fillAddress(data.address);
        await this.emailInput.fill(data.email);
        await this.firstNameInput.fill(data.firstName);
        await this.lastNameInput.fill(data.lastName);
    }

    /**
     * Select a utility company from the dropdown.
     * Some addresses auto-detect the utility (no combobox shown) — skips selection in that case.
     */
    async selectUtility(utilityName: string): Promise<void> {
        const isComboboxVisible = await this.utilityCombobox.isVisible({ timeout: TIMEOUTS.MEDIUM }).catch(() => false);
        if (!isComboboxVisible) {
            return;
        }
        await this.utilityCombobox.click();
        const option = this.page.getByRole('option', { name: utilityName });
        await expect(option).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await option.click();
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
    }

    /**
     * Click the Get Started button
     */
    async clickGetStarted(): Promise<void> {
        await expect(this.getStartedButton).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });
        await this.getStartedButton.click();
    }

    /**
     * Verify that the error toast is displayed with expected message
     */
    async verifyErrorToast(expectedMessage: string): Promise<void> {
        const toast = this.page.getByRole('status').first();
        await expect(toast).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(toast).toContainText(expectedMessage, { timeout: TIMEOUTS.SHORT });
    }

    /**
     * Verify the Get Started button is re-enabled after an error
     */
    async verifyButtonReEnabledAfterError(): Promise<void> {
        await expect(this.getStartedButton).toBeEnabled({ timeout: TIMEOUTS.MEDIUM });
    }

    /**
     * Verify form fields are visible
     */
    async verifyFormFieldsVisible(): Promise<void> {
        await expect(this.addressInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.firstNameInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.lastNameInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }

    /**
     * Verify the page heading and subtext
     */
    async verifyPageContent(): Promise<void> {
        await expect(this.pageHeading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.pageSubtext).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }
}

export default ConnectPage;
