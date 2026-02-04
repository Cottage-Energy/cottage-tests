import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, newUserMoveInAutoBankAccount, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page, supabaseQueries },testInfo) => {
  await supabaseQueries.Update_Building_Billing("autotest",true);
  await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
  await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Short Code Billing New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@smoke','@regression2'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'BGE', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, 'NGMA', true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "BGE");
    
    await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
    await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", "BGE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas EVERSOURCE Same Company', {tag: ['@regression7'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "EVERSOURCE", "EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "EVERSOURCE", "EVERSOURCE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "EVERSOURCE", "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas NGMA Same Company', {tag: ['@regression7'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NGMA", "NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "NGMA", "NGMA", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "NGMA", "NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(600000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", "CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", "CON-EDISON", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});


//Billing but Cancelled
test.describe('Short Code Billing Canceled Registration', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression5'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page,  supabaseQueries}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, "DTE", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('New User for ShortCode Gas Only', {tag: [ '@regression4'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page,  supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null, "PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, null, "PSEG", true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('New User for ShortCode Electric and Gas Same Company', {tag: ['@regression3'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page,  supabaseQueries}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", "DTE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, "DTE", "DTE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('New User for ShortCode Electric and Gas Different Company', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page,  supabaseQueries}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, "PSEG", "CON-EDISON", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Check_Inactive_Account_Alert_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });
  

});



test.describe('Short Code TX Dereg/ Coserv New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COSERV", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "COSERV", null,true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COSERV", "COSERV");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "COSERV", "COSERV",true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User Shortcoded Utility TX Dereg Address', {tag: [ '@regression1'],}, async ({moveInpage,page,  supabaseQueries}) => {
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "DTE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "PSEG", "DTE",true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test.fixme('(TBD to Light)New User for TX Dereg Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page,  supabaseQueries}) => {
    //convert to light
    test.setTimeout(180000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "TX-DEREG", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoBankAccount(page, "TX-DEREG", null,true,true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});

