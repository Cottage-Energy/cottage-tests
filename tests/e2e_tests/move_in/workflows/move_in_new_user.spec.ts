import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../../resources/data/payment-data.json';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in?',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial"});
test.describe('Move In New User', () => {


  test('COMED New User', {tag: ['@regression1'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,'COMED', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_isRegistrationComplete(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED");
    //check Account Status
  });


  test('COSERV New User', {tag: ['@regression1'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'COSERV', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COSERV");
    //check Account Status
  });


  test('CON-EDISON New User Add Auto Payment', {tag: [ '@regression2'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'CON-EDISON', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON");
    //check Account Status
  });


  test('EVERSOURCE New User Add Auto Payment', {tag: [ '@regression3'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,'EVERSOURCE', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE");
    //check Account Status
  });


  test('CON-EDISON New User Add Manual Payment', {tag: [ '@regression4'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage, 'CON-EDISON', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON");
    //check Account Status
  });


  test('EVERSOURCE New User Add Manual Payment', {tag: [ '@regression5'],}, async ({moveInpage, page}) => {
    test.setTimeout(180000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage, 'EVERSOURCE', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE");
    //check Account Status
  });


  test('CON-EDISON New User Skip Add Payment', {tag: [ '@regression6'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, 'CON-EDISON', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, "PENDING", "CON-EDISON");
    //check Account Status
  });


  test('EVERSOURCE New User Skip Add Payment', {tag: [ '@regression7'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {

    const PGuserUsage = await generateTestUserData();

    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage, 'EVERSOURCE', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //check no email
    //add query to check if the user is added to the UtilityCredentials table
    //finish setup paymment
    await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, "PENDING", "EVERSOURCE");
    //check Account Status
  });


  test('CON-EDISON New User Skip And Cancel Registration', {tag: [ '@regression1'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,'CON-EDISON', null, true,true);
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


  test('EVERSOURCE New User Skip And Cancel Registration', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {

    const PGuserUsage = await generateTestUserData();

    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(moveInpage,'EVERSOURCE', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //check no email
    //add query to check if the user is added to the UtilityCredentials table
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    //No service confirmation email
    //check Account Status
  });


  test('TX DEREG New User', {tag: [ '@regression3'],}, async ({moveInpage, page}) => {
    test.setTimeout(300000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,'TX-DEREG', null, true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
    //check Account Status
  });



});

