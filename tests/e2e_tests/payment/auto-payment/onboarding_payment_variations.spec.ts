import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInEncouraged, generateTestUserData, CleanUp, RegisterApi } from '../../../resources/fixtures';
import { AutoPaymentChecks } from '../../../resources/fixtures/payment';
import { utilityQueries } from '../../../resources/fixtures/database';
import { TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';
import type { MoveInResult } from '../../../resources/types';
import type { RegisterRequestBody, RegisterSuccessResponse } from '../../../resources/types/register.types';


const paymentUtilities = new AutoPaymentChecks();
let MoveIn: MoveInResult;


test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling("autotest", true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updateBuildingOfferRenewableEnergy("autotest", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page }) => {
  if (MoveIn?.pgUserEmail) {
    await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  }
  await page.close();
});


test.describe('Onboarding Payment Variations — Encouraged Conversion', () => {
  test.describe.configure({ mode: "serial" });


  test('P2-10: Encouraged conversion + billing (pgtest, Electric only)', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // pgtest shortcode has useEncourageConversion=TRUE and uses SDGE by default
    // No need to call updateCompaniesToBuilding — pgtest has its own config
    // Ensure encouraged conversion is ON for pgtest
    await utilityQueries.updateBuildingUseEncourageConversion("pgtest", true);

    await page.goto('/move-in?shortCode=pgtest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInEncouraged(page, 'pgtest');

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

    // Payment Checks — Electric only (single charge account, SDGE)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });


  test('P2-11: Encouraged conversion E+G (pgtest, SDGE Electric + Gas)', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // pgtest shortcode with SDGE for both electric and gas
    await utilityQueries.updateBuildingUseEncourageConversion("pgtest", true);

    await page.goto('/move-in?shortCode=pgtest', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInEncouraged(page, 'pgtest');

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

    // Payment Checks — Electric + Gas with multiple charge accounts (SDGE uses separate)
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });
});


test.describe('Onboarding Payment Variations — Partner Shortcode', () => {
  test.describe.configure({ mode: "serial" });


  test('P2-12: Partner shortcode (funnel4324534, non-building)', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // funnel4324534 resolves via MoveInPartner table, not Building table
    // Partner shortcodes use Funnel theme (dark navy)
    // No updateCompaniesToBuilding needed — partner shortcodes don't use Building config

    await page.goto('/move-in?shortCode=funnel4324534', { waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInEncouraged(page, 'funnel4324534');

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

    // Payment Checks — Electric only (partner shortcode)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });
});


test.describe('Onboarding Payment Variations — Finish Registration', () => {
  test.describe.configure({ mode: "serial" });


  test('P2-13: Finish registration flow (API-created user)', {
    tag: [TEST_TAGS.PAYMENT],
  }, async ({ overviewPage, page, finishRegistrationPage }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    const registerApi = new RegisterApi();

    // Step 1: Create user via partner register API
    const registerPayload: RegisterRequestBody = {
      leaseID: `qa-onboard-pay-${Date.now()}`,
      resident: {
        firstName: `PGTest ${PGuserUsage.FirstName}`,
        lastName: PGuserUsage.LastName,
        email: PGuserUsage.Email,
        phone: '1111111111',
        dateOfBirth: '1990-05-15',
      },
      property: {
        street: '123 Main St',
        unitNumber: PGuserUsage.UnitNumber,
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      },
      enrollment: {
        type: 'move-in',
        moveInDate: new Date().toISOString().split('T')[0],
      },
    };

    const registerResponse = await registerApi.register(registerPayload, 'test-partner');
    expect(registerResponse.status).toBe(201);
    expect(RegisterApi.isSuccess(registerResponse.body)).toBe(true);

    const successBody = registerResponse.body as RegisterSuccessResponse;
    const finishRegUrl = successBody.finishRegistrationURL;

    // Store email for cleanup
    MoveIn = {
      accountNumber: '',
      cottageUserId: successBody.userId,
      pgUserName: `PGTest ${PGuserUsage.FirstName} ${PGuserUsage.LastName}`,
      pgUserFirstName: `PGTest ${PGuserUsage.FirstName}`,
      pgUserEmail: PGuserUsage.Email,
      smsConsent: false,
    };

    // Step 2: Navigate to finish-registration URL and complete address step
    // Verified via Playwright MCP 2026-04-14: 2-step flow
    //   Step 1: Address (prefilled from API params) → Continue
    //   Step 2: Identity verification (DOB prefilled, SSN + previous address required)
    await finishRegistrationPage.goto(finishRegUrl);
    await finishRegistrationPage.waitForAddressStep();
    await finishRegistrationPage.clickContinue();

    // Step 2b: Company questions (if present — ComEd triggers this)
    await finishRegistrationPage.answerCompanyQuestionsAndContinue();

    // Step 3: Complete identity verification (DOB prefilled from API, need SSN + prior address)
    await finishRegistrationPage.completeIdentityVerification(
      PGuserUsage.SSN,
      '808 Chicago Ave, Dixon, IL 61021'
    );

    // Step 4: Wait for registration to complete and redirect
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // networkidle may not fire — continue
    }
    await page.waitForTimeout(5000);

    // Step 5: Sign in and set up payment
    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(
      PaymentData.ValidCardNUmber,
      PGuserUsage.CardExpiry,
      PGuserUsage.CVC,
      PGuserUsage.Country,
      PGuserUsage.Zip,
    );

    // Payment Checks — Electric only (finish-reg creates electric account via ComEd)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });
});
