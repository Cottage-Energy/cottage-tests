import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://dev.publicgrid.energy/move-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // Step 1: Terms and Get Started
    const checkbox = page.getByRole('checkbox').first();
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkbox.check();
    }
    await page.waitForTimeout(500);
    const getStarted = page.getByRole('button', { name: /get started/i });
    await getStarted.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'debug-step2-address.png' });
    console.log('Step 2 URL:', page.url());
    const h2 = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Step 2 Headings:', JSON.stringify(h2));
    
    // Step 2: Enter address - find the address input
    const allInputs = await page.locator('input:visible').all();
    console.log('Visible inputs:', allInputs.length);
    for (let i = 0; i < allInputs.length; i++) {
        const ph = await allInputs[i].getAttribute('placeholder');
        const type = await allInputs[i].getAttribute('type');
        console.log(`  Input ${i}: placeholder="${ph}" type="${type}"`);
    }
    
    // Try filling address
    const addressInput = page.locator('input[placeholder*="address" i], input[placeholder*="street" i], input[placeholder*="enter" i]').first();
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addressInput.fill('88 S 1st St');
        await page.waitForTimeout(3000);
        // Click suggestion
        const suggestion = page.locator('[role="option"], [role="listbox"] >> text=Brooklyn').first();
        if (await suggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
            await suggestion.click();
        } else {
            // Try generic text match
            const brooklynText = page.getByText('Brooklyn').first();
            if (await brooklynText.isVisible({ timeout: 3000 }).catch(() => false)) {
                await brooklynText.click();
            }
        }
        await page.waitForTimeout(2000);
    } else {
        console.log('No address input found with expected placeholder');
        // Try combobox
        const combo = page.getByRole('combobox');
        if (await combo.isVisible({ timeout: 3000 }).catch(() => false)) {
            await combo.fill('88 S 1st St');
            await page.waitForTimeout(3000);
            const brooklynText = page.getByText('Brooklyn').first();
            if (await brooklynText.isVisible({ timeout: 5000 }).catch(() => false)) {
                await brooklynText.click();
            }
            await page.waitForTimeout(2000);
        }
    }
    
    await page.screenshot({ path: 'debug-step2b-filled.png' });
    
    // Unit field
    const unitField = page.locator('input').filter({ hasText: '' }).nth(1);
    const allInputs2 = await page.locator('input:visible').all();
    for (let i = 0; i < allInputs2.length; i++) {
        const ph = await allInputs2[i].getAttribute('placeholder');
        console.log(`  After fill - Input ${i}: placeholder="${ph}"`);
    }
    
    // Click Continue
    const continueBtn = page.getByRole('button', { name: /continue/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: 'debug-step3-after-continue.png' });
    console.log('Step 3 URL:', page.url());
    const h3 = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Step 3 Headings:', JSON.stringify(h3));
    const btns3 = await page.locator('button:visible').allTextContents();
    console.log('Step 3 Buttons:', JSON.stringify(btns3));
    
    // Check for ESCO modal
    const gotIt = page.locator('button:has-text("Got it!")');
    const gotItCount = await gotIt.count();
    console.log('Got it! buttons:', gotItCount);
    
    if (gotItCount > 0) {
        await gotIt.last().click({ force: true });
        await page.waitForTimeout(3000);
        console.log('Clicked Got it!');
        
        // Check if still visible
        const stillCount = await gotIt.count();
        if (stillCount > 0) {
            await gotIt.first().click({ force: true });
            await page.waitForTimeout(3000);
        }
    }
    
    await page.screenshot({ path: 'debug-step4-after-esco.png' });
    console.log('Step 4 URL:', page.url());
    const h4 = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Step 4 Headings:', JSON.stringify(h4));
    const btns4 = await page.locator('button:visible').allTextContents();
    console.log('Step 4 Buttons:', JSON.stringify(btns4));
    const labels = await page.locator('label:visible').allTextContents();
    console.log('Step 4 Labels:', JSON.stringify(labels.slice(0, 15)));
    const spans = await page.locator('span:visible').allTextContents();
    const uniqueSpans = [...new Set(spans.filter(s => s.trim().length > 2 && s.trim().length < 80))];
    console.log('Step 4 Spans:', JSON.stringify(uniqueSpans.slice(0, 20)));
    
    await browser.close();
})();
