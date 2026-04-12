import { Page } from '@playwright/test';
import { MoveInPage } from '../../page_objects/move_in_page';
import { generateTestUserData } from '../test_user';
import { userQueries } from '../database';
import * as MoveInData from '../../data/move_in-data.json';
import * as PaymentData from '../../data/payment-data.json';
import { loggers } from '../../utils/logger';
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

const log = loggers.moveIn.child('NewUserFlows');



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

  // Ensure we've left the address step (address validation can be slow, retry if needed)
  const addressTitle = moveInPage.page.getByText('Enter your address');
  for (let retry = 0; retry < 3; retry++) {
    try {
      await addressTitle.waitFor({ state: 'hidden', timeout: 15000 });
      break;
    } catch {
      log.debug('Still on address page, retrying Continue click', { retry: retry + 1 });
      await moveInPage.Next_Move_In_Button();
    }
  }

  // Step 3: Account Setup or Texas Agreement (may not appear for zip-based flows)
  const setupStepPresent = await handleAccountSetupOrTexasAgreement(moveInPage, newElectric, newGas);
  if (setupStepPresent) {
    await moveInPage.Next_Move_In_Button();
  }

  // For Texas companies, Texas Service Agreement may appear after Utility Setup
  const texasAfterSetup = moveInPage.page.getByText('Public Grid starts service for');
  try {
    await texasAfterSetup.waitFor({ state: 'visible', timeout: 5000 });
    await moveInPage.Texas_Service_Agreement();
    await moveInPage.Next_Move_In_Button();
  } catch {
    // No Texas agreement — continue
  }

  // ESCO dialog may appear after clicking Continue on Utility Setup (NY companies)
  await moveInPage.Read_ESCO_Conditions();

  // Step 4: Personal Info (includes Start Service Date)
  const dateField = pgUser[moveInDateField as keyof typeof pgUser] as string;
  const smsConsent = await moveInPage.Enter_Personal_Info(
    `PGTest ${pgUser.FirstName}`,
    pgUser.LastName,
    pgUser.PhoneNumber,
    pgUser.Email,
    dateField
  );
  await moveInPage.Next_Move_In_Button();

  // Step 5: Company Questions (conditional based on company)
  const { electricQuestionsPresent, gasQuestionsPresent } = await handleCompanyQuestions(
    moveInPage,
    electricCompany,
    gasCompany
  );

  if (electricQuestionsPresent || gasQuestionsPresent) {
    log.debug('Company questions present', { electricQuestionsPresent, gasQuestionsPresent });
    await moveInPage.Next_Move_In_Button();
  }

  // Step 6: ID Info
  await moveInPage.Enter_ID_Info(pgUser.BirthDate, pgUser.SSN);
  await moveInPage.Enter_ID_Info_Prev_Add(MoveInData.COMEDaddress, electricCompany, gasCompany);
  await moveInPage.Submit_Move_In_Button();

  // Wait for page to transition after ID submission (server creates user, may take a few seconds)
  await moveInPage.page.waitForLoadState('domcontentloaded');
  await moveInPage.page.waitForTimeout(5000);

  // Step 7: Payment Handling
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

  // Get results
  const accountNumber = paymentType === 'skip' 
    ? await userQueries.checkCottageUserAccountNumber(pgUserEmail)
    : await moveInPage.Get_Account_Number();
    
  const cottageUserId = await userQueries.checkCottageUserId(pgUser.Email, smsConsent);
  await userQueries.checkCottageUserAccountNumber(pgUserEmail);

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
    await moveInPage.Check_Successful_Move_In_Billing_Customer();
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
 * Encouraged conversion move-in flow (pgtest, funnel, partner shortcodes).
 *
 * This is a 2-step flow — NOT the standard 6-step:
 * Step 1: Address lookup → Encouraged landing page (terms, GridRewards) → "Get started"
 * Step 2: All personal info on ONE page (name, email, phone, date, DOB, SSN, prev address) → "Finish setup"
 *
 * VERIFIED via Playwright MCP (2026-04-11):
 * - pgtest, funnel4324534, and partner shortcodes all use this flow
 * - No separate utility setup or identity steps — everything on one form
 * - "Finish setup" button (not "Continue")
 */
export async function newUserMoveInEncouraged(
  page: Page,
  shortCode: string,
): Promise<MoveInResult> {
  const moveInPage = new MoveInPage(page);
  const pgUser = await generateTestUserData();
  const pgUserName = `PGTest ${pgUser.FirstName} ${pgUser.LastName}`;
  const pgUserFirstName = `PGTest ${pgUser.FirstName}`;
  const pgUserEmail = pgUser.Email;

  log.info('Starting encouraged conversion move-in', { shortCode, email: pgUserEmail });

  // Step 1: Address lookup page
  // Encouraged flows start with "Where are you looking to start service?" — no Welcome/Terms step
  const addressInput = page.locator('#onboardingAddress');
  await addressInput.waitFor({ state: 'visible', timeout: 30000 });
  await addressInput.pressSequentially(MoveInData.COMEDaddress);
  await page.waitForTimeout(2000);

  // Select first autocomplete suggestion
  const firstSuggestion = page.getByText(MoveInData.COMEDaddress.substring(0, 15)).first();
  await firstSuggestion.waitFor({ state: 'visible', timeout: 10000 });
  await firstSuggestion.click();

  // Enter unit number
  await page.locator('input[name="unitNumber"]').fill(pgUser.UnitNumber);

  // Click Next (becomes enabled after address selection)
  const nextBtn = page.getByRole('button', { name: 'Next' });
  await nextBtn.waitFor({ state: 'visible', timeout: 10000 });
  await nextBtn.click();
  await page.waitForTimeout(3000);

  // Encouraged landing page: agree to terms → click "Get started"
  const termsCheckbox = page.getByRole('checkbox', { name: /I agree to Public Grid/ });
  await termsCheckbox.waitFor({ state: 'visible', timeout: 30000 });
  await termsCheckbox.click();

  const getStartedBtn = page.getByRole('button', { name: 'Get started' });
  await getStartedBtn.waitFor({ state: 'visible', timeout: 10000 });
  await getStartedBtn.click();
  await page.waitForTimeout(3000);

  // Step 2: "Just a couple more details" — all personal info on one page
  await page.getByText('Just a couple more details').waitFor({ state: 'visible', timeout: 30000 });

  // Fill personal info
  await page.locator('input[name="firstName"]').fill(`PGTest ${pgUser.FirstName}`);
  await page.locator('input[name="lastName"]').fill(pgUser.LastName);
  await page.locator('input[name="email"]').fill(pgUser.Email);
  await page.locator('input[name="phone"]').fill(pgUser.PhoneNumber);

  // Move-in date — click the date picker button and select first available date
  const datePickerBtn = page.getByRole('button', { name: 'Select a move-in date' });
  await datePickerBtn.click();
  await page.waitForTimeout(1000);
  const firstAvailableDate = page.locator('[role="gridcell"]:not([disabled])').first();
  await firstAvailableDate.click();

  // DOB and SSN
  await page.locator('input[name="dateOfBirth"]').fill(pgUser.BirthDate);
  await page.locator('input[name="identityNumber"]').fill(pgUser.SSN);

  // Previous address
  const prevAddressInput = page.locator('#onboardingAddress');
  await prevAddressInput.fill(MoveInData.COMEDaddress);
  await page.waitForTimeout(2000);
  const prevSuggestion = page.getByText(MoveInData.COMEDaddress.substring(0, 15)).first();
  await prevSuggestion.waitFor({ state: 'visible', timeout: 10000 });
  await prevSuggestion.click();

  // Click "Finish setup"
  const finishBtn = page.getByRole('button', { name: 'Finish setup' });
  await finishBtn.waitFor({ state: 'visible', timeout: 10000 });
  await finishBtn.click();

  // Wait for success page
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(5000);

  // Get results
  const smsConsent = true; // SMS checkbox checked by default in encouraged flow
  const cottageUserId = await userQueries.checkCottageUserId(pgUser.Email, smsConsent);
  const accountNumber = await userQueries.checkCottageUserAccountNumber(pgUserEmail);

  log.info('Encouraged conversion move-in complete', { email: pgUserEmail, cottageUserId });

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
 * Move-in flow for existing utility account
 */
export async function moveInExistingUtilityAccount(
  page: Page,
  newElectric: boolean,
  newGas: boolean,
  submitRequest: boolean,
  enableSaveToggle?: boolean
): Promise<{ pgUserName: string; pgUserFirstName: string; pgUserEmail: string }> {
  const moveInPage = new MoveInPage(page);
  const pgUser = await generateTestUserData();
  const pgUserName = `PGTest ${pgUser.FirstName} ${pgUser.LastName}`;
  const pgUserFirstName = `PGTest ${pgUser.FirstName}`;
  const pgUserEmail = pgUser.Email;

  await moveInPage.Agree_on_Terms_and_Get_Started();
  await moveInPage.Enter_Address(MoveInData.COMEDaddress, pgUser.UnitNumber);
  await moveInPage.Next_Move_In_Button();
  await moveInPage.Choose_Start_Service();
  // Click "I will do the setup myself" to trigger existing utility account flow
  await moveInPage.Click_Self_Setup();
  await moveInPage.Existing_Utility_Account_Connect_Request(pgUserEmail, submitRequest, enableSaveToggle);
  
  return {
    pgUserName,
    pgUserFirstName,
    pgUserEmail,
  };
}
