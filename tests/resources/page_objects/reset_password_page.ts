import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

/**
 * ResetPasswordPage — the /reset-password form a user lands on after
 * clicking a valid password-reset link. Also owns the /auth-code-error
 * page rendering check since that page is the failure terminus of the
 * same recovery flow.
 *
 * Main reset flow is currently blocked by ENG-2721 (TanStack /auth/confirm
 * 500s on valid recovery tokens), so this POM's submit path is exercised
 * via the forgot-password spec's .skip-ed test that unskips when the fix
 * lands.
 */
export class ResetPasswordPage {
    readonly page: Page;
    readonly heading: Locator;
    readonly newPasswordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly saveButton: Locator;
    // Auth-code-error page (error terminus of the same flow)
    readonly authCodeErrorText: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: /reset your password/i });
        this.newPasswordInput = page.locator('input[name="password"]');
        this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
        this.saveButton = page.getByRole('button', { name: /save new password/i });
        // "Authentication Error" + "link may have expired" both render on the
        // error page; .first() avoids strict-mode violations across the two.
        this.authCodeErrorText = page
            .getByText(/authentication error|link may have expired/i)
            .first();
    }

    async expectFormVisible(): Promise<void> {
        await expect(this.heading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }

    async submitNewPassword(password: string): Promise<void> {
        await this.newPasswordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
        await this.saveButton.click();
    }

    async expectAuthCodeError(): Promise<void> {
        await expect(this.authCodeErrorText).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    }
}

export default ResetPasswordPage;
