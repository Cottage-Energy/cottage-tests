import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { LinearActions } from '../../resources/fixtures/linear_actions';
import { FastmailActions } from '../../resources/fixtures/fastmail_actions';

const supabaseQueries = new SupabaseQueries();
const linearActions = new LinearActions();

export class PaymentUtilities {
    async Auto_Bank_Payment_Electric_Checks(page:any, billingPage:any, sidebarChat:any, MoveIn: any, PGuserUsage: any, ElectricAccountId: string){
        //AUTO PAYMENT CHECKS
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, false),
            supabaseQueries.Check_Eletric_Bill_Reminder(ElectricAccountId, true),
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //platform check
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
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "scheduled_for_payment"),
            supabaseQueries.Check_Electric_Bill_Visibility(ElectricAccountId, true)
        ]);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);
            //check platform outstanding balance not 0
        await sidebarChat.Goto_Billing_Page_Via_Icon();
        await Promise.all([
            billingPage.Check_Electric_Bill_Visibility(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Outstanding_Balance_Amount(PGuserUsage.ElectricAmountActual),
            billingPage.Check_Outstanding_Balance_Auto_Pay_Message("Payment Scheduled"),
            billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Scheduled"),
            billingPage.Check_Electric_Bill_View_Button(PGuserUsage.ElectricUsage.toString()),
            billingPage.Check_Electric_Bill_Amount(PGuserUsage.ElectricUsage.toString(), PGuserUsage.ElectricAmountActual),
            FastmailActions.Check_Electric_Bill_Scheduled_Payment_Email(MoveIn.PGUserEmail, PGuserUsage.ElectricUsage, PGuserUsage.ElectricAmountActual)
        ]);
        await supabaseQueries.Check_Electric_Bill_Processing(ElectricAccountId);
        await page.reload({ waitUntil: 'domcontentloaded' });
        billingPage.Check_Electric_Bill_Status(PGuserUsage.ElectricUsage.toString(), "Processing");
        await page.waitForTimeout(30000);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await Promise.all([
            supabaseQueries.Check_Electric_Bill_Status(ElectricAccountId, "succeeded"),
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
    }

}



export default PaymentUtilities;