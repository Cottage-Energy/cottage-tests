import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://dev.publicgrid.energy/move-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // Step 1: Terms
    await page.getByRole('checkbox').first().check();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /get started/i }).click();
    await page.waitForTimeout(3000);
    
    // Step 2: Address
    const addressField = page.locator('#address');
    await addressField.click({ timeout: 10000 });
    await addressField.pressSequentially('88 S 1st StBrooklyn, NY 11249, USA', { delay: 50 });
    await page.waitForTimeout(3000);
    await addressField.press('Backspace');
    await page.waitForTimeout(3000);
    await page.getByText(/Brooklyn.*NY/i).first().click();
    await page.waitForTimeout(2000);
    await page.locator('input[name="unitNumber"]').fill('123');
    await page.waitForTimeout(1000);
    
    // Click Continue on address
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(5000);
    console.log('=== After Address Continue ===');
    
    // Step 3: Utility Setup page
    const utilSetup = page.getByRole('heading', { name: 'Choose how to start service' });
    const utilVisible = await utilSetup.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Utility setup visible:', utilVisible);
    
    // Click Continue on Utility Setup
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'debug-after-utility-continue.png' });
    console.log('=== After Utility Setup Continue ===');
    console.log('URL:', page.url());
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Headings:', JSON.stringify(headings));
    const btns = await page.locator('button:visible').allTextContents();
    console.log('Buttons:', JSON.stringify(btns));
    
    // Check for ESCO
    const gotIt = page.locator('button:has-text("Got it!")');
    const gotItCount = await gotIt.count();
    console.log('Got it! buttons:', gotItCount);
    
    // Check for dialog
    const dialogs = await page.locator('[role="dialog"], [role="alertdialog"]').count();
    console.log('Dialogs:', dialogs);
    
    // Check for "About you"
    const aboutYou = await page.getByText('About you', { exact: true }).isVisible({ timeout: 3000 }).catch(() => false);
    console.log('About you visible:', aboutYou);
    
    // Get all visible text
    const allText = await page.locator('p:visible').allTextContents();
    console.log('Paragraphs:', JSON.stringify(allText.slice(0, 10)));
    
    const spans = await page.locator('span:visible').allTextContents();
    const us = [...new Set(spans.filter(s => s.trim().length > 2 && s.trim().length < 100))];
    console.log('Spans:', JSON.stringify(us.slice(0, 20)));
    
    if (gotItCount > 0) {
        await gotIt.last().click({ force: true });
        await page.waitForTimeout(3000);
        console.log('=== After ESCO Dismiss ===');
        await page.screenshot({ path: 'debug-after-esco-final.png' });
        const h2 = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
        console.log('Headings:', JSON.stringify(h2));
        const aboutYou2 = await page.getByText('About you', { exact: true }).isVisible({ timeout: 3000 }).catch(() => false);
        console.log('About you visible:', aboutYou2);
        const spans2 = await page.locator('span:visible').allTextContents();
        const us2 = [...new Set(spans2.filter(s => s.trim().length > 2 && s.trim().length < 100))];
        console.log('Spans:', JSON.stringify(us2.slice(0, 20)));
    }
    
    await browser.close();
})();
