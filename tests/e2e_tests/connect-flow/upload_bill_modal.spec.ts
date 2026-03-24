import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('UploadBillModal');

/**
 * Upload Bill Modal Tests — ENG-2402, Sections 7–11
 *
 * Covers the upload bill modal that opens from the auto-apply savings card on the overview page.
 *
 * Setup: Registers a NEW user via /connect with ComEd address.
 * Auth: Saves browser storageState after registration and restores it in each test.
 *
 * Test cases:
 * - TC-046 + TC-047 + TC-049: Modal idle view — title, drop zone, button layout
 * - TC-050: "Connect account" alternative link
 * - TC-057 + TC-059 + TC-061: Ready view — title, re-upload link, upload enabled
 * - TC-058: File size NOT displayed in ready view
 * - TC-060: Re-upload resets to idle view
 */

const comEd = connectData.COMED;
const SAMPLE_PDF = path.resolve(__dirname, '../../resources/data/PGsample.pdf');
const AUTH_DIR = path.join(__dirname, '.auth-temp-billmodal');

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

test.describe('Bill Upload Modal', () => {
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();

        log.section('Register new connect user with ComEd');
        registeredAuthPath = await registerAndSaveAuth(
            browser, comEd.address, comEd.utilityName,
            `pgtest+billmodal+${timestamp}@joinpublicgrid.com`, 'BillModal', `billmodal-${timestamp}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('TC-046 + TC-047 + TC-049: Modal idle view — title, drop zone, and button layout', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
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

        log.step(1, 'TC-046: Modal title reads "Upload document"');
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(2, 'TC-047: Drop zone text visible');
        await expect(uploadBillModalPage.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(uploadBillModalPage.dropZoneDragText).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(3, 'TC-049: Cancel and Upload buttons visible, Upload disabled');
        await expect(uploadBillModalPage.cancelButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(uploadBillModalPage.uploadButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await uploadBillModalPage.verifyUploadButtonDisabled();

        log.info('TC-046 + TC-047 + TC-049 PASS');
    });

    test('TC-050: "Connect account" alternative link visible', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and open modal');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Verify "Connect account" link');
        await uploadBillModalPage.verifyConnectAccountLinkVisible();

        log.info('TC-050 PASS: Connect account alternative link visible');
    });

    test('TC-057 + TC-059 + TC-061: Ready view — title, re-upload link, upload enabled', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and open modal');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Select a file');
        await uploadBillModalPage.selectFile(SAMPLE_PDF);

        log.step(1, 'TC-057: Title still reads "Upload document"');
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(2, 'TC-059: Re-upload link visible');
        await expect(uploadBillModalPage.reUploadLink).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(3, 'TC-061: Upload button is now enabled');
        await uploadBillModalPage.verifyUploadButtonEnabled();

        log.info('TC-057 + TC-059 + TC-061 PASS');
    });

    test('TC-058: File size NOT displayed in ready view', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and open modal');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Select a file and verify no file size');
        await uploadBillModalPage.selectFile(SAMPLE_PDF);

        // File size patterns like "1.2 MB", "500 KB", etc should NOT be visible
        const fileSizePattern = page.getByText(/\d+\.?\d*\s*(KB|MB|GB)/i);
        await expect(fileSizePattern).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-058 PASS: File size not displayed');
    });

    test('TC-060: Re-upload resets to idle view', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and open modal');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Select file then click re-upload');
        await uploadBillModalPage.selectFile(SAMPLE_PDF);
        await expect(uploadBillModalPage.reUploadLink).toBeVisible({ timeout: TIMEOUTS.SHORT });

        await uploadBillModalPage.clickReUpload();

        log.section('Verify returned to idle view');
        await expect(uploadBillModalPage.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await uploadBillModalPage.verifyUploadButtonDisabled();

        log.info('TC-060 PASS: Re-upload resets to idle view');
    });
});
