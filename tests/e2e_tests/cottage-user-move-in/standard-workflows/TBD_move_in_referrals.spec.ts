import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import { utilityQueries, accountQueries } from '../../../resources/fixtures/database';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
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
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "BGE", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });



});


//Billing but Cancelled
test.describe.skip('Short Code Referal Canceled Registration', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression2'],}, async ({moveInpage, overviewPage, finishAccountSetupPage, page}) => {
    test.setTimeout(900000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "DTE", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInSkipPayment(page, "DTE", null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
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
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression3'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "NYS-EG", null);
    await utilityQueries.updateBuildingBilling("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "NYS-EG", null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});

