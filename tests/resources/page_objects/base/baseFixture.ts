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
import { UploadBillModalPage } from '../upload_bill_modal_page';
import { ConnectUtilityModalPage } from '../connect_utility_modal_page';
import { FinishRegistrationPage } from '../finish_registration_page';

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
  uploadBillModalPage: UploadBillModalPage;
  connectUtilityModalPage: ConnectUtilityModalPage;
  finishRegistrationPage: FinishRegistrationPage;
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

  uploadBillModalPage: async ({ page }, use) => {
    await use(new UploadBillModalPage(page));
  },

  connectUtilityModalPage: async ({ page }, use) => {
    await use(new ConnectUtilityModalPage(page));
  },

  finishRegistrationPage: async ({ page }, use) => {
    await use(new FinishRegistrationPage(page));
  },
});

export const test = testPages;
export const expect = testPages.expect;
