import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
//import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';

//const supabaseQueries = new SupabaseQueries();
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


test.describe.skip('Move In Existing User: Cottageuser & ElectricAccount Exist', () => {
  test.describe.configure({mode: "serial"});
  
    test('COMED Cottageuser & ElectricAccount Exist', {tag: [ '@regression1'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"COMED","COMED", true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Setup_Account(true, true);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(10000);
        await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED", null);
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('Eversource Cottageuser & ElectricAccount Exist', {tag: ['@regression2'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"EVERSOURCE","EVERSOURCE", true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Setup_Account(true, true);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(10000);
        await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE", null);
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('CON EDISON Cottageuser & ElectricAccount Exist', {tag: [ '@regression3'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage,"CON-EDISON","CON-EDISON", true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Setup_Account(true, true);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Read_ESCO_Conditions();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(10000);
        await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
      } else {
          throw new Error('Invalid OTP');
      }
    });


});


test.describe.skip('Move In Existing User: Cottageuser, ElectricAccount & GasAccount Exist', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser, Electric & Gas Account Exist', {tag: ['@regression4'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"COMED","COMED", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "COMED", "COMED");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser, Electric & Gas Account Exist', {tag: [ '@regression5'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"EVERSOURCE","EVERSOURCE", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE", "EVERSOURCE");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser, Electric & Gas Account Exist', {tag: [ '@regression6'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage,"CON-EDISON","CON-EDISON", true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", "CON-EDISON");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe.skip('Move In Existing User: Cottageuser & GasAccount Exist', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser & Gas Account Exist', {tag: [ '@regression7'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"COMED","COMED", false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "COMED");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);

    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser & Gas Account Exist', {tag: [ '@regression1'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage,"EVERSOURCE","EVERSOURCE", false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "EVERSOURCE");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser & Gas Account Exist', {tag: [ '@regression2'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(moveInpage,"CON-EDISON","CON-EDISON", false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Start_New_Move_In_Request();
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(10000);
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "CON-EDISON");
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(MoveIn.PGUserEmail);
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe.skip('Move In Existing User: Cottageuser Exist Only Early Drop Off', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser Exist Only', {tag: [ '@regression3'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();

    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    //const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    //await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);

    //check if the user will be able to login - suppose to be not
 
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + AltPGuser.FirstName,AltPGuser.LastName,AltPGuser.PhoneNumber,PGuser.Email,AltPGuser.Today);
    await moveInpage.Next_Move_In_Button();
    /*await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }*/

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, 'COMED', null);
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email); // currently analyzing

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility();
    if (PaymentPageVisibility === true) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "COMED", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('COMED EVERSOURCE Cottageuser Exist Only', {tag: [ '@regression4'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, false);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    //const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    //await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    //await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);

    //check if the user will be able to login - suppose to be not a directed move-in again

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, false);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + AltPGuser.FirstName,AltPGuser.LastName,AltPGuser.PhoneNumber,PGuser.Email,AltPGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.Check_Email_Registered_Message();
    /*const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }*/

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"COMED","EVERSOURCE");
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);


    await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "COMED", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE EVERSOURCE Cottageuser Exist Only', {tag: [ '@regression5'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    //const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    //await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    //await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);

    //check if the user will be able to login - suppose to be not a directed move-in again
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + AltPGuser.FirstName,AltPGuser.LastName,AltPGuser.PhoneNumber,PGuser.Email,AltPGuser.Today);
    await moveInpage.Next_Move_In_Button();
    /*await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }*/

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);

    await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, null, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE CON-EDISON Cottageuser Exist Only', {tag: ['@regression6'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    //const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    //await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    //await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);

    //check if the user will be able to login - suppose to be not a directed move-in again

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,AltPGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + AltPGuser.FirstName,AltPGuser.LastName,AltPGuser.PhoneNumber,PGuser.Email,AltPGuser.Today);
    await moveInpage.Next_Move_In_Button();
    /*await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }*/

    await moveInpage.CON_EDISON_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);

    await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(30000);
    //await linearActions.CountMoveInTicket(PGuser.Email,2);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "EVERSOURCE", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });

});


test.describe.skip('Move In Existing User: Cottageuser Exist Only Late Drop Off', () => {
  test.describe.configure({mode: "serial"});
    
  test('EVERSOURCE Cottageuser Exist Only', {tag: [ '@regression7'],}, async ({page, moveInpage, supabaseQueries, finishAccountSetupPage, overviewPage}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility();
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('NGMA CON-EDISON Cottageuser Exist Only', {tag: [ '@regression1'],}, async ({page, moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","NGMA","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, false);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_EDISON_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);

    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility();
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", "NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('PSEG PSEG Cottageuser Exist Only', {tag: [ '@regression2'],}, async ({page, moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","PSEG","PSEG");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);

 
    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility();
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(PGuser.Email, `PGtest ${PGuser.FirstName}`);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", "PSEG");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE DTE Cottageuser Exist Only', {tag: ['@regression3'],}, async ({page, moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","DTE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"EVERSOURCE","DTE");
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);

    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility();
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);
    //await linearActions.CountMoveInTicket(PGuser.Email,0);
    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(PGuser.Email, `PGtest ${PGuser.FirstName}`);
    await overviewPage.Accept_New_Terms_And_Conditions();
    await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);
    //await linearActions.CountMoveInTicket(PGuser.Email,2);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "EVERSOURCE", "DTE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });



});
