import { createLogger } from '../../utils/logger';
import type {
  MovedEmbedRequestBody,
  MovedEmbedApiResponse,
  AvailabilityApiResponse,
  MovedEmbedSuccessResponse,
  AvailabilitySuccessResponse,
} from '../../types/movedEmbed.types';

const log = createLogger('MovedEmbedApi');

const API_BASE_URLS: Record<string, string> = {
  dev: 'https://api-dev.publicgrd.com',
  staging: 'https://api-staging.publicgrd.com',
  production: 'https://api.onepublicgrid.com',
};

/**
 * Helper class for the Moved Direct to Consumer API endpoints.
 *
 * Endpoints:
 *   GET  /v1/utilities/availability/{zip}
 *   POST /v1/moved/embed
 *
 * Auth: Bearer token via MOVED_API_KEY env var
 * Ticket: ENG-2687
 *
 * Note: Path is `/v1/...`, NOT `/api/v1/...` — the latter returns 404 (Doc bug D1).
 */
export class MovedEmbedApi {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    const env = process.env.ENV || 'dev';
    this.baseUrl = API_BASE_URLS[env] || API_BASE_URLS.dev;
    this.token = process.env.MOVED_API_KEY || '';

    if (!this.token) {
      throw new Error('MOVED_API_KEY not set in .env');
    }
  }

  // ─── GET /v1/utilities/availability/{zip} ────────────────────────

  /** GET availability for a zip with auth */
  async getAvailability(zip: string): Promise<AvailabilityApiResponse> {
    const url = `${this.baseUrl}/v1/utilities/availability/${zip}`;
    log.info('GET availability', { zip });

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.token}` },
    });

    const responseBody = await response.json();
    log.info('Response', { status: response.status });
    return { status: response.status, body: responseBody };
  }

  /** GET availability without Authorization header */
  async getAvailabilityNoAuth(zip: string): Promise<AvailabilityApiResponse> {
    const url = `${this.baseUrl}/v1/utilities/availability/${zip}`;
    log.info('GET availability (no auth)', { zip });

    const response = await fetch(url, { method: 'GET' });
    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** GET availability with an invalid Bearer token */
  async getAvailabilityBadToken(zip: string): Promise<AvailabilityApiResponse> {
    const url = `${this.baseUrl}/v1/utilities/availability/${zip}`;
    log.info('GET availability (bad token)', { zip });

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid_token_value' },
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** GET availability with raw token (no Bearer prefix) */
  async getAvailabilityRawToken(zip: string): Promise<AvailabilityApiResponse> {
    const url = `${this.baseUrl}/v1/utilities/availability/${zip}`;
    log.info('GET availability (raw token)', { zip });

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: this.token },
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  // ─── POST /v1/moved/embed ────────────────────────────────────────

  /** POST /v1/moved/embed with typed body */
  async createEmbed(body: MovedEmbedRequestBody): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}/v1/moved/embed`;
    log.info('POST embed', { zip: body.property?.zip });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    log.info('Response', { status: response.status });
    return { status: response.status, body: responseBody };
  }

  /** POST with arbitrary body (for validation tests with invalid types/shapes) */
  async createEmbedRaw(body: Record<string, unknown>): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}/v1/moved/embed`;
    log.info('POST embed (raw)');

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

  /** POST with raw string body (for malformed-JSON tests) */
  async createEmbedRawString(rawBody: string): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}/v1/moved/embed`;
    log.info('POST embed (raw string)');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: rawBody,
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** POST without Authorization header */
  async createEmbedNoAuth(body: MovedEmbedRequestBody): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}/v1/moved/embed`;
    log.info('POST embed (no auth)');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  /** POST with an invalid Bearer token */
  async createEmbedBadToken(body: MovedEmbedRequestBody): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}/v1/moved/embed`;
    log.info('POST embed (bad token)');

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

  /** Send a request with a specific HTTP method against a path (for method-not-allowed tests) */
  async sendMethod(path: string, method: string): Promise<MovedEmbedApiResponse> {
    const url = `${this.baseUrl}${path}`;
    log.info(`${method} ${path}`);

    // Omit Content-Type to avoid Fastify body-validation 400 instead of expected 404
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${this.token}` },
    });

    const responseBody = await response.json();
    return { status: response.status, body: responseBody };
  }

  // ─── Type guards ─────────────────────────────────────────────────

  static isAvailabilitySuccess(body: unknown): body is AvailabilitySuccessResponse {
    return (
      typeof body === 'object' &&
      body !== null &&
      'utilityProviders' in body &&
      Array.isArray((body as AvailabilitySuccessResponse).utilityProviders)
    );
  }

  static isEmbedSuccess(body: unknown): body is MovedEmbedSuccessResponse {
    return (
      typeof body === 'object' &&
      body !== null &&
      'embedURL' in body &&
      typeof (body as MovedEmbedSuccessResponse).embedURL === 'string'
    );
  }
}
