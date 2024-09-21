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
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';


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
    //await CleanUp.Test_User_Clean_Up(MoveIn.cottageUserId);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe.configure({mode: "serial"});
test.describe('Valid Card Manual Payment', () => {
    
  test('NGMA Electric Only Valid Manual Card Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", null);
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage, true, true);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      
      /*const [newTab] = await Promise.all([
          page.waitForEvent('popup'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      await newTab.bringToFront();*/
      
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
      //Manual PAYMENT CHECKS
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
          supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
      ]);
      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
          //check platform dashboard
  });


  test('COMED NGMA Electric Only Valid Manual Card Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
      //MAKE IT COMED BLDG. with ELECTRIC ONLY
      test.setTimeout(1800000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "NGMA");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Manual_Payment_Added(moveInpage, true, false);
  
      await page.goto('/sign-in'); //TEMPORARY FIX
      
      /*const [newTab] = await Promise.all([
          page.waitForEvent('popup'),
          await moveInpage.Click_Dashboard_Link()
      ]);
  
      await newTab.bringToFront();*/
      
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
        supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
      ]);
      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });


  test('CON-EDISON CON-EDISON Electric Only Valid Manual Card Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
  
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, true, false);
  
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
      await overviewPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
        supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
      ]);
      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });
  
  
  test('EVERSOURCE EVERSOURCE Electric & Gas Valid Manual Card Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage, true, true);
  
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
      //MANUAL PAYMENT CHECKS
      await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
      await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
      await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
      await billingPage.Check_Outstanding_Balance_Amount(0);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await Promise.all([
          linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
          linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
      ]);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
      await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
      billingPage.Check_Make_Payment_Button_Visible_Enable();
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);

      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");

      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
      ]);

      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          billingPage.Check_Outstanding_Balance_Amount(0),
  
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
  
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),

          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
          //check platform dashboard
  });
  

  test('NGMA BGE Electric & Gas Valid Manual Card Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","BGE");
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
      await overviewPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
      //MANUAL PAYMENT CHECKS
      await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
      await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
      await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
      await billingPage.Check_Outstanding_Balance_Amount(0);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await Promise.all([
          linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
          linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
      ]);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
      await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
      billingPage.Check_Make_Payment_Button_Visible_Enable();
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);

      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");

      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
      ]);

      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          billingPage.Check_Outstanding_Balance_Amount(0),
  
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
  
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),

          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
          //check platform dashboard
  });
  
  
  test('COMED COMED  Gas Only Valid Manual Card Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Manual_Payment_Added(moveInpage, false, true);
  
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
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
        supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);
      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });


  test('EVERSOURCE BGE Gas Only Valid Manual Card Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", "EVERSOURCE", "BGE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Skip_Payment(moveInpage, false, true);
  
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
      await overviewPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
        supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);
      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });
  
  
  test('EVERSOURCE Gas Only Valid Manual Card Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(300000);
  
      const PGuserUsage = await generateTestUserData();
      
      await supabaseQueries.Update_Companies_to_Building("autotest", null, "EVERSOURCE");
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
  
      await overviewPage.Click_Setup_Payment_Link();
      await overviewPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
        supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //check platform outstanding balance not 0
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);
      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });

});


test.describe('Valid Bank Manual Payment', () => {
  
  test('EVERSOURCE Electric Only Valid Manual Bank Payment Move In Added', async ({moveInpage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(1800000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage, true, true);

    await page.goto('/sign-in'); //TEMPORARY FIX
    
    /*const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        await moveInpage.Click_Dashboard_Link()
    ]);

    await newTab.bringToFront();*/
    
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    //Manual PAYMENT CHECKS
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
        supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
        billingPage.Check_Make_Payment_Button_Visible_Enable(),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
    ]);
    await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
        supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
        supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
        FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
  });


  test('COMED COMED Electric Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    //Manual PAYMENT CHECKS
    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
      supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
        billingPage.Check_Make_Payment_Button_Visible_Enable(),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
    ]);
    await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
        supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
        supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
        FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });


  test('COMED CON-EDISON Electric Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_COMED_New_User_Move_In_Skip_Payment(moveInpage, true, false);

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
    await overviewPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    //Manual PAYMENT CHECKS
    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
      supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
        supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
        billingPage.Check_Make_Payment_Button_Visible_Enable(),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
    ]);
    await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
        supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
        billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
        billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
        billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
        supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
        FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });
  

  test('BGE BGE Electric & Gas Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","BGE","BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage, true, true);

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
    //MANUAL PAYMENT CHECKS
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
    await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
    await billingPage.Check_Outstanding_Balance_Amount(0);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
    await page.waitForTimeout(10000);
    await Promise.all([
        linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
        linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
    ]);
    await page.waitForTimeout(10000);
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
        supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
    billingPage.Check_Make_Payment_Button_Visible_Enable();
    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
      billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
      FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
    ]);

    await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");

    await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
    await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
    billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
      supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
    ]);

    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
  
      billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
      billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
      billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
      supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
  
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
      supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),

      FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
      FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });


  test('BGE NGMA Electric & Gas Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","BGE","NGMA");
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
    await overviewPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage),
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage)
    //MANUAL PAYMENT CHECKS
    await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
    await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
    await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
    await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
    await billingPage.Check_Outstanding_Balance_Amount(0);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
    await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
    await page.waitForTimeout(10000);
    await Promise.all([
        linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
        linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
    ]);
    await page.waitForTimeout(10000);
    await Promise.all([
        supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
        supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
    await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
    await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
    billingPage.Check_Make_Payment_Button_Visible_Enable();
    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
      billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
      FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
    ]);

    await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
    billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");

    await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
    await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
    billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

    await Promise.all([
      supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
      supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
    ]);

    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
      billingPage.Check_Outstanding_Balance_Amount(0),
  
      billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
      billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
      billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
      billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
      supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
  
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
      supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),

      FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
      FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });


  test('NGMA NGMA Gas Only Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage, false, true);

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
    //Manual PAYMENT CHECKS
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
      supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
      billingPage.Check_Make_Payment_Button_Visible_Enable(),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
    ]);
    await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
    await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
    billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
      supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
      FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });


  test('CON-EDISON EVERSOURCE Gas Only Valid Bank Payment Move In Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage, false, true);

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
    //Manual PAYMENT CHECKS
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
      supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
      billingPage.Check_Make_Payment_Button_Visible_Enable(),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
    ]);
    await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
    await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
    billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
      supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
      FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });


  test('COMED Gas Only Valid Bank Payment Finish Account Added', async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
    
    test.setTimeout(300000);

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

    await overviewPage.Click_Setup_Payment_Link();
    await overviewPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
    //Manual PAYMENT CHECKS
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
      supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //platform check
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0)
    ]);
    await page.waitForTimeout(1000);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
    await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
    await page.waitForTimeout(10000);
    await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
        //check platform outstanding balance not 0
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await Promise.all([
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
      billingPage.Check_Make_Payment_Button_Visible_Enable(),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
    ]);
    await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
    await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
    billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");
    await page.waitForTimeout(30000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await Promise.all([
      supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
      billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Outstanding_Balance_Amount(0),
      billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
      billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
      billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
      billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
      supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
      FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
    ]);
    await sidebarChat.Goto_Overview_Page_Via_Icon();
      //check platform dashboard
  });

});
