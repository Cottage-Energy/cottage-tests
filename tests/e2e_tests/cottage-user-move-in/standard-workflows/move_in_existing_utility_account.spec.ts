import { test, expect } from '../../../resources/page_objects';
import { moveInExistingUtilityAccount, generateTestUserData, CleanUp, FastmailActions } from '../../../resources/fixtures';
import { TIMEOUTS, TEST_TAGS } from '../../../resources/constants';
import * as PaymentData from '../../../resources/data/payment-data.json';

let MoveIn: any;


/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page, supabaseQueries },testInfo) => {
  await supabaseQueries.Update_Building_Billing("autotest",true);
  await supabaseQueries.Update_Building_Use_Encourage_Conversion("autotest", false);
  //disable utility verification flag
  await supabaseQueries.Update_Partner_Use_Encourage_Conversion("Moved", false);
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});

test.afterEach(async ({ page },testInfo) => {
  await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/


test.describe.configure({mode: "serial", retries: 0});
test.describe('Move In Existing Utility Account', () => {


  test('Move-in New User Existing Utility Account Requested', {tag: ['@regression1'],}, async ({moveInpage, page, supabaseQueries}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, true);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in New User Existing Utility Account Skip', {tag: ['@regression2'],}, async ({moveInpage, page, supabaseQueries}) => {
    test.setTimeout(150000);
    await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, false);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Requested', {tag: ['@regression3'],}, async ({moveInpage, page, supabaseQueries}) => {
    test.setTimeout(150000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "PSEG", "PSEG");
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, true);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
  });


  test('Move-in ShortCode Existing Utility Account Skip', {tag: ['@regression4'],}, async ({moveInpage, page, supabaseQueries}) => {
    test.setTimeout(150000);
    await supabaseQueries.Update_Companies_to_Building("autotest", "CON-EDISON", "NYS-EG" );
    
    await page.goto('/move-in?shortCode=autotest',{ waitUntil: 'domcontentloaded' });

    MoveIn = await moveInExistingUtilityAccount(page,false,false, false);
    
    await supabaseQueries.Check_Cottage_User_Id_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(5000);
    await supabaseQueries.Check_Waitlist_Not_Present(MoveIn.pgUserEmail);
    await page.waitForTimeout(10000);

    await FastmailActions.Check_Start_Service_Confirmation_Not_Present(MoveIn.pgUserEmail);
  });



});



