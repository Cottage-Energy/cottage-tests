/**
 * API Tests: Registration Endpoints — Public Grid REST API v2
 *
 * Tests POST /registration/move-in and POST /registration/savings-enrollment
 * including required field validation, duplicate detection, and response format.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md (REG-001 through SAV-005)
 */

import { test, expect } from '@playwright/test';
import { RegistrationApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
import { CleanUp } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS, API_V2_ERROR_CODES, UUID_REGEX } from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type { RegistrationSuccessResponse } from '../../../resources/types';

const log = createLogger('RegistrationEndpoints');

test.describe('API v2: POST /registration/move-in', () => {
  let api: RegistrationApiV2;
  const createdEmails: string[] = [];

  test.beforeAll(() => {
    api = new RegistrationApiV2();
  });

  test.afterAll(async () => {
    log.section('Cleanup');
    for (const email of createdEmails) {
      log.info('Cleaning up', { email });
      await CleanUp.Test_User_Clean_Up(email);
    }
  });

  // ─── REG-001: Full payload move-in ───

  test('REG-001: full payload move-in returns 201', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('reg001');
    createdEmails.push(email);

    log.step(1, 'Register with full payload');
    const { status, body } = await api.registerMoveIn(
      RegistrationApiV2.fullMoveIn(email),
    );

    log.step(2, 'Verify 201 with registration data');
    expect(status).toBe(201);
    expect(RegistrationApiV2.isSuccess(body)).toBe(true);

    const success = body as RegistrationSuccessResponse;
    expect(success.success).toBe(true);
    expect(success.data.registrationID).toBeTruthy();
    expect(success.data.status).toBe('pending_identity');
    expect(success.data.message).toBeTruthy();
    expect(success.data.finishRegistrationURL).toContain('onepublicgrid.com');
  });

  // ─── REG-002: Minimum viable payload ───

  test('REG-002: minimum viable payload succeeds', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('reg002');
    createdEmails.push(email);

    log.step(1, 'Register with only required fields');
    const { status, body } = await api.registerMoveIn(
      RegistrationApiV2.minimalMoveIn(email),
    );

    log.step(2, 'Verify 201');
    expect(status).toBe(201);
    expect(RegistrationApiV2.isSuccess(body)).toBe(true);
  });

  // ─── REG-003: Missing firstName ───

  test('REG-003: missing firstName returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerMoveInRaw({
      resident: {
        lastName: 'Test',
        email: RegistrationApiV2.testEmail('reg003'),
      },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.INVALID_REQUEST);
  });

  // ─── REG-004: Missing lastName ───

  test('REG-004: missing lastName returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerMoveInRaw({
      resident: {
        firstName: 'Test',
        email: RegistrationApiV2.testEmail('reg004'),
      },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── REG-005: Missing email ───

  test('REG-005: missing email returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerMoveInRaw({
      resident: {
        firstName: 'Test',
        lastName: 'NoEmail',
      },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── REG-006: Missing enrollment.type ───

  test('REG-006: missing enrollment.type returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerMoveInRaw({
      resident: {
        firstName: 'Test',
        lastName: 'NoType',
        email: RegistrationApiV2.testEmail('reg006'),
      },
      enrollment: {},
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── REG-007: Invalid enrollment.type ───

  test('REG-007: invalid enrollment.type returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerMoveInRaw({
      resident: {
        firstName: 'Test',
        lastName: 'BadType',
        email: RegistrationApiV2.testEmail('reg007'),
      },
      enrollment: { type: 'invalid-type' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── REG-008: Enrollment type "verification" ───

  test('REG-008: enrollment type verification returns 201', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('reg008');
    createdEmails.push(email);

    const { status, body } = await api.registerMoveIn({
      resident: { firstName: 'QA', lastName: 'Verify', email },
      enrollment: { type: 'verification' },
    });

    expect(status).toBe(201);
    expect(RegistrationApiV2.isSuccess(body)).toBe(true);
  });

  // ─── REG-009: Duplicate email ───

  test('REG-009: duplicate email returns 409', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.LONG);
    const email = RegistrationApiV2.testEmail('reg009');
    createdEmails.push(email);

    log.step(1, 'Register first user');
    const first = await api.registerMoveIn(RegistrationApiV2.minimalMoveIn(email));
    expect(first.status).toBe(201);

    log.step(2, 'Attempt duplicate registration');
    const second = await api.registerMoveIn(RegistrationApiV2.minimalMoveIn(email));

    log.step(3, 'Verify 409 CONFLICT');
    expect(second.status).toBe(409);
    expect(PublicGridApiV2.isError(second.body)).toBe(true);
    expect(PublicGridApiV2.errorCode(second.body)).toBe(API_V2_ERROR_CODES.CONFLICT);
  });

  // ─── REG-010: finishRegistrationURL is valid ───

  test('REG-010: finishRegistrationURL contains token', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('reg010');
    createdEmails.push(email);

    const { status, body } = await api.registerMoveIn(
      RegistrationApiV2.fullMoveIn(email),
    );

    expect(status).toBe(201);
    const success = body as RegistrationSuccessResponse;
    const url = new URL(success.data.finishRegistrationURL);
    expect(url.searchParams.has('token')).toBe(true);
  });

  // ─── REG-011: registrationID uniqueness ───

  test('REG-011: two registrations produce unique IDs', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.LONG);
    const email1 = RegistrationApiV2.testEmail('reg011a');
    const email2 = RegistrationApiV2.testEmail('reg011b');
    createdEmails.push(email1, email2);

    const r1 = await api.registerMoveIn(RegistrationApiV2.minimalMoveIn(email1));
    const r2 = await api.registerMoveIn(RegistrationApiV2.minimalMoveIn(email2));

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);

    const id1 = (r1.body as RegistrationSuccessResponse).data.registrationID;
    const id2 = (r2.body as RegistrationSuccessResponse).data.registrationID;
    expect(id1).not.toBe(id2);
  });
});

test.describe('API v2: POST /registration/savings-enrollment', () => {
  let api: RegistrationApiV2;
  const createdEmails: string[] = [];

  test.beforeAll(() => {
    api = new RegistrationApiV2();
  });

  test.afterAll(async () => {
    log.section('Cleanup');
    for (const email of createdEmails) {
      log.info('Cleaning up', { email });
      await CleanUp.Test_User_Clean_Up(email);
    }
  });

  // ─── SAV-001: Full payload savings enrollment ───

  test('SAV-001: savings enrollment with full payload', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('sav001');
    createdEmails.push(email);

    log.step(1, 'Enroll with full payload');
    const { status, body } = await api.registerSavings({
      resident: {
        externalUserID: `ext-${Date.now().toString(36)}`,
        firstName: 'QA',
        lastName: 'Savings',
        email,
        phone: '+11111111111',
      },
      property: {
        street: '456 Savings Ave',
        unitNumber: '2A',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
    });

    log.step(2, 'Verify 201 with savings status');
    expect(status).toBe(201);
    expect(RegistrationApiV2.isSuccess(body)).toBe(true);

    const success = body as RegistrationSuccessResponse;
    expect(success.data.status).toBe('pending_bill_upload');
    expect(success.data.finishRegistrationURL).toContain('savings');
  });

  // ─── SAV-002: Minimum viable payload ───

  test('SAV-002: savings with minimum payload succeeds', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('sav002');
    createdEmails.push(email);

    const { status, body } = await api.registerSavings(
      RegistrationApiV2.minimalSavings(email),
    );

    expect(status).toBe(201);
    expect(RegistrationApiV2.isSuccess(body)).toBe(true);
  });

  // ─── SAV-003: Missing required email ───

  test('SAV-003: savings without email returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.registerSavingsRaw({
      resident: {
        firstName: 'QA',
        lastName: 'NoEmail',
      },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── SAV-004: URL points to savings ───

  test('SAV-004: finishRegistrationURL points to savings', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = RegistrationApiV2.testEmail('sav004');
    createdEmails.push(email);

    const { status, body } = await api.registerSavings(
      RegistrationApiV2.minimalSavings(email),
    );

    expect(status).toBe(201);
    const success = body as RegistrationSuccessResponse;
    expect(success.data.finishRegistrationURL).toContain('savings');
  });

  // ─── SAV-005: Duplicate email ───

  test('SAV-005: duplicate savings email returns 409', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.LONG);
    const email = RegistrationApiV2.testEmail('sav005');
    createdEmails.push(email);

    log.step(1, 'First enrollment');
    const first = await api.registerSavings(RegistrationApiV2.minimalSavings(email));
    expect(first.status).toBe(201);

    log.step(2, 'Duplicate enrollment');
    const second = await api.registerSavings(RegistrationApiV2.minimalSavings(email));

    log.step(3, 'Verify 409');
    expect(second.status).toBe(409);
    expect(PublicGridApiV2.isError(second.body)).toBe(true);
    expect(PublicGridApiV2.errorCode(second.body)).toBe(API_V2_ERROR_CODES.CONFLICT);
  });
});
