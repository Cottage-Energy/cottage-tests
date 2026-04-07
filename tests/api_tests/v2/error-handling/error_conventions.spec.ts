/**
 * API Tests: Error Handling & Data Conventions — Public Grid REST API v2
 *
 * Cross-cutting tests for consistent error format, error codes,
 * and data type conventions (UUIDs, integers, ISO 8601, cents).
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md
 *   ERR-001 through ERR-010, CONV-001 through CONV-008
 */

import { test, expect } from '@playwright/test';
import {
  BuildingsApiV2,
  PropertiesApiV2,
  CustomersApiV2,
  PublicGridApiV2,
} from '../../../resources/fixtures/api';
import {
  TIMEOUTS,
  TEST_TAGS,
  API_V2_ERROR_CODES,
  UUID_REGEX,
  ISO_8601_REGEX,
} from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  ApiV2Error,
  ApiV2PaginatedResponse,
  Building,
  Customer,
  CustomerPropertyBillsResponse,
  Property,
} from '../../../resources/types';

const log = createLogger('ErrorConventions');

// ═══════════════════════════════════════════════
// Error Format Consistency
// ═══════════════════════════════════════════════

test.describe('API v2: Error Format', () => {
  let buildingsApi: BuildingsApiV2;

  test.beforeAll(() => {
    buildingsApi = new BuildingsApiV2();
  });

  // ─── ERR-001: Error structure ───

  test('ERR-001: error response has consistent structure', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Trigger a 400 error');
    const { status, body } = await buildingsApi.createBuildingRaw({});

    log.step(2, 'Validate error structure');
    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);

    const error = body as ApiV2Error;
    expect(error.error).toHaveProperty('code');
    expect(error.error).toHaveProperty('message');
    expect(typeof error.error.code).toBe('string');
    expect(typeof error.error.message).toBe('string');
  });

  // ─── ERR-002: INVALID_REQUEST includes details ───

  test('ERR-002: INVALID_REQUEST includes field and reason', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await buildingsApi.createBuildingRaw({
      address: { city: 'NY', state: 'NY', zip: '10001' },
      // Missing required "name"
    });

    expect(status).toBe(400);
    const error = body as ApiV2Error;
    expect(error.error.code).toBe(API_V2_ERROR_CODES.INVALID_REQUEST);
    // Details may include field-level info
    if (error.error.details) {
      expect(typeof error.error.details.field).toBe('string');
      expect(typeof error.error.details.reason).toBe('string');
    }
  });

  // ─── ERR-003: UNAUTHORIZED format ───

  test('ERR-003: 401 returns UNAUTHORIZED code', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await buildingsApi.listBuildingsNoAuth();

    expect(status).toBe(401);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.UNAUTHORIZED);
  });

  // ─── ERR-004: FORBIDDEN format ───

  test('ERR-004: 403 returns FORBIDDEN code', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const secondaryKey = process.env.API_V2_KEY_SECONDARY;
    test.skip(!secondaryKey, 'Secondary key not set');

    // Get a building from primary, access with secondary
    const list = await buildingsApi.listBuildings({ limit: 1 });
    const buildings = (list.body as ApiV2PaginatedResponse<Building>).data;
    test.skip(buildings.length === 0, 'No buildings');

    const secondaryApi = new BuildingsApiV2(secondaryKey);
    const { status, body } = await secondaryApi.getBuilding(buildings[0].id);

    expect(status).toBe(403);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.FORBIDDEN);
  });

  // ─── ERR-005: NOT_FOUND format ───

  test('ERR-005: 404 returns NOT_FOUND code', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await buildingsApi.getBuilding('00000000-0000-0000-0000-000000000000');

    expect(status).toBe(404);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });

  // ─── ERR-007: Content-Type required ───

  test('ERR-007: wrong Content-Type is rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const url = `${buildingsApi['baseUrl']}/buildings/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${buildingsApi['apiKey']}`,
        'Content-Type': 'text/plain',
      },
      body: 'not json',
    });

    expect([400, 415]).toContain(response.status);
  });

  // ─── ERR-008: Invalid JSON body ───

  test('ERR-008: malformed JSON body returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const url = `${buildingsApi['baseUrl']}/buildings/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${buildingsApi['apiKey']}`,
        'Content-Type': 'application/json',
      },
      body: '{broken json',
    });

    expect(response.status).toBe(400);
  });

  // ─── ERR-010: Unknown endpoint ───

  test('ERR-010: unknown endpoint returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await buildingsApi['get']<unknown>('/nonexistent-endpoint-12345');
    expect(status).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// Data Convention Validation
// ═══════════════════════════════════════════════

test.describe('API v2: Data Conventions', () => {
  let buildingsApi: BuildingsApiV2;
  let propertiesApi: PropertiesApiV2;
  let customersApi: CustomersApiV2;

  test.beforeAll(() => {
    buildingsApi = new BuildingsApiV2();
    propertiesApi = new PropertiesApiV2();
    customersApi = new CustomersApiV2();
  });

  // ─── CONV-001: Building IDs are UUIDs ───

  test('CONV-001: building IDs are UUIDs', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await buildingsApi.listBuildings({ limit: 5 });
    const buildings = (body as ApiV2PaginatedResponse<Building>).data;

    for (const building of buildings) {
      expect(building.id).toMatch(UUID_REGEX);
    }
  });

  // ─── CONV-002: Customer IDs are UUIDs ───

  test('CONV-002: customer IDs are UUIDs', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await propertiesApi.listProperties({ limit: 5 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;

    for (const prop of props) {
      if (prop.customer) {
        expect(prop.customer.id).toMatch(UUID_REGEX);
      }
    }
  });

  // ─── CONV-003: Property IDs are integers ───

  test('CONV-003: property IDs are integers', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await propertiesApi.listProperties({ limit: 5 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;

    for (const prop of props) {
      expect(typeof prop.id).toBe('number');
      expect(Number.isInteger(prop.id)).toBe(true);
    }
  });

  // ─── CONV-004: Account IDs are integers ───

  test('CONV-004: account IDs are integers', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await propertiesApi.listProperties({ limit: 5 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;

    for (const prop of props) {
      for (const util of prop.utilities) {
        expect(typeof util.accountID).toBe('number');
        expect(Number.isInteger(util.accountID)).toBe(true);
      }
    }
  });

  // ─── CONV-005: Bill IDs are integers ───

  test('CONV-005: bill IDs are integers', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    // Find a property and get its bills
    const { body } = await propertiesApi.listProperties({ limit: 1 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties');

    const bills = await propertiesApi.getPropertyBills(props[0].id);
    const billsData = (bills.body as { data: { id: number }[] }).data;

    for (const bill of billsData) {
      expect(typeof bill.id).toBe('number');
      expect(Number.isInteger(bill.id)).toBe(true);
    }
  });

  // ─── CONV-006: Timestamps are ISO 8601 ───

  test('CONV-006: timestamps are ISO 8601 format', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await buildingsApi.listBuildings({ limit: 3 });
    const buildings = (body as ApiV2PaginatedResponse<Building>).data;

    for (const building of buildings) {
      expect(building.createdAt).toMatch(ISO_8601_REGEX);
    }
  });

  // ─── CONV-007: Monetary amounts in cents ───

  test('CONV-007: bill amounts are integers in cents', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await propertiesApi.listProperties({ limit: 1 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties');

    const bills = await propertiesApi.getPropertyBills(props[0].id);
    const billsData = (bills.body as { data: { totalAmountDueCents: number }[] }).data;

    for (const bill of billsData) {
      expect(Number.isInteger(bill.totalAmountDueCents)).toBe(true);
      expect(bill.totalAmountDueCents).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── CONV-008: Usage includes usageUnit ───

  test('CONV-008: bill usage includes usageUnit field', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await propertiesApi.listProperties({ limit: 1 });
    const props = (body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties');

    const bills = await propertiesApi.getPropertyBills(props[0].id);
    const billsData = (bills.body as { data: { usageUnit: string; totalUsage: number }[] }).data;

    for (const bill of billsData) {
      expect(typeof bill.usageUnit).toBe('string');
      expect(['kWh', 'therms', 'ccf', 'MWh']).toContain(bill.usageUnit);
      expect(typeof bill.totalUsage).toBe('number');
    }
  });
});
