import { test, expect } from '../../resources/page_objects/base/pg_page_base';
import { BillUploadTestUtilities } from '../../resources/fixtures/billUploadUtilities';
import { faker } from '@faker-js/faker';
import path from 'path';

let BillUpload: any;

test.beforeEach(async ({ page }, testInfo) => {
  // Navigate to base URL if needed
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ page, aiTestUtilities }, testInfo) => {
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
  
  // Clean up test data if needed
  // await CleanUp.Test_User_Clean_Up(BillUpload?.testEmail);
  await page.close();
});

test.describe.configure({ mode: "serial" });
test.describe('Bill Upload Flow Tests', () => {

  test('Bill Upload - Con Edison Utility', { tag: ['@smoke', '@billupload', '@regression1', '@ai-enhanced'] }, async ({ billUploadPage, page }) => {
    test.setTimeout(600000);
    
    const imgPath = path.join(__dirname, '../../resources/data', 'PGLogo002.jpg');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+coned+${uniqueKey}@joinpublicgrid.com`;
    
    await billUploadPage.completeBillUploadFlow('12249', imgPath, testEmail, 'Con Edison');
    
    console.log(`Bill Upload test completed for Con Edison with email: ${testEmail}`);
  });

  test('Bill Upload Using Utilities - Con Edison', { tag: ['@regression2', '@billupload'] }, async ({ page }) => {
    test.setTimeout(600000);
    
    BillUpload = await BillUploadTestUtilities.completeBillUploadFlow(page, '12249', 'Con Edison');
    
    // Verify test completion
    expect(BillUpload.testEmail).toContain('pgtest+billupload+auto');
    expect(BillUpload.zipCode).toBe('12249');
    expect(BillUpload.utility).toBe('Con Edison');
    
    console.log(`Bill Upload Utilities test completed for email: ${BillUpload.testEmail}`);
  });

  test('Bill Upload - Manual Step by Step Flow', { tag: ['@regression3', '@billupload'] }, async ({ billUploadPage, page }) => {
    test.setTimeout(600000);
    
    const imgPath = path.join(__dirname, '../../resources/data', 'PGLogo002.jpg');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+manual+${uniqueKey}@joinpublicgrid.com`;
    
    // Test each step individually for better debugging
    await billUploadPage.navigateToConnectAccount();
    await billUploadPage.fillZipCodeAndSelectUtility('12249', 'Con Edison');
    await billUploadPage.clickLetsGetStarted();
    await billUploadPage.proceedFromNeighborhood();
    await billUploadPage.uploadBillFile(imgPath);
    await billUploadPage.waitForBillProcessing();
    await billUploadPage.fillEmailAndFinish(testEmail);
    
    console.log(`Manual step-by-step test completed for email: ${testEmail}`);
  });

  test('Bill Upload - Alternative File Format', { tag: ['@regression4', '@billupload'] }, async ({ billUploadPage, page }) => {
    test.setTimeout(600000);
    
    const imgPath = path.join(__dirname, '../../resources/data', 'PGsample.pdf');
    const uniqueKey = faker.string.alphanumeric(10);
    const testEmail = `pgtest+billupload+pdf+${uniqueKey}@joinpublicgrid.com`;
    
    await billUploadPage.completeBillUploadFlow('12249', imgPath, testEmail, 'Con Edison');
    
    console.log(`PDF upload test completed for email: ${testEmail}`);
  });

});