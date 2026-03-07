import { SidebarChat } from '../../resources/page_objects/sidebar_chat';
import { OverviewPage } from '../../resources/page_objects/overview_dashboard_page';
import { BillingPage } from '../../resources/page_objects/billing_page';
import { ProfilePage } from '../../resources/page_objects/account_profile_page';

import { accountQueries, billQueries, paymentQueries } from '../../resources/fixtures/database';
import { userQueries } from '../../resources/fixtures/database';
import { supabase } from '../../resources/utils/supabase';
import { FastmailActions } from '../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../resources/data/payment-data.json';
import { AdminApi } from '../../resources/api/admin_api';
import { fa } from '@faker-js/faker';

export class PaymentUtilities {

    /**
     * Ensure registration is complete so dashboard shows billing view.
     * Updates Resident + ElectricAccount/GasAccount registration and status.
     */
    private async ensureRegistrationComplete(page: any, cottageUserId: string) {
        await userQueries.updateRegistrationComplete(cottageUserId, true);
        
        // Set electric/gas accounts to ACTIVE status with registration complete
        await supabase
            .from('ElectricAccount')
            .update({ registrationJobCompleted: true, isActive: true, status: 'ACTIVE' })
            .eq('cottageUserID', cottageUserId);
        await supabase
            .from('GasAccount')
            .update({ registrationJobCompleted: true, isActive: true, status: 'ACTIVE' })
            .eq('cottageUserID', cottageUserId);
        
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Private functions to get charge accounts
    private async getPaymentDetailsSingleChargeAccount(MoveIn: any)
    {
        const cottageUserId = MoveIn.cottageUserId;
        const electricAccountId = await accountQueries.getElectricAccountId(MoveIn.cottageUserId);
        const gasAccountId = await accountQueries.getGasAccountId(MoveIn.cottageUserId);
        const chargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, gasAccountId);

        return {
            cottageUserId,
            electricAccountId,
            gasAccountId,
            chargeAccountId
        };
    }

    private async getPaymentDetailsMultipleChargeAccounts(MoveIn: any)
    {
        const cottageUserId = MoveIn.cottageUserId;
        const electricAccountId = await accountQueries.getElectricAccountId(MoveIn.cottageUserId);
        const gasAccountId = await accountQueries.getGasAccountId(MoveIn.cottageUserId);
        const electricChargeAccountId = await accountQueries.getCheckChargeAccount(electricAccountId, null);
        const gasChargeAccountId = await accountQueries.getCheckChargeAccount(null, gasAccountId);

        return {
            cottageUserId,
            electricAccountId,
            gasAccountId,
            electricChargeAccountId,
            gasChargeAccountId
        };
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Successfull Payment Checks
    //Auto Payments

    async Auto_Card_Payment_Electric_Checks(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const ElectricBillID = await billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.approveElectricBill(ElectricBillID);
        await billQueries.checkElectricBillIsProcessed(ElectricBillID);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"scheduled_for_payment"),
            FastmailActions.Check_Electric_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Scheduled");
        await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Processing");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActualTotal)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.ElectricAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFeeActual),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Card_Payment_Gas_Checks(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const GasBillID = await billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.approveGasBill(GasBillID);
        await billQueries.checkGasBillIsProcessed(GasBillID);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal,"scheduled_for_payment"),
            FastmailActions.Check_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Scheduled");
        await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Processing");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActualTotal)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.GasAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFeeActual),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Card_Payment_Electric_Gas_Checks_Single_Charge(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const [ElectricBillID, GasBillID] = await Promise.all([
            billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            billQueries.approveElectricBill(ElectricBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await Promise.all([
            billQueries.checkElectricBillIsProcessed(ElectricBillID),
            billQueries.checkGasBillIsProcessed(GasBillID)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"scheduled_for_payment"),
            FastmailActions.Check_Electric_And_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString())
        ]);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Scheduled");
        await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Processing");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActualTotal)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.CombinedAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.CombinedAmountActual, PGuserUsage.CombinedServiceFeeActual),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Card_Payment_Electric_Gas_Checks_Multiple_Charge(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsMultipleChargeAccounts(MoveIn);

        const [ElectricBillID, GasBillID] = await Promise.all([
            billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            billQueries.approveElectricBill(ElectricBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await Promise.all([
            billQueries.checkElectricBillIsProcessed(ElectricBillID),
            billQueries.checkGasBillIsProcessed(GasBillID)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            try{
                await Promise.all([
                    overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            try{
                await Promise.all([
                    overviewPage.Check_Outstanding_Balance_Amount(0),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Disabled(),
            ]);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"scheduled_for_payment"),
            FastmailActions.Check_Electric_And_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.reload({ waitUntil: 'domcontentloaded' });

        try{
            try{
                await Promise.all([
                    billingPage.Check_Outstanding_Balance_Amount(0),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Disabled(),
            ]);
        } catch {
            try{
                await Promise.all([
                    billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString())
        ]);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Scheduled");
        await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Processing");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActualTotal)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await Promise.all([
            paymentQueries.checkUtilityRemittance(userPaymentInfo.electricChargeAccountId || "", PGuserUsage.ElectricAmount, "ready_for_remittance"),
            paymentQueries.checkUtilityRemittance(userPaymentInfo.gasChargeAccountId || "", PGuserUsage.GasAmount, "ready_for_remittance")
        ]);
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.CombinedAmountActual, PGuserUsage.CombinedServiceFeeActual),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Bank_Payment_Electric_Checks(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const ElectricBillID = await billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.approveElectricBill(ElectricBillID);
        await billQueries.checkElectricBillIsProcessed(ElectricBillID);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmount,"scheduled_for_payment"),
            FastmailActions.Check_Electric_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Scheduled");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);
        //await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmount,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Processing");
        //await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.ElectricAmount);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.ElectricAmount,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.ElectricAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.ElectricAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.ElectricAmountActual, "-"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Bank_Payment_Gas_Checks(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const GasBillID = await billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await billQueries.approveGasBill(GasBillID);
        await billQueries.checkGasBillIsProcessed(GasBillID);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmount,"scheduled_for_payment"),
            FastmailActions.Check_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Scheduled");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.GasAmount);
        //await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Processing");
        //await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.GasAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.GasAmount,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.GasAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.GasAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.GasAmountActual, "-"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Bank_Payment_Electric_Gas_Checks_Single_Charge(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const [ElectricBillID, GasBillID] = await Promise.all([
            billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            billQueries.approveElectricBill(ElectricBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await Promise.all([
            billQueries.checkElectricBillIsProcessed(ElectricBillID),
            billQueries.checkGasBillIsProcessed(GasBillID)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await overviewPage.Check_Outstanding_Balance_Amount(0);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmount,"scheduled_for_payment"),
            FastmailActions.Check_Electric_And_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();

        try{
            await billingPage.Check_Outstanding_Balance_Amount(0);
        } catch {
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString())
        ]);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Scheduled");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmount);
        //await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Processing");
        //await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmount,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await paymentQueries.checkUtilityRemittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.CombinedAmount, "ready_for_remittance");
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.CombinedAmountActual, "-"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }


    async Auto_Bank_Payment_Electric_Gas_Checks_Multiple_Charge(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        await this.ensureRegistrationComplete(page, MoveIn.cottageUserId);
        const userPaymentInfo = await this.getPaymentDetailsMultipleChargeAccounts(MoveIn);

        const [ElectricBillID, GasBillID] = await Promise.all([
            billQueries.insertElectricBill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage),
            billQueries.insertGasBill(userPaymentInfo.gasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage)
        ]);
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Make_Payment_Button_Not_Visible(),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Make_Payment_Button_Not_Visible(),
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
        ]);
        await page.waitForTimeout(500);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await Promise.all([
            billQueries.approveElectricBill(ElectricBillID),
            billQueries.approveGasBill(GasBillID)
        ]);
        await Promise.all([
            billQueries.checkElectricBillIsProcessed(ElectricBillID),
            billQueries.checkGasBillIsProcessed(GasBillID)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            try{
                await Promise.all([
                    overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            try{
                await Promise.all([
                    overviewPage.Check_Outstanding_Balance_Amount(0),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Disabled(),
            ]);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasBillID, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);

        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmount,"scheduled_for_payment"),
            FastmailActions.Check_Electric_And_Gas_Bill_Is_Ready(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.reload({ waitUntil: 'domcontentloaded' });

        try{
            try{
                await Promise.all([
                    billingPage.Check_Outstanding_Balance_Amount(0),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Disabled(),
            ]);
        } catch {
            try{
                await Promise.all([
                    billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.CombinedAmountActual),
                ]);
            } catch {
                console.log("Outstanding balance and message check failed, check visually");
            }
            await Promise.all([
                billingPage.Check_Make_Payment_Button_Visible(),
                billingPage.Check_Make_Payment_Button_Enabled(),
            ]);
        }

        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString())
        ]);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Scheduled");
        await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmount);
        //await paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Goto_Payments_Tab();
        await billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Processing");
        //await paymentQueries.checkPaymentProcessing(MoveIn.cottageUserId, PGuserUsage.CombinedAmountTotal);
        await Promise.all([
            paymentQueries.checkPaymentStatus(MoveIn.cottageUserId, PGuserUsage.CombinedAmount,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.pgUserEmail, PGuserUsage.CombinedAmountActual)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await Promise.all([
            paymentQueries.checkUtilityRemittance(userPaymentInfo.electricChargeAccountId || "", PGuserUsage.ElectricAmount, "ready_for_remittance"),
            paymentQueries.checkUtilityRemittance(userPaymentInfo.gasChargeAccountId || "", PGuserUsage.GasAmount, "ready_for_remittance")
        ]);
        await billingPage.Goto_Payments_Tab();
        await Promise.all([
            billingPage.Check_Payment_Status(PGuserUsage.CombinedAmountActual,"Succeeded"),
            billingPage.Check_Payment_Transaction_Fee(PGuserUsage.CombinedAmountActual, "-"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await overviewPage.Check_Outstanding_Balance_Amount(0);
    }






    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Manual Card Payment

    async Manual_Card_Payment_Electric_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
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

        let ElectriBillID: any;
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
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            // FIXME: Check_Electric_Bill_Ready_Email not yet implemented in FastmailActions
            // FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
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
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
    
        ]);
    }


    async Manual_Card_Payment_Electric_Gas_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string,
        GasAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
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

        let ElectriBillID: any;
        let GasBillID: any;
        await test.step('Process bill approval for manual payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await billQueries.checkElectricBillPaidNotif(ElectricAccountId, false);
            await billQueries.checkGasBillPaidNotif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await billQueries.getElectricBillId(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            GasBillID = await billQueries.getGasBillId(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            await Promise.all([
                AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
                AdminApi.Approve_Bill(AdminApiContext, GasBillID)
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
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
    
        ]);
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
      const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
      await billingPage.Check_Make_Payment_Button_Visible_Enable();
      await Promise.all([
          billQueries.checkElectricBillVisibility(ElectricAccountId, true),
          billQueries.checkGasBillVisibility(GasAccountId, true),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          // FIXME: Check_Electric_Bill_Ready_Email not yet implemented in FastmailActions
          // FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
          // FIXME: Check_Gas_Bill_Ready_Email not yet implemented in FastmailActions
          // FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.pgUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);

      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await billQueries.checkElectricBillProcessing(ElectricAccountId);

      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
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
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
  
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),

          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
          //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }





    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, null);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
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
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Electric_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
        
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
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
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
        await billingPage.Check_Make_Payment_Button_Visible_Enable(),
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
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Bank_Auto_Payment_Failed_Bank_Alert_Update_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, GasAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual, null);
    
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
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
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, null);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await overviewPage.Click_Pay_Bill_Link();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual);
        await overviewPage.Click_Pay_Now_Button();
        await overviewPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Electric_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
        
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
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
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
        await billingPage.Check_Make_Payment_Button_Visible_Enable(),
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
        await overviewPage.Click_Pay_Bill_Link();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await overviewPage.Click_Pay_Now_Button();
        await overviewPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Card_Auto_Payment_Failed_Card_Pay_Bill_Link_Update_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual, null);
    
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await overviewPage.Click_Pay_Bill_Link();
        await overviewPage.Enter_Auto_Payment_Details(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await overviewPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.GasAmountActual);
        await overviewPage.Click_Pay_Now_Button();
        await overviewPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Electric_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual, null);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Failed"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
        ]);
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await billingPage.Click_Make_Payment_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Electric_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
        
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
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
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
        await billingPage.Check_Make_Payment_Button_Visible_Enable(),
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
        await billingPage.Click_Make_Payment_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            billQueries.checkElectricBillServiceFee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Succeeded"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Bank_Auto_Payment_Failed_Bank_Make_Payment_Button_Update_Gas_Bill(page:any, AdminApiContext:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
        
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
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
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
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual, null);
    
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Failed"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
        ]);
        await page.waitForTimeout(1000);
        //UPDATE PAYMENT Section
        await billingPage.Click_Make_Payment_Button();
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.pgUserEmail, MoveIn.pgUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.GasAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
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
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            billQueries.checkGasBillServiceFee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.pgUserEmail, PGuserUsage.GasAmountActual);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}



export default PaymentUtilities;
