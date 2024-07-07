import { test,expect } from '../../../resources/fixtures/move_in-fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in?shortCode=8f2a413e',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User Electric & Gas', () => {
  

  test('New User for ShortCode Electric Only', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();
    const Email = PGuser.Email;

    //Supabase query to change bldg to Electric Only
    await moveInpage.Agree_on_Terms_and_Get_Started();
    await moveInpage.Enter_Address_and_Unit(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info(PGuser.FirstName + 'AutoTest',PGuser.LastName,PGuser.PhoneNumber,Email);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Move_In_Date(PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();

    await moveInpage.Check_Successful_Move_In_Billing_Customer();
  });

  test('New User for ShortCode Electric and Gas', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();
    const Email = PGuser.Email;

    //Supabase query to change bldg to Electric and Gas
    await moveInpage.Agree_on_Terms_and_Get_Started();
    await moveInpage.Enter_Address_and_Unit(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info(PGuser.FirstName + 'AutoTest',PGuser.LastName,PGuser.PhoneNumber,Email);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Move_In_Date(PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,'US',PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();

    await moveInpage.Check_Successful_Move_In_Billing_Customer();
  });


});

