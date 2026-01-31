/**
 * Move-In Test Utilities
 * 
 * This is a backward-compatible wrapper that re-exports from the new modular structure.
 * 
 * @example
 * // Preferred approach - using the new unified API:
 * import { newUserMoveIn } from './moveIn';
 * const result = await newUserMoveIn({
 *   page,
 *   electricCompany: 'COMED',
 *   gasCompany: null,
 *   newElectric: true,
 *   newGas: false,
 *   paymentType: 'auto',
 *   paymentMethod: 'card',
 *   payThroughPG: true
 * });
 * 
 * // Legacy approach (still supported):
 * import { New_User_Move_In_Auto_Payment_Added } from './moveInUtilities';
 */

// Re-export all from the new modular structure
export { 
  MoveInTestUtilities,
  newUserMoveIn,
  newUserMoveInAutoPayment,
  newUserMoveInManualPayment,
  newUserMoveInSkipPayment,
  newUserMoveInAutoBankAccount,
  newUserMoveInManualBankAccount,
  newUserMoveInAutoFailedBankAccount,
  newUserMoveInManualFailedBankAccount,
  newUserMoveInAddressParameter,
  newUserMoveInGuidFlow,
  newUserMoveInAddressParameterAndGuid,
  moveInExistingUtilityAccount,
} from './moveIn';

// Re-export types
export type { 
  MoveInOptions, 
  MoveInResult,
  PaymentType,
  PaymentMethod,
  UtilityCompany,
  BankAccountValidity,
} from '../types/moveIn.types';

// ============================================================================
// Legacy Function Aliases (Deprecated)
// These map old function names to new ones for backward compatibility
// ============================================================================

import { 
  newUserMoveInAutoPayment,
  newUserMoveInManualPayment,
  newUserMoveInSkipPayment,
  newUserMoveInAutoBankAccount,
  newUserMoveInManualBankAccount,
  newUserMoveInAutoFailedBankAccount,
  newUserMoveInManualFailedBankAccount,
  newUserMoveInAddressParameter,
  newUserMoveInGuidFlow,
  newUserMoveInAddressParameterAndGuid,
  moveInExistingUtilityAccount,
} from './moveIn';
import type { Page } from '@playwright/test';
import type { UtilityCompany } from '../types/moveIn.types';

/**
 * @deprecated Use newUserMoveInAutoPayment() instead
 */
export const New_User_Move_In_Auto_Payment_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
) => newUserMoveInAutoPayment(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG, cardNumber);

/**
 * @deprecated Use newUserMoveInManualPayment() instead
 */
export const New_User_Move_In_Manual_Payment_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
) => newUserMoveInManualPayment(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG, cardNumber);

/**
 * @deprecated Use newUserMoveInSkipPayment() instead
 */
export const New_User_Move_In_Skip_Payment = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  _cardNumber?: string
) => newUserMoveInSkipPayment(page, electricCompany, gasCompany, newElectric, newGas);

/**
 * @deprecated Use newUserMoveInAutoBankAccount() instead
 */
export const New_User_Move_In_Auto_Bank_Account_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
) => newUserMoveInAutoBankAccount(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG);

/**
 * @deprecated Use newUserMoveInManualBankAccount() instead
 */
export const New_User_Move_In_Manual_Bank_Account_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
) => newUserMoveInManualBankAccount(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG);

/**
 * @deprecated Use newUserMoveInAutoFailedBankAccount() instead
 */
export const New_User_Move_In_Auto_Failed_Bank_Account_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
) => newUserMoveInAutoFailedBankAccount(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG);

/**
 * @deprecated Use newUserMoveInManualFailedBankAccount() instead
 */
export const New_User_Move_In_Manual_Failed_Bank_Account_Added = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
) => newUserMoveInManualFailedBankAccount(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG);

/**
 * @deprecated Use newUserMoveInAddressParameter() instead
 */
export const New_User_Move_In_Address_Parameter_Flow = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
) => newUserMoveInAddressParameter(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG, cardNumber);

/**
 * @deprecated Use newUserMoveInGuidFlow() instead
 */
export const New_User_Move_In_GUID_Flow = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
) => newUserMoveInGuidFlow(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG, cardNumber);

/**
 * @deprecated Use newUserMoveInAddressParameterAndGuid() instead
 */
export const New_User_Move_In_Address_Parameter_And_GUID_Flow = (
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
) => newUserMoveInAddressParameterAndGuid(page, electricCompany, gasCompany, newElectric, newGas, payThroughPG, cardNumber);

/**
 * @deprecated Use moveInExistingUtilityAccount() instead
 */
export const Move_In_Existing_Utility_Account = (
  page: Page,
  newElectric: boolean,
  newGas: boolean,
  submitRequest: boolean
) => moveInExistingUtilityAccount(page, newElectric, newGas, submitRequest);





