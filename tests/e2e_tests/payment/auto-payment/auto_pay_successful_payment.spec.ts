import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { AdminApi } from '../../../resources/api/admin_api';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import environmentBaseUrl from '../../../resources/utils/environmentBaseUrl';
import tokenConfig from '../../../resources/utils/tokenConfig';
import * as PaymentData from '../../../resources/data/payment-data.json';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';


let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
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
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/

test.describe('Valid Card Auto Payment', () => {
  
  test('CON-EDISON Electric Only Valid Auto Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
    
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
    
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment");
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled");
    await billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual);
    //check bill ready email - received
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true);
    //check email - payment successful
    await page.reload({ waitUntil: 'domcontentloaded' });
    await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid");
    await billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual);
    
    
    await billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee);
    await supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    //check platform dashboard
  });


  test('EVERSOURCE Electric Only Valid Auto Payment Finish Account Added', async ({moveInpage, finishAccountSetupPage, page, context, browser}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, true);

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
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
        //platform check and bills page
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(15000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(15000);

    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment");
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
        //check bill ready email - received
        //check platform dashboard and bills page - outstanding balance not 0
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId); //could be flaky
        //await page.waitForTimeout(90000);
 
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true);
        //check email - payment successful
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        //check platform dashboard and bills page  
  });


  test('COMED Electric & Gas Valid Auto Payment Move In Added', async ({moveInpage, page}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
        //platform check and bills page
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(15000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(15000);

    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment");
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
        //check bill ready email - received
    await page.reload({ waitUntil: 'domcontentloaded' });
        //check platform dashboard and bills page - outstanding balance not 0
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId); //could be flaky
        //await page.waitForTimeout(90000);
 
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true);
        //check email - payment successful
    await page.reload({ waitUntil: 'domcontentloaded' });
        //check platform dashboard and bills page
  });


  test('EVERSOURCE CON-EDISON Electric & Gas Valid Auto Payment Finish Account Added', async ({moveInpage, finishAccountSetupPage, page}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
        //platform check and bills page
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(15000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(15000);

    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment");
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
        //check bill ready email - received
    await page.reload({ waitUntil: 'domcontentloaded' });
        //check platform dashboard and bills page - outstanding balance not 0
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId); //could be flaky
        //await page.waitForTimeout(90000);
 
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true);
        //check email - payment successful
    await page.reload({ waitUntil: 'domcontentloaded' });
        //check platform dashboard and bills page
  });

  //Gas Account Only Move In Added BGE
  //Gas Account Only Finish Account Added NGMA

});


test.describe('Valid Bank Auto Payment', () => {

});