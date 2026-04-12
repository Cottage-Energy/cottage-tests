/**
 * E2E Test: Finish Registration — Move-in Flow
 *
 * Cross-cutting test: API registration → UI finish-registration flow.
 * 1. Register a user via the partner API (RegisterApi)
 * 2. Navigate to the finishRegistrationURL
 * 3. Walk through the XState form wizard to the identity verification step
 * 4. Verify prefilled data, form elements, and legal links
 *
 * NOTE: Does NOT submit identity verification (SSN) — that triggers a real
 * utility API call. The test verifies the flow is reachable and correctly
 * populated from the API response.
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

const log = createLogger('FinishReg:MoveIn');

const EMAIL_PREFIX = 'pgtest+finreg';
const EMAIL_DOMAIN = '@joinpublicgrid.com';

function testEmail(suffix: string): string {
  return `${EMAIL_PREFIX}-${suffix}-${Date.now().toString(36)}${EMAIL_DOMAIN}`;
}

test.describe('Finish Registration — Move-in E2E', () => {
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

  test('API → address prefilled → company questions → identity step reached', {
    tag: [TEST_TAGS.REGRESSION3],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    const email = testEmail('movein');
    createdEmails.push(email);

    // ─── Phase 1: Register via API ───
    log.section('Phase 1: API Registration');
    log.step(1, 'Call register endpoint');
    const { status, body } = await api.register({
      leaseID: `finreg-movein-${Date.now()}`,
      resident: {
        firstName: 'QA',
        lastName: 'FinishReg',
        email,
        phone: '1111111111',
        dateOfBirth: '1990-05-15',
      },
      property: {
        street: '123 Main St',
        unitNumber: '4B',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        siteId: `site-finreg-${Date.now()}`,
      },
      enrollment: {
        type: 'move-in',
        moveInDate: '2026-04-15',
      },
    });

    expect(status).toBe(201);
    expect(RegisterApi.isSuccess(body)).toBe(true);
    const success = body as RegisterSuccessResponse;
    log.info('Registration successful', { userId: success.userId });

    // ─── Phase 2: Navigate to finish-registration ───
    log.section('Phase 2: UI — Address Step');
    log.step(2, 'Navigate to finish-registration URL');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();

    log.step(3, 'Verify address is prefilled from API payload');
    await expect(finishRegistrationPage.addressHeading).toBeVisible();
    const unit = await finishRegistrationPage.getUnitValue();
    expect(unit).toBe('4B');

    log.step(4, 'Click Continue on address step');
    await finishRegistrationPage.clickContinue();

    // ─── Phase 3: Company Questions (Con Edison) ───
    log.section('Phase 3: UI — Company Questions');
    log.step(5, 'Answer company questions (if present)');
    await finishRegistrationPage.answerCompanyQuestionsAndContinue();

    // ─── Phase 4: Identity Verification Step ───
    log.section('Phase 4: UI — Identity Verification');
    log.step(6, 'Verify identity step is showing');
    await finishRegistrationPage.verifyIdentityStepVisible();

    log.step(7, 'Verify legal consent links');
    await finishRegistrationPage.verifyLegalLinks();

    log.step(8, 'Verify "Verify & Complete" button is present');
    await expect(finishRegistrationPage.verifyAndCompleteButton).toBeVisible();

    log.info('E2E flow complete — identity step reached successfully');
  });

  test('API with minimal payload → address step loads', {
    tag: [TEST_TAGS.REGRESSION3],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_UI);
    const email = testEmail('minimal');
    createdEmails.push(email);

    log.step(1, 'Register with minimal payload (no address)');
    const { status, body } = await api.register({
      leaseID: `finreg-min-${Date.now()}`,
      resident: { firstName: 'Min', lastName: 'Payload', email },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;

    log.step(2, 'Navigate to finish-registration URL');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();

    log.step(3, 'Verify address step loads (empty — no prefill)');
    await expect(finishRegistrationPage.addressHeading).toBeVisible();
    await expect(finishRegistrationPage.continueButton).toBeVisible();

    log.info('Minimal payload flow loads successfully');
  });

  test('API via realpage slug → finish-reg URL works', {
    tag: [TEST_TAGS.REGRESSION3],
  }, async ({ finishRegistrationPage }) => {
    test.setTimeout(TIMEOUTS.TEST_UI);
    const email = testEmail('rpslug');
    createdEmails.push(email);

    log.step(1, 'Register via realpage partner slug');
    const { status, body } = await api.register(
      {
        leaseID: `finreg-rp-${Date.now()}`,
        resident: {
          firstName: 'QA',
          lastName: 'RealPage',
          email,
          phone: '1111111111',
        },
        property: {
          street: '456 Oak Ave',
          city: 'Brooklyn',
          state: 'NY',
          zip: '11201',
          siteId: `site-rp-${Date.now()}`,
        },
        enrollment: { type: 'move-in' },
      },
      'realpage',
    );

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;

    log.step(2, 'Verify leaseID in URL');
    const urlLeaseID = RegisterApi.extractLeaseID(success.finishRegistrationURL);
    expect(urlLeaseID).toContain('finreg-rp-');

    log.step(3, 'Navigate and verify page loads');
    await finishRegistrationPage.goto(success.finishRegistrationURL);
    await finishRegistrationPage.waitForAddressStep();
    await expect(finishRegistrationPage.addressHeading).toBeVisible();
  });
});
