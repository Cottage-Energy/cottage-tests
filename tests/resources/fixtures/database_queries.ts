import { expect } from '@playwright/test';
import {supabase} from '../../resources/utils/supabase';

export class SupabaseQueries{

    async Get_Cottage_User_Id(Email: string) {
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('id')
            .eq('email', Email)
            .single()
            .throwOnError();
        const cottageUserId = cottageUser?.id ?? '';
        console.log(cottageUserId);
        await expect(cottageUserId).not.toBe("");
        return cottageUserId;
    }
    

    async Get_Electric_Account_Id(cottageUserId: string) {
        const { data: EAccount } = await supabase
            .from('ElectricAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .single()
            .throwOnError();
        const ElectricAccountId = EAccount?.id ?? '';
        console.log(ElectricAccountId.toString());
        await expect(ElectricAccountId).not.toBe("");
        return ElectricAccountId.toString();
    }
    

    async Get_Gas_Account_Id(cottageUserId: string) {
        const { data: GAccount } = await supabase
            .from('GasAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .single()
            .throwOnError();
        const GasAccountId = GAccount?.id ?? '';
        console.log(GasAccountId.toString());
        await expect(GasAccountId).not.toBe("");
        return GasAccountId.toString();
    }


    async Check_Eletric_Bill_Reminder(ElectricAccountId: string, state:boolean) {
        const { data: ElectricBillReminder } = await supabase
            .from('ElectricBill')
            .select('isSendReminder')
            .eq('electricAccountID', ElectricAccountId)
            .single()
            .throwOnError();
        const ElectricBillreminder = ElectricBillReminder?.isSendReminder ?? '';
        console.log(ElectricBillreminder);
        await expect(ElectricBillreminder).toBe(state);
    }


    /*async Check_Gas_Bill_Reminder(GasAccountId: string, state:boolean) {
        const { data: GasBillReminder } = await supabase
            .from('GasBill')
            .select('isSendReminder')
            .eq('gasAccountID', GasAccountId)
            .single()
            .throwOnError();
        const GasBillreminder = GasBillReminder?.isSendReminder ?? '';
        console.log(GasBillreminder);
        await expect(GasBillreminder).toBe(state);
    }*/


    async Check_Electric_Bill_Visibility(ElectricAccountId: string, state:boolean) {
        const { data: ElectricBillVis } = await supabase
            .from('ElectricBill')
            .select('visible')
            .eq('electricAccountID', ElectricAccountId)
            .single()
            .throwOnError();
        const ElectricBillvisib = ElectricBillVis?.visible ?? '';
        console.log(ElectricBillvisib);
        await expect(ElectricBillvisib).toBe(state);
    }


    async Check_Gas_Bill_Visibility(GasAccountId: string, state:boolean) {
        const { data: GasBillVis } = await supabase
            .from('GasBill')
            .select('visible')
            .eq('gasAccountID', GasAccountId)
            .single()
            .throwOnError();
        const GasBillvisib = GasBillVis?.visible ?? '';
        console.log(GasBillvisib);
        await expect(GasBillvisib).toBe(state);
    }


    async Check_Electric_Bill_Paid_Notif(ElectricAccountId: string, state:boolean) {
        const { data: ElectricBillPaidNotif } = await supabase
            .from('ElectricBill')
            .select('paidNotificationSent')
            .eq('electricAccountID', ElectricAccountId)
            .single()
            .throwOnError();
        const ElectricBillpaidNotif = ElectricBillPaidNotif?.paidNotificationSent ?? '';
        console.log(ElectricBillpaidNotif);
        await expect(ElectricBillpaidNotif).toBe(state);
    }


    async Check_Gas_Bill_Paid_Notif(GasAccountId: string, state:boolean) {
        const { data: GasBillPaidNotif } = await supabase
            .from('GasBill')
            .select('paidNotificationSent')
            .eq('gasAccountID', GasAccountId)
            .single()
            .throwOnError();
        const GasBillpaidNotif = GasBillPaidNotif?.paidNotificationSent ?? '';
        console.log(GasBillpaidNotif);
        await expect(GasBillpaidNotif).toBe(state);
    }


    async Check_Electric_Bill_Status(ElectricAccountId: string, status:string) {
        const { data: ElectricBillStatus } = await supabase
            .from('ElectricBill')
            .select('paymentStatus')
            .eq('electricAccountID', ElectricAccountId)
            .single()
            .throwOnError();
        const ElectricBillstatus = ElectricBillStatus?.paymentStatus ?? '';
        console.log(ElectricBillstatus);
        await expect(ElectricBillstatus).toBe(status);
    }


    async Check_Gas_Bill_Status(GasAccountId: string, status:string) {
        const { data: GasBillStatus } = await supabase
            .from('GasBill')
            .select('paymentStatus')
            .eq('gasAccountID', GasAccountId)
            .single()
            .throwOnError();
        const GasBillstatus = GasBillStatus?.paymentStatus ?? '';
        console.log(GasBillstatus);
        await expect(GasBillstatus).toBe(status);
    }


    async Update_Companies_to_Building(ShortCode: string, ElectricCompany: string | null, GasCompany: string | null) {
        const { data,error} = await supabase
        .from('Building')
        .update({ electricCompanyID: ElectricCompany, gasCompanyID: GasCompany })
        .eq('shortCode', ShortCode )
        .select()
        .throwOnError();
        console.log(data);
        console.log(error);
    }


}


export default SupabaseQueries;
