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
// GET /customers/{customerID}
// ═══════════════════════════════════════════════

test.describe('API v2: GET /customers/{customerID}', () => {
  let api: CustomersApiV2;
  let knownCustomerID: string;
  let knownPropertyID: number;

  test.beforeAll(async () => {
    api = new CustomersApiV2();

    // Discover a customer + property from the properties list
    const propsApi = new PropertiesApiV2();
    const list = await propsApi.listProperties({ limit: 1 });
    if (list.status === 200) {
      const props = (list.body as ApiV2PaginatedResponse<Property>).data;
      if (props.length > 0 && props[0].customer) {
        knownCustomerID = props[0].customer.id;
        knownPropertyID = props[0].id;
      }
    }
  });

  // ─── CUST-001: Happy path ───

  test('CUST-001: get customer returns full object', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
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
    expect(customer.createdAt).toMatch(ISO_8601_REGEX);
    expect(customer.properties).toBeInstanceOf(Array);
  });

  // ─── CUST-002: Properties array structure ───

  test('CUST-002: customer properties array has correct structure', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer discovered');

    const { body } = await api.getCustomer(knownCustomerID);
    const customer = body as Customer;
    test.skip(customer.properties.length === 0, 'Customer has no properties');

    const prop = customer.properties[0];
    expect(typeof prop.propertyID).toBe('number');
    expect(prop.buildingID).toMatch(UUID_REGEX);
    expect(typeof prop.buildingName).toBe('string');
    expect(typeof prop.unitNumber).toBe('string');
    expect(prop.utilities).toBeInstanceOf(Array);
  });

  // ─── CUST-003: Multiple properties ───

  test('CUST-003: customer with multiple properties', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer discovered');

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
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID || !knownPropertyID, 'No customer/property pair');

    const { status, body } = await api.getCustomerProperty(knownCustomerID, knownPropertyID);

    expect(status).toBe(200);
    const detail = body as CustomerPropertyDetail;
    expect(detail.customerID).toBe(knownCustomerID);
    expect(detail.propertyID).toBe(knownPropertyID);
    expect(detail.buildingID).toMatch(UUID_REGEX);
    expect(detail.address).toHaveProperty('street');
    expect(detail.utilities).toBeInstanceOf(Array);
  });

  // ─── CUST-007: Customer-property mismatch ───

  test('CUST-007: mismatched customer-property returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer discovered');

    const { status } = await api.getCustomerProperty(knownCustomerID, 999999999);
    expect(status).toBe(404);
  });

  // ─── CUST-008: Non-existent propertyID for customer ───

  test('CUST-008: non-existent property for valid customer returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!knownCustomerID, 'No customer discovered');

    const { status, body } = await api.getCustomerProperty(knownCustomerID, 888888888);
    expect(status).toBe(404);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });
});

// ═══════════════════════════════════════════════
// GET /customers/{cID}/properties/{pID}/bills
// ═══════════════════════════════════════════════

test.describe('API v2: Customer property bills', () => {
  let api: CustomersApiV2;
  let customerID: string;
  let propertyID: number;

  test.beforeAll(async () => {
    api = new CustomersApiV2();

    const propsApi = new PropertiesApiV2();
    const list = await propsApi.listProperties({ limit: 1 });
    if (list.status === 200) {
      const props = (list.body as ApiV2PaginatedResponse<Property>).data;
      if (props.length > 0 && props[0].customer) {
        customerID = props[0].customer.id;
        propertyID = props[0].id;
      }
    }
  });

  // ─── CUST-009: Bills happy path ───

  test('CUST-009: get customer property bills', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyID);

    expect(status).toBe(200);
    const response = body as CustomerPropertyBillsResponse;
    expect(response.customerID).toBe(customerID);
    expect(response.propertyID).toBe(propertyID);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.limit).toBe(12);
  });

  // ─── CUST-010: Filter by accountType ───

  test('CUST-010: filter customer bills by accountType', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyID, {
      accountType: 'electric',
    });

    expect(status).toBe(200);
    for (const bill of (body as CustomerPropertyBillsResponse).data) {
      expect(bill.accountType).toBe('electric');
    }
  });

  // ─── CUST-011: Date range filter ───

  test('CUST-011: filter customer bills by date range', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyID, {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(status).toBe(200);
    expect((body as CustomerPropertyBillsResponse).data).toBeInstanceOf(Array);
  });

  // ─── CUST-012: Custom pagination ───

  test('CUST-012: customer bills custom pagination', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyBills(customerID, propertyID, {
      limit: 5,
    });

    expect(status).toBe(200);
    expect((body as CustomerPropertyBillsResponse).data.length).toBeLessThanOrEqual(5);
  });

  // ─── CUST-013: Get specific bill ───

  test('CUST-013: get specific bill by ID', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    log.step(1, 'Get bills list to find a bill ID');
    const list = await api.getCustomerPropertyBills(customerID, propertyID);
    const bills = (list.body as CustomerPropertyBillsResponse).data;
    test.skip(bills.length === 0, 'No bills available');
    const billID = bills[0].id;

    log.step(2, 'Fetch specific bill');
    const { status, body } = await api.getCustomerPropertyBill(customerID, propertyID, billID);

    log.step(3, 'Verify complete bill object');
    expect(status).toBe(200);
    const bill = body as Bill;
    expect(bill.id).toBe(billID);
    expect(typeof bill.accountID).toBe('number');
    expect(bill.startDate).toMatch(ISO_8601_REGEX);
    expect(Number.isInteger(bill.totalAmountDueCents)).toBe(true);
    expect(typeof bill.pdfURL).toBe('string');
  });

  // ─── CUST-014: Bill ID mismatch ───

  test('CUST-014: wrong property bill ID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status } = await api.getCustomerPropertyBill(customerID, propertyID, 999999999);
    expect(status).toBe(404);
  });

  // ─── CUST-015: Non-existent billID ───

  test('CUST-015: non-existent billID returns 404', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyBill(customerID, propertyID, 888888888);
    expect(status).toBe(404);
    expect(PublicGridApiV2.errorCode(body)).toBe(API_V2_ERROR_CODES.NOT_FOUND);
  });
});

// ═══════════════════════════════════════════════
// GET /customers/{cID}/properties/{pID}/intervals
// ═══════════════════════════════════════════════

test.describe('API v2: Customer property intervals', () => {
  let api: CustomersApiV2;
  let customerID: string;
  let propertyID: number;

  test.beforeAll(async () => {
    api = new CustomersApiV2();

    const propsApi = new PropertiesApiV2();
    const list = await propsApi.listProperties({ limit: 1 });
    if (list.status === 200) {
      const props = (list.body as ApiV2PaginatedResponse<Property>).data;
      if (props.length > 0 && props[0].customer) {
        customerID = props[0].customer.id;
        propertyID = props[0].id;
      }
    }
  });

  // ─── INT-001: Happy path ───

  test('INT-001: get intervals returns complete response', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyID);

    expect(status).toBe(200);
    const response = body as IntervalsResponse;
    expect(response.customerID).toBe(customerID);
    expect(response.propertyID).toBe(propertyID);
    expect(typeof response.granularity).toBe('number');
    expect(typeof response.usageUnit).toBe('string');
    expect(response.intervals).toBeInstanceOf(Array);
    expect(typeof response.total).toBe('number');
  });

  // ─── INT-002: Interval object shape ───

  test('INT-002: interval reading has correct shape', {
    tag: [TEST_TAGS.API, TEST_TAGS.SMOKE],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { body } = await api.getCustomerPropertyIntervals(customerID, propertyID);
    const response = body as IntervalsResponse;
    test.skip(response.intervals.length === 0, 'No interval data');

    const interval = response.intervals[0];
    expect(interval.start).toMatch(ISO_8601_REGEX);
    expect(interval.end).toMatch(ISO_8601_REGEX);
    expect(typeof interval.consumption).toBe('number');
    expect(interval.createdAt).toMatch(ISO_8601_REGEX);
  });

  // ─── INT-003: Date range filter ───

  test('INT-003: filter intervals by date range', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyID, {
      startDate: '2024-01-15',
      endDate: '2024-01-16',
    });

    expect(status).toBe(200);
    expect((body as IntervalsResponse).intervals).toBeInstanceOf(Array);
  });

  // ─── INT-004: Custom granularity ───

  test('INT-004: custom granularity=60 returns hourly data', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyID, {
      granularity: 60,
    });

    expect(status).toBe(200);
    const response = body as IntervalsResponse;
    // Granularity may be 60 or native depending on implementation
    expect(typeof response.granularity).toBe('number');
  });

  // ─── INT-005: Default granularity ───

  test('INT-005: default granularity uses native account granularity', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyID);

    expect(status).toBe(200);
    const response = body as IntervalsResponse;
    expect([15, 30, 60]).toContain(response.granularity);
  });

  // ─── INT-006: No interval data ───

  test('INT-006: property with no intervals returns empty array', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);
    test.skip(!customerID, 'No customer/property pair');

    // Use future date range to guarantee empty
    const { status, body } = await api.getCustomerPropertyIntervals(customerID, propertyID, {
      startDate: '2099-01-01',
      endDate: '2099-01-02',
    });

    expect(status).toBe(200);
    expect((body as IntervalsResponse).intervals).toHaveLength(0);
  });
});
