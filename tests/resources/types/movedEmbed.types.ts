/**
 * Type definitions for the Moved Direct to Consumer API endpoints
 * Used by: tests/api_tests/v1/moved-embed/
 *
 * Endpoints:
 *   GET  /v1/utilities/availability/{zip}
 *   POST /v1/moved/embed
 * Ticket: ENG-2687
 */

// ─── GET /v1/utilities/availability/{zip} ─────────────────────────

export interface UtilityProvider {
  isPrimaryUtility: boolean;
  pgEnabled: boolean;
  utilityCompanyID: string;
  utilityCompanyName: string;
  /** Returned as null in dev for all probed utilities (D6 — docs say string) */
  phone: string | null;
  /** Returned as empty string in dev (D6 — docs say URL string) */
  website: string;
}

export interface AvailabilitySuccessResponse {
  utilityProviders: UtilityProvider[];
}

// ─── POST /v1/moved/embed ─────────────────────────────────────────

export interface MovedEmbedResident {
  /** Mapped to `leaseID` in the embed URL (D4 — undocumented mapping) */
  internalID?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** Spec says digits only; reality accepts formatted strings (B2) */
  phone?: string;
  /** YYYY-MM-DD */
  dateOfBirth?: string;
  /** YYYY-MM-DD; spec says cannot be more than 3 days in past (B1 — boundary leaky) */
  moveInDate?: string;
}

export interface MovedEmbedProperty {
  /** Maps to `streetAddress` URL param (D2 — docs say `street`) */
  street?: string;
  /** Maps to `unitNumber` URL param (D2 — docs say `unit`) */
  unitNumber?: string;
  city?: string;
  /** 2-char US state abbreviation (validation enforces <=2 chars) */
  state?: string;
  /** REQUIRED — 5-digit US ZIP */
  zip: string;
}

export interface MovedEmbedRequestBody {
  isTransfer?: boolean;
  /** Object is required (D7 — docs imply optional via per-field "Required: No") */
  resident: MovedEmbedResident;
  property: MovedEmbedProperty;
}

export interface MovedEmbedSuccessResponse {
  /**
   * Format: `https://{env-host}/move-in?shortCode=moved&...`
   * In dev: `https://dev.onepublicgrid.com/move-in?...` (D3)
   */
  embedURL: string;
}

// ─── Shared error shapes ───────────────────────────────────────────

export interface FastifyValidationError {
  statusCode: 400;
  code: 'FST_ERR_VALIDATION' | 'FST_ERR_CTP_INVALID_JSON_BODY';
  error: 'Bad Request';
  message: string;
}

export interface MovedEmbedAuthError {
  error: string;
}

export interface MovedEmbedRouteNotFoundError {
  statusCode: 404;
  error: 'Not Found';
  message: string;
}

// ─── Discriminated unions ─────────────────────────────────────────

export type AvailabilityResponseBody =
  | AvailabilitySuccessResponse
  | FastifyValidationError
  | MovedEmbedAuthError
  | MovedEmbedRouteNotFoundError;

export type MovedEmbedResponseBody =
  | MovedEmbedSuccessResponse
  | FastifyValidationError
  | MovedEmbedAuthError
  | MovedEmbedRouteNotFoundError;

export interface AvailabilityApiResponse {
  status: number;
  body: AvailabilityResponseBody;
}

export interface MovedEmbedApiResponse {
  status: number;
  body: MovedEmbedResponseBody;
}
