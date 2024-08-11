import { type Page, type Locator, expect } from '@playwright/test';

export class BillingPage {
    //variables
    readonly page: Page;
    readonly Billing_Electric_Usage_Row: (electric_usage: string) => Locator;
    readonly Billing_Gas_Usage_Row: (gas_usage: string) => Locator;
    readonly Billing_Pay_Dialog_Title: Locator;
    readonly Billing_Pay_Bill_Final_Button: Locator;

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Billing_Electric_Usage_Row = (electric_usage: string) => page.locator(`//div[@class = "hidden md:block"]//span[contains(text(),"${electric_usage} kWh")]/ancestor::tr`)
        this.Billing_Gas_Usage_Row = (gas_usage: string) => page.locator(`//div[@class = "hidden md:block"]//span[contains(text(),"${gas_usage} therms")]/ancestor::tr`)
        this.Billing_Pay_Dialog_Title = page.getByRole('heading', { name: 'Bill Payment Details' })
        this.Billing_Pay_Bill_Final_Button = page.getByRole('button', { name: 'Pay' });

    }

    //methods
    async Click_Electric_Bill_Pay_Button(electric_usage: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await buttonLocator.click();

        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Bill_Final_Button).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Bill_Final_Button).toBeEnabled({timeout:30000});
        await this.Billing_Pay_Bill_Final_Button.hover();
        await this.Billing_Pay_Bill_Final_Button.click();
    }


    async Click_Gas_Bill_Pay_Button(gas_usage: string) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await buttonLocator.click();

        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Bill_Final_Button).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Bill_Final_Button).toBeEnabled({timeout:30000});
        await this.Billing_Pay_Bill_Final_Button.hover();
        await this.Billing_Pay_Bill_Final_Button.click();
    }


    //assertions

}




export default BillingPage;