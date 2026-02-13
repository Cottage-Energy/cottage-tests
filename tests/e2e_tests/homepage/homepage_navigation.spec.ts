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

test.describe.configure({ mode: "serial" });
test.describe('Homepage Navigation', () => {
  
  test('Go to How it Works', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_HowItWorks();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to About', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    test.slow();
    await homePage.click_About();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Resources', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_Resources();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Developers', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_Developers();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Sign In', { tag: [...TEST_TAGS.ALL_REGRESSION] }, async ({ page }) => {
    await homePage.click_SignIn();
    console.log('Navigated to:', page.url());
  });

});