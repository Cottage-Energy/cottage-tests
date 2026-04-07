/**
 * API Tests: Properties & Bills Endpoints — Public Grid REST API v2
 *
 * Tests GET /properties, GET /properties/{id}, GET /properties/{id}/bills
 * including filters, pagination, bill date ranges, and data format validation.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md
 *   PROP-001 through PROP-012, BILL-001 through BILL-012
 */

import { test, expect } from '@playwright/test';
import { PropertiesApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
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
  Property,
  PropertyBillsResponse,
} from '../../../resources/types';

const log = createLogger('PropertiesEndpoints');

// ═══════════════════════════════════════════════
// GET /properties
// ═══════════════════════════════════════════════

test.describe('API v2: GET /properties', () => {
  let api: PropertiesApiV2;

  test.beforeAll(() => {
    api = new PropertiesApiV2();
  });

  // ─── PROP-001: Default pagination ───

  test('PROP-001: list properties returns default pagination', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Send GET /properties');
    const { status, body } = await api.listProperties();

    log.step(2, 'Verify pagination defaults');
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Property>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.limit).toBe(API_V2_PAGINATION.DEFAULT_LIMIT);
    expect(response.offset).toBe(API_V2_PAGINATION.DEFAULT_OFFSET);
    expect(response.total).toBeGreaterThanOrEqual(0);
  });

  // ─── PROP-002: Filter by buildingID ───

  test('PROP-002: filter by buildingID returns matching properties', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Get a property to discover its buildingID');
    const all = await api.listProperties({ limit: 1 });
    expect(all.status).toBe(200);
    const props = (all.body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties available');
    const buildingID = props[0].buildingID;

    log.step(2, 'Filter by that buildingID');
    const { status, body } = await api.listProperties({ buildingID });

    log.step(3, 'Verify all results belong to that building');
    expect(status).toBe(200);
    const filtered = (body as ApiV2PaginatedResponse<Property>).data;
    for (const prop of filtered) {
      expect(prop.buildingID).toBe(buildingID);
    }
  });

  // ─── PROP-003: Filter by status ───

  test('PROP-003: filter by status=Active', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listProperties({ status: 'Active' });

    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Property>;
    for (const prop of response.data) {
      const hasActiveAccount = prop.utilities.some(u => u.status === 'Active');
      expect(hasActiveAccount).toBe(true);
    }
  });

  // ─── PROP-004: Combined filters ───

  test('PROP-004: combined buildingID + status filter', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const all = await api.listProperties({ limit: 1 });
    const props = (all.body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties available');

    const { status, body } = await api.listProperties({
      buildingID: props[0].buildingID,
      status: 'Active',
    });

    expect(status).toBe(200);
    const filtered = (body as ApiV2PaginatedResponse<Property>).data;
    for (const prop of filtered) {
      expect(prop.buildingID).toBe(props[0].buildingID);
    }
  });

  // ─── PROP-005: Property object shape ───

  test('PROP-005: property object has correct shape', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listProperties({ limit: 1 });
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Property>;
    test.skip(response.data.length === 0, 'No properties available');

    const prop = response.data[0];

    expect(typeof prop.id).toBe('number');
    expect(prop.buildingID).toMatch(UUID_REGEX);
    expect(typeof prop.unitNumber).toBe('string');
    expect(prop.address).toHaveProperty('street');
    expect(prop.address).toHaveProperty('city');
    expect(prop.address).toHaveProperty('state');
    expect(prop.address).toHaveProperty('zip');
    expect(prop.utilities).toBeInstanceOf(Array);
    expect(prop.customer).toHaveProperty('id');
    expect(prop.customer).toHaveProperty('firstName');
    expect(prop.customer).toHaveProperty('lastName');
    expect(prop.customer).toHaveProperty('email');
  });

  // ─── PROP-006: Electric + gas utilities ───

  test('PROP-006: property with electric + gas utilities', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { body } = await api.listProperties();
    const props = (body as ApiV2PaginatedResponse<Property>).data;
    const dualUtility = props.find(p => p.utilities.length >= 2);
    test.skip(!dualUtility, 'No property with both electric + gas found');

    const types = dualUtility!.utilities.map(u => u.accountType);
    expect(types).toContain('electric');
    expect(types).toContain('gas');
  });

  // ─── PROP-007: Non-existent buildingID filter ───

  test('PROP-007: non-existent buildingID returns empty array', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listProperties({
      buildingID: '00000000-0000-0000-0000-000000000000',
    });

    expect(status).toBe(200);
    expect((body as ApiV2PaginatedResponse<Property>).data).toHaveLength(0);
  });

  // ─── PROP-008: Custom pagination ───

  test('PROP-008: paginated results do not overlap', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const page1 = await api.listProperties({ limit: 5, offset: 0 });
    const page2 = await api.listProperties({ limit: 5, offset: 5 });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    const ids1 = (page1.body as ApiV2PaginatedResponse<Property>).data.map(p => p.id);
    const ids2 = (page2.body as ApiV2PaginatedResponse<Property>).data.map(p => p.id);

    for (const id of ids2) {
      expect(ids1).not.toContain(id);
    }
  });
});

// ═══════════════════════════════════════════════
// GET /properties/{propertyID}
// ═══════════════════════════════════════════════

test.describe('API v2: GET /properties/{propertyID}', () => {
  let api: PropertiesApiV2;

  test.beforeAll(() => {
    api = new PropertiesApiV2();
  });

  // ─── PROP-009: Happy path ───

  test('PROP-009: get property by ID returns full detail', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    log.step(1, 'Get a known property ID');
    const list = await api.listProperties({ limit: 1 });
    const props = (list.body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties available');

    log.step(2, 'Fetch property detail');
    const { status, body } = await api.getProperty(props[0].id);

    log.step(3, 'Verify full detail returned');
    expect(status).toBe(200);
    const prop = body as Property;
    expect(prop.id).toBe(props[0].id);
    expect(prop.utilities).toBeInstanceOf(Array);
    if (prop.utilities.length > 0) {
      expect(prop.utilities[0]).toHaveProperty('accountNumber');
      expect(prop.utilities[0]).toHaveProperty('startDate');
      expect(prop.utilities[0]).toHaveProperty('endDate');
    }
  });

  // ─── PROP-010: Non-existent ID ───

  test('PROP-010: non-existent property ID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.getProperty(999999999);
    expect(status).toBe(404);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });

  // ─── PROP-011: Non-integer ID ───

  test('PROP-011: non-integer property ID returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.getProperty('abc');
    expect(status).toBe(400);
  });

  // ─── PROP-012: Customer embedded ───

  test('PROP-012: property includes embedded customer', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const list = await api.listProperties({ limit: 1 });
    const props = (list.body as ApiV2PaginatedResponse<Property>).data;
    test.skip(props.length === 0, 'No properties available');

    const { status, body } = await api.getProperty(props[0].id);
    expect(status).toBe(200);

    const prop = body as Property;
    expect(prop.customer.id).toMatch(UUID_REGEX);
    expect(typeof prop.customer.firstName).toBe('string');
    expect(typeof prop.customer.lastName).toBe('string');
    expect(prop.customer.email).toContain('@');
  });
});

// ═══════════════════════════════════════════════
// GET /properties/{propertyID}/bills
// ═══════════════════════════════════════════════

test.describe('API v2: GET /properties/{propertyID}/bills', () => {
  let api: PropertiesApiV2;
  let testPropertyID: number;

  test.beforeAll(async () => {
    api = new PropertiesApiV2();

    // Find a property with bills for the test suite
    const list = await api.listProperties({ limit: 10 });
    const props = (list.body as ApiV2PaginatedResponse<Property>).data;
    testPropertyID = props.length > 0 ? props[0].id : 0;
  });

  // ─── BILL-001: Default bills response ───

  test('BILL-001: get property bills with defaults', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID);

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    expect(response.propertyID).toBe(testPropertyID);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.limit).toBe(API_V2_PAGINATION.BILLS_DEFAULT_LIMIT);
    expect(response.offset).toBe(API_V2_PAGINATION.DEFAULT_OFFSET);
    expect(response.total).toBeGreaterThanOrEqual(0);
  });

  // ─── BILL-002: Bill object shape ───

  test('BILL-002: bill object has correct shape', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID);
    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    test.skip(response.data.length === 0, 'No bills for this property');

    const bill = response.data[0];
    expect(typeof bill.id).toBe('number');
    expect(typeof bill.accountID).toBe('number');
    expect(['electric', 'gas']).toContain(bill.accountType);
    expect(bill.startDate).toMatch(ISO_8601_REGEX);
    expect(bill.endDate).toMatch(ISO_8601_REGEX);
    expect(bill.statementDate).toMatch(ISO_8601_REGEX);
    expect(bill.dueDate).toMatch(ISO_8601_REGEX);
    expect(typeof bill.totalAmountDueCents).toBe('number');
    expect(Number.isInteger(bill.totalAmountDueCents)).toBe(true);
    expect(typeof bill.totalUsage).toBe('number');
    expect(typeof bill.usageUnit).toBe('string');
    expect(typeof bill.pdfURL).toBe('string');
  });

  // ─── BILL-003: Filter by accountType=electric ───

  test('BILL-003: filter by accountType=electric', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, {
      accountType: 'electric',
    });

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    for (const bill of response.data) {
      expect(bill.accountType).toBe('electric');
    }
  });

  // ─── BILL-004: Filter by accountType=gas ───

  test('BILL-004: filter by accountType=gas', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, {
      accountType: 'gas',
    });

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    for (const bill of response.data) {
      expect(bill.accountType).toBe('gas');
    }
  });

  // ─── BILL-005: Filter by startDate ───

  test('BILL-005: filter by startDate', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, {
      startDate: '2024-06-01',
    });

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    for (const bill of response.data) {
      expect(new Date(bill.startDate).getTime()).toBeGreaterThanOrEqual(new Date('2024-06-01').getTime());
    }
  });

  // ─── BILL-006: Filter by endDate ───

  test('BILL-006: filter by endDate', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, {
      endDate: '2024-06-30',
    });

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    for (const bill of response.data) {
      expect(new Date(bill.endDate).getTime()).toBeLessThanOrEqual(new Date('2024-06-30T23:59:59Z').getTime());
    }
  });

  // ─── BILL-007: Date range filter ───

  test('BILL-007: filter by date range', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, {
      startDate: '2024-01-01',
      endDate: '2024-06-30',
    });

    expect(status).toBe(200);
    expect((body as PropertyBillsResponse).data).toBeInstanceOf(Array);
  });

  // ─── BILL-008: Custom limit ───

  test('BILL-008: bills with custom limit', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBills(testPropertyID, { limit: 3 });

    expect(status).toBe(200);
    const response = body as PropertyBillsResponse;
    expect(response.data.length).toBeLessThanOrEqual(3);
    expect(response.limit).toBe(3);
  });

  // ─── BILL-009: Max limit enforced ───

  test('BILL-009: bills max limit enforced', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { status, body } = await api.getPropertyBillsRaw(testPropertyID, { limit: 100 });

    if (status === 200) {
      expect((body as PropertyBillsResponse).data.length).toBeLessThanOrEqual(API_V2_PAGINATION.BILLS_MAX_LIMIT);
    } else {
      expect(status).toBe(400);
    }
  });

  // ─── BILL-010: Amount in cents ───

  test('BILL-010: totalAmountDueCents is integer', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(testPropertyID === 0, 'No property available');

    const { body } = await api.getPropertyBills(testPropertyID);
    const response = body as PropertyBillsResponse;
    test.skip(response.data.length === 0, 'No bills available');

    for (const bill of response.data) {
      expect(Number.isInteger(bill.totalAmountDueCents)).toBe(true);
      expect(bill.totalAmountDueCents).toBeGreaterThanOrEqual(0);
    }
  });

  // ─── BILL-012: Property with no bills ───

  test('BILL-012: property with no bills returns empty array', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    // Use a far-future date range to guarantee empty results
    const { status, body } = await api.getPropertyBills(testPropertyID || 1, {
      startDate: '2099-01-01',
      endDate: '2099-12-31',
    });

    if (status === 200) {
      expect((body as PropertyBillsResponse).data).toHaveLength(0);
    }
    // Property might not exist → 404 is also acceptable
    expect([200, 404]).toContain(status);
  });
});
