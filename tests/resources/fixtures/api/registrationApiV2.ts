/**
 * API helper for /registration endpoints (Public Grid REST API v2)
 *
 * Endpoints:
 *   POST /registration/move-in             — register resident + initiate move-in
 *   POST /registration/savings-enrollment  — enroll in savings program
 */

import { PublicGridApiV2 } from './publicGridApiV2';
import { createLogger } from '../../utils/logger';
import type {
  ApiV2Response,
  RegistrationMoveInRequest,
  RegistrationSavingsRequest,
  RegistrationSuccessResponse,
} from '../../types/apiV2.types';

const log = createLogger('RegistrationApiV2');

const EMAIL_PREFIX = 'pgtest+apiv2';
const EMAIL_DOMAIN = '@joinpublicgrid.com';

export class RegistrationApiV2 extends PublicGridApiV2 {
  /** POST /registration/move-in */
  async registerMoveIn(body: RegistrationMoveInRequest): Promise<ApiV2Response<RegistrationSuccessResponse>> {
    log.info('Register move-in', { email: body.resident.email, type: body.enrollment.type });
    return this.post<RegistrationSuccessResponse>('/registration/move-in', body);
  }

  /** POST /registration/move-in with raw body (for validation tests) */
  async registerMoveInRaw(body: Record<string, unknown>): Promise<ApiV2Response<RegistrationSuccessResponse>> {
    log.info('Register move-in (raw)');
    return this.post<RegistrationSuccessResponse>('/registration/move-in', body);
  }

  /** POST /registration/savings-enrollment */
  async registerSavings(body: RegistrationSavingsRequest): Promise<ApiV2Response<RegistrationSuccessResponse>> {
    log.info('Register savings', { email: body.resident.email });
    return this.post<RegistrationSuccessResponse>('/registration/savings-enrollment', body);
  }

  /** POST /registration/savings-enrollment with raw body */
  async registerSavingsRaw(body: Record<string, unknown>): Promise<ApiV2Response<RegistrationSuccessResponse>> {
    log.info('Register savings (raw)');
    return this.post<RegistrationSuccessResponse>('/registration/savings-enrollment', body);
  }

  /** Generate a unique test email to avoid collisions */
  static testEmail(suffix: string): string {
    const ts = Date.now().toString(36);
    return `${EMAIL_PREFIX}-${suffix}-${ts}${EMAIL_DOMAIN}`;
  }

  /** Build a minimal valid move-in request */
  static minimalMoveIn(email: string): RegistrationMoveInRequest {
    return {
      resident: {
        firstName: 'QA',
        lastName: 'ApiV2Test',
        email,
      },
      enrollment: { type: 'move-in' },
    };
  }

  /** Build a full move-in request with all optional fields */
  static fullMoveIn(email: string, overrides?: Partial<RegistrationMoveInRequest>): RegistrationMoveInRequest {
    return {
      building: {
        externalID: `bld-${Date.now().toString(36)}`,
        name: 'QA Test Building',
        ...overrides?.building,
      },
      resident: {
        externalUserID: `user-${Date.now().toString(36)}`,
        firstName: 'QA',
        lastName: 'ApiV2Full',
        email,
        phone: '+11111111111',
        dateOfBirth: '1990-01-15',
        ...overrides?.resident,
      },
      property: {
        street: '123 Test St',
        unitNumber: '4B',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        externalLeaseID: `lease-${Date.now().toString(36)}`,
        ...overrides?.property,
      },
      enrollment: {
        moveInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'move-in',
        ...overrides?.enrollment,
      },
    };
  }

  /** Build a minimal valid savings enrollment request */
  static minimalSavings(email: string): RegistrationSavingsRequest {
    return {
      resident: {
        firstName: 'QA',
        lastName: 'ApiV2Savings',
        email,
      },
    };
  }

  /** Type guard: is the response a success? */
  static isSuccess(body: unknown): body is RegistrationSuccessResponse {
    return (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as RegistrationSuccessResponse).success === true &&
      'data' in body
    );
  }
}
