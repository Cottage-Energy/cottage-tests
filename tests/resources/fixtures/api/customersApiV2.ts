/**
 * API helper for /customers endpoints (Public Grid REST API v2)
 *
 * Endpoints:
 *   GET  /customers/{customerID}                                          — get customer
 *   GET  /customers/{customerID}/properties/{propertyID}                  — get customer property
 *   GET  /customers/{customerID}/properties/{propertyID}/bills            — list bills
 *   GET  /customers/{customerID}/properties/{propertyID}/bills/{billID}   — get bill
 *   GET  /customers/{customerID}/properties/{propertyID}/intervals        — get intervals
 *   POST /customers/search                                                — search customers
 *   POST /customers/auth                                                  — SSO auth
 */

import { PublicGridApiV2 } from './publicGridApiV2';
import { createLogger } from '../../utils/logger';
import type {
  ApiV2Response,
  Bill,
  BillsFilterParams,
  Customer,
  CustomerAuthRequest,
  CustomerAuthResponse,
  CustomerPropertyBillsResponse,
  CustomerPropertyDetail,
  CustomerSearchRequest,
  CustomerSearchResponse,
  IntervalsFilterParams,
  IntervalsResponse,
} from '../../types/apiV2.types';

const log = createLogger('CustomersApiV2');

export class CustomersApiV2 extends PublicGridApiV2 {
  /** GET /customers/{customerID} */
  async getCustomer(customerID: string): Promise<ApiV2Response<Customer>> {
    log.info('Get customer', { customerID });
    return this.get<Customer>(`/customers/${customerID}`);
  }

  /** GET /customers/{customerID}/properties/{propertyID} */
  async getCustomerProperty(customerID: string, propertyID: number): Promise<ApiV2Response<CustomerPropertyDetail>> {
    log.info('Get customer property', { customerID, propertyID });
    return this.get<CustomerPropertyDetail>(`/customers/${customerID}/properties/${propertyID}`);
  }

  /** GET /customers/{customerID}/properties/{propertyID}/bills */
  async getCustomerPropertyBills(
    customerID: string,
    propertyID: number,
    params?: BillsFilterParams,
  ): Promise<ApiV2Response<CustomerPropertyBillsResponse>> {
    log.info('Get customer property bills', { customerID, propertyID, params });
    return this.get<CustomerPropertyBillsResponse>(
      `/customers/${customerID}/properties/${propertyID}/bills`,
      params as Record<string, string | number>,
    );
  }

  /** GET /customers/{customerID}/properties/{propertyID}/bills/{billID} */
  async getCustomerPropertyBill(
    customerID: string,
    propertyID: number,
    billID: number,
  ): Promise<ApiV2Response<Bill>> {
    log.info('Get specific bill', { customerID, propertyID, billID });
    return this.get<Bill>(`/customers/${customerID}/properties/${propertyID}/bills/${billID}`);
  }

  /** GET /customers/{customerID}/properties/{propertyID}/intervals */
  async getCustomerPropertyIntervals(
    customerID: string,
    propertyID: number,
    params?: IntervalsFilterParams,
  ): Promise<ApiV2Response<IntervalsResponse>> {
    log.info('Get intervals', { customerID, propertyID, params });
    return this.get<IntervalsResponse>(
      `/customers/${customerID}/properties/${propertyID}/intervals`,
      params as Record<string, string | number>,
    );
  }

  /** POST /customers/search */
  async searchCustomers(body: CustomerSearchRequest): Promise<ApiV2Response<CustomerSearchResponse>> {
    log.info('Search customers', { body });
    return this.post<CustomerSearchResponse>('/customers/search', body);
  }

  /** POST /customers/search with empty body (for validation tests) */
  async searchCustomersRaw(body: Record<string, unknown>): Promise<ApiV2Response<CustomerSearchResponse>> {
    log.info('Search customers (raw)', { body });
    return this.post<CustomerSearchResponse>('/customers/search', body);
  }

  /** POST /customers/auth — SSO authentication */
  async authCustomer(body: CustomerAuthRequest): Promise<ApiV2Response<CustomerAuthResponse>> {
    log.info('Auth customer', { email: body.email, flowType: body.flowType });
    return this.post<CustomerAuthResponse>('/customers/auth', body);
  }

  /** POST /customers/auth with partial body (for validation tests) */
  async authCustomerRaw(body: Record<string, unknown>): Promise<ApiV2Response<CustomerAuthResponse>> {
    log.info('Auth customer (raw)', { body });
    return this.post<CustomerAuthResponse>('/customers/auth', body);
  }
}
