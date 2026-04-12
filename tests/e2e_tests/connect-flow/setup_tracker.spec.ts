import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('SetupTracker');

/**
 * Setup Tracker Tests — ENG-2402, Section 13
 *
 * Covers the setup tracker on the overview page for connect account users.
 * All users are newly registered via /connect.
 *
 * Test cases:
 * - TC-074: Step 2 text for connect account user ("Savings applied automatically")
 */

const eversource = connectData.EVERSOURCE;
const AUTH_DIR = path.join(__dirname, '.auth-temp-tracker');

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

test.describe('Setup Tracker', () => {
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();

        log.section('Register new connect user with Eversource');
        registeredAuthPath = await registerAndSaveAuth(
            browser, eversource.address, eversource.utilityName,
            `pgtest+tracker+${timestamp}@joinpublicgrid.com`, 'Tracker', `tracker-${timestamp}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('TC-074: Connect account user sees "Savings applied automatically" in Step 2', {
        tag: [TEST_TAGS.REGRESSION4],
    }, async ({ page, connectOverviewPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session and navigate to overview');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Verify Step 2 text for connect account');
        await expect(connectOverviewPage.trackerStep2AutoApplyText).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.info('TC-074 PASS: Step 2 shows "Savings applied automatically"');
    });
});
