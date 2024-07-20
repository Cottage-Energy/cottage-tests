import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
//import { MoveInUtilities } from '../../../resources/fixtures/moveInUtilities';
//import * as MoveIndata from '../../../resources/data/move_in-data.json';
//import * as PaymentData from '../../../resources/data/payment-data.json';

const supabaseQueries = new SupabaseQueries();

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
    await page.goto('/',{ waitUntil: 'domcontentloaded' })
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
  });
  
  test.afterEach(async ({ page },testInfo) => {
    //await page.close();
  });
  
  /*test.afterAll(async ({ page }) => {
  
  });*/

  test.describe('Valid Auto Payment', () => {

    test('CON-EDISON Valid Payment Move In Added', async ({moveInpage}) => {

        const PGuserUsage = await generateTestUserData();

      });

  });