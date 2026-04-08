import { createLogger } from '../../utils/logger';
import type {
  AlertsEnrollmentRequestBody,
  AlertsEnrollmentApiResponse,
  AlertsEnrollmentSuccessResponse,
} from '../../types/alertsEnrollment.types';

const log = createLogger('AlertsEnrollmentApi');

const API_BASE_URLS: Record<string, string> = {
  dev: 'https://api-dev.publicgrd.com',
  staging: 'https://api-staging.publicgrd.com',
  production: 'https://api.onepublicgrid.com',
};

/**
 * Helper class for the alerts enrollment API endpoint.
 * Partners use this to enroll residents in energy savings alerts.
 *
 * Endpoint: POST /v1/resident/alerts-enrollment
 * Ticket: ENG-2639
 */
export class AlertsEnrollmentApi {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    const env = process.env.ENV || 'dev';
    this.baseUrl = API_BASE_URLS[env] || API_BASE_URLS.dev;
    this.token = process.env.RENEW_API_KEY || '';

    if (!this.token) {
      throw new Error('RENEW_API_KEY not set in .env');
    }
  }

  /** POST /v1/resident/alerts-enrollment with auth */
  async enroll(body: AlertsEnrollmentRequestBody): Promise<AlertsEnrollmentApiResponse> {
    const url = `${this.baseUrl}/v1/resident/alerts-enrollment`;
    log.info('POST alerts-enrollment', { partnerCode: body.partnerCode, email: body.email });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    log.info('Response', { status: response.status, body: responseBody });
    return { status: response.status, body: responseBody };
  }

  /** POST with partial/invalid body (for validation tests) */
  async enrollRaw(body: Record<string, unknown>): Promise<AlertsEnrollmentApiResponse> {
    const url = `${this.baseUrl}/v1/resident/alerts-enrollment`;
    log.info('POST alerts-enrollment (raw)', { body });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** POST without Authorization header */
  async enrollNoAuth(body: AlertsEnrollmentRequestBody): Promise<AlertsEnrollmentApiResponse> {
    const url = `${this.baseUrl}/v1/resident/alerts-enrollment`;
    log.info('POST alerts-enrollment (no auth)', { email: body.email });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** POST with an invalid Bearer token */
  async enrollBadToken(body: AlertsEnrollmentRequestBody): Promise<AlertsEnrollmentApiResponse> {
    const url = `${this.baseUrl}/v1/resident/alerts-enrollment`;
    log.info('POST alerts-enrollment (bad token)', { email: body.email });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_token_value',
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** Send a request with a specific HTTP method (for method-not-allowed tests) */
  async sendMethod(method: string): Promise<AlertsEnrollmentApiResponse> {
    const url = `${this.baseUrl}/v1/resident/alerts-enrollment`;
    log.info(`${method} alerts-enrollment`);

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** Type guard for success response */
  static isSuccess(body: unknown): body is AlertsEnrollmentSuccessResponse {
    return (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as AlertsEnrollmentSuccessResponse).success === true
    );
  }
}
