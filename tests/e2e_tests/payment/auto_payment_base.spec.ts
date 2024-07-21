import { test, expect } from '@playwright/test';
import { generateTestUserData } from '../../resources/fixtures/test_user';
import {supabase} from '../../resources/utils/supabase';
import {linearClient} from '../../resources/utils/linear';

test ('test', async ({ page,request }) => {
  test.setTimeout(300000);

  const userData = await generateTestUserData();
  const Email = userData.Email;

  await page.goto('https://dev.publicgrid.energy/move-in');
  await page.getByLabel('I agree to the Terms of').click();
  await page.getByRole('button', { name: 'Get Started' }).click();
  await page.waitForTimeout(500);
  await page.locator('#address').click();
  await page.waitForTimeout(500);
  await page.locator('#address').fill('52 Plym');
  await page.waitForTimeout(500);
  await page.getByText('Plymouth StreetCambridge, MA, USA').click();
  await page.locator('input[name="unitNumber"]').click();
  await page.locator('input[name="unitNumber"]').fill(userData.UnitNumber);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('input[name="firstName"]').click();
  await page.locator('input[name="firstName"]').fill(userData.FirstName);
  await page.locator('input[name="lastName"]').click();
  await page.locator('input[name="lastName"]').fill(userData.LastName);
  await page.locator('input[name="phone"]').click();
  await page.locator('input[name="phone"]').fill(userData.PhoneNumber);
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill(Email);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Select a move-in date' }).click();
  await page.getByRole('gridcell', { name: userData.Today }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Select your date of birth').fill(userData.BirthDate);
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.locator('[id="\\:rf\\:-form-item"]').fill(userData.SSN);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('button', { name: 'Skip for now' }).click();
  //move payment add here for frame instance
  //await page.getByRole('button', { name: 'Confirm' }).click();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  //await page.waitForTimeout(1000);
  await expect(page.getByRole('heading', { name: 'Finish Account Setup' })).toBeVisible({timeout:30000});
  await page.waitForTimeout(3000);

  const stripeIframe = await page?.waitForSelector('[title ="Secure payment input frame"]')
  const stripeFrame = await stripeIframe.contentFrame()

  const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
  const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
  const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
  const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
  
  

  //await CardNUmberInput?.click();
  await CardNUmberInput?.fill('4242 4242 4242 4242');
  //await CardExpiration?.click();
  await CardExpiration?.fill(userData.CardExpiry);
  await CardCVC?.fill(userData.CVC);
  console.log(userData.Country);
  //await CardCountry?.selectOption(userData.Country);
  await CardCountry?.selectOption('US');


  if(await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]')){
    const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
    await CardZipCode?.click();
    await CardZipCode?.fill(userData.Zip);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }
  else{
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }

  const { data: cottageUser } = await supabase
    .from('CottageUsers')
    .select('id')
    .eq('email', Email)
    .single()
    .throwOnError();
  const cottageUserId = cottageUser?.id ?? '';
  console.log(cottageUserId);

  const { data: EAccount } = await supabase
    .from('ElectricAccount')
    .select('id')
    .eq('cottageUserID', cottageUserId)
    .single()
    .throwOnError();
  const ElectricAccountId = EAccount?.id ?? '';
  console.log(ElectricAccountId.toString());


  // Simulate payment
  const response = await request.post('https://ojaryxuxdh.execute-api.us-east-1.amazonaws.com/payments/simulate', {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer thisisasecretkeyforadminactions',
      },
      data: {
        accountId: ElectricAccountId.toString(), // Use the fetched ElectricAccountId
        accountType: "Electric",
        totalAmountDue: 10111,
        totalUsage: 14,
      },
  });
    
    // Check the response status and optionally the response body
  console.log(await response.status()); // Log the status for debugging
  const responseBody = await response.json();
  console.log(responseBody); // Log the response body for debugging
    
    // Example assertion: Ensure the API call was successful
  expect(response.status()).toBe(200);



  //await expect(page.getByText('🥳 Success', { exact: true })).toBeVisible({timeout:30000});
  //await expect(page.getByText('Notification 🥳 SuccessYour')).toBeVisible({timeout:30000});
  await expect(page).toHaveURL('https://dev.publicgrid.energy/app/overview?accountSetupComplete=true',{timeout:30000});



  
  //supabase check bill visibility - false
  //supabase check bill isSendReminder - true
  const { data: ElectricBillReminder } = await supabase
    .from('ElectricBill')
    .select('isSendReminder')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillreminder = ElectricBillReminder?.isSendReminder ?? '';
  console.log(ElectricBillreminder);
  expect(ElectricBillreminder).toBe(true);

  //platform check and bills page
  //supabase check if bill paid notification - false
  
  // linear set bill to Done
  await page.waitForTimeout(10000);
  const teamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: "billing-dev" } } })).nodes[0].id;
  const doneStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: teamId } }, name: { eqIgnoreCase: "Done" } } })).nodes[0].id;
  const issuesResponse = await linearClient.issues({
    filter: {
      team: { id: { eq: teamId } },
      description: { contains:userData.Email},
    },
  });

  const issuesId = issuesResponse.nodes[0].id;
  console.log(issuesResponse);
  console.log(issuesId);
  console.log(doneStatusId);
  console.log(userData.FirstName +" "+ userData.LastName);

  await linearClient.updateIssue(issuesId, { stateId: doneStatusId });

  //supabase check if bill scheduled
  await page.waitForTimeout(15000);
  const { data: ElectricBillStatus2 } = await supabase
    .from('ElectricBill')
    .select('paymentStatus')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillstatus2 = ElectricBillStatus2?.paymentStatus ?? '';
  console.log(ElectricBillstatus2);
  await expect(ElectricBillstatus2).toBe("scheduled_for_payment"); // should be scheduled_for_payment

  
  // supabase check bill visibility - true
  await page.waitForTimeout(90000);
  const { data: ElectricBillVis } = await supabase
    .from('ElectricBill')
    .select('visible')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillvisib = ElectricBillVis?.visible ?? '';
  console.log(ElectricBillvisib);
  expect(ElectricBillvisib).toBe(true); // should be true

  //check bill ready email - received
  //check platform dashboard and bills page
  
  //supabase check if bill paid notification //check email - true
  const { data: ElectricBillPaidNotif } = await supabase
    .from('ElectricBill')
    .select('paidNotificationSent')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillpaidNotif = ElectricBillPaidNotif?.paidNotificationSent ?? '';
  console.log(ElectricBillpaidNotif);
  expect(ElectricBillpaidNotif).toBe(true); // should be true
  
  //supabase check if bill success
  const { data: ElectricBillStatus } = await supabase
    .from('ElectricBill')
    .select('paymentStatus')
    .eq('electricAccountID', ElectricAccountId)
    .single()
    .throwOnError();
  const ElectricBillstatus = ElectricBillStatus?.paymentStatus ?? '';
  console.log(ElectricBillstatus);
  expect(ElectricBillstatus).toBe("succeeded"); // should be succeeded
  
  //check platform dashboard and bills page


  


});