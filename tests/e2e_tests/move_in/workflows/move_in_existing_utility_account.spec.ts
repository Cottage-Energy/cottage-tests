import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { LinearActions } from '../../../resources/fixtures/linear_actions';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../../resources/data/payment-data.json';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial", retries: 0});
test.describe('Move In Existing Utility Account', () => {


  test('Move-in New User Existing Utility Account Requested', {tag: ['@smoke', '@regression'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await MoveInTestUtilities.Move_In_Existing_Utility_Account(moveInpage,false,false, true);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail);
  });


  test('Move-in New User Existing Utility Account Skip', {tag: ['@regression'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await MoveInTestUtilities.Move_In_Existing_Utility_Account(moveInpage,false,false, false);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Requested', {tag: ['@smoke', '@regression'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "PSEG");
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await MoveInTestUtilities.Move_In_Existing_Utility_Account(moveInpage,false,false, true);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Skip', {tag: ['@regression'],}, async ({moveInpage, page}) => {
    test.setTimeout(150000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "CON-EDISON", "NYS-EG" );
    await supabaseQueries.Update_Building_Billing("autotest",true);
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await MoveInTestUtilities.Move_In_Existing_Utility_Account(moveInpage,false,false, false);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist_Not_Present(MoveIn.PGUserEmail);
    await page.waitForTimeout(10000);
    await linearActions.CountMoveInTicket(MoveIn.PGUserEmail,0);
    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.PGUserEmail);
  });



});

