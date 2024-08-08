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


let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();


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

  await supabaseQueries.Update_Companies_to_Building('autotest','CON-EDISON', 'CON-EDISON');
  await supabaseQueries.Update_Building_Billing('autotest',true);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
});
  
test.afterEach(async ({ page },testInfo) => {
  //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/

test.describe('Valid Card Manual Payment', () => {

  test('CON-EDISON Valid Manual Payment Move In Added', async ({moveInpage, sidebarChat, billingPage, page}) => {

    test.setTimeout(300000);
    
    const PGuserUsage = await generateTestUserData();
    const ElectricUsage = PGuserUsage.ElectricUsage.toString();
    const GasUsage = PGuserUsage.GasUsage.toString();

    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage, true, true);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
    await AdminApi.Simulate_Gas_Bill(AdminApiContext,GasAccountId,PGuserUsage.GasAmount,PGuserUsage.GasUsage);
        //supabase check bill visibility - false
        //supabase check bill isSendReminder - true
        //platform check and bills page
        //supabase check if bill paid notification - false
    await page.waitForTimeout(30000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(30000);
        //supabase check bill visibility - true
        //supabase check if bill wait for user payment
        //check bill ready email - received
        //check platform dashboard and 
    await page.reload({ waitUntil: 'domcontentloaded' });
      //bills page
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Click_Electric_Bill_Pay_Button(ElectricUsage);
        //Set Pay bill
        ////supabase check if bill processing
        //check platform dashboard and bills page
        //await page.waitForTimeout(90000);
        //supabase check if bill paid notification - true
        //check email - payment successful
        //supabase check if bill success
    //check platform dashboard and bills page
  });


  test('CON-EDISON Valid Manual Payment Finish Account Added', async ({moveInpage, finishAccountSetupPage, sidebarChat, billingPage, page}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    const ElectricUsage = PGuserUsage.ElectricUsage.toString();
    const GasUsage = PGuserUsage.GasUsage.toString();

    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage, true, true);
    finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        //supabase check bill visibility - false
        //supabase check bill isSendReminder - true
        //platform check and bills page
        //supabase check if bill paid notification - false
    await page.waitForTimeout(30000);
    await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
    await page.waitForTimeout(30000);
        //supabase check bill visibility - true
        //supabase check if bill wait for user payment
        //check bill ready email - received
        //check platform dashboard and
    await page.reload({ waitUntil: 'domcontentloaded' }); 
        //bills page
    await sidebarChat.Goto_Billing_Page_Via_Icon();
    await billingPage.Click_Electric_Bill_Pay_Button(ElectricUsage);
        //Set Pay bill
        ////supabase check if bill processing
        //check platform dashboard and bills page
        //await page.waitForTimeout(90000);
        //check platform dashboard and bills page
        //supabase check if bill paid notification - true
        //check email - payment successful
        //supabase check if bill success
    //check platform dashboard and bills page
        
  });

});
