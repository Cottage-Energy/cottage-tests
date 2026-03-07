import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInManualPayment, newUserMoveInSkipPayment, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { accountQueries, userQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial"});
test.describe('Move In New Service Zip User', () => {


  test('COMED New User', { tag: TEST_TAGS.REGRESSION1 }, async ({moveInpage, page}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    MoveIn = await newUserMoveInAutoPayment(page,'COMED', null, true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "COMED");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Add Auto Payment', { tag: TEST_TAGS.REGRESSION2 }, async ({moveInpage, page}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    MoveIn = await newUserMoveInAutoPayment(page, 'CON-EDISON', null, true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('EVERSOURCE New User Add Manual Payment', {tag: [ '@regression5'],}, async ({moveInpage, page}) => {
    test.setTimeout(600000);
    MoveIn = await newUserMoveInManualPayment(page, 'EVERSOURCE', null, true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    //add query to check if the user is added to the UtilityCredentials table
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });


  test('CON-EDISON New User Skip Add Payment', {tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION1],}, async ({moveInpage, overviewPage, page}) => {
    test.setTimeout(TIMEOUTS.TEST);
    MoveIn = await newUserMoveInSkipPayment(page, 'CON-EDISON', null, true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(TIMEOUTS.EXTRA_LONG);

    await FastmailActions.Check_Quick_Reminder_Add_Your_Payment_Method(MoveIn.pgUserEmail);
    await page.goto('/sign-in');
    // TODO: New post-sign-in payment flow — finishAccountSetupPage removed
    // After sign-in, user is prompted to add payment method inline
    // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.pgUserEmail, MoveIn.pgUserName);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test.fixme('TX DEREG New User', {tag: [ '@regression3'],}, async ({moveInpage, page}) => {
    test.setTimeout(300000);
    MoveIn = await newUserMoveInAutoPayment(page,'TX-DEREG', null, true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(30000);

    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    await page.waitForTimeout(10000);
    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    //check Account Status
  });



});



