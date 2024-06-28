import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
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
  await page.locator('input[name="unitNumber"]').fill('Test');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('input[name="firstName"]').click();
  await page.locator('input[name="firstName"]').fill('Pay');
  await page.locator('input[name="lastName"]').click();
  await page.locator('input[name="lastName"]').fill('Five');
  await page.locator('input[name="phone"]').click();
  await page.locator('input[name="phone"]').fill('432-425-35435');
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill('christian+pay5.5@onepublicgrid.com');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Select a move-in date' }).click();
  await page.getByRole('gridcell', { name: '28' }).nth(1).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Select your date of birth').fill('1991-01-01');
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.locator('[id="\\:rf\\:-form-item"]').fill('423-42-34233');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Finish Account Setup' })).toBeVisible();
  await page.waitForTimeout(1000);

  const stripeIframe = await page.waitForSelector('[title ="Secure payment input frame"]')
  const stripeFrame = await stripeIframe.contentFrame()

  const CardNUmberInput = await stripeFrame?.waitForSelector('[autocomplete ="billing cc-number"]');
  const CardExpiration = await stripeFrame?.waitForSelector('[id ="Field-expiryInput"]');
  const CardCVC = await stripeFrame?.waitForSelector('[id ="Field-cvcInput"]');
  const CardCountry = await stripeFrame?.waitForSelector('[id ="Field-countryInput"]');
  

  await CardNUmberInput?.click();
  await CardNUmberInput?.fill('4242 4242 4242 4242');
  await CardExpiration?.click();
  await CardExpiration?.fill('03/30');
  await CardCVC?.fill('432');
  await CardCountry?.selectOption('US');

  const CardZipCode = await stripeFrame?.waitForSelector('[id ="Field-postalCodeInput"]');

  await CardZipCode?.click();
  await CardZipCode?.fill('43534');
 
  await page.getByRole('button', { name: 'Save Payment Method' }).click();


  await expect(page.getByText('🥳 Success', { exact: true })).toBeVisible({timeout:30000});
  await expect(page.getByText('Notification 🥳 SuccessYour')).toBeVisible({timeout:30000});
  await expect(page).toHaveURL('https://dev.publicgrid.energy/app/overview?accountSetupComplete=true',{timeout:30000});
});