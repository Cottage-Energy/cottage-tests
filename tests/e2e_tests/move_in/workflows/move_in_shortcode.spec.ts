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


test.describe('Short Code Billing New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'BGE', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", null);
  });


  test('New User for ShortCode Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "NGMA");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'NGMA', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "NGMA");
  });


  test('New User for ShortCode Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage, page}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "BGE", "BGE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", "BGE");
  });


  test('New User for ShortCode Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "BGE", "CON-EDISON", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", "CON-EDISON");
  });


});


//Billing but Cancelled
test.describe('Short Code Billing Canceled Registration', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression5'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, "DTE", null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });


  test('New User for ShortCode Gas Only', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => { // Use BGE and NGMA
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "PSEG");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, null, "PSEG", true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });


  test('New User for ShortCode Electric and Gas Same Company', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", "DTE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, "DTE", "DTE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });


  test('New User for ShortCode Electric and Gas Different Company', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, "PSEG", "CON-EDISON", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });
  

});



test.describe('Short Code TX Dereg/ Coserv New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COSERV", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "COSERV", null,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('New User for ShortCode Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COSERV", "COSERV");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "COSERV", "COSERV",true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('New User Shortcoded Utility TX Dereg Address', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "DTE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Fix_TX_DEREG_Address(moveInpage, "PSEG", "DTE",true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('New User for TX Dereg Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "TX-DEREG", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Bank_Account_Added(moveInpage, "TX-DEREG", null,true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


});