import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://dev.publicgrid.energy/move-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'debug-step1.png' });
    console.log('Step 1 URL:', page.url());
    
    // Print what's on the page
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Headings:', JSON.stringify(headings));
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons:', JSON.stringify(buttons));
    const inputs = await page.locator('input').count();
    console.log('Input fields:', inputs);
    const checkboxes = await page.locator('[role="checkbox"], input[type="checkbox"]').count();
    console.log('Checkboxes:', checkboxes);
    
    await browser.close();
})();
