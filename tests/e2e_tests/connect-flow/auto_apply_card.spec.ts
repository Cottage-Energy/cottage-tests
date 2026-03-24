import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('AutoApplyCard');

/**
 * Auto-Apply Savings Card Tests — ENG-2402, Section 12
 *
 * Covers the auto-apply savings card on the overview page for connect ELIGIBLE users.
 * All users are newly registered via /connect.
 *
 * Test cases:
 * - TC-068 + TC-070 + TC-095: Auto-apply card text, layout, rendering
 * - isConnectReady=false: Connect utility button hidden
 * - isConnectReady=true: Connect utility button visible
 * - TC-072: Upload bill → upload bill modal
 * - TC-071: Connect utility → Upload bill modal switch
 */

const conEdison = connectData.CON_EDISON;
const txLight = connectData.TX_LIGHT;
const AUTH_DIR = path.join(__dirname, '.auth-temp-autocard');

let connectReadyAuthPath: string;
let connectNotReadyAuthPath: string;

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

test.describe('Auto-Apply Savings Card', () => {
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();

        log.section('Register 2 connect users');
        connectReadyAuthPath = await registerAndSaveAuth(
            browser, conEdison.address, conEdison.utilityName,
            `pgtest+autocard+ready+${timestamp}@joinpublicgrid.com`, 'Ready', `ready-${timestamp}.json`,
        );
        connectNotReadyAuthPath = await registerAndSaveAuth(
            browser, txLight.address, txLight.utilityName,
            `pgtest+autocard+notready+${timestamp}@joinpublicgrid.com`, 'NotReady', `notready-${timestamp}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('TC-068 + TC-070 + TC-095: Auto-apply card text, layout, and rendering', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ page, connectOverviewPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore BGE session (isConnectReady=false)');
        await restoreSession(page, connectNotReadyAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.step(1, 'TC-095: Auto-apply card renders for connect ELIGIBLE user');
        await connectOverviewPage.verifyAutoApplyCardVisible();

        log.step(2, 'TC-070: Heading "Get savings applied automatically" visible');
        await expect(connectOverviewPage.autoApplyHeading).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(3, 'TC-070: Description text visible');
        await expect(connectOverviewPage.autoApplyDescription).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(4, 'TC-070: Three benefit items visible');
        await expect(connectOverviewPage.autoApplyBenefitAutoApply).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(connectOverviewPage.autoApplyBenefitNoChanges).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(connectOverviewPage.autoApplyBenefitWeHandle).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(5, 'TC-068: "Upload bill" button text (not "Upload a bill")');
        await expect(connectOverviewPage.uploadBillButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(connectOverviewPage.uploadBillButton).toHaveText(/^Upload bill$/);

        log.info('TC-068 + TC-070 + TC-095 PASS');
    });

    test('isConnectReady=false: Connect utility button NOT visible', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore BGE session (isConnectReady=false)');
        await restoreSession(page, connectNotReadyAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.step(1, 'Auto-apply card is visible');
        await connectOverviewPage.verifyAutoApplyCardVisible();

        log.step(2, 'Upload bill button IS visible');
        await expect(connectOverviewPage.uploadBillButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(3, 'Connect utility button is NOT visible (isConnectReady=false)');
        await expect(connectOverviewPage.connectUtilityButton).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('isConnectReady=false PASS: Connect utility button hidden');
    });

    test('isConnectReady=true: Connect utility button IS visible', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore Con Edison session (isConnectReady=true)');
        await restoreSession(page, connectReadyAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.step(1, 'Auto-apply card is visible');
        await connectOverviewPage.verifyAutoApplyCardVisible();

        log.step(2, 'Upload bill button IS visible');
        await expect(connectOverviewPage.uploadBillButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(3, 'Connect utility button IS visible (isConnectReady=true)');
        await expect(connectOverviewPage.connectUtilityButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('isConnectReady=true PASS: Connect utility button visible');
    });

    test('TC-072: Upload bill button opens upload bill modal', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore BGE session');
        await restoreSession(page, connectNotReadyAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Click Upload bill on auto-apply card');
        await connectOverviewPage.uploadBillButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Verify upload bill modal opens');
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(uploadBillModalPage.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-072 PASS: Upload bill opens upload bill modal');
    });

    test('TC-071: Connect utility button opens connect modal, can switch to upload bill', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage, uploadBillModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore Con Edison session (isConnectReady=true)');
        await restoreSession(page, connectReadyAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Click Connect utility on auto-apply card');
        await expect(connectOverviewPage.connectUtilityButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.step(1, 'Connect utility modal opens');
        await connectUtilityModalPage.verifyFormView();

        log.step(2, 'Click "Upload bill" link in connect modal');
        await connectUtilityModalPage.clickUploadBill();

        log.step(3, 'Bill upload modal opens after switch');
        await expect(uploadBillModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.info('TC-071 PASS: Connect utility → Upload bill modal switch works');
    });
});
