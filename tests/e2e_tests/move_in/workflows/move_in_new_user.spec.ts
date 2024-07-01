import { test,expect } from '../../../resources/fixtures/move_in-fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import * as MoveIndata from '../../../resources/data/move_in-data.json';


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User', () => {
  
  test('COMED New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();
    const Email = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started();
    await moveInpage.Enter_Address_and_Unit(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info(PGuser.FirstName + 'AutoTest',PGuser.LastName,PGuser.PhoneNumber,Email);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Move_In_Date(PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress);
    await moveInpage.Submit_ID_Info();
    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
  });

  test('CON-EDISON New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();
    const Email = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started();
    await moveInpage.Enter_Address_and_Unit(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info(PGuser.FirstName + 'AutoTest',PGuser.LastName,PGuser.PhoneNumber,Email);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Move_In_Date(PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Submit_ID_Info();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
  });

  test('EVERSOURCE New User', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();
    const Email = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started();
    await moveInpage.Enter_Address_and_Unit(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info(PGuser.FirstName + 'AutoTest',PGuser.LastName,PGuser.PhoneNumber,Email);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Choose_Move_In_Date(PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Submit_ID_Info();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
  });


});

