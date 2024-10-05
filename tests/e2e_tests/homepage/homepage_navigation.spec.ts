import { test,expect,type Page } from '@playwright/test';
import { HomePage }  from '../../resources/page_objects/homepage';


let homePage: HomePage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' });
  homePage = new HomePage(page);
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Homepage Navigation', () => {
  
  test('Go to How it Works', async () => {
    await homePage.click_HowItWorks();
  });
  
  test('Go to About', async () => {
    await homePage.click_About();
  });
  
  test('Go to Resources', async () => {
    await homePage.click_Resources();
  });
  
  test('Go to Developers', async () => {
    await homePage.click_Developers();
  });
  
  test('Go to Sign In', async () => {
    await homePage.click_SignIn();
  });

});

