import { test,expect } from '../../resources/page_objects/base/pg_page_base';
import { HomePage }  from '../../resources/page_objects/homepage';


let homePage: HomePage;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' });
  homePage = new HomePage(page);
});

test.afterEach(async ({ page, aiTestUtilities },testInfo) => {
  // AI-powered failure analysis for failed tests
  if (testInfo.status === 'failed' && process.env.ANTHROPIC_API_KEY) {
    console.log('\n🤖 AI is analyzing the test failure...');
    const errors = testInfo.errors;
    if (errors.length > 0) {
      const error = new Error(errors[0].message || 'Unknown error');
      error.stack = errors[0].stack;
      await aiTestUtilities.analyzeFailure(page, testInfo, error);
    }
  }
  
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

test.describe.configure({mode: "serial"});
test.describe('Homepage Navigation', () => {
  
  test('Go to How it Works', {tag: ['@smoke', '@regression1', '@regression2','@regression3','@regression4','@regression5','@regression6','@regression7', '@ai-enhanced' ],}, async ({page}) => {
    await homePage.click_HowItWorks();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to About', {tag: ['@smoke', '@regression1', '@regression2','@regression3','@regression4','@regression5','@regression6','@regression7' ],}, async ({page}) => {
    test.slow();
    await homePage.click_About();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Resources', {tag: ['@smoke', '@regression1', '@regression2','@regression3','@regression4','@regression5','@regression6','@regression7' ],}, async ({page}) => {
    await homePage.click_Resources();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Developers', {tag: ['@smoke', '@regression1', '@regression2','@regression3','@regression4','@regression5','@regression6','@regression7' ],}, async ({page}) => {
    await homePage.click_Developers();
    console.log('Navigated to:', page.url());
  });
  
  test('Go to Sign In', {tag: ['@smoke', '@regression1', '@regression2','@regression3','@regression4','@regression5','@regression6','@regression7' ],}, async ({page}) => {
    await homePage.click_SignIn();
    console.log('Navigated to:', page.url());
  });

});

