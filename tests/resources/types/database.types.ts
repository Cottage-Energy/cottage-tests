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

/**
 * BLNK Ledger types — blnk schema (not accessible via Supabase PostgREST)
 * Queried via direct Postgres connection (tests/resources/utils/postgres.ts)
 * Amounts are in DOLLARS (not cents) — different from Payment table
 */

export interface BlnkBalance {
  balance_id: string;
  balance: number;
  credit_balance: number;
  debit_balance: number;
  inflight_balance: number;
  inflight_credit_balance: number;
  inflight_debit_balance: number;
  ledger_id: string;
  currency: string;
}

export interface BlnkTransaction {
  transaction_id: string;
  source: string;
  destination: string;
  amount: number;
  currency: string;
  status: 'APPLIED' | 'INFLIGHT' | 'QUEUED' | 'REJECTED' | 'VOID';
  reference: string;
  description: string;
  created_at: string;
  meta_data: Record<string, unknown> | null;
}

export interface TransactionMetadataRecord {
  ledgerTransactionID: string;
  electricBillID: number | null;
  gasBillID: number | null;
  dueDate: string;
}

/**
 * Extended Payment record with fields needed for BLNK verification
 */
export interface PaymentDetailRecord {
  id: string;
  paidBy: string;
  amount: number;
  paymentStatus: string;
  stripePaymentID: string | null;
  paymentMethodID: string | null;
  ledgerTransactionID: string | null;
  contributions: PaymentContribution[] | null;
  refundedAmount: number;
  succeededAt: string | null;
}

export interface PaymentContribution {
  amount: number;
  chargeAccountID?: string;
  renewableSubscriptionID?: number;
}

/**
 * Balance snapshot for point-in-time comparison during pipeline testing
 */
export interface BalanceSnapshot {
  balance: number;
  inflight_balance: number;
  inflight_debit_balance: number;
  inflight_credit_balance: number;
  outstanding: number; // balance + inflight_balance
}
