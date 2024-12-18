import { test,expect } from '../../../../resources/fixtures/pg_pages_fixture';
import { TransferServiceTestUtilities } from '../../../../resources/fixtures/transferServiceUtilities';
import { LinearActions } from '../../../../resources/fixtures/linear_actions';
import { SupabaseQueries } from '../../../../resources/fixtures/database_queries';
import { CleanUp } from '../../../../resources/fixtures/userCleanUp';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();
let MoveIn: any;

/*test.beforeAll(async ({playwright,page}) => {

});*/

test.beforeEach(async ({ page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
  await page.goto('/move-in?transfer-service=true',{ waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page },testInfo) => {
  await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
  //await page.close();
});

/*test.afterAll(async ({ page }) => {

});*/

test.describe.configure({mode: "serial", retries: 2});
test.describe('Move In Existing Utility Accout', () => {
  
  test('COMED New User', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    const MoveIn = await TransferServiceTestUtilities.COMED_New_User_Move_In(moveInpage);
 
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });
  


  test('CON-EDISON New User Add Auto Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage,true,true);
    
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Add Auto Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage);
    
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


  test('CON-EDISON New User Add Manual Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage);

    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Add Manual Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage);
    
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


  test('CON-EDISON New User Skip Add Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.CON_ED_New_User_Move_In_Skip_Payment(moveInpage);
    
    //add query to check if the user is added to the UtilityCredentials table
    //add check in DB fro question answers
    //check confirnation email
  });


  test('EVERSOURCE New User Skip Add Payment', {tag: [ '@regression'],}, async ({moveInpage, page}) => {
    test.slow();
    //const MoveIn = await MoveInTestUtilities.EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage);
    
    //add query to check if the user is added to the UtilityCredentials table
    //check confirnation email
  });


});

