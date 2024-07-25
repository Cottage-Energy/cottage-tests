import { type Page, type Locator, expect } from '@playwright/test';

export class FinishAccountSetupPage {
    
    //variables
    readonly page: Page;
    readonly Finish_Account_Title: Locator
    readonly Finish_Account_Service_Fee_Message: Locator
    readonly Finish_Account_Auto_Payment_Checkbox: Locator
    readonly Finish_Account_Save_Payment_Button: Locator
    readonly Finish_Account_Success_Message: Locator
    readonly Finish_Account_Auto_Payment_Disabled_Message: Locator

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Finish_Account_Title = page.getByRole('heading', { name: 'Finish Account Setup' });
        this.Finish_Account_Service_Fee_Message = page.getByText('Credit Card payments will be');
        this.Finish_Account_Auto_Payment_Checkbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Finish_Account_Save_Payment_Button = page.getByRole('button', { name: 'Save Payment Method' });
        this.Finish_Account_Success_Message = page.getByText('🥳 Success');
        this.Finish_Account_Auto_Payment_Disabled_Message = page.getByText('🛑 Auto-pay disabled');
    }

    //methods
    async Enter_Auto_Payment_Details_After_Skip(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        await expect(this.Finish_Account_Title).toBeVisible({timeout:30000});
        await expect(this.Finish_Account_Service_Fee_Message).toBeVisible({timeout:30000});
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
    
    
        await CardNUmberInput?.fill(CCnumber,{timeout:10000});
        await CardExpiration?.fill(CCexpiry,{timeout:10000});
        await CardCVC?.fill(CCcvc,{timeout:10000});
        await CardCountry?.selectOption(CCcountry,{timeout:10000});
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Finish_Account_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Finish_Account_Save_Payment_Button.hover();
        await this.Finish_Account_Save_Payment_Button.click();

        await expect(this.Finish_Account_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*overview\?accountSetupComplete=true.*/);
    }


    async Enter_Manual_Payment_Details_After_Skip(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        await expect(this.Finish_Account_Title).toBeVisible({timeout:30000});
        await expect(this.Finish_Account_Service_Fee_Message).toBeVisible({timeout:30000});
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
    
    
        await CardNUmberInput?.fill(CCnumber,{timeout:10000});
        await CardExpiration?.fill(CCexpiry,{timeout:10000});
        await CardCVC?.fill(CCcvc,{timeout:10000});
        await CardCountry?.selectOption(CCcountry,{timeout:10000});
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Finish_Account_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Finish_Account_Auto_Payment_Checkbox.hover();
        await this.Finish_Account_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        await expect(this.Finish_Account_Auto_Payment_Disabled_Message).toBeVisible({timeout:30000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Finish_Account_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Finish_Account_Save_Payment_Button.hover();
        await this.Finish_Account_Save_Payment_Button.click();

        await expect(this.Finish_Account_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*overview\?accountSetupComplete=true.*/);
    }

}

export default FinishAccountSetupPage;