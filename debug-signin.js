const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to sign-in page to see what it looks like
  await page.goto('https://dev.publicgrid.energy/sign-in', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Headings:', JSON.stringify(headings));
  const buttons = await page.locator('button').allTextContents();
  console.log('Buttons:', JSON.stringify(buttons));
  const inputs = await page.locator('input').allTextContents();
  console.log('Input count:', await page.locator('input').count());
  const labels = await page.locator('label').allTextContents();
  console.log('Labels:', JSON.stringify(labels));
  
  const bodyText = await page.locator('body').innerText();
  const lines = bodyText.split('\n').filter(l => l.trim()).slice(0, 30);
  console.log('Text:', JSON.stringify(lines));
  
  await page.screenshot({ path: 'debug-signin-page.png', fullPage: true });
  console.log('Screenshot saved');
  
  await browser.close();
})();
