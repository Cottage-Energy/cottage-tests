import { type Page, type Locator , expect } from '@playwright/test';

export class SignInPage{
    //variables
    readonly page: Page;
    readonly Sign_In_PG_Logo: Locator;
    readonly Sign_In_Title: Locator;
    readonly Sign_In_Email_Field: Locator;
    readonly Sign_In_OTP_Button: Locator;
    readonly Sign_In_Sign_Up_Link: Locator;
    readonly Sign_In_Check_Email: Locator;
    readonly Sign_In_OTP_Field: Locator;
    readonly Sign_In_Verify_OTP_Button: Locator;
    readonly Sign_In_Request_New_OTP: Locator;
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.Sign_In_PG_Logo = page.getByRole('link').first();
        this.Sign_In_Title = page.getByRole('heading', { name: 'Welcome Back 👋' });
        this.Sign_In_Email_Field = page.locator('[id="\\:Rd9uufhra\\:-form-item"]');
        this.Sign_In_OTP_Button = page.getByRole('button', { name: 'Sign in with OTP' });
        this.Sign_In_Sign_Up_Link = page.getByRole('link', { name: 'Sign-up' });
        this.Sign_In_Check_Email = page.getByText('Check your email 📧')
        this.Sign_In_OTP_Field = page.getByRole('textbox');
        this.Sign_In_Verify_OTP_Button = page.getByRole('button', { name: 'Verify OTP' });
        this.Sign_In_Request_New_OTP = page.getByText('Request a new OTP');
    }



    //methods


}

export default SignInPage
