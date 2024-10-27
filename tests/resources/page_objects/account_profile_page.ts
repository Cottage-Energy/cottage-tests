import { type Page, type Locator, expect } from '@playwright/test';

export class ProfilePage {

    //variables
    readonly page: Page;
    readonly Profile_Account_Title: Locator;

    readonly Profile_Payment_Info_Tab: Locator;
    readonly Profile_Payment_Info_Title: Locator;
 

    readonly Profile_Setup_Payment_Title: Locator
    readonly Profile_Setup_Payment_Button: Locator

    readonly Profile_Edit_Payment_Button: Locator

    readonly Profile_Auto_Payment_Checkbox: Locator
    readonly Profile_Save_Payment_Button: Locator
    readonly Profile_Success_Message: Locator

    readonly Profile_Payment_Initiated_Message: Locator



    //locators
    constructor(page: Page) {
        this.page = page;

        this.Profile_Account_Title = page.getByRole('heading', { name: 'Account', exact: true });

        this.Profile_Payment_Info_Tab = page.getByRole('tab', { name: 'Payment Information' });
        this.Profile_Payment_Info_Title = page.getByRole('heading', { name: 'Payment Information' });

        this.Profile_Setup_Payment_Title = page.locator('div').filter({ hasText: /^Set up payment method$/ }).first();
        this.Profile_Setup_Payment_Button = page.getByRole('button', { name: 'Set Up Payment' });

        this.Profile_Edit_Payment_Button = page.getByRole('button', { name: 'Edit' });

        this.Profile_Auto_Payment_Checkbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Profile_Save_Payment_Button = page.getByRole('button', { name: 'Save' });
        
        
        this.Profile_Success_Message = page.getByText('🥳 Success', { exact: true });

        this.Profile_Payment_Initiated_Message = page.getByText('Successfully initiated');//getByText('Good to go!');//getByText('Notification 🥳');//

    }

    //methods
    async Go_to_Payment_Info_Tab() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Profile_Payment_Info_Tab).toBeEnabled({timeout:30000});
        await this.Profile_Payment_Info_Tab.hover();
        await this.Profile_Payment_Info_Tab.click();
        await expect(this.Profile_Payment_Info_Title).toBeVisible({timeout:30000});
        await this.page.waitForTimeout(500);
    }


    async click_Setup_Payment_Button(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Profile_Setup_Payment_Title).toBeVisible({timeout:30000});
        await expect(this.Profile_Setup_Payment_Button).toBeVisible({timeout:30000});
        await this.Profile_Setup_Payment_Button.hover();
        await this.Profile_Setup_Payment_Button.click();
        await this.page.waitForTimeout(500);
    }

    async click_Edit_Payment_Button(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Profile_Edit_Payment_Button).toBeVisible({timeout:30000});
        await expect(this.Profile_Edit_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Edit_Payment_Button.hover();
        await this.Profile_Edit_Payment_Button.click();
        await this.page.waitForTimeout(3000);
    }


    async Enter_Auto_Payment_Details_After_Skip(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(5000);
    
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
                    console.error(`Failed to select option after ${maxRetries} attempts`);
                    break;
                }
            }
        }
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.waitForElementState('visible');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Profile_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Save_Payment_Button.hover();
        await this.page?.waitForTimeout(500);
        await this.Profile_Save_Payment_Button.click();

        await expect(this.Profile_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/account.*/, { timeout: 30000 });
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
                    console.error(`Failed to select option after ${maxRetries} attempts`);
                    break;
                }
            }
        }
    
    
        if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
            await CardZipCode?.waitForElementState('visible');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Profile_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Profile_Auto_Payment_Checkbox.hover();
        await this.Profile_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Profile_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Save_Payment_Button.hover({timeout:10000});
        await this.page?.waitForTimeout(500);
        await this.Profile_Save_Payment_Button.click();

        await expect(this.Profile_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/account.*/, { timeout: 30000 });
    }


    async Enter_Auto_Payment_Valid_Bank_Details_After_Skip(Email:string, FullName:string){
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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(1000);

        await this.Profile_Save_Payment_Button.waitFor({state:"attached",timeout:10000});
        await expect(this.Profile_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Save_Payment_Button.hover({timeout:10000});
        await this.page?.waitForTimeout(500);
        await this.Profile_Save_Payment_Button.click({timeout:10000});

        await expect(this.Profile_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/account.*/, { timeout: 30000 });
    }


    async Enter_Manual_Payment_Valid_Bank_Details_After_Skip(Email:string, FullName:string){
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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page?.waitForTimeout(1000);

        await expect(this.Profile_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Profile_Auto_Payment_Checkbox.hover();
        await this.Profile_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Profile_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Save_Payment_Button.hover();
        await this.page?.waitForTimeout(500);
        await this.Profile_Save_Payment_Button.click();

        await expect(this.Profile_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/account.*/, { timeout: 30000 });
    }

    
    async Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(Email:string, FullName:string){
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

        await expect(this.Profile_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Profile_Save_Payment_Button.hover();
        await this.page?.waitForTimeout(500);
        await this.Profile_Save_Payment_Button.click();

        await expect(this.Profile_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/account.*/, { timeout: 30000 });
    }

    

    //assertionns

    async Check_Payment_Initiated_Message(){
        try{
            await expect(this.Profile_Payment_Initiated_Message).toBeVisible({timeout:30000});
        }catch(error){
            console.log('Payment Initiated Message is not visible.');
        }
    }




}




export default ProfilePage;