/**
 * Type definitions for the partner register API endpoint
 * Used by: tests/api_tests/register/
 */

export interface RegisterRequestResident {
  firstName: string;
  lastName: string;
  email: string;
  internalID?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface RegisterRequestBuilding {
  internalID?: string;
  name?: string;
  managementCompanyID?: string;
  managementCompanyName?: string;
}

export interface RegisterRequestProperty {
  siteId?: string;
  street?: string;
  unitNumber?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface RegisterRequestEnrollment {
  type?: 'move-in' | 'verification';
  moveInDate?: string;
}

export interface RegisterRequestBody {
  leaseID?: string;
  resident: RegisterRequestResident;
  building?: RegisterRequestBuilding;
  property?: RegisterRequestProperty;
  enrollment: RegisterRequestEnrollment;
}

export interface RegisterSuccessResponse {
  success: true;
  userId: string;
  status: 'REGISTRATION_INCOMPLETE' | 'VERIFICATION_INCOMPLETE';
  message: string;
  finishRegistrationURL: string;
}

export interface RegisterErrorResponse {
  error?: string;
  statusCode?: number;
  code?: string;
  message?: string;
}

export interface RegisterApiResponse {
  status: number;
  body: RegisterSuccessResponse | RegisterErrorResponse;
}
