import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';

const supabaseQueries = new SupabaseQueries();

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User', () => {
  
  test('COMED New User', async ({moveInpage}) => {

    const MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    //add query to check if the user is added to the UtilityCredentials table
  });


  test('CON-EDISON New User Add Payment', async ({moveInpage}) => {

    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Payment_Added(moveInpage);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    //add query to check if the user is added to the UtilityCredentials table
  });


  test('EVERSOURCE New User Add Payment', async ({moveInpage}) => {

    const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Payment_Added(moveInpage);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    //add query to check if the user is added to the UtilityCredentials table
  });


  test('CON-EDISON New User Skip Payment', async ({moveInpage}) => {

    const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    //add query to check if the user is added to the UtilityCredentials table
  });


  test('EVERSOURCE New User Skip Payment', async ({moveInpage}) => {

    const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    //add query to check if the user is added to the UtilityCredentials table
  });


});

