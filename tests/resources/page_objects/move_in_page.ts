import { type Page, type Locator, expect } from '@playwright/test';


export class MoveInPage{
    //variables
    readonly page: Page;
    readonly Move_In_Terms_Logo: Locator;
    readonly Move_In_Terms_PG_Description: Locator;
    readonly Move_In_Terms_Service_Description: Locator;
    readonly Move_In_Terms_Payment_Description: Locator;
    readonly Move_In_Terms_Automation_Description: Locator;
    readonly Move_In_Terms_Checkbox: Locator;
    readonly Move_In_Get_Started_Button: Locator;
 
    readonly Move_In_Address_Page_Fields: Locator;
    readonly Move_In_Back_Link: Locator;
    readonly Move_In_Address_Field: Locator;
    readonly Move_In_Address_Dropdown: (address: string) => Locator;
    readonly Move_In_Unit_Field: Locator;

    readonly Move_In_Account_Setup_Fields: Locator;
    readonly Move_In_Electric_New_Button: Locator;
    readonly Move_In_Electric_Existing_Button: Locator;
    readonly Move_In_Gas_New_Button: Locator;
    readonly Move_In_Gas_Existing_Button: Locator;

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
    readonly Move_In_Email_Field: Locator;
    readonly Move_In_Email_Invalid_Message: Locator;
    
    readonly Move_In_Date_Field: Locator;
    readonly Move_In_Date_Selector: (day: string) => Locator;
    readonly Move_In_Next_Month_Button: Locator;
    readonly Move_In_Prev_Month_Button: Locator;

    readonly Move_In_CON_ED_Questions_Title: Locator;

    readonly Move_In_BGE_Employment_Status_Title: Locator;
    readonly Move_In_BGE_Employment_Status_Dropdown: Locator;
    readonly Move_In_BGE_Employment_Selection: (selection: string) => Locator;
    
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
    readonly Move_In_Service_Fee_Message: Locator;
    
    readonly Move_In_Auto_Payment_Checbox: Locator;
    readonly Move_In_Submit_Button: Locator;
    readonly Move_In_Skip_Button: Locator;
    readonly Move_In_Success_Message: Locator;
    readonly Move_In_Account_Number: Locator;
    readonly Move_In_Account_Number_Value: Locator;
    readonly Move_In_Survey_Star: Locator;
    readonly Move_In_Survey_Submit_Button: Locator;
    readonly Move_In_Feedback_Thanks_Message: Locator;
    readonly Move_In_Dashboard_Link:Locator;

    readonly Move_In_New_Move_In_Request_Link: Locator;

  
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Move_In_Terms_Logo = page.locator('circle');
        this.Move_In_Terms_PG_Description = page.getByText('Public Grid is a free');
        this.Move_In_Terms_Service_Description = page.getByText('Service is started with your');
        this.Move_In_Terms_Payment_Description = page.getByText('You‘ll never pay more than if');
        this.Move_In_Terms_Automation_Description = page.getByText('You‘ll never pay more than if');
        
        
        this.Move_In_Terms_Checkbox = page.getByLabel('I agree to the Terms of');
        this.Move_In_Get_Started_Button = page.getByRole('button', { name: 'Get Started' });
        this.Move_In_Back_Link = page.getByText('Back');
        this.Move_In_Address_Page_Fields = page.getByRole('heading', { name: 'Where are you looking to' });
        this.Move_In_Address_Field = page.locator('#address');
        this.Move_In_Address_Dropdown = (address: string) => page.getByText(address);
        this.Move_In_Unit_Field = page.locator('input[name="unitNumber"]');

        this.Move_In_Account_Setup_Fields = page.getByRole('heading', { name: 'What can we set up for you' });
        this.Move_In_Electric_New_Button = page.locator('//label[@id = "Electric-new"]');
        this.Move_In_Electric_Existing_Button = page.locator('//label[@id = "Electric-existing"]');
        this.Move_In_Gas_New_Button = page.locator('//label[@id = "Gas-new"]');
        this.Move_In_Gas_Existing_Button = page.locator('//label[@id = "Gas-existing"]');

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
        this.Move_In_Email_Field = page.locator('input[name="email"]');
        this.Move_In_Email_Invalid_Message = page.getByText('Email address must be valid.');
        
        this.Move_In_Date_Field = page.getByRole('button', { name: 'Select a move-in date' });
        this.Move_In_Date_Selector = (day: string) => page.locator('//button[text()='+ day +'and not(@disabled) and not(contains(@class,"text-muted"))]');
        this.Move_In_Next_Month_Button = page.getByLabel('Go to next month');
        this.Move_In_Prev_Month_Button = page.getByLabel('Go to previous month');
        this.Move_In_Identity_Info_Title = page.getByRole('heading', { name: 'Identity Information' });

        this.Move_In_CON_ED_Questions_Title =  page.getByRole('heading', { name: 'A couple of quick questions' });

        this.Move_In_BGE_Employment_Status_Title = page.getByText('Employment Status');
        this.Move_In_BGE_Employment_Status_Dropdown = page.getByRole('combobox');
        this.Move_In_BGE_Employment_Selection = (selection: string) => page.locator(`//span[contains(text(),"${selection}")]`);

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
        this.Move_In_Skip_Button = page.getByRole('button', { name: 'Skip for now (and Submit)' });
        this.Move_In_Payment_Details_Title = page.locator('//h3[text()="Add Bill Payment Method"]');
        this.Move_In_Service_Fee_Message = page.getByText('Card payments will be charged');
        this.Move_In_Success_Message = page.getByText('Success🥳Your account is');
        this.Move_In_Account_Number = page.getByText('Account Number:');
        this.Move_In_Account_Number_Value = page.locator("//div[contains(@class,'callout-text')]//child::b");
        this.Move_In_Survey_Star = page.locator('path').nth(2);
        this.Move_In_Survey_Submit_Button = page.getByText('Tell us how your experience was so far!Submit');
        this.Move_In_Feedback_Thanks_Message = page.getByText('Thanks for the feedback 💚');
        this.Move_In_Dashboard_Link = page.getByRole('link', { name: 'Dashboard' });

        this.Move_In_New_Move_In_Request_Link = page.locator('//button[text() = "Start a new Move-in Request"]');
    }



    //methods
    async Agree_on_Terms_and_Get_Started() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.Move_In_Terms_Logo).toBeVisible({timeout:30000});
        await expect(this.Move_In_Terms_PG_Description).toBeVisible({timeout:30000});
        await expect(this.Move_In_Terms_Service_Description).toBeVisible({timeout:30000});
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
        await expect(this.Move_In_Address_Page_Fields).toBeVisible({timeout:30000});
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.click({timeout:10000});
        await this.Move_In_Address_Field.fill(address);
        await this.Move_In_Address_Dropdown(address)?.waitFor({state: 'visible', timeout: 30000});
        await this.Move_In_Address_Dropdown(address).click({timeout:10000});
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.fill(unit);
        await this.page.waitForTimeout(1000);
    }

    async Setup_Account(Electric_New: boolean, Gas_New: boolean){ 
        await expect(this.Move_In_Account_Setup_Fields).toBeVisible({timeout:30000});
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
    }


    async Enter_OTP(OTP:string){
        await this.Move_In_OTP_Field.click({timeout:10000});
        await this.Move_In_OTP_Field.fill(OTP);
    }


    async CON_ED_Questions(){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_CON_ED_Questions_Title).toBeVisible({timeout:30000});
        //Answering the questions randomly
    }

    async BGE_Questions(){
        const options = [
            'Employed more than 3 years',
            'Employed less than 3 years',
            'Retired',
            'Receives assistance',
            'Other'
          ];
        const randomIndex = Math.floor(Math.random() * options.length);
        const randomOption = options[randomIndex];
        console.log(randomOption);
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_BGE_Employment_Status_Title).toBeVisible({timeout:30000});
        await this.Move_In_BGE_Employment_Status_Dropdown.hover();
        await this.Move_In_BGE_Employment_Status_Dropdown.click();
        await this.Move_In_BGE_Employment_Selection(randomOption).click();
        return randomOption;
    }



    async Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        await this.Move_In_Birthdate_Field.fill(birthdate,{timeout:10000});
        await this.Move_In_ID_Number_Field.isEnabled({timeout:10000});
        await this.Move_In_ID_Number_Field.isEditable({timeout:10000});
        await this.Move_In_ID_Number_Field.fill(IDnumber);
    }


    async CON_ED_Enter_ID_Info(birthdate:string, IDnumber:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        await this.Move_In_Birthdate_Field.fill(birthdate,{timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.isEnabled({timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.isEditable({timeout:10000});
        await this.Move_In_CON_ED_ID_Number_Field.fill(IDnumber)
    }


    async Enter_ID_Info_Prev_Add(prevAddress:string){
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Prev_Address_Field.click();
        await this.page.waitForTimeout(500);
        await this.Move_In_Prev_Address_Field.fill(prevAddress);
        await this.Move_In_Address_Dropdown(prevAddress).click();
        await this.page.waitForTimeout(500);
        await this.Move_In_Identity_Info_Title.click();
    }

    async Check_Payment_Page_Visibility(){
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await this.page.waitForTimeout(5000);
        const isVisible = await this.Move_In_Payment_Details_Title.isVisible();
        console.log(isVisible);
        return isVisible;
    }

    async Enter_Payment_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        const maxRetries = 2;
        let attempt = 0;
        let success = false;
        
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});
        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:30000});

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

    async Enter_Valid_Bank_Details(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});
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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
        const DoneButton = await modalFrame?.waitForSelector('[data-testid ="done-button"]');
        await SuccessMessage?.waitForElementState('visible');
        await DoneButton?.click();
        await this.page.waitForTimeout(500);
    }

    async Enter_Invalid_Bank_Details(Email:string, FullName:string){
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});
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

        const SuccessMessage = await modalFrame?.waitForSelector('[class ="la-v3-successTextWrapper"]');
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
        await expect(this.Move_In_Skip_Button).toBeEnabled({timeout:30000});
        await this.Move_In_Skip_Button.hover();
        await this.Move_In_Skip_Button.click();
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


    async Check_Billing_Customer_Added_Payment_Overview_Redirect(){

        const [newPage] = await Promise.all([
            this.page.waitForEvent('popup'),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/.*\/app\/overview.*/, { timeout: 60000 });
        await expect(newPage.locator('//h3[contains(text(),"Getting Started")]/parent::div/parent::div')).toBeHidden({timeout:60000});
        await newPage.close(); //To be removed
    }


    async Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect(){
        
        const [newPage] = await Promise.all([
            this.page.waitForEvent('popup'),
        ]);

        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/.*\/app\/overview.*/, { timeout: 60000 });
        await expect(newPage.locator('//h3[contains(text(),"Getting Started")]/parent::div/parent::div')).toBeVisible({timeout:60000});
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