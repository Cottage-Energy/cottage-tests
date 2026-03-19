import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { FastmailClient } from '../utils/fastmail/client';
import type { Email } from '../utils/fastmail/types';
import { TIMEOUTS, RETRY_CONFIG } from '../constants';
import { createLogger } from '../utils/logger';

const log = createLogger('OTPSignIn');
const fastmail = new FastmailClient();
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch the latest OTP for a given email address.
 * Handles multiple OTP emails from prior sessions (takes the most recent).
 * Unlike FastmailActions.Get_OTP, this does NOT assert exactly 1 email.
 */
export async function getLatestOTP(email: string): Promise<string> {
    const emailLower = email.toLowerCase();
    let content: Email[] = [];

    for (let attempt = 0; attempt < RETRY_CONFIG.OTP.maxRetries; attempt++) {
        content = await fastmail.fetchEmails({
            to: emailLower,
            subject: 'Public Grid: One Time Passcode',
            from: 'Public Grid Team <support@onepublicgrid.com>',
        });
        if (content && content.length > 0) break;
        log.info(`OTP email not found yet, attempt ${attempt + 1}`);
        await delay(RETRY_CONFIG.OTP.delayMs);
    }

    if (!content || content.length === 0) {
        throw new Error(`Failed to fetch OTP email for ${email} after ${RETRY_CONFIG.OTP.maxRetries} attempts`);
    }

    // Use the first result (most recent due to sort by receivedAt desc)
    const emailBody = content[0].bodyValues;
    for (const key of Object.keys(emailBody)) {
        // Try new email template: "This is your login code:" with code in a separate styled <p>
        const newMatch = emailBody[key].value.match(/login code[:\s]*<\/p>[\s\S]*?<p[^>]*>\s*(\d{6})\s*<\/p>/i);
        if (newMatch) return newMatch[1];
        // Fallback: old email template with inline code
        const oldMatch = emailBody[key].value.match(/<p>Enter this code to login: (\d+)<\/p>/);
        if (oldMatch) return oldMatch[1];
    }
    throw new Error(`OTP code not found in email body for ${email}`);
}

/**
 * Sign in to the app using OTP authentication.
 * Navigates to /sign-in, requests OTP, fetches from Fastmail, and completes sign-in.
 */
export async function signInWithOTP(page: Page, email: string): Promise<void> {
    log.info('Signing in with OTP', { email });

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');

    // Switch to OTP mode
    const otpModeButton = page.getByRole('button', { name: 'Sign in with one-time code' });
    await expect(otpModeButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await otpModeButton.click();

    // Fill email and request OTP
    const emailInput = page.getByRole('textbox');
    await emailInput.fill(email);
    const signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInButton.click();

    // Wait for OTP input to appear
    await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
    const otpInput = page.getByRole('textbox');
    await expect(otpInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

    // Fetch OTP from Fastmail
    const otp = await getLatestOTP(email);
    log.info('OTP retrieved, entering code');
    await otpInput.fill(otp);

    const verifyButton = page.getByRole('button', { name: 'Verify OTP' });
    await verifyButton.click();

    // Wait for redirect — goes through /session-init before landing on /app/*
    await page.waitForURL(/\/app\/(overview|summary)/, { timeout: TIMEOUTS.LONG, waitUntil: 'domcontentloaded' });
    log.info('Sign-in complete');
}

/**
 * Complete the password setup dialog if present after sign-in/registration.
 * Follows the move-in pattern: fills password fields and submits.
 */
export async function dismissPasswordResetIfPresent(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const setupTitle = page.getByText(/Set up your new password|Set Up Your Password/i);
    const isVisible = await setupTitle.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
    if (isVisible) {
        const passwordField = page.locator('input[name="password"]');
        const confirmField = page.locator('input[name="confirmPassword"]');
        const setPasswordButton = page.getByRole('button', { name: /Set (new )?password/i });

        await passwordField.fill('PublicGrid#1');
        await confirmField.fill('PublicGrid#1');
        await page.waitForTimeout(TIMEOUTS.ANIMATION);
        await expect(setPasswordButton).toBeEnabled({ timeout: TIMEOUTS.SHORT });
        await setPasswordButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        log.info('Completed password setup');
    }
}

/**
 * Dismiss the ESCO notice/overlay if present after sign-in.
 * Follows the move-in pattern: uses force click on the last "Got it!" button.
 * There can be duplicate alertdialog elements in the DOM for NY-area users.
 */
export async function dismissESCONoticeIfPresent(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

    const gotItButtons = page.locator('button:has-text("Got it!")');
    const count = await gotItButtons.count();
    if (count > 0) {
        await gotItButtons.last().click({ force: true });
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        log.info('Dismissed ESCO notice');
    }
}
