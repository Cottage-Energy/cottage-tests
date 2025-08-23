import { type Page, type Locator, expect } from '@playwright/test';

export class BillUploadPage {
    // Variables
    readonly page: Page;
    
    // Connect Account Page elements
    readonly energySavingsHeading: Locator;
    readonly zipCodeTextbox: Locator;
    readonly utilityCombobox: Locator;
    readonly conEdisonOption: Locator;
    readonly letsGetStartedButton: Locator;
    
    // Neighborhood Page elements
    readonly neighborhoodHeading: Locator;
    readonly continueButton: Locator;
    
    // Upload Bill Page elements
    readonly uploadBillHeading: Locator;
    readonly fileInput: Locator;
    readonly agreeAndContinueButton: Locator;
    
    // Processing Page elements
    readonly scanningBillHeading: Locator;
    readonly goodNewsHeading: Locator;
    
    // Finish Setup Page elements
    readonly emailTextboxFinal: Locator;
    readonly autoEnrollText: Locator;
    readonly autoEnrollSwitch: Locator;
    readonly finishButton: Locator;
    readonly gotItButton: Locator;
    readonly wayToGoHeading: Locator;

    // Constructor
    constructor(page: Page) {
        this.page = page;
        
        // Connect Account Page
        this.energySavingsHeading = page.getByRole('heading', { name: 'Energy savings starts here' });
        this.zipCodeTextbox = page.getByRole('textbox').first();
        this.utilityCombobox = page.getByRole('combobox');
        this.conEdisonOption = page.getByLabel('Con Edison');
        this.letsGetStartedButton = page.getByRole('button', { name: 'Let\'s Get Started' });
        
        // Neighborhood Page
        this.neighborhoodHeading = page.getByRole('heading', { name: 'We are in your neighborhood' });
        this.continueButton = page.getByRole('button', { name: 'Continue' });
        
        // Upload Bill Page
        this.uploadBillHeading = page.getByRole('heading', { name: 'Upload your bill' });
        this.fileInput = page.locator('input[type="file"]');
        this.agreeAndContinueButton = page.getByRole('button', { name: 'Agree and Continue' });
        
        // Processing Page
        this.scanningBillHeading = page.getByRole('heading', { name: 'Hold tight, scanning your bill...' });
        this.goodNewsHeading = page.getByRole('heading', { name: 'Good news 🎉 Your account has untapped savings!' });
        
        // Finish Setup Page - Using last() to get the email textbox after processing
        this.emailTextboxFinal = page.getByRole('textbox').last();
        this.autoEnrollText = page.getByText('Auto-enroll in savings');
        this.autoEnrollSwitch = page.getByRole('switch');
        this.finishButton = page.getByRole('button', { name: 'Finish' });
        this.gotItButton = page.getByRole('button', { name: 'Got it!' });
        this.wayToGoHeading = page.getByRole('heading', { name: 'Way to Go 🥳' });
    }

    // Methods
    async navigateToConnectAccount() {
        await this.page.goto('https://dev.publicgrid.energy/bill-upload/connect-account');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async fillZipCodeAndSelectUtility(zipCode: string, utility: string = 'Con Edison') {
        await expect(this.energySavingsHeading).toBeVisible();
        await this.zipCodeTextbox.click();
        await this.zipCodeTextbox.fill(zipCode);
        await expect(this.utilityCombobox).toBeVisible();
        await this.utilityCombobox.click();
        
        // Wait a moment for dropdown to populate
        await this.page.waitForTimeout(1000);
        
        // Support multiple utilities
        switch (utility.toUpperCase()) {
            case 'CON EDISON':
            case 'CON-EDISON':
            case 'CONED':
                await expect(this.page.getByLabel('Con Edison')).toBeVisible();
                await this.page.getByLabel('Con Edison').click();
                break;
            case 'EVERSOURCE':
                await expect(this.page.getByLabel('Eversource')).toBeVisible();
                await this.page.getByLabel('Eversource').click();
                break;
            case 'COMED':
            case 'COMMONWEALTH EDISON':
                await expect(this.page.getByLabel('ComEd')).toBeVisible();
                await this.page.getByLabel('ComEd').click();
                break;
            default:
                // Default to Con Edison if utility not found
                await expect(this.conEdisonOption).toBeVisible();
                await this.conEdisonOption.click();
                break;
        }
    }

    async clickLetsGetStarted() {
        await this.letsGetStartedButton.click();
        await expect(this.neighborhoodHeading).toBeVisible();
    }

    async proceedFromNeighborhood() {
        await this.continueButton.click();
        await expect(this.uploadBillHeading).toBeVisible();
    }

    async uploadBillFile(filePath: string) {
        await this.fileInput.setInputFiles(filePath);
        await this.agreeAndContinueButton.click();
    }

    async waitForBillProcessing() {
        await expect(this.scanningBillHeading).toBeVisible({ timeout: 90000 });
        await expect(this.goodNewsHeading).toBeVisible({ timeout: 90000 });
    }

    async fillEmailAndFinish(email: string) {
        await this.emailTextboxFinal.click();
        await this.emailTextboxFinal.fill(email);
        await expect(this.autoEnrollText).toBeVisible();
        await expect(this.autoEnrollSwitch).toBeVisible();
        await this.finishButton.click();
        await this.gotItButton.click();
        await expect(this.wayToGoHeading).toBeVisible({ timeout: 60000 });
    }

    async completeBillUploadFlow(zipCode: string, filePath: string, email: string, utility: string = 'Con Edison') {
        await this.navigateToConnectAccount();
        await this.fillZipCodeAndSelectUtility(zipCode, utility);
        await this.clickLetsGetStarted();
        await this.proceedFromNeighborhood();
        await this.uploadBillFile(filePath);
        await this.waitForBillProcessing();
        await this.fillEmailAndFinish(email);
    }
}

export default BillUploadPage;
