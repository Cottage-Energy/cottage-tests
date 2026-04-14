/**
 * API Tests: Moved Direct to Consumer — ENG-2687
 *
 * Endpoints:
 *   GET  /v1/utilities/availability/{zip}
 *   POST /v1/moved/embed
 *
 * The Moved Personal Dashboard calls these endpoints to (1) check zip-level
 * utility coverage and (2) generate a pre-formatted iframe URL pointing at
 * the encouraged-conversion move-in flow with `shortCode=moved`.
 *
 * Auth: Bearer token (MOVED_API_KEY in .env)
 *
 * Test plan: tests/test_plans/ENG-2687_moved_direct_to_consumer.md
 *
 * Notable spec-vs-reality findings asserted here (see test plan for full list):
 *   D1  — Path is /v1/...  (NOT /api/v1/...)
 *   D2  — Embed URL params are streetAddress/unitNumber (docs say street/unit)
 *   D3  — Embed URL host is dev.onepublicgrid.com/move-in (env-aware, hyphen)
 *   D4  — internalID is mapped to leaseID URL param (undocumented)
 *   D7  — `resident` object is required (docs imply optional)
 *   B1  — moveInDate -4 days is accepted; spec says "more than 3 days in past" should reject
 */

import { test, expect } from '@playwright/test';
import { MovedEmbedApi } from '../../../resources/fixtures/api';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  MovedEmbedRequestBody,
  MovedEmbedSuccessResponse,
  AvailabilitySuccessResponse,
} from '../../../resources/types';

const log = createLogger('MovedEmbed');

/** Date helper — N days from today as YYYY-MM-DD */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Build a valid embed payload with sensible defaults */
function basePayload(overrides?: Partial<MovedEmbedRequestBody>): MovedEmbedRequestBody {
  return {
    isTransfer: false,
    resident: {
      internalID: `moved-test-${Date.now().toString(36)}`,
      firstName: 'Anna',
      lastName: 'Carter',
      email: `pgtest+moved-api-${Date.now().toString(36)}@joinpublicgrid.com`,
      phone: '5551234567',
      dateOfBirth: '1990-05-15',
      moveInDate: dateOffset(15),
    },
    property: {
      street: '233 Broadway',
      unitNumber: '4B',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
    ...overrides,
  };
}

test.describe('Moved Direct to Consumer API — ENG-2687', () => {
  let api: MovedEmbedApi;

  test.beforeAll(() => {
    api = new MovedEmbedApi();
  });

  // ═══════════════════════════════════════════════════
  // GET /v1/utilities/availability/{zip}
  // ═══════════════════════════════════════════════════

  test.describe('GET availability — Happy Path', () => {
    test('TC-A01: NY zip returns Con Edison pgEnabled=true', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.getAvailability('10001');

      expect(status).toBe(200);
      expect(MovedEmbedApi.isAvailabilitySuccess(body)).toBe(true);

      const success = body as AvailabilitySuccessResponse;
      expect(success.utilityProviders.length).toBeGreaterThan(0);

      const conEd = success.utilityProviders.find(p => p.utilityCompanyID === 'CON-EDISON');
      expect(conEd).toBeDefined();
      expect(conEd!.isPrimaryUtility).toBe(true);
      expect(conEd!.pgEnabled).toBe(true);
      expect(conEd!.utilityCompanyName).toBe('Con Edison');
    });

    test('TC-A02: TX zip returns TX-DEREG primary', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.getAvailability('75063');

      expect(status).toBe(200);
      const success = body as AvailabilitySuccessResponse;
      const txDereg = success.utilityProviders.find(p => p.utilityCompanyID === 'TX-DEREG');
      expect(txDereg).toBeDefined();
      expect(txDereg!.isPrimaryUtility).toBe(true);
      expect(txDereg!.pgEnabled).toBe(true);
    });

    test('TC-A03: LA zip returns LA-DWP pgEnabled=false (signals partner to show fallback)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.getAvailability('90210');

      expect(status).toBe(200);
      const success = body as AvailabilitySuccessResponse;
      const ladwp = success.utilityProviders.find(p => p.utilityCompanyID === 'LA-DWP');
      expect(ladwp).toBeDefined();
      // D5 — docs example shows pgEnabled=true; reality is false in dev
      expect(ladwp!.pgEnabled).toBe(false);
    });

    test('TC-A04: out-of-coverage zip returns secondary-only providers (waitlist signal)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.getAvailability('82609'); // Casper, WY

      expect(status).toBe(200);
      const success = body as AvailabilitySuccessResponse;
      // D8 — docs say "no providers = not in coverage"; reality returns secondary-only
      expect(success.utilityProviders.length).toBeGreaterThan(0);
      const hasPrimary = success.utilityProviders.some(p => p.isPrimaryUtility);
      expect(hasPrimary).toBe(false);
    });
  });

  test.describe('GET availability — Validation', () => {
    test('TC-A10: 4-digit zip rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailability('1000');
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Too small');
    });

    test('TC-A11: 6-digit zip rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailability('100012');
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Too big');
    });

    test('TC-A12: extended zip (90210-2111) rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailability('90210-2111');
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Too big');
    });

    test('TC-A13: non-numeric zip rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.getAvailability('abc');
      expect(status).toBe(400);
    });

    test('TC-A14: all-zeros zip returns either 200 (empty providers) or 400', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailability('00000');
      // Currently returns 200 — log behavior for documentation
      expect([200, 400]).toContain(status);
      log.info('00000 zip behavior', { status, body });
    });
  });

  test.describe('GET availability — Authentication', () => {
    test('TC-A20: missing Authorization header → 401', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailabilityNoAuth('10001');
      expect(status).toBe(401);
      expect((body as { error?: string }).error).toContain('missing authorization header');
    });

    test('TC-A21: invalid Bearer token → 401', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.getAvailabilityBadToken('10001');
      expect(status).toBe(401);
      expect((body as { error?: string }).error).toContain('invalid authorization header');
    });

    test('TC-A22: token without Bearer prefix → 401', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.getAvailabilityRawToken('10001');
      expect(status).toBe(401);
    });
  });

  test.describe('GET availability — HTTP Methods', () => {
    test('TC-A30: POST on availability returns 404', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.sendMethod('/v1/utilities/availability/10001', 'POST');
      expect([404, 405]).toContain(status);
    });
  });

  test.describe('GET availability — Response Schema', () => {
    test('TC-A40: provider shape matches spec (D5/D6 currently fail — phone/website)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { body } = await api.getAvailability('10001');
      const success = body as AvailabilitySuccessResponse;
      const p = success.utilityProviders[0];
      expect(typeof p.isPrimaryUtility).toBe('boolean');
      expect(typeof p.pgEnabled).toBe('boolean');
      expect(typeof p.utilityCompanyID).toBe('string');
      expect(typeof p.utilityCompanyName).toBe('string');
      // phone is null in dev (D6 — docs say string|null, fine)
      expect(p.phone === null || typeof p.phone === 'string').toBe(true);
      // D6 — docs say URL string; reality is empty string. Document the gap.
      expect(typeof p.website).toBe('string');
    });

    test('TC-A41: phone field consistency — null or string', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const zips = ['10001', '75063', '90210', '82609'];
      for (const zip of zips) {
        const { body } = await api.getAvailability(zip);
        const success = body as AvailabilitySuccessResponse;
        for (const p of success.utilityProviders) {
          expect(p.phone === null || typeof p.phone === 'string').toBe(true);
        }
      }
    });

    test('TC-A42: website field is currently empty string for known utilities (D6)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      // EXPECTED FAILURE PER SPEC — docs say website should be a URL.
      // This test asserts current behavior so we notice when it changes.
      const { body } = await api.getAvailability('10001');
      const success = body as AvailabilitySuccessResponse;
      const conEd = success.utilityProviders.find(p => p.utilityCompanyID === 'CON-EDISON');
      expect(conEd!.website).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════
  // POST /v1/moved/embed
  // ═══════════════════════════════════════════════════

  test.describe('POST embed — Happy Path', () => {
    test('TC-E01: full payload returns embed URL with all fields encoded', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const payload = basePayload();
      const { status, body } = await api.createEmbed(payload);

      expect(status).toBe(200);
      expect(MovedEmbedApi.isEmbedSuccess(body)).toBe(true);

      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('shortCode=moved');
      expect(url).toContain('firstName=Anna');
      expect(url).toContain('lastName=Carter');
      // D2 — uses streetAddress/unitNumber (NOT street/unit)
      expect(url).toContain('streetAddress=233+Broadway');
      expect(url).toContain('unitNumber=4B');
      expect(url).toContain('zip=10001');
    });

    test('TC-E02: minimal payload (resident:{} + zip) returns embed URL', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '10001' },
      });

      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('shortCode=moved');
      expect(url).toContain('zip=10001');
    });

    test('TC-E03: isTransfer=true returns embed URL', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        isTransfer: true,
        resident: {},
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('shortCode=moved');
      // Document whether transfer changes the URL — currently no transfer signal in URL
      log.info('isTransfer=true URL', { url });
    });

    test('TC-E04: internalID mapped to leaseID URL param (D4)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { internalID: 'user_12345' },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('leaseID=user_12345');
      expect(url).not.toContain('internalID=');
    });

    test('TC-E05: street/unitNumber map to streetAddress/unitNumber URL params (D2)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { street: '123 Main St', unitNumber: '4B', zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('streetAddress=123+Main+St');
      expect(url).toContain('unitNumber=4B');
      expect(url).not.toContain('street=123');
      expect(url).not.toContain('unit=4B');
    });

    test('TC-E06: special chars in name URL-encoded', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { firstName: "Jean-Luc O'Brien" },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('firstName=Jean-Luc+O%27Brien');
    });

    test('TC-E07: TX zip returns Moved-shortCode embed (not txtest)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '75063' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('shortCode=moved');
      expect(url).toContain('zip=75063');
    });

    test('TC-E08: out-of-coverage zip still returns embed URL (flow handles waitlist)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '82609' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('zip=82609');
    });
  });

  test.describe('POST embed — Validation: resident', () => {
    test('TC-E10: empty body rejected with errors for both resident and property', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRaw({});
      expect(status).toBe(400);
      const msg = (body as { message?: string }).message ?? '';
      expect(msg).toContain('resident');
      expect(msg).toContain('property');
    });

    test('TC-E11: missing resident object rejected (D7 — docs imply optional)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRaw({ property: { zip: '10001' } });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('resident');
    });

    test('TC-E12: invalid email format rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { email: 'not-an-email' },
        property: { zip: '10001' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Invalid email');
    });

    test('TC-E13: invalid moveInDate format rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { moveInDate: '01/15/2025' },
        property: { zip: '10001' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Invalid ISO date');
    });

    test('TC-E14: invalid dateOfBirth format rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { dateOfBirth: '15/05/1990' },
        property: { zip: '10001' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Invalid ISO date');
    });

    test('TC-E15: moveInDate 30 days in past rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { moveInDate: dateOffset(-30) },
        property: { zip: '10001' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('moveInDate cannot be more than 3 days in the past');
    });

    test('TC-E16: moveInDate 4 days in past rejected (boundary test for B1)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      // B1 — earlier probing observed -4d sometimes accepted (likely timezone drift between
      // client/server day rollover). Per spec literal "more than 3 days in past" → -4 should reject.
      // This test asserts the spec interpretation; if the boundary becomes flaky in CI, mark @flaky.
      const { status, body } = await api.createEmbed({
        resident: { moveInDate: dateOffset(-4) },
        property: { zip: '10001' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('moveInDate cannot be more than 3 days in the past');
    });

    test('TC-E17: moveInDate exactly 3 days in past accepted', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.createEmbed({
        resident: { moveInDate: dateOffset(-3) },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
    });

    test('TC-E18: moveInDate today accepted', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.createEmbed({
        resident: { moveInDate: dateOffset(0) },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
    });
  });

  test.describe('POST embed — Validation: property', () => {
    test('TC-E20: missing zip rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRaw({
        resident: {},
        property: {},
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('zip');
    });

    test('TC-E21: zip too short rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '123' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Too small');
    });

    test('TC-E22: state longer than 2 chars rejected', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '10001', state: 'New York' },
      });
      expect(status).toBe(400);
      expect((body as { message?: string }).message).toContain('Too big');
    });

    test('TC-E23: state lowercase currently accepted', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: {},
        property: { zip: '10001', state: 'ny' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('state=ny');
    });
  });

  test.describe('POST embed — Authentication', () => {
    test('TC-E30: missing auth header → 401', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedNoAuth({
        resident: {},
        property: { zip: '10001' },
      });
      expect(status).toBe(401);
      expect((body as { error?: string }).error).toContain('missing authorization header');
    });

    test('TC-E31: invalid Bearer token → 401', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedBadToken({
        resident: {},
        property: { zip: '10001' },
      });
      expect(status).toBe(401);
      expect((body as { error?: string }).error).toContain('invalid authorization header');
    });
  });

  test.describe('POST embed — HTTP Methods', () => {
    test('TC-E40: GET on /v1/moved/embed returns 404', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status } = await api.sendMethod('/v1/moved/embed', 'GET');
      expect([404, 405]).toContain(status);
    });

    test('TC-E41: malformed JSON body → 400 with FST_ERR_CTP_INVALID_JSON_BODY', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRawString('{not valid');
      expect(status).toBe(400);
      expect((body as { code?: string }).code).toBe('FST_ERR_CTP_INVALID_JSON_BODY');
    });
  });

  test.describe('POST embed — Negative / Security', () => {
    test('TC-E50: SQL-injection-like firstName URL-encoded into embed URL (no DB impact)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { firstName: "Robert'); DROP TABLE users;--" },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('firstName=');
      // Single quote percent-encoded as %27
      expect(url).toMatch(/firstName=Robert%27%29/);
    });

    test('TC-E51: XSS string in lastName URL-encoded (verify inert in iframe separately)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbed({
        resident: { lastName: '<script>alert(1)</script>' },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).toContain('lastName=%3Cscript%3E');
    });

    test('TC-E52: 1000-char firstName accepted (Bug B3 — no maxLength)', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      // EXPECTED FAILURE PER GOOD HYGIENE — no maxLength validation. When B3 is fixed,
      // invert to expect 400 with maxLength error.
      const longName = 'A'.repeat(1000);
      const { status } = await api.createEmbed({
        resident: { firstName: longName },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
    });

    test('TC-E53: extra unknown fields stripped from embed URL', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRaw({
        resident: { middleName: 'Q', ssn: '123-45-6789' },
        property: { zip: '10001', country: 'USA' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).not.toContain('middleName=');
      expect(url).not.toContain('ssn=');
      expect(url).not.toContain('country=');
    });

    test('TC-E54: SSN never echoed in URL (security regression guard)', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { status, body } = await api.createEmbedRaw({
        resident: { ssn: '123-45-6789' },
        property: { zip: '10001' },
      });
      expect(status).toBe(200);
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      expect(url).not.toContain('ssn');
      expect(url).not.toContain('123-45-6789');
    });
  });

  test.describe('POST embed — Response Schema', () => {
    test('TC-E60: response body is exactly { embedURL: string }', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const { body } = await api.createEmbed(basePayload());
      const keys = Object.keys(body as object);
      expect(keys).toEqual(['embedURL']);
    });

    test('TC-E61: embed URL host matches dev environment', {
      tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const env = process.env.ENV || 'dev';
      const { body } = await api.createEmbed(basePayload());
      const url = (body as MovedEmbedSuccessResponse).embedURL;
      const expectedHost =
        env === 'production'
          ? 'https://onepublicgrid.com'
          : env === 'staging'
            ? 'https://staging.onepublicgrid.com'
            : 'https://dev.onepublicgrid.com';
      expect(url).toContain(expectedHost);
      expect(url).toContain('/move-in?'); // D3 — hyphen, not /movein
    });

    test('TC-E62: embed URL always contains shortCode=moved', {
      tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1, TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);
      const inputs: MovedEmbedRequestBody[] = [
        basePayload(),
        { resident: {}, property: { zip: '10001' } },
        { resident: {}, property: { zip: '75063' } },
        { resident: {}, property: { zip: '82609' } },
      ];
      for (const input of inputs) {
        const { body } = await api.createEmbed(input);
        const url = (body as MovedEmbedSuccessResponse).embedURL;
        expect(url).toContain('shortCode=moved');
      }
    });
  });
});
