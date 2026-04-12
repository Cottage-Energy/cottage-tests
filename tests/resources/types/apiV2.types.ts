/**
 * Type definitions for the Public Grid REST API v2
 * Used by: tests/api_tests/v2/
 *
 * Spec: Public Grid REST API v2 Design Specification (Draft v0.2, March 2026)
 * Base URL: https://api.onepublicgrid.com/api/v2
 */

// ─── Common ───

export interface ApiV2Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  unitNumber?: string;
}

export interface ApiV2Error {
  error: {
    code: ApiV2ErrorCode;
    message: string;
    details?: {
      field?: string;
      reason?: string;
    };
  };
}

export type ApiV2ErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ApiV2Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiV2PaginatedResponse<T> {
  data: T[];
  pagination: ApiV2Pagination;
}

export interface ApiV2PaginationParams {
  limit?: number;
  offset?: number;
}

export type PartnerStatus =
  | 'Pending'
  | 'Pending Review'
  | 'Pending Verification'
  | 'Verification Complete'
  | 'Active'
  | 'Inactive';

// ─── Buildings ───

export interface BuildingUtility {
  utilityCompanyID: string;
  name: string;
  type: 'electric' | 'gas';
  pgEnabled: boolean;
}

export interface Building {
  id: string;
  name: string;
  shortCode: string | null;
  externalID: string | null;
  address: ApiV2Address | null;
  electricCompanyID: string | null;
  gasCompanyID: string | null;
}

export interface BuildingPropertySummary {
  id: number;
  uuid: string;
  unitNumber: string | null;
}

export interface BuildingDetail extends Building {
  properties: BuildingPropertySummary[];
}

export interface CreateBuildingRequest {
  name: string;
  address: Omit<ApiV2Address, 'unitNumber'>;
  externalID?: string;
  utilities?: {
    type: 'electric' | 'gas';
    utilityCompanyID: string;
  }[];
  totalUnitCount?: number;
}

export interface CreateBuildingResponse {
  id: string;
  name: string;
  shortCode: string;
  createdAt: string;
}

// ─── Properties ───

export interface PropertyUtilityAccount {
  accountID: number;
  accountType: 'electric' | 'gas';
  utilityCompanyID: string;
  accountNumber?: string;
  status: PartnerStatus;
  startDate: string;
  endDate: string | null;
}

export interface PropertyCustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Property {
  id: number;
  uuid: string;
  buildingID: string;
  unitNumber: string | null;
  address: ApiV2Address | null;
  electricAccountStatus: string | null;
  gasAccountStatus: string | null;
}

export interface PropertiesFilterParams extends ApiV2PaginationParams {
  buildingID?: string;
  status?: PartnerStatus;
}

// ─── Bills ───

export interface Bill {
  id: number;
  accountID: number;
  accountType: 'electric' | 'gas';
  startDate: string;
  endDate: string;
  statementDate: string;
  dueDate: string;
  totalAmountDueCents: number;
  totalUsage: number;
  usageUnit: string;
  pdfURL: string;
}

export interface BillsFilterParams extends ApiV2PaginationParams {
  accountType?: 'electric' | 'gas';
  startDate?: string;
  endDate?: string;
}

export interface PropertyBillsResponse {
  propertyID: number;
  data: Bill[];
  total: number;
  limit: number;
  offset: number;
}

export interface CustomerPropertyBillsResponse {
  customerID: string;
  propertyID: number;
  data: Bill[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Intervals ───

export interface IntervalReading {
  start: string;
  end: string;
  consumption: number;
  createdAt: string;
}

export interface IntervalsResponse {
  customerID: string;
  propertyID: number;
  firstIntervalDiscovered: string;
  lastIntervalDiscovered: string;
  granularity: number;
  usageUnit: string;
  intervals: IntervalReading[];
  total: number;
}

export interface IntervalsFilterParams {
  startDate?: string;
  endDate?: string;
  granularity?: number;
}

// ─── Customers ───

export interface CustomerPropertyUtility {
  accountID: number;
  accountType: 'electric' | 'gas';
  utilityCompanyID: string;
  status: PartnerStatus;
  startDate: string;
  endDate: string | null;
}

export interface CustomerProperty {
  propertyID: number;
  buildingID: string;
  buildingName: string;
  unitNumber: string;
  utilities: CustomerPropertyUtility[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  properties: CustomerProperty[];
}

export interface CustomerPropertyDetail {
  customerID: string;
  propertyID: number;
  buildingID: string;
  buildingName: string;
  unitNumber: string;
  address: ApiV2Address;
  utilities: PropertyUtilityAccount[];
}

// ─── Customer Search ───

export interface CustomerSearchRequest {
  externalLeaseID?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CustomerSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  properties: {
    propertyID: number;
    buildingID: string;
    buildingName: string;
    unitNumber: string;
    utilities: {
      accountID: number;
      accountType: 'electric' | 'gas';
      status: PartnerStatus;
    }[];
  }[];
}

export interface CustomerSearchResponse {
  data: CustomerSearchResult[];
  total: number;
}

// ─── Customer Auth (SSO) ───

export type AuthFlowType = 'move-in' | 'verify' | 'savings';
export type AuthResolvedFlowType = 'dashboard' | 'verify' | 'savings' | 'move-in';
export type AuthStatus = 'EXISTING' | 'UNKNOWN';

export interface CustomerAuthRequest {
  externalUserID: string;
  email: string;
  partnerCode: string;
  flowType?: AuthFlowType;
  firstName?: string;
  lastName?: string;
  phone?: string;
  streetAddress?: string;
  unitNumber?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface CustomerAuthResponse {
  accessToken: string;
  expiresIn: number;
  status: AuthStatus;
  url: string;
  flowType: AuthResolvedFlowType;
}

// ─── Registration ───

export interface RegistrationMoveInRequest {
  building?: {
    externalID?: string;
    name?: string;
  };
  resident: {
    externalUserID?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
  };
  property?: {
    street?: string;
    unitNumber?: string;
    city?: string;
    state?: string;
    zip?: string;
    externalLeaseID?: string;
  };
  enrollment: {
    moveInDate?: string;
    type: 'move-in' | 'verification';
  };
}

export interface RegistrationSavingsRequest {
  resident: {
    externalUserID?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  property?: {
    street?: string;
    unitNumber?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface RegistrationSuccessResponse {
  success: true;
  data: {
    registrationID: string;
    status: string;
    message: string;
    finishRegistrationURL: string;
  };
}

// ─── Utilities ───

export interface UtilityCompanyV2 {
  id: string;
  name: string | null;
  status: string;
  utilitiesHandled: string[] | null;
  isHandleBilling: boolean;
  logoURL: string | null;
}

export interface UtilitiesFilterParams {
  state?: string;
  pgEnabled?: boolean;
}

export interface ZipUtilityProvider {
  utilityCompanyID: string;
  isPrimaryUtility: boolean;
  state: string;
  name: string;
  status: string;
  utilitiesHandled: string[] | null;
  isHandleBilling: boolean;
  logoURL: string | null;
}

export interface ZipLookupResponse {
  utilityProviders: ZipUtilityProvider[];
}

// ─── Webhooks ───

export type WebhookEventType =
  | 'customer.created'
  | 'customer.activated'
  | 'customer.status_changed'
  | 'customer.deactivated'
  | 'bill.created'
  | 'bill.paid';

// ─── Generic API Response wrapper ───

export interface ApiV2Response<T> {
  status: number;
  body: T | ApiV2Error;
}
