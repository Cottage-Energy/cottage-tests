import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

test.describe.configure({mode: "serial"});
test.describe('Move In New User Electric & Gas', () => {
  

  test('New User for ShortCode Electric Only', async ({moveInpage,page}) => {
    test.slow();

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    const MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage, true, false);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
  });


  test('New User for ShortCode Gas Only', async ({moveInpage, page}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Gas Only
    await supabaseQueries.Update_Companies_to_Building("autotest",null, "EVERSOURCE");
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
  });


  test('New User for ShortCode Electric and Gas Same Company', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric and Gas Different Company', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Different Company
  });


  test('New User for ShortCode Electric and Gas Both Non Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric is Billing and Gas is Non Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric is Non Billing and Gas is Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


});

