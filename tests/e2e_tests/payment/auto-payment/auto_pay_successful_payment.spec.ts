import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../resources/page_objects';
import { MoveInTestUtilities, generateTestUserData, CleanUp, FastmailActions, PaymentUtilities, SupabaseQueries } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { AdminApi } from '../../../resources/api/admin_api';
import environmentBaseUrl from '../../../resources/utils/environmentBaseUrl';
import * as PaymentData from '../../../resources/data/payment-data.json';


let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();
const paymentUtilities = new PaymentUtilities();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ playwright, page, supabaseQueries },testInfo) => {
  /*const env = process.env.ENV || 'dev';
  const baseUrl = environmentBaseUrl[env].admin_api;
  const adminToken = process.env.ADMIN_TOKEN;

  AdminApiContext = await playwright.request.newContext({
    baseURL: baseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${adminToken}`,
      Accept: 'application/json',
    },
  });*/
  
  await supabaseQueries.Update_Building_Billing("autotest",true);
  await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
  await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
    await page.close();
});
  
/*test.afterAll(async ({ page }) => {

});*/


test.describe.skip('Valid Card Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
  
  test('EVERSOURCE EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,"EVERSOURCE","EVERSOURCE", true, false);

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
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();


    //Payment Checks
    await paymentUtilities.Auto_Card_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
  });


  test('PSEG Electric & Gas Valid Auto Payment Move In Added', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","PSEG","PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"PSEG","PSEG", true, true);

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
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Single_Charge(page, MoveIn, PGuserUsage);
  });


  test('SDGE SCE Electric & Gas Valid Auto Payment Finish Account Added', {tag: ['@smoke', '@regression6'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","SDGE","SCE");

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,"SDGE","SCE", true, true);

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
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();


    //Payment Checks
    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });


  test('NGMA NGMA Electric & Gas Valid Auto Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"NGMA","NGMA", true, true);

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
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
  });


  test('DUKE CON-EDISON Gas Only Valid Auto Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","DUKE","CON-EDISON");

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"DUKE","CON-EDISON", false, true);

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
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();

    await paymentUtilities.Auto_Card_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
  });


});


test.describe.skip('Valid Bank Auto Payment', () => {
    test.describe.configure({mode: "serial"});
    
    
    test('COMED Electric Only Valid Bank Payment Move In Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        //MAKE IT COMED BLDG. with ELECTRIC ONLY
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", null);
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Bank_Account_Added(page, "COMED", null, true, true);
    
        await page.goto('/sign-in'); //TEMPORARY FIX
        
        /*const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await moveInpage.Click_Dashboard_Link()
        ]);
    
        await newTab.bringToFront();*/
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Checks(page, MoveIn, PGuserUsage);
    });


    test('DELMARVA Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","DELMARVA","DELMARVA");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,"DELMARVA","DELMARVA", true, true);
    
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
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Single_Charge(page, MoveIn, PGuserUsage);
    });
    
    
    test('BGE DTE Electric & Gas Valid Bank Payment Move In Added', {tag: ['@smoke', '@regression5'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","BGE","DTE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Bank_Account_Added(page,"BGE","DTE", true, true);
    
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
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
    });
    

    test('EVERSOURCE EVERSOURCE Electric & Gas Valid Bank Payment Finish Account Added', {tag: ['@regression7'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,"EVERSOURCE","EVERSOURCE", true, true);
    
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
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge(page, MoveIn, PGuserUsage);
    });
    

    test('BGE Gas Only Valid Bank Payment Finish Account Added', {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context, finishAccountSetupPage}) => {
        
        test.setTimeout(1800000);
    
        const PGuserUsage = await generateTestUserData();
        
        await supabaseQueries.Update_Companies_to_Building("autotest", null, "BGE");
        
        await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
        MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page, null, "BGE", true, true);
    
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
        await overviewPage.Setup_Password();
        await overviewPage.Accept_New_Terms_And_Conditions();

        await paymentUtilities.Auto_Bank_Payment_Gas_Checks(page, MoveIn, PGuserUsage);
    });

});