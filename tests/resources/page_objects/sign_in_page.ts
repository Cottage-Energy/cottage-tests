import { type Page, type Locator , expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

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
    // Password sign-in (preferred over the ID-based email field which may
    // not render with that exact form-item id on every environment).
    readonly Sign_In_Email_By_Role: Locator;
    readonly Sign_In_Password_Field: Locator;
    readonly Sign_In_Submit_Button: Locator;
    readonly Sign_In_Invalid_Creds_Error: Locator;



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
        this.Sign_In_Email_By_Role = page.getByRole('textbox', { name: /email/i });
        this.Sign_In_Password_Field = page.locator('input[type="password"]');
        this.Sign_In_Submit_Button = page.getByRole('button', { name: /sign in/i });
        // Matches "Invalid credentials", "Incorrect email or password", etc.
        // .first() satisfies strict mode when the text appears in both the
        // form-level error AND a screen-reader live region.
        this.Sign_In_Invalid_Creds_Error = page.getByText(/invalid|incorrect/i).first();
    }



    //methods

    /**
     * Navigate to /sign-in (clearing any existing session cookies first so
     * middleware redirects don't bounce an already-authenticated user back
     * to /app/overview).
     */
    async Navigate_For_Fresh_Sign_In(): Promise<void> {
        await this.page.context().clearCookies();
        await this.page.goto('/sign-in');
    }

    /**
     * Perform a password sign-in. Returns after the submit click — callers
     * assert the post-sign-in state (either URL change to /app or /portal
     * for success, or Sign_In_Invalid_Creds_Error for failure).
     */
    async Sign_In_With_Password(email: string, password: string): Promise<void> {
        await this.Sign_In_Email_By_Role.fill(email);
        await this.Sign_In_Password_Field.fill(password);
        await this.Sign_In_Submit_Button.click();
    }

    async Expect_Invalid_Credentials(): Promise<void> {
        await expect(this.Sign_In_Invalid_Creds_Error)
            .toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }


}

export default SignInPage
