import { type Page, type Locator, expect } from '@playwright/test';

export class BillingPage {
    //variables
    readonly page: Page;
    readonly Billing_Electric_Usage_Row: (electric_usage: string) => Locator;
    readonly Billing_Gas_Usage_Row: (gas_usage: string) => Locator;
    readonly Billing_Outstanding_Balance: Locator;

    readonly Billing_Bills_History_Tab: Locator;
    readonly Billing_Payments_Tab: Locator;

    readonly Billing_Make_Payment_Button: Locator;

    readonly Billing_Save_Payment_Button: Locator
    readonly Billing_Success_Message: Locator


    //locators
    constructor(page: Page) {
        this.page = page;
        this.Billing_Electric_Usage_Row = (electric_usage: string) => page.locator(`//div[@class = "hidden md:block"]//span[contains(text(),"${electric_usage} kWh")]/ancestor::tr`)
        this.Billing_Gas_Usage_Row = (gas_usage: string) => page.locator(`//div[@class = "hidden md:block"]//span[contains(text(),"${gas_usage} therms")]/ancestor::tr`)
        this.Billing_Outstanding_Balance = page.locator('//h3[contains(text(),"Outstanding Balance")]/parent::div/parent::div');

        this.Billing_Bills_History_Tab = page.getByRole('tab', { name: 'Bills History' });
        this.Billing_Payments_Tab = page.getByRole('tab', { name: 'Payments' });

        this.Billing_Make_Payment_Button = page.getByRole('button', { name: 'Make a Payment' });

        this.Billing_Save_Payment_Button = page.getByRole('button', { name: 'Save Payment Method' });
        this.Billing_Success_Message = page.getByText('🥳 Success', { exact: true });

    }

    //methods
    async Click_Make_Payment_Button() {
        await expect(this.Billing_Make_Payment_Button).toBeVisible({timeout:30000});
        await expect(this.Billing_Make_Payment_Button).toBeEnabled({timeout:30000});
        await this.Billing_Make_Payment_Button.hover();
        await this.Billing_Make_Payment_Button.click();
    }


    async Click_Electric_Bill_Pay_Button(electric_usage: any, amount: any, fee: any | null) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage.toString());
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await expect(buttonLocator).toBeVisible({timeout:30000});
        await expect(buttonLocator).toBeEnabled({timeout:30000});
        await buttonLocator.hover();
        await buttonLocator.click();

        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Dialog_Box).toContainText(amount.toString())

        if (fee !== null){
            await expect(this.Billing_Pay_Dialog_Box).toContainText(fee.toString())
        }

        await this.Billing_Pay_Bill_Final_Button.hover();
        await this.Billing_Pay_Bill_Final_Button.click();

        try {
            await expect(this.Billing_Successully_Initiated_Payment_Message).toBeVisible();
        } catch (error) {
            console.log('Billing Successfully Initiated Payment Message is not visible.');
        }
    }


    async Click_Gas_Bill_Pay_Button(gas_usage: any, amount: any, fee: any | null) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage.toString());
        const buttonLocator = rowLocator.locator(`//button[contains(text(),"Pay")]`);
        await expect(buttonLocator).toBeVisible({timeout:30000});
        await expect(buttonLocator).toBeEnabled({timeout:30000});
        await buttonLocator.hover();
        await buttonLocator.click();

        await expect(this.Billing_Pay_Dialog_Title).toBeVisible({timeout:30000});
        await expect(this.Billing_Pay_Dialog_Box).toContainText(amount.toString())

        if (fee !== null){
            await expect(this.Billing_Pay_Dialog_Box).toContainText(fee.toString())
        }

        await this.Billing_Pay_Bill_Final_Button.hover();
        await this.Billing_Pay_Bill_Final_Button.click();

        try {
            await expect(this.Billing_Successully_Initiated_Payment_Message).toBeVisible();
        } catch (error) {
            console.log('Billing Successfully Initiated Payment Message is not visible.');
        }
    }


    async Enter_Auto_Payment_Valid_Bank_Details_After_Failure(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded');

        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);
    
        const BankAccountTab = await stripeFrame?.waitForSelector('[id = "us_bank_account-tab"]');


        await BankAccountTab?.waitForElementState('visible');
        await BankAccountTab?.click();
        await this.page.waitForTimeout(500);

        const EmailInput = await stripeFrame?.waitForSelector('[id ="Field-emailInput"]');
        const NameInput = await stripeFrame?.waitForSelector('[id ="Field-nameInput"]');
        const TestInstButton = await stripeFrame?.waitForSelector('[data-testid ="featured-institution-default"]');

        await EmailInput?.fill(Email);
        await NameInput?.fill(FullName);
        await TestInstButton?.click();
        await this.page.waitForTimeout(500);

        const modalIframe = await this.page?.waitForSelector('[src^="https://js.stripe.com/v3/linked-accounts"]')
        const modalFrame = await modalIframe.contentFrame()
        await this.page.waitForTimeout(1000);

        const AgreeButton = await modalFrame?.waitForSelector('[data-testid ="agree-button"]');
        await AgreeButton?.waitForElementState('visible');
        await AgreeButton?.click();

        const SuccessAccountButton = await modalFrame?.waitForSelector('[data-testid ="success"]');
        await SuccessAccountButton?.waitForElementState('visible');
        await SuccessAccountButton?.click();

        const FailureAccountButton = await modalFrame?.waitForSelector('[data-testid ="failure"]');

        const ConfirmButton = await modalFrame?.waitForSelector('[data-testid ="select-button"]');
        await ConfirmButton?.waitForElementState('visible');
        await ConfirmButton?.click();

        const SuccessMessage = await modalFrame?.waitForSelector('//div[contains(@class, "SuccessPane-textWrapper")]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(1000);

        await this.Billing_Save_Payment_Button.waitFor({state:"attached",timeout:10000});
        await expect(this.Billing_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Billing_Save_Payment_Button.hover({timeout:10000});
        await this.Billing_Save_Payment_Button.click({timeout:10000});

        await expect(this.Billing_Success_Message).toBeVisible({timeout:30000});
    }



    //assertions
    async Check_Make_Payment_Button_Not_Visible() {
        await expect(this.Billing_Make_Payment_Button).not.toBeVisible({timeout:10000});
    }

    async Check_Make_Payment_Button_Visible() {
        await expect(this.Billing_Make_Payment_Button).toBeVisible({timeout:10000});
    }

    async Check_Make_Payment_Button_Enabled() {
        await expect(this.Billing_Make_Payment_Button).toBeEnabled({timeout:10000});
    }

    async Check_Make_Payment_Button_Disabled() {
        await expect(this.Billing_Make_Payment_Button).toBeDisabled({timeout:10000});
    }


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


    async Check_Electric_Bill_Fee(electric_usage: string, ExpectedFee: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        console.log(ExpectedFee);
        await expect(rowLocator).toContainText(ExpectedFee);
    }


    async Check_Electric_Bill_Fee_Not_Included(electric_usage: string, ExpectedFee: string) {
        const rowLocator = this.Billing_Electric_Usage_Row(electric_usage);
        console.log(ExpectedFee);
        await expect(rowLocator).not.toContainText(ExpectedFee);
    }

    //

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
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        const ViewLocator = rowLocator.locator(`//a[text() = "View"]`);
        await expect(ViewLocator).toBeVisible({timeout:30000});
        await expect(ViewLocator).toBeEnabled({timeout:30000});
    }


    async Check_Gas_Bill_Amount(gas_usage: string, amount: string) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        console.log(amount);
        await expect(rowLocator).toContainText(amount);
    }


    async Check_Gas_Bill_Fee(gas_usage: string, Expectedfee: string) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        console.log(Expectedfee);
        await expect(rowLocator).toContainText(Expectedfee);
    }


    async Check_Gas_Bill_Fee_Not_Included(gas_usage: string, Expectedfee: string) {
        const rowLocator = this.Billing_Gas_Usage_Row(gas_usage);
        console.log(Expectedfee);
        await expect(rowLocator).not.toContainText(Expectedfee);
    }


    async Check_Outstanding_Balance_Amount(ElectricAmount: any, GasAmount?: any) {
        const electricAmount = parseFloat(ElectricAmount);
        const gasAmount = parseFloat(GasAmount) || 0;
        
        const totalAmount = (electricAmount + gasAmount);

        if (totalAmount > 0) {
            let totalAmount2dec = totalAmount.toFixed(2);
            if (totalAmount2dec.endsWith('0')) {
                totalAmount2dec = parseFloat(totalAmount2dec).toString();
            }
            console.log(`TOTAL: ${totalAmount2dec}`);
            await expect(this.Billing_Outstanding_Balance).toContainText(`${totalAmount2dec}`);
        } else {
            console.log(`TOTAL: ${totalAmount}`);
            await expect(this.Billing_Outstanding_Balance).toContainText(`${totalAmount}`);
        }

        return totalAmount.toFixed(2);
        
    }


    async Check_Outstanding_Balance_Message(message: string) {
        await expect(this.Billing_Outstanding_Balance).toContainText(message);
    }


    async Check_Make_Payment_Button_Visible_Enable() {
        await expect(this.Billing_Make_Payment_Button).toBeEnabled();
        await expect(this.Billing_Make_Payment_Button).toBeVisible();
    }

}




export default BillingPage;