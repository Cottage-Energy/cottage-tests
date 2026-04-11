import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, newUserMoveInAutoBankAccount, newUserMoveInAutoFailedBankAccount, generateTestUserData, CleanUp, PaymentUtilities } from '../../../resources/fixtures';
import { utilityQueries, accountQueries, billQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

const paymentUtilities = new PaymentUtilities();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ page }) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page }) => {
    if (MoveIn?.pgUserEmail) {
        await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    }
    await page.close();
});


test.describe('Invalid Card to Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"}); 

    test('COMED COMED Electric Only Profile Added to Failed Message Update', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
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
        // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500);
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId);
    });
    
  
    test('CON-EDISON CON-EDISON Electric & Gas Move In Added to Failed Message Update', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","CON-EDISON","CON-EDISON");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page,"CON-EDISON","CON-EDISON", true, true, true, PaymentData.InvalidCardNumber);
  
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
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Gas_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('BGE COMED Gas Only Move In Added to Failed Message Update', {tag: [ '@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","BGE","COMED");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page,"BGE","COMED", false, true, true, PaymentData.InvalidCardNumber);
    
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
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Gas_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, GasAccountId);
    });


    test('CON-EDISON Electric Only Move In Added to Pay Bill Link Update', {tag: ['@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page, 'CON-EDISON', null, true, true, true, PaymentData.InvalidCardNumber);
    
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
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Bill(page, MoveIn, PGuserUsage);
    });
  

    test('COMED EVERSOURCE Electric & Gas Profile Added to Pay Bill Link Update', {tag: [ '@smoke', '@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","COMED","EVERSOURCE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page,"COMED","EVERSOURCE", true, true);
  
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
      // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await Promise.all([
          billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
          billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Gas_Bill(page, MoveIn, PGuserUsage);
    });

  
    test('COMED Gas Only Finish Account Added to Pay Bill Link Update', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
      
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
   
      
      // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Gas_Bill(page, MoveIn, PGuserUsage);
    });
  
});


test.describe('Invalid Card to Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});

    test('xxEVERSOURCE EVERSOURCE Electric Only Finish Account Added to Pay Button Update', {tag: [ '@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","EVERSOURCE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"EVERSOURCE","EVERSOURCE", true, false);
    
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
        
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });
  

    test('xxCOMED BGE Electric & Gas Valid Profile Added to Pay Button Update', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await utilityQueries.updateCompaniesToBuilding("autotest","COMED","BGE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInSkipPayment(page,"COMED","BGE", true, true);
  
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
      
      // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
      await Promise.all([
          billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
          billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500)
      await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, MoveIn, PGuserUsage);
    });


    test('xxBGE CON-EDISON Gas Only Move In Added to Pay Button Update', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","BGE","CON-EDISON");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page,"BGE","CON-EDISON", false, true);
    
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
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });


    test('xxCON-EDISON Electric Only Move In Added to Profile Update', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page, 'CON-EDISON', null, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });
      
    
    test('xxNGMA NGMA Electric & Gas Move In Added to Profile Update', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","NGMA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoPayment(page,"NGMA","NGMA", true, true);
    
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
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, MoveIn, PGuserUsage);
    });


    test('xxCON-EDISON Gas Only Valid Profile Added to Profile Update', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", null, "CON-EDISON");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, null, "CON-EDISON", true, true);
    
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
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });
  
});


test.describe('Invalid Bank to Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    test('COMED Electric Move In Added to Failed Message Update', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", null);
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoFailedBankAccount(page,"COMED", null, true, false);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId);
    });

    
    test('DTE DTE Electric & Gas Move In Added to Failed Message Update', {tag: [ '@smoke', '@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","DTE","DTE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoFailedBankAccount(page,"DTE","DTE", true, true);
    
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
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Gas_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('EVERSOURCE NGMA Gas Profile Added to Failed Message Update', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", "EVERSOURCE", "NGMA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, "EVERSOURCE", "NGMA", false, true);
    
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
        // await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Gas_Bill(page, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, GasAccountId);
    });


    test('PSEG PSEG Electric Profile Added to Pay Bill Button Update', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage}) => {
    
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","PSEG","PSEG");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"PSEG","PSEG", true, false);
    
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
        // await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Electric_Bill(page, MoveIn, PGuserUsage);
    });
    

    test('NGMA CON-EDISON Electric & Gas Finish Account Added to Pay Bill Button Update', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","CON-EDISON");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"NGMA","CON-EDISON", true, true);
    
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
        // await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await Promise.all([
            billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Electric_Gas_Bill(page, MoveIn, PGuserUsage);
    });

    
    test('NGMA Gas Finish Account Added to Pay Bill Button Update', {tag: ['@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", null, "NGMA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, null, "NGMA", true, true);
    
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
        // await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Gas_Bill(page, MoveIn, PGuserUsage);
    });

});


test.describe('Invalid Bank to Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    test('NGMA NGMA Electric Profile Added to Pay Button Update', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","NGMA","NGMA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"NGMA","NGMA", true, false);
    
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
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });
    

    test('EVERSOURCE COMED Electric & Gas Move In Added to Pay Button Update', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","COMED");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page,"EVERSOURCE","COMED", true, true);
    
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
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await Promise.all([
            billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, MoveIn, PGuserUsage);
    });

    
    test('BGE Gas Finish Account Added to Pay Button Update', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", null, "BGE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, null, "BGE", true, true);
    
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
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });


    test('COMED Electric Move In Added to Profile Update', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", null);
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoBankAccount(page, "COMED", null, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
        await billQueries.insertElectricBill(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });

    
    test('BGE BGE Electric & Gas Move In Added to Profile Update', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest","BGE","BGE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInAutoBankAccount(page,"BGE","BGE", true, true);
    
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
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, MoveIn, PGuserUsage);
    });


    test('EVERSOURCE CON-EDISON Gas Profile Added to Profile Update', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await utilityQueries.updateCompaniesToBuilding("autotest", "EVERSOURCE", "CON-EDISON");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await newUserMoveInSkipPayment(page, "EVERSOURCE", "CON-EDISON", false, true);
    
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
        
        // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
        await billQueries.insertGasBill(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });

});

