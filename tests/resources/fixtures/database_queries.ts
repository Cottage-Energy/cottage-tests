import { expect } from '@playwright/test';
import {supabase} from '../../resources/utils/supabase';

export class SupabaseQueries{

    async Check_Cottage_User_Id(Email: string, TextConsent?: boolean) {
        const email = Email.toLowerCase();
        console.log(email);
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('*')
            .eq('email', email)
            .single()
            .throwOnError();
        const cottageUserId = cottageUser?.id ?? '';
        const UserDateofTextConsent = cottageUser?.dateOfTextMessageConsent ?? null;
        const isAbleToSendText = cottageUser?.isAbleToSendTextMessages ?? null;
        console.log(cottageUserId);
        console.log('TextDate:', UserDateofTextConsent);
        console.log('Text:', isAbleToSendText);
        await expect(cottageUserId).not.toBe("");

        if (TextConsent === true) {
            await expect(UserDateofTextConsent).not.toBeNull();
            await expect(isAbleToSendText).toBe(true);
        }
        else if (TextConsent === false) {
            await expect(UserDateofTextConsent).toBeNull();
            await expect(isAbleToSendText).toBe(false);
        }

        return cottageUserId;
    }

    async Get_Cottage_User_Id(Email: string) {
        const email = Email.toLowerCase();
        console.log(email);
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('*')
            .eq('email', email)
            .single()
        const cottageUserId = cottageUser?.id ?? '';
        console.log(cottageUserId);
        return cottageUserId;
    }


    async Check_Cottage_User_Id_Not_Present(Email: string) {
        const email = Email.toLowerCase();
        console.log(email);
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('id')
            .eq('email', email)
            .maybeSingle()
        await expect(cottageUser).toBeNull();
    }


    async Check_Cottage_User_Account_Number(Email: string) {
        const email = Email.toLowerCase();
        const { data: cottageUser } = await supabase
            .from('CottageUsers')
            .select('accountNumber')
            .eq('email', email)
            .single()
            .throwOnError();
        const cottageUserAccountNUmber = cottageUser?.accountNumber ?? '';
        await expect(cottageUserAccountNUmber).not.toBeNull;
        console.log("PG Account No.:", cottageUserAccountNUmber.toString());
        return cottageUserAccountNUmber.toString();
    }
    

    async Check_Get_Electric_Account_Id(cottageUserId: string) {
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


    async Get_Electric_Account_Id(cottageUserId: string) {
        const { data: EAccount } = await supabase
            .from('ElectricAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const ElectricAccountId = EAccount?.id ?? null;
        console.log(ElectricAccountId?.toString() ?? 'null');
        return ElectricAccountId?.toString() ?? null;
    }

    async Get_Gas_Account_Id(cottageUserId: string) {
        const { data: GAccount } = await supabase
            .from('GasAccount')
            .select('id')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
            .throwOnError();
        const GasAccountId = GAccount?.id ?? null;
        console.log(GasAccountId?.toString() ?? 'null');
        return GasAccountId?.toString() ?? null;
    }
    

    async Check_Get_Gas_Account_Id(cottageUserId: string) {
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


    async Check_Waitlist(Email: string) {
        const { data: waitList } = await supabase
            .from('WaitList')
            .select('id')
            .eq('email', Email)
            .single()
            .throwOnError();
        const waitListId = waitList?.id ?? '';
        console.log(waitListId);
        await expect(waitList).not.toBeNull();
    }


    async Check_Waitlist_Not_Present(Email: string) {
        const { data: waitList } = await supabase
            .from('WaitList')
            .select('id')
            .eq('email', Email)
            .maybeSingle()
        await expect(waitList).toBeNull();
    }


    async Check_isRegistrationComplete(cottageUserId: string, state: boolean = true) {
        const { data: Resident } = await supabase
            .from('Resident')
            .select('isRegistrationComplete')
            .eq('cottageUserID', cottageUserId)
            .single()
            .throwOnError();
        const isRegistrationComplete = Resident?.isRegistrationComplete ?? '';
        console.log('isRegComplete:',isRegistrationComplete);
        await expect(isRegistrationComplete).toBe(state);
    }


    async Get_isPriorAddressRequired_Utility(utilityId: string) {
        console.log(utilityId);
        const { data: Utility } = await supabase
            .from('UtilityCompany')
            .select('isPriorAddressRequired')
            .eq('id', utilityId)
            .single()
            .throwOnError();
        const isPriorAddressRequired = Utility?.isPriorAddressRequired ?? '';
        return isPriorAddressRequired;
    }


    async Get_isHandledBilling_Building(ShortCode: string) {
        const { data: Building } = await supabase
            .from('Building')
            .select('isHandleBilling')
            .eq('shortCode', ShortCode)
            .single()
            .throwOnError();
        const isHandledBilling = Building?.isHandleBilling ?? '';
        console.log("isHandledBilling:",isHandledBilling);
        return isHandledBilling;
    }


    async Get_isHandledBilling_Utility(utilityId: string) {
        console.log(utilityId);
        const { data: Utility } = await supabase
            .from('UtilityCompany')
            .select('isHandleBilling')
            .eq('id', utilityId)
            .single()
            .throwOnError();
        const isHandledBilling = Utility?.isHandleBilling ?? '';
        console.log("isHandledBilling:",isHandledBilling);
        return isHandledBilling;
    }


    async Get_isBillingRequired_Utility(utilityId: string) {
        const { data: Utility } = await supabase
            .from('UtilityCompany')
            .select('isBillingRequired')
            .eq('id', utilityId)
            .single()
            .throwOnError();
        const isBillingRequired = Utility?.isBillingRequired ?? '';
        console.log("isBillingRequired:",isBillingRequired);
        return isBillingRequired;
    }


    async Get_Electric_Plane_Ticket_Id(cottageUserId: string) {
        const { data: ElectricTicket } = await supabase
            .from('ElectricAccount')
            .select('planeTicketID')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
        const ElectricPlaneTicketId = ElectricTicket?.planeTicketID ?? '';
        console.log("Plane Ticket Electric: ",ElectricPlaneTicketId.toString());
        return ElectricPlaneTicketId.toString();
    }


    async Get_Gas_Plane_Ticket_Id(cottageUserId: string) {
        const { data: GasTicket } = await supabase
            .from('GasAccount')
            .select('planeTicketID')
            .eq('cottageUserID', cottageUserId)
            .maybeSingle()
        const GasPlaneTicketId = GasTicket?.planeTicketID ?? '';
        console.log("Plane Ticket Gas: ",GasPlaneTicketId.toString());
        return GasPlaneTicketId.toString();
    }



    //////////// Bill Queries ////////////
    //Insert bill

    async Insert_Electric_Bill(electricAccountId: string | null, totalAmountDue?: number, totalUsage?: number) {
        const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
        const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);
        
        const { data: bill, error } = await supabase
            .from('ElectricBill')
            .insert({
                electricAccountID: parseInt(electricAccountId??''),
                totalAmountDue: amount,
                totalUsage: usage,
                startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                visible: false,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select('id')
            .single()
            .throwOnError();
            
        const billId = bill?.id ?? '';
        console.log("Inserted Electric Bill ID:", billId.toString());
        return billId.toString();
    }

    async Insert_Gas_Bill(gasAccountId: string | null, totalAmountDue?: number, totalUsage?: number) {
        const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
        const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);
        
        const { data: bill, error } = await supabase
            .from('GasBill')
            .insert({
                gasAccountID: parseInt(gasAccountId??''),
                totalAmountDue: amount,
                totalUsage: usage,
                startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                visible: false,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select('id')
            .single()
            .throwOnError();
            
        const billId = bill?.id ?? '';
        console.log("Inserted Gas Bill ID:", billId.toString());
        return billId.toString();
    }

    async Insert_Approved_Electric_Bill(electricAccountId: string, totalAmountDue?: number, totalUsage?: number) {
        const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
        const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);
        
        const { data: bill, error } = await supabase
            .from('ElectricBill')
            .insert({
                electricAccountID: parseInt(electricAccountId),
                totalAmountDue: amount,
                totalUsage: usage,
                startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                visible: false,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                ingestionState: 'approved'
            })
            .select('id')
            .single()
            .throwOnError();
            
        const billId = bill?.id ?? '';
        console.log("Inserted Electric Bill ID:", billId.toString());
        return billId.toString();
    }

    async Insert_Approved_Gas_Bill(gasAccountId: string, totalAmountDue?: number, totalUsage?: number) {
        const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
        const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);
        
        const { data: bill, error } = await supabase
            .from('GasBill')
            .insert({
                gasAccountID: parseInt(gasAccountId),
                totalAmountDue: amount,
                totalUsage: usage,
                startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                visible: false,
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                ingestionState: 'approved'
            })
            .select('id')
            .single()
            .throwOnError();
            
        const billId = bill?.id ?? '';
        console.log("Inserted Gas Bill ID:", billId.toString());
        return billId.toString();
    }

    

    //Apprrove Bill
    async Approve_Electric_Bill(BillId: string) {
        const { data,error} = await supabase
        .from('ElectricBill')
        .update({ ingestionState: 'approved' })
        .eq('id', BillId )
        .select()
        .throwOnError();
        console.log(data);
        console.log(error);
    }

    async Approve_Gas_Bill(BillId: string) {
        const { data,error} = await supabase
        .from('GasBill')
        .update({ ingestionState: 'approved' })
        .eq('id', BillId )
        .select()
        .throwOnError();
        console.log(data);
        console.log(error);
    }

    //Bill is processed
    async Check_Electric_Bill_Is_Processed(BillId: string) {
        const maxRetries = 450;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ingestionState = '';
        
        while (retries < maxRetries) {
            const { data: ElectricBillData } = await supabase
                .from('ElectricBill')
                .select('ingestionState')
                .eq('id', BillId)
                .single()
                .throwOnError();
                
            ingestionState = ElectricBillData?.ingestionState ?? '';
            console.log('Electric Bill Ingestion State:', ingestionState);
        
            if (ingestionState === 'processed') {
                await expect(ingestionState).toBe('processed');
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(1000);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ingestionState !== 'processed') {
            throw new Error(`Expected ingestion state 'processed' not met after ${maxRetries} retries.`);
        }
    }

    async Check_Gas_Bill_Is_Processed(BillId: string) {
        const maxRetries = 450;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ingestionState = '';
        
        while (retries < maxRetries) {
            const { data: GasBillData } = await supabase
                .from('GasBill')
                .select('ingestionState')
                .eq('id', BillId)
                .single()
                .throwOnError();
                
            ingestionState = GasBillData?.ingestionState ?? '';
            console.log('Gas Bill Ingestion State:', ingestionState);
        
            if (ingestionState === 'processed') {
                await expect(ingestionState).toBe('processed');
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(1000);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ingestionState !== 'processed') {
            throw new Error(`Expected ingestion state 'processed' not met after ${maxRetries} retries.`);
        }
    }



    //Get Bill ID
    async Get_Electric_Bill_Id(ElectricAccountId: string, Amount: number, Usage: number) {
        const { data: EBill } = await supabase
            .from('ElectricBill')
            .select('id')
            .eq('electricAccountID', ElectricAccountId)
            .eq('totalAmountDue', Amount)
            .eq('totalUsage', Usage)    
            .single()
            .throwOnError();
        const ElectricBillId = EBill?.id ?? '';
        console.log("Electric Bill ID:", ElectricBillId.toString());
        return ElectricBillId.toString();
    }


    async Get_Gas_Bill_Id(GasAccountId: string, Amount: number, Usage: number) {
        const { data: GBill } = await supabase
            .from('GasBill')
            .select('id')
            .eq('gasAccountID', GasAccountId)
            .eq('totalAmountDue', Amount)
            .eq('totalUsage', Usage)    
            .single()
            .throwOnError();
        const GasBillId = GBill?.id ?? '';
        console.log("Gas Bill ID:", GasBillId.toString());
        return GasBillId.toString();        
    }


    //Get Charge ID and Validity - to be modified
    async Get_Check_Charge_Account(electricAccountId: string | null, gasAccountId: string | null) {
        const maxRetries = 2;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let ChargeAccount: any = null;

        while (retries <= maxRetries) {
            try {
                let query = supabase
                    .from('ChargeAccount')
                    .select('id');

                if (electricAccountId) {
                    query = query.eq('electricAccountID', parseInt(electricAccountId));
                } else {
                    query = query.is('electricAccountID', null);
                }

                if (gasAccountId) {
                    query = query.eq('gasAccountID', parseInt(gasAccountId));
                } else {
                    query = query.is('gasAccountID', null);
                }

                const { data } = await query
                    .single()
                    .throwOnError();
                
                ChargeAccount = data;
                break;
            } catch (error) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`Retrying Get_Check_Charge_Account... (${retries}/${maxRetries})`);
                    await delay(60000);
                } else {
                    throw error;
                }
            }
        }

        const chargeAccountId = ChargeAccount?.id ?? '';
        expect(ChargeAccount).not.toBeNull();
        console.log("Charge ID:", chargeAccountId.toString());
        return chargeAccountId.toString();
    }


    //////////////////////////////// To be Modified to Refer to Payment Table  using Charge ID //////////////////


    async Check_Payment_Status(cottageUserId: string, Amount: number, status: string) {
        const maxRetries = 300;
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
            await delay(3000);
        }
        
        // If the loop exits without matching the status, throw an error
        if (ElectricBillstatus !== status) {
            throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
        }
    }


    async Check_Payment_Processing(cottageUserId: string, Amount: number) {
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
        
            if (ElectricBillstatus === "processing" || ElectricBillstatus === "succeeded"|| ElectricBillstatus === "failed") {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(50);
        }

        await expect(ElectricBillstatus).toMatch(/^(processing|succeeded|failed)$/);
        
    }


    async Check_Utility_Remittance(chargeAccountId: string, Amount: number){

    }


    ///////////////////////////////////////////////////////////////////////////////////

    async Get_Electric_Bill_Start_Date(ElectricAccountId: string) {
        const { data: ElectricBill } = await supabase
            .from('ElectricBill')
            .select('startDate')
            .eq('electricAccountID', ElectricAccountId)
            .maybeSingle()
            .throwOnError();
        const StartDate = ElectricBill?.startDate ?? '';
        return StartDate;
    }


    async Get_Electric_Bill_End_Date(ElectricAccountId: string) {
        const { data: ElectricBill } = await supabase
            .from('ElectricBill')
            .select('endDate')
            .eq('electricAccountID', ElectricAccountId)
            .maybeSingle()
            .throwOnError();
        const EndDate = ElectricBill?.endDate ?? '';
        return EndDate;
    }


    async Get_Gas_Bill_Start_Date(GasAccountId: string) {
        const { data: GasBill } = await supabase
            .from('GasBill')
            .select('startDate')
            .eq('gasAccountID', GasAccountId)
            .maybeSingle()
            .throwOnError();
        const StartDate = GasBill?.startDate ?? '';
        return StartDate;
    }


    async Get_Gas_Bill_End_Date(GasAccountId: string) {
        const { data: GasBill } = await supabase
            .from('GasBill')
            .select('endDate')
            .eq('gasAccountID', GasAccountId)
            .maybeSingle()
            .throwOnError();
        const EndDate = GasBill?.endDate ?? '';
        return EndDate;
    }


    //////////////// Move-in Queries ////////////////


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

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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


    async delete_Electric_Account(ElectricAccountID: string | null) {
        const { error } = await supabase
            .from('ElectricAccount')
            .delete()
            .eq('id', parseInt(ElectricAccountID??''));
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Successfully deleted Electric Account');
        }
    }


    async delete_Gas_Account(GasAccountID: string | null) {
        const { error } = await supabase
            .from('GasAccount')
            .delete()
            .eq('id', parseInt(GasAccountID??''));

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
