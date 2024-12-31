import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { PaymentUtilities } from '../../../resources/fixtures/paymentUtilities';
import { AdminApi } from '../../../resources/api/admin_api';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import environmentBaseUrl from '../../../resources/utils/environmentBaseUrl';
import tokenConfig from '../../../resources/utils/tokenConfig';
import * as PaymentData from '../../../resources/data/payment-data.json';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';


let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
const paymentUtilities = new PaymentUtilities();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ playwright, page },testInfo) => {
  const env = process.env.ENV || 'dev';
  const baseUrl = environmentBaseUrl[env].admin_api;
  const adminToken = tokenConfig[env].admin;

  AdminApiContext = await playwright.request.newContext({
    baseURL: baseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminToken}`,
      Accept: 'application/json',
    },
  });

  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe.skip('Invalid Card to Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"}); 

    test('COMED COMED Electric Only Profile Added to Failed Message Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Skip_Payment(moveInpage, true, false);
    
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
        await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500);
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId);
    });
    
  
    test('CON-EDISON CON-EDISON Electric & Gas Move In Added to Failed Message Update', {tag: [  '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true, PaymentData.InvalidCardNumber);
  
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
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await Promise.all([
          AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
          AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('BGE COMED Gas Only Move In Added to Failed Message Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","BGE","COMED");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Auto_Payment_Added(moveInpage, false, true, PaymentData.InvalidCardNumber);
    
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
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500);
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Alert_Update_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, GasAccountId);
    });


    test('CON-EDISON Electric Only Move In Added to Pay Bill Link Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true, PaymentData.InvalidCardNumber);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500);
        await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
  

    test('COMED EVERSOURCE Electric & Gas Profile Added to Pay Bill Link Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
  
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
      await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await Promise.all([
          AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
          AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });

  
    test('COMED Gas Only Finish Account Added to Pay Bill Link Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", null, "COMED");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
  
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
   
      
      await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.InvalidCardNumber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });
  
});


test.describe.skip('xxInvalid Card to Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});

    test('xxEVERSOURCE EVERSOURCE Electric Only Finish Account Added to Pay Button Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, false);
    
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
        
        
        await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
  

    test('xxCOMED BGE Electric & Gas Valid Profile Added to Pay Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","BGE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Skip_Payment(moveInpage, true, true);
  
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
      
      await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await Promise.all([
          AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
          AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500)
      await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('xxBGE CON-EDISON Gas Only Move In Added to Pay Button Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","BGE","CON-EDISON");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.BGE_CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, false, true);
    
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
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });


    test('xxCON-EDISON Electric Only Move In Added to Profile Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
      
    
    test('xxNGMA NGMA Electric & Gas Move In Added to Profile Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
            AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('xxCON-EDISON Gas Only Valid Profile Added to Profile Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", null, "CON-EDISON");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    
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
        
        await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });
  
});


test.describe.skip('Invalid Bank to Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    test('COMED Electric Move In Added to Failed Message Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", null);
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Failed_Bank_Account_Added(moveInpage, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId);
    });

    
    test('DTE DTE Electric & Gas Move In Added to Failed Message Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","DTE","DTE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Failed_Bank_Account_Added(moveInpage, true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
            AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('EVERSOURCE NGMA Gas Profile Added to Failed Message Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "EVERSOURCE", "NGMA");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, false, true);
    
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
        await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Alert_Update_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, profilePage, PGuserUsage, GasAccountId);
    });


    test('PSEG PSEG Electric Profile Added to Make Payment Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, profilePage, finishAccountSetupPage}) => {
    
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","PSEG","PSEG");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, false);
    
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
        await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Electric_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
    

    test('NGMA CON-EDISON Electric & Gas Finish Account Added to Make Payment Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","CON-EDISON");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    
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
        await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
            AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Electric_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });

    
    test('NGMA Gas Finish Account Added to Make Payment Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", null, "NGMA");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    
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
        await finishAccountSetupPage.Enter_Auto_Payment_Invalid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Gas_Bill(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });

});


test.describe.skip('xxInvalid Bank to Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    test('NGMA NGMA Electric Profile Added to Pay Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, false);
    
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
        
        await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
    

    test('EVERSOURCE COMED Electric & Gas Move In Added to Pay Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","COMED");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    
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
        
        await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
            AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });

    
    test('BGE Gas Finish Account Added to Pay Button Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", null, "BGE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    
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
        
        await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });


    test('COMED Electric Move In Added to Profile Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", null);
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Bank_Account_Added(moveInpage, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });

    
    test('BGE BGE Electric & Gas Move In Added to Profile Update', {tag: [ '@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","BGE","BGE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Bank_Account_Added(moveInpage, true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
            AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });


    test('EVERSOURCE CON-EDISON Gas Profile Added to Profile Update', {tag: ['@regression'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "EVERSOURCE", "CON-EDISON");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, false, true);
    
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
        
        await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await overviewPage.Accept_New_Terms_And_Conditions();
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await page.waitForTimeout(500)
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });

});