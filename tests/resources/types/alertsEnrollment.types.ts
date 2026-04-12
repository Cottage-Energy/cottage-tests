/**
 * Type definitions for the alerts enrollment API endpoint
 * Used by: tests/api_tests/v1/alerts-enrollment/
 *
 * Endpoint: POST /v1/resident/alerts-enrollment
 * Ticket: ENG-2639
 */

/** Valid partner codes accepted by the Zod enum */
export type AlertsPartnerCode = 'moved' | 'venn' | 'roofstock' | 'virtuo' | 'renew';

export interface AlertsEnrollmentRequestBody {
  partnerCode: AlertsPartnerCode;
  firstName: string;
  lastName: string;
  email: string;
  streetAddress: string;
  unitNumber?: string;
  city: string;
  state: string;
  zip: string;
  consentDate?: string;
}

export interface AlertsEnrollmentSuccessResponse {
  success: true;
  message: string;
}

export interface AlertsEnrollmentErrorResponse {
  success: false;
  message: string;
}

export interface AlertsEnrollmentValidationError {
  statusCode: 400;
  code: 'FST_ERR_VALIDATION';
  error: 'Bad Request';
  message: string;
}

export interface AlertsEnrollmentAuthError {
  error: string;
}

export type AlertsEnrollmentResponseBody =
  | AlertsEnrollmentSuccessResponse
  | AlertsEnrollmentErrorResponse
  | AlertsEnrollmentValidationError
  | AlertsEnrollmentAuthError;

export interface AlertsEnrollmentApiResponse {
  status: number;
  body: AlertsEnrollmentResponseBody;
}
