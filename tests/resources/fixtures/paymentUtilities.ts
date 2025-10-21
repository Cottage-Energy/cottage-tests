import { SidebarChat } from '../../resources/page_objects/sidebar_chat';
import { OverviewPage } from '../../resources/page_objects/overview_dashboard_page';
import { BillingPage } from '../../resources/page_objects/billing_page';
import { ProfilePage } from '../../resources/page_objects/account_profile_page';

import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { FastmailActions } from '../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../resources/data/payment-data.json';
import { AdminApi } from '../../resources/api/admin_api';
import { fa } from '@faker-js/faker';

const supabaseQueries = new SupabaseQueries();

export class PaymentUtilities {

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Private functions to get charge accounts
    private async getPaymentDetailsSingleChargeAccount(MoveIn: any)
    {
        const cottageUserId = MoveIn.cottageUserId;
        const electricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const gasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        const chargeAccountId = await supabaseQueries.Get_Check_Charge_Account(electricAccountId, gasAccountId);

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
        const electricAccountId = await supabaseQueries.Get_Electric_Account_Id(MoveIn.cottageUserId);
        const gasAccountId = await supabaseQueries.Get_Gas_Account_Id(MoveIn.cottageUserId);
        const electricChargeAccountId = await supabaseQueries.Get_Check_Charge_Account(electricAccountId, null);
        const gasChargeAccountId = await supabaseQueries.Get_Check_Charge_Account(null, gasAccountId);

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

    async Auto_Card_Payment_Electric_Checks(page: any, MoveIn: any, PGuserUsage: any) {
        const sidebarChat = new SidebarChat(page);
        const overviewPage = new OverviewPage(page);
        const billingPage = new BillingPage(page);
        const profilePage = new ProfilePage(page);

        const userPaymentInfo = await this.getPaymentDetailsSingleChargeAccount(MoveIn);

        const ElectricBillID = await supabaseQueries.Insert_Electric_Bill(userPaymentInfo.electricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
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
        await supabaseQueries.Approve_Electric_Bill(ElectricBillID);
        await supabaseQueries.Check_Electric_Bill_Is_Processed(ElectricBillID);
        await page.reload({ waitUntil: 'domcontentloaded' });
        
        try{
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
                overviewPage.Check_Outstanding_Balance_Message_Not_Present(`Your $${PGuserUsage.ElectricAmountActual} payment is processing.`),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Enabled(),
            ]);
        } catch {
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message(`Your $${PGuserUsage.ElectricAmountActual} payment is processing.`),
                overviewPage.Check_Make_Payment_Button_Visible(),
                overviewPage.Check_Make_Payment_Button_Disabled(),
            ]);
        }

        await Promise.all([
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricBillID, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);

        await Promise.all([
            supabaseQueries.Check_Payment_Status(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"scheduled_for_payment"),
            FastmailActions.Check_Electric_Bill_Is_Ready(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
        ]);

        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message(`Your $${PGuserUsage.ElectricAmountActual} payment is processing.`),
            billingPage.Check_Make_Payment_Button_Visible(),
            billingPage.Check_Make_Payment_Button_Disabled(),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
        ]);

        //go to payment tab and check payment is scheduled

        await supabaseQueries.Check_Payment_Status(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"requires_capture");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        //go to payment tab and check payment is processing
        await supabaseQueries.Check_Payment_Processing(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal);
        await Promise.all([
            supabaseQueries.Check_Payment_Status(MoveIn.cottageUserId, PGuserUsage.ElectricAmountTotal,"succeeded"),
            FastmailActions.Check_Bill_Payment_Confirmation(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActualTotal)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        await supabaseQueries.Check_Utility_Remittance(userPaymentInfo.chargeAccountId || "", PGuserUsage.ElectricAmount, "ready_for_remittance");
        //go to payment tab and check payment is paid
        //check billing message
        //go to overview page
    }


    async Auto_Card_Payment_Electric_Gas_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string,
        GasAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Electric and Gas Bill IDs and validate', async () => {
            const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify auto payment initial checks for both bills', async () => {
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
                supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
                supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
            ]);
        });

        await test.step('Validate platform state after page reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            ]);
        });

        await test.step('Check billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
            await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
            await billingPage.Check_Outstanding_Balance_Amount(0);
            await billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay");
        });

        let ElectriBillID: any;
        let GasBillID: any;
        await test.step('Process bill approval and validate scheduled payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
            await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            await Promise.all([
                AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
                AdminApi.Approve_Bill(AdminApiContext, GasBillID)
            ]);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
                supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
            ]);
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
            ]);
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal, PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal, PGuserUsage.GasAmountTotal);
        await billingPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`)
        await Promise.all([
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Scheduled"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId),
            supabaseQueries.Check_Gas_Bill_Processing(GasAccountId)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        
        await page.waitForTimeout(10000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
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


    async Auto_Card_Payment_Gas_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        GasAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Gas Bill ID and validate', async () => {
            const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify auto payment initial checks', async () => {
            await Promise.all([
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
                supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
            ]);
        });

        await test.step('Validate platform state after page reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
                overviewPage.Check_Electricity_Card_Not_Visible(),
            ]);
        });

        await test.step('Check billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await Promise.all([
                billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
                billingPage.Check_Outstanding_Balance_Amount(0),
                billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
            ]);
        });

        let GasBillID: any;
        await test.step('Process bill approval and validate scheduled payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
            ]);
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal),
            billingPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Scheduled"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        await page.waitForTimeout(10000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    async Auto_Bank_Payment_Electric_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Electric Bill ID and validate', async () => {
            const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify auto payment initial checks', async () => {
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
                supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
            ]);
        });

        await test.step('Validate platform state after page reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Not_Visible(),
            ]);
        });

        await test.step('Check billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await Promise.all([
                billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Outstanding_Balance_Amount(0),
                billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
            ]);
        });

        let ElectriBillID: any;
        await test.step('Process bill approval and validate scheduled payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
                supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
            ]);
        });

        await test.step('Verify scheduled payment state', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
                overviewPage.Check_Get_Started_Widget_Not_Visible(),
                overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Not_Visible(),
            ]);
        });

        await test.step('Verify billing page scheduled state and process payment', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            await Promise.all([
                billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${billingAmount} is scheduled for tomorrow`),
                billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
                billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
                FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
            ]);
            
            await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
            await page.reload({ waitUntil: 'domcontentloaded' });
            await Promise.all([
                billingPage.Check_Outstanding_Balance_Amount(0),
                billingPage.Check_Outstanding_Balance_Message(`Your $${billingAmount} payment is processing.`),
                billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing")
            ]);
        });

        await test.step('Verify payment success', async () => {
            await page.waitForTimeout(30000);
            await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
            await page.reload({ waitUntil: 'domcontentloaded' });
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
                billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Outstanding_Balance_Amount(0),
                billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
                billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
                billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
                billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
                supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
                FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
            ]);
        });

        await test.step('Verify final dashboard state', async () => {
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Not_Visible(),
            ]);
        });
    }


    async Auto_Bank_Payment_Electric_Gas_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string,
        GasAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Electric and Gas Bill IDs and validate', async () => {
            const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify auto payment initial checks for both bills', async () => {
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
                supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
                supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
            ]);
        });

        await test.step('Validate platform state after page reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
                overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            ]);
        });

        await test.step('Check billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
            await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
            await billingPage.Check_Outstanding_Balance_Amount(0);
            await billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay");
        });

        let ElectriBillID: any;
        let GasBillID: any;
        await test.step('Process bill approval and validate scheduled payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
            await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            await Promise.all([
                AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
                AdminApi.Approve_Bill(AdminApiContext, GasBillID)
            ]);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
                supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
            ]);
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`)
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Scheduled"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId),
            supabaseQueries.Check_Gas_Bill_Processing(GasAccountId)
        ]);
        await page.reload();
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing")
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
        ]);
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
    
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
    
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),

            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
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


    async Auto_Bank_Payment_Gas_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        GasAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Gas Bill ID and validate', async () => {
            const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify auto payment initial checks', async () => {
            await Promise.all([
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
                supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
            ]);
        });

        await test.step('Validate platform state after page reload', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);
            
            await Promise.all([
                overviewPage.Check_Outstanding_Balance_Amount(0),
                overviewPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
                overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
                overviewPage.Check_Electricity_Card_Not_Visible(),
            ]);
        });

        await test.step('Check billing page state', async () => {
            await sidebarChat.Goto_Billing_Page_Via_Icon();
            await Promise.all([
                billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
                billingPage.Check_Outstanding_Balance_Amount(0),
                billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay")
            ]);
        });

        let GasBillID: any;
        await test.step('Process bill approval and validate scheduled payment', async () => {
            await page.waitForTimeout(1000);
            await sidebarChat.Goto_Overview_Page_Via_Icon();
            await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
                supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
            ]);
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Scheduled"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing"),
        ]);
        await page.waitForTimeout(30000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
        ]);
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


    async Manual_Card_Payment_Electric_Checks(
        AdminApiContext: any,
        MoveIn: any,
        PGuserUsage: any,
        ElectricAccountId: string
    ) {
        // Get fixtures from current test context
        const fixtures = this.getCurrentTestFixtures();
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Electric Bill ID and validate', async () => {
            const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify manual payment initial checks', async () => {
            await Promise.all([
                supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
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
            await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            await supabaseQueries.Approve_Electric_Bill(ElectriBillID);
            await page.waitForTimeout(10000);
            
            await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user");
            await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
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
            FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
        ]);
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal)
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
        const { page, overviewPage, billingPage, sidebarChat, supabaseQueries } = fixtures || {};
        
        if (!fixtures) {
            throw new Error('Test fixtures not available. Make sure this method is called within a test context.');
        }
        
        await test.step('Get Electric and Gas Bill IDs and validate', async () => {
            const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            expect(ElectriBillID, 'Electric Bill ID should exist').toBeTruthy();
            expect(GasBillID, 'Gas Bill ID should exist').toBeTruthy();
        });

        await test.step('Verify manual payment initial checks', async () => {
            await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
            await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
            await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
            await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
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
            await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
            await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
            await page.waitForTimeout(10000);
            
            ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
            GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
            
            await Promise.all([
                AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
                AdminApi.Approve_Bill(AdminApiContext, GasBillID)
            ]);
            await page.waitForTimeout(10000);
            
            await Promise.all([
                supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
                supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
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
          supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
          supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Pending"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Electric_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);

      await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricServiceFee);
      await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);

      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);

      await Promise.all([
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Outstanding_Balance_Message(`Your $${billingAmount} payment is processing.`),
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
        billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing")
      ]);


      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
      ]);

      
      await Promise.all([
        supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
        supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
    ]);

      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await Promise.all([
          billingPage.Check_Outstanding_Balance_Amount(0),
  
          billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
          billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
          billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
          billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
          supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),
  
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),

          FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, null);

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
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual);
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        
        //AUTO PAYMENT CHECKS
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
        await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
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
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId),
            supabaseQueries.Check_Gas_Bill_Processing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

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
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
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
        
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
            supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
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
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual, null);
    
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
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
    
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual);
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
    
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, null);

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
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal);
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        
        //AUTO PAYMENT CHECKS
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
        await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
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
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId),
            supabaseQueries.Check_Gas_Bill_Processing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

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
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
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
        
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
            supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
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
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountTotal)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual, null);
    
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
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
    
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal);
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, ElectriBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, null);

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
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual);
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
        
        const ElectriBillID = await supabaseQueries.Get_Electric_Bill_Id(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage);
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);
        
        //AUTO PAYMENT CHECKS
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
        await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
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
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            AdminApi.Approve_Bill(AdminApiContext, ElectriBillID),
            AdminApi.Approve_Bill(AdminApiContext, GasBillID)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
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
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId),
            supabaseQueries.Check_Gas_Bill_Processing(GasAccountId)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "failed"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed"),
        ]);
        await page.waitForTimeout(5000);
        //await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);

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
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded"),
        ]);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),

            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),

            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        
        await page.waitForTimeout(5000);
        await Promise.all([
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual)
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
        
        const GasBillID = await supabaseQueries.Get_Gas_Bill_Id(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage);

        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
            supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
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
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await AdminApi.Approve_Bill(AdminApiContext, GasBillID);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Get_Started_Widget_Not_Visible(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "failed");
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Failed_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual, null);
    
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
        await billingPage.Enter_Auto_Payment_Valid_Bank_Details_After_Failure(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await billingPage.Check_Pay_Outstanding_Balance_Modal(PGuserUsage.GasAmountActual);
        await billingPage.Click_Pay_Now_Button();
        await billingPage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);
    
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Message("Enrolled in Auto-pay"),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            billingPage.Check_Gas_Bill_Fee_Not_Included(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
            supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, null)
        ]);
        await page.waitForTimeout(5000);
        await FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountActual);
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