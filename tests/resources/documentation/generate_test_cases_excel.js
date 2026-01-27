const ExcelJS = require('exceljs');
const path = require('path');

async function generateTestCasesExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cottage Tests';
  workbook.created = new Date();

  // Define all test cases with their steps
  const testCases = [
    {
      sheetName: 'Homepage Navigation',
      testFile: 'homepage_navigation.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'Go to How it Works',
          testId: 'HP_001',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Click on "How it Works" link', expectedResult: 'User is navigated to How it Works page' },
            { step: 3, description: 'Verify URL', expectedResult: 'URL contains /how-it-works' }
          ]
        },
        {
          testName: 'Go to About',
          testId: 'HP_002',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Click on "About" link', expectedResult: 'User is navigated to About page' },
            { step: 3, description: 'Verify URL', expectedResult: 'URL contains /about' }
          ]
        },
        {
          testName: 'Go to Resources',
          testId: 'HP_003',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Click on "Resources" link', expectedResult: 'User is navigated to Resources page' },
            { step: 3, description: 'Verify URL', expectedResult: 'URL contains /resources' }
          ]
        },
        {
          testName: 'Go to Developers',
          testId: 'HP_004',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Click on "Developers" link', expectedResult: 'User is navigated to Developers page' },
            { step: 3, description: 'Verify URL', expectedResult: 'URL contains /developers' }
          ]
        },
        {
          testName: 'Go to Sign In',
          testId: 'HP_005',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Click on "Sign In" link', expectedResult: 'User is navigated to Sign In page' },
            { step: 3, description: 'Verify URL', expectedResult: 'URL contains /sign-in' }
          ]
        }
      ]
    },
    {
      sheetName: 'Bill Upload',
      testFile: 'bill-upload_base.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'Bill Upload - Con Edison Utility',
          testId: 'BU_001',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Generate unique test email with alphanumeric key', expectedResult: 'Test email created: pgtest+billupload+coned+{key}@joinpublicgrid.com' },
            { step: 3, description: 'Prepare bill image file (PGLogo002.jpg)', expectedResult: 'Image file path resolved successfully' },
            { step: 4, description: 'Enter zip code 12249 for Con Edison', expectedResult: 'Zip code accepted and utility matched' },
            { step: 5, description: 'Upload bill image', expectedResult: 'Bill image uploaded successfully' },
            { step: 6, description: 'Complete bill upload flow', expectedResult: 'Bill upload completed for Con Edison with test email' },
            { step: 7, description: 'Verify completion message', expectedResult: 'Test completed successfully with confirmation' }
          ]
        },
        {
          testName: 'Bill Upload Using Utilities - Con Edison',
          testId: 'BU_002',
          steps: [
            { step: 1, description: 'Navigate to page', expectedResult: 'Page loads successfully' },
            { step: 2, description: 'Call completeBillUploadFlow utility with zip 12249 and Con Edison', expectedResult: 'Utility function executes bill upload flow' },
            { step: 3, description: 'Verify test email contains "pgtest+billupload+auto"', expectedResult: 'Email format matches expected pattern' },
            { step: 4, description: 'Verify zip code is 12249', expectedResult: 'Zip code matches input' },
            { step: 5, description: 'Verify utility is Con Edison', expectedResult: 'Utility name matches' },
            { step: 6, description: 'Log test completion', expectedResult: 'Test completed with email confirmation' }
          ]
        },
        {
          testName: 'Bill Upload - Manual Step by Step Flow',
          testId: 'BU_003',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Prepare bill image file (PGLogo002.jpg)', expectedResult: 'Image file ready for upload' },
            { step: 3, description: 'Manually enter each field in bill upload form', expectedResult: 'All form fields populated correctly' },
            { step: 4, description: 'Upload bill image manually', expectedResult: 'Image uploaded to form' },
            { step: 5, description: 'Submit bill upload form', expectedResult: 'Form submitted successfully' },
            { step: 6, description: 'Verify all steps completed individually', expectedResult: 'Manual flow completed with all validations' }
          ]
        }
      ]
    },
    {
      sheetName: 'Move In - New Service Zip User',
      testFile: 'move_in_new_service_zip_user.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'COMED New User',
          testId: 'MI_001',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Navigate to /move-in page', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Complete new user move-in flow for COMED', expectedResult: 'New user created with COMED utility' },
            { step: 4, description: 'Add auto payment details', expectedResult: 'Payment method added successfully' },
            { step: 5, description: 'Get electric account ID from database', expectedResult: 'Electric account ID retrieved' },
            { step: 6, description: 'Verify registration is complete', expectedResult: 'isRegistrationComplete returns true' },
            { step: 7, description: 'Wait 10 seconds for processing', expectedResult: 'Processing time elapsed' },
            { step: 8, description: 'Check Start Service Confirmation email', expectedResult: 'Email received with account number for COMED' },
            { step: 9, description: 'Check Welcome to PG email', expectedResult: 'Welcome email received' },
            { step: 10, description: 'Clean up test user data', expectedResult: 'Test user removed from database' }
          ]
        },
        {
          testName: 'CON-EDISON New User Add Auto Payment',
          testId: 'MI_002',
          steps: [
            { step: 1, description: 'Navigate to homepage', expectedResult: 'Homepage loads successfully' },
            { step: 2, description: 'Navigate to /move-in page', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Complete new user move-in flow for CON-EDISON', expectedResult: 'New user created with CON-EDISON utility' },
            { step: 4, description: 'Add auto payment details', expectedResult: 'Payment method added successfully' },
            { step: 5, description: 'Verify account creation', expectedResult: 'Account created in database' },
            { step: 6, description: 'Clean up test user data', expectedResult: 'Test user removed from database' }
          ]
        }
      ]
    },
    {
      sheetName: 'Move In - Workflows',
      testFile: 'Various workflow spec files',
      status: 'Implemented',
      tests: [
        {
          testName: 'Move In - Existing Cottage User',
          testId: 'MI_ECU_001',
          steps: [
            { step: 1, description: 'Verify existing user exists in database', expectedResult: 'User record found' },
            { step: 2, description: 'Navigate to /move-in page', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Enter existing user email', expectedResult: 'System recognizes existing user' },
            { step: 4, description: 'Complete move-in flow for existing user', expectedResult: 'Move-in completed with existing account' },
            { step: 5, description: 'Verify new utility account linked', expectedResult: 'New utility account associated with existing user' }
          ]
        },
        {
          testName: 'Move In - Existing Utility Account',
          testId: 'MI_EUA_001',
          steps: [
            { step: 1, description: 'Verify utility account exists', expectedResult: 'Utility account found' },
            { step: 2, description: 'Navigate to /move-in page', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Enter existing account number', expectedResult: 'System recognizes existing account' },
            { step: 4, description: 'Complete move-in with existing account', expectedResult: 'Move-in completed successfully' },
            { step: 5, description: 'Verify account details updated', expectedResult: 'Account information updated in database' }
          ]
        },
        {
          testName: 'Move In - Pre-filled Data',
          testId: 'MI_PF_001',
          steps: [
            { step: 1, description: 'Generate pre-filled URL parameters', expectedResult: 'URL with query parameters created' },
            { step: 2, description: 'Navigate to /move-in with parameters', expectedResult: 'Move-in page loads with pre-filled data' },
            { step: 3, description: 'Verify fields are pre-populated', expectedResult: 'Form fields contain pre-filled values' },
            { step: 4, description: 'Complete move-in flow', expectedResult: 'Move-in completed with pre-filled data' },
            { step: 5, description: 'Verify data accuracy', expectedResult: 'Submitted data matches pre-filled values' }
          ]
        },
        {
          testName: 'Move In - Shortcode',
          testId: 'MI_SC_001',
          steps: [
            { step: 1, description: 'Navigate to /move-in?shortCode=autotest', expectedResult: 'Move-in page loads with shortcode parameter' },
            { step: 2, description: 'Verify building association via shortcode', expectedResult: 'Building "autotest" linked to user flow' },
            { step: 3, description: 'Complete move-in with shortcode', expectedResult: 'Move-in completed with building association' },
            { step: 4, description: 'Verify building data in database', expectedResult: 'User linked to correct building via shortcode' }
          ]
        },
        {
          testName: 'Move In - Parameters',
          testId: 'MI_P_001',
          steps: [
            { step: 1, description: 'Create URL with multiple parameters', expectedResult: 'URL constructed with query parameters' },
            { step: 2, description: 'Navigate to /move-in with parameters', expectedResult: 'Page loads with all parameters' },
            { step: 3, description: 'Verify each parameter is processed', expectedResult: 'All parameters applied to form' },
            { step: 4, description: 'Complete move-in flow', expectedResult: 'Move-in completed with parameterized data' }
          ]
        }
      ]
    },
    {
      sheetName: 'Move In UI Validations',
      testFile: 'Various UI validation spec files',
      status: 'Partially Implemented',
      tests: [
        {
          testName: 'Email Field Validation',
          testId: 'MI_UI_EMAIL_001',
          steps: [
            { step: 1, description: 'Navigate to move-in page', expectedResult: 'Page loads with email field visible' },
            { step: 2, description: 'Enter invalid email format', expectedResult: 'Validation error displayed' },
            { step: 3, description: 'Enter valid email', expectedResult: 'Field accepts valid email' },
            { step: 4, description: 'Verify email format validation', expectedResult: 'Email validated correctly' }
          ]
        },
        {
          testName: 'Phone Number Field Validation',
          testId: 'MI_UI_PHONE_001',
          steps: [
            { step: 1, description: 'Navigate to move-in page', expectedResult: 'Page loads with phone field visible' },
            { step: 2, description: 'Enter invalid phone format', expectedResult: 'Validation error displayed' },
            { step: 3, description: 'Enter valid phone number', expectedResult: 'Field accepts valid phone' },
            { step: 4, description: 'Verify phone format validation', expectedResult: 'Phone validated correctly' }
          ]
        },
        {
          testName: 'Date Field Validation',
          testId: 'MI_UI_DATE_001',
          steps: [
            { step: 1, description: 'Navigate to move-in page', expectedResult: 'Page loads with date picker visible' },
            { step: 2, description: 'Select past date', expectedResult: 'Validation prevents past dates' },
            { step: 3, description: 'Select future date', expectedResult: 'Date accepted' },
            { step: 4, description: 'Verify date validation logic', expectedResult: 'Date validated correctly' }
          ]
        },
        {
          testName: 'Birthdate Field Validation',
          testId: 'MI_UI_BD_001',
          steps: [
            { step: 1, description: 'Navigate to move-in page', expectedResult: 'Page loads with birthdate field visible' },
            { step: 2, description: 'Enter future date', expectedResult: 'Validation error for future date' },
            { step: 3, description: 'Enter date for minor (under 18)', expectedResult: 'Validation error for underage' },
            { step: 4, description: 'Enter valid adult birthdate', expectedResult: 'Birthdate accepted' }
          ]
        },
        {
          testName: 'Agreement Terms Acceptance',
          testId: 'MI_UI_AGR_001',
          steps: [
            { step: 1, description: 'Navigate to agreement terms section', expectedResult: 'Terms and conditions displayed' },
            { step: 2, description: 'Verify checkbox is unchecked by default', expectedResult: 'Checkbox is not checked' },
            { step: 3, description: 'Try to proceed without checking', expectedResult: 'Validation prevents proceeding' },
            { step: 4, description: 'Check agreement checkbox', expectedResult: 'Checkbox checked' },
            { step: 5, description: 'Proceed to next step', expectedResult: 'User can proceed after acceptance' }
          ]
        }
      ]
    },
    {
      sheetName: 'Payment - Auto Payment',
      testFile: 'auto_pay_successful_payment.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'EVERSOURCE Electric Valid Auto Payment',
          testId: 'PAY_AUTO_001',
          steps: [
            { step: 1, description: 'Update building billing to autotest', expectedResult: 'Building billing enabled' },
            { step: 2, description: 'Update companies to EVERSOURCE for building autotest', expectedResult: 'Companies configured' },
            { step: 3, description: 'Navigate to move-in with shortCode=autotest', expectedResult: 'Move-in page loads' },
            { step: 4, description: 'Complete new user move-in with skip payment option', expectedResult: 'User created, payment skipped initially' },
            { step: 5, description: 'Navigate to sign-in page', expectedResult: 'Sign-in page loads' },
            { step: 6, description: 'Enter auto payment details after skip', expectedResult: 'Payment details entered (card number, expiry, CVC, zip)' },
            { step: 7, description: 'Setup password', expectedResult: 'Password created successfully' },
            { step: 8, description: 'Accept new terms and conditions', expectedResult: 'Terms accepted' },
            { step: 9, description: 'Run auto card payment electric checks', expectedResult: 'Payment processed successfully for electric account' },
            { step: 10, description: 'Clean up test user', expectedResult: 'Test user removed from system' }
          ]
        },
        {
          testName: 'PSEG Electric & Gas Valid Auto Payment',
          testId: 'PAY_AUTO_002',
          steps: [
            { step: 1, description: 'Update building billing configuration', expectedResult: 'Billing enabled for autotest' },
            { step: 2, description: 'Navigate to move-in page', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Complete new user move-in with PSEG for electric and gas', expectedResult: 'User created with dual utilities' },
            { step: 4, description: 'Add auto payment during move-in', expectedResult: 'Payment method added' },
            { step: 5, description: 'Verify electric and gas accounts created', expectedResult: 'Both accounts exist in database' },
            { step: 6, description: 'Run payment checks for both utilities', expectedResult: 'Payments process correctly for electric and gas' },
            { step: 7, description: 'Clean up test user', expectedResult: 'Test user removed' }
          ]
        }
      ]
    },
    {
      sheetName: 'Payment - Failed Scenarios',
      testFile: 'auto_pay_failed_payment.spec.ts / manual_pay_failed_payment.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'Auto Payment with Invalid Card',
          testId: 'PAY_AUTO_FAIL_001',
          steps: [
            { step: 1, description: 'Update building billing configuration', expectedResult: 'Billing enabled' },
            { step: 2, description: 'Navigate to move-in page', expectedResult: 'Page loads' },
            { step: 3, description: 'Complete move-in flow', expectedResult: 'User created' },
            { step: 4, description: 'Enter invalid card details', expectedResult: 'Invalid card entered' },
            { step: 5, description: 'Submit payment', expectedResult: 'Payment fails with error message' },
            { step: 6, description: 'Verify error is displayed', expectedResult: 'Error message shown to user' },
            { step: 7, description: 'Verify payment not processed', expectedResult: 'No charge in database' },
            { step: 8, description: 'Clean up test user', expectedResult: 'User removed' }
          ]
        },
        {
          testName: 'Manual Payment with Invalid Card',
          testId: 'PAY_MAN_FAIL_001',
          steps: [
            { step: 1, description: 'Update building configuration', expectedResult: 'Building configured' },
            { step: 2, description: 'Complete move-in with manual payment', expectedResult: 'User created' },
            { step: 3, description: 'Generate bill', expectedResult: 'Bill created' },
            { step: 4, description: 'Enter invalid card for manual payment', expectedResult: 'Invalid card details entered' },
            { step: 5, description: 'Submit payment', expectedResult: 'Payment fails with error' },
            { step: 6, description: 'Verify error message displayed', expectedResult: 'Error shown to user' },
            { step: 7, description: 'Verify no charge recorded', expectedResult: 'Database shows no payment' },
            { step: 8, description: 'Clean up test user', expectedResult: 'User removed' }
          ]
        }
      ]
    },
    {
      sheetName: 'Payment - Manual Payment',
      testFile: 'manual_pay_successful_payment.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'NGMA Electric Valid Manual Card Payment',
          testId: 'PAY_MAN_001',
          steps: [
            { step: 1, description: 'Update building with NGMA electric only', expectedResult: 'Building configured for NGMA' },
            { step: 2, description: 'Navigate to move-in with shortCode=autotest', expectedResult: 'Move-in page loads' },
            { step: 3, description: 'Complete new user move-in with manual payment', expectedResult: 'User created with manual payment option' },
            { step: 4, description: 'Navigate to sign-in page', expectedResult: 'Sign-in page loads' },
            { step: 5, description: 'Accept terms and conditions', expectedResult: 'Terms accepted' },
            { step: 6, description: 'Get electric account ID from database', expectedResult: 'Account ID retrieved' },
            { step: 7, description: 'Simulate electric bill via admin API', expectedResult: 'Bill generated with amount and usage' },
            { step: 8, description: 'Run manual card payment electric checks', expectedResult: 'Payment processed manually for electric' },
            { step: 9, description: 'Clean up test user', expectedResult: 'User removed from system' }
          ]
        }
      ]
    },
    {
      sheetName: 'Payment - Load Test',
      testFile: 'payment_load_test.spec.ts',
      status: 'Implemented',
      tests: [
        {
          testName: 'COMED Electric Auto Payment Load Test (100 runs)',
          testId: 'PAY_LOAD_001',
          steps: [
            { step: 1, description: 'Loop 100 times', expectedResult: '100 iterations configured' },
            { step: 2, description: 'Generate unique test user for each iteration', expectedResult: 'Unique user data created' },
            { step: 3, description: 'Navigate to move-in page', expectedResult: 'Page loads' },
            { step: 4, description: 'Complete move-in with COMED and auto payment', expectedResult: 'User created with payment' },
            { step: 5, description: 'Get electric account ID', expectedResult: 'Account ID retrieved' },
            { step: 6, description: 'Insert approved electric bill', expectedResult: 'Bill created in database' },
            { step: 7, description: 'Monitor performance and response times', expectedResult: 'Performance metrics collected' },
            { step: 8, description: 'Verify all 100 users created successfully', expectedResult: 'All iterations complete without failure' }
          ]
        }
      ]
    }
  ];

  // Create Summary sheet FIRST
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.properties.tabColor = { argb: 'FFC000' };

  summarySheet.mergeCells('A1:F1');
  summarySheet.getCell('A1').value = 'Cottage Energy Test Cases Summary';
  summarySheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  summarySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  summarySheet.getRow(3).values = ['Sheet Name', 'Test File', 'Status', 'Tests Count', 'Total Steps'];
  summarySheet.getRow(3).font = { bold: true };
  summarySheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2F3' } };

  summarySheet.getColumn(1).width = 35;
  summarySheet.getColumn(2).width = 50;
  summarySheet.getColumn(3).width = 20;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 15;

  let summaryRow = 4;
  for (const testData of testCases) {
    const totalSteps = testData.tests.reduce((sum, t) => sum + t.steps.length, 0);
    summarySheet.getRow(summaryRow).values = [
      testData.sheetName,
      testData.testFile,
      testData.status,
      testData.tests.length,
      totalSteps
    ];
    
    summarySheet.getCell(summaryRow, 3).font = { 
      color: { argb: testData.status === 'Implemented' ? '008000' : (testData.status === 'Partially Implemented' ? 'FF8C00' : 'FF0000') } 
    };
    
    for (let col = 1; col <= 5; col++) {
      summarySheet.getCell(summaryRow, col).border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    }
    summaryRow++;
  }

  for (let col = 1; col <= 5; col++) {
    summarySheet.getCell(3, col).border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  }

  // Create a sheet for each test category
  for (const testData of testCases) {
    const worksheet = workbook.addWorksheet(testData.sheetName);

    // Sheet header
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = `Test File: ${testData.testFile}`;
    worksheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };

    worksheet.getCell('A2').value = 'Status:';
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('B2').value = testData.status;
    worksheet.getCell('B2').font = { 
      color: { argb: testData.status === 'Implemented' ? '008000' : (testData.status === 'Partially Implemented' ? 'FF8C00' : 'FF0000') } 
    };

    worksheet.getCell('C2').value = 'Tests:';
    worksheet.getCell('C2').font = { bold: true };
    worksheet.getCell('D2').value = testData.tests.length;

    // Set column widths
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 65;
    worksheet.getColumn(3).width = 70;
    worksheet.getColumn(4).width = 40;
    worksheet.getColumn(5).width = 12;

    let currentRow = 4;

    // Create a table for each test
    for (let testIndex = 0; testIndex < testData.tests.length; testIndex++) {
      const test = testData.tests[testIndex];

      // Test header with colored background
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `Test ${testIndex + 1}: ${test.testName} (${test.testId})`;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
      worksheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '5B9BD5' } };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Table header
      worksheet.getRow(currentRow).values = ['Step #', 'Step Description', 'Expected Result', 'Actual Result', 'Pass/Fail'];
      worksheet.getRow(currentRow).font = { bold: true };
      worksheet.getRow(currentRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2F3' } };
      
      for (let col = 1; col <= 5; col++) {
        worksheet.getCell(currentRow, col).border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      }
      currentRow++;

      // Steps
      for (const step of test.steps) {
        worksheet.getRow(currentRow).values = [step.step, step.description, step.expectedResult, '', ''];
        
        for (let col = 1; col <= 5; col++) {
          worksheet.getCell(currentRow, col).border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        }
        
        worksheet.getCell(currentRow, 2).alignment = { wrapText: true, vertical: 'top' };
        worksheet.getCell(currentRow, 3).alignment = { wrapText: true, vertical: 'top' };
        currentRow++;
      }

      // Add spacing between test tables
      currentRow += 2;
    }
  }

  const outputPath = path.join(__dirname, 'cottage_test_cases.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel file created successfully: ${outputPath}`);
  console.log(`📊 Summary:`);
  console.log(`   - Total test suites: ${testCases.length}`);
  console.log(`   - Total test cases: ${testCases.reduce((sum, tc) => sum + tc.tests.length, 0)}`);
  console.log(`   - Total test steps: ${testCases.reduce((sum, tc) => sum + tc.tests.reduce((s, t) => s + t.steps.length, 0), 0)}`);
  console.log(`   - Implemented: ${testCases.filter(tc => tc.status === 'Implemented').length}`);
  console.log(`   - Partially Implemented: ${testCases.filter(tc => tc.status === 'Partially Implemented').length}`);
  console.log(`   - Not Implemented: ${testCases.filter(tc => tc.status === 'Not Implemented').length}`);
}

generateTestCasesExcel().catch(console.error);
