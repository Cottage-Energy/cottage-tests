import { test, expect } from '../../../resources/page_objects';
import { BillUploadTestUtilities } from '../../../resources/fixtures/billUploadUtilities';
import { TEST_TAGS, TIMEOUTS } from '../../../resources/constants';
import { faker } from '@faker-js/faker';
import path from 'path';

let BillUpload: any;

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page }, testInfo) => {
  await page.close();
});

test.describe.configure({ mode: "serial" });
test.describe('Bill Upload Flow Tests', () => {

  test('Bill Upload - Con Edison Utility', { tag: [...TEST_TAGS.SMOKE_REGRESSION1] }, async ({ billUploadPage, page }) => {
    test.setTimeout(TIMEOUTS.EXTENDED);
    
    const imgPath = path.join(__dirname, '../../../resources/data', 'PGLogo002.jpg');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+coned+${uniqueKey}@joinpublicgrid.com`;
    
    await billUploadPage.completeBillUploadFlow('12249', imgPath, testEmail, 'Con Edison');
    
    // Bill upload completed for Con Edison
  });

  test('Bill Upload Using Utilities - Con Edison', { tag: ['@regression2', '@billupload'] }, async ({ page }) => {
    test.setTimeout(TIMEOUTS.EXTENDED);
    
    BillUpload = await BillUploadTestUtilities.completeBillUploadFlow(page, '12249', 'Con Edison');
    
    // Verify test completion
    expect(BillUpload.testEmail).toContain('pgtest+billupload+auto');
    expect(BillUpload.zipCode).toBe('12249');
    expect(BillUpload.utility).toBe('Con Edison');
    
    // Bill upload utilities test completed
  });

  test('Bill Upload - Manual Step by Step Flow', { tag: ['@regression3', '@billupload'] }, async ({ billUploadPage, page }) => {
    test.setTimeout(TIMEOUTS.EXTENDED);
    
    const imgPath = path.join(__dirname, '../../../resources/data', 'PGLogo002.jpg');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+manual+${uniqueKey}@joinpublicgrid.com`;
    
    // Test each step individually for better debugging
    await billUploadPage.navigateToConnectAccount();
    await billUploadPage.fillZipCodeAndSelectUtility('12249', 'Con Edison');
    await billUploadPage.clickCheckAvailability();
    await billUploadPage.fillEmailAndUploadBill(testEmail, imgPath);
    await billUploadPage.waitForBillProcessing();
    await billUploadPage.verifySuccess();
    
    // Manual step-by-step test completed
  });

  test('Bill Upload - Alternative File Format', { tag: ['@regression4', '@billupload'] }, async ({ billUploadPage, page }) => {
    test.setTimeout(TIMEOUTS.EXTENDED);
    
    const imgPath = path.join(__dirname, '../../../resources/data', 'PGsample.pdf');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+pdf+${uniqueKey}@joinpublicgrid.com`;
    
    await billUploadPage.completeBillUploadFlow('12249', imgPath, testEmail, 'Con Edison');
    
    // PDF upload test completed
  });

});