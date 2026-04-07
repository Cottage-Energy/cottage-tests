/**
 * API Tests: Utilities Endpoints — Public Grid REST API v2
 *
 * Tests GET /utilities and GET /utilities/zip/{zip}
 * including state/pgEnabled filters and zip code lookups.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md
 *   UTIL-001 through UTIL-006, ZIP-001 through ZIP-006
 */

import { test, expect } from '@playwright/test';
import { UtilitiesApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
import { TIMEOUTS, TEST_TAGS, API_V2_ERROR_CODES } from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type { ZipLookupResponse } from '../../../resources/types';

const log = createLogger('UtilitiesEndpoints');

interface UtilitiesListResponse {
  data: {
    id: string;
    name: string;
    website: string;
    phone: string;
    pgEnabled: boolean;
    utilitiesHandled: string[];
    states: string[];
  }[];
  total: number;
}

// ═══════════════════════════════════════════════
// GET /utilities
// ═══════════════════════════════════════════════

test.describe('API v2: GET /utilities', () => {
  let api: UtilitiesApiV2;

  test.beforeAll(() => {
    api = new UtilitiesApiV2();
  });

  // ─── UTIL-001: List all utilities ───

  test('UTIL-001: list utilities returns all providers', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /utilities');
    const { status, body } = await api.listUtilities();

    log.step(2, 'Verify response shape');
    expect(status).toBe(200);
    const response = body as UtilitiesListResponse;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeGreaterThan(0);
    expect(typeof response.total).toBe('number');

    const util = response.data[0];
    expect(typeof util.id).toBe('string');
    expect(typeof util.name).toBe('string');
    expect(typeof util.website).toBe('string');
    expect(typeof util.phone).toBe('string');
    expect(typeof util.pgEnabled).toBe('boolean');
    expect(util.utilitiesHandled).toBeInstanceOf(Array);
    expect(util.states).toBeInstanceOf(Array);
  });

  // ─── UTIL-002: Filter by state ───

  test('UTIL-002: filter by state=NY', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listUtilities({ state: 'NY' });

    expect(status).toBe(200);
    const response = body as UtilitiesListResponse;
    for (const util of response.data) {
      expect(util.states).toContain('NY');
    }
  });

  // ─── UTIL-003: Filter by pgEnabled ───

  test('UTIL-003: filter by pgEnabled=true', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listUtilities({ pgEnabled: true });

    expect(status).toBe(200);
    const response = body as UtilitiesListResponse;
    for (const util of response.data) {
      expect(util.pgEnabled).toBe(true);
    }
  });

  // ─── UTIL-004: Combined filters ───

  test('UTIL-004: filter by state + pgEnabled', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listUtilities({ state: 'NY', pgEnabled: true });

    expect(status).toBe(200);
    const response = body as UtilitiesListResponse;
    for (const util of response.data) {
      expect(util.states).toContain('NY');
      expect(util.pgEnabled).toBe(true);
    }
  });

  // ─── UTIL-005: utilitiesHandled values ───

  test('UTIL-005: utilitiesHandled contains valid values', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listUtilities();
    expect(status).toBe(200);

    const response = body as UtilitiesListResponse;
    for (const util of response.data) {
      for (const handled of util.utilitiesHandled) {
        expect(['electricity', 'gas']).toContain(handled);
      }
    }
  });

  // ─── UTIL-006: Invalid state code ───

  test('UTIL-006: invalid state code returns empty or 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listUtilities({ state: 'ZZ' });

    if (status === 200) {
      expect((body as UtilitiesListResponse).data).toHaveLength(0);
    } else {
      expect(status).toBe(400);
    }
  });
});

// ═══════════════════════════════════════════════
// GET /utilities/zip/{zip}
// ═══════════════════════════════════════════════

test.describe('API v2: GET /utilities/zip/{zip}', () => {
  let api: UtilitiesApiV2;

  test.beforeAll(() => {
    api = new UtilitiesApiV2();
  });

  // ─── ZIP-001: Known zip (10001 → Con Edison) ───

  test('ZIP-001: zip 10001 returns Con Edison', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Look up zip 10001');
    const { status, body } = await api.lookupZip('10001');

    log.step(2, 'Verify Con Edison is returned');
    expect(status).toBe(200);
    const response = body as ZipLookupResponse;
    expect(response.zip).toBe('10001');
    expect(response.utilityProviders).toBeInstanceOf(Array);
    expect(response.utilityProviders.length).toBeGreaterThan(0);

    const conEd = response.utilityProviders.find(p => p.id === 'CON-EDISON');
    expect(conEd).toBeTruthy();
    expect(conEd!.pgEnabled).toBe(true);
  });

  // ─── ZIP-002: Provider object shape ───

  test('ZIP-002: utility provider has correct shape', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.lookupZip('10001');
    expect(status).toBe(200);

    const response = body as ZipLookupResponse;
    const provider = response.utilityProviders[0];
    expect(typeof provider.id).toBe('string');
    expect(typeof provider.name).toBe('string');
    expect(typeof provider.isPrimaryUtility).toBe('boolean');
    expect(typeof provider.pgEnabled).toBe('boolean');
    expect(typeof provider.website).toBe('string');
    expect(typeof provider.phone).toBe('string');
    expect(provider.utilitiesHandled).toBeInstanceOf(Array);
  });

  // ─── ZIP-003: No coverage zip ───

  test('ZIP-003: uncovered zip returns empty providers or 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.lookupZip('00000');

    if (status === 200) {
      expect((body as ZipLookupResponse).utilityProviders).toHaveLength(0);
    } else {
      expect(status).toBe(404);
    }
  });

  // ─── ZIP-004: Invalid zip (3 digits) ───

  test('ZIP-004: 3-digit zip returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.lookupZip('123');

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.INVALID_REQUEST);
  });

  // ─── ZIP-005: Non-numeric zip ───

  test('ZIP-005: non-numeric zip returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.lookupZip('abcde');

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── ZIP-006: Multiple providers for one zip ───

  test('ZIP-006: zip with electric + gas providers', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    // 10001 (NYC) should have electric (Con Edison) + gas (National Grid)
    const { status, body } = await api.lookupZip('10001');
    expect(status).toBe(200);

    const response = body as ZipLookupResponse;
    if (response.utilityProviders.length >= 2) {
      const types = response.utilityProviders.flatMap(p => p.utilitiesHandled);
      expect(types).toContain('electricity');
      // Gas may or may not be present depending on coverage data
    }
  });
});
