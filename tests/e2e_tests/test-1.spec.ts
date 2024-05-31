import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://dev.onepublicgrid.com/move-in');

  await page.getByLabel('I agree to the Terms of').click();
  await page.getByRole('button', { name: 'Get Started' }).click();

  await page.locator('#address').click();
  await page.waitForTimeout(300);
  await page.locator('#address').fill('808 Chicago AveDixon, IL');
  await page.getByText('808 Chicago AveDixon, IL').click();
  await page.locator('input[name="unitNumber"]').click();
  await page.locator('input[name="unitNumber"]').fill('Test');

  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.locator('input[name="firstName"]').isVisible();
  await page.locator('input[name="firstName"]').isEditable();
  await page.locator('input[name="firstName"]').click();
  await page.locator('input[name="firstName"]').fill('Test');
  await page.locator('input[name="lastName"]').click();
  await page.locator('input[name="lastName"]').fill('Auto');
  await page.locator('input[name="phone"]').click();
  await page.locator('input[name="phone"]').fill('tel:6468175554');
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill('christian+auto0.1.1@onepublicgrid.com');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

 await page.getByRole('button', { name: 'Select a move-in date' }).isVisible();
  await page.getByRole('button', { name: 'Select a move-in date' }).click();
  let day = '31';
  await page.locator('//button[text()='+ day +'and not(@disabled) and not(contains(@class,"text-muted"))]').click();
  await page.waitForTimeout(500);
  await page.getByRole('heading', { name: 'When do you move in?' }).click();


  await page.getByRole('button', { name: 'Next', exact: true }).hover();
  await page.getByRole('button', { name: 'Next', exact: true }).click();


  await page.getByLabel('Date of Birth').fill('1991-06-02');
  //await page.locator('[id="\\:rf\\:-form-item"]').click();
  //await page.getByRole('combobox').click();
  //await page.getByLabel('SSN').click();
  await page.locator('[id="\\:rf\\:-form-item"]').click();
  await page.locator('[id="\\:rf\\:-form-item"]').fill('464-95-59599');
  await page.locator('#onboardingAddress').click();
  await page.waitForTimeout(100);
  await page.locator('#onboardingAddress').fill('808 Chicago AveDixon, IL');
  await page.getByText('808 Chicago AveDixon, IL').click();
  await page.waitForTimeout(100);
  await page.getByRole('heading', { name: 'Identity Information' }).click();





  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(500);


  await expect(page.getByText('Account Number:')).toBeVisible();
  await expect(page.getByText('Success🥳Your account is set')).toBeVisible();
});