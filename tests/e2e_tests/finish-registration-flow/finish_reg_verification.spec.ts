/**
 * E2E Test: Finish Registration — Verification Flow
 *
 * Cross-cutting test: API registration → UI verification flow.
 * enrollment.type = "verification" → resident sets up utility on their own,
 * Public Grid captures utility proof (bill screenshot or email).
 *
 * Flow:
 * 1. Register via API with enrollment.type = "verification"
 * 2. Navigate to finishRegistrationURL
 * 3. Step 1: Enter your address (prefilled)
 * 4. Provider Information — shows utility contact, "Upload proof" or "I will do it later"
 * 5. Verify Utility Account — DOB, move-in date, name, email (disabled), phone, file upload
 *
 * Ticket: ENG-2407
 * Test plan: tests/test_plans/ENG-2407_register_endpoint_realpage.md
 * Flow doc: tests/docs/finish-registration-flow.md
 */

import { test, expect } from '../../resources/page_objects';
import { RegisterApi, CleanUp } from '../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import type { RegisterSuccessResponse } from '../../resources/types';

const log = createLogger('FinishReg:Verify');

const EMAIL_PREFIX = 'pgtest+finreg-v';
const EMAIL_DOMAIN = '@joinpublicgrid.com';

function testEmail(suffix: string): string {
  return `${EMAIL_PREFIX}-${suffix}-${Date.now().toString(36)}${EMAIL_DOMAIN}`;
}

test.describe('Finish Registration — Verification E2E', () => {
  let api: RegisterApi;
  const createdEmails: string[] = [];

  test.beforeAll(() => {
    api = new RegisterApi();
  });

  test.afterAll(async () => {
    log.section('Cleanup');
    for (const email of createdEmails) {
      log.info('Cleaning up', { email });
      await CleanUp.Test_User_Clean_Up(email);
    }
  });

  test('API → address → provider info → utility verification step reached', {
    tag: [TEST_TAGS.SMOKE, TEST_TAGS.API, TEST_TAGS.E2E],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    const email = testEmail('full');
    createdEmails.push(email);

    // ─── Phase 1: Register via API ───
    log.section('Phase 1: API Registration (verification)');
    log.step(1, 'Call register endpoint with verification enrollment');
    const { status, body } = await api.register({
      leaseID: `finreg-verify-${Date.now()}`,
      resident: {
        firstName: 'QA',
        lastName: 'VerifyFlow',
        email,
        phone: '1111111111',
      },
      property: {
        street: '456 Oak Ave',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11201',
        siteId: `site-verify-${Date.now()}`,
      },
      enrollment: { type: 'verification' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;
    expect(success.status).toBe('VERIFICATION_INCOMPLETE');
    log.info('Registration successful', { userId: success.userId });

    // ─── Phase 2: Address Step ───
    log.section('Phase 2: UI — Address Step');
    log.step(2, 'Navigate to finish-registration URL');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();

    log.step(3, 'Verify address heading visible');
    await expect(finishRegistrationPage.addressHeading).toBeVisible();

    log.step(4, 'Click Continue');
    await finishRegistrationPage.clickContinue();

    // ─── Phase 3: Provider Information ───
    log.section('Phase 3: UI — Provider Information');
    log.step(5, 'Verify provider info step');
    await finishRegistrationPage.verifyProviderInfoVisible();

    log.step(6, 'Click "Upload proof" to proceed');
    await finishRegistrationPage.clickUploadProof();

    // ─── Phase 4: Verify Utility Account ───
    log.section('Phase 4: UI — Verify Utility Account');
    log.step(7, 'Verify utility verification step reached');
    await finishRegistrationPage.verifyUtilityStepVisible();

    log.step(8, 'Verify form fields are present');
    await expect(finishRegistrationPage.fileUploadButton).toBeVisible();
    await expect(finishRegistrationPage.notifyCheckbox).toBeVisible();
    await expect(finishRegistrationPage.notifyCheckbox).toBeChecked();

    log.info('Verification E2E flow complete — utility verification step reached');
  });

  test('verification flow: "I will do it later" is available', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API, TEST_TAGS.E2E],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_UI);
    const email = testEmail('later');
    createdEmails.push(email);

    log.step(1, 'Register verification user');
    const { status, body } = await api.register({
      leaseID: `finreg-later-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'DoLater', email, phone: '1111111111' },
      property: {
        street: '789 Elm St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        siteId: `site-later-${Date.now()}`,
      },
      enrollment: { type: 'verification' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;

    log.step(2, 'Navigate and pass address step');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();
    await finishRegistrationPage.clickContinue();

    log.step(3, 'Verify "I will do it later" button visible on provider info');
    await finishRegistrationPage.verifyProviderInfoVisible();
    await expect(finishRegistrationPage.doItLaterButton).toBeVisible();
    await expect(finishRegistrationPage.doItLaterButton).toBeEnabled();
  });

  test('verification flow: prefilled fields from API payload', {
    tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API, TEST_TAGS.E2E],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    const email = testEmail('prefill');
    createdEmails.push(email);

    log.step(1, 'Register with full resident data');
    const { status, body } = await api.register({
      leaseID: `finreg-prefill-${Date.now()}`,
      resident: {
        firstName: 'TestFirst',
        lastName: 'TestLast',
        email,
        phone: '1111111111',
        dateOfBirth: '1995-08-20',
      },
      property: {
        street: '456 Oak Ave',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11201',
        siteId: `site-prefill-${Date.now()}`,
      },
      enrollment: { type: 'verification' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;

    log.step(2, 'Navigate through to utility verification step');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();
    await finishRegistrationPage.clickContinue();
    await finishRegistrationPage.clickUploadProof();
    await finishRegistrationPage.verifyUtilityStepVisible();

    log.step(3, 'Verify email is prefilled and disabled');
    await expect(finishRegistrationPage.emailInput).toBeDisabled();
    await expect(finishRegistrationPage.emailInput).toHaveValue(email);

    log.info('Prefilled fields verified');
  });
});
