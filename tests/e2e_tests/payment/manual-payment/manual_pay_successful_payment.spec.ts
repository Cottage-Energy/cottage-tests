import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInManualPayment, newUserMoveInSkipPayment, newUserMoveInManualBankAccount, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { ManualPaymentChecks } from '../../../resources/fixtures/payment';
import { utilityQueries, accountQueries, billQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

const paymentUtilities = new ManualPaymentChecks();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe('Valid Card Manual Payment', () => {
  test.describe.configure({mode: "serial"});
  
    
  test('NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
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


  test('COMED NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
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


  test('CON-EDISON CON-EDISON Electric Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
  
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
  
  
  test('EVERSOURCE EVERSOURCE Electric & Gas Valid Manual Card Payment Move In Added', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
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
  

  test('NGMA BGE Electric & Gas Valid Manual Card Payment Finish Account Added', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
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
  
  
  test('COMED COMED  Gas Only Valid Manual Card Payment Move In Added', {tag: ['@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
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


  test('EVERSOURCE BGE Gas Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
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
  
  
  test('EVERSOURCE Gas Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
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
  
  
  test('EVERSOURCE Electric Only Valid Manual Bank Payment Move In Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('COMED COMED Electric Only Valid Bank Payment Finish Account Added', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('COMED CON-EDISON Electric Only Valid Bank Payment Finish Account Added', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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
  

  test('BGE BGE Electric & Gas Valid Bank Payment Move In Added', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('BGE NGMA Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('NGMA NGMA Gas Only Valid Bank Payment Move In Added', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('CON-EDISON EVERSOURCE Gas Only Valid Bank Payment Move In Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


  test('COMED Gas Only Valid Bank Payment Finish Account Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
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


