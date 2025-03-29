import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
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
  

  test('New User for DOMINION Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=DOMINION',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, 'DOMINION', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DOMINION", null);
  });


  test('New User for EVERGY Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=EVERGY',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'EVERGY', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "EVERGY");
  });


  test('New User for DELMARVA Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage, page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, "DELMARVA", "DELMARVA", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DELMARVA", "DELMARVA");
  });


  test('New User for PGE PSEG Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, "PGE", "PSEG", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PGE", "PSEG");
  });


});


test.describe('Move In Invalid Parameter New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In Invalid Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, 'COMED', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED", null);
  });


  test('Move In Invalid Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'COMED', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "COMED");
  });


  test('Move In Invalid Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage, page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, null, "SCE", true, true);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "SCE");
  });


  test('Move In Parameter Valid Electric and Invalid Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In_Auto_Payment_Added(moveInpage, "SDGE", null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "SDGE", null);
  });


  test('Move In Parameter Inavalid Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=XXX&gasCompany=XXX',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COSERV_New_User_Move_In(moveInpage, "COSERV", null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COSERV", null);
  });


});



test.describe('Move In Parameter TX Dereg New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('Move In TX Dereg Parameter Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.TX_DEREG_New_User_Move_In(moveInpage, 'TX-DEREG', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('Move In TX Dereg Parameter Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.TX_DEREG_New_User_Move_In(moveInpage, 'TX-DEREG', null, true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber);
  });


  test('Move In TX Dereg Parameter Electric and Valid Gas Company', {tag: ['@regression7'],}, async ({moveInpage, page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=SCE',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.TX_DEREG_New_User_Move_In(moveInpage, 'TX-DEREG', "SCE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "SCE");
  });


  test('Move In Parameter Valid Electric and TX Dereg Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=SDGE&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.TX_DEREG_New_User_Move_In(moveInpage, "SDGE", 'TX-DEREG', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "SDGE", null);
  });


  test('Move In Parameter TX Dereg Electric and Gas Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
    test.setTimeout(600000);
    await page.goto('/move-in?electricCompany=TX-DEREG&gasCompany=TX-DEREG',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.TX_DEREG_New_User_Move_In(moveInpage, 'TX-DEREG', 'TX-DEREG', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, null);
  });


    test('Move In Parameter  Utility TX Dereg Address', {tag: [ '@regression1'],}, async ({moveInpage,page}) => {
      test.setTimeout(180000);
      await page.goto('/move-in??electricCompany=PECO&gasCompany=PEPCO',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_TX_Address(moveInpage, "PECO", "PEPCO",true,true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PECO", "PEPCO");
    });


});