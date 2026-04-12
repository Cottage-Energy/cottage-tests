/**
 * API helper for /buildings endpoints (Public Grid REST API v2)
 *
 * Endpoints:
 *   GET  /buildings              — list buildings
 *   GET  /buildings/{buildingID} — get building by ID
 *   POST /buildings/create       — create a building
 */

import { PublicGridApiV2 } from './publicGridApiV2';
import { createLogger } from '../../utils/logger';
import type {
  ApiV2PaginatedResponse,
  ApiV2PaginationParams,
  ApiV2Response,
  Building,
  BuildingDetail,
  CreateBuildingRequest,
  CreateBuildingResponse,
} from '../../types/apiV2.types';

const log = createLogger('BuildingsApiV2');

export class BuildingsApiV2 extends PublicGridApiV2 {
  /** GET /buildings — list buildings with optional pagination */
  async listBuildings(params?: ApiV2PaginationParams): Promise<ApiV2Response<ApiV2PaginatedResponse<Building>>> {
    log.info('List buildings', { params });
    return this.get<ApiV2PaginatedResponse<Building>>('/buildings', params as Record<string, string | number>);
  }

  /** GET /buildings — with raw query params (for negative tests like limit=-1) */
  async listBuildingsRaw(params: Record<string, string | number>): Promise<ApiV2Response<ApiV2PaginatedResponse<Building>>> {
    log.info('List buildings (raw params)', { params });
    return this.get<ApiV2PaginatedResponse<Building>>('/buildings', params);
  }

  /** GET /buildings/{buildingID} — get building detail with properties */
  async getBuilding(buildingID: string): Promise<ApiV2Response<BuildingDetail>> {
    log.info('Get building', { buildingID });
    return this.get<BuildingDetail>(`/buildings/${buildingID}`);
  }

  /** POST /buildings/create — create a new building */
  async createBuilding(body: CreateBuildingRequest): Promise<ApiV2Response<CreateBuildingResponse>> {
    log.info('Create building', { name: body.name });
    return this.post<CreateBuildingResponse>('/buildings/create', body);
  }

  /** POST /buildings/create with partial body (for validation tests) */
  async createBuildingRaw(body: Record<string, unknown>): Promise<ApiV2Response<CreateBuildingResponse>> {
    log.info('Create building (raw)', { body });
    return this.post<CreateBuildingResponse>('/buildings/create', body);
  }

  /** GET /buildings without auth (for 401 tests) */
  async listBuildingsNoAuth(): Promise<ApiV2Response<ApiV2PaginatedResponse<Building>>> {
    log.info('List buildings (no auth)');
    return this.getNoAuth<ApiV2PaginatedResponse<Building>>('/buildings');
  }

  /** GET /buildings with custom auth header (for auth scheme tests) */
  async listBuildingsWithAuth(authHeader: string): Promise<ApiV2Response<ApiV2PaginatedResponse<Building>>> {
    log.info('List buildings (custom auth)');
    return this.getWithHeader<ApiV2PaginatedResponse<Building>>('/buildings', authHeader);
  }

  /** DELETE /buildings/{id} — unsupported method (for 405 tests) */
  async deleteBuildingUnsupported(buildingID: string): Promise<ApiV2Response<unknown>> {
    log.info('DELETE building (unsupported)', { buildingID });
    return this.sendMethod<unknown>('DELETE', `/buildings/${buildingID}`);
  }
}
