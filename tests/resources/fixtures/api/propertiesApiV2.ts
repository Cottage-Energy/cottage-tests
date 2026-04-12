/**
 * API helper for /properties endpoints (Public Grid REST API v2)
 *
 * Endpoints:
 *   GET /properties                     — list properties
 *   GET /properties/{propertyID}        — get property by ID
 *   GET /properties/{propertyID}/bills  — get property bills
 */

import { PublicGridApiV2 } from './publicGridApiV2';
import { createLogger } from '../../utils/logger';
import type {
  ApiV2PaginatedResponse,
  ApiV2Response,
  BillsFilterParams,
  PropertiesFilterParams,
  Property,
  PropertyBillsResponse,
} from '../../types/apiV2.types';

const log = createLogger('PropertiesApiV2');

export class PropertiesApiV2 extends PublicGridApiV2 {
  /** GET /properties — list with optional filters */
  async listProperties(params?: PropertiesFilterParams): Promise<ApiV2Response<ApiV2PaginatedResponse<Property>>> {
    log.info('List properties', { params });
    return this.get<ApiV2PaginatedResponse<Property>>('/properties', params as Record<string, string | number>);
  }

  /** GET /properties — with raw query params (for negative tests) */
  async listPropertiesRaw(params: Record<string, string | number | boolean>): Promise<ApiV2Response<ApiV2PaginatedResponse<Property>>> {
    log.info('List properties (raw)', { params });
    return this.get<ApiV2PaginatedResponse<Property>>('/properties', params as Record<string, string | number>);
  }

  /** GET /properties/{propertyID} */
  async getProperty(propertyID: number | string): Promise<ApiV2Response<Property>> {
    log.info('Get property', { propertyID });
    return this.get<Property>(`/properties/${propertyID}`);
  }

  /** GET /properties/{propertyID}/bills */
  async getPropertyBills(propertyID: number, params?: BillsFilterParams): Promise<ApiV2Response<PropertyBillsResponse>> {
    log.info('Get property bills', { propertyID, params });
    return this.get<PropertyBillsResponse>(
      `/properties/${propertyID}/bills`,
      params as Record<string, string | number>,
    );
  }

  /** GET /properties/{propertyID}/bills — raw params (for negative tests) */
  async getPropertyBillsRaw(propertyID: number, params: Record<string, string | number>): Promise<ApiV2Response<PropertyBillsResponse>> {
    log.info('Get property bills (raw)', { propertyID, params });
    return this.get<PropertyBillsResponse>(`/properties/${propertyID}/bills`, params);
  }
}
