import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
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
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.skip('Short Code Referal', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });



});


//Billing but Cancelled
test.describe.skip('Short Code Referal Canceled Registration', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page, supabaseQueries}) => {
    test.setTimeout(900000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, "DTE", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(MoveIn.pgUserEmail,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await finishAccountSetupPage.Click_Cancel_Registration();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.pgUserEmail,0);
    //No service confirmation email
    //check Account Status
  });




});



test.describe.skip('Non Short Code Referal', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression3'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(360000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "NYS-EG", null);
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "NYS-EG", null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});

