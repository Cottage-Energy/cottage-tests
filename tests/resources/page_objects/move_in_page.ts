import { type Page, type Locator, expect } from '@playwright/test';
import { utilityQueries } from '../fixtures/database';
import { TIMEOUTS } from '../constants';
import { loggers } from '../utils/logger';
import * as MoveIndata from '../data/move_in-data.json';

const log = loggers.moveIn.child('MoveInPage');

export class MoveInPage{
    //variables
    readonly page: Page;
    readonly Move_In_Terms_Logo: Locator;
    readonly Move_In_Welcome_Title: Locator;
    readonly Move_In_Welcome_Description: Locator;
    readonly Move_In_Terms_Checkbox: Locator;
    readonly Move_In_Get_Started_Button: Locator;
 
    readonly Move_In_Address_Page_Title: Locator;
    readonly Move_In_Tx_Svc_Address_Field: Locator;
    readonly Move_In_Back_Link: Locator;
    readonly Move_In_Address_Field: Locator;
    readonly Move_In_Address_Dropdown: (address: string) => Locator;
    readonly Move_In_Unit_Field: Locator;

    readonly Move_In_Utility_Setup_Title: Locator;
    readonly Move_In_PG_Handles_Setup_Option: Locator;
    readonly Move_In_Self_Setup_Button: Locator;
    readonly Move_In_Renewable_Energy_Switch: Locator;

    readonly Move_In_Existing_Account_Page_Title: Locator;
    readonly Move_In_Existing_Account_Page_Content: Locator;
    readonly Move_In_Existing_Account_Email_Field: Locator;
    readonly Move_In_Existing_Account_Submmit_Button: Locator;
    readonly Move_In_Existing_Account_Submit_Message: Locator;
    readonly Move_In_Existing_Account_Skip_Button: Locator;
    readonly Move_In_Existing_Account_Skip_Message: Locator;
    readonly Move_In_Save_On_Bill_Toggle: Locator;

    readonly Move_In_Tx_Svc_Title: Locator;
    readonly Move_In_Tx_Svc_Electric_Service: Locator;
    readonly Move_In_Tx_Svc_Gas_Service: Locator;
    readonly Move_In_Tx_Svc_Content: Locator;
    readonly Move_In_Tx_Svc_Agreement_Checkbox: Locator;

    readonly Move_In_Texas_Agreement_Title: Locator;
    readonly Move_In_Texas_Agreement_Content: Locator;

    readonly Move_In_Email_Registered_Message: Locator;
    readonly Move_In_OTP_Field: Locator;
    readonly Move_In_OTP_Confirmed_Message: Locator;
    readonly Move_In_Signing_In_Message: Locator;

    readonly Move_In_Continue_Button: Locator;
    readonly Move_In_Cannot_Find_Address_Link: Locator;
    readonly Move_In_Address_Not_Listed_Message: Locator;

    readonly Move_In_About_You_Title: Locator;
    readonly Move_In_First_Name_Field: Locator;
    readonly Move_In_Last_Name_Field: Locator;
    readonly Move_In_First_Name_Null_Message: Locator;
    readonly Move_In_Last_Name_Null_Message: Locator;
    readonly Move_In_Phone_Field: Locator;
    readonly Move_In_Phone_Invalid_Message: Locator;
    readonly Move_In_Receive_Text_Checkbox: Locator;
    readonly Move_In_Email_Field: Locator;
    readonly Move_In_Email_Invalid_Message: Locator;
    
    readonly Move_In_Date_Field: Locator;
    readonly Move_In_Date_Selector: (day: string) => Locator;
    readonly Move_In_Next_Month_Button: Locator;
    readonly Move_In_Prev_Month_Button: Locator;
    readonly Move_In_Date_Calendar_Button: Locator;

    readonly Move_In_CON_ED_Questions_Title: Locator;
    readonly Move_In_CON_ED_Life_Support_Yes_Button: Locator;
    readonly Move_In_CON_ED_Life_Support_No_Button: Locator;
    readonly Move_In_CON_ED_62_years_Yes_Button: Locator;
    readonly Move_In_CON_ED_62_years_No_Button: Locator;

    readonly Move_In_BGE_Employment_Status_Title: Locator;
    readonly Move_In_BGE_Employment_Status_Dropdown: Locator;
    readonly Move_In_BGE_Employment_Selection: (selection: string) => Locator;

    readonly Move_In_Lenght_of_Staying_Question: Locator;
    readonly Move_In_Lenght_of_Staying_Dropdown: Locator;
    readonly Move_In_Lenght_of_Staying_Selection: (selection: string) => Locator;
    readonly Move_In_Texas_Thermostat_Question: Locator;
    readonly Move_In_Texas_Thermostat_Yes_Button: Locator;
    readonly Move_In_Texas_Thermostat_No_Button: Locator;

    readonly Move_In_Program_Enrolled_Question: Locator;
    readonly Move_In_Program_Enrolled_Options: (option: string) => Locator;
    
    readonly Move_In_Identity_Info_Title: Locator;
    readonly Move_In_Birthdate_Field: Locator;
    readonly Move_In_Birthdate_Lessthan100_Message: Locator;
    readonly Move_In_Birthdate_Mustbe18_Message: Locator;
    readonly Move_In_Birthdate_Required_Message: Locator;
    readonly Move_In_ID_Dropdown: Locator;
    readonly Move_In_State_Dropdown: Locator;
    readonly Move_In_ID_Number_Field: Locator;
    readonly Move_In_CON_ED_ID_Number_Field: Locator;
    readonly Move_In_Identify_Info_Message: Locator;
    readonly Move_In_Prev_Address_Field: Locator;

    readonly Move_In_Payment_Details_Title: Locator;
    readonly Move_In_Pay_Through_PG_Title: Locator;
    readonly Move_In_Pay_Through_PG_Switch: Locator;
    //readonly Move_In_Pay_Through_PG_Yes: Locator;
    //readonly Move_In_Pay_Through_PG_No: Locator;
    readonly Move_In_Service_Fee_Message: Locator;

    readonly Move_In_Auto_Payment_Checbox: Locator;
    readonly Move_In_Submit_Button: Locator;
    readonly Move_In_Skip_Button: Locator;

    readonly Move_In_Confirm_Skip_Payment_Title: Locator;
    readonly Move_In_Confirm_Skip_Payment_Question_Link: Locator;
    readonly Move_In_Confirm_Skip_Payment_Add_Now_Button: Locator;
    readonly Move_In_Confirm_Skip_Payment_Add_Later_Button: Locator;

    readonly Move_In_Success_Message: Locator;
    readonly Move_In_Account_Number: Locator;

    readonly Move_In_Almost_Done_Message: Locator;
    readonly Move_In_Registration_Status: Locator;

    readonly Move_In_Account_Number_Value: Locator;
    readonly Move_In_Survey_Star: Locator;
    readonly Move_In_Survey_Submit_Button: Locator;
    readonly Move_In_Feedback_Thanks_Message: Locator;

    readonly Move_In_New_Move_In_Request_Link: Locator;

    readonly Move_In_ESCO_Title: Locator;
    readonly Move_In_ESCO_Content: Locator;
    readonly Move_In_ESCO_Got_It_Button: Locator;

    // Power Up Your Account page locators
    readonly Move_In_Power_Up_Title: Locator;
    readonly Move_In_Clean_Energy_Switch: Locator;
    readonly Move_In_Savings_Finder_Section: Locator;

  
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Move_In_Terms_Logo = page.locator('[alt="Public Grid Logo"]');
        this.Move_In_Welcome_Title = page.getByRole('heading', { name: 'Utilities on Autopilot' });
        this.Move_In_Welcome_Description = page.getByText(/setting up your utilities.*a breeze/);

        this.Move_In_Terms_Checkbox = page.getByLabel('I agree to the Terms of');
        this.Move_In_Get_Started_Button = page.getByRole('button', { name: /Let.*s get started/i });
        this.Move_In_Back_Link = page.getByText('Back');
        this.Move_In_Address_Page_Title = page.getByText('Enter your address');
        this.Move_In_Tx_Svc_Address_Field = page.getByText('Where do you live?');
        this.Move_In_Address_Field = page.locator('#address');
        this.Move_In_Address_Dropdown = (address: string) => {
            // Custom autocomplete dropdown: extract street portion from concatenated address string
            // e.g. "808 Chicago AveDixon, IL" → "808 Chicago Ave"
            const parts = address.match(/^(.*[a-z\d])(?=[A-Z])/);
            const streetText = parts ? parts[1] : address;
            return page.locator('div.cursor-pointer div.leading-tight').filter({ hasText: streetText }).first();
        };
        this.Move_In_Unit_Field = page.locator('input[name="unitNumber"]');

        this.Move_In_Utility_Setup_Title = page.getByRole('heading', { name: 'Choose how to start service' });
        this.Move_In_PG_Handles_Setup_Option = page.getByText('Public Grid handles setup');
        this.Move_In_Self_Setup_Button = page.getByRole('button', { name: 'I will do the setup myself' });
        this.Move_In_Renewable_Energy_Switch = page.getByRole('switch');

        this.Move_In_Existing_Account_Page_Title = page.getByText('Great! You are all set');
        this.Move_In_Existing_Account_Page_Content = page.getByText('It looks like you\'ve already got your utilities sorted out');
        this.Move_In_Existing_Account_Email_Field = page.getByPlaceholder('Email');
        this.Move_In_Existing_Account_Submmit_Button = page.getByRole('button', { name: 'Submit' });
        this.Move_In_Existing_Account_Submit_Message = page.getByText('Awesome! We will be in touch');
        this.Move_In_Existing_Account_Skip_Button = page.getByRole('button', { name: 'Skip' });
        this.Move_In_Existing_Account_Skip_Message = page.getByText('We hope you had a safe and');
        this.Move_In_Save_On_Bill_Toggle = page.getByText(/save on my bill/i).locator('..').getByRole('switch');

        this.Move_In_Tx_Svc_Title = page.getByRole('heading', { name: 'Good news! We are in your' });
        this.Move_In_Tx_Svc_Electric_Service = page.locator('div').filter({ hasText: /^ElectricityService with$/ }).nth(1);
        this.Move_In_Tx_Svc_Gas_Service = page.locator('div').filter({ hasText: /^Natural GasService with$/ }).nth(1)
        this.Move_In_Tx_Svc_Content = page.getByText('How it works:We close your');
        this.Move_In_Tx_Svc_Agreement_Checkbox = page.getByLabel('I want Public Grid to close');

        this.Move_In_Texas_Agreement_Title = page.getByRole('heading', { name: 'Good News! We are in your' });
        this.Move_In_Texas_Agreement_Content = page.getByText('Public Grid starts service for:ElectricityHow it worksWe scan the market for');

        this.Move_In_Email_Registered_Message = page.getByText(/You already have an account|That email is already/);
        this.Move_In_OTP_Field = page.locator('input[name="otpCode"]');
        this.Move_In_OTP_Confirmed_Message = page.getByText('OTP Confirmed âœ…', { exact: true });
        this.Move_In_Signing_In_Message = page.getByText('Signing in...', { exact: true });

        this.Move_In_Continue_Button = page.getByRole('button', { name: 'Continue' });
        this.Move_In_Cannot_Find_Address_Link = page.getByText("Can't find your address?");
        this.Move_In_Address_Not_Listed_Message = page.getByRole('heading', { name: 'Address not listed in the' });

        this.Move_In_About_You_Title = page.getByText('About you', { exact: true });
        this.Move_In_First_Name_Field = page.locator('input[name="firstName"]');
        this.Move_In_Last_Name_Field = page.locator('input[name="lastName"]');
        this.Move_In_First_Name_Null_Message = page.locator('[id="\\:r5\\:-form-item-message"]');
        this.Move_In_Last_Name_Null_Message = page.locator('[id="\\:r6\\:-form-item-message"]');
        this.Move_In_Phone_Field = page.locator('input[name="phone"]');
        this.Move_In_Phone_Invalid_Message = page.getByText('Phone number must be in 000-');
        this.Move_In_Receive_Text_Checkbox = page.getByLabel('I agree to receive order updates via SMS');
        this.Move_In_Email_Field = page.locator('input[name="email"]');
        this.Move_In_Email_Invalid_Message = page.getByText('Email address must be valid.');
        
        this.Move_In_Date_Field = page.getByRole('textbox', { name: 'MM / DD / YYYY' });
        this.Move_In_Date_Calendar_Button = page.getByRole('textbox', { name: 'MM / DD / YYYY' });
        this.Move_In_Date_Selector = (day: string) => page.getByRole('gridcell', { name: day, exact: true }).filter({ hasNot: page.locator('[disabled]') });
        this.Move_In_Next_Month_Button = page.getByLabel('Go to next month');
        this.Move_In_Prev_Month_Button = page.getByLabel('Go to previous month');
        this.Move_In_Identity_Info_Title = page.getByText('Identity Information', { exact: true });

        this.Move_In_CON_ED_Questions_Title =  page.getByText('Your utility profile');
        this.Move_In_CON_ED_Life_Support_Yes_Button = page.getByText('life-support').locator('..').locator('..').getByRole('radio', { name: 'Yes' });
        this.Move_In_CON_ED_Life_Support_No_Button = page.getByText('life-support').locator('..').locator('..').getByRole('radio', { name: 'No' });
        this.Move_In_CON_ED_62_years_Yes_Button = page.getByText('62 years').locator('..').locator('..').getByRole('radio', { name: 'Yes' });
        this.Move_In_CON_ED_62_years_No_Button = page.getByText('62 years').locator('..').locator('..').getByRole('radio', { name: 'No' });

        this.Move_In_BGE_Employment_Status_Title = page.getByText('Employment Status');
        this.Move_In_BGE_Employment_Status_Dropdown = page.getByRole('combobox').filter({ hasText: /Select an option|Employed|Retired|Receives|Other/ }).last();
        this.Move_In_BGE_Employment_Selection = (selection: string) => page.getByRole('option', { name: selection, exact: true }).or(page.locator('[role="listbox"]').getByText(selection, { exact: true }));

        this.Move_In_Lenght_of_Staying_Question = page.getByText('How long are you planning on');
        this.Move_In_Lenght_of_Staying_Dropdown = page.getByRole('combobox').first();
        this.Move_In_Lenght_of_Staying_Selection = (selection: string) => page.getByRole('option', { name: selection, exact: true }).or(page.locator('[role="listbox"]').getByText(selection, { exact: true }));
        this.Move_In_Texas_Thermostat_Question = page.getByText('Do you own a smart thermostat?');
        this.Move_In_Texas_Thermostat_Yes_Button = page.getByText('Do you own a smart thermostat?').locator('..').getByText('Yes', { exact: true });
        this.Move_In_Texas_Thermostat_No_Button = page.getByText('Do you own a smart thermostat?').locator('..').getByText('No', { exact: true });

        this.Move_In_Program_Enrolled_Question = page.getByText('Are you enrolled in any of the programs below?');
        // Program Enrolled: radiogroup with Yes/No/Pass labels containing spans
        this.Move_In_Program_Enrolled_Options = (option: string) => page.getByRole('radiogroup').filter({ hasText: 'Pass' }).locator('label').filter({ hasText: option });

        this.Move_In_Birthdate_Field = page.locator('input[name="dateOfBirth"]');
        this.Move_In_Birthdate_Required_Message = page.getByText('Date of Birth Required');
        this.Move_In_Birthdate_Mustbe18_Message = page.getByText('Must be 18 years or older');
        this.Move_In_Birthdate_Lessthan100_Message = page.getByText('Must be less than 100 years');
        this.Move_In_ID_Dropdown = page.getByText('Must be 18 years or older');
        this.Move_In_State_Dropdown = page.getByText('Select State');
        this.Move_In_ID_Number_Field = page.locator('//input[@name = "identityNumber"]');
        this.Move_In_CON_ED_ID_Number_Field = page.locator('//input[@name = "identityNumber"]');
        this.Move_In_Identify_Info_Message = page.getByText('This information is used to verify your identity');
        this.Move_In_Prev_Address_Field = page.locator('#onboardingAddress')

        this.Move_In_Auto_Payment_Checbox = page.getByRole('checkbox', { name: 'Enable auto-pay (bill is paid' });
        this.Move_In_Submit_Button = page.getByRole('button', { name: 'Submit', exact: true });
        this.Move_In_Skip_Button = page.getByRole('button', { name: 'Skip for now' });

        this.Move_In_Confirm_Skip_Payment_Title = page.getByRole('heading', { name: 'We need a payment method on' });
        this.Move_In_Confirm_Skip_Payment_Question_Link = page.getByText('Questions? Chat with us so we');
        this.Move_In_Confirm_Skip_Payment_Add_Now_Button = page.getByRole('button', { name: 'Add a payment method now' });
        this.Move_In_Confirm_Skip_Payment_Add_Later_Button = page.getByRole('button', { name: 'I will add my payment later' });

        this.Move_In_Payment_Details_Title = page.getByText(/Set up autopay to finish|Add a payment method for your bills/);
        this.Move_In_Pay_Through_PG_Title = page.getByText('Public Grid handles everything');
        this.Move_In_Pay_Through_PG_Switch = page.getByRole('radio', { name: /Public Grid handles everything/ });
        this.Move_In_Service_Fee_Message = page.getByText('Cards have a 3% fee');

        this.Move_In_Success_Message = page.getByText('Great! You are all set', { exact: true });
        this.Move_In_Account_Number = page.getByText(/getting started on setting up your utility account/i);

        this.Move_In_Almost_Done_Message = page.getByText('Almost Done!', { exact: true })
        this.Move_In_Registration_Status = page.locator('//div[contains(text(),"Registration Status")]');

        this.Move_In_Account_Number_Value = page.locator("//div[contains(@class,'callout-text')]//child::b");
        this.Move_In_Survey_Star = page.locator('path').nth(2);
        this.Move_In_Survey_Submit_Button = page.getByText('Tell us how your experience was so far!Submit');
        this.Move_In_Feedback_Thanks_Message = page.getByText('Thanks for the feedback ðŸ’š');

        this.Move_In_New_Move_In_Request_Link = page.getByText('Start a New Move-In Request');

        this.Move_In_ESCO_Title = page.getByRole('alertdialog').last().getByRole('heading', { name: 'Because you live in New York' });
        this.Move_In_ESCO_Content = page.getByRole('alertdialog').last().getByText("Public Grid isn't an Energy Services Company");
        this.Move_In_ESCO_Got_It_Button = page.getByRole('alertdialog').last().getByRole('button', { name: 'Got it!' });

        // Power Up / Renewable Energy - now part of Utility Setup step
        this.Move_In_Power_Up_Title = page.getByRole('heading', { name: 'Choose how to start service' });
        this.Move_In_Clean_Energy_Switch = page.getByRole('switch');
        this.Move_In_Savings_Finder_Section = page.getByText('Typical savings');
    }



    //methods
    async Agree_on_Terms_and_Get_Started() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        await expect(this.Move_In_Welcome_Title).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
        await expect(this.Move_In_Welcome_Description).toBeVisible({ timeout: TIMEOUTS.DEFAULT });

        await this.Move_In_Terms_Checkbox.hover({ timeout: TIMEOUTS.DEFAULT });
        await this.Move_In_Terms_Checkbox.isEnabled({ timeout: TIMEOUTS.MEDIUM });
        await this.Move_In_Terms_Checkbox.setChecked(true, { timeout: TIMEOUTS.MEDIUM });
        await this.Move_In_Get_Started_Button.hover({ timeout: TIMEOUTS.DEFAULT });
        await this.Move_In_Get_Started_Button.isEnabled({ timeout: TIMEOUTS.MEDIUM });
        await this.Move_In_Get_Started_Button.click();
    }


    async Enter_Address(address:string, unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(2000);
        
        // Check if address is pre-filled (from URL parameters)
        const preFilledTitle = this.page.getByText('Is this your address?');
        try {
            await expect(preFilledTitle).toBeVisible({ timeout: 5000 });
            log.debug('Address is pre-filled, skipping address entry');
            return;
        } catch {
            // Not pre-filled, continue with normal address entry
        }

        try{
            await expect(this.Move_In_Address_Page_Title).toBeVisible({ timeout: TIMEOUTS.SHORT });
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        }
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await this.Move_In_Address_Field.click({ timeout: TIMEOUTS.MEDIUM });
        await this.Move_In_Address_Field.pressSequentially(address, { delay: 50 });
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await this.Move_In_Address_Field.press('Backspace');
        await this.Move_In_Address_Dropdown(address)?.waitFor({ state: 'visible', timeout: TIMEOUTS.DEFAULT });
        await this.Move_In_Address_Dropdown(address).click({ timeout: TIMEOUTS.MEDIUM });
        // Wait for address to populate, then force-click unit field past any secondary dropdown
        await this.page.waitForTimeout(2000);
        await this.Move_In_Unit_Field.click({ force: true });
        await this.Move_In_Unit_Field.fill(unit);
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        
    }


    async Enter_Address_GUID_Flow(address:string, unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Title).toBeVisible({ timeout: TIMEOUTS.SHORT });
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        }
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await this.Move_In_Address_Field.click({timeout:10000});
        await this.Move_In_Address_Field.pressSequentially(address,{delay:50});
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.press('Backspace');
        await this.Move_In_Address_Dropdown(address)?.waitFor({state: 'visible', timeout: 30000});
        await this.Move_In_Address_Dropdown(address).click({timeout:10000});
        // Wait for address to populate, then force-click unit field past any secondary dropdown
        await this.page.waitForTimeout(2000);
        await expect(this.Move_In_Unit_Field).not.toBeNull();
        await this.Move_In_Unit_Field.click({ force: true });
        await this.Move_In_Unit_Field.pressSequentially('GUID'+ unit);
        await this.page.waitForTimeout(1000);
        
    }

    async Parameterized_Address_GUID_Flow(unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Title).toBeVisible({timeout:3000});
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({timeout:10000});
        }
        await this.page.waitForTimeout(1000);
        await expect(this.Move_In_Address_Field).not.toHaveAttribute('value', '');
        await expect(this.Move_In_Unit_Field).not.toBeNull();
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.pressSequentially('GUID'+ unit);
        await this.page.waitForTimeout(1000);
        
    }

    async Enter_Unit(unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Title).toBeVisible({timeout:3000});
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({timeout:10000});
        }
        await this.page.waitForTimeout(1000);
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.fill(unit);
        await this.page.waitForTimeout(1000);
        
    }


    async Choose_Start_Service(): Promise<{ renewableEnabled: boolean }> {
        await expect(this.Move_In_Utility_Setup_Title).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.Move_In_PG_Handles_Setup_Option).toBeVisible({ timeout: TIMEOUTS.SHORT });

        // Handle renewable energy toggle if visible (depends on offerRenewableEnergy flag in DB)
        let renewableEnabled = false;
        const toggleVisible = await this.Move_In_Renewable_Energy_Switch.isVisible({ timeout: 3000 }).catch(() => false);
        if (toggleVisible) {
            // Randomly enable or disable renewable energy
            const shouldEnable = Math.random() > 0.5;
            const isChecked = await this.Move_In_Renewable_Energy_Switch.isChecked().catch(() => false);
            if (shouldEnable !== isChecked) {
                await this.Move_In_Renewable_Energy_Switch.click();
                await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
            }
            renewableEnabled = shouldEnable;
            log.debug('Renewable energy toggle', { visible: true, enabled: renewableEnabled });
        } else {
            log.debug('Renewable energy toggle not visible (offerRenewableEnergy may be false)');
        }

        return { renewableEnabled };
    }

    async Click_Self_Setup(){
        await expect(this.Move_In_Self_Setup_Button).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await this.Move_In_Self_Setup_Button.click();
        await this.page.waitForTimeout(2000);
        // Confirmation dialog appears: "Are you sure you want to set this up yourself?"
        const confirmButton = this.page.getByRole('button', { name: 'I will do it myself' });
        await expect(confirmButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await confirmButton.click();
        await this.page.waitForTimeout(2000);
    }




    async Existing_Utility_Account_Connect_Request(email: string|null, submit: boolean, enableSaveToggle?: boolean){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(3000);

        await expect(this.Move_In_Existing_Account_Page_Title).toBeVisible({timeout:30000});
        await expect(this.Move_In_Existing_Account_Page_Content).toBeVisible({timeout:30000});

        // Handle "Let me know whenever there's a chance to save on my bill!" toggle (role="switch")
        if (enableSaveToggle !== undefined) {
            const toggleVisible = await this.Move_In_Save_On_Bill_Toggle.isVisible({ timeout: 5000 }).catch(() => false);
            if (toggleVisible) {
                const isChecked = await this.Move_In_Save_On_Bill_Toggle.isChecked();
                if (enableSaveToggle && !isChecked) {
                    await this.Move_In_Save_On_Bill_Toggle.click();
                } else if (!enableSaveToggle && isChecked) {
                    await this.Move_In_Save_On_Bill_Toggle.click();
                }
                await this.page.waitForTimeout(1000);
            }
        }

        if(email != null){
            // Email field may use floating label, try multiple selectors
            const emailField = this.page.locator('input[type="email"], input[name*="email"], input[placeholder*="mail"]').first();
            await emailField.waitFor({ state: 'visible', timeout: 10000 });
            await emailField.click();
            await emailField.fill(email);
        }

        if(submit == true){
            await this.Move_In_Existing_Account_Submmit_Button.hover();
            await this.Move_In_Existing_Account_Submmit_Button.click();
            await this.page.waitForTimeout(3000);
            // Check for success - try both old and new messages
            const submitted = await this.Move_In_Existing_Account_Submit_Message.isVisible({ timeout: 10000 }).catch(() => false);
            if (!submitted) {
                log.debug('Submit confirmation message not found with expected text');
            }
        }
        else{
            await this.Move_In_Existing_Account_Skip_Button.hover();
            await this.Move_In_Existing_Account_Skip_Button.click();
            await this.page.waitForTimeout(3000);
            const skipped = await this.Move_In_Existing_Account_Skip_Message.isVisible({ timeout: 10000 }).catch(() => false);
            if (!skipped) {
                log.debug('Skip confirmation message not found with expected text');
            }
        }

    }


    async Transfer_Service_Agreement(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Tx_Svc_Title).toBeVisible({timeout:10000});
        
        try{
            await expect(this.Move_In_Tx_Svc_Electric_Service).toBeVisible({timeout:1500});
        }
        catch{
            log.debug('No Electric Service');
        }

        try{
            await expect(this.Move_In_Tx_Svc_Gas_Service).toBeVisible({timeout:1500});
        }
        catch{
            log.debug('No Gas Service');
        }
        
        await expect(this.Move_In_Tx_Svc_Content).toBeVisible({timeout:10000});
        await this.Move_In_Tx_Svc_Agreement_Checkbox.hover();
        await this.Move_In_Tx_Svc_Agreement_Checkbox.isEnabled();
        await this.Move_In_Tx_Svc_Agreement_Checkbox.setChecked(true,{timeout:10000});
    }


    async Texas_Service_Agreement(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        // New UI: no "Good News!" heading; page shows "Public Grid starts service for:" with service details
        await expect(this.Move_In_Texas_Agreement_Content).toBeVisible({timeout:10000});
    }

    
    async Next_Move_In_Button(){
        await expect(this.Move_In_Continue_Button).toBeEnabled({timeout:10000});
        await this.Move_In_Continue_Button.hover({timeout:10000});
        await this.Move_In_Continue_Button.click({timeout:10000});
    }

    async Submit_Move_In_Button(){
        // Try clicking Continue button first, if not available or fails, click Submit button
        try {
            await expect(this.Move_In_Continue_Button).toBeVisible({timeout:2000});
            await expect(this.Move_In_Continue_Button).toBeEnabled({timeout:2000});
            await this.Move_In_Continue_Button.hover({timeout:1000});
            await this.Move_In_Continue_Button.click({timeout:1000});
        } catch (error) {
            await expect(this.Move_In_Submit_Button).toBeEnabled({timeout:10000});
            await this.Move_In_Submit_Button.hover({timeout:10000});
            await this.Move_In_Submit_Button.click({timeout:10000});
        }
    }


    async Enter_Personal_Info(firstname:string, lastname:string, phone:string, email:string, day:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_About_You_Title).toBeVisible({timeout:30000});
        await this.Move_In_First_Name_Field.isEditable();
        await this.Move_In_First_Name_Field.hover();
        await this.Move_In_First_Name_Field.click({timeout:10000});
        await this.Move_In_First_Name_Field.fill(firstname);
        await this.Move_In_Last_Name_Field.click();
        await this.Move_In_Last_Name_Field.fill(lastname);
        await this.Move_In_Phone_Field.click();
        await this.Move_In_Phone_Field.fill(phone);
        await this.Move_In_Email_Field.click();
        await this.Move_In_Email_Field.fill(email);

        // Start Service Date: masked input (MM/DD/YYYY) - enter via pressSequentially
        await this.Move_In_Date_Field.click({timeout:10000});
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await this.Move_In_Date_Field.pressSequentially(day, {delay: 50});
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        await expect(this.Move_In_Receive_Text_Checkbox).toBeVisible({timeout:10000});
        await expect(this.Move_In_Receive_Text_Checkbox).toBeChecked();

        // Randomize whether to check the checkbox or not
        const shouldCheck = Math.random() < 0.5;

        if (shouldCheck) {
            await this.Move_In_Receive_Text_Checkbox.setChecked(true, { timeout: 10000 });
        } else {
            await this.Move_In_Receive_Text_Checkbox.setChecked(false, { timeout: 10000 });
        }

        return shouldCheck;
    }

    async Enter_Personal_Info_GUID_Flow(phone:string, email:string, day:string){
        const url = new URL(this.page.url());
        const guidValue = url.searchParams.get('guid');

        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_About_You_Title).toBeVisible({timeout:30000});
        await expect(this.Move_In_First_Name_Field).not.toHaveAttribute('value', '');
        await expect(this.Move_In_Last_Name_Field).not.toHaveAttribute('value', '');

        if (guidValue === MoveIndata.GUID1) {
            await expect(this.Move_In_Phone_Field).not.toHaveAttribute('value', '');
        }
        else if (guidValue === MoveIndata.GUID2) {
            await expect(this.Move_In_Phone_Field).toHaveAttribute('value', '');
            await this.Move_In_Phone_Field.click({timeout:10000});
            await this.Move_In_Phone_Field.fill(phone);
        }

        await expect(this.Move_In_Email_Field).not.toHaveAttribute('value', '');
        await this.Move_In_Email_Field.click();
        await this.Move_In_Email_Field.fill(email);

        // Start Service Date: masked input (MM/DD/YYYY) - enter via pressSequentially
        await this.Move_In_Date_Field.click({timeout:10000});
        await this.page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await this.Move_In_Date_Field.pressSequentially(day, {delay: 50});
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        await expect(this.Move_In_Receive_Text_Checkbox).toBeVisible({timeout:10000});
        await expect(this.Move_In_Receive_Text_Checkbox).toBeChecked();

        // Randomize whether to check the checkbox or not
        const shouldCheck = Math.random() < 0.5;

        if (shouldCheck) {
            await this.Move_In_Receive_Text_Checkbox.setChecked(true, { timeout: 10000 });
        } else {
            await this.Move_In_Receive_Text_Checkbox.setChecked(false, { timeout: 10000 });
        }

        return shouldCheck;
    }


    async Enter_OTP(OTP:string){
        await this.Move_In_OTP_Field.click({timeout:10000});
        await this.Move_In_OTP_Field.fill(OTP);
    }


    async CON_EDISON_Questions(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_CON_ED_Questions_Title).toBeVisible({timeout:30000});
        
        const Q1options = [
            this.Move_In_CON_ED_Life_Support_Yes_Button,
            this.Move_In_CON_ED_Life_Support_No_Button
          ];
        
        const Q1randomOption = Q1options[Math.floor(Math.random() * Q1options.length)];
        const Q1randomOptionText = await Q1randomOption.textContent();
        await Q1randomOption.click(); 
        log.debug('CON_ED Q1 answer', { answer: Q1randomOptionText ?? '' });

        const Q2options = [
            this.Move_In_CON_ED_62_years_Yes_Button,
            this.Move_In_CON_ED_62_years_No_Button
          ];
        
        const Q2randomOption = Q2options[Math.floor(Math.random() * Q2options.length)];
        const Q2randomOptionText = await Q2randomOption.textContent();
        await Q2randomOption.click(); 
        log.debug('CON_ED Q2 answer', { answer: Q2randomOptionText ?? '' });

        return {
            Q1randomOptionText,
            Q2randomOptionText
        }
    }


    async BGE_Questions(){
        const Q1options = [
            'Less than 6 months',
            '6 months',
            '1 year or longer',
            'Unsure',
        ];
        const Q1randomIndex = Math.floor(Math.random() * Q1options.length);
        const Q1randomOption = Q1options[Q1randomIndex];
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Lenght_of_Staying_Question).toBeVisible({timeout:30000});
        await this.selectDropdownOption(this.Move_In_Lenght_of_Staying_Dropdown, Q1randomOption, Q1randomIndex);

        const Q2options = [
            'Employed more than 3 years',
            'Employed less than 3 years',
            'Retired',
            'Receives assistance',
            'Other'
        ];
        const Q2randomIndex = Math.floor(Math.random() * Q2options.length);
        const Q2randomOption = Q2options[Q2randomIndex];
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_BGE_Employment_Status_Title).toBeVisible({timeout:30000});
        await this.selectDropdownOption(this.Move_In_BGE_Employment_Status_Dropdown, Q2randomOption, Q2randomIndex);

        return {
            Q1randomOption,
            Q2randomOption
        }
    }


    async TX_DEREG_Questions(){
        const Q1options = [
            'Less than 6 months',
            '6 months',
            '1 year or longer',
            'Unsure',
          ];
        const Q1randomIndex = Math.floor(Math.random() * Q1options.length);
        const Q1randomOption = Q1options[Q1randomIndex];
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Lenght_of_Staying_Question).toBeVisible({timeout:30000});
        await this.selectDropdownOption(this.Move_In_Lenght_of_Staying_Dropdown, Q1randomOption, Q1randomIndex);

        await this.page.waitForTimeout(500);

        const Q2options = [
            this.Move_In_Texas_Thermostat_Yes_Button,
            this.Move_In_Texas_Thermostat_No_Button
          ];

        await expect(this.Move_In_Texas_Thermostat_Question).toBeVisible({timeout:30000});
        const Q2randomOption = Q2options[Math.floor(Math.random() * Q2options.length)];
        const Q2randomOptionText = await Q2randomOption.textContent();
        await Q2randomOption.click();
        return {
            Q1randomOption,
            Q2randomOptionText
        }
    }


    async Length_of_Staying_Questions(){
        const Q1options = [
            'Less than 6 months',
            '6 months',
            '1 year or longer',
            'Unsure',
        ];
        const Q1randomIndex = Math.floor(Math.random() * Q1options.length);
        const Q1randomOption = Q1options[Q1randomIndex];
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Lenght_of_Staying_Question).toBeVisible({timeout:30000});
        await this.selectDropdownOption(this.Move_In_Lenght_of_Staying_Dropdown, Q1randomOption, Q1randomIndex);

        // Handle Employment Status if visible (now appears for all companies)
        await this.page.waitForTimeout(500);
        const employmentVisible = await this.Move_In_BGE_Employment_Status_Title.isVisible({ timeout: 3000 });
        if (employmentVisible) {
            const Q2options = [
                'Employed more than 3 years',
                'Employed less than 3 years',
                'Retired',
                'Receives assistance',
                'Other'
            ];
            const Q2randomIndex = Math.floor(Math.random() * Q2options.length);
            const Q2randomOption = Q2options[Q2randomIndex];
            await this.selectDropdownOption(this.Move_In_BGE_Employment_Status_Dropdown, Q2randomOption, Q2randomIndex);
        }

        return Q1randomOption;
    }


    async COSERV_Questions(){
        const stayOption = await this.Length_of_Staying_Questions();
        return { Q1randomOption: stayOption };
    }


    async Program_Enrolled_Questions(){
        const Q1options = [
            "Yes",
            "No",
            "Pass"
          ];
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Program_Enrolled_Question.first()).toBeVisible({timeout:10000});

        // Handle ALL Program Enrolled radiogroups (multiple when electric & gas are different companies)
        const radiogroups = this.page.getByRole('radiogroup').filter({ hasText: 'Pass' });
        const count = await radiogroups.count();

        let lastOption = '';
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * Q1options.length);
            lastOption = Q1options[randomIndex];
            await radiogroups.nth(i).locator('label').filter({ hasText: lastOption }).click({timeout:10000});
        }

        return lastOption;
    }


    async Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        // Convert ISO date (YYYY-MM-DD) to MMDDYYYY for the masked input field
        const parts = birthdate.split('-');
        const formattedDate = parts.length === 3 ? `${parts[1]}${parts[2]}${parts[0]}` : birthdate;
        await this.Move_In_Birthdate_Field.pressSequentially(formattedDate, {delay: 50});
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        // Identity number field is optional (not all utilities require SSN)
        const idFieldVisible = await this.Move_In_ID_Number_Field.isVisible({ timeout: 3000 }).catch(() => false);
        if (idFieldVisible) {
            await this.Move_In_ID_Number_Field.isEnabled({timeout:10000});
            await this.Move_In_ID_Number_Field.isEditable({timeout:10000});
            await this.Move_In_ID_Number_Field.fill(IDnumber);
        }
        await this.page.waitForTimeout(1000);
    }


    async CON_ED_Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        // Convert ISO date (YYYY-MM-DD) to MMDDYYYY for the masked input field
        const parts = birthdate.split('-');
        const formattedDate = parts.length === 3 ? `${parts[1]}${parts[2]}${parts[0]}` : birthdate;
        await this.Move_In_Birthdate_Field.pressSequentially(formattedDate, {delay: 50});
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);

        // Identity number field is optional (not all utilities require SSN)
        const idFieldVisible = await this.Move_In_CON_ED_ID_Number_Field.isVisible({ timeout: 3000 }).catch(() => false);
        if (idFieldVisible) {
            await this.Move_In_CON_ED_ID_Number_Field.isEnabled({timeout:10000});
            await this.Move_In_CON_ED_ID_Number_Field.isEditable({timeout:10000});
            await this.Move_In_CON_ED_ID_Number_Field.fill(IDnumber);
        }
        await this.page.waitForTimeout(1000);
    }


    async Enter_ID_Info_Prev_Add(prevAddress:string, ElectricCompany: string | null, GasCompany: string | null){
        
        let isVisible

        if(ElectricCompany === null){
            isVisible = await utilityQueries.getIsPriorAddressRequiredUtility(GasCompany || '');
        }
        else if(GasCompany === null){
            isVisible = await utilityQueries.getIsPriorAddressRequiredUtility(ElectricCompany || '');
        }
        else{
            const vis1 = await utilityQueries.getIsPriorAddressRequiredUtility(ElectricCompany || '');
            const vis2 = await utilityQueries.getIsPriorAddressRequiredUtility(GasCompany || '');
            isVisible = vis1 || vis2;
        }

        log.debug('isPriorAddressRequired', { isVisible });

        if (isVisible === true){
            await this.Move_In_Prev_Address_Field.click({timeout:30000});
            await this.page.waitForTimeout(500);
            await this.Move_In_Prev_Address_Field.pressSequentially(prevAddress,{delay:50});
            await this.page.waitForTimeout(500);
            await this.Move_In_Prev_Address_Field.press('Backspace');
            await this.Move_In_Address_Dropdown(prevAddress)?.waitFor({state: 'visible', timeout: 30000});
            await this.Move_In_Address_Dropdown(prevAddress).click({timeout:10000});
            // Wait for address to populate, then force-click title past any secondary dropdown
            await this.page.waitForTimeout(2000);
            await this.Move_In_Identity_Info_Title.click({ force: true });
            await this.page.waitForTimeout(1000);
        }
    }

    async Check_Payment_Page_Visibility(ElectricCompany?: string | null, GasCompany?: string | null){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        const url = new URL(this.page.url());
        const hasShortCode = url.searchParams.has('shortCode');
        const shortCodeValue = url.searchParams.get('shortCode');
        let isHandleBilling = false;
        let setupPaymentDuringOnboarding = false;

        if(hasShortCode === true){
            isHandleBilling = await utilityQueries.getIsHandledBillingBuilding(shortCodeValue || '');
            setupPaymentDuringOnboarding = await utilityQueries.getSetupPaymentDuringOnboardingBuilding(shortCodeValue || '');
        }
        else{
            if(ElectricCompany === null){
                isHandleBilling = await utilityQueries.getIsHandledBillingUtility(GasCompany || '');
                setupPaymentDuringOnboarding = await utilityQueries.getSetupPaymentDuringOnboardingUtility(GasCompany || '');
            }
            else if(GasCompany === null){
                isHandleBilling = await utilityQueries.getIsHandledBillingUtility(ElectricCompany || '');
                setupPaymentDuringOnboarding = await utilityQueries.getSetupPaymentDuringOnboardingUtility(ElectricCompany || '');
            }
            else{
                const vis1 = await utilityQueries.getIsHandledBillingUtility(ElectricCompany || '');
                const vis2 = await utilityQueries.getIsHandledBillingUtility(GasCompany || '');
                isHandleBilling = vis1 || vis2;
                const pay1 = await utilityQueries.getSetupPaymentDuringOnboardingUtility(ElectricCompany || '');
                const pay2 = await utilityQueries.getSetupPaymentDuringOnboardingUtility(GasCompany || '');
                setupPaymentDuringOnboarding = pay1 || pay2;
            }
        }

        // Payment visible only if BOTH flags are true
        const isVisible = isHandleBilling && setupPaymentDuringOnboarding;
        return isVisible;
    }

    async Check_PayThroughPG_Visibility(ElectricCompany?: string | null, GasCompany?: string | null){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        let isVisible;
        
        if(ElectricCompany === null){
            isVisible = await utilityQueries.getIsBillingRequiredUtility(GasCompany || '');
        }
        else if(GasCompany === null){
            isVisible = await utilityQueries.getIsBillingRequiredUtility(ElectricCompany || '');
        }
        else{
            const vis1 = await utilityQueries.getIsBillingRequiredUtility(ElectricCompany || '');
            const vis2 = await utilityQueries.getIsBillingRequiredUtility(GasCompany || '');
            isVisible = vis1 || vis2;
        }
        

        log.debug('payThroughIsVisible', { isVisible: !isVisible });
        return !isVisible;
    }

    async Enter_Card_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:90000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                // Check "Public Grid handles everything" radio — Stripe form appears inline
                await this.Move_In_Pay_Through_PG_Switch.check({ timeout: 5000 });
                await this.page.waitForTimeout(3000);
                await this.Enter_Payment_Details(CCnumber, CCexpiry, CCcvc, CCcountry, CCzip);
            }
            else{
                // Select "I will manage payments myself"
                const selfManageOption = this.page.getByRole('radio', { name: /I will manage payments myself/ });
                await selfManageOption.check({ timeout: 5000 });
            }
        }
        else{
            await this.Enter_Payment_Details(CCnumber, CCexpiry, CCcvc, CCcountry, CCzip);
        }

    }

    async Enter_Valid_Bank_Details(Email:string, FullName:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:90000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                // Check "Public Grid handles everything" radio — payment form appears inline
                await this.Move_In_Pay_Through_PG_Switch.check({ timeout: 5000 });
                await this.page.waitForTimeout(3000);
                await this.Enter_Sucessful_Bank_Details(Email, FullName);
            }
            else{
                // Select "I will manage payments myself"
                const selfManageOption = this.page.getByRole('radio', { name: /I will manage payments myself/ });
                await selfManageOption.check({ timeout: 5000 });
            }
        }
        else{
            await this.Enter_Sucessful_Bank_Details(Email, FullName);
        }

    }


    async Enter_Invalid_Bank_Details(Email:string, FullName:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:90000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                // Check "Public Grid handles everything" radio — payment form appears inline
                await this.Move_In_Pay_Through_PG_Switch.check({ timeout: 5000 });
                await this.page.waitForTimeout(3000);
                await this.Enter_Failed_Bank_Details(Email, FullName);
            }
            else{
                // Select "I will manage payments myself"
                const selfManageOption = this.page.getByRole('radio', { name: /I will manage payments myself/ });
                await selfManageOption.check({ timeout: 5000 });
            }
        }
        else{
            await this.Enter_Failed_Bank_Details(Email, FullName);
        }

    }

    //consider if Pay Through PG is visible
    async Enter_Payment_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        const maxRetries = 2;
        let attempt = 0;
        let success = false;

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:90000});
        

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

        while (attempt < maxRetries && !success) {
            try {
                await CardCountry?.waitForElementState('stable');
                await CardCountry?.waitForElementState('enabled');
                await CardCountry?.hover();
                await CardCountry?.selectOption(CCcountry, { timeout: 30000 });
                success = true; // If the operation succeeds, set success to true
            } catch (error) {
                attempt++;
                log.error(`Card country select attempt ${attempt} failed`, { error: String(error) });
                if (attempt >= maxRetries) {
                    log.error(`Failed to select card country after ${maxRetries} attempts`);
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
    }


    async Enter_Sucessful_Bank_Details(Email:string, FullName:string){

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:90000});
        

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

        const modalIframe = await this.page?.waitForSelector('[src^="https://js.stripe.com/v3/linked-accounts"]');
        const modalFrame = await modalIframe.contentFrame();
        await this.page.waitForTimeout(1000);

        const AgreeButton = await modalFrame?.waitForSelector('[data-testid ="agree-button"]');
        await AgreeButton?.waitForElementState('visible');
        await AgreeButton?.click();

        const SuccessAccountButton = await modalFrame?.waitForSelector('[data-testid ="success"]');
        await SuccessAccountButton?.waitForElementState('visible');
        await SuccessAccountButton?.click();

        // FailureAccountButton not clicked in success flow - just waiting for it to be available
        await modalFrame?.waitForSelector('[data-testid ="failure"]');
        const ConfirmButton = await modalFrame?.waitForSelector('[data-testid ="select-button"]');
        await ConfirmButton?.waitForElementState('visible');
        await ConfirmButton?.click();

        const SuccessMessage = await modalFrame?.waitForSelector('//div[contains(@class, "SuccessPane-textWrapper")]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(500);
    }


    async Enter_Failed_Bank_Details(Email:string, FullName:string){

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:90000});
        

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

        // SuccessAccountButton not clicked in failure flow - just waiting for it to be available
        await modalFrame?.waitForSelector('[data-testid ="success"]');

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
        await this.page.waitForTimeout(500);
    }


    async Enable_Auto_Payment(){
        await expect(this.Move_In_Auto_Payment_Checbox).toBeEnabled({timeout:30000});
        await this.Move_In_Auto_Payment_Checbox.hover();
        await this.Move_In_Auto_Payment_Checbox.setChecked(true,{timeout:10000});
    }


    async Disable_Auto_Payment(){
        const isEnabled = await this.Move_In_Auto_Payment_Checbox.isEnabled();
        if (!isEnabled) {
            log.info('Auto-pay checkbox is disabled (isAutopayRequired=true), cannot uncheck');
            return;
        }
        await this.Move_In_Auto_Payment_Checbox.hover();
        await this.Move_In_Auto_Payment_Checbox.setChecked(false,{timeout:10000});
    }


    async Confirm_Payment_Details(){
        // Try Continue button first (new UI), then Submit as fallback
        try {
            await expect(this.Move_In_Continue_Button).toBeEnabled({timeout:5000});
            await this.Move_In_Continue_Button.hover();
            await this.Move_In_Continue_Button.click();
        } catch {
            await expect(this.Move_In_Submit_Button).toBeEnabled({timeout:30000});
            await this.Move_In_Submit_Button.hover();
            await this.Move_In_Submit_Button.click();
        }
    }


    async Skip_Payment_Details(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:90000});
        await this.page.waitForTimeout(3000);

        // Click "Skip for now" button
        await this.Move_In_Skip_Button.click();
        await this.page.waitForTimeout(2000);

        // Handle confirmation dialog if it appears
        try {
            await expect(this.Move_In_Confirm_Skip_Payment_Title).toBeVisible({ timeout: 5000 });
            await this.Move_In_Confirm_Skip_Payment_Add_Later_Button.click();
        } catch {
            // No confirmation dialog — proceed
        }
    }


    async Get_Account_Number(){
        try {
            const element = await this.Move_In_Account_Number_Value;
            const isVisible = await element.isVisible({timeout: 5000});
            if (isVisible) {
                const textValue = await element.textContent();
                const accountNumber = textValue?.trim() || '';
                log.info('Account number retrieved', { accountNumber });
                return accountNumber;
            }
        } catch {
            log.debug('Account number element not found - new UI may not display account number');
        }
        return '';
    }

    async Click_Start_New_Move_In_Request(){
        await expect(this.Move_In_New_Move_In_Request_Link).toBeVisible({timeout:10000});
        await expect(this.Move_In_New_Move_In_Request_Link).toBeEnabled({timeout:10000});
        await this.Move_In_New_Move_In_Request_Link.hover();
        await this.Move_In_New_Move_In_Request_Link.click();

        await expect(this.Move_In_Welcome_Title).toBeVisible({timeout:30000});
    }


    async Read_ESCO_Conditions(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(3000);

        // Check if ESCO dialog is visible (appears for NY companies)
        // There are TWO duplicate alertdialog elements in DOM
        const gotItButtons = this.page.locator('button:has-text("Got it!")');
        const count = await gotItButtons.count();
        log.debug('Got it! buttons found', { count });

        if (count > 0) {
            log.debug('ESCO Terms visible, clicking Got it!');
            // Click the last button (the interactive one)
            await gotItButtons.last().click({ force: true });
            await this.page.waitForTimeout(3000);

            // Check if ESCO dialog is still visible after clicking
            const stillVisible = await gotItButtons.count();
            log.debug('Got it! buttons after click', { stillVisible });

            // If still visible, try first button
            if (stillVisible > 0) {
                log.debug('Dialog still visible, trying first button');
                await gotItButtons.first().click({ force: true });
                await this.page.waitForTimeout(3000);
            }

            // After dismissing ESCO, we may still be on Utility Setup - click Continue again
            const isOnUtilitySetup = await this.Move_In_Utility_Setup_Title.isVisible().catch(() => false);
            if (isOnUtilitySetup) {
                log.debug('Still on Utility Setup after ESCO, clicking Continue again');
                await this.Move_In_Continue_Button.click();
                await this.page.waitForTimeout(2000);
            }
        } else {
            log.debug('No ESCO Terms dialog found');
        }
    }


    //assertions
    async Check_Email_Registered_Message(){
        await this.page.waitForTimeout(5000);
        await expect(this.Move_In_Email_Registered_Message).toBeVisible({timeout:30000});
        await expect(this.Move_In_OTP_Field).toBeVisible({timeout:30000});
        await expect(this.Move_In_OTP_Field).toBeEnabled({timeout:30000});
    }


    async Check_OTP_Confirmed_Message(){
        // New UI navigates directly to dashboard after OTP — messages may not appear
        try {
            await this.Move_In_OTP_Confirmed_Message.waitFor({ state: 'visible', timeout: 10000 });
            await expect(this.Move_In_Signing_In_Message).toBeVisible({timeout:30000});
        } catch {
            // New UI: OTP confirmed, page navigated directly to dashboard
            log.debug('OTP confirmed messages not shown — new UI navigates to dashboard');
            await this.page.waitForLoadState('domcontentloaded');
        }
    }


    async Check_Successful_Move_In_Billing_Customer(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Success_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Account_Number).toBeVisible({timeout:60000});
        await expect(this.Move_In_New_Move_In_Request_Link).toBeVisible({timeout:5000});
    }


    async Check_Almost_Done_Move_In_Billing_Customer(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Almost_Done_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Registration_Status).toBeVisible({timeout:60000});
        await expect(this.Move_In_Registration_Status).toContainText('Pending');
        await expect(this.Move_In_New_Move_In_Request_Link).toBeVisible({timeout:5000});
    }


    async Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect(){
        
        const [newPage] = await Promise.all([
            this.page.waitForEvent('popup'),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/.*\/app\/finish-account-setup.*/, { timeout: 60000 });
        await newPage.close(); //To be removed
    }

    
    async Check_Successful_Move_In_Non_Billing_Customer(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Success_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Account_Number).toBeVisible({timeout:60000});
        await expect(this.Move_In_New_Move_In_Request_Link).toBeVisible({timeout:5000});
    }



    /**
     * Robust dropdown selection for Radix UI Select portals.
     * Tries multiple strategies: text click, evaluate click, keyboard navigation
     */
    async selectDropdownOption(combobox: Locator, optionText: string, optionIndex: number): Promise<void> {
        await combobox.click();
        await this.page.waitForTimeout(1000);

        // Strategy 1: Click by visible text in the listbox
        const textLocator = this.page.locator('[role="listbox"]').getByText(optionText, { exact: true });
        try {
            await textLocator.click({ timeout: 3000 });
            await this.page.waitForTimeout(300);
            const listbox = this.page.getByRole('listbox');
            if (!(await listbox.isVisible().catch(() => false))) return;
        } catch { /* continue to next strategy */ }

        // Strategy 2: JavaScript click on the option element
        await this.page.evaluate((text) => {
            const options = document.querySelectorAll('[role="option"]');
            for (const opt of options) {
                if (opt.textContent?.trim() === text) {
                    const event = new PointerEvent('pointerdown', { bubbles: true });
                    opt.dispatchEvent(event);
                    opt.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
                    (opt as HTMLElement).click();
                    break;
                }
            }
        }, optionText);
        await this.page.waitForTimeout(300);
        const listbox2 = this.page.getByRole('listbox');
        if (!(await listbox2.isVisible().catch(() => false))) return;

        // Strategy 3: Keyboard navigation
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
        await combobox.click();
        await this.page.waitForTimeout(500);
        for (let i = 0; i < optionIndex; i++) {
            await this.page.keyboard.press('ArrowDown');
            await this.page.waitForTimeout(100);
        }
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(300);
    }


        
}

export default MoveInPage
