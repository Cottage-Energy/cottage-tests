import { test as base } from '@playwright/test';
import { MoveInPage }  from '../move_in_page';
import { FinishAccountSetupPage } from '../finish_account_setup_page';
import { HomePage } from '../homepage';
import { SidebarChat } from '../sidebar_chat';
import { OverviewPage } from '../overview_dashboard_page';
import { BillingPage } from '../billing_page';
import { ServicesPage } from '../services_page';
import { ProfilePage } from '../account_profile_page';
import { BillUploadPage } from '../bill_upload_page';
import { SupabaseQueries } from '../../fixtures/database_queries';
import { PlaneActions } from '../../fixtures/plane_actions';
import { ViewportUtils } from '../../utils/viewportUtils';


type pages = {
    homepage: HomePage,
    sidebarChat: SidebarChat,
    moveInpage: MoveInPage,
    finishAccountSetupPage: FinishAccountSetupPage,
    overviewPage: OverviewPage,
    billingPage: BillingPage
    servicesPage: ServicesPage
    profilePage: ProfilePage
    billUploadPage: BillUploadPage

    supabaseQueries: SupabaseQueries
    planeActions: PlaneActions
}


const testPages = base.extend<pages>({
    
    homepage: async ({page},use) => {
        // Set consistent viewport and zoom level
        await ViewportUtils.setStandardViewport(page);
        await use(new HomePage(page));
    },

    sidebarChat: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new SidebarChat(page));
    },

    moveInpage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new MoveInPage(page));
    },

    finishAccountSetupPage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new FinishAccountSetupPage(page));
    },

    overviewPage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new OverviewPage(page));
    },

    billingPage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new BillingPage(page));
    },

    servicesPage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new ServicesPage(page));
    },

    profilePage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new ProfilePage(page));
    },

    billUploadPage: async ({page},use) => {
        await ViewportUtils.setStandardViewport(page);
        await use(new BillUploadPage(page));
    },

    supabaseQueries: async ({page},use) => {
        await use(new SupabaseQueries());
    },
    planeActions: async ({page},use) => {
        await use(new PlaneActions());
    },


})

export const test = testPages;
export const expect = testPages.expect;