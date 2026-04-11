import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, generateTestUserData, CleanUp, PaymentUtilities, RegisterApi } from '../../../resources/fixtures';
import { utilityQueries } from '../../../resources/fixtures/database';
import { TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';
import type { MoveInResult } from '../../../resources/types';
import type { RegisterRequestBody, RegisterSuccessResponse } from '../../../resources/types/register.types';


const paymentUtilities = new PaymentUtilities();
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
    tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // pgtest shortcode has useEncourageConversion=TRUE and uses SDGE by default
    // No need to call updateCompaniesToBuilding — pgtest has its own config
    // Ensure encouraged conversion is ON for pgtest
    await utilityQueries.updateBuildingUseEncourageConversion("pgtest", true);

    await page.goto('/move-in?shortCode=pgtest', { waitUntil: 'domcontentloaded' });

    // TODO: The encouraged conversion flow for pgtest may differ from standard move-in.
    //       Verify via Playwright MCP that newUserMoveInAutoPayment works with pgtest shortcode.
    //       The encouraged flow shows "I will call and setup myself" — for billing tests,
    //       the user should go through the full billing path (not utility verification).
    //       pgtest uses SDGE (Electric only config for this test).
    MoveIn = await newUserMoveInAutoPayment(page, "SDGE", null, true, false);

    await page.goto('/sign-in'); //TEMPORARY FIX

    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Payment Checks — Electric only (single charge account, SDGE)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });


  test('P2-11: Encouraged conversion E+G (pgtest, SDGE Electric + Gas)', {
    tag: [TEST_TAGS.REGRESSION4, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // pgtest shortcode with SDGE for both electric and gas
    await utilityQueries.updateBuildingUseEncourageConversion("pgtest", true);

    await page.goto('/move-in?shortCode=pgtest', { waitUntil: 'domcontentloaded' });

    // TODO: Verify via Playwright MCP that pgtest supports E+G path with SDGE.
    //       pgtest default utility is SDGE — confirm gas company assignment.
    //       SDGE uses multiple charge accounts (separate electric and gas).
    MoveIn = await newUserMoveInAutoPayment(page, "SDGE", "SDGE", true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX

    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Payment Checks — Electric + Gas with multiple charge accounts (SDGE uses separate)
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });
});


test.describe('Onboarding Payment Variations — Partner Shortcode', () => {
  test.describe.configure({ mode: "serial" });


  test('P2-12: Partner shortcode (funnel4324534, non-building)', {
    tag: [TEST_TAGS.REGRESSION3, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    // funnel4324534 resolves via MoveInPartner table, not Building table
    // Partner shortcodes use Funnel theme (dark navy)
    // No updateCompaniesToBuilding needed — partner shortcodes don't use Building config

    await page.goto('/move-in?shortCode=funnel4324534', { waitUntil: 'domcontentloaded' });

    // TODO: Verify via Playwright MCP that the partner move-in flow works with funnel4324534.
    //       Partner shortcodes resolve utilities via MoveInPartner table.
    //       The electric/gas companies assigned may differ from Building-based shortcodes.
    //       Confirm which utility company is resolved for this partner and update params below.
    MoveIn = await newUserMoveInAutoPayment(page, "COMED", null, true, false);

    await page.goto('/sign-in'); //TEMPORARY FIX

    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    // Payment Checks — Electric only (partner shortcode)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });
});


test.describe('Onboarding Payment Variations — Finish Registration', () => {
  test.describe.configure({ mode: "serial" });


  test('P2-13: Finish registration flow (API-created user)', {
    tag: [TEST_TAGS.REGRESSION5, TEST_TAGS.PAYMENT],
  }, async ({ moveInpage, overviewPage, page, sidebarChat, billingPage, context }) => {

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

    // Step 2: Navigate to finish registration URL
    // TODO: Verify via Playwright MCP the exact finish-registration flow:
    //       1. User clicks finish-reg link from email (or navigate directly)
    //       2. User completes identity verification (DOB + SSN + previous address)
    //       3. User is prompted to add payment method
    //       The finishRegUrl may point to a different domain or path.
    await page.goto(finishRegUrl, { waitUntil: 'domcontentloaded' });

    // Step 3: Complete registration (identity verification)
    // TODO: The finish-registration flow requires DOB, SSN, and previous address.
    //       These steps use MoveInPage methods but the page structure may differ.
    //       Verify the exact form fields and flow via Playwright MCP before enabling.

    // Step 4: Set up password and payment method
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

    // Payment Checks — Electric only (finish-reg creates electric account)
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });
});
