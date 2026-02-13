/**
 * Supabase database types
 * These types represent the database schema structures
 */

export interface CottageUserRecord {
  id: string;
  email: string;
  accountNumber: string | null;
  dateOfTextMessageConsent: string | null;
  isAbleToSendTextMessages: boolean | null;
}

export interface ElectricAccountRecord {
  id: number;
  cottageUserID: string;
  propertyID: number;
}

export interface GasAccountRecord {
  id: number;
  cottageUserID: string;
  propertyID: number;
}

export interface ElectricBillRecord {
  id: number;
  electricAccountID: number;
  totalAmountDue: number;
  totalUsage: number;
  startDate: string;
  endDate: string;
  statementDate: string;
  dueDate: string;
  visible: boolean;
  ingestionState: string;
}

export interface GasBillRecord {
  id: number;
  gasAccountID: number;
  totalAmountDue: number;
  totalUsage: number;
  startDate: string;
  endDate: string;
  statementDate: string;
  dueDate: string;
  visible: boolean;
  ingestionState: string;
}

export interface PaymentRecord {
  id: string;
  paidBy: string;
  amount: number;
  paymentStatus: string;
}

export interface ChargeAccountRecord {
  id: string;
  electricAccountID: number | null;
  gasAccountID: number | null;
}

export interface UtilityRemittanceRecord {
  id: string;
  chargeAccountID: string;
  amount: number;
  remittanceStatus: string;
}

export interface ResidentRecord {
  id: string;
  cottageUserID: string;
  isRegistrationComplete: boolean;
}

export interface WaitListRecord {
  id: string;
  email: string;
}

export interface LightUserRecord {
  id: string;
  email: string;
}

export interface UtilityCompanyRecord {
  id: string;
  isPriorAddressRequired: boolean;
  isHandleBilling: boolean;
  isBillingRequired: boolean;
}

export interface BuildingRecord {
  id: string;
  shortCode: string;
  isHandleBilling: boolean;
  useEncouragedConversion: boolean;
  electricCompanyID: string | null;
  gasCompanyID: string | null;
}

export interface PropertyRecord {
  id: number;
}

export interface UtilityCompanyQuestionRecord {
  id: string;
  utilityCompanyID: string;
}

export interface UtilityQuestionAnswerRecord {
  id: string;
  cottageUserID: string;
  questionID: string;
  answer: string;
}

export interface MoveInPartnerRecord {
  id: string;
  name: string;
  useEncouragedConversion: boolean;
}
