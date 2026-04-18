import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS, RETRY_CONFIG } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { FastmailClient } from '../../resources/utils/fastmail/client';
import { executeSQL } from '../../resources/utils/postgres';
import axios from 'axios';

const log = createLogger('ForgotPassword');
const fastmail = new FastmailClient();

/**
 * Forgot Password Regression
 *
 * Guards the full password recovery flow end-to-end. Added after ENG-2721
 * exposed that "reset email received" was being treated as PASS across
 * Apr 14/15 retests, hiding a CRITICAL bug where /auth/confirm 500s on
 * valid recovery tokens (plain Response.redirect drops Supabase session
 * cookies on TanStack).
 *
 * Checks evidence-of-effect, not evidence-of-artifact:
 *   1. Submit email on /forgot-password  -> privacy-friendly toast
 *   2. Reset email delivered             -> Fastmail JMAP fetch
 *   3. Click reset link                  -> redirect to /reset-password
 *                                           (NOT a 500 HTTPError page)
 *   4. Submit new password               -> success + redirect
 *   5. Sign in with the new password     -> works
 *   6. Old password rejected             -> fails with invalid-credentials
 *   7. Reset link is single-use          -> 2nd click -> auth-code-error
 */

const RESET_USER_ID = '6535f3cb-918f-40b6-b183-aa8d6b668ae0'; // pgtest+tsk-pay-001
const RESET_USER_EMAIL = 'pgtest+tsk-pay-001@joinpublicgrid.com';
const SUPABASE_PROJECT_URL = 'https://wzlacfmshqvjhjczytan.supabase.co';

async function setSupabasePassword(userId: string, password: string): Promise<void> {
    const apiKey = process.env.SUPABASE_API_KEY;
    if (!apiKey) throw new Error('SUPABASE_API_KEY missing');
    const res = await axios.put(
        `${SUPABASE_PROJECT_URL}/auth/v1/admin/users/${userId}`,
        { password },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                apikey: apiKey,
                'Content-Type': 'application/json',
            },
        },
    );
    if (res.status !== 200) throw new Error(`Password reset failed: ${res.status}`);
}

async function extractResetLink(email: string): Promise<string> {
    for (let attempt = 0; attempt < RETRY_CONFIG.EMAIL_CONFIRMATION.maxRetries; attempt++) {
        const emails = await fastmail.fetchEmails({
            to: email,
            subject: 'Reset Your Password',
            from: 'Public Grid Team <support@onepublicgrid.com>',
        });
        if (emails && emails.length > 0) {
            const firstKey = Object.keys(emails[0].bodyValues)[0];
            const html = emails[0].bodyValues[firstKey].value;
            const match = html.match(/href="([^"]+CL0[^"]+confirm[^"]+)"/);
            if (match) return match[1];
        }
        await new Promise(r => setTimeout(r, RETRY_CONFIG.EMAIL_CONFIRMATION.delayMs));
    }
    throw new Error('Reset email not received');
}

test.describe('Forgot Password - full recovery flow', () => {
    // serial because multiple tests hit /forgot-password and hammering it
    // in parallel produced flaky validation results — the form occasionally
    // didn't react to submit clicks.
    test.describe.configure({ timeout: TIMEOUTS.TEST_UI, retries: 0, mode: 'serial' });

    // NOTE: Currently skipped because ENG-2721 is open (TanStack /auth/confirm
    // 500s on valid recovery tokens). Remove .skip once ENG-2721 fix lands on
    // tanstack-dev.
    test.skip('Full reset: request -> email -> click link -> new password -> sign in', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.SMOKE],
    }, async ({ page, forgotPasswordPage, resetPasswordPage, signInPage }) => {
        const oldPassword = `Old#${Date.now()}`;
        const newPassword = `New#${Date.now()}`;

        log.section('Setup baseline password via Supabase admin');
        await setSupabasePassword(RESET_USER_ID, oldPassword);

        log.section('Step 1 — Submit email on /forgot-password');
        await forgotPasswordPage.navigate();
        await forgotPasswordPage.fillEmail(RESET_USER_EMAIL);
        await forgotPasswordPage.clickResetPassword();

        log.section('Step 2 — Fetch reset email + extract link');
        const resetLink = await extractResetLink(RESET_USER_EMAIL);
        expect(resetLink).toContain('confirm');

        log.section('Step 3 — Click reset link (must NOT 500)');
        const response = await page.goto(resetLink);
        expect(response?.status()).not.toBe(500);
        await expect(page).toHaveURL(/\/reset-password/);
        await resetPasswordPage.expectFormVisible();

        log.section('Step 4 — Fill new password + submit');
        await resetPasswordPage.submitNewPassword(newPassword);

        log.section('Step 5 — Sign in with the NEW password');
        await signInPage.Navigate_For_Fresh_Sign_In();
        await signInPage.Sign_In_With_Password(RESET_USER_EMAIL, newPassword);
        await page.waitForURL(/\/(app|portal)\//, { timeout: TIMEOUTS.LONG });

        log.section('Step 6 — Old password should be rejected');
        await signInPage.Navigate_For_Fresh_Sign_In();
        await signInPage.Sign_In_With_Password(RESET_USER_EMAIL, oldPassword);
        await signInPage.Expect_Invalid_Credentials();

        log.section('Step 7 — Reset link should be single-use');
        const secondResponse = await page.goto(resetLink);
        expect(secondResponse?.status()).not.toBe(500);
        await expect(page).toHaveURL(/auth-code-error|sign-in/);
    });

    test('Unknown email triggers Supabase recover call (no info leak)', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async ({ page, forgotPasswordPage }) => {
        await forgotPasswordPage.navigate();
        await forgotPasswordPage.fillEmail('nobody+definitely-fake-user-2026@joinpublicgrid.com');

        // Wait for the Supabase recover API call rather than the toast — the
        // toast auto-dismisses in ~3-4s and is unreliable as an assertion
        // target. The API behavior is the actual privacy guarantee: same
        // response shape for known and unknown emails.
        const status = await forgotPasswordPage.submitAndAwaitRecoverCall();
        expect(status).toBeGreaterThanOrEqual(200);
        expect(status).toBeLessThan(400);

        // Stayed on /forgot-password — didn't error out
        await expect(page).toHaveURL(/forgot-password/);
        // Must NOT reveal whether the account exists (info-leak protection)
        await expect(forgotPasswordPage.noInfoLeakErrors).not.toBeVisible();
    });

    test('Empty email submission does not call the recover API', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async ({ page, forgotPasswordPage }) => {
        await forgotPasswordPage.navigate();
        const recoverFired = await forgotPasswordPage.submitAndDetectRecoverCall();

        expect(recoverFired).toBe(false);
        // And stayed on /forgot-password
        await expect(page).toHaveURL(/forgot-password/);
    });

    test('Invalid email format does not call the recover API', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async ({ page, forgotPasswordPage }) => {
        await forgotPasswordPage.navigate();
        await forgotPasswordPage.fillEmail('notanemail');
        const recoverFired = await forgotPasswordPage.submitAndDetectRecoverCall();

        expect(recoverFired).toBe(false);
        await expect(page).toHaveURL(/forgot-password/);
    });

    test('Invalid /auth/confirm token redirects to auth-code-error (not 500)', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async ({ page, forgotPasswordPage, resetPasswordPage }) => {
        const bogusToken = 'pkce_invalid0000000000000000000000000000000000000000000000000000';
        const status = await forgotPasswordPage.visitAuthConfirm(bogusToken);
        // This is the branch that already works today. Must not regress to 500.
        expect(status).not.toBe(500);
        await expect(page).toHaveURL(/auth-code-error/);
        await resetPasswordPage.expectAuthCodeError();
    });
});

// DB-level invariant: Supabase user row still exists after reset flow runs
test.describe('Forgot Password - DB invariants', () => {
    test.describe.configure({ timeout: TIMEOUTS.TEST_UI, retries: 0 });

    test('Reset user row exists in auth.users', {
        tag: [TEST_TAGS.REGRESSION1],
    }, async () => {
        const rows = await executeSQL<{ email: string; id: string }>(
            `SELECT id, email FROM auth.users WHERE id = '${RESET_USER_ID}'`,
        );
        expect(rows.length).toBe(1);
        expect(rows[0].email).toBe(RESET_USER_EMAIL);
    });
});
