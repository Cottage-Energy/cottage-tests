import { type Page, type Locator, expect } from '@playwright/test';

export class MoveInPage{
    //variables
    readonly page: Page;
    readonly Move_In_Terms_and_Address_Fields: Locator;
    readonly Move_In_Terms_Checkbox: Locator;
    readonly Move_In_Get_Started_Button: Locator;
 
    readonly Move_In_Back_Link: Locator;
    readonly Move_In_Address_Field: Locator;
    readonly Move_In_Address_Dropdown: (address: string) => Locator;
    readonly Move_In_Unit_Field: Locator;
    readonly Move_In_Next_Button: Locator;
    readonly Move_In_Cannot_Find_Address_Link: Locator;
    readonly Move_In_Address_Not_Listed_Message: Locator;

    readonly Move_In_About_You_Fields: Locator;
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

    readonly Move_In_CON_ED_Questions_Fields: Locator;
    readonly Move_In_CON_ED_Questions_Title: Locator;
    
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
    
    
    readonly Move_In_Submit_Button: Locator;
    readonly Move_In_Skip_Button: Locator;
    readonly Move_In_Success_Message: Locator;
    readonly Move_In_Account_Number: Locator;
    readonly Move_In_Account_Number_Value: Locator;
    readonly Move_In_Survey_Star: Locator;
    readonly Move_In_Survey_Submit_Button: Locator;
    readonly Move_In_Feedback_Thanks_Message: Locator;
    readonly Move_In_Dashboard_Link:Locator;

  
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Move_In_Terms_and_Address_Fields = page.getByRole('heading', { name: 'Hi 👋' });
        this.Move_In_Terms_Checkbox = page.getByLabel('I agree to the Terms of');
        this.Move_In_Get_Started_Button = page.getByRole('button', { name: 'Get Started' });
        this.Move_In_Back_Link = page.getByText('Back');
        
        this.Move_In_Address_Field = page.locator('#address');
        this.Move_In_Address_Dropdown = (address: string) => page.getByText(address);
        this.Move_In_Unit_Field = page.locator('input[name="unitNumber"]');
        this.Move_In_Next_Button = page.getByRole('button', { name: 'Next', exact: true });
        this.Move_In_Cannot_Find_Address_Link = page.getByRole('button', { name: 'I cannot find my address' });
        this.Move_In_Address_Not_Listed_Message = page.getByRole('heading', { name: 'Address not listed in the' });


        this.Move_In_About_You_Fields = page.getByText('Tell us a little about youFirst NameLast NameEmailPhoneMove-in DateSelect a');
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

        this.Move_In_CON_ED_Questions_Fields = page.getByText('A couple of quick questionsDoes anyone in your household use life-support');
        this.Move_In_CON_ED_Questions_Title =  page.getByRole('heading', { name: 'A couple of quick questions' });

        this.Move_In_Birthdate_Field = page.locator('input[name="dateOfBirth"]');
        this.Move_In_Birthdate_Required_Message = page.getByText('Date of Birth Required');
        this.Move_In_Birthdate_Mustbe18_Message = page.getByText('Must be 18 years or older');
        this.Move_In_Birthdate_Lessthan100_Message = page.getByText('Must be less than 100 years');
        this.Move_In_ID_Dropdown = page.getByText('Must be 18 years or older');
        this.Move_In_State_Dropdown = page.getByText('Select State');
        this.Move_In_ID_Number_Field = page.locator('[id="\\:ra\\:-form-item"]');
        this.Move_In_CON_ED_ID_Number_Field = page.locator('[id="\\:re\\:-form-item"]');
        this.Move_In_Identify_Info_Message = page.getByText('This information is never');
        this.Move_In_Prev_Address_Field = page.locator('#onboardingAddress')

        this.Move_In_Submit_Button = page.getByRole('button', { name: 'Submit', exact: true });
        this.Move_In_Skip_Button = page.getByRole('button', { name: 'Skip for now (and Submit)' });
        this.Move_In_Payment_Details_Title = page.getByRole('heading', { name: 'Add Bill Payment Method' });
        this.Move_In_Service_Fee_Message = page.getByText('Card payments will be charged');
        this.Move_In_Success_Message = page.getByText('Success🥳Your account is set');
        this.Move_In_Account_Number = page.getByText('Account Number:');
        this.Move_In_Account_Number_Value = page.locator("//div[contains(@class,'callout-text')]//child::b");
        this.Move_In_Survey_Star = page.locator('path').nth(2);
        this.Move_In_Survey_Submit_Button = page.getByText('Tell us how your experience was so far!Submit');
        this.Move_In_Feedback_Thanks_Message = page.getByText('Thanks for the feedback 💚');
        this.Move_In_Dashboard_Link = page.getByRole('link', { name: 'Dashboard' });
    }



    //methods
    async Enter_Address_Agree_on_Terms_and_Get_Started(address:string, unit:string) {
        await expect(this.Move_In_Terms_and_Address_Fields).toBeVisible({timeout:30000});
        await this.page.waitForTimeout(1000);
        await this.Move_In_Address_Field.click({timeout:10000});
        await this.page.waitForTimeout(500);
        await this.Move_In_Address_Field.fill(address);
        await this.Move_In_Address_Dropdown(address).click();
        await this.Move_In_Unit_Field.click();
        await this.Move_In_Unit_Field.fill(unit);
        await this.Move_In_Terms_Checkbox.hover({timeout:30000});
        await this.Move_In_Terms_Checkbox.isEnabled({timeout:10000});
        await this.Move_In_Terms_Checkbox.setChecked(true,{timeout:10000});
        await this.Move_In_Get_Started_Button.hover({timeout:30000});
        await this.Move_In_Get_Started_Button.isEnabled({timeout:10000});
        await this.Move_In_Get_Started_Button.click();
    }

    async Next_Move_In_Button(){
        await expect(this.Move_In_Next_Button).toBeEnabled({timeout:10000});
        await this.Move_In_Next_Button.hover({timeout:10000});
        await this.Move_In_Next_Button.click({timeout:10000});
    }


    async Enter_Personal_Info(firstname:string, lastname:string, phone:string, email:string, day:string){
        await expect(this.Move_In_About_You_Fields).toBeVisible({timeout:30000});
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


    async CON_ED_Questions(){
        await expect(this.Move_In_CON_ED_Questions_Fields).toBeVisible({timeout:30000});
        await expect(this.Move_In_CON_ED_Questions_Title).toBeVisible({timeout:30000});
        //Answering the questions randomly
    }



    async Enter_ID_Info(birthdate:string, IDnumber:string){
        await expect(this.Move_In_Identity_Info_Title).toBeVisible({timeout:30000});
        await this.Move_In_Birthdate_Field.click({timeout:10000});
        await this.Move_In_Birthdate_Field.fill(birthdate,{timeout:10000});
        await this.Move_In_ID_Number_Field.isEnabled({timeout:10000});
        await this.Move_In_ID_Number_Field.isEditable({timeout:10000});
        await this.Move_In_ID_Number_Field.fill(IDnumber);
    }


    async CON_ED_Enter_ID_Info(birthdate:string, IDnumber:string){
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


    async Enter_Payment_Details(CCnumber:string, CCexpiry:string, CCcvc:string, CCcountry:string, CCzip:string){
        await expect(this.Move_In_Payment_Details_Title).toBeVisible({timeout:30000});
        await expect(this.Move_In_Service_Fee_Message).toBeVisible({timeout:30000});

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
    }

    
    async Confirm_Payment_Details(){
        await expect(this.Move_In_Submit_Button).toBeEnabled({timeout:10000});
        await this.Move_In_Submit_Button.hover();
        await this.Move_In_Submit_Button.click();
    }

    async Skip_Payment_Details(){
        await expect(this.Move_In_Skip_Button).toBeEnabled({timeout:10000});
        await this.Move_In_Skip_Button.hover();
        await this.Move_In_Skip_Button.click();
    }

    async Click_Dashboard_Link(){
        await expect(this.Move_In_Dashboard_Link).toBeEnabled({timeout:10000});
        await this.Move_In_Dashboard_Link.hover();
        await this.Move_In_Dashboard_Link.click();
    }


    //page assertions
    async Check_Successful_Move_In_Billing_Customer(){
        await expect(this.Move_In_Success_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Account_Number).toBeVisible({timeout:60000});
        await expect(this.Move_In_Dashboard_Link).toBeVisible();
    }

    async Check_Billing_Customer_Added_Payment_Overview_Redirect(){
        await expect(this.page).toHaveURL("https://dev.publicgrid.energy/app/overview",{timeout:60000});
    }

    async Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect(){
        await expect(this.page).toHaveURL("https://dev.publicgrid.energy/app/finish-account-setup",{timeout:60000});
    }


    
    async Check_Successful_Move_In_Non_Billing_Customer(){
        await expect(this.Move_In_Success_Message).toBeVisible({timeout:60000});
        await expect(this.Move_In_Account_Number).toBeVisible({timeout:60000});
        await expect(this.Move_In_Dashboard_Link).toBeHidden({timeout:60000});
    }



        
}

export default MoveInPage