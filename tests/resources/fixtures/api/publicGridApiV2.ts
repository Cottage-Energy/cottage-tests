/**
 * Base helper class for the Public Grid REST API v2.
 * Provides shared HTTP methods, auth handling, and response parsing.
 *
 * All endpoint-specific helpers (BuildingsApiV2, CustomersApiV2, etc.)
 * extend this class.
 *
 * Spec: Public Grid REST API v2 Design Specification (Draft v0.2)
 */

import { createLogger } from '../../utils/logger';
import { API_V2_BASE_URLS, API_V2_ENV } from '../../constants/apiV2';
import type { ApiV2Error, ApiV2Response } from '../../types/apiV2.types';

const log = createLogger('PublicGridApiV2');

export class PublicGridApiV2 {
  protected readonly baseUrl: string;
  protected readonly apiKey: string;

  constructor(apiKey?: string) {
    const env = process.env[API_V2_ENV.ENVIRONMENT] || 'dev';
    this.baseUrl = API_V2_BASE_URLS[env] || API_V2_BASE_URLS.dev;

    this.apiKey = apiKey || process.env[API_V2_ENV.API_KEY] || '';
    if (!this.apiKey) {
      throw new Error(`${API_V2_ENV.API_KEY} not set in .env — required for API v2 tests`);
    }

    log.info('Initialized', { env, baseUrl: this.baseUrl });
  }

  /** GET request with auth */
  protected async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiV2Response<T>> {
    const url = this.buildUrl(path, params);
    log.info('GET', { path, params });

    const response = await fetch(url, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    return this.parseResponse<T>(response);
  }

  /** POST request with auth and JSON body */
  protected async post<T>(path: string, body: unknown): Promise<ApiV2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    log.info('POST', { path });

    const response = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    return this.parseResponse<T>(response);
  }

  /** GET request WITHOUT auth header (for 401 tests) */
  protected async getNoAuth<T>(path: string): Promise<ApiV2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    log.info('GET (no auth)', { path });

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return this.parseResponse<T>(response);
  }

  /** POST request WITHOUT auth header (for 401 tests) */
  protected async postNoAuth<T>(path: string, body: unknown): Promise<ApiV2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    log.info('POST (no auth)', { path });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return this.parseResponse<T>(response);
  }

  /** GET request with a specific (custom/invalid) Authorization header */
  protected async getWithHeader<T>(path: string, authHeader: string): Promise<ApiV2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    log.info('GET (custom header)', { path });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    return this.parseResponse<T>(response);
  }

  /** Send a request with an arbitrary HTTP method (for 405 tests) */
  protected async sendMethod<T>(method: string, path: string): Promise<ApiV2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    log.info(`${method}`, { path });

    const response = await fetch(url, {
      method,
      headers: this.authHeaders(),
    });

    return this.parseResponse<T>(response);
  }

  /** Standard auth headers */
  private authHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /** Build a URL with optional query parameters */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /** Parse response body as JSON */
  private async parseResponse<T>(response: Response): Promise<ApiV2Response<T>> {
    let body: T | ApiV2Error;
    try {
      body = await response.json();
    } catch {
      body = { error: { code: 'INTERNAL_ERROR', message: 'Failed to parse response JSON' } } as ApiV2Error;
    }

    log.info('Response', { status: response.status });
    return { status: response.status, body };
  }

  /** Type guard: is the response an error? */
  static isError(body: unknown): body is ApiV2Error {
    return (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as ApiV2Error).error === 'object'
    );
  }

  /** Extract error code from an error response */
  static errorCode(body: unknown): string | null {
    if (PublicGridApiV2.isError(body)) {
      return body.error.code;
    }
    return null;
  }
}
