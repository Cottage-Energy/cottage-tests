import { type Page, type Locator, expect } from '@playwright/test';

export class ServicesPage {
    //variables
    readonly page: Page;
    readonly Services_Page_Title: Locator;
    readonly Services_New_Address_Section: Locator;
    readonly Services_Stop_Service_Section: Locator;
    readonly Services_Outage_Section: Locator;
    

    //locators
    constructor(page: Page) {
        this.page = page;
        this.Services_Page_Title = page.getByRole('heading', { name: 'Services', exact: true });
        this.Services_New_Address_Section = page.getByText('Moving to a New Address?If');
        this.Services_Stop_Service_Section = page.getByText('Stop ServiceMoving out? Let');
        this.Services_Outage_Section = page.getByText('Outage ServicesPublic Grid');
    }

    //methods



    //assertions
    async Services_Check_Page_Content() {
        await this.page.waitForLoadState('load' && 'domcontentloaded');
        await expect(this.page).toHaveURL(/.*\/app\/services.*/, {timeout:30000});
        await expect(this.Services_Page_Title).toBeVisible({timeout:30000});
        await expect(this.Services_New_Address_Section).toBeVisible({timeout:30000});
        await expect(this.Services_Stop_Service_Section).toBeVisible({timeout:30000});
        await expect(this.Services_Outage_Section).toBeVisible({timeout:30000});
    }


}




export default ServicesPage;