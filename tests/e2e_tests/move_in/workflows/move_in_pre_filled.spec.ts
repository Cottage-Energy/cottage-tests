import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
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

//address parameters only
//address paremeters with move-in params
test.describe('Move In Address Parameters Only New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  
  test('New User for CON-EDISON Service Zip Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, 'CON-EDISON', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
  });


  test('New User for POTOMAC-EDISON Nove-in Parameters for Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=POTOMAC-EDISON&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage,'POTOMAC-EDISON', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "POTOMAC-EDISON", null);
  });


  test('New User for LA-DWP Nove-in Parameters for Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?gasCompany=LA-DWP&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, null, 'LA-DWP', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "LA-DWP");
  });


  test('New User for PSE Nove-in Parameters for Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await page.goto('/move-in?electricCompany=PSE&gasCompany=PSE&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage,'PSE', 'PSE', true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSE", 'PSE');
  });


});

//guid only
//guid & address parameters
//guid with move-in params
test.describe('Move In GUID Only New User Electric &/or Gas', () => {
    test.describe.configure({mode: "serial"});
    
  
    test('New User for EVERSOURCE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
      test.setTimeout(240000);
      await page.goto(`/move-in?guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'EVERSOURCE', null, true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE", null);
    });
  
  
    test('New User for CON-EDISON Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
      test.setTimeout(240000);
      await page.goto(`/move-in?streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, null, 'CON-EDISON', true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "CON-EDISON");
    });
  
  
    test('New User for PSEG-LI Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
      test.setTimeout(240000);
      await page.goto(`/move-in?electricCompany=PSEG-LI&gasCompany=PSEG-LI&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, "PSEG-LI", "PSEG-LI", true, true);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSEG-LI", "PSEG-LI");
    });  
  
});

//shortcode & guid
//shortcode & address parameters
//shortcode & address parameters & guid
//shortcode & move-in params & address parameters & guid
test.describe('Move In ShortCoded GUID & Address Parameters New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for BGE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_GUID_Flow(moveInpage, 'BGE', null, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", null);
  });


  test('New User for SDGE Gas Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null , "SDGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_GUID_Flow(moveInpage, null, 'SDGE', true, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, 'SDGE');
  });


  test('New User for DTE BGE Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", "BGE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(moveInpage, "DTE", "BGE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DTE", "BGE");
  });


  test('New User for XCEL-ENERGY Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "XCEL-ENERGY", "XCEL-ENERGY");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto(`/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_And_GUID_Flow(moveInpage, "XCEL-ENERGY", "XCEL-ENERGY", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "XCEL-ENERGY", "XCEL-ENERGY");
  });


  test('New User for Duke Electric & Gas', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(240000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto(`/move-in?shortCode=autotest&electricCompany=DUKE&gasCompany=DUKE&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_And_GUID_Flow(moveInpage, "DUKE", "DUKE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DUKE", "DUKE");
  });  

});