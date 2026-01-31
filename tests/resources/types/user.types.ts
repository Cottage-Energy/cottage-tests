/**
 * Test user data interface with all generated fields
 */
export interface TestUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  unitNumber: string;
  today: string;
  tomorrow: string;
  fourDaysFromNow: string;
  twoDaysAgo: string;
  birthDate: string;
  ssn: string;
  cardExpiry: string;
  cvc: string;
  country: string;
  zip: string;
  electricAmount: number;
  electricAmountActual: string;
  electricServiceFee: number;
  electricServiceFeeActual: string;
  electricAmountTotal: number;
  electricAmountActualTotal: string;
  electricUsage: number;
  gasAmount: number;
  gasAmountActual: string;
  gasServiceFee: number;
  gasServiceFeeActual: string;
  gasAmountTotal: number;
  gasAmountActualTotal: string;
  gasUsage: number;
  combinedAmount: number;
  combinedAmountActual: string;
  combinedServiceFee: number;
  combinedServiceFeeActual: string;
  combinedAmountTotal: number;
  combinedAmountActualTotal: string;
}

/**
 * Options for generating test user data
 */
export interface TestUserOptions {
  /** Service fee percentage (default: 0.03 for 3%) */
  serviceFeePercentage?: number;
  /** Custom email prefix */
  emailPrefix?: string;
  /** Custom email domain */
  emailDomain?: string;
}

/**
 * Payment data structure
 */
export interface PaymentData {
  validCardNumber: string;
  invalidCardNumber: string;
  declinedCardNumber: string;
  insufficientFundsCardNumber: string;
}

/**
 * Database cottage user record
 */
export interface CottageUser {
  id: string;
  email: string;
  accountNumber: string;
  dateOfTextMessageConsent: string | null;
  isAbleToSendTextMessages: boolean;
}

/**
 * Database electric/gas account record
 */
export interface UtilityAccount {
  id: string;
  cottageUserID: string;
  propertyID: string;
}

/**
 * Database bill record
 */
export interface Bill {
  id: string;
  totalAmountDue: number;
  totalUsage: number;
  startDate: string;
  endDate: string;
  statementDate: string;
  dueDate: string;
  ingestionState: 'pending' | 'approved' | 'processed';
  visible: boolean;
}

/**
 * Utility remittance status options
 */
export type RemittanceStatus = 
  | 'failed'
  | 'done'
  | 'cancelled'
  | 'processing'
  | 'ready_for_remittance'
  | 'pending_confirmation'
  | 'requires_review'
  | 'manually_approved'
  | 'waiting_for_payment'
  | 'for_bundling';

/**
 * Payment status options
 */
export type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'pending';
