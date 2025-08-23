import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

const supabaseQueries = new SupabaseQueries();
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


test.describe.skip('Short Code Referal', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, "BGE", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });



});


//Billing but Cancelled
test.describe.skip('Short Code Referal Canceled Registration', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page, "DTE", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });




});



test.describe.skip('Non Short Code Referal', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression3'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NYS-EG", null);
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, "NYS-EG", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


});