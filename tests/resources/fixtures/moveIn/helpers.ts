import { Page } from '@playwright/test';
import { MoveInPage } from '../../page_objects/move_in_page';
import * as MoveInData from '../../data/move_in-data.json';
import { normalizeCompanyName } from '../../constants/companies';
import type { MoveInOptions, UtilityCompany } from '../../types/moveIn.types';

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

  console.log('Using default COMED address');
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

  // Try program enrolled questions first
  try {
    await moveInPage.Program_Enrolled_Questions();
    electricQuestionsPresent = true;
    gasQuestionsPresent = true;
  } catch {
    console.log('No questions to answer for Program Enrolled');
  }

  // Handle company-specific questions
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
            console.log('No questions to answer for these companies');
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
        console.log('No questions to answer for Electric company');
      }
    }

    if (normalizedGas) {
      try {
        await callCompanyQuestions(moveInPage, normalizedGas);
        gasQuestionsPresent = true;
      } catch {
        console.log('No questions to answer for Gas company');
      }
    }
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
  };

  const method = questionMethods[methodName];
  if (method) {
    await method();
  } else {
    throw new Error(`No question method found for ${companyKey}`);
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
    console.log('TX-DEREG Service Zip Agreement');
    await moveInPage.Texas_Service_Agreement();
  }
}
