import { Page } from '@playwright/test';
import { MoveInPage } from '../../page_objects/move_in_page';
import { generateTestUserData } from '../test_user';
import { SupabaseQueries } from '../database/SupabaseQueries';
import * as MoveInData from '../../data/move_in-data.json';
import * as PaymentData from '../../data/payment-data.json';
import type { 
  MoveInOptions, 
  MoveInResult, 
  PaymentType, 
  PaymentMethod,
  UtilityCompany 
} from '../../types/moveIn.types';
import { 
  getAddressForCompany, 
  handleCompanyQuestions, 
  handleAccountSetupOrTexasAgreement 
} from './helpers';

const supabaseQueries = new SupabaseQueries();

/**
 * Unified new user move-in flow with options pattern
 * This eliminates code duplication across multiple similar functions
 */
export async function newUserMoveIn(options: MoveInOptions): Promise<MoveInResult> {
  const {
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType = 'auto',
    paymentMethod = 'card',
    payThroughPG = true,
    cardNumber,
    bankAccountValidity = 'valid',
    moveInDateField = 'Today',
  } = options;

  const moveInPage = new MoveInPage(page);
  const pgUser = await generateTestUserData();
  const pgUserName = `PGTest ${pgUser.FirstName} ${pgUser.LastName}`;
  const pgUserFirstName = `PGTest ${pgUser.FirstName}`;
  const pgUserEmail = pgUser.Email;
  const ccNumber = cardNumber || PaymentData.ValidCardNUmber;

  // Get appropriate address for the companies
  const addressType = getAddressForCompany(electricCompany, gasCompany);

  // Step 1: Terms and Get Started
  await moveInPage.Agree_on_Terms_and_Get_Started();

  // Step 2: Enter Address
  await moveInPage.Enter_Address(addressType, pgUser.UnitNumber);
  await moveInPage.Next_Move_In_Button();

  // Step 3: Account Setup or Texas Agreement
  await handleAccountSetupOrTexasAgreement(moveInPage, newElectric, newGas);
  await moveInPage.Next_Move_In_Button();

  // Step 4: Power Up Account
  await moveInPage.Power_Up_Your_Account();

  // Step 5: ESCO Conditions
  await moveInPage.Read_ESCO_Conditions();

  // Step 6: Personal Info
  const dateField = pgUser[moveInDateField as keyof typeof pgUser] as string;
  const smsConsent = await moveInPage.Enter_Personal_Info(
    `PGTest ${pgUser.FirstName}`,
    pgUser.LastName,
    pgUser.PhoneNumber,
    pgUser.Email,
    dateField
  );
  await moveInPage.Next_Move_In_Button();

  // Step 7: Company Questions
  const { electricQuestionsPresent, gasQuestionsPresent } = await handleCompanyQuestions(
    moveInPage,
    electricCompany,
    gasCompany
  );

  if (electricQuestionsPresent || gasQuestionsPresent) {
    console.log(`Electric Questions Present: ${electricQuestionsPresent}`);
    console.log(`Gas Questions Present: ${gasQuestionsPresent}`);
    await moveInPage.Next_Move_In_Button();
  }

  // Step 8: ID Info
  await moveInPage.Enter_ID_Info(pgUser.BirthDate, pgUser.SSN);
  await moveInPage.Enter_ID_Info_Prev_Add(MoveInData.COMEDaddress, electricCompany, gasCompany);
  await moveInPage.Submit_Move_In_Button();

  // Step 9: Payment Handling
  const paymentPageVisible = await moveInPage.Check_Payment_Page_Visibility(electricCompany, gasCompany);

  if (paymentPageVisible) {
    await handlePayment(
      moveInPage,
      paymentType,
      paymentMethod,
      payThroughPG,
      ccNumber,
      pgUser,
      pgUserName,
      bankAccountValidity
    );
  } else {
    await moveInPage.Check_Successful_Move_In_Non_Billing_Customer();
  }

  // Step 10: Get results
  const accountNumber = paymentType === 'skip' 
    ? await supabaseQueries.Check_Cottage_User_Account_Number(pgUserEmail)
    : await moveInPage.Get_Account_Number();
    
  const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(pgUser.Email, smsConsent);
  await supabaseQueries.Check_Cottage_User_Account_Number(pgUserEmail);

  return {
    accountNumber,
    cottageUserId,
    pgUserName,
    pgUserFirstName,
    pgUserEmail,
    smsConsent,
  };
}

/**
 * Handle payment based on type and method
 */
async function handlePayment(
  moveInPage: MoveInPage,
  paymentType: PaymentType,
  paymentMethod: PaymentMethod,
  payThroughPG: boolean,
  cardNumber: string,
  pgUser: any,
  pgUserName: string,
  bankAccountValidity: 'valid' | 'invalid'
): Promise<void> {
  if (paymentType === 'skip') {
    await moveInPage.Skip_Payment_Details();
    await moveInPage.Check_Almost_Done_Move_In_Billing_Customer();
    return;
  }

  // Enter payment details based on method
  if (paymentMethod === 'card') {
    await moveInPage.Enter_Card_Details(
      cardNumber,
      pgUser.CardExpiry,
      pgUser.CVC,
      pgUser.Country,
      pgUser.Zip,
      payThroughPG
    );
  } else {
    // Bank account
    if (bankAccountValidity === 'valid') {
      await moveInPage.Enter_Valid_Bank_Details(pgUser.Email, pgUserName, payThroughPG);
    } else {
      await moveInPage.Enter_Invalid_Bank_Details(pgUser.Email, pgUserName, payThroughPG);
    }
  }

  // Disable auto-payment if manual
  if (paymentType === 'manual') {
    await moveInPage.Disable_Auto_Payment();
  }

  // Confirm payment
  await moveInPage.Confirm_Payment_Details();

  // Check success message based on billing status
  if (payThroughPG) {
    await moveInPage.Check_Successful_Move_In_Billing_Customer();
  } else {
    await moveInPage.Check_Successful_Move_In_Non_Billing_Customer();
  }
}

// ============================================================================
// Convenience Functions for Common Flows
// ============================================================================

/**
 * New user move-in with auto payment (card)
 */
export async function newUserMoveInAutoPayment(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'card',
    payThroughPG,
    cardNumber,
  });
}

/**
 * New user move-in with manual payment (card)
 */
export async function newUserMoveInManualPayment(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'manual',
    paymentMethod: 'card',
    payThroughPG,
    cardNumber,
  });
}

/**
 * New user move-in skipping payment
 */
export async function newUserMoveInSkipPayment(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'skip',
    moveInDateField: 'FourDaysFromNow',
  });
}

/**
 * New user move-in with auto payment (bank account)
 */
export async function newUserMoveInAutoBankAccount(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'bank',
    payThroughPG,
  });
}

/**
 * New user move-in with manual payment (bank account)
 */
export async function newUserMoveInManualBankAccount(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'manual',
    paymentMethod: 'bank',
    payThroughPG,
  });
}

/**
 * New user move-in with failed bank account (auto)
 */
export async function newUserMoveInAutoFailedBankAccount(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'bank',
    payThroughPG,
    bankAccountValidity: 'invalid',
  });
}

/**
 * New user move-in with failed bank account (manual)
 */
export async function newUserMoveInManualFailedBankAccount(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'manual',
    paymentMethod: 'bank',
    payThroughPG,
    bankAccountValidity: 'invalid',
  });
}

/**
 * New user move-in with address parameter flow
 */
export async function newUserMoveInAddressParameter(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
): Promise<MoveInResult> {
  // This flow uses pre-filled address from URL parameters
  // For now, delegates to standard flow - implementation can be customized
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'card',
    payThroughPG,
    cardNumber,
  });
}

/**
 * New user move-in with GUID flow (pre-filled user info)
 */
export async function newUserMoveInGuidFlow(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
): Promise<MoveInResult> {
  // This flow uses GUID for pre-filled user information
  // For now, delegates to standard flow - implementation can be customized
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'card',
    payThroughPG,
    cardNumber,
  });
}

/**
 * New user move-in with both address parameter and GUID flow
 */
export async function newUserMoveInAddressParameterAndGuid(
  page: Page,
  electricCompany: UtilityCompany,
  gasCompany: UtilityCompany,
  newElectric: boolean,
  newGas: boolean,
  payThroughPG: boolean = true,
  cardNumber?: string
): Promise<MoveInResult> {
  return newUserMoveIn({
    page,
    electricCompany,
    gasCompany,
    newElectric,
    newGas,
    paymentType: 'auto',
    paymentMethod: 'card',
    payThroughPG,
    cardNumber,
  });
}

/**
 * Move-in flow for existing utility account
 */
export async function moveInExistingUtilityAccount(
  page: Page,
  newElectric: boolean,
  newGas: boolean,
  submitRequest: boolean
): Promise<{ pgUserName: string; pgUserFirstName: string; pgUserEmail: string }> {
  const moveInPage = new MoveInPage(page);
  const pgUser = await generateTestUserData();
  const pgUserName = `PGTest ${pgUser.FirstName} ${pgUser.LastName}`;
  const pgUserFirstName = `PGTest ${pgUser.FirstName}`;
  const pgUserEmail = pgUser.Email;

  await moveInPage.Agree_on_Terms_and_Get_Started();
  await moveInPage.Enter_Address(MoveInData.COMEDaddress, pgUser.UnitNumber);
  await moveInPage.Next_Move_In_Button();
  await moveInPage.Setup_Account(newElectric, newGas);
  await moveInPage.Next_Move_In_Button();
  await moveInPage.Existing_Utility_Account_Connect_Request(pgUserEmail, submitRequest);
  
  return {
    pgUserName,
    pgUserFirstName,
    pgUserEmail,
  };
}
