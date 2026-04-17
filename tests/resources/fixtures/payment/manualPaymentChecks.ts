/**
 * Manual payment check methods — card and bank, electric/gas/combined.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
import { SidebarChat } from '../../page_objects/sidebar_chat';
import { OverviewPage } from '../../page_objects/overview_dashboard_page';
import { BillingPage } from '../../page_objects/billing_page';
import { ProfilePage } from '../../page_objects/account_profile_page';
import { billQueries, paymentQueries, blnkQueries } from '../database';
import { FastmailActions } from '../fastmail_actions';
import { logger } from '../../utils/logger';
import type { MoveInResult } from '../../types';
import type { TestUser } from '../../types';


export class ManualPaymentChecks {

    async Manual_Card_Payment_Electric_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        ElectricAccountId: string
    ): Promise<void> {

        await test.step('Get Electric Bill ID and validate', async () => {
            const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify manual payment initial checks', async () => {
            await Promise.all([
                billQueries.checkElectricBillReminder(ElectricAccountId, true),
            ]);
        });

        await test.step('Validate initial platform state', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Not_Visible(),
            ]);
        });

        await test.step('Check initial billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await Promise.all([
                billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Outstanding_Balance_Amount(0)
            ]);
        });

        let ElectriBillID: string;
        await test.step('Process bill approval for manual payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
            await page.waitForTimeout(10000);

            ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            await billQueries.approveElectricBill(ElectriBillID);
            await page.waitForTimeout(10000);

            await billQueries.checkElectricBillStatus(ElectricAccountId, "waiting_for_user");
            await billQueries.checkElectricBillVisibility(ElectricAccountId, true);
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Button_Visible(),
            overviewPage.Check_Pay_Bill_Button_Enabled(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Check_Pay_Outstanding_Balance_Modal();
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
        ]);
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),

        ]);

        // BLNK Ledger Verification (migration safety)
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Manual card electric payment ${payment.id} — chain verified`);
        }
    }


    async Manual_Card_Payment_Electric_Gas_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        ElectricAccountId: string,
        GasAccountId: string
    ) {

        await test.step('Get Electric and Gas Bill IDs and validate', async () => {
            const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify manual payment initial checks', async () => {
            await billQueries.checkElectricBillVisibility(ElectricAccountId, false);
            await billQueries.checkElectricBillReminder(ElectricAccountId, true);
            await billQueries.checkGasBillVisibility(GasAccountId, false);
            await billQueries.checkGasBillReminder(GasAccountId, true);
        });

        await test.step('Validate initial platform state', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            ]);
        });

        await test.step('Check initial billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
            await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
            await billingPage.Check_Outstanding_Balance_Amount(0);
        });

        let ElectriBillID: string;
        let GasBillID: string;
        await test.step('Process bill approval for manual payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
            await billQueries.checkGasBillPaidNotif(GasAccountId, false);
            await page.waitForTimeout(10000);

            ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

            await Promise.all([
                billQueries.approveElectricBill(ElectriBillID),
                billQueries.approveGasBill(GasBillID)
            ]);
            await page.waitForTimeout(10000);

            await Promise.all([
                billQueries.checkElectricBillStatus(ElectricAccountId, "waiting_for_user"),
                billQueries.checkGasBillStatus(GasAccountId, "waiting_for_user"),
            ]);
        });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
          //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Button_Visible(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),

        ]);
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
      const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
      await billingPage.Check_Pay_Bill_Button_Visible_Enable();
      await Promise.all([
          billQueries.checkElectricBillVisibility(ElectricAccountId, true),
          billQueries.checkGasBillVisibility(GasAccountId, true),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Electric_Bill_Is_Ready_For_Payment(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Gas_Bill_Is_Ready_For_Payment(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
      ]);

      await billingPage.Click_Pay_Bill_Button();
      await billingPage.Check_Pay_Outstanding_Balance_Modal();
      await billingPage.Submit_Pay_Bill_Modal();
      await billQueries.checkElectricBillProcessing(ElectricAccountId);
      await billQueries.checkGasBillProcessing(GasAccountId);

      await Promise.all([
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
        billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing")
      ]);


      await Promise.all([
          billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
          billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
      ]);


      await Promise.all([
        billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
        billQueries.checkGasBillPaidNotif(GasAccountId, true),
    ]);

      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          billingPage.Check_Outstanding_Balance_Amount(0),

          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),

          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),

          FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal),
          FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
          //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        // BLNK Ledger Verification (migration safety)
        const elecPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (elecPayment) {
            await blnkQueries.verifyFeeCalculation(elecPayment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(elecPayment.id);
            logger.info(`BLNK PASS: Manual card electric payment ${elecPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Manual card gas payment ${gasPayment.id} — chain verified`);
        }
    }




    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Manual Card Payment - Gas Only

    async Manual_Card_Payment_Gas_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        GasAccountId: string
    ) {
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);

        let GasBillIDApproved: string;
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);

        GasBillIDApproved = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await billQueries.approveGasBill(GasBillIDApproved);
        await page.waitForTimeout(10000);

        await billQueries.checkGasBillStatus(GasAccountId, "waiting_for_user");
        await billQueries.checkGasBillVisibility(GasAccountId, true);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            overviewPage.Check_Pay_Bill_Button_Visible(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);

        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Check_Pay_Outstanding_Balance_Modal();
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkGasBillProcessing(GasAccountId);

        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await billQueries.checkGasBillPaidNotif(GasAccountId, true);

        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal)
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (migration safety)
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Manual card gas payment ${gasPayment.id} — chain verified`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Manual Bank Payment - Electric Only

    async Manual_Bank_Payment_Electric_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        ElectricAccountId: string
    ): Promise<void> {
        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        await Promise.all([
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectriBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);

        let ElectriBillIDApproved: string;
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await page.waitForTimeout(10000);

        ElectriBillIDApproved = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await billQueries.approveElectricBill(ElectriBillIDApproved);
        await page.waitForTimeout(10000);

        await billQueries.checkElectricBillStatus(ElectricAccountId, "waiting_for_user");
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            overviewPage.Check_Pay_Bill_Button_Visible(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectriBillIDApproved, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);

        // Bank payment — no fee (amount = bill amount only)
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Check_Pay_Outstanding_Balance_Modal();
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkElectricBillProcessing(ElectricAccountId);

        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");

        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, true);

        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual)
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (bank: zero fee)
        const bankPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);
        if (bankPayment) {
            await blnkQueries.verifyFeeCalculation(bankPayment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(bankPayment.id);
            logger.info(`BLNK PASS: Manual bank electric payment ${bankPayment.id} — chain verified, zero fee`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Manual Bank Payment - Electric + Gas

    async Manual_Bank_Payment_Electric_Gas_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        ElectricAccountId: string,
        GasAccountId: string
    ) {
        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();

        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);

        let ElectriBillIDApproved = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        let GasBillIDApproved = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.approveElectricBill(ElectriBillIDApproved),
            billQueries.approveGasBill(GasBillIDApproved)
        ]);
        await page.waitForTimeout(10000);

        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "waiting_for_user"),
            billQueries.checkGasBillStatus(GasAccountId, "waiting_for_user"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true),
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
        ]);

        // Bank payment — no fee
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Check_Pay_Outstanding_Balance_Modal();
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await billQueries.checkGasBillProcessing(GasAccountId);

        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
            billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
        ]);

        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
        ]);

        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (bank: zero fee)
        const elecPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);
        if (elecPayment) {
            await blnkQueries.verifyFeeCalculation(elecPayment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(elecPayment.id);
            logger.info(`BLNK PASS: Manual bank electric payment ${elecPayment.id} — chain verified, zero fee`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmount);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Manual bank gas payment ${gasPayment.id} — chain verified, zero fee`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Manual Bank Payment - Gas Only

    async Manual_Bank_Payment_Gas_Checks(
        page: Page,
        overviewPage: OverviewPage,
        billingPage: BillingPage,
        sidebarChat: SidebarChat,
        MoveIn: MoveInResult,
        PGuserUsage: TestUser,
        GasAccountId: string
    ) {
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);

        let GasBillIDApproved: string;
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);

        GasBillIDApproved = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await billQueries.approveGasBill(GasBillIDApproved);
        await page.waitForTimeout(10000);

        await billQueries.checkGasBillStatus(GasAccountId, "waiting_for_user");
        await billQueries.checkGasBillVisibility(GasAccountId, true);

        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            overviewPage.Check_Pay_Bill_Button_Visible(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);

        // Bank payment — no fee
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Check_Pay_Outstanding_Balance_Modal();
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkGasBillProcessing(GasAccountId);

        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing");

        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await billQueries.checkGasBillPaidNotif(GasAccountId, true);

        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);

        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (bank: zero fee)
        const bankPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmount);
        if (bankPayment) {
            await blnkQueries.verifyFeeCalculation(bankPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(bankPayment.id);
            logger.info(`BLNK PASS: Manual bank gas payment ${bankPayment.id} — chain verified, zero fee`);
        }
    }
}
