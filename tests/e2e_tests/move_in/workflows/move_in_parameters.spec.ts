import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In Parameter New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for DOMINION Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=DOMINION',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'DOMINION', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DOMINION", null);
  });


  test('New User for EVERGY Gas Only', {tag: [ '@smoke','@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=EVERGY',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'EVERGY', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "EVERGY");
  });


  test('New User for DELMARVA Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "DELMARVA", "DELMARVA", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DELMARVA", "DELMARVA");
  });


  test('New User for PGE PSEG Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "PGE", "PSEG", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PGE", "PSEG");
  });


});


test.describe('Move In Parameter & shortCode New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for ACE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest&electricCompany=ACE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'ACE', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "ACE", null);
  });


  test('New User for FPL Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest&gasCompany=FPL',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'FPL', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "FPL");
  });


  test('New User for XCEL-ENERGY Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest&electricCompany=XCEL-ENERGY&gasCompany=XCEL-ENERGY',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "XCEL-ENERGY", "XCEL-ENERGY", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "XCEL-ENERGY", "XCEL-ENERGY");
  });


  test('New User for PSEG-LI LA-DWP Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "COMED", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest&electricCompany=PSEG-LI&gasCompany=LA-DWP',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "PSEG-LI", "LA-DWP", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSEG-LI", "LA-DWP");
  });


});


test.describe('Move In Invalid Parameter New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In Invalid Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'COMED', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED", null);
  });


  test('Move In Invalid Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'COMED', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "COMED");
  });


  test('Move In Invalid Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, "SCE", true, true);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "SCE");
  });


  test('Move In Parameter Valid Electric and Invalid Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "SDGE", null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "SDGE", null);
  });


  test('Move In Parameter Inavalid Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "COSERV", null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COSERV", null);
  });


});



test.describe('Move In Parameter TX Dereg New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In TX Dereg Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'TX-DEREG', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('Move In TX Dereg Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'TX-DEREG', null, true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('Move In TX Dereg Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'TX-DEREG', "SCE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "SCE");
  });


  test('Move In Parameter Valid Electric and TX Dereg Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "SDGE", 'TX-DEREG', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "SDGE", null);
  });


  test('Move In Parameter TX Dereg Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'TX-DEREG', 'TX-DEREG', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, null);
  });


  test('Move In Parameter  Utility TX Dereg Address', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(180000);
    await page.goto('/move-in??electricCompany=PECO&gasCompany=PEPCO',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Fix_TX_DEREG_Address(moveInpage, "PECO", "PEPCO",true,true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PECO", "PEPCO");
  });


});