import { Page } from '@playwright/test';

/**
 * Payment type options for move-in flow
 */
export type PaymentType = 'auto' | 'manual' | 'skip';

/**
 * Payment method options
 */
export type PaymentMethod = 'card' | 'bank';

/**
 * Bank account validity for testing
 */
export type BankAccountValidity = 'valid' | 'invalid';

/**
 * Supported utility companies
 */
export type UtilityCompany = 
  | 'COMED'
  | 'CON-EDISON'
  | 'EVERSOURCE'
  | 'TX-DEREG'
  | 'COSERV'
  | 'BGE'
  | 'NGMA'
  | 'DTE'
  | 'PSEG'
  | 'DOMINION'
  | 'EVERGY'
  | 'DELMARVA'
  | 'PGE'
  | 'ACE'
  | 'FPL'
  | 'XCEL-ENERGY'
  | 'PSEG-LI'
  | 'LA-DWP'
  | 'SCE'
  | 'SDGE'
  | 'PECO'
  | 'PEPCO'
  | 'POTOMAC-EDISON'
  | 'PSE'
  | 'DUKE'
  | 'NYS-EG'
  | null;

/**
 * Options for move-in flow
 */
export interface MoveInOptions {
  /** The page instance from Playwright */
  page: Page;
  /** Electric utility company identifier */
  electricCompany: UtilityCompany;
  /** Gas utility company identifier */
  gasCompany: UtilityCompany;
  /** Whether setting up new electric service */
  newElectric: boolean;
  /** Whether setting up new gas service */
  newGas: boolean;
  /** Payment type for the move-in */
  paymentType?: PaymentType;
  /** Payment method to use */
  paymentMethod?: PaymentMethod;
  /** Whether to pay through Public Grid */
  payThroughPG?: boolean;
  /** Custom card number for testing */
  cardNumber?: string;
  /** Bank account validity for testing failed payments */
  bankAccountValidity?: BankAccountValidity;
  /** Custom move-in date field (default: 'Today') */
  moveInDateField?: 'Today' | 'Tomorrow' | 'FourDaysFromNow';
}

/**
 * Result from a successful move-in flow
 */
export interface MoveInResult {
  /** The generated account number */
  accountNumber: string;
  /** The cottage user ID from database */
  cottageUserId: string;
  /** Full name with PGTest prefix */
  pgUserName: string;
  /** First name only with PGTest prefix */
  pgUserFirstName: string;
  /** Generated email address */
  pgUserEmail: string;
  /** Whether SMS consent was given */
  smsConsent: boolean;
}

/**
 * Company-specific question answers
 */
export interface CompanyQuestionAnswers {
  question1Answer?: string;
  question2Answer?: string;
}

/**
 * Address data structure from move_in-data.json
 */
export interface AddressData {
  COMEDaddress: string;
  CON_EDISONaddress: string;
  EVERSOURCEaddress: string;
  TX_DEREGaddress: string;
  COSERVaddress: string;
  GUID1: string;
  GUID2: string;
  [key: string]: string;
}

/**
 * Map of company names to their address data keys
 */
export const COMPANY_ADDRESS_MAP: Record<string, string> = {
  'COMED': 'COMEDaddress',
  'CON_EDISON': 'CON_EDISONaddress',
  'EVERSOURCE': 'EVERSOURCEaddress',
  'TX_DEREG': 'TX_DEREGaddress',
  'COSERV': 'COSERVaddress',
};
