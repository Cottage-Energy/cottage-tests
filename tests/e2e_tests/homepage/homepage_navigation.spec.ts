import { test, expect, type Page } from '@playwright/test';
import { HomePage } from '../../resources/page_objects';
import { TEST_TAGS } from '../../resources/constants';

let homePage: HomePage;

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  homePage = new HomePage(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await page.close();
});


test.describe('Homepage Navigation', () => {
  test.describe.configure({ mode: "serial" });
  
  test('Go to About', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    test.skip(true, 'About Us page returns 404 on dev — ENG-2400');
    await homePage.click_About();
  });
  
  test('Go to Resources', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_Resources();
  });

  test('Go to Support', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_Support();
  });

  test('Go to For Properties', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_ForProperties();
  });
  
  test('Go to Sign In', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_SignIn();
  });

});