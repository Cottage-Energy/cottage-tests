import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('ConnectUtilityError');

/**
 * Connect Utility Error & Fallback Tests
 *
 * Covers the connect utility error flow and the upload bill fallback path
 * from the auto-apply savings card on the overview page.
 *
 * Setup: Registers a NEW user via /connect with ComEd address (isConnectReady=true).
 * Auth: Saves browser storageState after registration and restores it in each test.
 *
 * Test cases:
 * - Connect failed error screen — bad credentials show error with correct UI
 * - Connect fail → Try again — returns to credential form
 * - Connect fail → Upload bill fallback — switches to upload bill modal
 * - Upload bill e2e submission — file upload completes and overview updates
 */

const comEd = connectData.COMED;
const SAMPLE_PDF = path.resolve(__dirname, '../../resources/data/PGsample.pdf');
const AUTH_DIR = path.join(__dirname, '.auth-temp-connect-error');

let registeredAuthPath: string;

/**
 * Register a connect user and save the auth state to a file.
 */
async function registerAndSaveAuth(
    browser: import('@playwright/test').Browser,
    address: string,
    utilityName: string | null,
    email: string,
    lastName: string,
    authFileName: string,
): Promise<string> {
    const context = await browser.newContext();
    const page = await context.newPage();
    const connectPage = new ConnectPage(page);

    await connectPage.navigateToConnect();
    await connectPage.fillAddress(address);
    await connectPage.emailInput.fill(email);
    await connectPage.firstNameInput.fill('Test');
    await connectPage.lastNameInput.fill(lastName);
    if (utilityName) {
        await connectPage.selectUtility(utilityName);
    }
    await connectPage.clickGetStarted();

    await page.waitForURL(/\/app\/(overview|summary)/, { timeout: TIMEOUTS.LONG, waitUntil: 'domcontentloaded' });

    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const authPath = path.join(AUTH_DIR, authFileName);
    await context.storageState({ path: authPath });

    log.info('Registered and saved auth', { email, utility: utilityName });
    await page.close();
    await context.close();

    return authPath;
}

/**
 * Restore a saved auth session into the given page.
 */
async function restoreSession(page: import('@playwright/test').Page, authStatePath: string): Promise<void> {
    const state = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));

    if (state.cookies?.length > 0) {
        await page.context().addCookies(state.cookies);
    }

    const localStorageItems: Array<{ name: string; value: string }> = state.origins?.[0]?.localStorage || [];
    if (localStorageItems.length > 0) {
        await page.addInitScript((items: Array<{ name: string; value: string }>) => {
            for (const item of items) {
                localStorage.setItem(item.name, item.value);
            }
        }, localStorageItems);
    }
}

test.describe('Connect Utility Error & Upload Bill E2E', () => {
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();

        log.section('Register new connect user with ComEd');
        registeredAuthPath = await registerAndSaveAuth(
            browser, comEd.address, comEd.utilityName,
            `pgtest+connecterr+${timestamp}@joinpublicgrid.com`, 'ConnectErr', `connecterr-${timestamp}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('Connect failed: bad credentials show error screen with correct UI', {
        tag: [TEST_TAGS.REGRESSION5],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and navigate to overview');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Click Connect utility and enter bad credentials');
        await expect(connectOverviewPage.connectUtilityButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectUtilityModalPage.verifyFormView();

        await connectUtilityModalPage.fillCredentialsAndConnect('fakeuser@notreal.com', 'WrongPass123!');

        log.section('Verify connect failed error screen');
        await connectUtilityModalPage.verifyConnectFailedView();

        log.info('PASS: Connect failed error screen shows correct UI');
    });

    test('Connect fail → Try again: returns to credential form', {
        tag: [TEST_TAGS.REGRESSION5],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and trigger connect failure');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectUtilityModalPage.fillCredentialsAndConnect('fakeuser@notreal.com', 'WrongPass123!');
        await connectUtilityModalPage.verifyConnectFailedView();

        log.section('Click Try again and verify credential form returns');
        await connectUtilityModalPage.clickTryAgain();
        await connectUtilityModalPage.verifyFormView();

        log.step(1, 'Email field is visible and empty');
        await expect(connectUtilityModalPage.emailInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(2, 'Password field is visible');
        await expect(connectUtilityModalPage.passwordInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('PASS: Try again returns to credential form');
    });

    test('Connect fail → Upload bill fallback: switches to upload bill modal', {
        tag: [TEST_TAGS.REGRESSION5],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and trigger connect failure');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectUtilityModalPage.fillCredentialsAndConnect('fakeuser@notreal.com', 'WrongPass123!');
        await connectUtilityModalPage.verifyConnectFailedView();

        log.section('Click Upload bill fallback');
        await connectUtilityModalPage.clickUploadBillFallback();

        log.section('Verify upload bill modal opens');
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(uploadBillModalPage.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await uploadBillModalPage.verifyUploadButtonDisabled();

        log.info('PASS: Upload bill fallback opens upload bill modal');
    });

    test('Upload bill e2e: file upload completes and overview updates to tracker', {
        tag: [TEST_TAGS.REGRESSION5],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and navigate to overview');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Open upload bill modal');
        await expect(connectOverviewPage.uploadBillButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.section('Select file and click Upload');
        await uploadBillModalPage.selectFile(SAMPLE_PDF);
        await uploadBillModalPage.verifyUploadButtonEnabled();
        await uploadBillModalPage.clickUpload();

        log.section('Verify overview updates to progress tracker');
        await expect(connectOverviewPage.trackerStep1Text).toBeVisible({ timeout: TIMEOUTS.LONG });
        await expect(connectOverviewPage.trackerStep2AutoApplyText).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(1, 'Auto-apply card is no longer visible');
        await expect(connectOverviewPage.autoApplyHeading).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('PASS: Upload bill e2e completes — overview shows progress tracker');
    });
});
