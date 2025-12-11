import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../../resources/data/payment-data.json';

let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page, aiTestUtilities },testInfo) => {
  // AI-powered failure analysis for failed tests
  if (testInfo.status === 'failed' && process.env.ANTHROPIC_API_KEY) {
    console.log('\n🤖 AI is analyzing the test failure...');
    const errors = testInfo.errors;
    if (errors.length > 0) {
      const error = new Error(errors[0].message || 'Unknown error');
      error.stack = errors[0].stack;
      await aiTestUtilities.analyzeFailure(page, testInfo, error);
    }
  }
  
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial"});
test.describe('Move In New Service Zip User', () => {


  test('COMED New User', {tag: ['@regression1'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,'COMED', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_isRegistrationComplete(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test.fixme('COSERV New User', {tag: ['@regression1'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    //to be fix Coserv service zip is now covered by light
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, 'COSERV', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COSERV");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Add Auto Payment', {tag: [ '@regression2'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, 'CON-EDISON', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('EVERSOURCE New User Add Auto Payment', {tag: [ '@regression3'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,'EVERSOURCE', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Add Manual Payment', {tag: [ '@regression4'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(page, 'CON-EDISON', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('EVERSOURCE New User Add Manual Payment', {tag: [ '@regression5'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(page, 'EVERSOURCE', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Skip Add Payment', {tag: [ '@smoke','@regression1'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries, planeActions, page}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page, 'CON-EDISON', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, "PENDING", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('EVERSOURCE New User Skip Add Payment', {tag: [ '@regression7'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries, planeActions, page}) => {

    const PGuserUsage = await generateTestUserData();

    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page, 'EVERSOURCE', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //check no email
    //add query to check if the user is added to the UtilityCredentials table
    //finish setup paymment
    await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, "PENDING", "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Skip And Cancel Registration', {tag: [ '@regression1'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries, planeActions, page}) => {
    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,'CON-EDISON', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail); 
    //check Account Status
  });


  test('EVERSOURCE New User Skip And Cancel Registration', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries, planeActions, page}) => {

    const PGuserUsage = await generateTestUserData();

    test.setTimeout(600000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Skip_Payment(page,'EVERSOURCE', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.PGUserEmail);
    await page.goto('/sign-in');
    //check no email
    //add query to check if the user is added to the UtilityCredentials table
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, false, false);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail);
    //check Account Status
  });


  test('TX DEREG New User', {tag: [ '@regression3'],}, async ({moveInpage, page, supabaseQueries, planeActions}) => {
    test.setTimeout(300000);
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,'TX-DEREG', null, true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(30000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    //check Account Status
  });



});

