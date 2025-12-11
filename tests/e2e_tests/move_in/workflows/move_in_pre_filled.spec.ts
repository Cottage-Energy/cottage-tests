import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page, supabaseQueries },testInfo) => {
  await supabaseQueries.Update_Building_Billing("autotest",true);
  await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
  await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page, aiTestUtilities },testInfo) => {
  // AI-powered failure analysis for failed tests
  if (testInfo.status === 'failed' && process.env.ANTHROPIC_API_KEY) {
    console.log('\n🤖 AI is analyzing the test failure...');
    const errors = testInfo.errors;
    if (errors.length > 0) {
      const error = new Error(errors[0].message || 'Unknown error');
      error.stack = errors[0].stack;
      await aiTestUtilities.analyzeFailure(page, testInfo, error);
    }
  }
  
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

//address parameters only
//address paremeters with move-in params
test.describe('Move In Address Parameters Only New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  
  test('New User for CON-EDISON Service Zip Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(480000);
    await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page, 'CON-EDISON', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for POTOMAC-EDISON Nove-in Parameters for Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=POTOMAC-EDISON&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page,'POTOMAC-EDISON', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "POTOMAC-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for LA-DWP Nove-in Parameters for Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?gasCompany=LA-DWP&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page, null, 'LA-DWP', true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "LA-DWP");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for PSE Nove-in Parameters for Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=PSE&gasCompany=PSE&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page,'PSE', 'PSE', true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSE", 'PSE');
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


});

//guid only
//guid & address parameters
//guid with move-in params
test.describe('Move In GUID Only New User Electric &/or Gas', () => {
    test.describe.configure({mode: "serial"});
    
  
    test('New User for EVERSOURCE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
      test.setTimeout(480000);
      await page.goto(`/move-in?guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, 'EVERSOURCE', null, true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE", null);
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    });
  
  
    test('New User for CON-EDISON Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
      test.setTimeout(480000);
      await page.goto(`/move-in?streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page, null, 'CON-EDISON', true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "CON-EDISON");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    });
  
  
    test('New User for PSEG-LI Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
      test.setTimeout(480000);
      await page.goto(`/move-in?electricCompany=PSEG-LI&gasCompany=PSEG-LI&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, "PSEG-LI", "PSEG-LI", true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "PSEG-LI", "PSEG-LI");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    });  
  
});

//shortcode & guid
//shortcode & address parameters
//shortcode & address parameters & guid
//shortcode & move-in params & address parameters & guid
test.describe.fixme('Move In ShortCoded GUID & Address Parameters New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for BGE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_GUID_Flow(page, 'BGE', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, false, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for SDGE Gas Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null , "SDGE");
    
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_GUID_Flow(page, null, 'SDGE', true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, false, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, 'SDGE');
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for DTE BGE Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_Flow(page, "DTE", "BGE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, false);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DTE", "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for XCEL-ENERGY Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "XCEL-ENERGY", "XCEL-ENERGY");
    
    await page.goto(`/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_And_GUID_Flow(page, "XCEL-ENERGY", "XCEL-ENERGY", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "XCEL-ENERGY", "XCEL-ENERGY");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });


  test('New User for Duke Electric & Gas', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries, planeActions}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    
    await page.goto(`/move-in?shortCode=autotest&electricCompany=DUKE&gasCompany=DUKE&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Address_Parameter_And_GUID_Flow(page, "DUKE", "DUKE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await planeActions.CheckMoveInTickets(MoveIn.PGUserEmail, true, true, true);
    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "DUKE", "DUKE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
  });  

});