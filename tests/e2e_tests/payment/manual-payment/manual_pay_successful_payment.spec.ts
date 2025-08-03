import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../resources/page_objects/base/pg_page_base';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { PaymentUtilities } from '../../../resources/fixtures/paymentUtilities';
import { AdminApi } from '../../../resources/api/admin_api';
import environmentBaseUrl from '../../../resources/utils/environmentBaseUrl';
import * as PaymentData from '../../../resources/data/payment-data.json';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';


let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();
const paymentUtilities = new PaymentUtilities();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ playwright, page },testInfo) => {
  const env = process.env.ENV || 'dev';
  const baseUrl = environmentBaseUrl[env].admin_api;
  const adminToken = process.env.ADMIN_TOKEN;

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


test.describe.skip('Valid Card Manual Payment', () => {
  test.describe.configure({mode: "serial"});
  
    
  test('NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", null);
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage, "NGMA", null, true, true);
  
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
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED NGMA Electric Only Valid Manual Card Payment Move In Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "NGMA");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage, "COMED", "NGMA", true, false);
  
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
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('CON-EDISON CON-EDISON Electric Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
  
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"CON-EDISON","CON-EDISON", true, false);
  
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

      await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });
  
  
  test('EVERSOURCE EVERSOURCE Electric & Gas Valid Manual Card Payment Move In Added', {tag: ['@smoke', '@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage,"EVERSOURCE","EVERSOURCE", true, true);
  
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
      await paymentUtilities.Manual_Card_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });
  

  test('NGMA BGE Electric & Gas Valid Manual Card Payment Finish Account Added', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","BGE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"NGMA","BGE", true, true);
  
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

      await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await Promise.all([
        AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
        AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
      ]);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });
  
  
  test('COMED COMED  Gas Only Valid Manual Card Payment Move In Added', {tag: ['@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage,"COMED","COMED", false, true);
  
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
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('EVERSOURCE BGE Gas Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "EVERSOURCE", "BGE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, "EVERSOURCE", "BGE", false, true);
  
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

      await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });
  
  
  test('EVERSOURCE Gas Only Valid Manual Card Payment Finish Account Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
      
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", null, "EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, null, "EVERSOURCE", true, true);
  
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

      await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      await overviewPage.Accept_New_Terms_And_Conditions();
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
      await page.waitForTimeout(500);
      await paymentUtilities.Manual_Card_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });

});


test.describe.skip('Valid Bank Manual Payment', () => {
  test.describe.configure({mode: "serial"});
  
  
  test('EVERSOURCE Electric Only Valid Manual Bank Payment Move In Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Bank_Account_Added(moveInpage, 'EVERSOURCE', null, true, true);

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
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED COMED Electric Only Valid Bank Payment Finish Account Added', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"COMED","COMED", true, false);

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
    
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('COMED CON-EDISON Electric Only Valid Bank Payment Finish Account Added', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"COMED","CON-EDISON", true, false);

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
    
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });
  

  test('BGE BGE Electric & Gas Valid Bank Payment Move In Added', {tag: ['@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","BGE","BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Bank_Account_Added(moveInpage,"BGE","BGE", true, true);

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
    await paymentUtilities.Manual_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('BGE NGMA Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@smoke', '@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","BGE","NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"BGE","NGMA", true, true);

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
    
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await Promise.all([
      AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
      AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
    ]);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('NGMA NGMA Gas Only Valid Bank Payment Move In Added', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Bank_Account_Added(moveInpage,"NGMA","NGMA", false, true);

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
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('CON-EDISON EVERSOURCE Gas Only Valid Bank Payment Move In Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Bank_Account_Added(moveInpage,"CON-EDISON","EVERSOURCE", false, true);

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
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('COMED Gas Only Valid Bank Payment Finish Account Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "COMED");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, null, "COMED", true, true);

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
    
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
    await page.waitForTimeout(500);
    await paymentUtilities.Manual_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });

});
