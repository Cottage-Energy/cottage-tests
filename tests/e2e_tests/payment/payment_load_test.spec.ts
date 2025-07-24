import { test, expect } from '../../resources/page_objects/base/pg_page_base.ts';
import { generateTestUserData } from '../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { MoveInTestUtilities } from '../../resources/fixtures/moveInUtilities';
import { PaymentUtilities } from '../../resources/fixtures/paymentUtilities';
import { AdminApi } from '../../resources/api/admin_api';
import environmentBaseUrl from '../../resources/utils/environmentBaseUrl';
import tokenConfig from '../../resources/utils/tokenConfig';
import * as PaymentData from '../../resources/data/payment-data.json';
import { CleanUp } from '../../resources/fixtures/userCleanUp';
import { FastmailActions } from '../../resources/fixtures/fastmail_actions';


const supabaseQueries = new SupabaseQueries();
const paymentUtilities = new PaymentUtilities();
let MoveIn: any;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ playwright, page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    //await CleanUp.Test_User_Clean_Up(MoveIn.PGUserEmail);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe('Valid Card Auto Payment', () => {
  
  // Run COMED tests 100     times
  for (let i = 1; i <= 100; i++) {
    test(`COMED Electric Only Valid Auto Payment Move In Added - Run ${i}`, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'COMED', null, true, true);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);      
      await supabaseQueries.Insert_Electric_Bill(ElectricAccountId);
    });
  }

  // Run EVERSOURCE tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`EVERSOURCE Electric Only Valid Auto Payment Move In Added - Run ${i}`, {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'EVERSOURCE', null, true, true);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
    });
  }

  // Run BGE tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`BGE Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in?gasCompany=BGE',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, null, 'BGE', true, true);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
    });
  }

  // Run DELMARVA tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`DELMARVA Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'DELMARVA', 'DELMARVA', true, true);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
    });
  }


  // Run NGMA tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`NGMA Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await page.goto('/move-in?electricCompany=NGMA&gasCompany=NGMA',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'NGMA', 'NGMA', true, true);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
    });
  }


  // Run PGE PSEG tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`PGE PSEG Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: ['@regression1'],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
      MoveIn = await MoveInTestUtilities.New_User_Move_In_Auto_Payment_Added(moveInpage, 'PGE', 'PSEG', true, true);
      const ElectricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
      const GasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);

      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Electric_Bill(ElectricAccountId);
      await page.waitForTimeout(500);
      await supabaseQueries.Insert_Approved_Gas_Bill(GasAccountId);
    });
  }



  

});