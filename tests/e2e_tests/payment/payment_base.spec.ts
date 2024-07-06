import { test, expect } from '@playwright/test';
import { generateTestUserData } from '../../resources/fixtures/test_user';
import {supabase} from '../../resources/utils/db';

test ('test', async ({ page }) => {

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
  await page.getByRole('gridcell', { name: userData.Today }).nth(1).click();
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
  await expect(page.getByRole('heading', { name: 'Finish Account Setup' })).toBeVisible();
  await page.waitForTimeout(5000);

  const stripeIframe = await page.locator('[title ="Secure payment input frame"]')
  const stripeFrame = await stripeIframe.contentFrame()

  const CardNUmberInput = await stripeFrame.locator('[id ="Field-numberInput"]');
  const CardExpiration = await stripeFrame.locator('[id ="Field-expiryInput"]');
  const CardCVC = await stripeFrame.locator('[id ="Field-cvcInput"]');
  const CardCountry = await stripeFrame.locator('[id ="Field-countryInput"]');
  const CardZipCode = await stripeFrame.locator('[id ="Field-postalCodeInput"]');
  

  //await CardNUmberInput?.click();
  await CardNUmberInput?.fill('4242 4242 4242 4242');
  //await CardExpiration?.click();
  await CardExpiration?.fill(userData.CardExpiry);
  await CardCVC?.fill(userData.CVC);
  await CardCountry?.selectOption(userData.Country);


  if(await CardZipCode?.isVisible()){
    //await CardZipCode?.click();
    await page.waitForTimeout(500);
    await CardZipCode?.fill(userData.Zip);
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }
  else{
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }

  const { data:cottageUser } = await supabase
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
  console.log(ElectricAccountId);


  await expect(page.getByText('🥳 Success', { exact: true })).toBeVisible({timeout:30000});
  await expect(page.getByText('Notification 🥳 SuccessYour')).toBeVisible({timeout:30000});
  await expect(page).toHaveURL('https://dev.publicgrid.energy/app/overview?accountSetupComplete=true',{timeout:30000});



});