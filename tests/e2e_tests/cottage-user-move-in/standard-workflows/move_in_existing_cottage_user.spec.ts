import { test, expect } from '../../../resources/page_objects';
import { newUserMoveInAutoPayment, newUserMoveInManualPayment, generateTestUserData, CleanUp, FastmailActions, validateOTP } from '../../../resources/fixtures';
import { utilityQueries, accountQueries, userQueries } from '../../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import type { MoveInResult } from '../../../resources/types/moveIn.types';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';

/**
 * Result storage for cleanup - can be either a full MoveInResult 
 * or a partial object with just the email for cleanup
 */
interface CleanupResult {
  pgUserEmail: string;
  cottageUserId?: string;
  accountNumber?: string;
}

/** Stores the result of move-in flow for use across test hooks */
let moveInResult: (MoveInResult & CleanupResult) | CleanupResult | null = null;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
    await utilityQueries.updateBuildingBilling("autotest",true);
    await utilityQueries.updateBuildingUseEncourageConversion("autotest", false);
    await utilityQueries.updatePartnerUseEncourageConversion("Moved", false);
    await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page }, testInfo) => {
  if (moveInResult?.pgUserEmail) {
    await CleanUp.Test_User_Clean_Up(moveInResult.pgUserEmail);
  }
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In Existing User: Cottageuser, ElectricAccount &/or GasAccount Exist', () => {
  test.describe.configure({mode: "serial"});
  
    test('COMED Cottageuser & ElectricAccount Exist', {tag: [TEST_TAGS.REGRESSION1],}, async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

      const PGuser = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding("autotest","COMED",null);
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      moveInResult = await newUserMoveInAutoPayment(page,"COMED",null, true, false);
      await accountQueries.checkGetElectricAccountId(moveInResult.cottageUserId!);
      await accountQueries.checkGasAccountIdNotPresent(moveInResult.cottageUserId!);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Choose_Start_Service();
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,moveInResult.pgUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const otp = validateOTP(await FastmailActions.Get_OTP(moveInResult.pgUserEmail));
        
      await moveInpage.Enter_OTP(otp);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_OTP_Confirmed_Message();
      await servicesPage.Services_Check_Page_Content();
      await page.waitForTimeout(TIMEOUTS.MEDIUM);
      await FastmailActions.Check_Utility_Account_OTW(moveInResult.pgUserEmail, "COMED", null);
      await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    });


    test('Eversource Cottageuser, Electric & Gas Account Exist', {tag: [TEST_TAGS.REGRESSION5],}, async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

      const PGuser = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","EVERSOURCE");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      moveInResult = await newUserMoveInAutoPayment(page,"EVERSOURCE","EVERSOURCE", true, true);
      await accountQueries.checkGetElectricAccountId(moveInResult.cottageUserId!);
      await accountQueries.checkGetGasAccountId(moveInResult.cottageUserId!);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Choose_Start_Service();
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Read_ESCO_Conditions();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,moveInResult.pgUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(moveInResult.pgUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await FastmailActions.Check_Utility_Account_OTW(moveInResult.pgUserEmail, "EVERSOURCE", "EVERSOURCE");
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('CON EDISON Cottageuser, Electric & Gas Account Exist', {tag: [TEST_TAGS.REGRESSION1],}, async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

      const PGuser = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding("autotest","CON-EDISON","CON-EDISON");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      moveInResult = await newUserMoveInManualPayment(page,"CON-EDISON","CON-EDISON", true, true);
      await accountQueries.checkGetElectricAccountId(moveInResult.cottageUserId!);
      await accountQueries.checkGetGasAccountId(moveInResult.cottageUserId!);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Choose_Start_Service();
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,moveInResult.pgUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(moveInResult.pgUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await FastmailActions.Check_Utility_Account_OTW(moveInResult.pgUserEmail, "CON-EDISON", "CON-EDISON");
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
      } else {
          throw new Error('Invalid OTP');
      }
    });


    test('COMED Cottageuser & Gas Account Exist', {tag: [TEST_TAGS.REGRESSION2],}, async ({page, moveInpage, servicesPage}) => {
      test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

      const PGuser = await generateTestUserData();

      await utilityQueries.updateCompaniesToBuilding("autotest",null,"COMED");
      
      await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
      moveInResult = await newUserMoveInAutoPayment(page,null,"COMED", false, true);
      await accountQueries.checkGetGasAccountId(moveInResult.cottageUserId!);
      await accountQueries.checkElectricAccountIdNotPresent(moveInResult.cottageUserId!);
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Check_Successful_Move_In_Billing_Customer();
      await moveInpage.Click_Start_New_Move_In_Request();
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
      await moveInpage.Agree_on_Terms_and_Get_Started()
      await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Choose_Start_Service();
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,moveInResult.pgUserEmail,PGuser.Today);
      await moveInpage.Next_Move_In_Button();
      await moveInpage.Check_Email_Registered_Message();
      const OTP = await FastmailActions.Get_OTP(moveInResult.pgUserEmail);
        
      if (typeof OTP === 'string') {
        await moveInpage.Enter_OTP(OTP);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_OTP_Confirmed_Message();
        await servicesPage.Services_Check_Page_Content();
        await page.waitForTimeout(TIMEOUTS.MEDIUM);
        await FastmailActions.Check_Utility_Account_OTW(moveInResult.pgUserEmail, null, "COMED");
        await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);

      } else {
          throw new Error('Invalid OTP');
      }
    });

});


test.describe('Move In Existing User: Cottageuser Exist Only Early Drop Off', () => {
  test.describe.configure({mode: "serial"});
    
  test('COMED Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION3],}, async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    await userQueries.checkCottageUserIdNotPresent(PGuser.Email);

    //check if the user will be able to login - suppose to be not
 
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email); // currently analyzing

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
    await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetElectricAccountId(cottageUserID);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "COMED", null);
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('EVERSOURCE Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION4],}, async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await utilityQueries.updateCompaniesToBuilding("autotest",null,"EVERSOURCE");
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    await userQueries.checkCottageUserIdNotPresent(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);

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

    await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await accountQueries.checkElectricAccountIdNotPresent(cottageUserID);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, null, "EVERSOURCE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('AEP-OHIO AEP-OHIO Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION5],}, async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await utilityQueries.updateCompaniesToBuilding("autotest","AEP-OHIO","AEP-OHIO");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    await userQueries.checkCottageUserIdNotPresent(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress,"AEP-OHIO","AEP-OHIO");
    await moveInpage.Submit_Move_In_Button();

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);

    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility("AEP-OHIO","AEP-OHIO");

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

    await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetElectricAccountId(cottageUserID);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "AEP-OHIO", "AEP-OHIO");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('EVERSOURCE CON-EDISON Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION1],}, async ({page, moveInpage, servicesPage}) => {
    test.setTimeout(TIMEOUTS.TEST_MOVE_IN);

    const PGuser = await generateTestUserData();
    const AltPGuser = await generateTestUserData();
    let PayThroughPG: boolean = true;

    await utilityQueries.updateCompaniesToBuilding("autotest","EVERSOURCE","CON-EDISON");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(30000);
    await userQueries.checkCottageUserIdNotPresent(PGuser.Email);

    //check if the user will be able to login - suppose to be not a directed move-in again

    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,AltPGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);

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

    await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await accountQueries.checkGetElectricAccountId(cottageUserID);
    await page.waitForTimeout(30000);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "EVERSOURCE", "CON-EDISON");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });

});


test.describe('Move In Existing User: Cottageuser Exist Only Late Drop Off', () => {
  test.describe.configure({mode: "serial"});
    
  test('EVERSOURCE Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION2],}, async ({page, moveInpage, overviewPage}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetElectricAccountId(cottageUserID);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility('EVERSOURCE', null);
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    //await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_Service(PGuser.Email);
    await page.goto('/sign-in');
    //await finishAccountSetupPage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    //await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "PENDING", "EVERSOURCE");
    //await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('NGMA Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION1],}, async ({page, moveInpage, overviewPage}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding("autotest",null,"NGMA");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.CON_EDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await accountQueries.checkElectricAccountIdNotPresent(cottageUserID);

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility(null,"NGMA");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    // TODO: New post-sign-in payment flow — finishAccountSetupPage removed
    // await finishAccountSetupPage.Enter_Manual_Payment_Details_After_Skip(...)
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, null,"NGMA");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('PSEG PSEG Cottageuser Exist Only', {tag: [TEST_TAGS.REGRESSION2],}, async ({page, moveInpage, overviewPage}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await utilityQueries.updateCompaniesToBuilding("autotest","PSEG","PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await accountQueries.checkElectricAccountIdNotPresent(cottageUserID);

 
    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility("PSEG","PSEG");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    // TODO: New post-sign-in payment flow — finishAccountSetupPage removed
    // await finishAccountSetupPage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(...)
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "PENDING", "PSEG");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
  });


  test('EVERSOURCE DTE Cottageuser Exist Only', {tag: [TEST_TAGS.SMOKE, TEST_TAGS.REGRESSION4],}, async ({page, moveInpage, overviewPage}) => {
    test.setTimeout(900000);

    const PGuser = await generateTestUserData();

    await page.goto('/move-in?electricCompany=EVERSOURCE&gasCompany=DTE',{ waitUntil: 'domcontentloaded' });
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Start_Service();
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
    await moveInpage.Submit_Move_In_Button();
    await page.waitForTimeout(30000);
    await page.waitForLoadState('domcontentloaded');
    const cottageUserID = await userQueries.checkCottageUserId(PGuser.Email);
    await accountQueries.checkGetGasAccountId(cottageUserID);
    await accountQueries.checkGetElectricAccountId(cottageUserID);

    await page.waitForTimeout(TIMEOUTS.MEDIUM);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded'});
    const paymentVis = await moveInpage.Check_Payment_Page_Visibility("EVERSOURCE","DTE");
    await expect(paymentVis).toBe(true);
    await page.waitForTimeout(75000);

    await FastmailActions.Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(PGuser.Email);
    await page.goto('/sign-in');
    // TODO: New post-sign-in payment flow — finishAccountSetupPage removed
    // await finishAccountSetupPage.Enter_Manual_Payment_Valid_Bank_Details_After_Skip(...)
    await overviewPage.Setup_Password();
    await overviewPage.Accept_New_Terms_And_Conditions();
    //await overviewPage.Check_Get_Started_Widget_Visible();
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await FastmailActions.Check_Utility_Account_OTW(PGuser.Email, "EVERSOURCE", "DTE");
    await FastmailActions.Check_Welcome_to_PG_Lets_Get_Started(PGuser.Email);
    const localMoveIn: CleanupResult = {
      cottageUserId: cottageUserID,
      pgUserEmail: PGuser.Email
    };
    moveInResult = localMoveIn;
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
