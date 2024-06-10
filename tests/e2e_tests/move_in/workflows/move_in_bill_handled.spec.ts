import { test,expect,type Page } from '@playwright/test';
import { MoveInPage }  from '../../../resources/page_objects/move_in_page';
import { faker } from '@faker-js/faker';


let moveinPage: MoveInPage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('https://dev.publicgrid.energy/move-in',{ waitUntil: 'domcontentloaded' });
  moveinPage = new MoveInPage(page);
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In Billing Users', () => {

  test('CON-EDISON Billing New User', async () => {
    await moveinPage.Agree_on_Terms_and_Get_Started();
    await Enter_CON_ED_Address_and_Unit();
    await Enter_Personal_Info();
    await Choose_Current_Move_In_Date()
    await CON_ED_Enter_ID_Info();
    await moveinPage.Submit_ID_Info();
    await moveinPage.Check_Successful_Move_In_Billing_Customer();
  });

  test('EVERSOURCE Billing New User', async () => {
    await moveinPage.Agree_on_Terms_and_Get_Started();
    await Enter_EVERSOURCE_Address_and_Unit();
    await Enter_Personal_Info();
    await Choose_Current_Move_In_Date()
    await Enter_ID_Info();
    await moveinPage.Submit_ID_Info();
    await moveinPage.Check_Successful_Move_In_Billing_Customer();
  });


});


async function Enter_CON_ED_Address_and_Unit() {
  const unitNo = faker.location.buildingNumber();
  await moveinPage.Enter_Address_and_Unit('S 1st StBrooklyn, NY 11249, USA',unitNo);
  await moveinPage.Next_Move_In_Button();
};

async function Enter_EVERSOURCE_Address_and_Unit() {
  const unitNo = faker.location.buildingNumber();
  await moveinPage.Enter_Address_and_Unit('Plymouth StCambridge, MA 02141, USA',unitNo);
  await moveinPage.Next_Move_In_Button();
};

async function Enter_Personal_Info() {
  const FirstName = faker.person.firstName();
  const LastName = faker.person.lastName();
  const phoneNo = faker.phone.number();
  const EmailAdd = faker.internet.email({ firstName: FirstName, lastName: LastName, provider: 'autotest.pg'});

  await moveinPage.Enter_Personal_Info(FirstName + 'AutoTest',LastName,phoneNo,EmailAdd);
  await moveinPage.Next_Move_In_Button();
};


async function Choose_Current_Move_In_Date() {
  const date = new Date();
  const today = date.getDate().toString();

  await moveinPage.Choose_Move_In_Date(today);
  await moveinPage.Next_Move_In_Button();
};



async function Enter_ID_Info() {
  const formatData =
    (input) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    }

  const date = new Date();
  const eigthteen_yrs_ago = date.getFullYear() - 18;
  const valid_yrs = eigthteen_yrs_ago.toString();
  const correction_month = date.getMonth() + 1;
  const month = formatData(correction_month).toString();
  const day = formatData(date.getDate()).toString();
  const complete_date = valid_yrs + '-' + month + '-' + day;

  const ssn_number = Math.floor(100000000 + Math.random() * 900000000).toString();

  await moveinPage.Enter_ID_Info(complete_date,ssn_number);
};


async function CON_ED_Enter_ID_Info() {
  const formatData =
    (input) => {
        if (input > 9) {
            return input;
        } else return `0${input}`;
    }

  const date = new Date();
  const eigthteen_yrs_ago = date.getFullYear() - 18;
  const valid_yrs = eigthteen_yrs_ago.toString();
  const correction_month = date.getMonth() + 1;
  const month = formatData(correction_month).toString();
  const day = formatData(date.getDate()).toString();
  const complete_date = valid_yrs + '-' + month + '-' + day;

  const ssn_number = Math.floor(100000000 + Math.random() * 900000000).toString();

  await moveinPage.CON_ED_Enter_ID_Info(complete_date,ssn_number);
};

