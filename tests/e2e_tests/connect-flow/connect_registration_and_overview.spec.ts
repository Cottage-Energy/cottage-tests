import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import connectData from '../../resources/data/connect_flow-data.json';

const log = createLogger('ConnectRegistration');

/**
 * Connect Registration Tests — ENG-2402
 *
 * Covers:
 * - TC-001: Connect page heading and form elements
 * - TC-088: Duplicate email registration on /connect (registers first, then retries same email)
 *
 * All users are newly registered via /connect — no existing users.
 */

const georgiaPower = connectData.GEORGIA_POWER;

test.afterEach(async ({ page }) => {
    await page.close();
});

// ─── Connect Registration Form ──────────────────────────────────────────────
test.describe('Connect Registration Form', () => {

    test('TC-001: Connect page heading and form elements', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Verify page content');
        await connectPage.verifyPageContent();
        await connectPage.verifyFormFieldsVisible();

        // Button should be disabled when fields are empty
        await expect(connectPage.getStartedButton).toBeDisabled({ timeout: TIMEOUTS.SHORT });

        // Legal links visible
        await expect(connectPage.letterOfAuthorizationLink).toBeVisible({ timeout: TIMEOUTS.SHORT });
        await expect(connectPage.termsLink).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-001 PASS: Connect page content verified');
    });

    test('TC-088: Duplicate email shows error toast', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_PAYMENT);
        const timestamp = Date.now();
        const duplicateEmail = `pgtest+dup+${timestamp}@joinpublicgrid.com`;

        log.section('First registration — create a new user');
        await connectPage.navigateToConnect();
        await connectPage.fillAddress(georgiaPower.address);
        await connectPage.emailInput.fill(duplicateEmail);
        await connectPage.firstNameInput.fill('Test');
        await connectPage.lastNameInput.fill('First');
        await connectPage.selectUtility(georgiaPower.utilityName);
        await connectPage.clickGetStarted();

        await connectPage.page.waitForURL(/\/app\/(overview|summary)/, {
            timeout: TIMEOUTS.LONG,
            waitUntil: 'domcontentloaded',
        });
        log.info('First registration successful', { email: duplicateEmail });

        log.section('Second registration — retry with same email');
        await connectPage.navigateToConnect();
        await connectPage.verifyPageContent();

        await connectPage.fillAddress(georgiaPower.address);
        await connectPage.emailInput.fill(duplicateEmail);
        await connectPage.firstNameInput.fill('Test');
        await connectPage.lastNameInput.fill('Duplicate');
        await connectPage.selectUtility(georgiaPower.utilityName);

        log.section('Submit and verify error toast');
        await connectPage.clickGetStarted();
        await connectPage.verifyErrorToast('An account with this email already exists');
        await connectPage.verifyButtonReEnabledAfterError();

        log.info('TC-088 PASS: Duplicate email error toast displayed correctly');
    });
});
