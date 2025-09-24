import { type Page, type Locator, expect } from '@playwright/test';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { format } from 'date-fns';

const supabaseQueries = new SupabaseQueries();

export class OverviewPage {

    //variables
    readonly page: Page;
    readonly Overview_Outstanding_Balance: Locator;
    readonly Overview_Make_Payment_Button: Locator;

    readonly Overview_Electricity_Card: Locator;
    readonly Overview_Gas_Card: Locator;

    readonly Overview_Add_Payment_Title: Locator
    readonly Overview_Service_Fee_Message: Locator
    readonly Overview_Auto_Payment_Checkbox: Locator
    readonly Overview_Save_Payment_Button: Locator
    readonly Overview_Success_Message: Locator

    readonly Overview_User_Menu: (firstName: string) => Locator;
    readonly Overview_Profile_Button: Locator;

    readonly Overview_Failed_Payment_Alert: Locator;
    readonly Overview_Failed_Payment_Update_Payment_Link: Locator;



    readonly Overview_New_Terms_Modal_Title: Locator
    readonly Overview_New_Terms_Modal_Content: Locator
    readonly Overview_New_Terms_Modal_Agree_Checkbox: Locator
    readonly Overview_New_Terms_Modal_Accept_Button: Locator

    readonly Overview_Inactive_Account_Alert: Locator

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Overview_Outstanding_Balance = page.locator('//h3[contains(text(),"Outstanding Balance")]/parent::div/parent::div');
        this.Overview_Make_Payment_Button = page.getByRole('button', { name: 'Make a Payment' });

        this.Overview_Electricity_Card = page.locator('//span[text()="Electricity"]/parent::h3/parent::div/parent::div');
        this.Overview_Gas_Card = page.locator('//span[text()="Gas"]/parent::h3/parent::div/parent::div');


        this.Overview_Add_Payment_Title = page.getByRole('heading', { name: 'Add Payment Method' });
        this.Overview_Service_Fee_Message = page.getByText('Credit Card payments will be');

        this.Overview_Auto_Payment_Checkbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Overview_Save_Payment_Button = page.getByRole('button', { name: 'Save Payment Method' });
        this.Overview_Success_Message = page.getByText('🥳 Success', { exact: true });

        this.Overview_User_Menu = (firstName: string) => page.locator(`//div[contains(text(),"${firstName}")]`);
        this.Overview_Profile_Button = page.getByRole('menuitem', { name: 'Profile' });

        this.Overview_Failed_Payment_Alert = page.getByText('Automatic Payment Failed.');
        this.Overview_Failed_Payment_Update_Payment_Link = page.getByRole('link', { name: 'Update Payment Information' });



        this.Overview_New_Terms_Modal_Title = page.getByRole('heading', { name: 'We\'ve made updates to our' });
        this.Overview_New_Terms_Modal_Content = page.getByText('We have expanded our services');
        this.Overview_New_Terms_Modal_Agree_Checkbox = page.locator('//p[contains(text(),"I agree to the updated Terms of Service")]//preceding::button[@role="checkbox"]')
        this.Overview_New_Terms_Modal_Accept_Button = page.getByRole('button', { name: 'Accept' })

        this.Overview_Inactive_Account_Alert = page.getByText('Inactive Account: Service at');
    }

    //methods
    async Accept_New_Terms_And_Conditions(){
        const maxRetries = 10;
        let retries = 0;
        let vis = false;

        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        while (retries < maxRetries) {
            vis = await this.Overview_New_Terms_Modal_Title.isVisible();
            if (vis == true) {
                break;
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, 500)); // wait for 0.5 seconds
        }
        
        console.log("Updated Terms:",vis);

        if(vis == true){
            await expect(this.Overview_New_Terms_Modal_Title).toBeVisible({timeout:30000});
            await expect(this.Overview_New_Terms_Modal_Content).toBeVisible({timeout:30000});
            await expect(this.Overview_New_Terms_Modal_Agree_Checkbox).toBeVisible({timeout:30000});
            await expect (this.Overview_New_Terms_Modal_Accept_Button).toBeVisible({timeout:30000});
    
            await this.Overview_New_Terms_Modal_Agree_Checkbox.hover({timeout:30000});
            await this.Overview_New_Terms_Modal_Agree_Checkbox.isEnabled({timeout:10000});
            await this.Overview_New_Terms_Modal_Agree_Checkbox.setChecked(true,{timeout:10000});
            await this.Overview_New_Terms_Modal_Accept_Button.hover({timeout:30000});
            await this.Overview_New_Terms_Modal_Accept_Button.isEnabled({timeout:10000});
            await this.Overview_New_Terms_Modal_Accept_Button.click();
    
            await expect(this.Overview_New_Terms_Modal_Title).not.toBeVisible({timeout:30000});
            await this.page.waitForTimeout(1000);
        }

    }

    async Go_to_Profile(firstName: string) {
        await this.Overview_User_Menu(firstName).waitFor({state:"visible",timeout:10000});
        await this.Overview_User_Menu(firstName).hover();
        await this.Overview_User_Menu(firstName).click();
        await this.Overview_Profile_Button.waitFor({state:"visible",timeout:10000});
        await this.Overview_Profile_Button.hover();
        await this.Overview_Profile_Button.click();
    }

    async Enter_Auto_Payment_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);

        const CardTab = await stripeFrame?.waitForSelector('[id = "card-tab"]');


        await CardTab?.waitForElementState('visible');
        await CardTab?.click();
        await this.page.waitForTimeout(500);
    
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

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Manual_Payment_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        
        
        const stripeIframe = await this.page?.waitForSelector('[title ="Secure payment input frame"]')
        const stripeFrame = await stripeIframe.contentFrame()
        await this.page.waitForTimeout(3000);

        const CardTab = await stripeFrame?.waitForSelector('[id = "card-tab"]');


        await CardTab?.waitForElementState('visible');
        await CardTab?.click();
        await this.page.waitForTimeout(500);
    
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

        await expect(this.Overview_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Overview_Auto_Payment_Checkbox.hover();
        await this.Overview_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover({timeout:10000});
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Auto_Payment_Valid_Bank_Details(Email:string, FullName:string){
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

        await this.Overview_Save_Payment_Button.waitFor({state:"attached",timeout:10000});
        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover({timeout:10000});
        await this.Overview_Save_Payment_Button.click({timeout:10000});

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Enter_Manual_Payment_Valid_Bank_Details(Email:string, FullName:string){
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
        await this.page?.waitForTimeout(1000);

        await expect(this.Overview_Auto_Payment_Checkbox).toBeEnabled({timeout:30000});
        await this.Overview_Auto_Payment_Checkbox.hover();
        await this.Overview_Auto_Payment_Checkbox.setChecked(false,{timeout:10000});
        
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        await expect(this.Overview_Success_Message).toBeVisible({timeout:30000});
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }

    
    async Enter_Auto_Payment_Invalid_Bank_Details(Email:string, FullName:string){
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

        const SuccessMessage = await modalFrame?.waitForSelector('//div[contains(@class, "SuccessPane-textWrapper")]');
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


    async Check_Click_Failed_Payment_Update_Payment_Link(){
        await expect(this.Overview_Failed_Payment_Alert).toBeVisible({timeout:10000});  
        await this.Overview_Failed_Payment_Update_Payment_Link.waitFor({state:"visible",timeout:10000});
        await this.Overview_Failed_Payment_Update_Payment_Link.hover();
        await this.Overview_Failed_Payment_Update_Payment_Link.click();
    }


    async Click_Make_Payment_Button() {
        await expect(this.Overview_Make_Payment_Button).toBeVisible({timeout:30000});
        await expect(this.Overview_Make_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Make_Payment_Button.hover();
        await this.Overview_Make_Payment_Button.click();
    }

    

    //assertions
    async Check_Make_Payment_Button_Visible(){
        await expect(this.Overview_Make_Payment_Button).toBeVisible({timeout:10000});
    }

    async Check_Make_Payment_Button_Not_Visible(){
        await expect(this.Overview_Make_Payment_Button).toBeHidden({timeout:10000});
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
            await expect(this.Overview_Outstanding_Balance).toContainText(`${totalAmount2dec}`);
            return totalAmount2dec;
        } else {
            console.log(`TOTAL: ${totalAmount}`);
            await expect(this.Overview_Outstanding_Balance).toContainText(`${totalAmount}`);
            return totalAmount;
        }
        
    }


    async Check_Outstanding_Balance_Message(message: string) {
        await expect(this.Overview_Outstanding_Balance).toContainText(message);
    }


    async Check_Electricity_Card_Not_Visible() {
        await expect(this.Overview_Electricity_Card).toBeHidden();
    }


    async Check_Gas_Card_Not_Visible() {
        await expect(this.Overview_Gas_Card).toBeHidden();
    }


    async Check_Electricity_Card_Contain_Bill_Details(BillId: string, Amount: any, Usage: any) {

        await expect(this.Overview_Electricity_Card).toBeVisible();

        const startDate = await supabaseQueries.Get_Electric_Bill_Start_Date(BillId);
        const endDate = await supabaseQueries.Get_Electric_Bill_End_Date(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(Amount).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = Usage.toString();

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Electricity_Card).toContainText(StartDateFormatted);
        await expect(this.Overview_Electricity_Card).toContainText(EndDateFormatted);
        await expect(this.Overview_Electricity_Card).toContainText(amount);
        await expect(this.Overview_Electricity_Card).toContainText(usage);
    }


    async Check_Electricity_Card_Is_Clear(BillId: string, Amount: any, Usage: any) {

        await expect(this.Overview_Electricity_Card).toBeVisible();

        const startDate = await supabaseQueries.Get_Electric_Bill_Start_Date(BillId);
        const endDate = await supabaseQueries.Get_Electric_Bill_End_Date(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(Amount).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = Usage.toString();

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Electricity_Card).not.toContainText(StartDateFormatted);
        await expect(this.Overview_Electricity_Card).not.toContainText(EndDateFormatted);
        await expect(this.Overview_Electricity_Card).not.toContainText(amount);
        await expect(this.Overview_Electricity_Card).not.toContainText(usage);
    }


    async Check_Gas_Card_Contain_Bill_Details(BillId: string, Amount: any, Usage: any) {

        await expect(this.Overview_Gas_Card).toBeVisible();

        const startDate = await supabaseQueries.Get_Gas_Bill_Start_Date(BillId);
        const endDate = await supabaseQueries.Get_Gas_Bill_End_Date(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(Amount).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = Usage.toString();

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Gas_Card).toContainText(StartDateFormatted);
        await expect(this.Overview_Gas_Card).toContainText(EndDateFormatted);
        await expect(this.Overview_Gas_Card).toContainText(amount);
        await expect(this.Overview_Gas_Card).toContainText(usage);
    }


    async Check_Gas_Card_Is_Clear(BillId: string, Amount: any, Usage: any) {

        await expect(this.Overview_Gas_Card).toBeVisible();

        const startDate = await supabaseQueries.Get_Gas_Bill_Start_Date(BillId);
        const endDate = await supabaseQueries.Get_Gas_Bill_End_Date(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(Amount).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = Usage.toString();

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Gas_Card).not.toContainText(StartDateFormatted);
        await expect(this.Overview_Gas_Card).not.toContainText(EndDateFormatted);
        await expect(this.Overview_Gas_Card).not.toContainText(amount);
        await expect(this.Overview_Gas_Card).not.toContainText(usage);
    }


    async Check_Inactive_Account_Alert_Visible() {
        await expect(this.Overview_Inactive_Account_Alert).toBeVisible({timeout:30000});
    }

}




export default OverviewPage;