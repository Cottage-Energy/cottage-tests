/**
 * Failed auto-payment check methods — alert-based and pay-bill-button-based recovery flows.
 */

import type { Page } from '@playwright/test';
import { SidebarChat } from '../../page_objects/sidebar_chat';
import { OverviewPage } from '../../page_objects/overview_dashboard_page';
import { BillingPage } from '../../page_objects/billing_page';
import { ProfilePage } from '../../page_objects/account_profile_page';
import { billQueries, blnkQueries } from '../database';
import { FastmailActions } from '../fastmail_actions';
import { logger } from '../../utils/logger';
import * as PaymentData from '../../data/payment-data.json';
import type { MoveInResult } from '../../types';
import type { TestUser } from '../../types';


export class FailedPaymentChecks {

    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, ElectricAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveElectricBill(ElectriBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Failed auto bank electric recovery ${payment.id} — chain verified`);
        }
    }


    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, ElectricAccountId: string, GasAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await billQueries.checkElectricBillVisibility(ElectricAccountId, false);
        await billQueries.checkElectricBillReminder(ElectricAccountId, true);
        await billQueries.checkGasBillVisibility(GasAccountId, false);
        await billQueries.checkGasBillReminder(GasAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.approveElectricBill(ElectriBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
            billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await Promise.all([
            billQueries.checkElectricBillProcessing(ElectricAccountId),
            billQueries.checkGasBillProcessing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "failed"),
            billQueries.checkGasBillStatus(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Check_Pay_Bill_Button_Visible_Enable(),
        await Promise.all([
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),

        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
            billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);

        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        // BLNK Ledger Verification (migration safety)
        const electricPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (electricPayment) {
            await blnkQueries.verifyFeeCalculation(electricPayment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);
            logger.info(`BLNK PASS: Failed auto bank electric recovery ${electricPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto bank gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, GasAccountId: string){

        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveGasBill(GasBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        await billQueries.checkGasBillVisibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await billQueries.checkGasBillProcessing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkGasBillStatus(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto bank gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Card Auto Payment Failed - Alert Update (user updates card via profile)
    // Models after Bank_Auto_Payment_Failed_Bank_Alert_Update_* but with card fee

    async Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, ElectricAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveElectricBill(ElectriBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        // UPDATE PAYMENT — user clicks failed payment alert, updates to valid card
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, '12/30', '123', 'US', '10001'); // Card update (vs bank in Bank_*_Alert_Update)
        await profilePage.Check_Payment_Initiated_Message();
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });

        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
        ]);
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActualTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (migration safety)
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Failed auto card electric recovery ${payment.id} — chain verified`);
        }
    }


    async Card_Auto_Payment_Failed_Card_Alert_Update_Electric_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, ElectricAccountId: string, GasAccountId: string){

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
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.approveElectricBill(ElectriBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
            billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await Promise.all([
            billQueries.checkElectricBillProcessing(ElectricAccountId),
            billQueries.checkGasBillProcessing(GasAccountId)
        ]);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "failed"),
            billQueries.checkGasBillStatus(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        // UPDATE PAYMENT — user updates to valid card
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, '12/30', '123', 'US', '10001');
        await profilePage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActualTotal),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActualTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (migration safety)
        const electricPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (electricPayment) {
            await blnkQueries.verifyFeeCalculation(electricPayment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);
            logger.info(`BLNK PASS: Failed auto card electric recovery ${electricPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto card gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    async Card_Auto_Payment_Failed_Card_Alert_Update_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, profilePage: ProfilePage, PGuserUsage: TestUser, GasAccountId: string){

        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        await Promise.all([
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveGasBill(GasBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        await billQueries.checkGasBillVisibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
        ]);
        await billQueries.checkGasBillProcessing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkGasBillStatus(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        // UPDATE PAYMENT — user updates to valid card
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber, '12/30', '123', 'US', '10001');
        await profilePage.Check_Payment_Initiated_Message();
        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });

        await billQueries.checkGasBillPaidNotif(GasAccountId, true);
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActualTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);

        // BLNK Ledger Verification (migration safety)
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto card gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, ElectricAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveElectricBill(ElectriBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal)
        ]);
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await overviewPage.Click_Pay_Bill_Button();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual);
        await overviewPage.Submit_Pay_Bill_Modal();
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Failed auto card electric recovery ${payment.id} — chain verified`);
        }
    }


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, ElectricAccountId: string, GasAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await billQueries.checkElectricBillVisibility(ElectricAccountId, false);
        await billQueries.checkElectricBillReminder(ElectricAccountId, true);
        await billQueries.checkGasBillVisibility(GasAccountId, false);
        await billQueries.checkGasBillReminder(GasAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.approveElectricBill(ElectriBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
            billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal, PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await Promise.all([
            billQueries.checkElectricBillProcessing(ElectricAccountId),
            billQueries.checkGasBillProcessing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "failed"),
            billQueries.checkGasBillStatus(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Check_Pay_Bill_Button_Visible_Enable(),
        await Promise.all([
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),

        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await overviewPage.Click_Pay_Bill_Button();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await overviewPage.Submit_Pay_Bill_Modal();
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
            billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);

        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        // BLNK Ledger Verification (migration safety)
        const electricPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (electricPayment) {
            await blnkQueries.verifyFeeCalculation(electricPayment.id, PGuserUsage.ElectricAmount, PGuserUsage.ElectricServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);
            logger.info(`BLNK PASS: Failed auto card electric recovery ${electricPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto card gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, GasAccountId: string){

        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveGasBill(GasBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        await billQueries.checkGasBillVisibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await billQueries.checkGasBillProcessing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkGasBillStatus(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await overviewPage.Click_Pay_Bill_Button();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.GasAmountActual);
        await overviewPage.Submit_Pay_Bill_Modal();
        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, PGuserUsage.GasServiceFee);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto card gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Electric_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, ElectricAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, false),
            billQueries.checkElectricBillReminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveElectricBill(ElectriBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
        await billQueries.checkElectricBillVisibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await billQueries.checkElectricBillProcessing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkElectricBillStatus(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual);
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const payment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (payment) {
            await blnkQueries.verifyFeeCalculation(payment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(payment.id);
            logger.info(`BLNK PASS: Failed auto bank electric recovery ${payment.id} — chain verified`);
        }
    }


    async Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Electric_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, ElectricAccountId: string, GasAccountId: string){

        const ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await billQueries.checkElectricBillVisibility(ElectricAccountId, false);
        await billQueries.checkElectricBillReminder(ElectricAccountId, true);
        await billQueries.checkGasBillVisibility(GasAccountId, false);
        await billQueries.checkGasBillReminder(GasAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.approveElectricBill(ElectriBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "scheduled_for_payment"),
            billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillVisibility(ElectricAccountId, true),
            billQueries.checkGasBillVisibility(GasAccountId, true)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            // FIXME: Check_Electric_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await Promise.all([
            billQueries.checkElectricBillProcessing(ElectricAccountId),
            billQueries.checkGasBillProcessing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "failed"),
            billQueries.checkGasBillStatus(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Check_Pay_Bill_Button_Visible_Enable(),
        await Promise.all([
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),

        ]);
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Submit_Pay_Bill_Modal();
        await Promise.all([
            billQueries.checkElectricBillStatus(ElectricAccountId, "succeeded"),
            billQueries.checkGasBillStatus(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            billQueries.checkElectricBillPaidNotif(ElectricAccountId, true),
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Succeeded"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);

        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        // BLNK Ledger Verification (migration safety)
        const electricPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        if (electricPayment) {
            await blnkQueries.verifyFeeCalculation(electricPayment.id, PGuserUsage.ElectricAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(electricPayment.id);
            logger.info(`BLNK PASS: Failed auto bank electric recovery ${electricPayment.id} — chain verified`);
        }
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto bank gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    async Bank_Auto_Payment_Failed_Bank_Pay_Bill_Button_Update_Gas_Bill(page: Page, overviewPage: OverviewPage, billingPage: BillingPage, sidebarChat: SidebarChat, MoveIn: MoveInResult, PGuserUsage: TestUser, GasAccountId: string){

        const GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            billQueries.checkGasBillVisibility(GasAccountId, false),
            billQueries.checkGasBillReminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.checkGasBillPaidNotif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await billQueries.approveGasBill(GasBillID);
        await page.waitForTimeout(10000);
        await billQueries.checkGasBillStatus(GasAccountId, "scheduled_for_payment"),
        await billQueries.checkGasBillVisibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            // FIXME: Check_Gas_Bill_Scheduled_Payment_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await billQueries.checkGasBillProcessing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await billQueries.checkGasBillStatus(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Pay_Bill_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await billingPage.Click_Pay_Bill_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.GasAmountActual);
        await billingPage.Submit_Pay_Bill_Modal();
        await billQueries.checkGasBillStatus(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await Promise.all([
            billQueries.checkGasBillPaidNotif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);

        // BLNK Ledger Verification (migration safety)
        const gasPayment = await blnkQueries.getPaymentByUserAndAmount(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        if (gasPayment) {
            await blnkQueries.verifyFeeCalculation(gasPayment.id, PGuserUsage.GasAmount, 0);
            await blnkQueries.verifyPaymentChainConsistency(gasPayment.id);
            logger.info(`BLNK PASS: Failed auto bank gas recovery ${gasPayment.id} — chain verified`);
        }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}
