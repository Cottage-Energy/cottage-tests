import { test,expect } from '../../../resources/fixtures/pg_pages_fixture';
import { generateTestUserData } from '../../../resources/fixtures/test_user';
import { MoveInTestUtilities } from '../../../resources/fixtures/moveInUtilities';
import { FastmailActions } from '../../../resources/fixtures/fastmail_actions';
import {FastmailClient} from '../../../resources/utils/fastmail/client';
import { SupabaseQueries } from '../../../resources/fixtures/database_queries';
import * as MoveIndata from '../../../resources/data/move_in-data.json';

const supabaseQueries = new SupabaseQueries();

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


test.describe('Move In Existing User: Cottageuser & ElectricAccount Exist', () => {
    
    test('COMED Cottageuser & ElectricAccount Exist', async ({page, moveInpage}) => {
        test.setTimeout(300000);

        const PGuser = await generateTestUserData();

        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        const MoveIn = await MoveInTestUtilities.COMED_New_User_Move_In(moveInpage);
        await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
        await moveInpage.Enter_Address_Agree_on_Terms_and_Get_Started(MoveIndata.COMEDaddress,PGuser.UnitNumber);
        await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,MoveIn.PGUserEmail,PGuser.Today);
        await moveInpage.Next_Move_In_Button();
        await moveInpage.Check_Email_Registered_Message();
        const OTP = await FastmailActions.Get_OTP(MoveIn.PGUserEmail);
        
        if (typeof OTP === 'string') {
          await moveInpage.Enter_OTP(OTP);
        } else {
          throw new Error('Invalid OTP');
        }
        
        await moveInpage.Next_Move_In_Button();
      });


});


//cottageuser & gasAccount Exist
//cottageuser & electricAccount & gasAccount Exist
//only cottageuser Exist