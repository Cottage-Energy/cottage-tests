import { test,expect,type Page } from '@playwright/test';
import { MoveInPage }  from '../../../resources/page_objects/move_in_page';


let moveinPage: MoveInPage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('https://dev.publicgrid.energy/move-in',{ waitUntil: 'domcontentloaded' });
  moveinPage = new MoveInPage(page);
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User', () => {
  
  test('COMED New User', async () => {
    await moveinPage.Agree_on_Terms_and_Get_Started();
    await moveinPage.Enter_Address_and_Unit('808 Chicago AveDixon, IL','Test');
    await moveinPage.Enter_Personal_Info('Test','Test','1203456789','christian+auto2.0@onepublicgrid.com');
    await moveinPage.Choose_Move_In_Date('1');
    await moveinPage.Enter_ID_Info('1991-06-02','123456789');
    await moveinPage.Enter_ID_Info_Prev_Add('808 Chicago AveDixon, IL');
    /*await moveinPage.Submit_ID_Info();
    await moveinPage.Check_Successful_Move_In_Non_Billing_Customer();*/
  });


});

