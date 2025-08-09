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
    //await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {

});*/


test.describe.skip('Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
  
  test('EVERSOURCE EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"EVERSOURCE","EVERSOURCE", true, false);

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


    //Payment Checks
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage, AdminApiContext);
  });


  test('PSEG Electric & Gas Valid Auto Payment Move In Added', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","PSEG","PSEG");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"PSEG","PSEG", true, true);

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




    const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await Promise.all([
        supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
        supabaseQueries.Insert_Gas_Bill(GasAccountId)
    ]);
    await page.waitForTimeout(500);
    //await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(AdminApiContext, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('COMED BGE Electric & Gas Valid Auto Payment Finish Account Added', {tag: ['@smoke', '@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"COMED","BGE", true, true);

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
    const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await Promise.all([
        supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
        supabaseQueries.Insert_Gas_Bill(GasAccountId)
    ]);
    await page.waitForTimeout(500);
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(AdminApiContext, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('NGMA NGMA Electric & Gas Valid Auto Payment Move In Added', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"NGMA","NGMA", true, true);

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
    const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await Promise.all([
        supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
        supabaseQueries.Insert_Gas_Bill(GasAccountId)
    ]);
    await page.waitForTimeout(500);
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks(AdminApiContext, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
  });


  test('BGE CON-EDISON Gas Only Valid Auto Payment Move In Added', {tag: [ '@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","BGE","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"BGE","CON-EDISON", false, true);

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
    const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Insert_Gas_Bill(GasAccountId);
    await page.waitForTimeout(500);
    await paymentUtilities.Auto_Card_Payment_Gas_Checks(AdminApiContext, MoveIn, PGuserUsage, GasAccountId);
  });


});


test.describe.skip('Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    
    test('COMED Electric Only Valid Bank Payment Move In Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", null);
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Bank_Account_Added(moveInpage, "COMED", null, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Accept_New_Terms_And_Conditions();
        const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
        await supabaseQueries.Insert_Electric_Bill(ElectricAccountId);
        await page.waitForTimeout(500);
        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId);
    });


    test('DELMARVA Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","DELMARVA","DELMARVA");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"DELMARVA","DELMARVA", true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
            supabaseQueries.Insert_Gas_Bill(GasAccountId)
        ]);
        await page.waitForTimeout(500);
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });
    
    
    test('BGE DTE Electric & Gas Valid Bank Payment Move In Added', {tag: ['@smoke', '@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","BGE","DTE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Bank_Account_Added(moveInpage,"BGE","DTE", true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
            supabaseQueries.Insert_Gas_Bill(GasAccountId)
        ]);
        await page.waitForTimeout(500);
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });
    

    test('EVERSOURCE EVERSOURCE Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,"EVERSOURCE","EVERSOURCE", true, true);
    
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
        const ElectricAccountId = await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
        const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
        await Promise.all([
            supabaseQueries.Insert_Electric_Bill(ElectricAccountId),
            supabaseQueries.Insert_Gas_Bill(GasAccountId)
        ]);
        await page.waitForTimeout(500);
        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, ElectricAccountId, GasAccountId);
    });
    
    

    test('BGE Gas Only Valid Bank Payment Finish Account Added', {tag: ['@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", null, "BGE");
        await supabaseQueries.Update_Building_Billing("autotest",true);
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, null, "BGE", true, true);
    
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
        const GasAccountId = await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
        await supabaseQueries.Insert_Gas_Bill(GasAccountId);
        await page.waitForTimeout(500);
        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, AdminApiContext, overviewPage, billingPage, sidebarChat, MoveIn, PGuserUsage, GasAccountId);
    });

});