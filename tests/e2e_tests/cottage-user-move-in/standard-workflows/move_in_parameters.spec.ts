import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
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


test.describe('Move In Parameter New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for DOMINION Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=DOMINION',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'DOMINION', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "DOMINION", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for EVERGY Gas Only', {tag: [ '@smoke','@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(360000);
    await page.goto('/move-in?gasCompany=EVERGY',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, 'EVERGY', true, true);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "EVERGY");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for DELMARVA Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "DELMARVA", "DELMARVA", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "DELMARVA", "DELMARVA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail); 
  });


  test('New User for PGE PSEG Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "PGE", "PSEG", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "PGE", "PSEG");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});


test.describe('Move In Parameter & shortCode New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ACE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&electricCompany=ACE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'ACE', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "ACE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for FPL Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(360000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&gasCompany=FPL',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, 'FPL', true, true);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "FPL");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for XCEL-ENERGY Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&electricCompany=XCEL-ENERGY&gasCompany=XCEL-ENERGY',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "XCEL-ENERGY", "XCEL-ENERGY", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "XCEL-ENERGY", "XCEL-ENERGY");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for PSEG-LI LA-DWP Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await utilityQueries.updateCompaniesToBuilding("autotest", "COMED", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&electricCompany=PSEG-LI&gasCompany=LA-DWP',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "PSEG-LI", "LA-DWP", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "PSEG-LI", "LA-DWP");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});


test.describe('Move In Invalid Parameter New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In Invalid Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'COMED', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "COMED", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Invalid Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE address (COMED/IL no longer in service area)
    test.setTimeout(360000);
    await page.goto('/move-in?gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, 'BGE', true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Invalid Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, null, "SCE", true, true);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "SCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Parameter Valid Electric and Invalid Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "SDGE", null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "SDGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Parameter Inavalid Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "COSERV", null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "COSERV", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});



test.describe('Move In Parameter TX Dereg New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In TX Dereg Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'TX-DEREG', null, true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGasAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In TX Dereg Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page}) => { // Use BGE and NGMA
    test.setTimeout(360000);
    await page.goto('/move-in?gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'TX-DEREG', null, true, true);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await accountQueries.checkElectricAccountIdNotPresent(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In TX Dereg Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'TX-DEREG', "SCE", true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "SCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Parameter Valid Electric and TX Dereg Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "SDGE", 'TX-DEREG', true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "SDGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Parameter TX Dereg Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, 'TX-DEREG', 'TX-DEREG', true, true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('Move In Parameter  Utility TX Dereg Address', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
    test.setTimeout(360000);
    await page.goto('/move-in??electricCompany=PECO&gasCompany=PEPCO',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAutoPayment(page, "PECO", "PEPCO",true,true);
    await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
    await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "PECO", "PEPCO");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});

