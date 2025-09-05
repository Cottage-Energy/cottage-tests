import { Page } from '@playwright/test';

export class ViewportUtils {
    static async setStandardViewport(page: Page): Promise<void> {
        // Set viewport size
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // Force zoom level to 100%
        await page.evaluate(() => {
            document.body.style.zoom = '1';
            (document.documentElement.style as any).zoom = '1';
        });
        
        // Disable browser zoom and scaling
        await page.evaluate(() => {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.getElementsByTagName('head')[0].appendChild(meta);
        });
        
        // Set CSS to prevent any responsive resizing
        await page.addStyleTag({
            content: `
                * {
                    -webkit-text-size-adjust: none !important;
                    -moz-text-size-adjust: none !important;
                    -ms-text-size-adjust: none !important;
                    text-size-adjust: none !important;
                }
                html, body {
                    width: 1920px !important;
                    min-width: 1920px !important;
                    overflow-x: auto !important;
                }
            `
        });
        
        // Wait for any layout changes to settle
        await page.waitForTimeout(500);
    }
    
    static async ensureFullWidth(page: Page): Promise<void> {
        await page.evaluate(() => {
            // Force the body to use full width
            document.body.style.width = '1920px';
            document.body.style.minWidth = '1920px';
            
            // Remove any max-width constraints
            const allElements = document.querySelectorAll('*');
            allElements.forEach((element) => {
                const computedStyle = window.getComputedStyle(element as Element);
                if (computedStyle.maxWidth && computedStyle.maxWidth !== 'none') {
                    (element as HTMLElement).style.maxWidth = 'none';
                }
            });
        });
    }
}
