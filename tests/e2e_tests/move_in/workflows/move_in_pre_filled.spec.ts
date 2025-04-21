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

//address parameters only
//address paremeters with move-in params
test.describe('Move In Address Parameters New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for CON-EDISON Service Zip Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, 'CON-EDISON', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
  });


  test('New User for POTOMAC-EDISON Nove-in Parameters for Electric Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=POTOMAC-EDISON&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage,'POTOMAC-EDISON', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "POTOMAC-EDISON", null);
  });


  test('New User for LA-DWP Nove-in Parameters for Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=LA-DWP&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, null, 'LA-DWP', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "LA-DWP");
  });


  test('New User for PSE Nove-in Parameters for Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=PSE&gasCompany=PSE&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage,'PSE', 'PSE', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSE", 'PSE');
  });




});

//guid only
//guid & address parameters
//guid with move-in params
test.describe('Move In GUID New User Electric &/or Gas', () => {
    test.describe.configure({mode: "serial"});
    
  
    test('New User for DOMINION Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page}) => {
      test.setTimeout(240000);
      await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'DOMINION', null, true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DOMINION", null);
    });
  
  
    test('New User for EVERGY Gas Only', {tag: [ '@regression1'],}, async ({moveInpage, page}) => { // Use BGE and NGMA
      test.setTimeout(240000);
      await page.goto('/move-in?gasCompany=EVERGY',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'EVERGY', true, true);
      await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "EVERGY");
    });
  
  
    test('New User for DELMARVA Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage, page}) => {
      test.setTimeout(240000);
      await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "DELMARVA", "DELMARVA", true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DELMARVA", "DELMARVA");
    });
  
  
    test('New User for PGE PSEG Electric and Gas Different Company', {tag: [ '@regression6'],}, async ({moveInpage,page}) => {
      test.setTimeout(600000);
      await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "PGE", "PSEG", true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,2);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PGE", "PSEG");
    });
  
  
});

//shortcode & guid
//shortcode & address parameters
//shortcode & guid & address parameters
