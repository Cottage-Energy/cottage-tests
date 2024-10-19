import { test as base } from '@playwright/test';
import { MoveInPage }  from '../page_objects/move_in_page';
import { HomePage } from '../page_objects/homepage';
import { SidebarChat } from '../page_objects/sidebar_chat';
import { OverviewPage } from '../page_objects/overview_dashboard_page';
import { BillingPage } from '../page_objects/billing_page';
import { ServicesPage } from '../page_objects/services_page';
import { ProfilePage } from '../page_objects/account_profile_page';


type pages = {
    homepage: HomePage,
    sidebarChat: SidebarChat,
    moveInpage: MoveInPage,
    overviewPage: OverviewPage,
    billingPage: BillingPage
    servicesPage: ServicesPage
    profilePage: ProfilePage
}


const testPages = base.extend<pages>({
    
    homepage: async ({page},use) => {
        await use(new HomePage(page));
    },

    sidebarChat: async ({page},use) => {
        await use(new SidebarChat(page));
    },

    moveInpage: async ({page},use) => {
        await use(new MoveInPage(page));
    },

    overviewPage: async ({page},use) => {
        await use(new OverviewPage(page));
    },

    billingPage: async ({page},use) => {
        await use(new BillingPage(page));
    },

    servicesPage: async ({page},use) => {
        await use(new ServicesPage(page));
    },

    profilePage: async ({page},use) => {
        await use(new ProfilePage(page));
    },


})

export const test = testPages;
export const expect = testPages.expect;