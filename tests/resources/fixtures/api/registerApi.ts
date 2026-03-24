import { createLogger } from '../../utils/logger';
import type {
  RegisterRequestBody,
  RegisterApiResponse,
  RegisterSuccessResponse,
} from '../../types/register.types';

const log = createLogger('RegisterApi');

const API_BASE_URLS: Record<string, string> = {
  dev: 'https://api-dev.publicgrd.com',
  staging: 'https://api-staging.publicgrd.com',
  production: 'https://api.onepublicgrid.com',
};

/**
 * Helper class for the partner register API endpoint.
 * Used to create resident accounts via the finish-registration flow.
 */
export class RegisterApi {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    const env = process.env.ENV || 'dev';
    this.baseUrl = API_BASE_URLS[env] || API_BASE_URLS.dev;
    this.token = process.env.FINISH_REG_TOKEN || '';

    if (!this.token) {
      throw new Error('FINISH_REG_TOKEN not set in .env');
    }
  }

  /**
   * Call the partner register endpoint
   * @param body - Request payload
   * @param partner - Partner slug in the URL path (default: 'test-partner')
   */
  async register(
    body: RegisterRequestBody,
    partner: string = 'test-partner',
  ): Promise<RegisterApiResponse> {
    const url = `${this.baseUrl}/v1/${partner}/register`;
    log.info('POST register', { partner, email: body.resident.email });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();

    log.info('Response', {
      status: response.status,
      success: responseBody.success,
      userId: responseBody.userId,
    });

    return { status: response.status, body: responseBody };
  }

  /**
   * Call the register endpoint WITHOUT auth header (for negative tests)
   */
  async registerNoAuth(body: RegisterRequestBody): Promise<RegisterApiResponse> {
    const url = `${this.baseUrl}/v1/test-partner/register`;
    log.info('POST register (no auth)', { email: body.resident.email });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /**
   * Extract leaseID from a finishRegistrationURL
   */
  static extractLeaseID(finishRegURL: string): string | null {
    const url = new URL(finishRegURL);
    return url.searchParams.get('leaseID');
  }

  /**
   * Check if the response is a success response (type guard)
   */
  static isSuccess(body: unknown): body is RegisterSuccessResponse {
    return (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as RegisterSuccessResponse).success === true &&
      'finishRegistrationURL' in body
    );
  }
}
