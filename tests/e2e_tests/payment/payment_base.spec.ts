import { test, expect } from '@playwright/test';
import { generateTestUserData } from '../../resources/fixtures/test_user';

test ('test', async ({ page }) => {

  const userData = await generateTestUserData();

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
  await page.locator('input[name="email"]').fill(userData.Email);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Select a move-in date' }).click();
  await page.getByRole('gridcell', { name: userData.Today }).nth(1).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Select your date of birth').fill(userData.BirthDate);
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.locator('[id="\\:rf\\:-form-item"]').fill(userData.SSN);
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Finish Account Setup' })).toBeVisible();
  await page.waitForTimeout(5000);

  const stripeIframe = await page.waitForSelector('[title ="Secure payment input frame"]')
  const stripeFrame = await stripeIframe.contentFrame()

  const CardNUmberInput = await stripeFrame?.waitForSelector('[id ="Field-numberInput"]');
  const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
  const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
  const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
  

  await CardNUmberInput?.click();
  await CardNUmberInput?.fill('4242 4242 4242 4242');
  await CardExpiration?.click();
  await CardExpiration?.fill(userData.CardExpiry);
  await CardCVC?.fill(userData.CVC);
  await CardCountry?.selectOption('US');
  //await CardCountry?.selectOption(userData.Country);


  if((await stripeFrame?.isVisible('[id ="Field-postalCodeInput"]'))){
    const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
    await CardZipCode?.click();
    await CardZipCode?.fill(userData.Zip);
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }
  else{
    await page.getByRole('button', { name: 'Save Payment Method' }).click();
  }

  //const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');
  //await CardZipCode?.click();
  //await CardZipCode?.fill(userData.Zip);
  //await page.getByRole('button', { name: 'Save Payment Method' }).click();

  await expect(page.getByText('🥳 Success', { exact: true })).toBeVisible({timeout:30000});
  await expect(page.getByText('Notification 🥳 SuccessYour')).toBeVisible({timeout:30000});
  await expect(page).toHaveURL('https://dev.publicgrid.energy/app/overview?accountSetupComplete=true',{timeout:30000});
});