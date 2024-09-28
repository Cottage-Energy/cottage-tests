import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../resources/fixtures/moveInUtilities';
import { AdminApi } from '../../resources/api/admin_api';
import { LinearActions } from '../../resources/fixtures/linear_actions';
import environmentBaseUrl from '../../resources/utils/environmentBaseUrl';
import tokenConfig from '../../resources/utils/tokenConfig';
import { CleanUp } from '../../resources/fixtures/userCleanUp';


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
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/

test.describe('CON-EDISON Utility Session', () => {
  
  test('CON-EDISON Electric Account', async ({moveInpage, page, context}) => {
    
    test.setTimeout(900000);

    const PGuserUsage = await generateTestUserData();
    
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    
    await AdminApi.CON_EDISON_Sign_Up(AdminApiContext,ElectricAccountId);
    await page.waitForTimeout(5000);
    const SignUpJobId = await supabaseQueries.Get_Running_Registration_Job(MoveIn.cottageUserId);
    await supabaseQueries.Check_Registration_Job_Completion(SignUpJobId);
    
    await AdminApi.CON_EDISON_Verify_Account(AdminApiContext,ElectricAccountId);
    await page.waitForTimeout(5000);
    const VerifyJobId = await supabaseQueries.Get_Running_Registration_Job(MoveIn.cottageUserId);
    await supabaseQueries.Check_Registration_Job_Completion(VerifyJobId);
    
    await AdminApi.CON_EDISON_Start_Service(AdminApiContext,ElectricAccountId);
    await page.waitForTimeout(5000);
    const StartSvcJobId = await supabaseQueries.Get_Running_Registration_Job(MoveIn.cottageUserId);
    await supabaseQueries.Check_Registration_Job_Completion(StartSvcJobId);

  });

  //Gas Account Only
  //Electric and Gas both ConEd
  //Electric ConEd and Diff Gas
  //Diff Electric and ConEd Gas


});