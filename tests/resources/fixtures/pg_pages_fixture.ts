import { test as base } from '@playwright/test';
import { MoveInPage }  from '../page_objects/move_in_page';
import { HomePage } from '../page_objects/homepage';
import { SidebarChat } from '../page_objects/sidebar_chat';
import { FinishAccountSetupPage } from '../page_objects/finish_account_setup_page';
import { BillingPage } from '../page_objects/billing_page';
import { ServicesPage } from '../page_objects/services_page';


type pages = {
    homepage: HomePage,
    sidebarChat: SidebarChat,
    moveInpage: MoveInPage,
    finishAccountSetupPage: FinishAccountSetupPage,
    billingPage: BillingPage
    servicesPage: ServicesPage
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

    finishAccountSetupPage: async ({page},use) => {
        await use(new FinishAccountSetupPage(page));
    },

    billingPage: async ({page},use) => {
        await use(new BillingPage(page));
    },

    servicesPage: async ({page},use) => {
        await use(new ServicesPage(page));
    },


})

export const test = testPages;
export const expect = testPages.expect;