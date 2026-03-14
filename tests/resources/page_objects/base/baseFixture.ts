import { test as base } from '@playwright/test';
import { MoveInPage } from '../move_in_page';
import { HomePage } from '../homepage';
import { SidebarChat } from '../sidebar_chat';
import { OverviewPage } from '../overview_dashboard_page';
import { BillingPage } from '../billing_page';
import { ServicesPage } from '../services_page';
import { ProfilePage } from '../account_profile_page';
import { BillUploadPage } from '../bill_upload_page';
import { ConnectPage } from '../connect_page';
import { ConnectOverviewPage } from '../connect_overview_page';
import { BillUploadModalPage } from '../bill_upload_modal_page';
import { ConnectUtilityModalPage } from '../connect_utility_modal_page';

/**
 * Page object fixtures type definition
 */
interface PageFixtures {
  homepage: HomePage;
  sidebarChat: SidebarChat;
  moveInpage: MoveInPage;
  overviewPage: OverviewPage;
  billingPage: BillingPage;
  servicesPage: ServicesPage;
  profilePage: ProfilePage;
  billUploadPage: BillUploadPage;
  connectPage: ConnectPage;
  connectOverviewPage: ConnectOverviewPage;
  billUploadModalPage: BillUploadModalPage;
  connectUtilityModalPage: ConnectUtilityModalPage;
}

/**
 * Extended test fixture with all page objects
 */
const testPages = base.extend<PageFixtures>({
  homepage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  sidebarChat: async ({ page }, use) => {
    await use(new SidebarChat(page));
  },

  moveInpage: async ({ page }, use) => {
    await use(new MoveInPage(page));
  },

  overviewPage: async ({ page }, use) => {
    await use(new OverviewPage(page));
  },

  billingPage: async ({ page }, use) => {
    await use(new BillingPage(page));
  },

  servicesPage: async ({ page }, use) => {
    await use(new ServicesPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  billUploadPage: async ({ page }, use) => {
    await use(new BillUploadPage(page));
  },

  connectPage: async ({ page }, use) => {
    await use(new ConnectPage(page));
  },

  connectOverviewPage: async ({ page }, use) => {
    await use(new ConnectOverviewPage(page));
  },

  billUploadModalPage: async ({ page }, use) => {
    await use(new BillUploadModalPage(page));
  },

  connectUtilityModalPage: async ({ page }, use) => {
    await use(new ConnectUtilityModalPage(page));
  },
});

export const test = testPages;
export const expect = testPages.expect;
