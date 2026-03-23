import { test, expect } from '../../resources/page_objects';
import { TEST_TAGS, TIMEOUTS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';

const log = createLogger('ConnectRegistrationForm');

/**
 * Connect Registration Form Tests — ENG-2402, Section 1
 *
 * Covers detailed UI verification of the /connect registration page:
 * - TC-002: Bill-savings image renders
 * - TC-003: Form fields render correctly
 * - TC-004: Submit button text and state
 * - TC-007: Legal links at bottom
 * - TC-008: Utility company field hidden for LIGHT/TX-DEREG area
 *
 * TC-001 (page heading) and TC-088 (duplicate email) are in connect_registration_and_overview.spec.ts
 * TC-005 (processing state) and TC-009 (max-width constraint) are exploratory only.
 */

test.afterEach(async ({ page }) => {
    await page.close();
});

test.describe('Connect Registration Form — Detailed UI', () => {

    test('TC-002: Bill-savings image renders above heading', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Verify bill-savings image');
        await expect(connectPage.billSavingsImage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.info('TC-002 PASS: Bill-savings image renders');
    });

    test('TC-003: Form fields render correctly', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Verify form fields');
        await connectPage.verifyFormFieldsVisible();

        log.step(1, 'Address input visible');
        await expect(connectPage.addressInput).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(2, 'Email input visible');
        await expect(connectPage.emailInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(3, 'First name input visible');
        await expect(connectPage.firstNameInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.step(4, 'Last name input visible');
        await expect(connectPage.lastNameInput).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-003 PASS: All form fields render correctly');
    });

    test('TC-004: Submit button disabled when fields are empty', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Verify button state');
        log.step(1, 'Button text reads "Get started"');
        await expect(connectPage.getStartedButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
        await expect(connectPage.getStartedButton).toContainText('Get started');

        log.step(2, 'Button is disabled when fields are empty');
        await expect(connectPage.getStartedButton).toBeDisabled({ timeout: TIMEOUTS.SHORT });

        log.info('TC-004 PASS: Submit button disabled when empty');
    });

    test('TC-007: Legal links visible at bottom', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.UI],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Verify legal links');
        log.step(1, 'LPOA link visible');
        await expect(connectPage.letterOfAuthorizationLink).toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.step(2, 'Terms link visible');
        await expect(connectPage.termsLink).toBeVisible({ timeout: TIMEOUTS.SHORT });

        log.info('TC-007 PASS: Legal links visible');
    });

    test('TC-008: Utility company field hidden for LIGHT/TX-DEREG area', {
        tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.E2E],
    }, async ({ connectPage }) => {
        test.setTimeout(TIMEOUTS.TEST_UI);

        log.section('Navigate to /connect');
        await connectPage.navigateToConnect();

        log.section('Enter Texas address (TX-DEREG area)');
        await connectPage.fillAddress('1000 Main St, Houston, TX 77002');

        log.section('Verify utility combobox is NOT visible');
        await expect(connectPage.utilityCombobox).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });

        log.info('TC-008 PASS: Utility company field hidden for TX-DEREG area');
    });
});
