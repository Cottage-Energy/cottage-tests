import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { AdminApi } from '../../../resources/api/admin_api';
import environmentBaseUrl from '../../../resources/utils/environmentBaseUrl';

let AdminApiContext: APIRequestContext;
const supabaseQueries = new SupabaseQueries();


test.beforeAll(async ({playwright,page}) => {
    const env = process.env.ENV || 'dev';
    const baseUrl = environmentBaseUrl[env].admin_api;

    AdminApiContext = await playwright.request.newContext({
        baseURL: baseUrl,
        extraHTTPHeaders: {
            Authorization: 'Bearer thisisasecretkeyforadminactions',
            Accept: 'application/json',
        },
    });
});

test.beforeEach(async ({ page },testInfo) => {
    await page.goto('/',{ waitUntil: 'domcontentloaded' })
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
  });
  
  test.afterEach(async ({ page },testInfo) => {
    //await page.close();
  });
  
  /*test.afterAll(async ({ page }) => {
  
  });*/

  test.describe('Valid Auto Payment', () => {

    test('CON-EDISON Valid Payment Move In Added', async ({moveInpage, request}) => {
        test.setTimeout(300000);

        const PGuserUsage = await generateTestUserData();

        const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Payment_Added(moveInpage);
        const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await AdminApi.Simulate_Electric_Bill(AdminApiContext,ElectricAccountId,PGuserUsage.ElectricAmount,PGuserUsage.ElectricUsage);
        




      });

  });
