/**
 * Constants for the Public Grid REST API v2 test suite
 *
 * Spec: Public Grid REST API v2 Design Specification (Draft v0.2, March 2026)
 */

/** Base URLs per environment — v2 API */
export const API_V2_BASE_URLS: Record<string, string> = {
  dev: 'https://api-dev.onepublicgrid.com/api/v2',
  staging: 'https://api-staging.onepublicgrid.com/api/v2',
  production: 'https://api.onepublicgrid.com/api/v2',
} as const;

/** Default pagination values from the spec */
export const API_V2_PAGINATION = {
  /** Default limit for most list endpoints */
  DEFAULT_LIMIT: 50,
  /** Max limit for most list endpoints */
  MAX_LIMIT: 100,
  /** Default limit for bill list endpoints */
  BILLS_DEFAULT_LIMIT: 12,
  /** Max limit for bill list endpoints */
  BILLS_MAX_LIMIT: 50,
  /** Default offset */
  DEFAULT_OFFSET: 0,
} as const;

/** Partner status values returned by the API */
export const API_V2_PARTNER_STATUS = {
  PENDING: 'Pending',
  PENDING_REVIEW: 'Pending Review',
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFICATION_COMPLETE: 'Verification Complete',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

/** SSO auth flow types */
export const API_V2_FLOW_TYPES = {
  MOVE_IN: 'move-in',
  VERIFY: 'verify',
  SAVINGS: 'savings',
} as const;

/** SSO auth resolved flow types (response) */
export const API_V2_RESOLVED_FLOWS = {
  DASHBOARD: 'dashboard',
  MOVE_IN: 'move-in',
  VERIFY: 'verify',
  SAVINGS: 'savings',
} as const;

/** SSO auth status values */
export const API_V2_AUTH_STATUS = {
  EXISTING: 'EXISTING',
  UNKNOWN: 'UNKNOWN',
} as const;

/** Error codes from the spec */
export const API_V2_ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/** Webhook event types */
export const API_V2_WEBHOOK_EVENTS = {
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_ACTIVATED: 'customer.activated',
  CUSTOMER_STATUS_CHANGED: 'customer.status_changed',
  CUSTOMER_DEACTIVATED: 'customer.deactivated',
  BILL_CREATED: 'bill.created',
  BILL_PAID: 'bill.paid',
} as const;

/** Environment variable names for API v2 test config */
export const API_V2_ENV = {
  /** Primary partner API key */
  API_KEY: 'API_V2_KEY',
  /** Secondary partner API key (for isolation tests) */
  API_KEY_SECONDARY: 'API_V2_KEY_SECONDARY',
  /** Partner code for SSO auth tests */
  PARTNER_CODE: 'API_V2_PARTNER_CODE',
  /** Environment (dev/staging/production) */
  ENVIRONMENT: 'ENVIRONMENT',
} as const;

/** UUID regex for validation */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ISO 8601 timestamp regex for validation */
export const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
