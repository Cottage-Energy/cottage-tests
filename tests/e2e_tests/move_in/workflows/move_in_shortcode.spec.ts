import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import * as MoveIndata from '../../../resources/data/move_in-data.json';
import * as PaymentData from '../../../resources/data/payment-data.json';

const supabaseQueries = new SupabaseQueries();


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe('Move In New User Electric & Gas', () => {
  

  test('New User for ShortCode Electric Only', async ({moveInpage,page}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric Only
    await supabaseQueries.Update_Companies_to_Building("autotest","CON-EDISON",null);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });
  });


  test('New User for ShortCode Gas Only', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Gas Only
  });


  test('New User for ShortCode Electric and Gas Same Company', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric and Gas Different Company', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Different Company
  });


  test('New User for ShortCode Electric and Gas Both Non Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric is Billing and Gas is Non Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


  test('New User for ShortCode Electric is Non Billing and Gas is Billing', async ({moveInpage}) => {

    const PGuser = await generateTestUserData();

    //Supabase query to change bldg to Electric and Gas Same Company
  });


});

