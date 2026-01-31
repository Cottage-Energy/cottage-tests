import { test,expect } from '../../../resources/page_objects/base/pg_page_base';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';
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

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In Existing User: Cottageuser & ElectricAccount Exist', () => {
  test.describe.configure({mode: "serial"});
  
    test('COMED Cottageuser & ElectricAccount Exist', {tag: [ '@regression1'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(450000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"COMED","COMED", true, false);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);

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
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('Eversource Cottageuser & ElectricAccount Exist', {tag: ['@regression2'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(450000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page, "EVERSOURCE","EVERSOURCE" ,true, false);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);

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
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('CON EDISON Cottageuser & ElectricAccount Exist', {tag: [ '@regression3'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
      test.setTimeout(450000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(page,"CON-EDISON","CON-EDISON", true, false);
      await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);

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
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
      } else {
          throw new Error('Invalid OTP');
      }
    });


});


test.describe('Move In Existing User: Cottageuser, ElectricAccount & GasAccount Exist', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser, Electric & Gas Account Exist', {tag: ['@smoke','@regression4'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"COMED","COMED", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser, Electric & Gas Account Exist', {tag: [ '@regression5'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"EVERSOURCE","EVERSOURCE", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser, Electric & Gas Account Exist', {tag: [ '@regression6'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(page,"CON-EDISON","CON-EDISON", true, true);
    await supabaseQueries.Check_Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe('Move In Existing User: Cottageuser & GasAccount Exist', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser & Gas Account Exist', {tag: [ '@regression7'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"COMED","COMED", false, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);

    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser & Gas Account Exist', {tag: [ '@regression1'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(page,"EVERSOURCE","EVERSOURCE", false, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser & Gas Account Exist', {tag: [ '@regression2'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.New_User_Move_In_Manual_Payment_Added(page,"CON-EDISON","CON-EDISON", false, true);
    await supabaseQueries.Check_Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);

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
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe('Move In Existing User: Cottageuser Exist Only Early Drop Off', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser Exist Only', {tag: [ '@regression3'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

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
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(PGuser.Email);

    //check if the user will be able to login - suppose to be not
 
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await page.waitForLoadState("networkidle");
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
   
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, 'COMED', null);
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email); // currently analyzing

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility('COMED', null);

    if (PaymentPageVisibility === true && PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && !PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "COMED", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE Cottageuser Exist Only', {tag: [ '@regression4'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again
    await page.goto('/move-in?gasCompany=EVERSOURCE',{ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
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
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, null,"EVERSOURCE");
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(null,"EVERSOURCE");

    if (PaymentPageVisibility === true && PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && !PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, null, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE EVERSOURCE Cottageuser Exist Only', {tag: [ '@regression5'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    
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
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
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
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"EVERSOURCE","EVERSOURCE");
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility("EVERSOURCE","EVERSOURCE");

    if (PaymentPageVisibility === true && PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && !PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
 
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, null, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE CON-EDISON Cottageuser Exist Only', {tag: ['@regression6'],}, async ({page, moveInpage, servicesPage, supabaseQueries}) => {
    test.setTimeout(450000);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","CON-EDISON");
    
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
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
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
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.CON_EDISON_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"EVERSOURCE","CON-EDISON");
    await moveInpage.Next_Move_In_Button();

    await page.waitForTimeout(10000);
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility("EVERSOURCE","CON-EDISON");

    if (PaymentPageVisibility === true && PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && !PayThroughPG) {
      await moveInpage.Enter_Card_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
      await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(30000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "EVERSOURCE", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });

});


test.describe('Move In Existing User: Cottageuser Exist Only Late Drop Off', () => {
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
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility('EVERSOURCE', null);
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('NGMA Cottageuser Exist Only', {tag: [ '@regression1'],}, async ({page, moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest",null,"NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);

    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility(null,"NGMA");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", null,"NGMA");
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
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"PSEG","PSEG");
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);

 
    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility("PSEG","PSEG");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(PGuser.Email, `PGtest ${PGuser.FirstName}`);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "PENDING", "PSEG");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE DTE Cottageuser Exist Only', {tag: ['@smoke','@regression3'],}, async ({page, moveInpage, overviewPage, finishAccountSetupPage, supabaseQueries}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await page.goto('/move-in?electricCompany=EVERSOURCE&gasCompany=DTE',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    try{
        await moveInpage.Program_Enrolled_Questions();
        await moveInpage.Next_Move_In_Button();
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"EVERSOURCE","DTE");
    await moveInpage.Next_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Get_Electric_Account_Id(cottageUserID);

    await page.waitForTimeout(10000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility("EVERSOURCE","DTE");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(PGuser.Email, `PGtest ${PGuser.FirstName}`);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, "EVERSOURCE", "DTE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });



});


//need to add early  and late drop off that simulates closing of the browser and opening it again
/*
test('Move-in process with browser restart', async ({ browser }) => {
  // Start move-in process
  let context = await browser.newContext();
  let page = await context.newPage();
  
  await page.goto('/move-in', { waitUntil: 'domcontentloaded' });
  await moveInpage.Agree_on_Terms_and_Get_Started();
  await moveInpage.Enter_Address(MoveIndata.COMEDaddress, PGuser.UnitNumber);
  
  // Simulate browser closure
  await context.close();
  
  // User returns later - new browser session
  context = await browser.newContext();
  page = await context.newPage();
  
  await page.goto('/move-in', { waitUntil: 'domcontentloaded' });
  // Test if user can continue or needs to restart
});
*/