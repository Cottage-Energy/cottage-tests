import { test, expect } from '../../resources/page_objects';
import { newUserMoveInAutoPayment, generateTestUserData, CleanUp, FastmailActions } from '../../resources/fixtures';
import { accountQueries, billQueries } from '../../resources/fixtures/database';
import { TIMEOUTS, TEST_TAGS } from '../../resources/constants';
import type { MoveInResult } from '../../resources/types';
import { AdminApi } from '../../resources/api/admin_api';
import environmentBaseUrl from '../../resources/utils/environmentBaseUrl';
import * as PaymentData from '../../resources/data/payment-data.json';
let MoveIn: MoveInResult | undefined;


//test.beforeAll(async ({playwright,page}) => {
    
//});

test.beforeEach(async ({ playwright, page },testInfo) => {
  await page.goto('/',{ waitUntil: 'domcontentloaded' })
});
  
test.afterEach(async ({ page },testInfo) => {
    //await CleanUp.Test_User_Clean_Up(MoveIn.pgUserEmail);
    //await page.close();
});
  
/*test.afterAll(async ({ page }) => {
  
});*/


test.describe('Valid Card Auto Payment', () => {
  
  // Run COMED tests 100     times
  for (let i = 1; i <= 100; i++) {
    test(`COMED Electric Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'COMED', null, true, true);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);      
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
    });
  }

  // Run EVERSOURCE tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`EVERSOURCE Electric Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {
      
      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'EVERSOURCE', null, true, true);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
    });
  }

  // Run BGE tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`BGE Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in?gasCompany=BGE',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, null, 'BGE', true, true);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedGasBill(GasAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedGasBill(GasAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedGasBill(GasAccountId);
    });
  }

  // Run DELMARVA tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`DELMARVA Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();
      
      await page.goto('/move-in?electricCompany=DELMARVA&gasCompany=DELMARVA',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'DELMARVA', 'DELMARVA', true, true);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedGasBill(GasAccountId);
    });
  }


  // Run NGMA tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`NGMA Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await page.goto('/move-in?electricCompany=NGMA&gasCompany=NGMA',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'NGMA', 'NGMA', true, true);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedGasBill(GasAccountId);
    });
  }


  // Run PGE PSEG tests 100 times
  for (let i = 1; i <= 100; i++) {
    test(`PGE PSEG Electric & Gas Only Valid Auto Payment Move In Added - Run ${i}`, {tag: [TEST_TAGS.PAYMENT],}, async ({moveInpage, overviewPage, page, sidebarChat, billingPage, context}) => {

      test.setTimeout(1800000);

      const PGuserUsage = await generateTestUserData();

      await page.goto('/move-in?electricCompany=PGE&gasCompany=PSEG',{ waitUntil: 'domcontentloaded' });
      MoveIn = await newUserMoveInAutoPayment(page, 'PGE', 'PSEG', true, true);
      const ElectricAccountId = await accountQueries.checkGetElectricAccountId(MoveIn.cottageUserId);
      const GasAccountId = await accountQueries.checkGetGasAccountId(MoveIn.cottageUserId);

      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedElectricBill(ElectricAccountId);
      await page.waitForTimeout(500);
      await billQueries.insertApprovedGasBill(GasAccountId);
    });
  }



  

});

