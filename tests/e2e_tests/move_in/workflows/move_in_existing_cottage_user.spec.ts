import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';
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
  await CleanUp.Test_User_Clean_Up(MoveIn.cottageUserId);
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

test.describe.configure({mode: "serial"});
test.describe.only('Move In Existing User: Cottageuser & ElectricAccount Exist', () => {
  
    test('COMED Cottageuser & ElectricAccount Exist', async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
      await supabaseQueries.Update_Building_Billing("autotest",false);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage, true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('Eversource Cottageuser & ElectricAccount Exist', async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('CON EDISON Cottageuser & ElectricAccount Exist', async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(350000);

      const PGuser = await generateTestUserData();

      await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
      await supabaseQueries.Update_Building_Billing("autotest",true);
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage, true, false);
      await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      await supabaseQueries.Check_Gas_Account_Id_Not_Present(MoveIn.cottageUserId);
      await page.waitForTimeout(10000);
      await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
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
        await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "CON-EDISON", null);
      } else {
          throw new Error('Invalid OTP');
      }
    });


});


test.describe.only('Move In Existing User: Cottageuser, ElectricAccount & GasAccount Exist', () => {
    
  test('COMED Cottageuser, Electric & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser, Electric & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
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
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, "EVERSOURCE", "EVERSOURCE");
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser, Electric & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage, true, true);
    await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe.only('Move In Existing User: Cottageuser & GasAccount Exist', () => {
    
  test('COMED Cottageuser & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","COMED","COMED");
    await supabaseQueries.Update_Building_Billing("autotest",false);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage, false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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

    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('Eversource Cottageuser & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","EVERSOURCE");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage, false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
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
      await FastmailActions.Check_Start_Service_Confirmation(MoveIn.PGUserEmail, MoveIn.accountNumber, null, "EVERSOURCE");
    } else {
        throw new Error('Invalid OTP');
    }
  });


  test('CON EDISON Cottageuser & Gas Account Exist', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage, false, true);
    await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(MoveIn.cottageUserId);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,1);
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
    } else {
        throw new Error('Invalid OTP');
    }
  });


});


test.describe.only('Move In Existing User: Cottageuser Exist Only', () => {
    
  test('COMED Cottageuser Exist Only', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,0);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress);
    const billingStatus = await supabaseQueries.Get_Company_Billing_Status("COMED");
    await moveInpage.Next_Move_In_Button();
    
    if (billingStatus === true) {
      await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
      await moveInpage.Confirm_Payment_Details();
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "COMED", null);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('COMED EVERSOURCE Cottageuser Exist Only', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

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
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,0);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, false);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await supabaseQueries.Check_Gas_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "COMED", null);
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE EVERSOURCE Cottageuser Exist Only', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

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
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,0);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(false, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,1);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, null, "EVERSOURCE");
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


  test('EVERSOURCE CON-EDISON Cottageuser Exist Only', async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(350000);

    const PGuser = await generateTestUserData();

    await supabaseQueries.Update_Companies_to_Building("autotest","EVERSOURCE","CON-EDISON");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    const cottageUserID = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await supabaseQueries.Check_Electric_Account_Id_Not_Present(cottageUserID);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(PGuser.Email,0);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(true, true);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Email_Registered_Message();
    const OTP = await FastmailActions.Get_OTP(PGuser.Email);
      
    if (typeof OTP === 'string') {
      await moveInpage.Enter_OTP(OTP);
      await moveInpage.Next_Move_In_Button();
    } else {
        throw new Error('Invalid OTP');
    }

    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();

    await supabaseQueries.Get_Gas_Account_Id(cottageUserID);
    await supabaseQueries.Get_Electric_Account_Id(cottageUserID);
    await page.waitForTimeout(30000);
    await linearActions.CountMoveInTicket(PGuser.Email,2);
    await FastmailActions.Check_Start_Service_Confirmation(PGuser.Email, accountNumber, "EVERSOURCE", "CON-EDISON");
    const moveIn = {
      cottageUserId: cottageUserID,
      PGUserEmail: PGuser.Email
    };
    MoveIn = moveIn;
  });


});
