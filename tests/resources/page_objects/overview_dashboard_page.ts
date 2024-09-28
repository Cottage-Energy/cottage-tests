import { type Page, type Locator, expect } from '@playwright/test';

export class OverviewPage {

    //variables
    readonly page: Page;
    readonly Overview_Outstanding_Balance: Locator;
    readonly Overview_Make_Payment_Button: Locator;

    readonly Overview_Electricity_Card: Locator;
    readonly Overview_Gas_Card: Locator;

    readonly Overview_Get_Started_Widget: Locator
    readonly Overview_Setup_Payment_Link: Locator

    readonly Overview_Add_Payment_Title: Locator
    readonly Overview_Service_Fee_Message: Locator
    readonly Overview_Auto_Payment_Checkbox: Locator
    readonly Overview_Save_Payment_Button: Locator
    readonly Overview_Success_Message: Locator
    readonly Overview_Auto_Payment_Disabled_Message: Locator

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Overview_Outstanding_Balance = page.locator('//h3[contains(text(),"Outstanding Balance")]/parent::div');
        this.Overview_Make_Payment_Button = page.getByRole('button', { name: 'Make a Payment' });

        this.Overview_Electricity_Card = page.locator('//span[text()="Electricity"]/parent::h3/parent::div/parent::div');
        this.Overview_Gas_Card = page.locator('//span[text()="Gas"]/parent::h3/parent::div/parent::div');

        this.Overview_Get_Started_Widget = page.locator('//h3[contains(text(),"Getting Started")]/parent::div/parent::div');
        this.Overview_Setup_Payment_Link = page.getByText('Setup a Payment Method');

        this.Overview_Add_Payment_Title = page.getByRole('heading', { name: 'Add Payment Method' });
        this.Overview_Service_Fee_Message = page.getByText('Credit Card payments will be');

        this.Overview_Auto_Payment_Checkbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Overview_Save_Payment_Button = page.getByRole('button', { name: 'Save Payment Method' });
        this.Overview_Success_Message = page.getByText('🥳 Success', { exact: true });
        this.Overview_Auto_Payment_Disabled_Message = page.getByText('🛑 Auto-pay disabled', { exact: true });
    }

    //methods

    async Click_Setup_Payment_Link(){
        await expect(this.Overview_Get_Started_Widget).toBeVisible({timeout:30000});
        await this.Overview_Setup_Payment_Link.waitFor({state:"visible",timeout:10000});
        await this.Overview_Setup_Payment_Link.hover({timeout:10000});
        await this.Overview_Setup_Payment_Link.click({timeout:10000});

        await expect(this.Overview_Add_Payment_Title).toBeVisible({timeout:30000});
        await expect(this.Overview_Service_Fee_Message).toBeVisible({timeout:30000});
    }


    async Enter_Auto_Payment_Details_After_Skip(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
    
    
        await CardNUmberInput?.waitForElementState('visible');
        await CardNUmberInput?.fill(CCnumber,{timeout:10000});

        await CardExpiration?.waitForElementState('visible');
        await CardExpiration?.fill(CCexpiry,{timeout:10000});

        await CardCVC?.waitForElementState('visible');
        await CardCVC?.fill(CCcvc,{timeout:10000});
        
        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                await CardCountry?.waitForElementState('stable');
                await CardCountry?.waitForElementState('enabled');
                await CardCountry?.hover();
                await CardCountry?.selectOption(CCcountry, { timeout: 30000 });
                success = true; // If the operation succeeds, set success to true
            } catch (error) {
                attempt++;
                console.error(`Attempt ${attempt} failed: ${error}`);
                if (attempt >= maxRetries) {
                throw new Error(`Failed to select option after ${maxRetries} attempts`);
                }
            }
        }
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.waitForElementState('visible');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Manual_Payment_Details_After_Skip(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
    
    
        await CardNUmberInput?.waitForElementState('visible');
        await CardNUmberInput?.fill(CCnumber,{timeout:10000});

        await CardExpiration?.waitForElementState('visible');
        await CardExpiration?.fill(CCexpiry,{timeout:10000});

        await CardCVC?.waitForElementState('visible');
        await CardCVC?.fill(CCcvc,{timeout:10000});
        
        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                await CardCountry?.waitForElementState('stable');
                await CardCountry?.waitForElementState('enabled');
                await CardCountry?.hover();
                await CardCountry?.selectOption(CCcountry, { timeout: 30000 });
                success = true; // If the operation succeeds, set success to true
            } catch (error) {
                attempt++;
                console.error(`Attempt ${attempt} failed: ${error}`);
                if (attempt >= maxRetries) {
                throw new Error(`Failed to select option after ${maxRetries} attempts`);
                }
            }
        }
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.waitForElementState('visible');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Overview_Auto_Payment_Checkbox.hover();
        await this.Overview_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        await expect(this.Overview_Auto_Payment_Disabled_Message).toBeVisible({timeout:30000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover({timeout:10000});
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Auto_Payment_Valid_Bank_Details_After_Skip(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded' && 'load');

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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(1000);

        await this.Overview_Save_Payment_Button.waitFor({state:"attached",timeout:10000});
        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover({timeout:10000});
        await this.Overview_Save_Payment_Button.click({timeout:10000});

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Manual_Payment_Valid_Bank_Details_After_Skip(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded' && 'load');

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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page?.waitForTimeout(1000);

        await expect(this.Overview_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Overview_Auto_Payment_Checkbox.hover();
        await this.Overview_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        await expect(this.Overview_Auto_Payment_Disabled_Message).toBeVisible({timeout:30000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }

    
    async Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded' && 'load');

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

        const FailureAccountButton = await modalFrame?.waitForSelector('[data-testid ="failure"]');
        await FailureAccountButton?.waitForElementState('visible');
        await FailureAccountButton?.click();

        const ConfirmButton = await modalFrame?.waitForSelector('[data-testid ="select-button"]');
        await ConfirmButton?.waitForElementState('visible');
        await ConfirmButton?.click();

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(1000);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }

    

    //assertions

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
            await expect(this.Overview_Outstanding_Balance).toContainText(`${totalAmount2dec}`);
        } else {
            console.log(`TOTAL: ${totalAmount}`);
            await expect(this.Overview_Outstanding_Balance).toContainText(`${totalAmount}`);
        }
        
    }


    async Check_Outstanding_Balance_Auto_Pay_Message(message: string) {
        await expect(this.Overview_Outstanding_Balance).toContainText(message);
    }


    async Check_Make_Payment_Button_Visible_Enable() {
        await expect(this.Overview_Make_Payment_Button).toBeEnabled();
        await expect(this.Overview_Make_Payment_Button).toBeVisible();
    }


    async Check_Electricity_Card_Not_Visible() {
        await expect(this.Overview_Electricity_Card).toBeHidden();
    }

    async Check_Gas_Card_Not_Visible() {
        await expect(this.Overview_Gas_Card).toBeHidden();
    }

    

}




export default OverviewPage;