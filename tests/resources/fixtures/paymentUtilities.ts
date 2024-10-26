import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { LinearActions } from '../../resources/fixtures/linear_actions';
import { FastmailActions } from '../../resources/fixtures/fastmail_actions';
import * as PaymentData from '../../resources/data/payment-data.json';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();

export class PaymentUtilities {

    async Auto_Card_Payment_Electric_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountTotal)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, PGuserUsage.ElectricServiceFee)
        ]);
        await page.waitForTimeout(10000);
        await FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountTotal);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Auto_Card_Payment_Electric_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
            linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal, PGuserUsage.GasAmountTotal);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`)
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),

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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Auto_Card_Payment_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    async Auto_Bank_Payment_Electric_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing")
        ]);
        await page.waitForTimeout(30000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Auto_Bank_Payment_Electric_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
            supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
            linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString());
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`)
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
    
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Auto_Bank_Payment_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Scheduled"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Gas_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Manual_Card_Payment_Electric_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
        //Manual PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),

        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user");
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
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


    async Manual_Card_Payment_Electric_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
      //MANUAL PAYMENT CHECKS
      await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
      await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
      await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
    
        ]);
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
      await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
      await billingPage.Check_Outstanding_Balance_Amount(0);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await Promise.all([
          linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
          linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
      ]);
      await page.waitForTimeout(10000);
      await Promise.all([
          supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
          supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
          //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
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
        billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
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


    async Manual_Card_Payment_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
      //Manual PAYMENT CHECKS
      await Promise.all([
        supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
        supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
      ]);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
          //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
    
        ]);
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      await Promise.all([
          billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0)
      ]);
      await page.waitForTimeout(1000);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
      await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
      await page.waitForTimeout(10000);
      await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
      await page.waitForTimeout(10000);
      await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user");
      await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
          //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
    
        ]);
      await sidebarChat.Goto_Billing_Page_Via_Icon();
      const billingAmount = await billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
      await Promise.all([
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Make_Payment_Button_Visible_Enable(),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
      ]);
      await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, PGuserUsage.GasServiceFee);
      await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
      await Promise.all([
        billingPage.Check_Outstanding_Balance_Amount(0),
        billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
        billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing")
      ]);
      await page.waitForTimeout(30000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
      await Promise.all([
          supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
          billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Outstanding_Balance_Amount(0),
          billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Paid"),
          billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
          billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
          billingPage.Check_Gas_Bill_Fee(PGuserUsage.GasUsage.toString(), PGuserUsage.GasServiceFee),
          supabaseQueries.Check_Gas_Bill_Service_Fee(GasAccountId, PGuserUsage.GasAmount, PGuserUsage.GasUsage, PGuserUsage.GasServiceFee),
          FastmailActions.Check_Gas_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.GasAmountTotal)
      ]);
      await sidebarChat.Goto_Overview_Page_Via_Icon();
        //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
    
        ]);
    }


    async Manual_Bank_Payment_Electric_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
        //Manual PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user");
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
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
        await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing"),
        ]);
        await page.waitForTimeout(30000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Paid"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            billingPage.Check_Electric_Bill_Fee_Not_Included(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricServiceFee),
            supabaseQueries.Check_Electric_Bill_Service_Fee(ElectricAccountId, PGuserUsage.ElectricAmount, PGuserUsage.ElectricUsage, null),
            FastmailActions.Check_Electric_Bill_Payment_Success(MoveIn.PGUserEmail, PGuserUsage.ElectricAmountActual)
        ]);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
            //check platform dashboard
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        
        ]);
    }


    async Manual_Bank_Payment_Electric_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
        //MANUAL PAYMENT CHECKS
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false);
        await supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true);
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
            linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
        ]);
        await page.waitForTimeout(10000);
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "waiting_for_user"),
            supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user"),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual, PGuserUsage.GasAmountActual),
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
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

        await billingPage.Click_Electric_Bill_Pay_Button(PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual, null);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);

        await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
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
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            
        ]);
    }


    async Manual_Bank_Payment_Gas_Checks(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, GasAccountId: string){
        //Manual PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, false),
            supabaseQueries.Check_Gas_Bill_Reminder(GasAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Amount(0),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
                
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0)
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "waiting_for_user");
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountActual);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Pay_Bill_Link_Visible_Enable(),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
                    
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        const billingAmount = await billingPage.Check_Outstanding_Balance_Amount( PGuserUsage.GasAmountActual);
        await Promise.all([
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Make_Payment_Button_Visible_Enable(),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Pending"),
            billingPage.Check_Gas_Bill_View_Button(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Gas_Bill_Amount(PGuserUsage.GasUsage.toString(), PGuserUsage.GasAmountActual),
            FastmailActions.Check_Gas_Bill_Ready_Email(MoveIn.PGUserEmail, PGuserUsage.GasUsage, PGuserUsage.GasAmountActual)
        ]);
        await billingPage.Click_Gas_Bill_Pay_Button(PGuserUsage.GasUsage, PGuserUsage.GasAmountActual, null);
        await supabaseQueries.Check_Gas_Bill_Processing(GasAccountId);
        await Promise.all([
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your $${billingAmount} payment is processing.`),
            billingPage.Check_Gas_Bill_Status(PGuserUsage.GasUsage.toString(), "Processing")
        ]);
        await page.waitForTimeout(30000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
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
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
                    
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Auto_Payment_Failed_Card_Alert_Update_Electric_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Auto_Payment_Failed_Card_Alert_Update_Electric_Gas_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
            linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),

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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Auto_Payment_Failed_Card_Alert_Update_Gas_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Details_After_Skip(PaymentData.ValidCardNUmber,PGuserUsage.CardExpiry,PGuserUsage.CVC,PGuserUsage.Country,PGuserUsage.Zip);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
    
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    async Auto_Payment_Failed_Bank_Alert_Update_Electric_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);

        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, true),
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Not_Visible(),
        ]);
    }


    async Auto_Payment_Failed_Bank_Alert_Update_Electric_Gas_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, ElectricAccountId: string, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Is_Clear(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await billingPage.Check_Electric_Bill_Hidden(PGuserUsage.ElectricUsage.toString());
        await billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString());
        await billingPage.Check_Outstanding_Balance_Amount(0);
        await billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Electric_Bill_Paid_Notif(ElectricAccountId, false);
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await Promise.all([
            linearActions.SetElectricBillToApprove(MoveIn.PGUserEmail),
            linearActions.SetGasBillToApprove(MoveIn.PGUserEmail)
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
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
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),

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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Electricity_Card_Contain_Bill_Details(ElectricAccountId, PGuserUsage.ElectricAmountActual, PGuserUsage.ElectricUsage),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
        ]);
    }


    async Auto_Payment_Failed_Bank_Alert_Update_Gas_Bill(page:any, overviewPage:any, billingPage:any, sidebarChat:any, MoveIn: any, profilePage: any, PGuserUsage: any, GasAccountId: string){
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Is_Clear(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Gas_Bill_Hidden(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay")
        ]);
        await page.waitForTimeout(1000);
        await sidebarChat.Goto_Overview_Page_Via_Icon();
        await supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, false);
        await page.waitForTimeout(10000);
        await linearActions.SetGasBillToApprove(MoveIn.PGUserEmail);
        await page.waitForTimeout(10000);
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "scheduled_for_payment"),
        await supabaseQueries.Check_Gas_Bill_Visibility(GasAccountId, true)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
        const oustandingAmount = await overviewPage.Check_Outstanding_Balance_Amount(PGuserUsage.GasAmountTotal);
            //check platform outstanding balance not 0
        await Promise.all([
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message(`Your auto-payment of $${oustandingAmount} is scheduled for tomorrow`),
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
        //UPDATE PAYMENT Section
        await overviewPage.Check_Click_Failed_Payment_Update_Payment_Link();
        await profilePage.Go_to_Payment_Info_Tab();
        await profilePage.click_Edit_Payment_Button();
        await profilePage.Enter_Auto_Payment_Valid_Bank_Details_After_Skip(MoveIn.PGUserEmail, MoveIn.PGUserName);
        await profilePage.Check_Payment_Initiated_Message();
        await supabaseQueries.Check_Gas_Bill_Status(GasAccountId, "succeeded");
        await page.reload({ waitUntil: 'domcontentloaded' });
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await page.waitForTimeout(1000);
    
        await Promise.all([
            supabaseQueries.Check_Gas_Bill_Paid_Notif(GasAccountId, true),
            billingPage.Check_Gas_Bill_Visibility(PGuserUsage.GasUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(0),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
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
            overviewPage.Check_Outstanding_Balance_Auto_Pay_Message("Enrolled in Auto-pay"),
            overviewPage.Check_Gas_Card_Contain_Bill_Details(GasAccountId, PGuserUsage.GasAmountActual, PGuserUsage.GasUsage),
            overviewPage.Check_Electricity_Card_Not_Visible(),
        ]);
    }


    
}



export default PaymentUtilities;