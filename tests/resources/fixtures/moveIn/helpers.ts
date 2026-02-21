import { MoveInPage } from '../../page_objects/move_in_page';
import * as MoveInData from '../../data/move_in-data.json';
import { normalizeCompanyName } from '../../constants/companies';
import { loggers } from '../../utils/logger';
import type { UtilityCompany } from '../../types/moveIn.types';

const log = loggers.moveIn.child('Helpers');

/**
 * Helper functions for move-in flows
 */

/**
 * Get the address for a given company
 */
export function getAddressForCompany(
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany
): string {
  const defaultAddress = MoveInData.COMEDaddress;

  if (electricCompany === null && gasCompany !== null) {
    const gasKey = normalizeCompanyName(gasCompany);
    if (gasKey) {
      const addressKey = `${gasKey}address`;
      const address = (MoveInData as Record<string, string>)[addressKey];
      if (address) return address;
    }
  } else if (electricCompany !== null) {
    const electricKey = normalizeCompanyName(electricCompany);
    if (electricKey) {
      const addressKey = `${electricKey}address`;
      const address = (MoveInData as Record<string, string>)[addressKey];
      if (address) return address;
    }
  }

  log.debug('Using default COMED address');
  return defaultAddress;
}

/**
 * Handle company-specific questions in the move-in flow
 * Returns whether any questions were present
 */
export async function handleCompanyQuestions(
  moveInPage: MoveInPage,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany
): Promise<{ electricQuestionsPresent: boolean; gasQuestionsPresent: boolean }> {
  let electricQuestionsPresent = false;
  let gasQuestionsPresent = false;

  // Handle company-specific questions (includes "How long staying" for BGE/TX_DEREG/COSERV)
  const normalizedElectric = normalizeCompanyName(electricCompany);
  const normalizedGas = normalizeCompanyName(gasCompany);

  if (electricCompany === gasCompany) {
    // Same company for both - try electric questions first
    if (normalizedElectric) {
      try {
        await callCompanyQuestions(moveInPage, normalizedElectric);
        electricQuestionsPresent = true;
      } catch {
        // Try gas if electric fails
        if (normalizedGas) {
          try {
            await callCompanyQuestions(moveInPage, normalizedGas);
            gasQuestionsPresent = true;
          } catch {
            log.debug('No questions to answer for these companies');
          }
        }
      }
    }
  } else {
    // Different companies - try each separately
    if (normalizedElectric) {
      try {
        await callCompanyQuestions(moveInPage, normalizedElectric);
        electricQuestionsPresent = true;
      } catch {
        log.debug('No questions to answer for Electric company');
      }
    }

    if (normalizedGas) {
      try {
        await callCompanyQuestions(moveInPage, normalizedGas);
        gasQuestionsPresent = true;
      } catch {
        log.debug('No questions to answer for Gas company');
      }
    }
  }

  // Try program enrolled questions (appears after company-specific questions)
  try {
    await moveInPage.Program_Enrolled_Questions();
    electricQuestionsPresent = true;
    gasQuestionsPresent = true;
  } catch {
    log.debug('No questions to answer for Program Enrolled');
  }

  return { electricQuestionsPresent, gasQuestionsPresent };
}

/**
 * Call the appropriate company questions method
 */
async function callCompanyQuestions(moveInPage: MoveInPage, companyKey: string): Promise<void> {
  const methodName = `${companyKey}_Questions`;
  
  // Type-safe method call using a map
  const questionMethods: Record<string, () => Promise<any>> = {
    'CON_EDISON_Questions': () => moveInPage.CON_EDISON_Questions(),
    'BGE_Questions': () => moveInPage.BGE_Questions(),
    'TX_DEREG_Questions': () => moveInPage.TX_DEREG_Questions(),
    'COSERV_Questions': () => moveInPage.COSERV_Questions(),
  };

  const method = questionMethods[methodName];
  if (method) {
    await method();
  } else {
    // Universal fallback: try "How long staying" question for any company
    try {
      await moveInPage.Length_of_Staying_Questions();
    } catch {
      throw new Error(`No question method found for ${companyKey}`);
    }
  }
}

/**
 * Determine if Texas service agreement is needed based on the flow
 */
export async function handleAccountSetupOrTexasAgreement(
  moveInPage: MoveInPage,
  newElectric: boolean,
  newGas: boolean
): Promise<void> {
  try {
    await moveInPage.Setup_Account(newElectric, newGas);
  } catch {
    log.debug('TX-DEREG Service Zip Agreement');
    await moveInPage.Texas_Service_Agreement();
  }
}
