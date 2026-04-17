import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, newUserMoveInAutoBankAccount, generateTestUserData, CleanUp } from '../../../resources/fixtures';
import { AutoPaymentChecks } from '../../../resources/fixtures/payment';
import { utilityQueries, accountQueries } from '../../../resources/fixtures/database';
import { TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types';
import * as PaymentData from '../../../resources/data/payment-data.json';


const paymentUtilities = new AutoPaymentChecks();
let MoveIn: MoveInResult | undefined;


test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updateBuildingOfferRenewableEnergy("autotest", false);
  // await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page }) => {
    if (MoveIn?.pgUserEmail) {
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    }
    await page.close();
});


test.describe('Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
  
  test('EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', { tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE",null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page,"EVERSOURCE", null, true, false);

    await page.goto('/sign-in');
    
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);

    //Payment Checks
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });


  test('PSEG Electric & Gas Valid Auto Payment Move In Added', { tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","PSEG","PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page,"PSEG","PSEG", true, true);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Single_Charge(page, MoveIn, PGuserUsage);
  });


  test('SDGE SCE Electric & Gas Valid Auto Payment Finish Account Added', { tag: [TEST_TAGS.SMOKE, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding("autotest","SDGE","SCE");

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page,"SDGE","SCE", true, true);

    await page.goto('/sign-in');
    
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
    await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC, PGuserUsage.Country, PGuserUsage.Zip);


    //Payment Checks
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });


  test('NGMA NGMA Electric & Gas Valid Auto Payment Move In Added', { tag: [TEST_TAGS.REGRESSION3, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page,"NGMA","NGMA", true, true);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });


  test('DUKE Gas Only Valid Auto Payment Move In Added', { tag: [TEST_TAGS.REGRESSION4, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding("autotest", null, "DUKE");

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null,"DUKE", false, true);

    await page.goto('/sign-in');
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
  });


});


test.describe('Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    
    test('COMED Electric Only Valid Bank Payment Move In Added', { tag: [TEST_TAGS.REGRESSION5, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", null);
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoBankAccount(page, "COMED", null, true, true);
    
        await page.goto('/sign-in');
        
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });


    test('DELMARVA Electric & Gas Valid Bank Payment Finish Account Added', { tag: [TEST_TAGS.REGRESSION6, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","DELMARVA","DELMARVA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"DELMARVA","DELMARVA", true, true);
    
        await page.goto('/sign-in');
        
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();
        await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Single_Charge(page, MoveIn, PGuserUsage);
    });
    
    
    test('BGE DTE Electric & Gas Valid Bank Payment Move In Added', { tag: [TEST_TAGS.REGRESSION7, TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","BGE","DTE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoBankAccount(page,"BGE","DTE", true, true);
    
        await page.goto('/sign-in');
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
    });
    

    test('EVERSOURCE EVERSOURCE Electric & Gas Valid Bank Payment Finish Account Added', { tag: [TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","EVERSOURCE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"EVERSOURCE","EVERSOURCE", true, true);
    
        await page.goto('/sign-in');
        
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();
        await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
    });


    test('BGE Gas Only Valid Bank Payment Finish Account Added', { tag: [TEST_TAGS.PAYMENT] }, async ({ overviewPage, page }) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", null, "BGE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, null, "BGE", true, true);
    
        await page.goto('/sign-in');
        
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();
        await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);

        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });

});

// =============================================================================
// PR-005b: Delinquency cleared by auto-pay (Cian review 2026-04-14)
// =============================================================================
// Same invariant as PR-005a (see manual_pay_successful_payment.spec.ts) but
// via the auto-pay code path. PaymentProcessor.recalculateDelinquency() fires
// for both paths — this test proves auto-pay doesn't regress.
test.describe('PR-005b: Delinquency cleared by auto-pay', () => {
    test.describe.configure({ mode: 'serial' });

    test(
        'COMED electric — isDelinquent=true + delinquentDays=30 → cleared after auto-pay cycle',
        { tag: [TEST_TAGS.PAYMENT] },
        async ({ overviewPage, page }) => {
            test.setTimeout(1800000);

            const PGuserUsage = await generateTestUserData();

            await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
            await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
            MoveIn = await newUserMoveInAutoPayment(page, 'COMED', null, true, true);

            await page.goto('/sign-in');
            await overviewPage.Setup_Password();
            await overviewPage.Accept_New_Terms_And_Conditions();
            await overviewPage.Select_Pay_In_Full_If_Flex_Enabled();
            await overviewPage.Enter_Auto_Payment_Details(
                PaymentData.ValidCardNUmber, PGuserUsage.CardExpiry, PGuserUsage.CVC,
                PGuserUsage.Country, PGuserUsage.Zip
            );

            const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
            await accountQueries.setElectricDelinquent(electricAccountId, 30);

            const before = await accountQueries.getElectricDelinquency(electricAccountId);
            expect(before.isDelinquent, 'delinquency seed failed').toBe(true);

            // Full auto-pay success flow: inserts bill, approves, waits for
            // balance-ledger-batch + stripe-capture crons, asserts succeeded.
            await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);

            await accountQueries.waitForElectricDelinquencyCleared(electricAccountId, 30, 2000);

            const after = await accountQueries.getElectricDelinquency(electricAccountId);
            expect(after.isDelinquent, 'auto-pay should clear isDelinquent').toBe(false);
            expect(after.delinquentDays, 'auto-pay should zero delinquentDays').toBe(0);
        }
    );
});

