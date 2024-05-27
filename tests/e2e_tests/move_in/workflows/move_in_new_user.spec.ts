import { test,expect,type Page } from '@playwright/test';
import { MoveInPage }  from '../../../resources/page_objects/move_in_page';


let moveinPage: MoveInPage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('https://dev.publicgrid.energy/',{ waitUntil: 'domcontentloaded' });
  moveinPage = new MoveInPage(page);
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User', () => {
  
  test('Go to How it Works', async () => {
    //await moveinPage.click_HowItWorks();
  });


});

