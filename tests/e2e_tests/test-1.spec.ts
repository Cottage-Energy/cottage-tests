import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://dev.onepublicgrid.com/move-in');
  await page.getByLabel('I agree to the Terms of').click();
  await page.getByRole('button', { name: 'Get Started' }).click();

  await page.locator('#address').click();
  await page.waitForTimeout(500);
  await page.locator('#address').fill('808 Chicago AveDixon, IL');
  await page.getByText('808 Chicago AveDixon, IL').click();
  await page.locator('input[name="unitNumber"]').click();
  await page.locator('input[name="unitNumber"]').fill('Test');


  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('input[name="firstName"]').click();
  await page.locator('input[name="firstName"]').fill('Test');
  await page.locator('input[name="lastName"]').click();
  await page.locator('input[name="lastName"]').fill('Auto');
  await page.locator('input[name="phone"]').click();
  await page.locator('input[name="phone"]').fill('tel:6468175554');
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill('christian+auto01@onepublicgrid.com');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Select a move-in date' }).click();
  await page.getByText('25').click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Date of Birth').fill('1991-06-02');
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.getByRole('combobox').click();
  await page.getByLabel('SSN').click();
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.locator('[id="\\:rf\\:-form-item"]').fill('464-95-59599');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible();
  await expect(page.getByText('Confirmation Number:')).toBeVisible();
  await expect(page.getByText('Success🥳Your account is set')).toBeVisible();
});