import fs from 'fs';
import path from 'path';
import { test, expect } from '../../resources/page_objects';
import { ConnectPage } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import { dismissPasswordResetIfPresent, dismissESCONoticeIfPresent } from '../../resources/fixtures';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('ConnectRegression');

/**
 * Connect Regression Tests — ENG-2402, Section 14
 *
 * Verifies that connect account users have no billing UI.
 * All users are newly registered via /connect.
 *
 * Test cases:
 * - TC-099: Connect account is NOT a billing customer (no billing UI)
 */

const dukeEnergy = connectData.DUKE_ENERGY;
const AUTH_DIR = path.join(__dirname, '.auth-temp-regression');

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

test.describe('Connect Regression', () => {
    test.describe.configure({ mode: 'serial', timeout: TIMEOUTS.TEST_PAYMENT });

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();

        log.section('Register new connect user with Duke Energy');
        registeredAuthPath = await registerAndSaveAuth(
            browser, dukeEnergy.address, dukeEnergy.utilityName,
            `pgtest+regression+${timestamp}@joinpublicgrid.com`, 'Regression', `regression-${timestamp}.json`,
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test.afterAll(async () => {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    });

    test('TC-099: Connect account has no billing UI', {
        tag: [TEST_TAGS.REGRESSION3],
    }, async ({ page, connectOverviewPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);

        log.section('Restore session as connect ELIGIBLE user');
        await restoreSession(page, registeredAuthPath);
        await page.goto('/app/overview', { waitUntil: 'domcontentloaded' });
        await connectOverviewPage.waitForOverviewLoad();
        await dismissPasswordResetIfPresent(page);
        await dismissESCONoticeIfPresent(page);
        await page.waitForTimeout(TIMEOUTS.UI_STABILIZE);

        log.section('Verify no billing UI');
        await connectOverviewPage.verifyBillingUINotVisible();

        log.info('TC-099 PASS: Connect account has no billing UI');
    });
});
