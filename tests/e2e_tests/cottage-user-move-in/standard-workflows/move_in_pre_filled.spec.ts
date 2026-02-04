import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInAddressParameter, newUserMoveInGuidFlow, newUserMoveInAddressParameterAndGuid, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as MoveIndata from '../../../resources/data/move_in-data.json';

let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page, supabaseQueries },testInfo) => {
  await supabaseQueries.Update_Building_Billing("autotest",true);
  await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
  await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
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
test.describe('Move In Address Parameters Only New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  
  test('New User for CON-EDISON Service Zip Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await page.goto('/move-in?streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, 'CON-EDISON', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for POTOMAC-EDISON Nove-in Parameters for Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=POTOMAC-EDISON&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page,'POTOMAC-EDISON', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "POTOMAC-EDISON", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for LA-DWP Nove-in Parameters for Gas Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?gasCompany=LA-DWP&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, null, 'LA-DWP', true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "LA-DWP");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for PSE Nove-in Parameters for Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await page.goto('/move-in?electricCompany=PSE&gasCompany=PSE&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page,'PSE', 'PSE', true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "PSE", 'PSE');
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


});

//guid only
//guid & address parameters
//guid with move-in params
test.describe('Move In GUID Only New User Electric &/or Gas', () => {
    test.describe.configure({mode: "serial"});
    
  
    test('New User for EVERSOURCE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries}) => {
      test.setTimeout(480000);
      await page.goto(`/move-in?guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'EVERSOURCE', null, true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
  
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "EVERSOURCE", null);
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    });
  
  
    test('New User for CON-EDISON Electric Only', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
      test.setTimeout(480000);
      await page.goto(`/move-in?streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAddressParameter(page, null, 'CON-EDISON', true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
  
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, "CON-EDISON");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    });
  
  
    test('New User for PSEG-LI Electric and Gas Same Company', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries}) => {
      test.setTimeout(480000);
      await page.goto(`/move-in?electricCompany=PSEG-LI&gasCompany=PSEG-LI&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, "PSEG-LI", "PSEG-LI", true, true);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
  
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "PSEG-LI", "PSEG-LI");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
    });  
  
});

//shortcode & guid
//shortcode & address parameters
//shortcode & address parameters & guid
//shortcode & move-in params & address parameters & guid
test.describe.fixme('Move In ShortCoded GUID & Address Parameters New User Electric &/or Gas', () => {
  test.describe.configure({mode: "serial"});
  

  test('New User for BGE Electric Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInGuidFlow(page, 'BGE', null, true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "BGE", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for SDGE Gas Only', {tag: [ '@regression2'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", null , "SDGE");
    
    await page.goto(`/move-in?shortCode=autotest&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInGuidFlow(page, null, 'SDGE', true, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, null, 'SDGE');
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for DTE BGE Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "DTE", "BGE");
    
    await page.goto('/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234',{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameter(page, "DTE", "BGE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "DTE", "BGE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for XCEL-ENERGY Electric & Gas', {tag: [ '@regression1'],}, async ({moveInpage,page, supabaseQueries}) => { // Use BGE and NGMA
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "XCEL-ENERGY", "XCEL-ENERGY");
    
    await page.goto(`/move-in?shortCode=autotest&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID1}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameterAndGuid(page, "XCEL-ENERGY", "XCEL-ENERGY", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "XCEL-ENERGY", "XCEL-ENERGY");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });


  test('New User for Duke Electric & Gas', {tag: ['@regression7'],}, async ({moveInpage,page, supabaseQueries}) => {
    test.setTimeout(480000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "BGE", null);
    
    await page.goto(`/move-in?shortCode=autotest&electricCompany=DUKE&gasCompany=DUKE&streetAddress=123+williams&city=New+York&zip=1234&guid=${MoveIndata.GUID2}`,{ waitUntil: 'domcontentloaded' });
    MoveIn = await newUserMoveInAddressParameterAndGuid(page, "DUKE", "DUKE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(MoveIn.pgUserEmail, MoveIn.accountNumber, "DUKE", "DUKE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.pgUserEmail);
  });  

});

