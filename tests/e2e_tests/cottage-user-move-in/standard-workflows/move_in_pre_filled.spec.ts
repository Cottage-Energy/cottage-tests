import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInAddressParameter, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { utilityQueries, accountQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as MoveIndata from '../../../resources/data/move_in-data.json';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  // await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

//address parameters only
//address paremeters with move-in params
//adddress parameter with short code
test.describe('Move In Address Parameters Only New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  
  test('New User for CON-EDISON Service Zip Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, 'CON-EDISON', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "CON-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for POTOMAC-EDISON Nove-in Parameters for Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=POTOMAC-EDISON&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page,'POTOMAC-EDISON', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "POTOMAC-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for LA-DWP Nove-in Parameters for Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?gasCompany=LA-DWP&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, null, 'LA-DWP', true, true);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, null, "LA-DWP");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for PSE Nove-in Parameters for Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=PSE&gasCompany=PSE&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page,'PSE', 'PSE', true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "PSE", 'PSE');
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for DTE BGE Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(480000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "DTE", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, "DTE", "BGE", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW(MoveIn.pgUserEmail, "DTE", "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});


