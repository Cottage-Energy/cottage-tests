import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * ForgotPasswordPage — owns /forgot-password + /auth/confirm redirect checks.
 *
 * Guards the password recovery flow entry point (the place an actual user
 * hits when they click "Forgot Password"). The reset-form itself is at
 * /reset-password and handled by ResetPasswordPage if/when the full flow
 * is unskipped (blocked by ENG-2721).
 */
export class ForgotPasswordPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly resetPasswordButton: Locator;
    readonly backToLoginLink: Locator;
    readonly emailRequiredError: Locator;
    readonly invalidEmailError: Locator;
    readonly noInfoLeakErrors: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByRole('textbox', { name: /email/i });
        this.resetPasswordButton = page.getByRole('button', { name: 'Reset password' });
        this.backToLoginLink = page.getByRole('link', { name: /Back to Login/i });
        this.emailRequiredError = page.getByText('Email is required');
        this.invalidEmailError = page.getByText('Must be a valid email').first();
        // Privacy-protection guard: these phrases must NEVER appear on this page
        // otherwise we'd be leaking whether an account exists.
        this.noInfoLeakErrors = page.getByText(/no account|not found|does not exist/i);
    }

    async navigate(): Promise<void> {
        await this.page.goto('/forgot-password');
        await expect(this.emailInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }

    async fillEmail(email: string): Promise<void> {
        await this.emailInput.fill(email);
        await expect(this.emailInput).toHaveValue(email);
    }

    async clickResetPassword(): Promise<void> {
        await this.resetPasswordButton.click();
    }

    /**
     * Submit the form and wait for the Supabase recover call to complete.
     * Returns the response status. Use this for network-based assertions
     * — the toast auto-dismisses in ~3s and is unreliable to assert on.
     */
    async submitAndAwaitRecoverCall(): Promise<number> {
        const [response] = await Promise.all([
            this.page.waitForResponse(
                r => r.url().includes('/auth/v1/recover') || r.url().includes('forgot-password'),
                { timeout: TIMEOUTS.MEDIUM },
            ),
            this.resetPasswordButton.click(),
        ]);
        return response.status();
    }

    /**
     * Submit the form and watch for recover API calls. Returns whether any
     * fired. Use this to verify validation blocks submit (no API call should
     * fire on empty / malformed input).
     */
    async submitAndDetectRecoverCall(waitMs: number = 2000): Promise<boolean> {
        let recoverFired = false;
        const handler = (req: { url(): string }) => {
            if (req.url().includes('/auth/v1/recover')) recoverFired = true;
        };
        this.page.on('request', handler);
        try {
            await this.resetPasswordButton.click();
            await this.page.waitForTimeout(waitMs);
        } finally {
            this.page.off('request', handler);
        }
        return recoverFired;
    }

    /**
     * Hit /auth/confirm directly with an arbitrary token_hash. Used by the
     * spec to assert the error branch redirects cleanly (doesn't 500). This
     * is the counterpart to the main success-flow path currently broken by
     * ENG-2721.
     */
    async visitAuthConfirm(
        tokenHash: string,
        type: 'recovery' | 'signup' | 'email' = 'recovery',
        next: string = '/reset-password',
    ): Promise<number> {
        const response = await this.page.goto(
            `/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${next}`,
        );
        return response?.status() ?? 0;
    }
}

export default ForgotPasswordPage;
