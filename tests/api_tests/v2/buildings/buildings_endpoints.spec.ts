/**
 * API Tests: Buildings Endpoints — Public Grid REST API v2
 *
 * Tests GET /buildings, GET /buildings/{id}, POST /buildings/create
 * including pagination, validation, and data format conventions.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md (BLD-001 through BLD-025)
 */

import { test, expect } from '@playwright/test';
import { BuildingsApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
import {
  TIMEOUTS,
  TEST_TAGS,
  API_V2_PAGINATION,
  API_V2_ERROR_CODES,
  UUID_REGEX,
  ISO_8601_REGEX,
} from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  ApiV2PaginatedResponse,
  Building,
  BuildingDetail,
  CreateBuildingResponse,
} from '../../../resources/types';

const log = createLogger('BuildingsEndpoints');

/** Track building IDs created during tests for cleanup */
const createdBuildingIds: string[] = [];

test.describe('API v2: GET /buildings', () => {
  let api: BuildingsApiV2;

  test.beforeAll(() => {
    api = new BuildingsApiV2();
  });

  // ─── BLD-001: List buildings — default pagination ───

  test('BLD-001: list buildings returns default pagination', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings with no params');
    const { status, body } = await api.listBuildings();

    log.step(2, 'Verify 200 with pagination metadata');
    expect(status).toBe(200);
    expect(PublicGridApiV2.isError(body)).toBe(false);

    const response = body as ApiV2PaginatedResponse<Building>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.total).toBeGreaterThanOrEqual(0);
    expect(response.limit).toBe(API_V2_PAGINATION.DEFAULT_LIMIT);
    expect(response.offset).toBe(API_V2_PAGINATION.DEFAULT_OFFSET);
  });

  // ─── BLD-002: Custom limit ───

  test('BLD-002: list buildings with custom limit', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings?limit=10');
    const { status, body } = await api.listBuildings({ limit: 10 });

    log.step(2, 'Verify limit applied');
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Building>;
    expect(response.data.length).toBeLessThanOrEqual(10);
    expect(response.limit).toBe(10);
  });

  // ─── BLD-003: Max limit enforced ───

  test('BLD-003: limit exceeding max is capped or rejected', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings?limit=200');
    const { status, body } = await api.listBuildingsRaw({ limit: 200 });

    log.step(2, 'Verify limit capped to 100 or 400 error');
    if (status === 200) {
      const response = body as ApiV2PaginatedResponse<Building>;
      expect(response.data.length).toBeLessThanOrEqual(API_V2_PAGINATION.MAX_LIMIT);
    } else {
      expect(status).toBe(400);
    }
  });

  // ─── BLD-004: Offset pagination ───

  test('BLD-004: offset pagination returns different results', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Get first page');
    const page1 = await api.listBuildings({ limit: 1, offset: 0 });
    expect(page1.status).toBe(200);
    const data1 = (page1.body as ApiV2PaginatedResponse<Building>).data;

    log.step(2, 'Get second page');
    const page2 = await api.listBuildings({ limit: 1, offset: 1 });
    expect(page2.status).toBe(200);
    const data2 = (page2.body as ApiV2PaginatedResponse<Building>).data;

    log.step(3, 'Verify different buildings returned');
    if (data1.length > 0 && data2.length > 0) {
      expect(data1[0].id).not.toBe(data2[0].id);
    }
  });

  // ─── BLD-005: Offset beyond total ───

  test('BLD-005: offset beyond total returns empty array', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /buildings?offset=99999');
    const { status, body } = await api.listBuildings({ offset: 99999 });

    log.step(2, 'Verify empty data');
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Building>;
    expect(response.data).toHaveLength(0);
    expect(response.total).toBeGreaterThanOrEqual(0);
  });

  // ─── BLD-006: Building object shape ───

  test('BLD-006: building object has correct shape', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Get first building');
    const { status, body } = await api.listBuildings({ limit: 1 });
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Building>;
    test.skip(response.data.length === 0, 'No buildings available');

    const building = response.data[0];

    log.step(2, 'Validate all required fields');
    expect(building.id).toMatch(UUID_REGEX);
    expect(typeof building.name).toBe('string');
    expect(typeof building.shortCode).toBe('string');
    expect(building.address).toHaveProperty('street');
    expect(building.address).toHaveProperty('city');
    expect(building.address).toHaveProperty('state');
    expect(building.address).toHaveProperty('zip');
    expect(building.utilities).toBeInstanceOf(Array);
    expect(typeof building.totalUnitCount).toBe('number');
    expect(building.createdAt).toMatch(ISO_8601_REGEX);
  });

  // ─── BLD-007: Utilities array structure ───

  test('BLD-007: building utilities have correct structure', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Find a building with utilities');
    const { status, body } = await api.listBuildings();
    expect(status).toBe(200);
    const buildings = (body as ApiV2PaginatedResponse<Building>).data;
    const withUtils = buildings.find(b => b.utilities.length > 0);
    test.skip(!withUtils, 'No buildings with utilities available');

    log.step(2, 'Validate utility object shape');
    const util = withUtils!.utilities[0];
    expect(typeof util.utilityCompanyID).toBe('string');
    expect(typeof util.name).toBe('string');
    expect(['electric', 'gas']).toContain(util.type);
    expect(typeof util.pgEnabled).toBe('boolean');
  });

  // ─── BLD-008: Negative limit ───

  test('BLD-008: negative limit returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listBuildingsRaw({ limit: -1 });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.INVALID_REQUEST);
  });

  // ─── BLD-009: Non-integer limit ───

  test('BLD-009: non-integer limit returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listBuildingsRaw({ limit: 'abc' as unknown as number });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });
});

test.describe('API v2: GET /buildings/{buildingID}', () => {
  let api: BuildingsApiV2;

  test.beforeAll(() => {
    api = new BuildingsApiV2();
  });

  // ─── BLD-010: Get building by ID ───

  test('BLD-010: get building by ID returns full detail with properties', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Get a known building ID');
    const list = await api.listBuildings({ limit: 1 });
    expect(list.status).toBe(200);
    const buildings = (list.body as ApiV2PaginatedResponse<Building>).data;
    test.skip(buildings.length === 0, 'No buildings available');
    const buildingID = buildings[0].id;

    log.step(2, 'Send GET /buildings/{buildingID}');
    const { status, body } = await api.getBuilding(buildingID);

    log.step(3, 'Verify full building detail');
    expect(status).toBe(200);
    expect(PublicGridApiV2.isError(body)).toBe(false);
    const detail = body as BuildingDetail;
    expect(detail.id).toBe(buildingID);
    expect(detail).toHaveProperty('properties');
    expect(detail.properties).toBeInstanceOf(Array);
  });

  // ─── BLD-011: Properties summary in building detail ───

  test('BLD-011: building detail includes property summary', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Find a building with properties');
    const list = await api.listBuildings();
    expect(list.status).toBe(200);
    const buildings = (list.body as ApiV2PaginatedResponse<Building>).data;
    test.skip(buildings.length === 0, 'No buildings available');

    // Try each building until one with properties is found
    for (const building of buildings) {
      const detail = await api.getBuilding(building.id);
      if (detail.status === 200) {
        const b = detail.body as BuildingDetail;
        if (b.properties.length > 0) {
          log.step(2, 'Validate property summary shape');
          const prop = b.properties[0];
          expect(typeof prop.id).toBe('number');
          expect(typeof prop.unitNumber).toBe('string');
          expect(prop.utilities).toBeInstanceOf(Array);
          if (prop.utilities.length > 0) {
            expect(typeof prop.utilities[0].accountID).toBe('number');
            expect(['electric', 'gas']).toContain(prop.utilities[0].accountType);
            expect(typeof prop.utilities[0].status).toBe('string');
          }
          return; // Test passed
        }
      }
    }
    test.skip(true, 'No buildings with properties found');
  });

  // ─── BLD-012: Non-existent building ID ───

  test('BLD-012: non-existent building ID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.getBuilding('00000000-0000-0000-0000-000000000000');

    expect(status).toBe(404);
    expect(PublicGridApiV2.isError(body)).toBe(true);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });

  // ─── BLD-013: Malformed UUID ───

  test('BLD-013: malformed UUID returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.getBuilding('not-a-uuid');

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });
});

test.describe('API v2: POST /buildings/create', () => {
  let api: BuildingsApiV2;

  test.beforeAll(() => {
    api = new BuildingsApiV2();
  });

  test.afterAll(async () => {
    // Note: building cleanup may require admin API or manual deletion.
    // Log created IDs for manual cleanup if needed.
    if (createdBuildingIds.length > 0) {
      log.info('Buildings created during test (may need manual cleanup)', {
        ids: createdBuildingIds,
      });
    }
  });

  // ─── BLD-014: Create building — full payload ───

  test('BLD-014: create building with full payload', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const ts = Date.now().toString(36);

    log.step(1, 'Send POST /buildings/create with all fields');
    const { status, body } = await api.createBuilding({
      name: `QA API v2 Test Building ${ts}`,
      externalID: `qa-apiv2-${ts}`,
      address: {
        street: '100 Test Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      utilities: [
        { type: 'electric', utilityCompanyID: 'CON-EDISON' },
      ],
      totalUnitCount: 50,
    });

    log.step(2, 'Verify 201 with building created');
    expect(status).toBe(201);
    expect(PublicGridApiV2.isError(body)).toBe(false);

    const created = body as CreateBuildingResponse;
    expect(created.id).toMatch(UUID_REGEX);
    expect(created.name).toContain('QA API v2 Test Building');
    expect(typeof created.shortCode).toBe('string');
    expect(created.createdAt).toMatch(ISO_8601_REGEX);

    createdBuildingIds.push(created.id);
  });

  // ─── BLD-015: Minimum required fields ───

  test('BLD-015: create building with minimum required fields', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    const ts = Date.now().toString(36);

    log.step(1, 'Send POST with name + address only');
    const { status, body } = await api.createBuilding({
      name: `QA Minimal Building ${ts}`,
      address: {
        street: '200 Minimal St',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      },
    });

    log.step(2, 'Verify 201');
    expect(status).toBe(201);
    const created = body as CreateBuildingResponse;
    expect(created.id).toMatch(UUID_REGEX);

    createdBuildingIds.push(created.id);
  });

  // ─── BLD-016 through BLD-020: Missing required fields ───

  const requiredFieldTests = [
    { id: 'BLD-016', field: 'name', body: { address: { street: '1 St', city: 'NY', state: 'NY', zip: '10001' } } },
    { id: 'BLD-017', field: 'address.street', body: { name: 'Test', address: { city: 'NY', state: 'NY', zip: '10001' } } },
    { id: 'BLD-018', field: 'address.city', body: { name: 'Test', address: { street: '1 St', state: 'NY', zip: '10001' } } },
    { id: 'BLD-019', field: 'address.state', body: { name: 'Test', address: { street: '1 St', city: 'NY', zip: '10001' } } },
    { id: 'BLD-020', field: 'address.zip', body: { name: 'Test', address: { street: '1 St', city: 'NY', state: 'NY' } } },
  ];

  for (const { id, field, body: reqBody } of requiredFieldTests) {
    test(`${id}: missing ${field} returns 400`, {
      tag: [TEST_TAGS.API],
    }, async () => {
      test.setTimeout(TIMEOUTS.DEFAULT);

      const { status, body } = await api.createBuildingRaw(reqBody);

      expect(status).toBe(400);
      expect(PublicGridApiV2.isError(body)).toBe(true);
      expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.INVALID_REQUEST);
    });
  }

  // ─── BLD-021: Invalid state code ───

  test('BLD-021: invalid state code returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.createBuildingRaw({
      name: 'Invalid State',
      address: { street: '1 St', city: 'City', state: 'XYZ', zip: '10001' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── BLD-022: Invalid zip format ───

  test('BLD-022: invalid zip format returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.createBuildingRaw({
      name: 'Invalid Zip',
      address: { street: '1 St', city: 'City', state: 'NY', zip: '123' },
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── BLD-023: Duplicate utility types ───

  test('BLD-023: duplicate utility types returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.createBuildingRaw({
      name: 'Dup Utils',
      address: { street: '1 St', city: 'NY', state: 'NY', zip: '10001' },
      utilities: [
        { type: 'electric', utilityCompanyID: 'CON-EDISON' },
        { type: 'electric', utilityCompanyID: 'EVERSOURCE-CT' },
      ],
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── BLD-024: Invalid utilityCompanyID ───

  test('BLD-024: invalid utilityCompanyID returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.createBuildingRaw({
      name: 'Bad Utility',
      address: { street: '1 St', city: 'NY', state: 'NY', zip: '10001' },
      utilities: [{ type: 'electric', utilityCompanyID: 'FAKE-UTILITY-999' }],
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });
});

test.describe('API v2: Error Handling — Buildings', () => {
  let api: BuildingsApiV2;

  test.beforeAll(() => {
    api = new BuildingsApiV2();
  });

  // ─── ERR-009: Method not allowed ───

  test('ERR-009: DELETE on buildings returns 405', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.deleteBuildingUnsupported('00000000-0000-0000-0000-000000000000');

    // Could be 404 or 405 depending on implementation
    expect([404, 405]).toContain(status);
  });
});
