import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://dev.publicgrid.energy/move-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // Step 1: Terms - check checkbox and click get started
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.check();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /get started/i }).click();
    await page.waitForTimeout(3000);
    
    // Step 2: Enter address using #address selector (like actual test)
    const addressField = page.locator('#address');
    await addressField.click({ timeout: 10000 });
    await addressField.pressSequentially('88 S 1st StBrooklyn, NY 11249, USA', { delay: 50 });
    await page.waitForTimeout(3000);
    await addressField.press('Backspace');
    await page.waitForTimeout(3000);
    
    // Try to find and click address dropdown
    const options = await page.locator('[role="option"], li').allTextContents();
    console.log('Dropdown options:', JSON.stringify(options.slice(0, 5)));
    
    // Click first option that has Brooklyn
    const brooklynOption = page.locator('[role="option"]:has-text("Brooklyn"), li:has-text("Brooklyn")').first();
    if (await brooklynOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await brooklynOption.click();
        console.log('Clicked Brooklyn option');
    } else {
        // Try the span/text approach
        const brooklynText = page.getByText(/Brooklyn.*NY/i).first();
        if (await brooklynText.isVisible({ timeout: 3000 }).catch(() => false)) {
            await brooklynText.click();
            console.log('Clicked Brooklyn text');
        } else {
            console.log('Could not find Brooklyn dropdown option');
            await page.screenshot({ path: 'debug-no-dropdown.png' });
        }
    }
    await page.waitForTimeout(2000);
    
    // Fill unit
    const unitField = page.locator('input[name="unitNumber"]');
    await unitField.click();
    await unitField.fill('123');
    await page.waitForTimeout(1000);
    
    // Click Continue
    await page.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'debug-after-address-submit.png' });
    console.log('After address URL:', page.url());
    
    // Check what's on page
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Headings:', JSON.stringify(headings));
    const btns = await page.locator('button:visible').allTextContents();
    console.log('Buttons:', JSON.stringify(btns));
    const spans = await page.locator('span:visible').allTextContents();
    const uniqueSpans = [...new Set(spans.filter(s => s.trim().length > 2 && s.trim().length < 100))];
    console.log('Spans:', JSON.stringify(uniqueSpans.slice(0, 20)));
    
    // Check for ESCO modal
    const gotIt = page.locator('button:has-text("Got it!")');
    const gotItCount = await gotIt.count();
    console.log('Got it! buttons:', gotItCount);
    
    // Check for dialog
    const dialogs = await page.locator('[role="dialog"], [role="alertdialog"]').count();
    console.log('Dialogs:', dialogs);
    
    if (gotItCount > 0) {
        await gotIt.last().click({ force: true });
        await page.waitForTimeout(3000);
        console.log('=== AFTER ESCO DISMISS ===');
        await page.screenshot({ path: 'debug-after-esco-dismiss.png' });
        const h2 = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
        console.log('Headings:', JSON.stringify(h2));
        const btns2 = await page.locator('button:visible').allTextContents();
        console.log('Buttons:', JSON.stringify(btns2));
        const labels2 = await page.locator('label:visible').allTextContents();
        console.log('Labels:', JSON.stringify(labels2.slice(0, 15)));
        const spans2 = await page.locator('span:visible').allTextContents();
        const us2 = [...new Set(spans2.filter(s => s.trim().length > 2 && s.trim().length < 100))];
        console.log('Spans:', JSON.stringify(us2.slice(0, 20)));
        
        // Check for "About you" or similar
        const aboutYou = page.getByText('About you', { exact: true });
        const aboutVisible = await aboutYou.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('About you visible:', aboutVisible);
        
        // Check for utility setup
        const utilSetup = page.getByRole('heading', { name: 'Choose how to start service' });
        const utilVisible = await utilSetup.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Utility setup visible:', utilVisible);
    }
    
    await browser.close();
})();
