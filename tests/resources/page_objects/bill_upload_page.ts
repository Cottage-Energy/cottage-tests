import { type Page, type Locator, expect } from '@playwright/test';

export class BillUploadPage {
    // Variables
    readonly page: Page;
    
    // Connect Account Page elements
    readonly energySavingsHeading: Locator;
    readonly zipCodeTextbox: Locator;
    readonly utilityCombobox: Locator;
    readonly checkAvailabilityButton: Locator;
    
    // Upload Bill Page elements
    readonly uploadBillHeading: Locator;
    readonly emailTextbox: Locator;
    readonly fileInput: Locator;
    readonly uploadBillButton: Locator;
    
    // Processing Page elements
    readonly scanningBillHeading: Locator;
    
    // Success Page elements
    readonly successHeading: Locator;
    readonly continueToAccountButton: Locator;

    // Constructor
    constructor(page: Page) {
        this.page = page;
        
        // Connect Account Page
        this.energySavingsHeading = page.getByRole('heading', { name: 'Stop overpaying for electricity' });
        this.zipCodeTextbox = page.getByRole('textbox').first();
        this.utilityCombobox = page.getByRole('combobox');
        this.checkAvailabilityButton = page.getByRole('button', { name: /Check availability/i });
        
        // Upload Bill Page
        this.uploadBillHeading = page.getByRole('heading', { name: /Upload your bill/i });
        this.emailTextbox = page.getByRole('textbox');
        this.fileInput = page.locator('input[type="file"]');
        this.uploadBillButton = page.getByRole('button', { name: /Upload bill/i });
        
        // Processing Page
        this.scanningBillHeading = page.getByRole('heading', { name: /Scanning bill/i });
        
        // Success Page
        this.successHeading = page.getByRole('heading', { name: /You're all set/i });
        this.continueToAccountButton = page.getByRole('button', { name: /Continue to My Account/i });
    }

    // Methods
    async navigateToConnectAccount() {
        await this.page.goto('https://dev.publicgrid.energy/bill-upload/connect-account');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async fillZipCodeAndSelectUtility(zipCode: string, utility: string = 'Con Edison') {
        await expect(this.energySavingsHeading).toBeVisible({ timeout: 10000 });
        await this.zipCodeTextbox.click();
        await this.zipCodeTextbox.fill(zipCode);
        await this.page.waitForTimeout(2000);

        // Select utility from dropdown if combobox appears
        const hasCombobox = await this.utilityCombobox.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasCombobox) {
            await this.utilityCombobox.click();
            await this.page.waitForTimeout(1000);
            
            const option = this.page.getByRole('option', { name: new RegExp(utility, 'i') });
            await expect(option).toBeVisible({ timeout: 5000 });
            await option.click();
            await this.page.waitForTimeout(500);
        }
    }

    async clickCheckAvailability() {
        await expect(this.checkAvailabilityButton).toBeVisible({ timeout: 5000 });
        await this.checkAvailabilityButton.click();
        await expect(this.uploadBillHeading).toBeVisible({ timeout: 15000 });
    }

    async fillEmailAndUploadBill(email: string, filePath: string) {
        await expect(this.uploadBillHeading).toBeVisible({ timeout: 10000 });
        await this.emailTextbox.click();
        await this.emailTextbox.fill(email);
        await this.fileInput.setInputFiles(filePath);
        await this.page.waitForTimeout(1000);
        await expect(this.uploadBillButton).toBeEnabled({ timeout: 5000 });
        await this.uploadBillButton.click();
    }

    async waitForBillProcessing() {
        await expect(this.scanningBillHeading).toBeVisible({ timeout: 30000 });
        await expect(this.successHeading).toBeVisible({ timeout: 90000 });
    }

    async verifySuccess() {
        await expect(this.successHeading).toBeVisible({ timeout: 10000 });
        await expect(this.continueToAccountButton).toBeVisible({ timeout: 10000 });
    }

    async completeBillUploadFlow(zipCode: string, filePath: string, email: string, utility: string = 'Con Edison') {
        await this.navigateToConnectAccount();
        await this.fillZipCodeAndSelectUtility(zipCode, utility);
        await this.clickCheckAvailability();
        await this.fillEmailAndUploadBill(email, filePath);
        await this.waitForBillProcessing();
        await this.verifySuccess();
    }
}

export default BillUploadPage;
