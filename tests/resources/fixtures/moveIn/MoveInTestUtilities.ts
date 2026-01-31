/**
 * MoveInTestUtilities - Backward compatible wrapper
 * 
 * This class provides the same API as the original moveInUtilities.ts
 * but delegates to the new modular functions.
 * 
 * @deprecated Consider using the new modular functions directly:
 * - import { newUserMoveIn, newUserMoveInAutoPayment } from '../moveIn';
 */

import { Page } from '@playwright/test';
import {
  newUserMoveIn,
  newUserMoveInAutoPayment,
  newUserMoveInManualPayment,
  newUserMoveInSkipPayment,
  newUserMoveInAutoBankAccount,
  newUserMoveInManualBankAccount,
  newUserMoveInAutoFailedBankAccount,
  newUserMoveInManualFailedBankAccount,
} from './newUserFlows';
import type { UtilityCompany } from '../../types/moveIn.types';

/**
 * Static utility class maintaining backward compatibility with existing tests
 */
export class MoveInTestUtilities {
  /**
   * @deprecated Use newUserMoveInAutoPayment() instead
   */
  static async New_User_Move_In_Auto_Payment_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true,
    cardNumber?: string
  ) {
    return newUserMoveInAutoPayment(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG,
      cardNumber
    );
  }

  /**
   * @deprecated Use newUserMoveInManualPayment() instead
   */
  static async New_User_Move_In_Manual_Payment_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true,
    cardNumber?: string
  ) {
    return newUserMoveInManualPayment(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG,
      cardNumber
    );
  }

  /**
   * @deprecated Use newUserMoveInSkipPayment() instead
   */
  static async New_User_Move_In_Skip_Payment(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean
  ) {
    return newUserMoveInSkipPayment(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas
    );
  }

  /**
   * @deprecated Use newUserMoveInAutoBankAccount() instead
   */
  static async New_User_Move_In_Auto_Bank_Account_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true
  ) {
    return newUserMoveInAutoBankAccount(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG
    );
  }

  /**
   * @deprecated Use newUserMoveInManualBankAccount() instead
   */
  static async New_User_Move_In_Manual_Bank_Account_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true
  ) {
    return newUserMoveInManualBankAccount(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG
    );
  }

  /**
   * @deprecated Use newUserMoveInAutoFailedBankAccount() instead
   */
  static async New_User_Move_In_Auto_Failed_Bank_Account_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true
  ) {
    return newUserMoveInAutoFailedBankAccount(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG
    );
  }

  /**
   * @deprecated Use newUserMoveInManualFailedBankAccount() instead
   */
  static async New_User_Move_In_Manual_Failed_Bank_Account_Added(
    page: Page,
    electricCompany: string | null,
    gasCompany: string | null,
    newElectric: boolean,
    newGas: boolean,
    payThroughPG: boolean = true
  ) {
    return newUserMoveInManualFailedBankAccount(
      page,
      electricCompany as UtilityCompany,
      gasCompany as UtilityCompany,
      newElectric,
      newGas,
      payThroughPG
    );
  }
}

export default MoveInTestUtilities;
