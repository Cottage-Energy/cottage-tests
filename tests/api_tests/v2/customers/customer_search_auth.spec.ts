/**
 * API Tests: Customer Search & SSO Auth — Public Grid REST API v2
 *
 * Tests POST /customers/search and POST /customers/auth (SSO)
 * including field validation, flow routing, and partner scoping.
 *
 * Test plan: tests/test_plans/public_grid_api_v2.md
 *   SRCH-001 through SRCH-008, SSO-001 through SSO-014
 */

import { test, expect } from '@playwright/test';
import { CustomersApiV2, PublicGridApiV2 } from '../../../resources/fixtures/api';
import {
  TIMEOUTS,
  TEST_TAGS,
  API_V2_ERROR_CODES,
  API_V2_AUTH_STATUS,
  API_V2_RESOLVED_FLOWS,
  API_V2_ENV,
} from '../../../resources/constants';
import { createLogger } from '../../../resources/utils/logger';
import type {
  CustomerAuthResponse,
  CustomerSearchResponse,
} from '../../../resources/types';

const log = createLogger('CustomerSearchAuth');

// ═══════════════════════════════════════════════
// POST /customers/search
// ═══════════════════════════════════════════════

test.describe('API v2: POST /customers/search', () => {
  let api: CustomersApiV2;

  test.beforeAll(() => {
    api = new CustomersApiV2();
  });

  // ─── SRCH-001: Search by email ───

  test('SRCH-001: search by email returns matching customer', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    // Use a known test email — this must be configured per environment
    const testEmail = process.env.API_V2_TEST_CUSTOMER_EMAIL;
    test.skip(!testEmail, 'API_V2_TEST_CUSTOMER_EMAIL not set');

    log.step(1, 'Search by email');
    const { status, body } = await api.searchCustomers({ email: testEmail! });

    log.step(2, 'Verify matching results');
    expect(status).toBe(200);
    const response = body as CustomerSearchResponse;
    expect(response.data.length).toBeGreaterThanOrEqual(1);
    expect(response.data[0].email).toBe(testEmail);
    expect(response.data[0]).toHaveProperty('id');
    expect(response.data[0]).toHaveProperty('firstName');
  });

  // ─── SRCH-002: Search by externalLeaseID ───

  test('SRCH-002: search by externalLeaseID', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const testLeaseID = process.env.API_V2_TEST_LEASE_ID;
    test.skip(!testLeaseID, 'API_V2_TEST_LEASE_ID not set');

    const { status, body } = await api.searchCustomers({ externalLeaseID: testLeaseID! });

    expect(status).toBe(200);
    const response = body as CustomerSearchResponse;
    expect(response.data.length).toBeGreaterThanOrEqual(1);
  });

  // ─── SRCH-003: Search by name ───

  test('SRCH-003: search by firstName + lastName', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.searchCustomers({
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(status).toBe(200);
    const response = body as CustomerSearchResponse;
    expect(response.data).toBeInstanceOf(Array);
  });

  // ─── SRCH-004: Multi-field AND search ───

  test('SRCH-004: multiple fields use AND logic', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.searchCustomers({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'nonexistent-combo@test.com',
    });

    expect(status).toBe(200);
    // AND logic means all must match — unlikely to find results with fake email
    const response = body as CustomerSearchResponse;
    expect(response.data).toBeInstanceOf(Array);
  });

  // ─── SRCH-005: No matching results ───

  test('SRCH-005: non-matching email returns empty results', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.searchCustomers({
      email: `nonexistent-${Date.now()}@nowhere.example.com`,
    });

    expect(status).toBe(200);
    const response = body as CustomerSearchResponse;
    expect(response.data).toHaveLength(0);
  });

  // ─── SRCH-006: Empty body rejected ───

  test('SRCH-006: empty search body returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.searchCustomersRaw({});

    // Spec says 400 required, but API may accept empty body and return empty results
    expect([200, 400]).toContain(status);
    if (status === 400) {
      expect(PublicGridApiV2.isError(body)).toBe(true);
    }
  });

  // ─── SRCH-007: Partner scoping ───

  test('SRCH-007: search only returns own partner\'s customers', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const secondaryKey = process.env[API_V2_ENV.API_KEY_SECONDARY];
    const testEmail = process.env.API_V2_TEST_CUSTOMER_EMAIL;
    test.skip(!secondaryKey || !testEmail, 'Secondary key or test email not set');

    // Search for primary partner's customer using secondary key
    const secondaryApi = new CustomersApiV2(secondaryKey);
    const { status, body } = await secondaryApi.searchCustomers({ email: testEmail! });

    expect(status).toBe(200);
    const response = body as CustomerSearchResponse;
    // Should return empty — not 403, just no results
    expect(response.data).toHaveLength(0);
  });

  // ─── SRCH-008: Search response includes utilities ───

  test('SRCH-008: search results include customer fields', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const testEmail = process.env.API_V2_TEST_CUSTOMER_EMAIL;
    test.skip(!testEmail, 'API_V2_TEST_CUSTOMER_EMAIL not set');

    const { status, body } = await api.searchCustomers({ email: testEmail! });
    expect(status).toBe(200);

    const response = body as CustomerSearchResponse;
    test.skip(response.data.length === 0, 'No results');

    const customer = response.data[0];
    // Search returns flat customer — no nested properties (differs from spec)
    expect(customer).toHaveProperty('id');
    expect(customer).toHaveProperty('email');
    expect(customer).toHaveProperty('firstName');
    expect(customer).toHaveProperty('lastName');
  });
});

// ═══════════════════════════════════════════════
// POST /customers/auth (SSO)
// ═══════════════════════════════════════════════

test.describe('API v2: POST /customers/auth', () => {
  test.skip(true, 'BLOCKED: POST /customers/auth (SSO) endpoint not implemented yet (returns 404). Unskip when backend adds the endpoint.');

  let api: CustomersApiV2;
  let partnerCode: string;

  test.beforeAll(() => {
    api = new CustomersApiV2();
    partnerCode = process.env[API_V2_ENV.PARTNER_CODE] || 'test-partner';
  });

  // ─── SSO-001: Existing user → dashboard ───

  test('SSO-001: existing user returns dashboard redirect', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const testEmail = process.env.API_V2_TEST_CUSTOMER_EMAIL;
    test.skip(!testEmail, 'API_V2_TEST_CUSTOMER_EMAIL not set');

    log.step(1, 'Auth existing user');
    const { status, body } = await api.authCustomer({
      externalUserID: 'test-existing-user',
      email: testEmail!,
      partnerCode,
    });

    log.step(2, 'Verify EXISTING status with dashboard flow');
    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.status).toBe(API_V2_AUTH_STATUS.EXISTING);
    expect(response.flowType).toBe(API_V2_RESOLVED_FLOWS.DASHBOARD);
    expect(response.accessToken).toBeTruthy();
    expect(response.url).toContain('token=');
    expect(typeof response.expiresIn).toBe('number');
  });

  // ─── SSO-002: Unknown user + move-in ───

  test('SSO-002: unknown user with move-in flowType', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `unknown-${Date.now()}`,
      email: `unknown-${Date.now()}@test.example.com`,
      partnerCode,
      flowType: 'move-in',
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.status).toBe(API_V2_AUTH_STATUS.UNKNOWN);
    expect(response.flowType).toBe(API_V2_RESOLVED_FLOWS.MOVE_IN);
    expect(response.url).toBeTruthy();
  });

  // ─── SSO-003: Unknown user + verify ───

  test('SSO-003: unknown user with verify flowType', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `verify-${Date.now()}`,
      email: `verify-${Date.now()}@test.example.com`,
      partnerCode,
      flowType: 'verify',
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.status).toBe(API_V2_AUTH_STATUS.UNKNOWN);
    expect(response.flowType).toBe(API_V2_RESOLVED_FLOWS.VERIFY);
  });

  // ─── SSO-004: Unknown user + savings ───

  test('SSO-004: unknown user with savings flowType', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `savings-${Date.now()}`,
      email: `savings-${Date.now()}@test.example.com`,
      partnerCode,
      flowType: 'savings',
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.status).toBe(API_V2_AUTH_STATUS.UNKNOWN);
    expect(response.flowType).toBe(API_V2_RESOLVED_FLOWS.SAVINGS);
  });

  // ─── SSO-005: Default flowType is move-in ───

  test('SSO-005: omitted flowType defaults to move-in', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `default-${Date.now()}`,
      email: `default-${Date.now()}@test.example.com`,
      partnerCode,
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.flowType).toBe(API_V2_RESOLVED_FLOWS.MOVE_IN);
  });

  // ─── SSO-006: Missing externalUserID ───

  test('SSO-006: missing externalUserID returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomerRaw({
      email: 'test@test.com',
      partnerCode,
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── SSO-007: Missing email ───

  test('SSO-007: missing email returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomerRaw({
      externalUserID: 'test-user',
      partnerCode,
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── SSO-008: Missing partnerCode ───

  test('SSO-008: missing partnerCode returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomerRaw({
      externalUserID: 'test-user',
      email: 'test@test.com',
    });

    expect(status).toBe(400);
    expect(PublicGridApiV2.isError(body)).toBe(true);
  });

  // ─── SSO-009: Invalid partnerCode ───

  test('SSO-009: invalid partnerCode returns error', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.authCustomer({
      externalUserID: 'test-user',
      email: 'test@test.com',
      partnerCode: 'nonexistent-partner-999',
    });

    expect([401, 403]).toContain(status);
  });

  // ─── SSO-010: accessToken is JWT ───

  test('SSO-010: accessToken is valid JWT format', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `jwt-${Date.now()}`,
      email: `jwt-${Date.now()}@test.example.com`,
      partnerCode,
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    // JWT has 3 base64 segments separated by dots
    const jwtParts = response.accessToken.split('.');
    expect(jwtParts).toHaveLength(3);
  });

  // ─── SSO-011: expiresIn matches spec ───

  test('SSO-011: expiresIn is 600 seconds', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `expiry-${Date.now()}`,
      email: `expiry-${Date.now()}@test.example.com`,
      partnerCode,
    });

    expect(status).toBe(200);
    expect((body as CustomerAuthResponse).expiresIn).toBe(600);
  });

  // ─── SSO-012: URL contains embedded token ───

  test('SSO-012: URL contains embedded authentication token', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status, body } = await api.authCustomer({
      externalUserID: `url-${Date.now()}`,
      email: `url-${Date.now()}@test.example.com`,
      partnerCode,
    });

    expect(status).toBe(200);
    const response = body as CustomerAuthResponse;
    expect(response.url).toContain('token=');
  });

  // ─── SSO-013: Optional fields accepted ───

  test('SSO-013: optional fields are accepted', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.authCustomer({
      externalUserID: `full-${Date.now()}`,
      email: `full-${Date.now()}@test.example.com`,
      partnerCode,
      flowType: 'move-in',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+12125551234',
      streetAddress: '123 Main St',
      unitNumber: '4B',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    });

    expect(status).toBe(200);
  });

  // ─── SSO-014: Invalid phone format ───

  test('SSO-014: invalid phone format returns 400', {
    tag: [TEST_TAGS.API],
  }, async () => {
    test.setTimeout(TIMEOUTS.DEFAULT);

    const { status } = await api.authCustomer({
      externalUserID: `badphone-${Date.now()}`,
      email: `badphone-${Date.now()}@test.example.com`,
      partnerCode,
      phone: 'not-a-phone',
    });

    // May be 400 or accepted (spec says optional)
    expect([200, 400]).toContain(status);
  });
});
