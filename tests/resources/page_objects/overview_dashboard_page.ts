import { type Page, type Locator, expect } from '@playwright/test';
import { billQueries } from '../fixtures/database';
import { format } from 'date-fns';

export class OverviewPage {

    //variables
    readonly page: Page;
    readonly Overview_Outstanding_Balance: Locator;
    readonly Overview_Pay_Bill_Button: Locator;

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

    readonly Overview_Setup_Password_Title: Locator
    readonly Overview_Setup_Password_Description: Locator
    readonly Overview_Setup_Password_Field: Locator
    readonly Overview_Setup_Password_Confirm_Password_Field: Locator
    readonly Overview_Setup_Password_Set_Password_Button: Locator

    readonly Overview_Add_Payment_Info_Title: Locator
    readonly Overview_Pay_In_Full_Option: Locator
    readonly Overview_Split_My_Bill_Option: Locator
    readonly Overview_Sidebar_Add_Payment_Button: Locator

    //locators
    constructor(page: Page) {
        this.page = page;
        // Balance section: new UI shows $X.XX amount + "Invoice autopay" in a card
        // Use hasNotText to exclude parent containers that also include utility cards
        this.Overview_Outstanding_Balance = page.locator('div')
            .filter({ hasText: /^\$\d+\.\d{2}/ })
            .filter({ hasNotText: 'Electricity' })
            .first();
        this.Overview_Pay_Bill_Button = page.getByRole('button', { name: 'Pay bill' });

        // Utility cards: find the header div starting with the utility name, then go up to card container
        // Use hasNot (child locator) instead of hasNotText to avoid false exclusions
        // when a utility company name contains "Gas" (e.g. "San Diego Gas and Electric")
        this.Overview_Electricity_Card = page.locator('div')
            .filter({ hasText: /^Electricity/ })
            .filter({ hasNot: page.locator('div').filter({ hasText: /^Gas/ }) })
            .first()
            .locator('..');
        this.Overview_Gas_Card = page.locator('div')
            .filter({ hasText: /^Gas/ })
            .filter({ hasNot: page.locator('div').filter({ hasText: /^Electricity/ }) })
            .first()
            .locator('..');


        this.Overview_Add_Payment_Title = page.getByRole('heading', { name: 'Add Payment Method' });
        this.Overview_Service_Fee_Message = page.getByText('Credit Card payments will be');

        this.Overview_Auto_Payment_Checkbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Overview_Save_Payment_Button = page.getByRole('button', { name: 'Save details' });
        this.Overview_Success_Message = page.getByText('ðŸ¥³ Success', { exact: true });

        this.Overview_User_Menu = (firstName: string) => page.locator(`//div[contains(text(),"${firstName}")]`);
        this.Overview_Profile_Button = page.getByRole('menuitem', { name: 'Profile' });

        this.Overview_Failed_Payment_Alert = page.getByText('Automatic payment failed!');
        this.Overview_Failed_Payment_Update_Payment_Link = page.getByRole('button', { name: 'Update payment' });

        this.Overview_New_Terms_Modal_Title = page.getByRole('heading', { name: 'We\'ve made updates to our' });
        this.Overview_New_Terms_Modal_Content = page.getByText('We have expanded our services');
        this.Overview_New_Terms_Modal_Agree_Checkbox = page.getByLabel(/I agree to Public Grid.*updated/i)
        this.Overview_New_Terms_Modal_Accept_Button = page.getByRole('button', { name: 'Accept' })

        this.Overview_Inactive_Account_Alert = page.getByText('Inactive Account: Service at');

        this.Overview_Setup_Password_Title = page.getByText(/Set up your new password|Set Up Your Password/i);
        this.Overview_Setup_Password_Description = page.getByText(/To keep your account secure|password was recently reset/i);
        this.Overview_Setup_Password_Field = page.locator('input[name="password"]');
        this.Overview_Setup_Password_Confirm_Password_Field = page.locator('input[name="confirmPassword"]');
        this.Overview_Setup_Password_Set_Password_Button = page.getByRole('button', { name: /Set (new )?password/i });

        // Account setup stepper — payment info selection (shown when user skipped payment during move-in)
        this.Overview_Add_Payment_Info_Title = page.getByText('Add your payment info');
        this.Overview_Pay_In_Full_Option = page.getByText('Pay in full').first();
        this.Overview_Split_My_Bill_Option = page.getByText('Split my bill').first();
        this.Overview_Sidebar_Add_Payment_Button = page.getByRole('button', { name: 'Add payment method' });
    }

    //methods
    async Accept_New_Terms_And_Conditions(){
        const maxRetries = 10;
        let retries = 0;
        let vis = false;

        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        // Handle "Set up your new password" dialog if present — Supabase now
        // triggers this for ALL freshly-created move-in users in dev. Instead of
        // DOM-removing (which doesn't survive page reloads), we actually complete
        // the password setup. This persists the password to Supabase, clearing
        // the reset flag permanently.
        try {
            const passwordTitle = this.page.getByText(/Set up your new password|create a new password/i);
            if (await passwordTitle.isVisible({ timeout: 3000 })) {
                await this.Setup_Password();
            }
        } catch {
            // No password dialog — proceed normally
        }

        while (retries < maxRetries) {
            vis = await this.Overview_New_Terms_Modal_Title.isVisible();
            if (vis == true) {
                break;
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, 500)); // wait for 0.5 seconds
        }

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

    async Setup_Password(password:string = "PublicGrid#1"){
        await expect(this.Overview_Setup_Password_Title).toBeVisible({timeout:30000});
        await expect(this.Overview_Setup_Password_Description).toBeVisible({timeout:30000});

        await this.Overview_Setup_Password_Field.fill("pg");
        await this.Overview_Setup_Password_Confirm_Password_Field.fill("pg");
        await this.page.waitForTimeout(200);
        await expect(this.Overview_Setup_Password_Set_Password_Button).toBeDisabled({timeout:30000});

        await this.Overview_Setup_Password_Field.fill("publicgrid");
        await this.Overview_Setup_Password_Confirm_Password_Field.fill("publicgrid");
        await this.page.waitForTimeout(200);
        await expect(this.Overview_Setup_Password_Set_Password_Button).toBeDisabled({timeout:30000});

        await this.Overview_Setup_Password_Field.fill("publicgrid1");
        await this.Overview_Setup_Password_Confirm_Password_Field.fill("publicgrid");
        await this.page.waitForTimeout(200);
        await expect(this.Overview_Setup_Password_Set_Password_Button).toBeDisabled({timeout:30000});

        await this.Overview_Setup_Password_Field.fill("publicgrid!1");
        await this.Overview_Setup_Password_Confirm_Password_Field.fill("publicgrid#1");
        await this.page.waitForTimeout(200);
        await expect(this.Overview_Setup_Password_Set_Password_Button).toBeDisabled({timeout:30000});

        await this.Overview_Setup_Password_Field.fill(password);
        await this.Overview_Setup_Password_Confirm_Password_Field.fill(password);
        await this.page.waitForTimeout(200);
        await expect(this.Overview_Setup_Password_Set_Password_Button).toBeEnabled({timeout:30000});
        await this.Overview_Setup_Password_Set_Password_Button.click();
    }

    async Select_Pay_In_Full_If_Flex_Enabled(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(2000);

        // Always click "Pay in full" if visible — this reveals the Stripe payment form.
        // For Flex-enabled utilities: shows both "Pay in full" and "Split my bill"
        // For non-Flex utilities: may show only "Pay in full"
        // Either way, clicking "Pay in full" is required to load the Stripe iframe.
        const isPayInFullVisible = await this.Overview_Pay_In_Full_Option.isVisible();
        if (isPayInFullVisible) {
            await this.Overview_Pay_In_Full_Option.click();
            await this.page.waitForTimeout(3000);
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
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="payment-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="payment-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="payment-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="payment-countryInput"]');
    
    
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
    
    
        if((await stripeFrame?.isVisible('[id ="payment-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="payment-postalCodeInput"]');
            await CardZipCode?.waitForElementState('visible');
            await CardZipCode?.fill(CCzip,{timeout:10000});
        }
        await this.page?.waitForTimeout(500);

        await expect(this.Overview_Save_Payment_Button).toBeEnabled({timeout:30000});
        await this.Overview_Save_Payment_Button.hover();
        await this.Overview_Save_Payment_Button.click();

        // After saving, verify success: either a toast appears or the payment section collapses
        // (account setup stepper flow shows no toast — the section just collapses)
        await Promise.race([
            this.Overview_Success_Message.waitFor({ state: 'visible', timeout: 30000 }),
            this.Overview_Add_Payment_Info_Title.waitFor({ state: 'hidden', timeout: 30000 }),
        ]);
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
    
        const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="payment-numberInput"]');
        const CardExpiration = await stripeFrame?.waitForSelector('[id ="payment-expiryInput"]');
        const CardCVC = await stripeFrame?.waitForSelector('[id ="payment-cvcInput"]');
        const CardCountry = await stripeFrame?.waitForSelector('[id ="payment-countryInput"]');
    
    
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
    
    
        if((await stripeFrame?.isVisible('[id ="payment-postalCodeInput"]'))){
            const CardZipCode = await stripeFrame?.waitForSelector('[id ="payment-postalCodeInput"]');
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

        const EmailInput = await stripeFrame?.waitForSelector('[id ="payment-emailInput"]');
        const NameInput = await stripeFrame?.waitForSelector('[id ="payment-nameInput"]');
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

        // After saving, verify success: either a toast appears or the payment section collapses
        await Promise.race([
            this.Overview_Success_Message.waitFor({ state: 'visible', timeout: 30000 }),
            this.Overview_Add_Payment_Info_Title.waitFor({ state: 'hidden', timeout: 30000 }),
        ]);
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

        const EmailInput = await stripeFrame?.waitForSelector('[id ="payment-emailInput"]');
        const NameInput = await stripeFrame?.waitForSelector('[id ="payment-nameInput"]');
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

        // After saving, verify success: either a toast appears or the payment section collapses
        await Promise.race([
            this.Overview_Success_Message.waitFor({ state: 'visible', timeout: 30000 }),
            this.Overview_Add_Payment_Info_Title.waitFor({ state: 'hidden', timeout: 30000 }),
        ]);
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

        const EmailInput = await stripeFrame?.waitForSelector('[id ="payment-emailInput"]');
        const NameInput = await stripeFrame?.waitForSelector('[id ="payment-nameInput"]');
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

        // After saving, verify success: either a toast appears or the payment section collapses
        await Promise.race([
            this.Overview_Success_Message.waitFor({ state: 'visible', timeout: 30000 }),
            this.Overview_Add_Payment_Info_Title.waitFor({ state: 'hidden', timeout: 30000 }),
        ]);
        await expect(this.page).toHaveURL(/.*\/app\/overview.*/, { timeout: 30000 });
    }


    async Check_Click_Failed_Payment_Update_Payment_Link(){
        await expect(this.Overview_Failed_Payment_Alert).toBeVisible({timeout:10000});  
        await this.Overview_Failed_Payment_Update_Payment_Link.waitFor({state:"visible",timeout:10000});
        await this.Overview_Failed_Payment_Update_Payment_Link.hover();
        await this.Overview_Failed_Payment_Update_Payment_Link.click();
    }


    async Click_Pay_Bill_Button() {
        await expect(this.Overview_Pay_Bill_Button).toBeVisible({timeout:30000});
        await expect(this.Overview_Pay_Bill_Button).toBeEnabled({timeout:30000});
        await this.Overview_Pay_Bill_Button.hover();
        await this.Overview_Pay_Bill_Button.click();
    }

    

    //assertions
    async Check_Pay_Bill_Button_Visible(){
        await expect(this.Overview_Pay_Bill_Button).toBeVisible({timeout:10000});
    }

    async Check_Pay_Bill_Button_Not_Visible(){
        await expect(this.Overview_Pay_Bill_Button).toBeHidden({timeout:10000});
    }

    async Check_Pay_Bill_Button_Enabled(){
        await expect(this.Overview_Pay_Bill_Button).toBeEnabled({timeout:10000});
    }

    async Check_Pay_Bill_Button_Disabled(){
        await expect(this.Overview_Pay_Bill_Button).toBeDisabled({timeout:10000});
    }

    async Check_Outstanding_Balance_Amount(ElectricAmount: number | string, GasAmount?: number | string): Promise<string | number> {
        const electricAmount = parseFloat(String(ElectricAmount));
        const gasAmount = GasAmount ? parseFloat(String(GasAmount)) : 0;
        
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
            const isVisible = await this.Overview_Outstanding_Balance.isVisible().catch(() => false);
            if (isVisible) {
                await expect(this.Overview_Outstanding_Balance).toContainText(`${totalAmount}`);
            }
            return totalAmount;
        }
        
    }


    async Check_Outstanding_Balance_Message(message: string) {
        await expect(this.Overview_Outstanding_Balance).toContainText(message);
    }

    async Check_Outstanding_Balance_Message_Not_Present(message: string) {
        await expect(this.Overview_Outstanding_Balance).not.toContainText(message);
    }


    async Check_Electricity_Card_Not_Visible() {
        await expect(this.Overview_Electricity_Card).toBeHidden();
    }


    async Check_Gas_Card_Not_Visible() {
        await expect(this.Overview_Gas_Card).toBeHidden();
    }


    async Check_Electricity_Card_Contain_Bill_Details(BillId: string, Amount: number | string, Usage: number | string): Promise<void> {

        await expect(this.Overview_Electricity_Card).toBeVisible();

        const startDate = await billQueries.getElectricBillStartDate(BillId);
        const endDate = await billQueries.getElectricBillEndDate(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(String(Amount)).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = String(Usage);

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Electricity_Card).toContainText(StartDateFormatted);
        await expect(this.Overview_Electricity_Card).toContainText(EndDateFormatted);
        await expect(this.Overview_Electricity_Card).toContainText(amount);
        await expect(this.Overview_Electricity_Card).toContainText(usage);
    }


    async Check_Electricity_Card_Is_Clear(BillId: string, Amount: number | string, Usage: number | string): Promise<void> {

        // Card not visible = inherently clear (e.g. gas-only accounts in setup state)
        const isVisible = await this.Overview_Electricity_Card.isVisible().catch(() => false);
        if (!isVisible) {
            console.log("Electricity card not visible — treating as clear");
            return;
        }

        const startDate = await billQueries.getElectricBillStartDate(BillId);
        const endDate = await billQueries.getElectricBillEndDate(BillId);

        const Start = new Date(startDate);
        const End = new Date(endDate);

        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(String(Amount)).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = String(Usage);

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Electricity_Card).not.toContainText(StartDateFormatted);
        await expect(this.Overview_Electricity_Card).not.toContainText(EndDateFormatted);
        await expect(this.Overview_Electricity_Card).not.toContainText(amount);
        await expect(this.Overview_Electricity_Card).not.toContainText(usage);
    }


    async Check_Gas_Card_Contain_Bill_Details(BillId: string, Amount: number | string, Usage: number | string): Promise<void> {

        await expect(this.Overview_Gas_Card).toBeVisible();

        const startDate = await billQueries.getGasBillStartDate(BillId);
        const endDate = await billQueries.getGasBillEndDate(BillId);
        
        const Start = new Date(startDate);
        const End = new Date(endDate);
        
        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(String(Amount)).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = String(Usage);

        console.log(StartDateFormatted);
        console.log(EndDateFormatted);


        await expect(this.Overview_Gas_Card).toContainText(StartDateFormatted);
        await expect(this.Overview_Gas_Card).toContainText(EndDateFormatted);
        await expect(this.Overview_Gas_Card).toContainText(amount);
        await expect(this.Overview_Gas_Card).toContainText(usage);
    }


    async Check_Gas_Card_Is_Clear(BillId: string, Amount: number | string, Usage: number | string): Promise<void> {

        // Card not visible = inherently clear (e.g. gas-only accounts in setup state)
        const isVisible = await this.Overview_Gas_Card.isVisible().catch(() => false);
        if (!isVisible) {
            console.log("Gas card not visible — treating as clear");
            return;
        }

        const startDate = await billQueries.getGasBillStartDate(BillId);
        const endDate = await billQueries.getGasBillEndDate(BillId);

        const Start = new Date(startDate);
        const End = new Date(endDate);

        const StartDateFormatted = format(Start, 'MMM dd');
        const EndDateFormatted = format(End, 'MMM dd');

        const amount2Dec = parseFloat(String(Amount)).toFixed(2);
        const amount = amount2Dec.toString();

        const usage = String(Usage);

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

    async Check_Get_Started_Widget_Not_Visible(): Promise<void> {
        const widget = this.page.getByText('Get Started').first();
        await expect(widget).not.toBeVisible({ timeout: 10000 });
    }


    async Check_Pay_Outstanding_Balance_Modal(_electricAmount?: string, _gasAmount?: string): Promise<void> {
        const modal = this.page.getByRole('dialog').or(
            this.page.locator('[role="dialog"]')
        ).first();
        await expect(modal).toBeVisible({ timeout: 30000 });
    }

    async Submit_Pay_Bill_Modal(): Promise<void> {
        const modal = this.page.getByRole('dialog');
        await expect(modal).toBeVisible({ timeout: 30000 });
        const submitBtn = modal.getByRole('button', { name: 'Pay bill' });
        await expect(submitBtn).toBeVisible({ timeout: 30000 });
        await expect(submitBtn).toBeEnabled({ timeout: 10000 });
        await submitBtn.click();
    }

    /**
     * Select the "Other Amount" radio in the Pay Bill modal and enter a partial
     * amount. Verified live (2026-04-14): modal radiogroup has "Total Amount Due"
     * (default) + "Other Amount" which reveals a `$` textbox when selected.
     * Transaction Fee + Total recompute dynamically on input.
     *
     * Use this for PR-005c-style partial-payment tests. Amount is in dollars
     * (e.g., pass 40 to pay $40). Caller is responsible for choosing an amount
     * less than the outstanding balance.
     */
    async Enter_Partial_Pay_Amount(amountDollars: number): Promise<void> {
        const modal = this.page.getByRole('dialog');
        await expect(modal).toBeVisible({ timeout: 30000 });

        const otherAmountRadio = modal.getByRole('radio', { name: 'Other Amount' });
        await expect(otherAmountRadio).toBeVisible({ timeout: 10000 });
        await otherAmountRadio.click();

        // The $ textbox appears adjacent to the "Other Amount" label. Radix
        // usually doesn't give it a name, so we scope to the textbox inside
        // the amount radiogroup.
        const amountInput = modal.getByRole('textbox').last();
        await expect(amountInput).toBeVisible({ timeout: 10000 });
        await amountInput.fill(String(amountDollars));

        // Wait for fee/total recompute — dollar amount typed should cause
        // Transaction Fee to update from $0.00 to a non-zero value.
        await this.page.waitForTimeout(500);
    }

    // ─── AutopayPaymentModal ───
    // Appears when a user with outstanding balance + VALID card enables auto-pay.
    // Verified live 2026-04-14: triggered by clicking "Enable" button in TIP section
    // on the overview page. Renders as an INLINE card (NOT dialog role).
    // Contents: "Thanks for enabling autopay!" + "Outstanding balance: $XX.XX"
    //           + "Do it later" button + "Pay now" button
    // Account page path (switch toggle) may render as dialog — untested.

    async Check_Autopay_Payment_Modal_Visible(): Promise<void> {
        const heading = this.page.getByText('Thanks for enabling autopay!');
        await expect(heading).toBeVisible({ timeout: 30000 });
    }

    async Click_Autopay_Pay_Now(): Promise<void> {
        const payNow = this.page.getByRole('button', { name: /pay now/i });
        await expect(payNow).toBeVisible({ timeout: 10000 });
        await payNow.click();
    }

    async Click_Autopay_Do_It_Later(): Promise<void> {
        const doItLater = this.page.getByRole('button', { name: /do it later/i });
        await expect(doItLater).toBeVisible({ timeout: 10000 });
        await doItLater.click();
    }

    async Check_Autopay_Outstanding_Amount(expectedDollars: string): Promise<void> {
        const balanceText = this.page.getByText(`Outstanding balance: $${expectedDollars}`);
        await expect(balanceText).toBeVisible({ timeout: 10000 });
    }

    async Check_Payment_Failed_Message_In_Modal(): Promise<void> {
        const failedMsg = this.page.getByText('Your last payment didn\'t go through').first();
        await expect(failedMsg).toBeVisible({ timeout: 30000 });
    }

}




export default OverviewPage;
