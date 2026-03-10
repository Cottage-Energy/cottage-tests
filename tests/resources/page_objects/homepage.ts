import { type Page, type Locator , expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

export class HomePage{
    //variables
    readonly page: Page;
    readonly Menu_Button: Locator;
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
        this.Menu_Button = page.getByText('Menu', { exact: true });
        this.About_Link = page.getByRole('link', { name: 'About', exact: true }).first();
        this.About_Content = page.getByText('Our Community', { exact: true }).first();
        this.Resources_Link = page.getByRole('link', { name: 'Resources', exact: true }).first();
        this.Resources_Title = page.getByRole('heading', { name: 'Resources' });
        this.Support_Link = page.getByRole('link', { name: 'Support', exact: true }).first();
        this.ForProperties_Link = page.getByRole('link', { name: 'For Properties', exact: true }).first();

        this.Sign_In_Button = page.getByRole('link', { name: 'Sign In', exact: true }).first();
        this.Sign_In_Title = page.getByText('Welcome back', { exact: false });
        this.Sign_In_Email_Field = page.locator('//input[@name="email"]');
        this.Sign_In_OTP_Button = page.getByRole('button', { name: 'Sign in with one-time code' });
    }



    //methods

    async openMenu(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        const isMenuVisible = await this.Menu_Button.isVisible().catch(() => false);
        if (isMenuVisible) {
            await this.Menu_Button.click({ timeout: TIMEOUTS.MEDIUM });
            await this.About_Link.waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
        }
    }

    async click_About(): Promise<void> {
        await this.openMenu();
        await this.About_Link.click();
        await this.page.waitForURL('**/about-us', { timeout: TIMEOUTS.DEFAULT });
        await expect(this.About_Content).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }

    async click_Resources(): Promise<void> {
        await this.openMenu();
        await this.Resources_Link.click();
        await this.page.waitForURL('**/resources', { timeout: TIMEOUTS.DEFAULT });
        await expect(this.Resources_Title).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }

    async click_Support(): Promise<void> {
        await this.openMenu();
        await this.Support_Link.click();
        await expect(this.page).toHaveURL(/support\.onepublicgrid\.com/, { timeout: TIMEOUTS.DEFAULT });
    }

    async click_ForProperties(): Promise<void> {
        await this.openMenu();
        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.ForProperties_Link.click(),
        ]);
        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/publicgrid\.property/);
        await newPage.close();
    }

    async click_SignIn(): Promise<void> {
        await this.openMenu();
        await this.Sign_In_Button.click({ timeout: TIMEOUTS.DEFAULT });
        await this.page.waitForURL('**/sign-in', { timeout: TIMEOUTS.DEFAULT });
        await expect(this.Sign_In_Title).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(this.Sign_In_Email_Field).toBeVisible();
        await expect(this.Sign_In_OTP_Button).toBeVisible({ timeout: TIMEOUTS.SHORT });
    }


}

export default HomePage
