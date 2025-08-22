import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import path from 'path';

test('test', async ({ page }) => {
  const imgpath = path.join(__dirname, '../../resources/data', 'PGLogo002.jpg');
  const uniqueKey = faker.string.alphanumeric(10);

  await page.goto('https://dev.publicgrid.energy/bill-upload/connect-account');
  await expect(page.getByRole('heading', { name: 'Energy savings starts here' })).toBeVisible();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('12249');
  await expect(page.getByRole('combobox')).toBeVisible();
  await page.getByRole('combobox').click();
  await page.getByLabel('Con Edison').click();
  await page.getByRole('button', { name: 'Let\'s Get Started' }).click();
  await expect(page.getByRole('heading', { name: 'We are in your neighborhood' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Upload your bill' })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(imgpath);
  await page.getByRole('button', { name: 'Agree and Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Hold tight, scanning your bill...' })).toBeVisible({timeout:90000});
  await expect(page.getByRole('heading', { name: 'Good news 🎉 Your account has untapped savings!' })).toBeVisible({timeout:90000});
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill(`pgtest+billupload+auto${uniqueKey}@joinpublicgrid.com`);
  await expect(page.getByText('Auto-enroll in savings')).toBeVisible();
  await expect(page.getByRole('switch')).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('button', { name: 'Got it!' }).click();
  await expect(page.getByRole('heading', { name: 'Way to Go 🥳' })).toBeVisible({timeout:60000});
});