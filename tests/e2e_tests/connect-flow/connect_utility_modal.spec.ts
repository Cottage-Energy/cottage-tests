import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('ConnectUtilityModal');

/**
 * Connect Utility Modal Tests — ENG-2402, Section 2
 *
 * Covers the form view of the connect utility modal.
 * Connecting/MFA/Success/Error views are BLOCKED on BLNK service.
 *
 * Setup: Registers 3 users via /connect — one per connect-ready utility company:
 * - Con Edison (NYISO zone, NYC address)
 * - ComEd (PJM zone, IL address)
 * - National Grid MA (ISONE zone, MA address)
 *
 * Auth: Saves browser storageState after registration and restores it in each test.
 * No OTP sign-in needed — the registration session is reused.
 *
 * Test cases:
 * - TC-010: Modal title reads "Connect your account" (Con Edison)
 * - TC-014: Credential security notice visible (Con Edison)
 * - TC-015: Cancel and Connect button layout (Con Edison)
 * - TC-016: "Upload bill" alternative link visible (ComEd)
 * - TC-017: "Upload bill" switches to bill upload modal (National Grid MA)
 */

const conEdison = connectData.CON_EDISON;
const comEd = connectData.COMED;
const ngma = connectData.NGMA;
const AUTH_DIR = path.join(__dirname, '.auth-temp-modal');

let conEdisonAuthPath: string;
let comEdAuthPath: string;
let ngmaAuthPath: string;

/**
 * Register a connect user and save the auth state to a file.
 */
async function registerAndSaveAuth(
    browser: import('@playwright/test').Browser,
    address: string,
    utilityName: string,
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
    await connectPage.selectUtility(utilityName);
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
 * Sets cookies on the context and localStorage via init script.
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

test.describe('Connect Utility Modal — Form View', () => {
    // Serial: beforeAll registers 3 users shared across all tests
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const ts = Date.now();

        log.section('Register 3 connect users — one per connect-ready utility');
        conEdisonAuthPath = await registerAndSaveAuth(
            browser, conEdison.address, conEdison.utilityName,
            `pgtest+modal+conedison+${ts}@joinpublicgrid.com`, 'ConEdison', `conedison-${ts}.json`,
        );
        comEdAuthPath = await registerAndSaveAuth(
            browser, comEd.address, comEd.utilityName,
            `pgtest+modal+comed+${ts}@joinpublicgrid.com`, 'ComEd', `comed-${ts}.json`,
        );
        ngmaAuthPath = await registerAndSaveAuth(
            browser, ngma.address, ngma.utilityName,
            `pgtest+modal+ngma+${ts}@joinpublicgrid.com`, 'NGMA', `ngma-${ts}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('TC-010 + TC-014 + TC-015: Modal title, security notice, and button layout (Con Edison)', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore Con Edison session and navigate to overview');
        await restoreSession(page, conEdisonAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Open connect utility modal');
        await expect(connectOverviewPage.connectUtilityButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.step(1, 'TC-010: Modal title "Connect your account"');
        await connectUtilityModalPage.verifyFormView();

        log.step(2, 'TC-014: Credential security notice visible');
        await connectUtilityModalPage.verifySecurityNotice();

        log.step(3, 'TC-015: Cancel and Connect buttons visible');
        await expect(connectUtilityModalPage.cancelButton).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(connectUtilityModalPage.connectButton).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-010 + TC-014 + TC-015 PASS (Con Edison)');
    });

    test('TC-016: "Upload bill" alternative link visible (ComEd)', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore ComEd session and navigate to overview');
        await restoreSession(page, comEdAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Verify Upload bill link');
        await connectUtilityModalPage.verifyUploadBillLinkVisible();

        log.info('TC-016 PASS (ComEd): Upload bill link visible in connect modal');
    });

    test('TC-017: "Upload bill" switches to bill upload modal (National Grid MA)', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ page, connectOverviewPage, connectUtilityModalPage, billUploadModalPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore National Grid MA session and navigate to overview');
        await restoreSession(page, ngmaAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);
        await connectOverviewPage.connectUtilityButton.click();
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Click "Upload bill" in connect modal');
        await connectUtilityModalPage.clickUploadBill();

        log.section('Verify bill upload modal opens');
        await expect(billUploadModalPage.modalTitle).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(billUploadModalPage.dropZoneClickToUpload).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-017 PASS (National Grid MA): Upload bill switches to bill upload modal');
    });
});
