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
import { fa } from '@faker-js/faker';


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

  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/

test.describe('Valid Card Auto Payment', () => {
  
  test('CON-EDISON Valid Auto Payment Move In Added', async ({moveInpage, page}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
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


  test('EVERSOURCE Valid Auto Payment Finish Account Added', async ({moveInpage, finishAccountSetupPage, page}) => {
    
    test.setTimeout(300000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage, true, true);
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
        //check platform dashboard and bills page - outstanding balance not 0
    await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId); //could be flaky
        //await page.waitForTimeout(90000);
 
    await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true);
        //check email - payment successful
    await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        //check platform dashboard and bills page  
  });

});
