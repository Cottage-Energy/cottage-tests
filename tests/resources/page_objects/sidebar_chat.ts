import { type Page, type Locator, expect } from '@playwright/test';

export class SidebarChat {
    //variables
    readonly page: Page;
    readonly Public_Grid_Icon: Locator;
    readonly Overview_Icon: Locator;
    readonly Billing_Icon: Locator;
    readonly Services_Icon: Locator;
    readonly Support_Icon: Locator;

    readonly Public_Grid_Logo: Locator;
    readonly Collapse_Arrow: Locator;
    readonly Overivew_Link: Locator;
    readonly Billing_Link: Locator;
    readonly Services_Link: Locator;
    readonly Support_Link: Locator;

    readonly Chat_Icon: Locator;
    readonly Chat_Window: Locator;
    readonly Close_Chat_Icon: Locator;

    readonly Overview_Page_Usage_Chart_Title: Locator;
    readonly Billing_Page_Title: Locator;
    readonly Services_Page_Title: Locator;
    readonly Support_Page_Title: Locator;





    //locators
    constructor(page: Page) {
        this.page = page;
        this.Public_Grid_Icon = page.locator('path').first();
        this.Overview_Icon = page.locator('a').filter({ hasText: 'Overview' });
        this.Billing_Icon = page.locator('a').filter({ hasText: /^Billing$/ });
        this.Services_Icon = page.locator('a').filter({ hasText: 'Services' });
        this.Support_Icon = page.locator('a').filter({ hasText: 'Support' });
        this.Public_Grid_Logo = page.locator('.side-bar-links').first();
        this.Collapse_Arrow = page.getByRole('main').getByRole('button');
        this.Overivew_Link = page.getByRole('link', { name: 'Overview' });
        this.Billing_Link = page.getByRole('link', { name: 'Billing', exact: true });
        this.Services_Link = page.getByRole('link', { name: 'Services' });
        this.Support_Link = page.getByRole('link', { name: 'Support' });
        this.Chat_Icon = page.getByLabel('Open chat');
        this.Chat_Window = page.locator('div').filter({ hasText: /^Public GridHow can we help with Public Grid\?$/ }).nth(1);
        this.Close_Chat_Icon = page.getByRole('button', { name: 'Close chat' });

        this.Overview_Page_Usage_Chart_Title = page.getByRole('heading', { name: 'Energy Usage Details' });
        this.Billing_Page_Title = page.getByRole('heading', { name: 'Billing', exact: true });
        this.Services_Page_Title = page.getByRole('heading', { name: 'Services', exact: true });
        this.Support_Page_Title = page.getByRole('heading', { name: 'We are here to help' });
    }


    //methods
    async Expand_Sidebar(){
        await expect(this.Public_Grid_Icon).toBeEnabled({timeout:30000});
        await this.Public_Grid_Icon.hover();
        await this.Public_Grid_Icon.click();
        await expect(this.Public_Grid_Logo).toBeVisible({timeout:30000});
    }

    async Goto_Overview_Page_Via_Icon(){
        await expect(this.Overview_Icon).toBeEnabled({timeout:30000});
        await this.Overview_Icon.hover();
        await this.Overview_Icon.click();
        await expect(this.Overview_Page_Usage_Chart_Title).toBeVisible({timeout:30000});
    }

    async Goto_Billing_Page_Via_Icon(){
        await expect(this.Billing_Icon).toBeEnabled({timeout:30000});
        await this.Billing_Icon.hover();
        await this.Billing_Icon.click();
        await expect(this.Billing_Page_Title).toBeVisible({timeout:30000});
    }

    async Goto_Service_Page_Via_Icon(){
        await expect(this.Services_Icon).toBeEnabled({timeout:30000});
        await this.Services_Icon.hover();
        await this.Services_Icon.click();
        await expect(this.Services_Page_Title).toBeVisible({timeout:30000});
    }

    async Goto_Support_Page_Via_Icon(){
        await expect(this.Support_Icon).toBeEnabled({timeout:30000});
        await this.Support_Icon.hover();
        await this.Support_Icon.click();
        await expect(this.Support_Page_Title).toBeVisible({timeout:30000});
    }

}

export default SidebarChat;