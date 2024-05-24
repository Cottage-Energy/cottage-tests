import { type Page, type Locator , expect } from '@playwright/test';

export class HomePage{
    //variables
    readonly page: Page;
    readonly HowItWorks_Link: Locator;
    readonly HowItWorks_Title: Locator;
    readonly About_Link: Locator;
    readonly About_Content: Locator;
    readonly Resources_Link: Locator;
    readonly Resources_Title: Locator;
    readonly Developers_Link: Locator;
    readonly Developers_Title: Locator;
    
    readonly Sign_In_Button: Locator;
    readonly Sign_In_Title: Locator;
    readonly Sign_In_Email_Field: Locator;
    readonly Sign_In_OTP_Button: Locator;
    


    //constructor // locators
    constructor(page: Page) {
        this.HowItWorks_Link = page.getByRole('navigation').getByRole('link', { name: 'How it Works' });
        this.HowItWorks_Title = page.getByRole('heading', { name: 'How it works' });
        this.About_Link = page.getByRole('navigation').getByRole('link', { name: 'About' });
        this.About_Content = page.getByText('Climate change is not new news.There is a whole list of things that we all');
        this.Resources_Link = page.getByRole('navigation').getByRole('link', { name: 'Resources' });
        this.Resources_Title =  page.getByRole('heading', { name: 'Resources' });
        this.Developers_Link = page.getByRole('navigation').getByRole('link', { name: 'Developers' });
        this.Developers_Title = page.getByRole('heading', { name: 'BUILD WITH YOURELECTRIC DATA' });
        
        this.Sign_In_Button = page.getByText('Sign In');
        this.Sign_In_Title = page.getByRole('heading', { name: 'Welcome Back 👋' });
        this.Sign_In_Email_Field = page.locator('[id="\\:Rd9uufhra\\:-form-item"]');
        this.Sign_In_OTP_Button = page.getByRole('button', { name: 'Sign in with OTP' });
    }



    //methods

    async click_HowItWorks() {
        await this.HowItWorks_Link.click();
        await expect (this.HowItWorks_Title).toBeVisible();
    }


    async  click_About() {
        await this.About_Link.click();
        await expect (this.About_Content).toBeVisible();
    }

    async click_Resources() {
        await this.Resources_Link.click();
        await expect (this.Resources_Title).toBeVisible();
    }

    async click_Developers() {
        await this.Developers_Link.click();
        await expect (this.Developers_Title).toBeVisible();
    }

    async click_SignIn() {
        await this.Sign_In_Button.click();
        await expect (this.Sign_In_Title).toBeVisible();
        await expect (this.Sign_In_Email_Field).toBeVisible();
        await expect (this.Sign_In_OTP_Button).toBeVisible();
    }


}

export default HomePage