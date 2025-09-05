import { type Page, type Locator, expect } from '@playwright/test';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import * as MoveIndata from '../../resources/data/move_in-data.json';

const supabaseQueries = new SupabaseQueries();

export class MoveInPage{
    //variables
    readonly page: Page;
    readonly Move_In_Terms_Logo: Locator;
    readonly Move_In_Terms_PG_Description: Locator;
    readonly Move_In_Terms_Service_Description: Locator;
    //readonly Move_In_Tx_Svc_Service_Description: Locator;
    readonly Move_In_Terms_Payment_Description: Locator;
    readonly Move_In_Terms_Automation_Description: Locator;
    readonly Move_In_Terms_Checkbox: Locator;
    readonly Move_In_Get_Started_Button: Locator;
 
    readonly Move_In_Address_Page_Fields: Locator;
    readonly Move_In_Tx_Svc_Address_Field: Locator;
    readonly Move_In_Back_Link: Locator;
    readonly Move_In_Address_Field: Locator;
    readonly Move_In_Address_Dropdown: (address: string) => Locator;
    readonly Move_In_Unit_Field: Locator;

    readonly Move_In_Account_Setup_Fields: Locator;
    readonly Move_In_Electric_New_Button: Locator;
    readonly Move_In_Electric_Existing_Button: Locator;
    readonly Move_In_Gas_New_Button: Locator;
    readonly Move_In_Gas_Existing_Button: Locator;

    readonly Move_In_Existing_Account_Page_Title: Locator;
    readonly Move_In_Existing_Account_Page_Content: Locator;
    readonly Move_In_Existing_Account_Email_Field: Locator;
    readonly Move_In_Existing_Account_Submmit_Button: Locator;
    readonly Move_In_Existing_Account_Submit_Message: Locator;
    readonly Move_In_Existing_Account_Skip_Button: Locator;
    readonly Move_In_Existing_Account_Skip_Message: Locator;

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

    readonly Move_In_Next_Button: Locator;
    readonly Move_In_Cannot_Find_Address_Link: Locator;
    readonly Move_In_Address_Not_Listed_Message: Locator;

    readonly Move_In_About_You_Title: Locator
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
    readonly Move_In_Dashboard_Link:Locator;

    readonly Move_In_New_Move_In_Request_Link: Locator;

    readonly Move_In_ESCO_Title: Locator;
    readonly Move_In_ESCO_Content: Locator;
    readonly Move_In_ESCO_Got_It_Button: Locator;

  
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Move_In_Terms_Logo = page.locator('[alt="Public Grid Logo"]');
        this.Move_In_Terms_PG_Description = page.getByText('Public Grid is a free');
        this.Move_In_Terms_Service_Description = page.getByText('Open up an account with');
        //this.Move_In_Tx_Svc_Service_Description = page.getByText('Service is guaranteed by your');
        this.Move_In_Terms_Payment_Description = page.getByText('Skip the utility. We create');
        this.Move_In_Terms_Automation_Description = page.getByText('Your energy on auto-pilot. We');
;
        
        this.Move_In_Terms_Checkbox = page.getByLabel('I agree to the Terms of');
        this.Move_In_Get_Started_Button = page.getByRole('button', { name: 'Get Started' });
        this.Move_In_Back_Link = page.getByText('Back');
        this.Move_In_Address_Page_Fields = page.getByRole('heading', { name: 'Where are you looking to' });
        this.Move_In_Tx_Svc_Address_Field = page.getByRole('heading', { name: 'Where do you live?' });
        this.Move_In_Address_Field = page.locator('#address');
        this.Move_In_Address_Dropdown = (address: string) => page.getByText(address);
        this.Move_In_Unit_Field = page.locator('input[name="unitNumber"]');

        this.Move_In_Account_Setup_Fields = page.getByRole('heading', { name: 'What can we set up for you' });
        this.Move_In_Electric_New_Button = page.locator('//label[@id = "Electric-new"]');
        this.Move_In_Electric_Existing_Button = page.locator('//label[@id = "Electric-existing"]');
        this.Move_In_Gas_New_Button = page.locator('//label[@id = "Gas-new"]');
        this.Move_In_Gas_Existing_Button = page.locator('//label[@id = "Gas-existing"]');

        this.Move_In_Existing_Account_Page_Title = page.getByRole('heading', { name: 'You are all set!' });
        this.Move_In_Existing_Account_Page_Content = page.getByText('Looks like you\'re already set');
        this.Move_In_Existing_Account_Email_Field = page.getByRole('textbox');
        this.Move_In_Existing_Account_Submmit_Button = page.getByRole('button', { name: 'Submit' });
        this.Move_In_Existing_Account_Submit_Message = page.getByText('Awesome! We will be in touch');
        this.Move_In_Existing_Account_Skip_Button = page.getByRole('button', { name: 'Skip for now' });
        this.Move_In_Existing_Account_Skip_Message = page.getByText('We hope you had a safe and');

        this.Move_In_Tx_Svc_Title = page.getByRole('heading', { name: 'Good news! We are in your' });
        this.Move_In_Tx_Svc_Electric_Service = page.locator('div').filter({ hasText: /^ElectricityService with$/ }).nth(1);
        this.Move_In_Tx_Svc_Gas_Service = page.locator('div').filter({ hasText: /^Natural GasService with$/ }).nth(1)
        this.Move_In_Tx_Svc_Content = page.getByText('How it works:We close your');
        this.Move_In_Tx_Svc_Agreement_Checkbox = page.getByLabel('I want Public Grid to close');

        this.Move_In_Texas_Agreement_Title = page.getByRole('heading', { name: 'Good News! We are in your' });
        this.Move_In_Texas_Agreement_Content = page.getByText('Public Grid starts service for:ElectricityHow it worksWe scan the market for');

        this.Move_In_Email_Registered_Message = page.getByText('That email is already');
        this.Move_In_OTP_Field = page.locator('input[name="otpCode"]');
        this.Move_In_OTP_Confirmed_Message = page.getByText('OTP Confirmed ✅', { exact: true });
        this.Move_In_Signing_In_Message = page.getByText('Signing in...', { exact: true });

        this.Move_In_Next_Button = page.getByRole('button', { name: 'Next', exact: true });
        this.Move_In_Cannot_Find_Address_Link = page.getByRole('button', { name: 'I cannot find my address' });
        this.Move_In_Address_Not_Listed_Message = page.getByRole('heading', { name: 'Address not listed in the' });

        this.Move_In_About_You_Title = page.getByRole('heading', { name: 'Tell us a little about you' });
        this.Move_In_First_Name_Field = page.locator('input[name="firstName"]');
        this.Move_In_Last_Name_Field = page.locator('input[name="lastName"]');
        this.Move_In_First_Name_Null_Message = page.locator('[id="\\:r5\\:-form-item-message"]');
        this.Move_In_Last_Name_Null_Message = page.locator('[id="\\:r6\\:-form-item-message"]');
        this.Move_In_Phone_Field = page.locator('input[name="phone"]');
        this.Move_In_Phone_Invalid_Message = page.getByText('Phone number must be in 000-');
        this.Move_In_Receive_Text_Checkbox = page.getByLabel('I agree to receive text');
        this.Move_In_Email_Field = page.locator('input[name="email"]');
        this.Move_In_Email_Invalid_Message = page.getByText('Email address must be valid.');
        
        this.Move_In_Date_Field = page.locator('//p[contains(text(),"Date")]//following::div[@type="button"]');
        this.Move_In_Date_Selector = (day: string) => page.locator('//button[text()='+ day +' and not(contains(@class, "text-muted-foreground opacity-50"))]');
        this.Move_In_Next_Month_Button = page.getByLabel('Go to next month');
        this.Move_In_Prev_Month_Button = page.getByLabel('Go to previous month');
        this.Move_In_Identity_Info_Title = page.getByRole('heading', { name: 'Identity Information' });

        this.Move_In_CON_ED_Questions_Title =  page.getByRole('heading', { name: 'A couple of quick questions' });
        this.Move_In_CON_ED_Life_Support_Yes_Button = page.locator('//p[contains(text(),"life-support")]//parent::div//div//label[contains(@for, "Yes")]');
        this.Move_In_CON_ED_Life_Support_No_Button = page.locator('//p[contains(text(),"life-support")]//parent::div//div//label[contains(@for, "No")]');
        this.Move_In_CON_ED_62_years_Yes_Button = page.locator('//p[contains(text(),"62 years")]//parent::div//div//label[contains(@for, "Yes")]');
        this.Move_In_CON_ED_62_years_No_Button = page.locator('//p[contains(text(),"62 years")]//parent::div//div//label[contains(@for, "No")]');

        this.Move_In_BGE_Employment_Status_Title = page.getByText('Employment Status');
        this.Move_In_BGE_Employment_Status_Dropdown = page.locator('//p[contains(text(),"Employment Status")]//parent::div//button');
        this.Move_In_BGE_Employment_Selection = (selection: string) => page.locator(`//span[contains(text(),"${selection}")]`);

        this.Move_In_Lenght_of_Staying_Question = page.getByText('How long are you planning on');
        this.Move_In_Lenght_of_Staying_Dropdown = page.locator('//p[contains(text(),"How long are you planning on staying at your current address?")]//parent::div//button');
        this.Move_In_Lenght_of_Staying_Selection = (selection: string) => page.getByText(selection, { exact: true });
        this.Move_In_Texas_Thermostat_Question = page.getByText('Do you own a smart thermostat?');
        this.Move_In_Texas_Thermostat_Yes_Button = page.locator('//p[contains(text(),"thermostat")]//following::label[contains(@for, "Yes")]');
        this.Move_In_Texas_Thermostat_No_Button = page.locator('//p[contains(text(),"thermostat")]//following::label[contains(@for, "No")]');

        this.Move_In_Program_Enrolled_Question = page.locator('//p[text()="Are you enrolled in any of the programs below? If so, you might qualify for additional savings on your bill."]');
        this.Move_In_Program_Enrolled_Options = (option: string) => page.locator(`//p[text()="Are you enrolled in any of the programs below? If so, you might qualify for additional savings on your bill."]//parent::div//..//label[contains(@for, "${option}")]`);

        this.Move_In_Birthdate_Field = page.locator('input[name="dateOfBirth"]');
        this.Move_In_Birthdate_Required_Message = page.getByText('Date of Birth Required');
        this.Move_In_Birthdate_Mustbe18_Message = page.getByText('Must be 18 years or older');
        this.Move_In_Birthdate_Lessthan100_Message = page.getByText('Must be less than 100 years');
        this.Move_In_ID_Dropdown = page.getByText('Must be 18 years or older');
        this.Move_In_State_Dropdown = page.getByText('Select State');
        this.Move_In_ID_Number_Field = page.locator('//input[@name = "identityNumber"]');
        this.Move_In_CON_ED_ID_Number_Field = page.locator('//input[@name = "identityNumber"]');
        this.Move_In_Identify_Info_Message = page.getByText('This information is never');
        this.Move_In_Prev_Address_Field = page.locator('#onboardingAddress')

        this.Move_In_Auto_Payment_Checbox = page.getByLabel('Enable auto-pay (bill is paid');
        this.Move_In_Submit_Button = page.getByRole('button', { name: 'Submit', exact: true });
        this.Move_In_Skip_Button = page.getByRole('button', { name: 'Skip for now' });

        this.Move_In_Confirm_Skip_Payment_Title = page.getByRole('heading', { name: 'We need a payment method on' });
        this.Move_In_Confirm_Skip_Payment_Question_Link = page.getByText('Questions? Chat with us so we');
        this.Move_In_Confirm_Skip_Payment_Add_Now_Button = page.getByRole('button', { name: 'Add a payment method now' });
        this.Move_In_Confirm_Skip_Payment_Add_Later_Button = page.getByRole('button', { name: 'I will add my payment later' });

        //this.Move_In_Payment_Details_Title = page.getByRole('heading', { name: 'Add a payment method for your' });
        this.Move_In_Payment_Details_Title = page.getByRole('heading', { name: /Add a payment method/i });
        this.Move_In_Pay_Through_PG_Title = page.getByText('Pay your bill through Public');
        this.Move_In_Pay_Through_PG_Switch = page.getByRole('switch');
        //this.Move_In_Pay_Through_PG_Yes = page.getByLabel('Yes');
        //this.Move_In_Pay_Through_PG_No = page.getByLabel('No', { exact: true });
        this.Move_In_Service_Fee_Message = page.getByText('Cards have a 3% fee, while bank');

        this.Move_In_Success_Message = page.getByText('Success! 🥳Your account is');
        this.Move_In_Account_Number = page.getByText('Account Number:');

        this.Move_In_Almost_Done_Message = page.getByRole('heading', { name: 'Almost Done!' })
        this.Move_In_Registration_Status = page.locator('//div[contains(text(),"Registration Status")]');

        this.Move_In_Account_Number_Value = page.locator("//div[contains(@class,'callout-text')]//child::b");
        this.Move_In_Survey_Star = page.locator('path').nth(2);
        this.Move_In_Survey_Submit_Button = page.getByText('Tell us how your experience was so far!Submit');
        this.Move_In_Feedback_Thanks_Message = page.getByText('Thanks for the feedback 💚');
        this.Move_In_Dashboard_Link = page.getByRole('link', { name: 'Dashboard' });

        this.Move_In_New_Move_In_Request_Link = page.locator('//button[text() = "Start a new move-in request"]');

        this.Move_In_ESCO_Title = page.getByRole('heading', { name: 'Because you live in New York' });
        this.Move_In_ESCO_Content = page.getByText('Public Grid is not an ESCO,')
        this.Move_In_ESCO_Got_It_Button = page.getByRole('button', { name: 'Got it!' })
    }



    //methods
    async Agree_on_Terms_and_Get_Started() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        
        await expect(this.Move_In_Terms_Logo).toBeVisible({timeout:30000});
        await expect(this.Move_In_Terms_PG_Description).toBeVisible({timeout:30000});
        await expect(this.Move_In_Terms_Service_Description).toBeVisible({timeout:1000})

        //try{
        //    await expect(this.Move_In_Terms_Service_Description).toBeVisible({timeout:1000});
        //}
        //catch{
        //    await expect(this.Move_In_Tx_Svc_Service_Description).toBeVisible({timeout:10000});
        //}

        await expect(this.Move_In_Terms_Payment_Description).toBeVisible({timeout:30000});
        await expect(this.Move_In_Terms_Automation_Description).toBeVisible({timeout:30000});
        await this.Move_In_Terms_Checkbox.hover({timeout:30000});
        await this.Move_In_Terms_Checkbox.isEnabled({timeout:10000});
        await this.Move_In_Terms_Checkbox.setChecked(true,{timeout:10000});
        await this.Move_In_Get_Started_Button.hover({timeout:30000});
        await this.Move_In_Get_Started_Button.isEnabled({timeout:10000});
        await this.Move_In_Get_Started_Button.click();
    }


    async Enter_Address(address:string, unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Fields).toBeVisible({timeout:3000});
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({timeout:10000});
        }
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.click({timeout:10000});
        await this.Move_In_Address_Field.pressSequentially(address,{delay:50});
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.press('Backspace');
        await this.Move_In_Address_Dropdown(address)?.waitFor({state: 'visible', timeout: 30000});
        await this.Move_In_Address_Dropdown(address).click({timeout:10000});
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.fill(unit);
        await this.page.waitForTimeout(1000);
    }


    async Enter_Address_GUID_Flow(address:string, unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Fields).toBeVisible({timeout:3000});
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({timeout:10000});
        }
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.click({timeout:10000});
        await this.Move_In_Address_Field.pressSequentially(address,{delay:50});
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.press('Backspace');
        await this.Move_In_Address_Dropdown(address)?.waitFor({state: 'visible', timeout: 30000});
        await this.Move_In_Address_Dropdown(address).click({timeout:10000});
        await expect(this.Move_In_Unit_Field).not.toBeNull();
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.pressSequentially('GUID'+ unit);
        await this.page.waitForTimeout(1000);
    }

    async Parameterized_Address_GUID_Flow(unit:string) {
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect(this.Move_In_Address_Page_Fields).toBeVisible({timeout:3000});
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
            await expect(this.Move_In_Address_Page_Fields).toBeVisible({timeout:3000});
        }
        catch{
            await expect(this.Move_In_Tx_Svc_Address_Field).toBeVisible({timeout:10000});
        }
        await this.page.waitForTimeout(1000);
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.fill(unit);
        await this.page.waitForTimeout(1000);
    }


    async Setup_Account(Electric_New: boolean, Gas_New: boolean){ 
        await expect(this.Move_In_Account_Setup_Fields).toBeVisible({timeout:15000});
        if(await this.Move_In_Electric_New_Button.isVisible()){
            if(Electric_New == true){
                await this.Move_In_Electric_New_Button.hover();
                await this.Move_In_Electric_New_Button.click();
            }
            else{
                await this.Move_In_Electric_Existing_Button.hover();
                await this.Move_In_Electric_Existing_Button.click();
            }
        }

        

        if(await this.Move_In_Gas_New_Button.isVisible()){
            if(Gas_New == true){
                await this.Move_In_Gas_New_Button.hover();
                await this.Move_In_Gas_New_Button.click();
            }
            else{
                await this.Move_In_Gas_Existing_Button.hover();
                await this.Move_In_Gas_Existing_Button.click();
            }
        }

    }


    async Existing_Utility_Account_Connect_Request(email: string|null, submit: boolean){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        await expect(this.Move_In_Existing_Account_Page_Title).toBeVisible({timeout:30000});
        await expect(this.Move_In_Existing_Account_Page_Content).toBeVisible({timeout:30000});

        if(email != null){
            await this.Move_In_Existing_Account_Email_Field.click();
            await this.Move_In_Existing_Account_Email_Field.fill(email);
        }

        if(submit == true){
            await this.Move_In_Existing_Account_Submmit_Button.hover();
            await this.Move_In_Existing_Account_Submmit_Button.click();
            await this.page.waitForTimeout(1000);
            await expect(this.Move_In_Existing_Account_Submit_Message).toBeVisible({timeout:30000});
        }
        else{
            await this.Move_In_Existing_Account_Skip_Button.hover();
            await this.Move_In_Existing_Account_Skip_Button.click();
            await this.page.waitForTimeout(1000);
            await expect(this.Move_In_Existing_Account_Skip_Message).toBeVisible({timeout:30000});
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
            console.log("No Electric Service");
        }

        try{
            await expect(this.Move_In_Tx_Svc_Gas_Service).toBeVisible({timeout:1500});
        }
        catch{
            console.log("No Gas Service");
        }
        
        await expect(this.Move_In_Tx_Svc_Content).toBeVisible({timeout:10000});
        await this.Move_In_Tx_Svc_Agreement_Checkbox.hover();
        await this.Move_In_Tx_Svc_Agreement_Checkbox.isEnabled();
        await this.Move_In_Tx_Svc_Agreement_Checkbox.setChecked(true,{timeout:10000});
    }


    async Texas_Service_Agreement(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Texas_Agreement_Title).toBeVisible({timeout:10000});
        await expect(this.Move_In_Texas_Agreement_Content).toBeVisible({timeout:10000});
    }

    
    async Next_Move_In_Button(){
        await expect(this.Move_In_Next_Button).toBeEnabled({timeout:10000});
        await this.Move_In_Next_Button.hover({timeout:10000});
        await this.Move_In_Next_Button.click({timeout:10000});
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
        await this.Move_In_Date_Field.click({timeout:10000});


        if (await this.Move_In_Date_Selector(day).isVisible()){
            await this.Move_In_Date_Selector(day).click();
            await this.page.waitForTimeout(500);
            await this.Move_In_About_You_Title.click();
        }
        else{
            await this.Move_In_Next_Month_Button.click();
            await this.Move_In_Date_Selector(day).click();
            await this.page.waitForTimeout(500);
            await this.Move_In_About_You_Title.click();
        }

        await expect(this.Move_In_Receive_Text_Checkbox).toBeVisible({timeout:10000});
        await expect(this.Move_In_Receive_Text_Checkbox).toBeChecked();

        // Randomize whether to check the checkbox or not
        const shouldCheck = Math.random() < 0.5;

        if (shouldCheck) {
            await this.Move_In_Receive_Text_Checkbox.setChecked(true, { timeout: 10000 });
        } else {
            await this.Move_In_Receive_Text_Checkbox.setChecked(false, { timeout: 10000 });
        }

        console.log('Receive Text:', shouldCheck);
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
        await this.Move_In_Date_Field.click({timeout:10000});

        if (await this.Move_In_Date_Selector(day).isVisible()){
            await this.Move_In_Date_Selector(day).click();
            await this.page.waitForTimeout(500);
            await this.Move_In_About_You_Title.click();
        }
        else{
            await this.Move_In_Next_Month_Button.click();
            await this.Move_In_Date_Selector(day).click();
            await this.page.waitForTimeout(500);
            await this.Move_In_About_You_Title.click();
        }

        await expect(this.Move_In_Receive_Text_Checkbox).toBeVisible({timeout:10000});
        await expect(this.Move_In_Receive_Text_Checkbox).toBeChecked();

        // Randomize whether to check the checkbox or not
        const shouldCheck = Math.random() < 0.5;

        if (shouldCheck) {
            await this.Move_In_Receive_Text_Checkbox.setChecked(true, { timeout: 10000 });
        } else {
            await this.Move_In_Receive_Text_Checkbox.setChecked(false, { timeout: 10000 });
        }

        console.log('Receive Text:', shouldCheck);
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
        console.log(Q1randomOptionText);

        const Q2options = [
            this.Move_In_CON_ED_62_years_Yes_Button,
            this.Move_In_CON_ED_62_years_No_Button
          ];
        
        const Q2randomOption = Q2options[Math.floor(Math.random() * Q2options.length)];
        const Q2randomOptionText = await Q2randomOption.textContent();
        await Q2randomOption.click(); 
        console.log(Q2randomOptionText);

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
        console.log(Q1randomOption);
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Lenght_of_Staying_Question).toBeVisible({timeout:30000});
        await this.Move_In_Lenght_of_Staying_Dropdown.hover();
        await this.page.waitForTimeout(500);
        await this.Move_In_Lenght_of_Staying_Dropdown.click();
        await this.page.waitForTimeout(500);
        await expect(this.Move_In_Lenght_of_Staying_Selection(Q1randomOption)).toBeVisible({timeout:30000});
        await this.page.waitForTimeout(500);
        await this.Move_In_Lenght_of_Staying_Selection(Q1randomOption).hover({timeout:5000});  
        await this.Move_In_Lenght_of_Staying_Selection(Q1randomOption).click({timeout:5000});

        const Q2options = [
            'Employed more than 3 years',
            'Employed less than 3 years',
            'Retired',
            'Receives assistance',
            'Other'
        ];
        const Q2randomIndex = Math.floor(Math.random() * Q2options.length);
        const Q2randomOption = Q2options[Q2randomIndex];
        console.log(Q2randomOption);
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_BGE_Employment_Status_Title).toBeVisible({timeout:30000});
        await this.Move_In_BGE_Employment_Status_Dropdown.hover();
        await this.page.waitForTimeout(500);
        await this.Move_In_BGE_Employment_Status_Dropdown.click();
        await this.page.waitForTimeout(500);
        await expect(this.Move_In_BGE_Employment_Selection(Q2randomOption)).toBeVisible({timeout:30000});
        await this.page.waitForTimeout(500);
        await this.Move_In_BGE_Employment_Selection(Q2randomOption).hover({timeout:5000});
        await this.Move_In_BGE_Employment_Selection(Q2randomOption).click({timeout:5000});

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
        console.log(Q1randomOption);
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Lenght_of_Staying_Question).toBeVisible({timeout:30000});
        await this.Move_In_Lenght_of_Staying_Dropdown.hover();
        await this.Move_In_Lenght_of_Staying_Dropdown.click();
        await this.page.waitForTimeout(500);
        await expect(this.Move_In_Lenght_of_Staying_Selection(Q1randomOption)).toBeVisible({timeout:30000});  
        await this.Move_In_Lenght_of_Staying_Selection(Q1randomOption).click({timeout:10000});

        await this.page.waitForTimeout(500);

        const Q2options = [
            this.Move_In_Texas_Thermostat_Yes_Button,
            this.Move_In_Texas_Thermostat_No_Button
          ];
        
        await expect(this.Move_In_Texas_Thermostat_Question).toBeVisible({timeout:30000});
        const Q2randomOption = Q2options[Math.floor(Math.random() * Q2options.length)];
        const Q2randomOptionText = await Q2randomOption.textContent();
        await Q2randomOption.click(); 
        console.log(Q2randomOptionText);
        return {
            Q1randomOption,
            Q2randomOptionText
        }
    }


    async Program_Enrolled_Questions(){
        const Q1options = [
            "Yes",
            "No",
            "Pass"
          ];
        const Q1randomIndex = Math.floor(Math.random() * Q1options.length);
        const Q1randomOption = Q1options[Q1randomIndex];
        console.log("Program Enrolled: ", Q1randomOption);
        await this.page.waitForLoadState('domcontentloaded');

        await expect(this.Move_In_Program_Enrolled_Question).toBeVisible({timeout:10000});
        await expect(this.Move_In_Program_Enrolled_Options(Q1randomOption)).toBeVisible({timeout:10000});  
        await this.Move_In_Program_Enrolled_Options(Q1randomOption).hover({timeout:10000});
        await this.Move_In_Program_Enrolled_Options(Q1randomOption).click({timeout:10000});

        return Q1randomOption
    }


    async Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        await this.Move_In_Birthdate_Field.fill(birthdate,{timeout:10000});
        await this.Move_In_ID_Number_Field.isEnabled({timeout:10000});
        await this.Move_In_ID_Number_Field.isEditable({timeout:10000});
        await this.Move_In_ID_Number_Field.fill(IDnumber);
        await this.page.waitForTimeout(1000);
    }


    async CON_ED_Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        await this.Move_In_Birthdate_Field.fill(birthdate,{timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.isEnabled({timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.isEditable({timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.fill(IDnumber);
        await this.page.waitForTimeout(1000);
    }


    async Enter_ID_Info_Prev_Add(prevAddress:string, ElectricCompany: string | null, GasCompany: string | null){
        
        let isVisible

        if(ElectricCompany === null){
            isVisible = await supabaseQueries.Get_isPriorAddressRequired_Utility(GasCompany || '');
        }
        else if(GasCompany === null){
            isVisible = await supabaseQueries.Get_isPriorAddressRequired_Utility(ElectricCompany || '');
        }
        else{
            const vis1 = await supabaseQueries.Get_isPriorAddressRequired_Utility(ElectricCompany || '');
            const vis2 = await supabaseQueries.Get_isPriorAddressRequired_Utility(GasCompany || '');
            isVisible = vis1 || vis2;
        }

        console.log('isPriorAddressRequired:', isVisible);

        if (isVisible === true){
            await this.Move_In_Prev_Address_Field.click({timeout:30000});
            await this.page.waitForTimeout(500);
            await this.Move_In_Prev_Address_Field.fill(prevAddress,{timeout:30000});
            await this.Move_In_Address_Dropdown(prevAddress).click();
            await this.page.waitForTimeout(500);
            await this.Move_In_Identity_Info_Title.click();
            await this.page.waitForTimeout(1000);
        }
    }

    async Check_Payment_Page_Visibility(ElectricCompany?: string | null, GasCompany?: string | null){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        const url = new URL(this.page.url());
        const hasShortCode = url.searchParams.has('shortCode');
        const shortCodeValue = url.searchParams.get('shortCode');
        let isVisible
        
        console.log('Has shortCode:', hasShortCode);
        console.log('shortCode value:', shortCodeValue);

        if(hasShortCode === true){
            isVisible = await supabaseQueries.Get_isHandledBilling_Building(shortCodeValue || '');
        }
        else{
            if(ElectricCompany === null){
                isVisible = await supabaseQueries.Get_isHandledBilling_Utility(GasCompany || '');
            }
            else if(GasCompany === null){
                isVisible = await supabaseQueries.Get_isHandledBilling_Utility(ElectricCompany || '');
            }
            else{
                const vis1 = await supabaseQueries.Get_isHandledBilling_Utility(ElectricCompany || '');
                const vis2 = await supabaseQueries.Get_isHandledBilling_Utility(GasCompany || '');
                isVisible = vis1 || vis2;
            }
        }

        console.log('paymentIsVisible:', isVisible);
        return isVisible;
    }

    async Check_PayThroughPG_Visibility(ElectricCompany?: string | null, GasCompany?: string | null){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        let isVisible;
        
        if(ElectricCompany === null){
            isVisible = await supabaseQueries.Get_isBillingRequired_Utility(GasCompany || '');
        }
        else if(GasCompany === null){
            isVisible = await supabaseQueries.Get_isBillingRequired_Utility(ElectricCompany || '');
        }
        else{
            const vis1 = await supabaseQueries.Get_isBillingRequired_Utility(ElectricCompany || '');
            const vis2 = await supabaseQueries.Get_isBillingRequired_Utility(GasCompany || '');
            isVisible = vis1 || vis2;
        }
        

        console.log('payThroughIsVisible:', !isVisible);
        return !isVisible;
    }

    async Enter_Card_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
    
        
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                await this.Move_In_Pay_Through_PG_Switch.setChecked(true, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_Yes.hover();
                //await this.Move_In_Pay_Through_PG_Yes.click();

                console.log("Pay through PG:", PayThroughPG);

                await this.Enter_Payment_Details(CCnumber, CCexpiry, CCcvc, CCcountry, CCzip);
            }
            else{
                await this.Move_In_Pay_Through_PG_Switch.setChecked(false, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_No.hover();
                //await this.Move_In_Pay_Through_PG_No.click();

                console.log("Pay through PG:", PayThroughPG);
            }
        }
        else{
            await this.Enter_Payment_Details(CCnumber, CCexpiry, CCcvc, CCcountry, CCzip);
        }
        
    }

    async Enter_Valid_Bank_Details(Email:string, FullName:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                await this.Move_In_Pay_Through_PG_Switch.setChecked(true, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_Yes.hover();
                //await this.Move_In_Pay_Through_PG_Yes.click();

                console.log("Pay through PG:", PayThroughPG);

                await this.Enter_Sucessful_Bank_Details(Email, FullName);
            }
            else{
                await this.Move_In_Pay_Through_PG_Switch.setChecked(false, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_No.hover();
                //await this.Move_In_Pay_Through_PG_No.click();

                console.log("Pay through PG:", PayThroughPG);
            }
        }
        else{
            await this.Enter_Sucessful_Bank_Details(Email, FullName);
        }
        
    }


    async Enter_Invalid_Bank_Details(Email:string, FullName:string, PayThroughPG:boolean = true){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });


        if(PayThroughPGVisible){
            if(PayThroughPG == true){
                await this.Move_In_Pay_Through_PG_Switch.setChecked(true, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_Yes.hover();
                //await this.Move_In_Pay_Through_PG_Yes.click();

                console.log("Pay through PG:", PayThroughPG);

                await this.Enter_Failed_Bank_Details(Email, FullName);
            }
            else{
                await this.Move_In_Pay_Through_PG_Switch.setChecked(false, { timeout: 5000 });
                //await this.Move_In_Pay_Through_PG_No.hover();
                //await this.Move_In_Pay_Through_PG_No.click();

                console.log("Pay through PG:", PayThroughPG);
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

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:30000});
        

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
    }


    async Enter_Sucessful_Bank_Details(Email:string, FullName:string){

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:30000});
        

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

        const modalIframe = await this.page?.waitForSelector('[src^="https://js.stripe.com/v3/linked-accounts"]');
        const modalFrame = await modalIframe.contentFrame();
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
        await this.page.waitForTimeout(500);
    }


    async Enter_Failed_Bank_Details(Email:string, FullName:string){

        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:30000});
        

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
        await this.page.waitForTimeout(500);
    }


    async Enable_Auto_Payment(){
        await expect(this.Move_In_Auto_Payment_Checbox).toBeEnabled({timeout:30000});
        await this.Move_In_Auto_Payment_Checbox.hover();
        await this.Move_In_Auto_Payment_Checbox.setChecked(true,{timeout:10000});
    }


    async Disable_Auto_Payment(){
        await expect(this.Move_In_Auto_Payment_Checbox).toBeEnabled({timeout:30000});
        await this.Move_In_Auto_Payment_Checbox.hover();
        await this.Move_In_Auto_Payment_Checbox.setChecked(false,{timeout:10000});
    } 


    async Confirm_Payment_Details(){
        await expect(this.Move_In_Submit_Button).toBeEnabled({timeout:30000});
        await this.Move_In_Submit_Button.hover();
        await this.Move_In_Submit_Button.click();
    }


    async Skip_Payment_Details(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});

        await this.page.waitForTimeout(3000);
        const PayThroughPGVisible = await this.Move_In_Pay_Through_PG_Title.isVisible({ timeout: 3000 });

        if(PayThroughPGVisible){
            await this.Move_In_Pay_Through_PG_Switch.setChecked(true, { timeout: 5000 });

            await expect(this.Move_In_Skip_Button).toBeEnabled({timeout:30000});
            await this.Move_In_Skip_Button.hover();
            await this.Move_In_Skip_Button.click();
    
            await expect(this.Move_In_Confirm_Skip_Payment_Title).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Question_Link).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Question_Link).toBeEnabled({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Add_Now_Button).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Add_Now_Button).toBeEnabled({timeout:30000});
            
            await this.Move_In_Confirm_Skip_Payment_Add_Later_Button.hover({timeout:30000});
            await this.Move_In_Confirm_Skip_Payment_Add_Later_Button.click();
        }
        else{
            await expect(this.Move_In_Skip_Button).toBeEnabled({timeout:30000});
            await this.Move_In_Skip_Button.hover();
            await this.Move_In_Skip_Button.click();
    
            await expect(this.Move_In_Confirm_Skip_Payment_Title).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Question_Link).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Question_Link).toBeEnabled({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Add_Now_Button).toBeVisible({timeout:30000});
            await expect(this.Move_In_Confirm_Skip_Payment_Add_Now_Button).toBeEnabled({timeout:30000});
            
            await this.Move_In_Confirm_Skip_Payment_Add_Later_Button.hover({timeout:30000});
            await this.Move_In_Confirm_Skip_Payment_Add_Later_Button.click();   
        }
    }


    async Click_Dashboard_Link(){
        await expect(this.Move_In_Dashboard_Link).toBeEnabled({timeout:10000});
        await this.Move_In_Dashboard_Link.hover();
        await this.Move_In_Dashboard_Link.click();
    }


    async Get_Account_Number(){
        const element = await this.Move_In_Account_Number_Value;
        const textValue = await element.textContent();
        const accountNumber = textValue?.trim() || '';
        console.log(accountNumber);
        return accountNumber;
    }

    async Click_Start_New_Move_In_Request(){
        await expect(this.Move_In_New_Move_In_Request_Link).toBeVisible({timeout:10000});
        await expect(this.Move_In_New_Move_In_Request_Link).toBeEnabled({timeout:10000});
        await this.Move_In_New_Move_In_Request_Link.hover();
        await this.Move_In_New_Move_In_Request_Link.click();

        await expect(this.Move_In_Terms_Logo).toBeVisible({timeout:30000});
    }


    async Read_ESCO_Conditions(){
        const maxRetries = 10;
        let retries = 0;
        let vis = false;

        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');

        while (retries < maxRetries) {
            vis = await this.Move_In_ESCO_Title.isVisible();
            if (vis == true) {
                break;
            }
            retries++;
            await new Promise(resolve => setTimeout(resolve, 500)); // wait for 0.5 seconds
        }
        
        console.log("ESCO Terms:",vis);

        if(vis == true){
            await expect(this.Move_In_ESCO_Title).toBeVisible({timeout:30000});
            await expect(this.Move_In_ESCO_Content).toBeVisible({timeout:30000});
            await expect (this.Move_In_ESCO_Got_It_Button).toBeVisible({timeout:30000});
    
            await this.Move_In_ESCO_Got_It_Button.hover({timeout:30000});
            await this.Move_In_ESCO_Got_It_Button.isEnabled({timeout:10000});
            await this.Move_In_ESCO_Got_It_Button.click();
    
            await this.page.waitForTimeout(500);
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
        await this.Move_In_OTP_Confirmed_Message.hover();
        await expect(this.Move_In_OTP_Confirmed_Message).toBeVisible({timeout:30000});
        await expect(this.Move_In_Signing_In_Message).toBeVisible({timeout:30000});
    }


    async Check_Successful_Move_In_Billing_Customer(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Success_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Account_Number).toBeVisible({timeout:60000});
        await expect(this.Move_In_Dashboard_Link).toBeVisible();
    }


    async Check_Almost_Done_Move_In_Billing_Customer(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Almost_Done_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Registration_Status).toBeVisible({timeout:60000});
        await expect(this.Move_In_Registration_Status).toContainText('Pending');
        await expect(this.Move_In_Dashboard_Link).toBeVisible();
    }


    async Check_Billing_Customer_Added_Payment_Overview_Redirect(){

        const [newPage] = await Promise.all([
            this.page.waitForEvent('popup'),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/.*\/app\/overview.*/, { timeout: 60000 });
        //await expect(newPage.locator('//h3[contains(text(),"Getting Started")]/parent::div/parent::div')).toBeVisible({timeout:60000});
        await newPage.close();
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
        await expect(this.Move_In_Dashboard_Link).toBeHidden({timeout:60000});
    }



        
}

export default MoveInPage