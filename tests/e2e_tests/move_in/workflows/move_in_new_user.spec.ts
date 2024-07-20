import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

//test.afterEach(async ({ page },testInfo) => {
  //await page.close();
//});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User', () => {
  
  test('COMED New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    await moveInpage.Enter_Address_Agree_on_Terms_and_Get_Started(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Enter_Personal_Info("PGTest: " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
  });

  test('CON-EDISON New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    await moveInpage.Enter_Address_Agree_on_Terms_and_Get_Started(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Enter_Personal_Info("PGTest: " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();

    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();
  });

  test('EVERSOURCE New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    await moveInpage.Enter_Address_Agree_on_Terms_and_Get_Started(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Enter_Personal_Info("PGTest: " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();

    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();
  });


});

