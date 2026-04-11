/**
 * API Tests: Authentication & Authorization — Public Grid REST API v2
 *
 * Validates Bearer API key authentication, partner scoping, and error responses
 * for unauthorized/forbidden access across the v2 API surface.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md (AUTH-001 through AUTH-008)
 */

import { test, expect } from '@playwright/test';
import { BuildingsApiV2 } from '../../../resources/fixtures/api';
import { TIMEOUTS, TEST_TAGS, API_V2_ERROR_CODES, API_V2_ENV } from '../../../resources/constants';
import { PublicGridApiV2 } from '../../../resources/fixtures/api';
import { createLogger } from '../../../resources/utils/logger';
import type { ApiV2PaginatedResponse, Building } from '../../../resources/types';

const log = createLogger('AuthApiV2');

test.describe('API v2: Authentication & Authorization', () => {
  let api: BuildingsApiV2;

  test.beforeAll(() => {
    api = new BuildingsApiV2();
  });

  // ─── AUTH-001: Valid API key returns data ───

  test('AUTH-001: valid API key returns building data', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings with valid Bearer token');
    const { status, body } = await api.listBuildings({ limit: 5 });

    log.step(2, 'Verify 200 with data array');
    expect(status).toBe(200);
    expect(PublicGridApiV2.isError(body)).toBe(false);

    const response = body as ApiV2PaginatedResponse<Building>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.pagination).toBeTruthy();
    expect(response.pagination.total).toBeGreaterThanOrEqual(0);
    expect(response.pagination.limit).toBeGreaterThan(0);
  });

  // ─── AUTH-002: Missing Authorization header ───

  test('AUTH-002: missing Authorization header returns 401', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings without Authorization header');
    const { status, body } = await api.listBuildingsNoAuth();

    log.step(2, 'Verify 401 with UNAUTHORIZED error code');
    expect(status).toBe(401);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.UNAUTHORIZED);
  });

  // ─── AUTH-003: Empty Bearer token ───

  test('AUTH-003: empty Bearer token returns 401', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings with empty Bearer value');
    const { status, body } = await api.listBuildingsWithAuth('Bearer ');

    log.step(2, 'Verify 401');
    expect(status).toBe(401);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.UNAUTHORIZED);
  });

  // ─── AUTH-004: Invalid API key ───

  test('AUTH-004: invalid API key returns 401', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings with fake API key');
    const { status, body } = await api.listBuildingsWithAuth('Bearer invalid-key-12345-fake');

    log.step(2, 'Verify 401');
    expect(status).toBe(401);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.UNAUTHORIZED);
  });

  // ─── AUTH-005: Malformed Authorization header (wrong scheme) ───

  test('AUTH-005: Basic auth scheme returns 401', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings with Basic auth scheme');
    const { status, body } = await api.listBuildingsWithAuth('Basic dXNlcjpwYXNz');

    log.step(2, 'Verify 401');
    expect(status).toBe(401);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── AUTH-006: Partner scoping — own buildings only ───

  test('AUTH-006: partner scoping returns only own buildings', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const secondaryKey = process.env[API_V2_ENV.API_KEY_SECONDARY];
    test.skip(!secondaryKey, 'API_V2_KEY_SECONDARY not set — skipping isolation test');

    log.step(1, 'Fetch buildings with primary partner key');
    const primary = await api.listBuildings();
    expect(primary.status).toBe(200);
    const primaryBuildings = (primary.body as ApiV2PaginatedResponse<Building>).data;

    log.step(2, 'Fetch buildings with secondary partner key');
    const secondaryApi = new BuildingsApiV2(secondaryKey);
    const secondary = await secondaryApi.listBuildings();
    expect(secondary.status).toBe(200);
    const secondaryBuildings = (secondary.body as ApiV2PaginatedResponse<Building>).data;

    log.step(3, 'Verify no overlapping building IDs');
    const primaryIds = new Set(primaryBuildings.map(b => b.id));
    const secondaryIds = new Set(secondaryBuildings.map(b => b.id));
    for (const id of secondaryIds) {
      expect(primaryIds.has(id)).toBe(false);
    }
  });

  // ─── AUTH-007: Partner cannot access other partner's building ───

  test('AUTH-007: accessing another partner\'s building returns 403', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const secondaryKey = process.env[API_V2_ENV.API_KEY_SECONDARY];
    test.skip(!secondaryKey, 'API_V2_KEY_SECONDARY not set — skipping isolation test');

    log.step(1, 'Get a building ID from primary partner');
    const primary = await api.listBuildings({ limit: 1 });
    expect(primary.status).toBe(200);
    const buildings = (primary.body as ApiV2PaginatedResponse<Building>).data;
    test.skip(buildings.length === 0, 'No buildings available for primary partner');
    const buildingID = buildings[0].id;

    log.step(2, 'Attempt to access that building with secondary partner key');
    const secondaryApi = new BuildingsApiV2(secondaryKey);
    const { status, body } = await secondaryApi.getBuilding(buildingID);

    log.step(3, 'Verify 403 FORBIDDEN');
    expect(status).toBe(403);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.FORBIDDEN);
  });

  // ─── AUTH-008: Partner cannot access other partner's customer ───

  test('AUTH-008: accessing another partner\'s customer returns 403', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const secondaryKey = process.env[API_V2_ENV.API_KEY_SECONDARY];
    test.skip(!secondaryKey, 'API_V2_KEY_SECONDARY not set — skipping isolation test');

    // This test requires a known customerID from the primary partner.
    // Once test data is established, replace this placeholder.
    const knownCustomerID = process.env.API_V2_TEST_CUSTOMER_ID;
    test.skip(!knownCustomerID, 'API_V2_TEST_CUSTOMER_ID not set — skipping');

    log.step(1, 'Attempt to access primary partner customer with secondary key');
    const { CustomersApiV2: CustApi } = await import('../../../resources/fixtures/api/index.js');
    const secondaryApi = new CustApi(secondaryKey);
    const { status, body } = await secondaryApi.getCustomer(knownCustomerID!);

    log.step(2, 'Verify 403 FORBIDDEN');
    expect(status).toBe(403);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.FORBIDDEN);
  });
});
