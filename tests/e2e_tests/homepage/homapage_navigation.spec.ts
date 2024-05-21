import { test,expect,type Page } from '@playwright/test';
import { HomePage }  from '../../resources/page_objects/homepage';


let homePage: HomePage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  //await page.goto('https://dev.publicgrid.energy/');
  homePage = new HomePage(page);
});

test.afterEach(async ({ page },testInfo) => {

});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Homepage Navigation', () => {
  
  test('Go to How it Works', async (page) => {
    await homePage.click_HowItWorks;
  });
  
  test('Go to About', async (page) => {
  await homePage.click_About;
  });
  
  test('Go to Resources', async (page) => {
  await homePage.click_Resources;
  });
  
  test('Go to Developers', async (page) => {
  await homePage.click_Developers;
  });
  
  test('Go to Sign In', async (page) => {
  await homePage.click_SignIn;
  });

});

