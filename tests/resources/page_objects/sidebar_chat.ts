import { type Page, type Locator, expect } from '@playwright/test';
import { TIMEOUTS } from '../constants';

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

    readonly Overview_Page_Title: Locator;
    readonly Billing_Page_Title: Locator;
    readonly Services_Page_Title: Locator;
    readonly Support_Page_Title: Locator;





    //locators
    constructor(page: Page) {
        this.page = page;
        this.Public_Grid_Icon = page.locator('path').first();
        this.Overview_Icon = page.locator('a').filter({ hasText: 'Overview' });
        this.Billing_Icon = page.locator('a').filter({ hasText: /Billing & Payments/ });
        this.Services_Icon = page.locator('a').filter({ hasText: 'Services' });
        this.Support_Icon = page.locator('a').filter({ hasText: /Support|Household/ });
        this.Public_Grid_Logo = page.locator('.side-bar-links').first();
        this.Collapse_Arrow = page.getByRole('main').getByRole('button');
        this.Overivew_Link = page.getByRole('link', { name: 'Overview' });
        this.Billing_Link = page.getByRole('link', { name: /Billing/ });
        this.Services_Link = page.getByRole('link', { name: 'Services' });
        this.Support_Link = page.getByRole('link', { name: /Support|Household/ });
        this.Chat_Icon = page.getByLabel('Open chat');
        this.Chat_Window = page.locator('div').filter({ hasText: /^Public GridHow can we help with Public Grid\?$/ }).nth(1);
        this.Close_Chat_Icon = page.getByRole('button', { name: 'Close chat' });

        this.Overview_Page_Title = page.getByText(/Welcome|Good (morning|afternoon|evening)/).first();
        this.Billing_Page_Title = page.getByText(/Bills\s*&\s*Payments/).first();
        this.Services_Page_Title = page.getByRole('heading', { name: 'Services', exact: true });
        this.Support_Page_Title = page.getByRole('heading', { name: 'We are here to help' });
    }


    //methods

    /**
     * Wait for any Radix alertdialog overlay to close before interacting with
     * sidebar icons. On TanStack, the password-setup alertdialog renders a
     * fixed overlay div (`data-state="open"`, `opacity-[0.3]`) that intercepts
     * all pointer events. If the dialog is still open when sidebar navigation
     * is attempted, hover/click will hang until test timeout.
     */
    private async Ensure_No_Overlay(): Promise<void> {
        const overlay = this.page.locator('div[data-state="open"][aria-hidden="true"]').first();
        try {
            await overlay.waitFor({ state: 'hidden', timeout: TIMEOUTS.MEDIUM });
        } catch {
            // Overlay still present — likely an undismissed alertdialog. Press Escape
            // to close it (Radix dialogs close on Escape), then wait again.
            await this.page.keyboard.press('Escape');
            await overlay.waitFor({ state: 'hidden', timeout: TIMEOUTS.MEDIUM });
        }
    }

    async Expand_Sidebar(): Promise<void> {
        await this.Ensure_No_Overlay();
        await expect(this.Public_Grid_Icon).toBeEnabled({timeout:TIMEOUTS.DEFAULT});
        await this.Public_Grid_Icon.hover();
        await this.Public_Grid_Icon.click();
        await expect(this.Public_Grid_Logo).toBeVisible({timeout:TIMEOUTS.DEFAULT});
    }

    async Goto_Overview_Page_Via_Icon(): Promise<void> {
        await this.Ensure_No_Overlay();
        await expect(this.Overview_Icon).toBeEnabled({timeout:TIMEOUTS.DEFAULT});
        await this.Overview_Icon.hover();
        await this.Overview_Icon.click();
        await expect(this.Overview_Page_Title).toBeVisible({timeout:TIMEOUTS.DEFAULT});
    }

    async Goto_Billing_Page_Via_Icon(): Promise<void> {
        await this.Ensure_No_Overlay();
        await expect(this.Billing_Icon).toBeEnabled({timeout:TIMEOUTS.DEFAULT});
        await this.Billing_Icon.hover();
        await this.Billing_Icon.click();
        await expect(this.Billing_Page_Title).toBeVisible({timeout:TIMEOUTS.LONG});
    }

    async Goto_Service_Page_Via_Icon(): Promise<void> {
        await this.Ensure_No_Overlay();
        await expect(this.Services_Icon).toBeEnabled({timeout:TIMEOUTS.DEFAULT});
        await this.Services_Icon.hover();
        await this.Services_Icon.click();
        await expect(this.Services_Page_Title).toBeVisible({timeout:TIMEOUTS.DEFAULT});
    }

    async Goto_Support_Page_Via_Icon(): Promise<void> {
        await this.Ensure_No_Overlay();
        await expect(this.Support_Icon).toBeEnabled({timeout:TIMEOUTS.DEFAULT});
        await this.Support_Icon.hover();
        await this.Support_Icon.click();
        await expect(this.Support_Page_Title).toBeVisible({timeout:TIMEOUTS.DEFAULT});
    }

}

export default SidebarChat;
