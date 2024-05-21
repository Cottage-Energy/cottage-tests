import { type Page, type Locator , expect } from '@playwright/test';

export class MoveInPage{
    //variables
    readonly page: Page;
    readonly Move_In_Terms_Title: Locator;
    readonly Move_In_Terms_Checkbox: Locator;
    readonly Move_In_Get_Started_Button: Locator;
    readonly Move_In_Address_Title: Locator;
    readonly Move_In_Back_Link: Locator;
    readonly Move_In_Address_Field: Locator;
    readonly Move_In_Address_Dropdown: (address: string) => Locator;
    readonly Move_In_Unit_Field: Locator;
    readonly Move_In_Next_Button: Locator;
    readonly Move_In_Cannot_Find_Address_Link: Locator;
    readonly Move_In_Address_Not_Listed_Message: Locator;
    readonly Move_In_About_You_Tite: Locator;
    readonly Move_In_First_Name_Field: Locator;
    readonly Move_In_Last_Name_Field: Locator;
    readonly Move_In_First_Name_Null_Message: Locator;
    readonly Move_In_Last_Name_Null_Message: Locator;
    readonly Move_In_Phone_Field: Locator;
    readonly Move_In_Phone_Invalid_Message: Locator;
    readonly Move_In_Email_Field: Locator;
    readonly Move_In_Email_Invalid_Message: Locator;
    readonly Move_In_Date_Title: Locator
    readonly Move_In_Date_Field: Locator;
    readonly Move_In_Date_Selector: (day: string) => Locator;
    readonly Move_In_Identity_Info_Title: Locator;
    readonly Move_In_Birthdate_Field: Locator;
  
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Move_In_Terms_Title = page.getByRole('heading', { name: 'Hi 👋 Time to setup' });
        this.Move_In_Terms_Checkbox = page.getByLabel('I agree to the Terms of');
        this.Move_In_Get_Started_Button = page.getByRole('button', { name: 'Get Started' });
        this.Move_In_Back_Link = page.getByText('Back');
        this.Move_In_Address_Title = page.getByRole('heading', { name: 'Where do you live?' });
        this.Move_In_Address_Field = page.locator('#address');
        this.Move_In_Address_Dropdown = (address: string) => page.getByText('${address}');
        this.Move_In_Unit_Field = page.locator('input[name="unitNumber"]');
        this.Move_In_Next_Button = page.getByRole('button', { name: 'Next' });
        this.Move_In_Cannot_Find_Address_Link = page.getByRole('button', { name: 'I cannot find my address' });
        this.Move_In_Address_Not_Listed_Message = page.getByRole('heading', { name: 'Address not listed in the' });
        this.Move_In_About_You_Tite = page.getByRole('heading', { name: 'About You' });
        this.Move_In_First_Name_Field = page.locator('input[name="firstName"]');
        this.Move_In_Last_Name_Field = page.locator('input[name="lastName"]');
        this.Move_In_First_Name_Null_Message = page.locator('[id="\\:r5\\:-form-item-message"]');
        this.Move_In_Last_Name_Null_Message = page.locator('[id="\\:r6\\:-form-item-message"]');
        this.Move_In_Phone_Field = page.locator('input[name="phone"]');
        this.Move_In_Phone_Invalid_Message = page.getByText('Phone number must be in 000-');
        this.Move_In_Email_Field = page.locator('input[name="email"]');
        this.Move_In_Email_Invalid_Message = page.getByText('Email address must be valid.');
        this.Move_In_Date_Title = page.getByRole('heading', { name: 'When do you move in?' });
        this.Move_In_Date_Field = page.getByRole('button', { name: 'Select a move-in date' });
        this.Move_In_Date_Selector = (day: string) => page.getByText('${day}', { exact: true });
        this.Move_In_Identity_Info_Title = page.getByRole('heading', { name: 'Identity Information' });
        this.Move_In_Birthdate_Field = page.getByLabel('Date of Birth');


    }



    //methods


}

export default MoveInPage