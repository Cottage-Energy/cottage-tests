import { type Page, type Locator , expect } from '@playwright/test';

export class HomePage{
    //variables
    readonly page: Page;
    readonly About_Link: Locator;
    readonly About_Content: Locator;
    readonly Resources_Link: Locator;
    readonly Resources_Title: Locator;
    readonly Support_Link: Locator;
    readonly ForProperties_Link: Locator;
    
    readonly Sign_In_Button: Locator;
    readonly Sign_In_Title: Locator;
    readonly Sign_In_Email_Field: Locator;
    readonly Sign_In_OTP_Button: Locator;
    


    //constructor // locators
    constructor(page: Page) {
        this.page = page;
        this.About_Link = page.getByRole('link', { name: 'About', exact: true }).first();
        this.About_Content = page.getByText('Our Community', { exact: true }).first();
        this.Resources_Link = page.getByRole('link', { name: 'Resources', exact: true }).first();
        this.Resources_Title = page.getByText('RESOURCES');
        this.Support_Link = page.getByRole('link', { name: 'Support', exact: true }).first();
        this.ForProperties_Link = page.getByRole('link', { name: 'For Properties', exact: true }).first();
        
        this.Sign_In_Button = page.getByRole('link', { name: 'Sign In', exact: true }).first();
        this.Sign_In_Title = page.getByText('Welcome back', { exact: false });
        this.Sign_In_Email_Field = page.locator('//input[@name="email"]');
        this.Sign_In_OTP_Button = page.getByRole('button', { name: 'Sign in with one-time code' });
    }



    //methods

    async click_About() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.About_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.About_Content).toBeVisible({timeout:30000});
    }

    async click_Resources() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Resources_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Resources_Title).toBeVisible({timeout:30000});
    }

    async click_Support() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Support_Link.click();
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.page).toHaveURL(/support\.onepublicgrid\.com/, { timeout: 15000 });
    }

    async click_ForProperties() {
        await this.page.waitForLoadState('domcontentloaded');
        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.ForProperties_Link.click(),
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/publicgrid\.property/);
        await newPage.close();
    }

    async click_SignIn() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.Sign_In_Button.click({timeout: 30000});
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.Sign_In_Title).toBeVisible({timeout: 10000});
        await expect(this.Sign_In_Email_Field).toBeVisible();
        await expect(this.Sign_In_OTP_Button).toBeVisible({timeout: 5000});
    }


}

export default HomePage
