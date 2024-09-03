import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.cottageUserId);
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial"});
test.describe('Move In New User', () => {


  test('COMED New User', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


  test('CON-EDISON New User Add Auto Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Add Auto Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


  test('CON-EDISON New User Add Manual Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Add Manual Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


  test('CON-EDISON New User Skip Add Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Skip Add Payment', async ({moveInpage, page}) => {
    test.slow();
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


});

