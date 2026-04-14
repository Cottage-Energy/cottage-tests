import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInManualPayment, newUserMoveInSkipPayment, newUserMoveInManualBankAccount, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { ManualPaymentChecks } from '../../../resources/fixtures/payment';
import { utilityQueries, accountQueries, billQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types';
import * as PaymentData from '../../../resources/data/payment-data.json';

const paymentUtilities = new ManualPaymentChecks();
let MoveIn: MoveInResult | undefined;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    if (MoveIn?.pgUserEmail) {
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    }
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe('Valid Card Manual Payment', () => {
  test.describe.configure({mode: "serial"});
  
    
  test('NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest", "NGMA", null);
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, "NGMA", null, true, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      
      /*const [newTab] = await Promise.all([
          page.waitForEvent('popup'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      await newTab.bringToFront();*/
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: [TEST_TAGS.SMOKE, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "NGMA");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, "COMED", "NGMA", true, false);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      
      /*const [newTab] = await Promise.all([
          page.waitForEvent('popup'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      await newTab.bringToFront();*/
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('CON-EDISON CON-EDISON Electric Only Valid Manual Card Payment Finish Account Added', {tag: [TEST_TAGS.REGRESSION1, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
  
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","CON-EDISON","CON-EDISON");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page,"CON-EDISON","CON-EDISON", true, false);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/
      await overviewPage.Accept_New_Terms_And_Conditions();

      // await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });
  
  
  test('EVERSOURCE EVERSOURCE Electric & Gas Valid Manual Card Payment Move In Added', {tag: [TEST_TAGS.REGRESSION2, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","EVERSOURCE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page,"EVERSOURCE","EVERSOURCE", true, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await Promise.all([
        billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
        billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });
  

  test('NGMA BGE Electric & Gas Valid Manual Card Payment Finish Account Added', {tag: [TEST_TAGS.REGRESSION3, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","BGE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page,"NGMA","BGE", true, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/

      // await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await Promise.all([
        billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
        billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });
  
  
  test('COMED COMED  Gas Only Valid Manual Card Payment Move In Added', {tag: [TEST_TAGS.REGRESSION4, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","COMED","COMED");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page,"COMED","COMED", false, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('EVERSOURCE BGE Gas Only Valid Manual Card Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest", "EVERSOURCE", "BGE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page, "EVERSOURCE", "BGE", false, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/

      // await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });
  
  
  test('EVERSOURCE Gas Only Valid Manual Card Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest", null, "EVERSOURCE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page, null, "EVERSOURCE", true, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      /*
      // Store the current page
      const pages = browser.contexts()[0].pages();
      const currentPage = pages[pages.length - 1];
  
      // Wait for the new tab to open
      const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      // Close the previous tab
      await currentPage.close();
  
      // Switch to the new tab
      await newPage.bringToFront();*/

      // await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });

});


test.describe('Valid Bank Manual Payment', () => {
  test.describe.configure({mode: "serial"});
  
  
  test('EVERSOURCE Electric Only Valid Manual Bank Payment Move In Added', {tag: [TEST_TAGS.REGRESSION5, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualBankAccount(page, 'EVERSOURCE', null, true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    
    /*const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    await newTab.bringToFront();*/
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED COMED Electric Only Valid Bank Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","COMED","COMED");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page,"COMED","COMED", true, false);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    
    // await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED CON-EDISON Electric Only Valid Bank Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","COMED","CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page,"COMED","CON-EDISON", true, false);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    
    // await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });
  

  test('BGE BGE Electric & Gas Valid Bank Payment Move In Added', {tag: [TEST_TAGS.REGRESSION6, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","BGE","BGE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualBankAccount(page,"BGE","BGE", true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await Promise.all([
      billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
      billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
    ]);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('BGE NGMA Electric & Gas Valid Bank Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","BGE","NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page,"BGE","NGMA", true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    
    // await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await Promise.all([
      billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
      billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
    ]);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('NGMA NGMA Gas Only Valid Bank Payment Move In Added', {tag: [TEST_TAGS.REGRESSION7, TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualBankAccount(page,"NGMA","NGMA", false, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    await overviewPage.Accept_New_Terms_And_Conditions();
    const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('CON-EDISON EVERSOURCE Gas Only Valid Bank Payment Move In Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest","CON-EDISON","EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInManualBankAccount(page,"CON-EDISON","EVERSOURCE", false, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    await overviewPage.Accept_New_Terms_And_Conditions();
    const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('COMED Gas Only Valid Bank Payment Finish Account Added', {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await utilityQueries.updateCompaniesToBuilding("autotest", null, "COMED");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, null, "COMED", true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    /*
    // Store the current page
    const pages = browser.contexts()[0].pages();
    const currentPage = pages[pages.length - 1];

    // Wait for the new tab to open
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    // Close the previous tab
    await currentPage.close();

    // Switch to the new tab
    await newPage.bringToFront();*/
    
    // await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });

});

// =============================================================================
// PR-005a: Delinquency cleared by manual payment (Cian review 2026-04-14)
// =============================================================================
// Closes the automation gap from Cian's review of payment_system_ledger_flows.md.
// The docs previously claimed `isDelinquent` was cleared ONLY by the reminder
// pipeline. Cian pointed out that PaymentProcessor.recalculateDelinquency()
// also fires on every successful payment (services
// packages/utilities/src/payments/payment-processor.ts:~233).
//
// Test strategy: seed `isDelinquent=true`, `delinquentDays=30` on the
// ElectricAccount directly (simulating what the reminder cron would have set),
// then run the standard manual-pay flow and assert flags clear WITHOUT waiting
// for the next reminder cron.
test.describe('PR-005a: Delinquency cleared by manual payment', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'COMED electric — isDelinquent=true + delinquentDays=30 → cleared after manual card payment',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page, sidebarChat, billingPage }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', null);
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, 'COMED', null, true, true);

      await page.goto('/sign-in');
      await overviewPage.Accept_New_Terms_And_Conditions();

      const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      // Seed delinquency — simulates what the reminder pipeline would have set
      await accountQueries.setElectricDelinquent(electricAccountId, 30);

      const before = await accountQueries.getElectricDelinquency(electricAccountId);
      expect(before.isDelinquent, 'delinquency seed failed').toBe(true);

      await billQueries.insertElectricBill(
        electricAccountId,
        PGuserUsage.ElectricAmount,
        PGuserUsage.ElectricUsage
      );
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(
        page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, electricAccountId
      );

      // Payment succeeded. PaymentProcessor.recalculateDelinquency() should
      // have fired. Poll for up to 60s — if it takes longer, the handler
      // likely isn't being called on the manual-pay path.
      await accountQueries.waitForElectricDelinquencyCleared(electricAccountId, 30, 2000);

      const after = await accountQueries.getElectricDelinquency(electricAccountId);
      expect(after.isDelinquent, 'manual pay should clear isDelinquent').toBe(false);
      expect(after.delinquentDays, 'manual pay should zero delinquentDays').toBe(0);
    }
  );
});

// =============================================================================
// PR-005f: Multi-CA per-account delinquency independence
// =============================================================================
// When a user has SEPARATE charge accounts (electric + gas on different
// companies), paying one utility should only clear THAT account's
// isDelinquent. PaymentProcessor.recalculateDelinquency iterates charge
// accounts — a bug could either clear both or neither.
//
// Uses COMED electric + NGMA gas (separate charge accounts — different companies).
test.describe('PR-005f: Multi-CA delinquency independence', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'COMED electric + NGMA gas (separate CAs) — pay electric only → only electric clears',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page, sidebarChat, billingPage }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', 'COMED', 'NGMA');
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, 'COMED', 'NGMA', true, false);

      await page.goto('/sign-in');
      await overviewPage.Accept_New_Terms_And_Conditions();

      const electricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

      // Seed delinquency on BOTH accounts
      await accountQueries.setElectricDelinquent(electricAccountId, 30);
      await accountQueries.setGasDelinquent(gasAccountId, 30);

      // Pay ONLY the electric bill (not gas)
      await billQueries.insertElectricBill(
        electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage
      );
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(
        page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, electricAccountId
      );

      // Wait for electric's delinquency to clear
      await accountQueries.waitForElectricDelinquencyCleared(electricAccountId, 30, 2000);

      // Assert: electric cleared, gas STAYS delinquent
      const electricAfter = await accountQueries.getElectricDelinquency(electricAccountId);
      const gasAfter = await accountQueries.getGasDelinquency(gasAccountId);

      expect(electricAfter.isDelinquent, 'electric should clear after its bill is paid').toBe(false);
      expect(
        gasAfter.isDelinquent,
        'gas should REMAIN delinquent — its bill was never paid (independence)'
      ).toBe(true);
    }
  );
});

// =============================================================================
// PR-005g: GasAccount delinquency clearing (symmetric to PR-005a)
// =============================================================================
// Same invariant as PR-005a but for GasAccount.isDelinquent. Uses DUKE gas-only
// (no electric account). If PaymentProcessor.recalculateDelinquency only
// handles electric, gas-only users with paid bills would stay flagged.
test.describe('PR-005g: GasAccount delinquency cleared by manual payment', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'DUKE gas-only — isDelinquent=true on GasAccount → cleared after manual gas payment',
    { tag: [TEST_TAGS.PAYMENT] },
    async ({ overviewPage, page, sidebarChat, billingPage }) => {
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding('autotest', null, 'DUKE');
      await page.goto('/move-in?shortCode=autotest', { waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInManualPayment(page, null, 'DUKE', true, true);

      await page.goto('/sign-in');
      await overviewPage.Accept_New_Terms_And_Conditions();

      const gasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await accountQueries.setGasDelinquent(gasAccountId, 30);

      const before = await accountQueries.getGasDelinquency(gasAccountId);
      expect(before.isDelinquent, 'delinquency seed failed').toBe(true);

      await billQueries.insertGasBill(
        gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage
      );
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(
        page, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, gasAccountId
      );

      await accountQueries.waitForGasDelinquencyCleared(gasAccountId, 30, 2000);

      const after = await accountQueries.getGasDelinquency(gasAccountId);
      expect(after.isDelinquent, 'gas payment should clear isDelinquent on GasAccount').toBe(false);
      expect(after.delinquentDays, 'should zero delinquentDays on GasAccount').toBe(0);
    }
  );
});

