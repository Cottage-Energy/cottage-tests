import { type Page, type Locator, expect } from '@playwright/test';

export class ServicesPage {
    //variables
    readonly page: Page;
    readonly Services_Page_Title: Locator;
    readonly Services_Not_Receiving_Power: Locator;
    readonly Services_View_Outage_Map: Locator;
    readonly Services_Outage_Section: Locator;
    

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Services_Page_Title = page.locator('p:has-text("Not Receiving Power?"):visible').first();
        this.Services_Not_Receiving_Power = page.locator('button:has-text("Report an outage"):visible');
        this.Services_View_Outage_Map = page.locator('p:has-text("View outage map"):visible').first();
        this.Services_Outage_Section = page.locator('p:has-text("Outage Services"):visible').first();
    }

    //methods



    //assertions
    async Services_Check_Page_Content() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('load');
        await expect(this.page).toHaveURL(/.*\/app\/services.*/, {timeout:30000});
        await expect(this.Services_Page_Title).toBeVisible({timeout:30000});
        await expect(this.Services_Not_Receiving_Power).toBeVisible({timeout:30000});
        await expect(this.Services_View_Outage_Map).toBeVisible({timeout:30000});
        await expect(this.Services_Outage_Section).toBeVisible({timeout:30000});
    }


}




export default ServicesPage;
