import { type Page, type Locator, expect } from '@playwright/test';

export class BillingPage {
    //variables
    readonly page: Page;
    readonly Billing_Pay_Bill_Button: Locator;

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Billing_Pay_Bill_Button = page.locator('//div[@class = "hidden md:block"]//button[contains(text(),"Pay")]');
        
    }

    //methods

}




export default BillingPage;