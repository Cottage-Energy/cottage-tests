import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInSkipPayment, newUserMoveInAutoBankAccount, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { utilityQueries, accountQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';

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
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Short Code Billing New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@smoke','@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "BGE", null);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'BGE', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", null, "NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, 'NGMA', true, true);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, null, "NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "BGE", "BGE");
    
    await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
    await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", "BGE", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "BGE", "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas EVERSOURCE Same Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "EVERSOURCE", "EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "EVERSOURCE", "EVERSOURCE", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "EVERSOURCE", "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas NGMA Same Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "NGMA", "NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "NGMA", "NGMA", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "NGMA", "NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "BGE", "CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "BGE", "CON-EDISON", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "BGE", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});



test.describe('Short Code TX Dereg/ Coserv New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ShortCode Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COSERV", null);
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "COSERV", null,true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for ShortCode Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COSERV", "COSERV");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "COSERV", "COSERV",true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });

});

