import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://dev.publicgrid.energy/move-in', { waitUntil: 'domcontentloaded' });
    
    // Step 1: Terms
    await page.waitForTimeout(3000);
    const agreeCheckbox = page.getByRole('checkbox');
    if (await agreeCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await agreeCheckbox.check();
    }
    const getStarted = page.getByRole('button', { name: /get started/i });
    if (await getStarted.isVisible({ timeout: 5000 }).catch(() => false)) {
        await getStarted.click();
    }
    await page.waitForTimeout(3000);

    // Step 2: Enter address
    const addressInput = page.getByRole('combobox');
    await addressInput.fill('88 S 1st St');
    await page.waitForTimeout(3000);
    const suggestion = page.getByText('Brooklyn').first();
    if (await suggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
        await suggestion.click();
    }
    await page.waitForTimeout(2000);
    
    // Unit number
    const unitField = page.locator('input[placeholder*="Apt"]').first();
    if (await unitField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await unitField.fill('123');
    }
    await page.waitForTimeout(1000);
    
    // Click Continue
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await continueBtn.click();
    await page.waitForTimeout(5000);
    
    // Take screenshot after address
    await page.screenshot({ path: 'debug-after-address.png' });
    console.log('URL after address:', page.url());
    
    // Check for ESCO modal
    const gotIt = page.locator('button:has-text("Got it!")');
    const gotItCount = await gotIt.count();
    console.log('Got it! buttons:', gotItCount);
    
    if (gotItCount > 0) {
        await gotIt.last().click({ force: true });
        await page.waitForTimeout(3000);
        console.log('Clicked Got it!');
    }
    
    await page.screenshot({ path: 'debug-after-esco.png' });
    console.log('URL after ESCO:', page.url());
    
    // Print all visible headings/text
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Headings:', JSON.stringify(headings));
    
    const allText = await page.locator('p, span, label, div').allTextContents();
    const uniqueText = [...new Set(allText.filter(t => t.trim().length > 2 && t.trim().length < 80))];
    console.log('Visible text (unique):', JSON.stringify(uniqueText.slice(0, 30)));
    
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons:', JSON.stringify(buttons));
    
    await browser.close();
})();
