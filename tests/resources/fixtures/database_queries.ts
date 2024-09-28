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


    async Check_Cottage_User_Account_Number(Email: string) {
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('accountNumber')
            .eq('email', Email)
            .single()
            .throwOnError();
        const cottageUserAccountNUmber = cottageUser?.accountNumber ?? '';
        await expect(cottageUserAccountNUmber).not.toBeNull;
    }
    

    async Get_Electric_Account_Id(cottageUserId: string) {
        const { data: EAccount } = await supabase
            .from('ElectricAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
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
            .maybeSingle()
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


    async Check_Gas_Bill_Reminder(GasAccountId: string, state:boolean) {
        const { data: GasBillReminder } = await supabase
            .from('GasBill')
            .select('isSendReminder')
            .eq('gasAccountID', GasAccountId)
            .single()
            .throwOnError();
        const GasBillreminder = GasBillReminder?.isSendReminder ?? '';
        console.log(GasBillreminder);
        await expect(GasBillreminder).toBe(state);
    }


    async Check_Electric_Bill_Visibility(ElectricAccountId: string, state: boolean) {
        const maxRetries = 3;
        let retries = 0;
        let ElectricBillVis;

        while (retries < maxRetries) {
            const { data } = await supabase
                .from('ElectricBill')
                .select('visible')
                .eq('electricAccountID', ElectricAccountId)
                .single()
                .throwOnError();

            ElectricBillVis = data;

            if (ElectricBillVis) {
                break;
            }

            retries++;
            if (retries < maxRetries) {
                console.log(`No data found, retrying in 10 seconds... (${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds
            }
        }

        if (!ElectricBillVis) {
            throw new Error('No data found after maximum retries');
        }

        const ElectricBillvisib = ElectricBillVis?.visible ?? '';
        console.log(ElectricBillvisib);
        await expect(ElectricBillvisib).toBe(state);
    }


    async Check_Gas_Bill_Visibility(GasAccountId: string, state: boolean) {
        const maxRetries = 3;
        let retries = 0;
        let GasBillVis;
    
        while (retries < maxRetries) {
            const { data } = await supabase
                .from('GasBill')
                .select('visible')
                .eq('gasAccountID', GasAccountId)
                .single()
                .throwOnError();
    
            GasBillVis = data;
    
            if (GasBillVis) {
                break;
            }
    
            retries++;
            if (retries < maxRetries) {
                console.log(`No data found, retrying in 10 seconds... (${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds
            }
        }
    
        if (!GasBillVis) {
            throw new Error('No data found after maximum retries');
        }
    
        const GasBillvisib = GasBillVis?.visible ?? '';
        console.log(GasBillvisib);
        await expect(GasBillvisib).toBe(state);
    }

    
    async Check_Electric_Bill_Paid_Notif(ElectricAccountId: string, state:boolean) {
        
        const maxRetries = 10;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ElectricBillpaidNotif = false;

        while (retries < maxRetries) {
            const { data: ElectricBillPaidNotif } = await supabase
                .from('ElectricBill')
                .select('paidNotificationSent')
                .eq('electricAccountID', ElectricAccountId)
                .single()
                .throwOnError();
            
            ElectricBillpaidNotif = Boolean(ElectricBillPaidNotif?.paidNotificationSent);
            console.log(ElectricBillpaidNotif);

            if (ElectricBillpaidNotif === state) {
                await expect(ElectricBillpaidNotif).toBe(state);
                break;
            }

            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(15000);
        }

        if (ElectricBillpaidNotif !== state) {
            throw new Error(`Expected status '${state}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Gas_Bill_Paid_Notif(GasAccountId: string, state:boolean) {

        const maxRetries = 10;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let GasBillpaidNotif = false;

        while (retries < maxRetries) {
            const { data: GasBillPaidNotif } = await supabase
                .from('GasBill')
                .select('paidNotificationSent')
                .eq('gasAccountID', GasAccountId)
                .single()
                .throwOnError();
            
            GasBillpaidNotif = Boolean(GasBillPaidNotif?.paidNotificationSent);
            console.log(GasBillpaidNotif);
            
            if (GasBillpaidNotif === state) {
                await expect(GasBillpaidNotif).toBe(state);
                break;
            }

            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(15000);
        }

        if (GasBillpaidNotif !== state) {
            throw new Error(`Expected status '${state}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Electric_Bill_Status(ElectricAccountId: string, status: string) {
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
        
            if (ElectricBillstatus === status) {
                await expect(ElectricBillstatus).toBe(status);
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(5000);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ElectricBillstatus !== status) {
            throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Gas_Bill_Status(GasAccountId: string, status:string) {
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
            
            if (GasBillstatus === status) {
                await expect(GasBillstatus).toBe(status);
                break;
            }
            
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(5000);
        }
            
        // If the loop exits without matching the status, throw an error
        if (GasBillstatus !== status) {
            throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Electric_Bill_Processing(ElectricAccountId: string) {
        const maxRetries = 500;
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
        
            if (ElectricBillstatus === "processing" || ElectricBillstatus === "succeeded") {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(50);
        }

        await expect(ElectricBillstatus).toMatch(/^(processing|succeeded)$/);
        
    }


    async Check_Gas_Bill_Processing(GasAccountId: string) {
        const maxRetries = 500;
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
            
            if (GasBillstatus === "processing" || GasBillstatus === "succeeded") {
                break;
            }
            
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(50);
        }

        await expect(GasBillstatus).toMatch(/^(processing|succeeded)$/);
            
    }


    async Check_Electric_Bill_Service_Fee(ElectricAccountId: string, Amount: number, Usage: number, Expectedfee: string | null) {
        
        const { data: ElectricBill } = await supabase
            .from('ElectricBill')
            .select('transactionFee')
            .eq('electricAccountID', ElectricAccountId)
            .eq('totalAmountDue', Amount)
            .eq('totalUsage', Usage)
            .single()
            .throwOnError();

        const BillFee = ElectricBill?.transactionFee ?? '';
        const ActualFee = Number(BillFee) / 100;
        console.log(ActualFee);

        await expect(ActualFee).toBe(Number(Expectedfee));
    }


    async Check_Gas_Bill_Service_Fee(GasAccountId: string, Amount: number, Usage: number, Expectedfee: string | null) {
        
        const { data: GasBill } = await supabase
            .from('GasBill')
            .select('transactionFee')
            .eq('gasAccountID', GasAccountId)
            .eq('totalAmountDue', Amount)
            .eq('totalUsage', Usage)
            .single()
            .throwOnError();

        const BillFee = GasBill?.transactionFee ?? '';
        const ActualFee = Number(BillFee) / 100;
        console.log(ActualFee);

        await expect(ActualFee).toBe(Number(Expectedfee));
    }


    async Get_Question_Id(company: string) {
        const { data: Question } = await supabase
            .from('UtilityCompanyQuestion')
            .select('id')
            .eq('utilityCompanyID', company)
            .maybeSingle()
            .throwOnError();
        const QuestionId = Question?.id ?? '';
        return QuestionId;
    }


    async Check_BGE_Answer(cottageUserId: string, questionId: string, Answer: string) {
        
        const { data: UtilAnswer } = await supabase
            .from('UtilityQuestionAnswer')
            .select('answer')
            .eq('cottageUserID', cottageUserId)
            .eq('questionID', questionId)
            .single()
            .throwOnError();

        const utilAnswer = UtilAnswer?.answer ?? '';

        await expect(utilAnswer).toBe(Answer);
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


    async Check_Registration_Job_Completion(JobId: string) {
        const maxRetries = 10;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let JobStatus = '';

        while (retries < maxRetries) {
            const { data: Job } = await supabase
                .from('RegistrationJob')
                .select('status')
                .eq('id', JobId)
                .maybeSingle()
                .throwOnError();
            JobStatus = Job?.status ?? '';
            console.log(JobStatus);

            if (JobStatus === 'COMPLETE' || JobStatus === 'FAILED') {
                break;
            }

            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(30000);
        }
        
        await expect(JobStatus).toBe('COMPLETE');
    }


    async Get_Running_Registration_Job (cottageUserId: string) {
        const maxRetries = 60;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let RegJobId = '';

        while (retries < maxRetries) {
            const { data: RegJob } = await supabase
                .from('RegistrationJob')
                .select('id')
                .eq('forCottageUserID', cottageUserId)
                .eq('status', 'RUNNING')
                .maybeSingle()
                .throwOnError();
            RegJobId = RegJob?.id ?? '';
            console.log(RegJobId);

            if (RegJobId !== '') {
                break;
            }

            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(500);
        }
        return RegJobId;
    }


    async Get_Electric_Account_Id_Non_Test(cottageUserId: string) {
        const { data: EAccount } = await supabase
            .from('ElectricAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const ElectricAccountId = EAccount?.id ?? '';
        console.log(ElectricAccountId.toString());
        return ElectricAccountId.toString();
    }
    

    async Get_Gas_Account_Id_Non_Test(cottageUserId: string) {
        const { data: GAccount } = await supabase
            .from('GasAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const GasAccountId = GAccount?.id ?? '';
        console.log(GasAccountId.toString());
        return GasAccountId.toString();
    }


    async Get_Property_Id_by_Electric_Account(cottageUserId: string) {
        const { data: EAccount } = await supabase
            .from('ElectricAccount')
            .select('propertyID')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const PropertyId = EAccount?.propertyID ?? '';
        console.log(PropertyId.toString());
        return PropertyId.toString();
    }


    async Get_Property_Id_by_Gas_Account(cottageUserId: string) {
        const { data: GAccount } = await supabase
            .from('GasAccount')
            .select('propertyID')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const PropertyId = GAccount?.propertyID ?? '';
        console.log(PropertyId.toString());
        return PropertyId.toString();
    }


    async delete_Cottage_User(cottageUserId: string) {
        const { error } = await supabase
            .from('CottageUsers')
            .delete()
            .eq('id', cottageUserId);
    
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Successfully deleted Cottage User');
        }
    }


    async delete_Electric_Account(ElectricAccountID: number) {
        const { error } = await supabase
            .from('ElectricAccount')
            .delete()
            .eq('id', ElectricAccountID);
    
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Successfully deleted Electric Account');
        }
    }


    async delete_Gas_Account(GasAccountID: number) {
        const { error } = await supabase
            .from('GasAccount')
            .delete()
            .eq('id', GasAccountID);
    
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Successfully deleted Gas Account');
        }
    }


    async delete_Property(PropertyId: number) {
        const { error } = await supabase
            .from('Property')
            .delete()
            .eq('id', PropertyId);
    
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Successfully deleted Property');
        }
    }


}


export default SupabaseQueries;
