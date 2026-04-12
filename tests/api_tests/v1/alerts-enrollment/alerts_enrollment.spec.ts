/**
 * API Tests: Alerts Enrollment Endpoint — ENG-2639
 *
 * Tests the shared partner enrollment endpoint that creates resident
 * accounts for energy savings alerts. Partners (Renew, Moved, Venn, etc.)
 * call this to onboard residents without them leaving the partner platform.
 *
 * Endpoint: POST /v1/resident/alerts-enrollment
 * Auth: Bearer token (RENEW_API_KEY in .env)
 *
 * Test plan: tests/test_plans/ENG-2639_renew_alerts_enrollment_api.md
 */

import { test, expect } from '@playwright/test';
import { AlertsEnrollmentApi } from '../../../resources/fixtures/api';
import { CleanUp } from '../../../resources/fixtures';
import { supabase } from '../../../resources/utils/supabase';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  AlertsEnrollmentRequestBody,
  AlertsPartnerCode,
} from '../../../resources/types';

const log = createLogger('AlertsEnrollment');

const EMAIL_PREFIX = 'pgtest+alerts-api';
const EMAIL_DOMAIN = '@joinpublicgrid.com';

/** Generate a unique test email to avoid collisions across runs */
function testEmail(suffix: string): string {
  const ts = Date.now().toString(36);
  return `${EMAIL_PREFIX}-${suffix}-${ts}${EMAIL_DOMAIN}`;
}

/** Build a valid request body with defaults */
function basePayload(overrides?: Partial<AlertsEnrollmentRequestBody>): AlertsEnrollmentRequestBody {
  return {
    partnerCode: 'renew',
    firstName: 'QATest',
    lastName: 'Alerts',
    email: testEmail('default'),
    streetAddress: '233 Broadway',
    city: 'New York',
    state: 'NY',
    zip: '10007',
    ...overrides,
  };
}

test.describe('Alerts Enrollment API — ENG-2639', () => {
  let api: AlertsEnrollmentApi;
  const createdEmails: string[] = [];

  test.beforeAll(() => {
    api = new AlertsEnrollmentApi();
  });

  test.afterAll(async () => {
    log.section('Cleanup');
    for (const email of createdEmails) {
      log.info('Cleaning up', { email });
      await CleanUp.Test_User_Clean_Up(email);
    }
  });

  // ═══════════════════════════════════════════════════
  // 1. Happy Path
  // ═══════════════════════════════════════════════════

  test.describe('Happy Path', () => {
    test('1.1: full enrollment with renew partner creates all DB records', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.MEDIUM);
      const email = testEmail('happy');
      createdEmails.push(email);

      log.step(1, 'Enroll user');
      const { status, body } = await api.enroll(basePayload({
        email,
        unitNumber: '4B',
        consentDate: '2026-04-15T14:30:00Z',
      }));

      log.step(2, 'Verify 200 success');
      expect(status).toBe(200);
      expect(AlertsEnrollmentApi.isSuccess(body)).toBe(true);
      expect(body).toHaveProperty('message', 'User successfully enrolled in savings alerts');

      log.step(3, 'Verify CottageUser');
      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('id, email, stripeCustomerID, termsAndConditionsDate, enrollmentPreference, isEligibleForRetargeting')
        .eq('email', email)
        .single();

      expect(cu).not.toBeNull();
      expect(cu!.stripeCustomerID).toBeTruthy();
      expect(cu!.enrollmentPreference).toBe('manual');
      expect(cu!.isEligibleForRetargeting).toBe(true);
      expect(cu!.termsAndConditionsDate).toBeTruthy();

      log.step(4, 'Verify ElectricAccount');
      const { data: ea } = await supabase
        .from('ElectricAccount')
        .select('id, status, utilityCompanyID, maintainedFor')
        .eq('cottageUserID', cu!.id)
        .single();

      expect(ea).not.toBeNull();
      expect(ea!.status).toBe('ELIGIBLE');
      expect(ea!.maintainedFor).toBeNull();
      expect(ea!.utilityCompanyID).toBeTruthy();

      log.step(5, 'Verify Property + Address');
      const { data: prop } = await supabase
        .from('Property')
        .select('type, unitNumber, externalLeaseID, addressID')
        .eq('electricAccountID', ea!.id)
        .single();

      expect(prop).not.toBeNull();
      expect(prop!.type).toBe('APARTMENT');
      expect(prop!.unitNumber).toBe('4B');
      expect(prop!.externalLeaseID).toBe(email);

      const { data: addr } = await supabase
        .from('Address')
        .select('street, city, state, zip, country')
        .eq('id', prop!.addressID)
        .single();

      expect(addr).not.toBeNull();
      expect(addr!.street).toBe('233 Broadway');
      expect(addr!.city).toBe('New York');
      expect(addr!.state).toBe('NY');
      expect(addr!.zip).toBe('10007');
      expect(addr!.country).toBe('US');

      log.step(6, 'Verify Referral links to Renew MoveInPartner');
      const { data: referral } = await supabase
        .from('Referrals')
        .select('referredBy, referralStatus')
        .eq('referred', cu!.id)
        .single();

      expect(referral).not.toBeNull();
      expect(referral!.referralStatus).toBe('complete');

      // Confirm the referredBy is the Renew MoveInPartner
      const { data: partner } = await supabase
        .from('MoveInPartner')
        .select('name')
        .eq('id', referral!.referredBy)
        .single();

      expect(partner).not.toBeNull();
      expect(partner!.name).toBe('Renew');

      log.step(7, 'Verify ResidentIdentity');
      const { data: ri } = await supabase
        .from('ResidentIdentity')
        .select('cottageUserID')
        .eq('cottageUserID', cu!.id)
        .single();

      expect(ri).not.toBeNull();

      log.step(8, 'Verify ChargeAccount');
      const { data: ca } = await supabase
        .from('ChargeAccount')
        .select('id, status, ledgerBalanceID')
        .eq('electricAccountID', ea!.id)
        .single();

      expect(ca).not.toBeNull();
      expect(ca!.status).toBe('active');
      expect(ca!.ledgerBalanceID).toBeTruthy();
    });

    test('1.4: enrollment without consentDate sets termsAndConditionsDate to creation time (via RPC)', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('no-consent');
      const beforeEnroll = new Date();
      createdEmails.push(email);

      const { status } = await api.enroll(basePayload({ email }));
      expect(status).toBe(200);

      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('termsAndConditionsDate')
        .eq('email', email)
        .single();

      // RPC sets termsAndConditionsDate even without consentDate — verify it's recent
      expect(cu!.termsAndConditionsDate).toBeTruthy();
      const tcdDate = new Date(cu!.termsAndConditionsDate as string);
      expect(tcdDate.getTime()).toBeGreaterThanOrEqual(beforeEnroll.getTime() - 5000);
    });

    test('1.5: enrollment without unitNumber leaves Property.unitNumber null', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('no-unit');
      createdEmails.push(email);

      const { status } = await api.enroll(basePayload({ email }));
      expect(status).toBe(200);

      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('id')
        .eq('email', email)
        .single();

      const { data: ea } = await supabase
        .from('ElectricAccount')
        .select('id')
        .eq('cottageUserID', cu!.id)
        .single();

      const { data: prop } = await supabase
        .from('Property')
        .select('unitNumber')
        .eq('electricAccountID', ea!.id)
        .single();

      expect(prop!.unitNumber).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════
  // 2. Cross-Partner Enrollment
  // ═══════════════════════════════════════════════════

  test.describe('Cross-Partner', () => {
    test('2.1: moved partner creates Referral linked to Moved MoveInPartner', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('moved');
      createdEmails.push(email);

      const { status } = await api.enroll(basePayload({ email, partnerCode: 'moved' }));
      expect(status).toBe(200);

      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('id')
        .eq('email', email)
        .single();

      const { data: referral } = await supabase
        .from('Referrals')
        .select('referredBy')
        .eq('referred', cu!.id)
        .single();

      const { data: partner } = await supabase
        .from('MoveInPartner')
        .select('name')
        .eq('id', referral!.referredBy)
        .single();

      expect(partner!.name).toBe('Moved');
    });

    test('2.3: roofstock partner creates NO Referral (empty partner ID)', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('roofstock');
      createdEmails.push(email);

      const { status } = await api.enroll(basePayload({ email, partnerCode: 'roofstock' }));
      expect(status).toBe(200);

      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('id')
        .eq('email', email)
        .single();

      const { data: referrals } = await supabase
        .from('Referrals')
        .select('id')
        .eq('referred', cu!.id);

      expect(referrals).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // 3. Utility Company Mapping
  // ═══════════════════════════════════════════════════

  test.describe('Utility Mapping', () => {
    test('3.1: Boston zip 02101 maps to Eversource', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('eversource');
      createdEmails.push(email);

      const { status } = await api.enroll(basePayload({
        email,
        streetAddress: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
      }));
      expect(status).toBe(200);

      const { data: cu } = await supabase
        .from('CottageUsers')
        .select('id')
        .eq('email', email)
        .single();

      const { data: ea } = await supabase
        .from('ElectricAccount')
        .select('utilityCompanyID')
        .eq('cottageUserID', cu!.id)
        .single();

      expect(ea!.utilityCompanyID).toBe('EVERSOURCE');
    });

    test('3.4: zip with no utility returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enroll(basePayload({
        email: testEmail('no-util'),
        streetAddress: '155 N Nebraska Ave',
        city: 'Casper',
        state: 'WY',
        zip: '82609',
      }));

      expect(status).toBe(400);
      expect(JSON.stringify(body)).toContain('No utility company found for zip code 82609');
    });
  });

  // ═══════════════════════════════════════════════════
  // 5. Authentication
  // ═══════════════════════════════════════════════════

  test.describe('Authentication', () => {
    test('5.1: missing Authorization header returns 401', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollNoAuth(basePayload({
        email: testEmail('no-auth'),
      }));

      expect(status).toBe(401);
      expect(JSON.stringify(body)).toContain('missing authorization header');
    });

    test('5.2: invalid Bearer token returns 401', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollBadToken(basePayload({
        email: testEmail('bad-token'),
      }));

      expect(status).toBe(401);
      expect(JSON.stringify(body)).toContain('invalid authorization header');
    });
  });

  // ═══════════════════════════════════════════════════
  // 6. Zod Validation Errors
  // ═══════════════════════════════════════════════════

  test.describe('Validation', () => {
    test('6.1: empty body returns 400 listing all required fields', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({});

      expect(status).toBe(400);
      const msg = JSON.stringify(body);
      expect(msg).toContain('partnerCode');
      expect(msg).toContain('firstName');
      expect(msg).toContain('email');
    });

    test('6.3: invalid partnerCode returns 400 with valid options', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({
        ...basePayload({ email: testEmail('bad-partner') }),
        partnerCode: 'invalid_partner',
      });

      expect(status).toBe(400);
      const msg = JSON.stringify(body);
      expect(msg).toContain('moved');
      expect(msg).toContain('renew');
    });

    test('6.4: invalid email format returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({
        ...basePayload(),
        email: 'not-an-email',
      });

      expect(status).toBe(400);
      expect(JSON.stringify(body)).toContain('Invalid email');
    });

    test('6.6: state too long (3 chars) returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status } = await api.enrollRaw({
        ...basePayload({ email: testEmail('bad-state') }),
        state: 'MAS',
      });

      expect(status).toBe(400);
    });

    test('6.8: zip too long (6 digits) returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status } = await api.enrollRaw({
        ...basePayload({ email: testEmail('bad-zip') }),
        zip: '021019',
      });

      expect(status).toBe(400);
    });

    test('6.9: empty firstName returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({
        ...basePayload({ email: testEmail('empty-name') }),
        firstName: '',
      });

      expect(status).toBe(400);
      expect(JSON.stringify(body)).toContain('firstName');
    });

    test('6.11: invalid consentDate format returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({
        ...basePayload({ email: testEmail('bad-date') }),
        consentDate: 'not-a-date',
      });

      expect(status).toBe(400);
      expect(JSON.stringify(body)).toContain('ISO datetime');
    });

    test('6.12: wrong type (number) for firstName returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enrollRaw({
        ...basePayload({ email: testEmail('wrong-type') }),
        firstName: 123,
      });

      expect(status).toBe(400);
      expect(JSON.stringify(body)).toContain('expected string');
    });
  });

  // ═══════════════════════════════════════════════════
  // 7. Business Logic Errors
  // ═══════════════════════════════════════════════════

  test.describe('Business Logic', () => {
    test('7.1: duplicate email returns 400', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.MEDIUM);
      const email = testEmail('dup');
      createdEmails.push(email);

      log.step(1, 'Create first user');
      const first = await api.enroll(basePayload({ email }));
      expect(first.status).toBe(200);

      log.step(2, 'Attempt duplicate');
      const second = await api.enroll(basePayload({ email }));
      expect(second.status).toBe(400);
      expect(JSON.stringify(second.body)).toContain(`User with email ${email} already exists`);
    });

    test('7.2: email case insensitive — uppercase duplicate detected', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.MEDIUM);
      const email = testEmail('case');
      createdEmails.push(email);

      log.step(1, 'Create with lowercase');
      const first = await api.enroll(basePayload({ email }));
      expect(first.status).toBe(200);

      log.step(2, 'Attempt with uppercase');
      const second = await api.enroll(basePayload({ email: email.toUpperCase() }));
      expect(second.status).toBe(400);
      expect(JSON.stringify(second.body)).toContain('already exists');
    });
  });

  // ═══════════════════════════════════════════════════
  // 8. HTTP Method & Content-Type
  // ═══════════════════════════════════════════════════

  test.describe('HTTP Methods', () => {
    const unsupportedMethods = ['GET', 'PUT', 'DELETE', 'PATCH'] as const;

    for (const method of unsupportedMethods) {
      test(`8: ${method} returns 404`, {
        tag: [TEST_TAGS.API],
      }, async () => {
        test.setTimeout(TIMEOUTS.DEFAULT);
        const { status } = await api.sendMethod(method);
        expect(status).toBe(404);
      });
    }
  });

  // ═══════════════════════════════════════════════════
  // 9. Edge Cases
  // ═══════════════════════════════════════════════════

  test.describe('Edge Cases', () => {
    test('9.2: extra unknown fields are silently stripped', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const email = testEmail('extra');
      createdEmails.push(email);

      const { status } = await api.enrollRaw({
        ...basePayload({ email }),
        phone: '1234567890',
        unknownField: 'value',
      });

      expect(status).toBe(200);
    });

    test('9.3: very long firstName (250+ chars) returns 500 — known bug ENG-2666', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.enroll(basePayload({
        email: testEmail('long-name'),
        firstName: 'A'.repeat(288),
      }));

      // Known bug: returns 500 instead of 400
      expect(status).toBe(500);
      expect(JSON.stringify(body)).toContain('Internal server error');
    });

    test('9.6: consentDate without Z suffix (date-only) is rejected', {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status } = await api.enrollRaw({
        ...basePayload({ email: testEmail('date-only') }),
        consentDate: '2026-04-15',
      });

      expect(status).toBe(400);
    });
  });
});
