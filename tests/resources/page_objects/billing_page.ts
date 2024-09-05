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
        ///this.Billing_Pay_Bill_Final_Button = page.getByRole('button', { name: 'Pay' });

    }

    //methods
    async Click_Electric_Bill_Pay_Button(electric_usage: string) {
        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});

        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await expect(buttonLocator).toBeVisible({timeout:30000});
        await expect(buttonLocator).toBeEnabled({timeout:30000});
        await buttonLocator.hover();
        await buttonLocator.click();
    }


    async Click_Gas_Bill_Pay_Button(gas_usage: string) {
        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});

        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await expect(buttonLocator).toBeVisible({timeout:30000});
        await expect(buttonLocator).toBeEnabled({timeout:30000});
        await buttonLocator.hover();
        await buttonLocator.click();
    }


    //assertions
    async Check_Electric_Bill_Hidden(electric_usage: string) {
        await expect(this.Billing_Electric_Usage_Row(electric_usage)).not.toBeVisible({timeout:30000});
    }

    async Check_Electric_Bill_Visibility(electric_usage: string) {
        await expect(this.Billing_Electric_Usage_Row(electric_usage)).toBeVisible({timeout:30000});
    }

    async Check_Electric_Bill_Status(electric_usage: string, status: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        const StatusLocator = rowLocator.locator(`//div[text() = "${status}"]`);
        await expect(StatusLocator).toBeVisible({timeout:30000});
    }

    async Check_Electric_Bill_View_Button(electric_usage: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        const ViewLocator = rowLocator.locator(`//a[text() = "View"]`);
        await expect(ViewLocator).toBeVisible({timeout:30000});
        await expect(ViewLocator).toBeEnabled({timeout:30000});
    }

    async Check_Electric_Bill_Amount(electric_usage: string, amount: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        console.log(amount);
        await expect(rowLocator).toContainText(amount);
    }

    async Check_Electric_Bill_Total(electric_usage: string, ExpectedTotal: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        console.log(ExpectedTotal);
        await expect(rowLocator).toContainText(ExpectedTotal);
    }




    async Check_Gas_Bill_Hidden(gas_usage: string) {
        await expect(this.Billing_Gas_Usage_Row(gas_usage)).not.toBeVisible({timeout:30000});
    }

    async Check_Gas_Bill_Visibility(gas_usage: string) {
        await expect(this.Billing_Gas_Usage_Row(gas_usage)).toBeVisible({timeout:30000});
    }

    async Check_Gas_Bill_Status(gas_usage: string, status: string) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        const StatusLocator = rowLocator.locator(`//div[text() = "${status}"]`);
        await expect(StatusLocator).toBeVisible({timeout:30000});
    }

    async Check_Gas_Bill_View_Button(gas_usage: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(gas_usage);
        const ViewLocator = rowLocator.locator(`//a[text() = "View"]`);
        await expect(ViewLocator).toBeVisible({timeout:30000});
        await expect(ViewLocator).toBeEnabled({timeout:30000});
    }

    async Check_Gas_Bill_Amount(gas_usage: string, amount: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(gas_usage);
        console.log(amount);
        await expect(rowLocator).toContainText(amount);
    }

    async Check_Gas_Bill_Fee(gas_usage: string, Expectedfee: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(gas_usage);
        const feeText = await rowLocator.textContent();
        console.log(Expectedfee);
        await expect(rowLocator).toContainText(Expectedfee);
    }

}




export default BillingPage;