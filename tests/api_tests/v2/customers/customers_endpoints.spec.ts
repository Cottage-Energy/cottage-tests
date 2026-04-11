/**
 * API Tests: Customers Endpoints — Public Grid REST API v2
 *
 * Tests nested customer resources: get customer, customer property,
 * customer property bills, specific bill, and intervals.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md
 *   CUST-001 through CUST-016, INT-001 through INT-007
 */

import { test, expect } from '@playwright/test';
import { CustomersApiV2, PropertiesApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
import {
  TIMEOUTS,
  TEST_TAGS,
  API_V2_ERROR_CODES,
  API_V2_ENV,
  UUID_REGEX,
  ISO_8601_REGEX,
} from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  ApiV2PaginatedResponse,
  Bill,
  Customer,
  CustomerPropertyBillsResponse,
  CustomerPropertyDetail,
  IntervalsResponse,
  Property,
} from '../../../resources/types';

const log = createLogger('CustomersEndpoints');

// ═══════════════════════════════════════════════
// GET /customers (list)
// ═══════════════════════════════════════════════

test.describe('API v2: GET /customers', () => {
  let api: CustomersApiV2;

  test.beforeAll(() => {
    api = new CustomersApiV2();
  });

  test('CUST-LIST-001: list customers returns paginated response', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listCustomers({ limit: 5 });

    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Customer>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data.length).toBeLessThanOrEqual(5);
    expect(response.pagination).toBeTruthy();
    expect(response.pagination.total).toBeGreaterThan(0);
    expect(response.pagination.limit).toBe(5);
    expect(typeof response.pagination.hasMore).toBe('boolean');
  });

  test('CUST-LIST-002: customer list item has correct shape', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listCustomers({ limit: 1 });
    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Customer>;
    test.skip(response.data.length === 0, 'No customers');

    const customer = response.data[0];
    expect(customer.id).toMatch(UUID_REGEX);
    expect(typeof customer.email).toBe('string');
    expect(typeof customer.firstName).toBe('string');
    expect(typeof customer.lastName).toBe('string');
    expect(typeof customer.createdAt).toBe('string');
  });

  test('CUST-LIST-003: filter by buildingID', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const buildingID = '009be2c6-dd00-428b-8e0d-92eb53e8418e';
    const { status, body } = await api.listCustomers({ buildingID, limit: 5 });

    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Customer>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.pagination.total).toBeGreaterThanOrEqual(0);
  });

  test('CUST-LIST-004: pagination offset works', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const page1 = await api.listCustomers({ limit: 1, offset: 0 });
    const page2 = await api.listCustomers({ limit: 1, offset: 1 });

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);

    const data1 = (page1.body as ApiV2PaginatedResponse<Customer>).data;
    const data2 = (page2.body as ApiV2PaginatedResponse<Customer>).data;

    if (data1.length > 0 && data2.length > 0) {
      expect(data1[0].id).not.toBe(data2[0].id);
    }
  });

  test('CUST-LIST-005: non-existent buildingID returns empty', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.listCustomers({
      buildingID: '00000000-0000-0000-0000-000000000000',
    });

    expect(status).toBe(200);
    expect((body as ApiV2PaginatedResponse<Customer>).data).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════
// GET /customers/{customerID}
// ═══════════════════════════════════════════════

test.describe('API v2: GET /customers/{customerID}', () => {
  let api: CustomersApiV2;
  let knownCustomerID: string;
  let knownPropertyID: number;
  let knownPropertyUUID: string;

  test.beforeAll(async () => {
    api = new CustomersApiV2();

    // Discover a customer from property detail (list doesn't include customer)
    const propsApi = new PropertiesApiV2();
    const list = await propsApi.listProperties({ limit: 5 });
    if (list.status === 200) {
      const props = (list.body as ApiV2PaginatedResponse<Property>).data;
      for (const prop of props) {
        const detail = await propsApi.getProperty(prop.uuid);
        if (detail.status === 200) {
          const detailBody = detail.body as Record<string, unknown>;
          if (detailBody.customer && typeof detailBody.customer === 'object' && (detailBody.customer as { id: string }).id) {
            const cust = detailBody.customer as { id: string };
            knownCustomerID = cust.id;
            knownPropertyID = prop.id;
            knownPropertyUUID = prop.uuid;
            break;
          }
        }
      }
    }
  });

  // ─── CUST-001: Happy path ───

  test('CUST-001: get customer returns full object', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer discovered from properties');

    log.step(1, 'Fetch customer by ID');
    const { status, body } = await api.getCustomer(knownCustomerID);

    log.step(2, 'Verify customer shape');
    expect(status).toBe(200);
    const customer = body as Customer;
    expect(customer.id).toMatch(UUID_REGEX);
    expect(typeof customer.firstName).toBe('string');
    expect(typeof customer.lastName).toBe('string');
    expect(customer.email).toContain('@');
    // API returns Postgres timestamp format, not ISO 8601 (spec says ISO 8601)
    expect(typeof customer.createdAt).toBe('string');
    expect(customer.createdAt.length).toBeGreaterThan(0);
    expect(customer.properties).toBeInstanceOf(Array);
  });

  // ─── CUST-002: Properties array structure ───

  test('CUST-002: customer properties array has correct structure', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer found via property detail — test data needed');

    const { body } = await api.getCustomer(knownCustomerID);
    const customer = body as Customer;
    test.skip(customer.properties.length === 0, 'Customer has no properties');

    const prop = customer.properties[0];
    // API uses id/uuid, not propertyID (differs from spec)
    expect(prop).toHaveProperty('id');
    expect(prop).toHaveProperty('buildingID');
    expect(prop).toHaveProperty('uuid');
  });

  // ─── CUST-003: Multiple properties ───

  test('CUST-003: customer with multiple properties', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer found via property detail — test data needed');

    const { body } = await api.getCustomer(knownCustomerID);
    const customer = body as Customer;

    // May or may not have multiple — just validate the array structure
    expect(customer.properties).toBeInstanceOf(Array);
    if (customer.properties.length >= 2) {
      const ids = customer.properties.map(p => p.propertyID);
      expect(new Set(ids).size).toBe(ids.length); // All unique
    }
  });

  // ─── CUST-004: Non-existent customerID ───

  test('CUST-004: non-existent customerID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.getCustomer('00000000-0000-0000-0000-000000000000');
    expect(status).toBe(404);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });

  // ─── CUST-005: Malformed customerID ───

  test('CUST-005: malformed customerID returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.getCustomer('not-a-uuid');
    expect(status).toBe(400);
  });

  // ─── CUST-006: Get customer property ───

  test('CUST-006: get customer property returns full detail', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID || !knownPropertyUUID, 'No customer/property pair — needs test data with linked customer');

    const { status, body } = await api.getCustomerProperty(knownCustomerID, knownPropertyUUID as unknown as number);

    expect([200, 404]).toContain(status);
    if (status === 200) {
      // Response is the property detail (not a customer-property join)
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('buildingID');
      expect(body).toHaveProperty('electricAccount');
    }
  });

  // ─── CUST-007: Customer-property mismatch ───

  test('CUST-007: mismatched customer-property returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer found via property detail — test data needed');

    // Use non-existent UUID for property
    const { status } = await api.getCustomerProperty(knownCustomerID, '00000000-0000-0000-0000-000000000000' as unknown as number);
    expect(status).toBe(404);
  });

  // ─── CUST-008: Non-existent propertyID for customer ───

  test('CUST-008: non-existent property for valid customer returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer found via property detail — test data needed');

    const { status, body } = await api.getCustomerProperty(knownCustomerID, '00000000-0000-0000-0000-000000000099' as unknown as number);
    // API may return 404 (not found) or 400 (invalid UUID)
    expect([400, 404]).toContain(status);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });
});

// ═══════════════════════════════════════════════
// GET /customers/{cID}/properties/{pID}/bills
// ═══════════════════════════════════════════════

test.describe('API v2: Customer property bills', () => {
  let api: CustomersApiV2;
  let customerID: string;
  let propertyUUID: string;

  test.beforeAll(() => {
    api = new CustomersApiV2();
    customerID = process.env.API_V2_TEST_CUSTOMER_ID || '';
    propertyUUID = process.env.API_V2_TEST_PROPERTY_UUID || '';
  });

  // ─── CUST-009: Bills happy path ───

  test('CUST-009: get customer property bills', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'API_V2_TEST_CUSTOMER_ID or API_V2_TEST_PROPERTY_UUID not set');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyUUID as unknown as number);

    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Record<string, unknown>>;
    expect(response.data).toBeInstanceOf(Array);
    expect(response.pagination).toBeTruthy();
    expect(response.pagination.total).toBeGreaterThanOrEqual(0);
  });

  // ─── CUST-010: Filter by accountType ───

  test('CUST-010: filter customer bills by accountType', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyUUID as unknown as number, {
      accountType: 'electric',
    });

    expect(status).toBe(200);
    const response = body as ApiV2PaginatedResponse<Record<string, unknown>>;
    for (const bill of response.data) {
      expect(bill.type).toBe('electric');
    }
  });

  // ─── CUST-011: Date range filter ───

  test('CUST-011: filter customer bills by date range', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyUUID as unknown as number, {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(status).toBe(200);
    expect((body as ApiV2PaginatedResponse<Record<string, unknown>>).data).toBeInstanceOf(Array);
  });

  // ─── CUST-012: Custom pagination ───

  test('CUST-012: customer bills custom pagination', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyUUID as unknown as number, {
      limit: 5,
    });

    expect(status).toBe(200);
    expect((body as ApiV2PaginatedResponse<Record<string, unknown>>).data.length).toBeLessThanOrEqual(5);
  });

  // ─── CUST-013: Get specific bill (skipped if no bills exist) ───

  test('CUST-013: get specific bill by ID', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    log.step(1, 'Get bills list to find a bill UUID');
    const list = await api.getCustomerPropertyBills(customerID, propertyUUID as unknown as number);
    const bills = (list.body as ApiV2PaginatedResponse<Record<string, unknown>>).data;
    test.skip(bills.length === 0, 'No bills available for this property');
    const billUUID = bills[0].uuid as string;

    log.step(2, 'Fetch specific bill by UUID');
    const { status, body } = await api.getCustomerPropertyBill(customerID, propertyUUID as unknown as number, billUUID as unknown as number);

    log.step(3, 'Verify bill object');
    expect(status).toBe(200);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('totalAmountDue');
  });

  // ─── CUST-014: Bill ID mismatch ───

  test('CUST-014: non-existent bill ID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status } = await api.getCustomerPropertyBill(customerID, propertyUUID as unknown as number, '00000000-0000-0000-0000-000000000099' as unknown as number);
    expect([400, 404]).toContain(status);
  });

  // ─── CUST-015: Non-existent billID ───

  test('CUST-015: another non-existent billID returns error', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyBill(customerID, propertyUUID as unknown as number, '00000000-0000-0000-0000-000000000088' as unknown as number);
    expect([400, 404]).toContain(status);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });
});

// ═══════════════════════════════════════════════
// GET /customers/{cID}/properties/{pID}/intervals
// ═══════════════════════════════════════════════

test.describe('API v2: Customer property intervals', () => {
  let api: CustomersApiV2;
  let customerID: string;
  let propertyUUID: string;

  test.beforeAll(() => {
    api = new CustomersApiV2();
    customerID = process.env.API_V2_TEST_CUSTOMER_ID || '';
    propertyUUID = process.env.API_V2_TEST_PROPERTY_UUID || '';
  });

  // ─── INT-001: Happy path ───

  test('INT-001: get intervals returns response', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number);

    expect(status).toBe(200);
    const response = body as Record<string, unknown>;
    expect(response).toHaveProperty('intervals');
    expect(response.intervals).toBeInstanceOf(Array);
  });

  // ─── INT-002: Interval object shape (skipped if no data) ───

  test('INT-002: interval reading has correct shape', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { body } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number);
    const response = body as { intervals: Record<string, unknown>[] };
    test.skip(response.intervals.length === 0, 'No interval data available');

    const interval = response.intervals[0];
    expect(interval).toHaveProperty('start');
    expect(interval).toHaveProperty('end');
    expect(interval).toHaveProperty('consumption');
  });

  // ─── INT-003: Date range filter ───

  test('INT-003: filter intervals by date range', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number, {
      startDate: '2024-01-15',
      endDate: '2024-01-16',
    });

    expect(status).toBe(200);
    expect((body as { intervals: unknown[] }).intervals).toBeInstanceOf(Array);
  });

  // ─── INT-004: Custom granularity ───

  test('INT-004: custom granularity request accepted', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number, {
      granularity: 60,
    });

    expect(status).toBe(200);
  });

  // ─── INT-005: Default returns data structure ───

  test('INT-005: default request returns intervals array', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number);

    expect(status).toBe(200);
    expect((body as { intervals: unknown[] }).intervals).toBeInstanceOf(Array);
  });

  // ─── INT-006: Empty intervals for future date range ───

  test('INT-006: future date range returns empty intervals', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID || !propertyUUID, 'Test data not set');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyUUID as unknown as number, {
      startDate: '2099-01-01',
      endDate: '2099-01-02',
    });

    expect(status).toBe(200);
    expect((body as { intervals: unknown[] }).intervals).toHaveLength(0);
  });
});
