/**
 * API helper for /utilities endpoints (Public Grid REST API v2)
 *
 * Endpoints:
 *   GET /utilities          — list utility companies
 *   GET /utilities/zip/{zip} — zip code utility lookup
 */

import { PublicGridApiV2 } from './publicGridApiV2';
import { createLogger } from '../../utils/logger';
import type {
  ApiV2Response,
  UtilitiesFilterParams,
  UtilityCompanyV2,
  ZipLookupResponse,
} from '../../types/apiV2.types';

const log = createLogger('UtilitiesApiV2');

interface UtilitiesListResponse {
  data: UtilityCompanyV2[];
  total: number;
}

export class UtilitiesApiV2 extends PublicGridApiV2 {
  /** GET /utilities — list with optional filters */
  async listUtilities(params?: UtilitiesFilterParams): Promise<ApiV2Response<UtilitiesListResponse>> {
    log.info('List utilities', { params });
    return this.get<UtilitiesListResponse>('/utilities', params as Record<string, string | number | boolean>);
  }

  /** GET /utilities/zip/{zip} */
  async lookupZip(zip: string): Promise<ApiV2Response<ZipLookupResponse>> {
    log.info('Zip lookup', { zip });
    return this.get<ZipLookupResponse>(`/utilities/zip/${zip}`);
  }
}
