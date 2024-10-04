import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
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
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

test.describe.configure({mode: "serial"});
test.describe('Short Code Billing New User Electric &/or Gas', () => {
  

  test('New User for ShortCode Electric Only', async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", null);
  });


  test('New User for ShortCode Gas Only', async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "NGMA");
  });


  test('New User for ShortCode Electric and Gas Same Company', async ({moveInpage, page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", "BGE");
  });


  test('New User for ShortCode Electric and Gas Different Company', async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.BGE_CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", "CON-EDISON");
  });

});

test.describe('Short Code Non Billing New User Electric &/or Gas', () => {
  

  test('New User for ShortCode Electric Only', async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", null);
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Non_Billing(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "NGMA", null);
  });


  test('New User for ShortCode Gas Only', async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.BGE_New_User_Move_In_Non_Billing(moveInpage, true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "BGE");
  });


  test('New User for ShortCode Electric and Gas Same Company', async ({moveInpage, page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", "NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Non_Billing(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "NGMA", "NGMA");
  });


  test('New User for ShortCode Electric and Gas Different Company', async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", "CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Non_Billing(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "NGMA", "CON-EDISON");
  });

});