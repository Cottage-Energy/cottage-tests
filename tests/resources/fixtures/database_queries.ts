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


    async Check_Electric_Account_Id_Not_Present(cottageUserId: string) {
        const { data: EAccount,error } = await supabase
            .from('ElectricAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()

        console.log(error);
        await expect(EAccount).toBeNull();
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


    async Check_Gas_Account_Id_Not_Present(cottageUserId: string) {
        const { data: GAccount,error } = await supabase
            .from('GasAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()

        console.log(error);
        await expect(GAccount).toBeNull();
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


    async Check_Electric_Bill_Status(ElectricAccountId: string, status: string) {
        const maxRetries = 5;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ElectricBillstatus = '';
        
        while (retries < maxRetries) {
            const { data: ElectricBillStatus } = await supabase
                .from('ElectricBill')
                .select('paymentStatus')
                .eq('electricAccountID', ElectricAccountId)
                .single()
                .throwOnError();
                
            ElectricBillstatus = ElectricBillStatus?.paymentStatus ?? '';
            console.log(ElectricBillstatus);
        
            if (ElectricBillstatus === status) {
                await expect(ElectricBillstatus).toBe(status);
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(15000);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ElectricBillstatus !== status) {
            throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Gas_Bill_Status(GasAccountId: string, status:string) {
        const maxRetries = 5;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let GasBillstatus = '';
            
        while (retries < maxRetries) {
            const { data: GasBillStatus } = await supabase
                .from('GasBill')
                .select('paymentStatus')
                .eq('gasAccountID', GasAccountId)
                .single()
                .throwOnError();
                    
            GasBillstatus = GasBillStatus?.paymentStatus ?? '';
            console.log(GasBillstatus);
            
            if (GasBillstatus === status) {
                await expect(GasBillstatus).toBe(status);
                break;
            }
            
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(15000);
        }
            
        // If the loop exits without matching the status, throw an error
        if (GasBillstatus !== status) {
            throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Electric_Bill_Processing(ElectricAccountId: string) {
        const maxRetries = 100;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ElectricBillstatus = '';
        
        while (retries < maxRetries) {
            const { data: ElectricBillStatus } = await supabase
                .from('ElectricBill')
                .select('paymentStatus')
                .eq('electricAccountID', ElectricAccountId)
                .single()
                .throwOnError();
                
            ElectricBillstatus = ElectricBillStatus?.paymentStatus ?? '';
            console.log(ElectricBillstatus);
        
            if (ElectricBillstatus === "processing") {
                await expect(ElectricBillstatus).toBe("processing");
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(500);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ElectricBillstatus !== "processing") {
            throw new Error(`Expected status "processing" not met after ${maxRetries} retries.`);
        }
    }


    async Check_Gas_Bill_Processing(GasAccountId: string) {
        const maxRetries = 100;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let GasBillstatus = '';
            
        while (retries < maxRetries) {
            const { data: GasBillStatus } = await supabase
                .from('GasBill')
                .select('paymentStatus')
                .eq('gasAccountID', GasAccountId)
                .single()
                .throwOnError();
                    
            GasBillstatus = GasBillStatus?.paymentStatus ?? '';
            console.log(GasBillstatus);
            
            if (GasBillstatus === "processing") {
                await expect(GasBillstatus).toBe("processing");
                break;
            }
            
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(500);
        }
            
        // If the loop exits without matching the status, throw an error
        if (GasBillstatus !== "processing") {
            throw new Error(`Expected status "processing" not met after ${maxRetries} retries.`);
        }
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


    async Update_Building_Billing(ShortCode: string, IsHandledBilling: boolean) {
        const { data,error} = await supabase
        .from('Building')
        .update({ isHandleBilling: IsHandledBilling })
        .eq('shortCode', ShortCode )
        .select()
        .throwOnError();
        console.log(data);
        console.log(error);
    }


}


export default SupabaseQueries;
