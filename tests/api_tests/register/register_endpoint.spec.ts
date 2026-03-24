/**
 * API Tests: Partner Register Endpoint — ENG-2407
 *
 * Tests the partner register endpoint used by RealPage/Zapier to create
 * resident accounts for the finish-registration flow.
 *
 * Endpoint: POST /v1/:partner/register
 * Auth: Bearer token (FINISH_REG_TOKEN in .env)
 *
 * Test plan: tests/test_plans/ENG-2407_register_endpoint_realpage.md
 * Flow doc: tests/docs/finish-registration-flow.md
 */

import { test, expect } from '@playwright/test';
import { RegisterApi } from '../../resources/fixtures/api';
import { CleanUp } from '../../resources/fixtures';
import { supabase } from '../../resources/utils/supabase';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import { createLogger } from '../../resources/utils/logger';
import type { RegisterRequestBody, RegisterSuccessResponse } from '../../resources/types';

const log = createLogger('RegisterEndpoint');

const EMAIL_PREFIX = 'pgtest+reg-api';
const EMAIL_DOMAIN = '@joinpublicgrid.com';

/** Generate a unique test email to avoid collisions across runs */
function testEmail(suffix: string): string {
  const ts = Date.now().toString(36);
  return `${EMAIL_PREFIX}-${suffix}-${ts}${EMAIL_DOMAIN}`;
}

/** Build a minimal valid request body */
function basePayload(overrides: Partial<RegisterRequestBody> & { email: string }): RegisterRequestBody {
  const { email, ...rest } = overrides;
  return {
    leaseID: `reg-api-${Date.now().toString(36)}`,
    resident: {
      firstName: 'QA',
      lastName: 'ApiTest',
      email,
      ...rest.resident,
    },
    enrollment: { type: 'move-in', ...rest.enrollment },
    ...(rest.building && { building: rest.building }),
    ...(rest.property && { property: rest.property }),
    ...(rest.leaseID !== undefined && { leaseID: rest.leaseID }),
  };
}

/** Query Property.externalLeaseID by email */
async function getExternalLeaseID(email: string): Promise<string | null> {
  const { data } = await supabase
    .from('CottageUsers')
    .select('id')
    .eq('email', email)
    .single();

  if (!data) return null;

  const { data: ea } = await supabase
    .from('ElectricAccount')
    .select('id')
    .eq('cottageUserID', data.id)
    .single();

  if (!ea) return null;

  const { data: prop } = await supabase
    .from('Property')
    .select('externalLeaseID')
    .eq('electricAccountID', ea.id)
    .single();

  return prop?.externalLeaseID ?? null;
}

test.describe('Register Endpoint — ENG-2407', () => {
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

  // ─── AC1: leaseID provided → used as external_lease_id ───

  test('AC1: leaseID at root is used as externalLeaseID', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('ac1');
    const leaseID = `ac1-${Date.now()}`;
    createdEmails.push(email);

    log.step(1, 'Register with leaseID at root');
    const { status, body } = await api.register({
      leaseID,
      resident: { firstName: 'QA', lastName: 'AC1', email },
      enrollment: { type: 'move-in' },
    });

    log.step(2, 'Verify success response');
    expect(status).toBe(201);
    expect(RegisterApi.isSuccess(body)).toBe(true);

    const success = body as RegisterSuccessResponse;
    expect(success.userId).toBeTruthy();
    expect(success.status).toBe('REGISTRATION_INCOMPLETE');
    expect(success.finishRegistrationURL).toContain('finish-registration');

    log.step(3, 'Verify leaseID in finish-registration URL');
    const urlLeaseID = RegisterApi.extractLeaseID(success.finishRegistrationURL);
    expect(urlLeaseID).toBe(leaseID);

    log.step(4, 'Verify DB stores leaseID');
    const dbLeaseID = await getExternalLeaseID(email);
    expect(dbLeaseID).toBe(leaseID);
  });

  // ─── AC2: Fallback to internalID|siteId ───

  test('AC2: fallback uses internalID|siteId when no leaseID', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('ac2');
    const internalID = `rp-${Date.now()}`;
    const siteId = `site-${Date.now()}`;
    const expectedLease = `${internalID}|${siteId}`;
    createdEmails.push(email);

    log.step(1, 'Register without leaseID but with fallback fields');
    const { status, body } = await api.register({
      resident: { firstName: 'QA', lastName: 'AC2', email, internalID },
      property: { siteId },
      enrollment: { type: 'verification' },
    });

    log.step(2, 'Verify success with VERIFICATION_INCOMPLETE status');
    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;
    expect(success.status).toBe('VERIFICATION_INCOMPLETE');

    log.step(3, 'Verify fallback leaseID in URL (pipe-encoded)');
    const urlLeaseID = RegisterApi.extractLeaseID(success.finishRegistrationURL);
    expect(urlLeaseID).toBe(expectedLease);

    log.step(4, 'Verify DB stores concatenated fallback');
    const dbLeaseID = await getExternalLeaseID(email);
    expect(dbLeaseID).toBe(expectedLease);
  });

  // ─── AC3: Missing internalID → error ───

  test('AC3: no leaseID + missing internalID is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Register without leaseID and without internalID');
    const { status, body } = await api.register({
      resident: { firstName: 'QA', lastName: 'AC3', email: testEmail('ac3') },
      property: { siteId: 'site-ac3' },
      enrollment: { type: 'move-in' },
    });

    log.step(2, 'Verify 400 with validation error');
    expect(status).toBe(400);
    expect(JSON.stringify(body)).toContain('leaseID');
  });

  // ─── AC4: Missing siteId → error ───

  test('AC4: no leaseID + missing siteId is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Register without leaseID and without siteId');
    const { status, body } = await api.register({
      resident: {
        firstName: 'QA',
        lastName: 'AC4',
        email: testEmail('ac4'),
        internalID: 'rp-ac4',
      },
      enrollment: { type: 'move-in' },
    });

    log.step(2, 'Verify 400 with validation error');
    expect(status).toBe(400);
    expect(JSON.stringify(body)).toContain('leaseID');
  });

  // ─── AC5: Duplicate externalLeaseID → error ───

  test('AC5: duplicate leaseID is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.MEDIUM);
    const email1 = testEmail('ac5a');
    const email2 = testEmail('ac5b');
    const sharedLease = `dup-${Date.now()}`;
    createdEmails.push(email1);

    log.step(1, 'Register first user with leaseID');
    const first = await api.register({
      leaseID: sharedLease,
      resident: { firstName: 'QA', lastName: 'AC5First', email: email1 },
      enrollment: { type: 'move-in' },
    });
    expect(first.status).toBe(201);

    log.step(2, 'Attempt second registration with same leaseID');
    const second = await api.register({
      leaseID: sharedLease,
      resident: { firstName: 'QA', lastName: 'AC5Second', email: email2 },
      enrollment: { type: 'move-in' },
    });

    log.step(3, 'Verify duplicate is rejected');
    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain(sharedLease);
  });

  // ─── AC6: Finish-registration URL contains leaseID ───

  test('AC6: finish-registration URL includes leaseID param', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('ac6');
    const leaseID = `ac6-${Date.now()}`;
    createdEmails.push(email);

    log.step(1, 'Register with full payload');
    const { status, body } = await api.register({
      leaseID,
      resident: { firstName: 'QA', lastName: 'AC6', email, phone: '1111111111' },
      property: {
        street: '123 Main St',
        unitNumber: '4B',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        siteId: 'site-ac6',
      },
      enrollment: { type: 'move-in', moveInDate: '2026-04-01' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;

    log.step(2, 'Verify all expected URL params');
    const url = new URL(success.finishRegistrationURL);
    expect(url.searchParams.get('leaseID')).toBe(leaseID);
    expect(url.searchParams.get('token')).toBeTruthy();
    expect(url.searchParams.get('email')).toBe(email);
    expect(url.searchParams.get('streetAddress')).toBe('123 Main St');
    expect(url.searchParams.get('city')).toBe('New York');
    expect(url.searchParams.get('state')).toBe('NY');
    expect(url.searchParams.get('zip')).toBe('10001');
    expect(url.searchParams.get('unitNumber')).toBe('4B');
  });

  // ─── leaseID Priority ───

  test('leaseID at root takes priority over fallback fields', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('priority');
    const leaseID = `priority-${Date.now()}`;
    createdEmails.push(email);

    const { status, body } = await api.register({
      leaseID,
      resident: { firstName: 'QA', lastName: 'Priority', email, internalID: 'should-not-use' },
      property: { siteId: 'also-not-used' },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(201);
    const dbLeaseID = await getExternalLeaseID(email);
    expect(dbLeaseID).toBe(leaseID);
  });

  // ─── Partner Slug ───

  test('registration via realpage partner slug succeeds', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('realpage');
    const leaseID = `rp-slug-${Date.now()}`;
    createdEmails.push(email);

    const { status } = await api.register(
      {
        leaseID,
        resident: { firstName: 'QA', lastName: 'RealPage', email },
        enrollment: { type: 'move-in' },
      },
      'realpage',
    );

    expect(status).toBe(201);
  });

  // ─── Minimal Payload ───

  test('minimal payload (4 required fields + leaseID) succeeds', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('minimal');
    createdEmails.push(email);

    const { status, body } = await api.register({
      leaseID: `min-${Date.now()}`,
      resident: { firstName: 'Min', lastName: 'Payload', email },
      enrollment: { type: 'verification' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;
    expect(success.status).toBe('VERIFICATION_INCOMPLETE');
  });

  // ─── Duplicate Email ───

  test('duplicate email is rejected with 409', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.MEDIUM);
    const email = testEmail('dupemail');
    createdEmails.push(email);

    const first = await api.register({
      leaseID: `dup-e1-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'DupEmail', email },
      enrollment: { type: 'move-in' },
    });
    expect(first.status).toBe(201);

    const second = await api.register({
      leaseID: `dup-e2-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'DupEmail2', email },
      enrollment: { type: 'move-in' },
    });

    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain(email);
  });

  // ─── Cross-Format Duplicate ───

  test('leaseID matching existing fallback value is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.MEDIUM);
    const email1 = testEmail('crossfmt1');
    const email2 = testEmail('crossfmt2');
    const internalID = `rp-xfmt-${Date.now()}`;
    const siteId = `site-xfmt-${Date.now()}`;
    createdEmails.push(email1);

    log.step(1, 'Create via fallback');
    const first = await api.register({
      resident: { firstName: 'QA', lastName: 'XFmt1', email: email1, internalID },
      property: { siteId },
      enrollment: { type: 'move-in' },
    });
    expect(first.status).toBe(201);

    log.step(2, 'Attempt with leaseID matching fallback format');
    const second = await api.register({
      leaseID: `${internalID}|${siteId}`,
      resident: { firstName: 'QA', lastName: 'XFmt2', email: email2 },
      enrollment: { type: 'move-in' },
    });

    expect(second.status).toBe(409);
  });

  // ─── Partial Address → No Address in URL ───

  test('partial address omits all address params from URL', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('partaddr');
    createdEmails.push(email);

    const { status, body } = await api.register({
      leaseID: `pa-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'PartAddr', email },
      property: { street: '789 Elm St', siteId: 'site-partial' },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(201);
    const success = body as RegisterSuccessResponse;
    const url = new URL(success.finishRegistrationURL);
    expect(url.searchParams.has('streetAddress')).toBe(false);
    expect(url.searchParams.has('city')).toBe(false);
    expect(url.searchParams.get('leaseID')).toBeTruthy();
  });

  // ─── No Auth ───

  test('request without auth header is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await api.registerNoAuth({
      leaseID: 'no-auth',
      resident: { firstName: 'QA', lastName: 'NoAuth', email: testEmail('noauth') },
      enrollment: { type: 'move-in' },
    });

    expect(JSON.stringify(body)).toContain('authorization');
  });

  // ─── moveInDate Validation ───

  test('moveInDate more than 3 days in past is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dateStr = pastDate.toISOString().split('T')[0];

    const { status, body } = await api.register({
      leaseID: `olddate-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'OldDate', email: testEmail('olddate') },
      enrollment: { type: 'move-in', moveInDate: dateStr },
    });

    expect(status).toBe(400);
    expect(JSON.stringify(body)).toContain('moveInDate');
  });

  // ─── moveInDate Boundary (3 days ago — should pass) ───

  test('moveInDate exactly 3 days ago is accepted', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('3days');
    const boundary = new Date();
    boundary.setDate(boundary.getDate() - 3);
    const dateStr = boundary.toISOString().split('T')[0];
    createdEmails.push(email);

    const { status } = await api.register({
      leaseID: `3day-${Date.now()}`,
      resident: { firstName: 'QA', lastName: 'Boundary', email },
      enrollment: { type: 'move-in', moveInDate: dateStr },
    });

    expect(status).toBe(201);
  });

  // ─── Missing Required Fields ───

  test('missing firstName is rejected with 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.register({
      leaseID: 'no-fname',
      resident: { firstName: '', lastName: 'NoFirst', email: testEmail('nofirst') },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(400);
  });

  test('invalid email format is rejected with 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.register({
      leaseID: 'bad-email',
      resident: { firstName: 'QA', lastName: 'BadEmail', email: 'not-an-email' },
      enrollment: { type: 'move-in' },
    });

    expect(status).toBe(400);
    expect(JSON.stringify(body)).toContain('email');
  });

  test('invalid enrollment.type is rejected with 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.register({
      leaseID: 'bad-type',
      resident: { firstName: 'QA', lastName: 'BadType', email: testEmail('badtype') },
      enrollment: { type: 'transfer' as 'move-in' },
    });

    expect(status).toBe(400);
  });

  // ─── No Orphaned Records ───

  test('failed requests do not create orphaned DB records', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const email = testEmail('orphan');

    log.step(1, 'Send request that will fail (missing identifiers)');
    const { status } = await api.register({
      resident: { firstName: 'QA', lastName: 'Orphan', email },
      enrollment: { type: 'move-in' },
    });
    expect(status).toBe(400);

    log.step(2, 'Verify no CottageUser created');
    const { data } = await supabase
      .from('CottageUsers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    expect(data).toBeNull();
  });
});
