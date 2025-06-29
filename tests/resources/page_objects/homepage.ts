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
        this.page = page;
        this.HowItWorks_Link = page.getByRole('navigation').getByRole('link', { name: 'How it Works' });
        this.HowItWorks_Title = page.getByRole('heading', { name: 'How it works' });
        this.About_Link = page.getByRole('navigation').getByRole('link', { name: 'About' });
        this.About_Content = page.locator('div').filter({ hasText: 'Climate change is not new news.There is a whole list of things that we all' }).nth(2);
        this.Resources_Link = page.getByRole('navigation').getByRole('link', { name: 'Resources' });
        this.Resources_Title =  page.getByRole('heading', { name: 'Resources' });
        this.Developers_Link = page.getByRole('navigation').getByRole('link', { name: 'Developers' });
        this.Developers_Title = page.getByText('BETABUILD WITH YOURELECTRIC');
        
        this.Sign_In_Button = page.getByRole('navigation').getByText('Sign In');
        this.Sign_In_Title = page.getByRole('heading', { name: 'Welcome Back 👋' });
        this.Sign_In_Email_Field = page.locator('//input[@name="email"]');
        this.Sign_In_OTP_Button = page.getByRole('button', { name: 'Sign in with OTP' });
    }



    //methods

    async click_HowItWorks() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.HowItWorks_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect (this.HowItWorks_Title).toBeVisible();
    }


    async  click_About() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.About_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect (this.About_Content).toBeVisible({timeout:30000});
        }
        catch (error) {
            console.log('Error while waiting for About Content to be visible:', error);
        }
    }

    async click_Resources() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Resources_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect (this.Resources_Title).toBeVisible();
    }

    async click_Developers() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Developers_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect (this.Developers_Title).toBeVisible();
    }

    async click_SignIn() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Sign_In_Button.click({timeout: 30000});
        await this.page.waitForLoadState('domcontentloaded');
        try{
            await expect.soft(this.Sign_In_Title).toBeVisible({timeout: 5000});
            await expect.soft(this.Sign_In_Email_Field).toBeVisible();
            await expect (this.Sign_In_OTP_Button).toBeVisible({timeout: 5000});
        }
        catch (error) {
            console.log('Error while waiting for Sign In elements to be visible:', error);
        }
        
    }


}

export default HomePage