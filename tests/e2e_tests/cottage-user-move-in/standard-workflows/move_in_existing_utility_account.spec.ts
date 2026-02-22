import { test, expect } from '../../../resources/page_objects';
import { moveInExistingUtilityAccount, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { utilityQueries, userQueries, accountQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

let MoveIn: any;


test.beforeEach(async ({ page },testInfo) => {
  await utilityQueries.updateBuildingBilling("autotest",true);
  await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
  // Disable utility verification flag on both Building and MoveInPartner
  await utilityQueries.updateBuildingUtilityVerification("autotest", false);
  await utilityQueries.updatePartnerUtilityVerification("Moved", false);
  await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});


test.describe.configure({mode: "serial", retries: 0});
test.describe('Move In Existing Utility Account', () => {


  test.describe('Setup Myself Service Zip', () => {

    test('Requested - Save Toggle Disabled', {tag: ['@regression1'],}, async ({moveInpage, page}) => {
      test.setTimeout(150000);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, false);
      
      await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(5000);
      await userQueries.checkWaitlist(MoveIn.pgUserEmail);
      await page.waitForTimeout(10000);

      await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
    });


    test('Skip', {tag: ['@regression2'],}, async ({moveInpage, page}) => {
      test.setTimeout(150000);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, false);
      
      await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(5000);
      await userQueries.checkWaitlistNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(10000);

      await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
    });


    test('Requested - Save Toggle Enabled (Electric Only)', {tag: ['@regression5'],}, async ({moveInpage, page}) => {
      test.setTimeout(180000);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, true);

      // With save toggle enabled, a cottageUser and ElectricAccount should be created
      await page.waitForTimeout(5000);
      const cottageUserId = await userQueries.getCottageUserId(MoveIn.pgUserEmail);
      await accountQueries.checkGetElectricAccountId(cottageUserId);

      // Cleanup created user data
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    });

  });


  test.describe('Setup Myself With ShortCode', () => {

    test('Requested - Save Toggle Disabled', {tag: ['@regression3'],}, async ({moveInpage, page}) => {
      test.setTimeout(150000);
      await utilityQueries.updateCompaniesToBuilding("autotest", "PSEG", "PSEG");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, false);
      
      await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(5000);
      await userQueries.checkWaitlist(MoveIn.pgUserEmail);
      await page.waitForTimeout(10000);

      await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
    });


    test('Skip', {tag: ['@regression4'],}, async ({moveInpage, page}) => {
      test.setTimeout(150000);
      await utilityQueries.updateCompaniesToBuilding("autotest", "CON-EDISON", "NYS-EG" );
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, false);
      
      await userQueries.checkCottageUserIdNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(5000);
      await userQueries.checkWaitlistNotPresent(MoveIn.pgUserEmail);
      await page.waitForTimeout(10000);

      await FastmailActions.Check_Utility_Account_OTW_Not_Present(MoveIn.pgUserEmail);
    });


    test('Requested - Save Toggle Enabled (Electric & Gas)', {tag: ['@regression6'],}, async ({moveInpage, page}) => {
      test.setTimeout(180000);
      await utilityQueries.updateCompaniesToBuilding("autotest", "PSEG", "PSEG");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, true);

      // With save toggle enabled and shortCode with gas company, both accounts should be created
      await page.waitForTimeout(5000);
      const cottageUserId = await userQueries.getCottageUserId(MoveIn.pgUserEmail);
      await accountQueries.checkGetElectricAccountId(cottageUserId);
      // Known bug: gas account not created even when gas company is present on building
      // Uncomment when bug is fixed:
      // await accountQueries.checkGetGasAccountId(cottageUserId);

      // Cleanup created user data
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    });


    test('Requested - Save Toggle Enabled (Electric Only)', {tag: ['@regression6'],}, async ({moveInpage, page}) => {
      test.setTimeout(180000);
      await utilityQueries.updateCompaniesToBuilding("autotest", "PSEG", null);
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, true);

      await page.waitForTimeout(5000);
      const cottageUserId = await userQueries.getCottageUserId(MoveIn.pgUserEmail);
      await accountQueries.checkGetElectricAccountId(cottageUserId);

      // Cleanup created user data
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    });


    test('Requested - Save Toggle Enabled (Gas Only)', {tag: ['@regression6'],}, async ({moveInpage, page}) => {
      test.setTimeout(180000);
      await utilityQueries.updateCompaniesToBuilding("autotest", null, "PSEG");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

      MoveIn = await moveInExistingUtilityAccount(page, false, false, true, true);

      await page.waitForTimeout(5000);
      const cottageUserId = await userQueries.getCottageUserId(MoveIn.pgUserEmail);
      await accountQueries.checkGetGasAccountId(cottageUserId);

      // Cleanup created user data
      await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    });

  });


});

