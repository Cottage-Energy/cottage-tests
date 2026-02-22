import { test, expect } from '../../../resources/page_objects';
import { moveInExistingUtilityAccount, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { utilityQueries, userQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  //disable utility verification flag
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial", retries: 0});
test.describe('Move In Existing Utility Account', () => {


  test('Move-in New User Existing Utility Account Requested', {tag: ['@regression1'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, true);
    
    await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await userQueries.checkWaitlist(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in New User Existing Utility Account Skip', {tag: ['@regression2'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, false);
    
    await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await userQueries.checkWaitlistNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Requested', {tag: ['@regression3'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "PSEG", "PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, true);
    
    await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await userQueries.checkWaitlist(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Skip', {tag: ['@regression4'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "CON-EDISON", "NYS-EG" );
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, false);
    
    await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await userQueries.checkWaitlistNotPresent(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
  });



});



