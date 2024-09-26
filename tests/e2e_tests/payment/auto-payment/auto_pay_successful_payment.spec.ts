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
    await CleanUp.Test_User_Clean_Up(MoveIn.cottageUserId);
    await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe.configure({mode: "serial"});
test.describe('Valid Card Auto Payment', () => {
  
  test('CON-EDISON Electric Only Valid Auto Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    
    /*const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    await newTab.bringToFront();*/
    
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('EVERSOURCE EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });


  test('NGMA EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","EVERSOURCE");
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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
  });
  

  test('NGMA NGMA Electric & Gas Valid Auto Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

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

    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('COMED BGE Electric & Gas Valid Auto Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('COMED COMED Gas Only Valid Auto Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, false, true);

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

    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
    await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('BGE CON-EDISON Gas Only Valid Auto Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

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

    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
    await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


  test('CON-EDISON Gas Only Valid Auto Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(900000);

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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
    await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
  });


});


test.describe('Valid Bank Auto Payment', () => {
    
    test('COMED Electric Only Valid Bank Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(900000);
    
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
        
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });


    test('CON-EDISON COMED Electric Only Valid Bank Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(900000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "CON-EDISON", "COMED");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_COMED_New_User_Move_In_Bank_Account_Added(moveInpage, true, false);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });


    test('NGMA NGMA Electric Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
        test.setTimeout(900000);
    
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
    
        await overviewPage.Click_Setup_Payment_Link();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });
    
    
    test('BGE BGE Electric & Gas Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(900000);
    
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
    
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });
    

    test('EVERSOURCE COMED Electric & Gas Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(900000);
    
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
        
        await overviewPage.Click_Setup_Payment_Link();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });
    
    
    test('CON-EDISON CON-EDISON  Gas Only Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(900000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Bank_Account_Added(moveInpage, false, true);
    
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
    
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });


    test('EVERSOURCE CON-EDISON Gas Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(900000);
    
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
    
        await overviewPage.Click_Setup_Payment_Link();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });
    
    
    test('BGE Gas Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(900000);
    
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
    
        await overviewPage.Click_Setup_Payment_Link();
        await overviewPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });

});