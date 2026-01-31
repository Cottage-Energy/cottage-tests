/**
 * Move-In Test Utilities - Backward Compatibility Layer
 * 
 * This file re-exports from the new modular structure.
 * For new code, prefer importing directly from './moveIn'
 * 
 * @deprecated Import from './moveIn' instead for better organization
 * @example
 * // Old way (still works):
 * import { New_User_Move_In_Auto_Payment_Added } from './moveInUtilities';
 * 
 * // New way (preferred):
 * import { newUserMoveIn, MoveInTestUtilities } from './moveIn';
 * const result = await newUserMoveIn(page, {
 *   electricCompany: 'COMED',
 *   paymentType: 'auto',
 *   addPaymentMethod: true
 * });
 */

// Re-export the new unified utilities
export { 
    MoveInTestUtilities,
    newUserMoveIn,
    type MoveInOptions,
    type MoveInResult 
} from './moveIn';

// Keep the old imports for the legacy functions below
import { generateTestUserData } from '../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { MoveInPage } from '../../resources/page_objects/move_in_page';
import * as MoveIndata from '../../resources/data/move_in-data.json';
import * as PaymentData from '../../resources/data/payment-data.json';
import { TIMEOUT } from 'dns';

const supabaseQueries = new SupabaseQueries();

//Modify flow such that if both electric and gas are false it will not continue the flow
//Modify also, that if Electric is false and Gas is not visible it not continue the flow

//Create a unified code block for all the move in flows
//Move pay through PG here with default value of true

/**
 * @deprecated Use newUserMoveIn(page, { paymentType: 'auto', addPaymentMethod: true }) instead
 */
export async function New_User_Move_In_Auto_Payment_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false ;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) {
                if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) {
                if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();


    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
   
    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        console.log("Electric Questions Present: " + electricQuestionsPresent);
        console.log("Gas Questions Present: " + gasQuestionsPresent);
        await moveInpage.Next_Move_In_Button();
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Manual_Payment_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) {
                if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) {
                if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Disable_Auto_Payment();
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Skip_Payment(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) {
                if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) {
                if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }
    
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.FourDaysFromNow);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    if (PaymentPageVisibility === true) {
        await moveInpage.Skip_Payment_Details();
        await moveInpage.Check_Almost_Done_Move_In_Billing_Customer()
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Auto_Bank_Account_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Manual_Bank_Account_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }
        
    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Disable_Auto_Payment();
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Auto_Failed_Bank_Account_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Invalid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Invalid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Manual_Failed_Bank_Account_Added(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Invalid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Disable_Auto_Payment();
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Invalid_Bank_Details(PGuser.Email, PGUserName, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Fix_TX_DEREG_Address(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.TX_DEREGaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Address_Parameter_Flow(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Unit(PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }


    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_GUID_Flow(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address_GUID_Flow(addressType,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info_GUID_Flow(PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}

export async function New_User_Move_In_Address_Parameter_And_GUID_Flow(page: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    let electricQuestionsPresent = false;
    let gasQuestionsPresent = false;
    let addressType = MoveIndata.COMEDaddress;

    if (ElectricCompany === null) {
        try {
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { addressType = (MoveIndata as any)[`${gasCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Gas company");
        } catch (error) {
            console.log("No address type found for this Gas company");
            addressType = MoveIndata.COMEDaddress;
        }
    } else {
        try {
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { addressType = (MoveIndata as any)[`${electricCompany}address`]; }
            if (!addressType) throw new Error("Address type is undefined for this Electric company");
        } catch (error) {
            console.log("No address type found for this Electric company");
            addressType = MoveIndata.COMEDaddress;
        }
    }
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Parameterized_Address_GUID_Flow(PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Setup_Account(NewElectric, NewGas);
    } catch (error) {
        console.log("TX-DEREG Service Zip Agreenment");
        await moveInpage.Texas_Service_Agreement();
    }

    await moveInpage.Next_Move_In_Button();
    await moveInpage.Power_Up_Your_Account();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info_GUID_Flow(PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    try{
        await moveInpage.Program_Enrolled_Questions();
        electricQuestionsPresent = true;
        gasQuestionsPresent = true;
    }
    catch(error){
        console.log(error);
        console.log("No questions to answer for this Program Enrolled");
    }

    if (ElectricCompany === GasCompany) {
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            try{
                const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
                if (gasCompany) { await (moveInpage as any)[`${gasCompany}_Questions`](); }
                gasQuestionsPresent = true;
            }
            catch(error){
                console.log("No questions to answer for these companies");
            }
        }
    }
    else{
        try{
            const electricCompany = ElectricCompany ? ElectricCompany.replace(/-/g, '_') : null;
            if (electricCompany) { 
                await (moveInpage as any)[`${electricCompany}_Questions`](); 
                electricQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Electric company");
        }


        try{
            const gasCompany = GasCompany ? GasCompany.replace(/-/g, '_') : null;
            if (gasCompany) { 
                await (moveInpage as any)[`${gasCompany}_Questions`](); 
                gasQuestionsPresent = true;
            }
        }
        catch(error){
            console.log(error);
            console.log("No questions to answer for this Gas company")
        }
    }

    if (electricQuestionsPresent === true || gasQuestionsPresent === true) {
        await moveInpage.Next_Move_In_Button();
    }

    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Submit_Move_In_Button();
    
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    const PayThroughPGVisibility = await moveInpage.Check_PayThroughPG_Visibility(ElectricCompany, GasCompany);
    //check also is billing required, if true set PayThroughPG to true
    if (PaymentPageVisibility === true && PayThroughPG === true) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else if (PaymentPageVisibility === true && PayThroughPG === false) {
        await moveInpage.Enter_Card_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip, PayThroughPG);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Check_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


/////////////////////////////////////////////////////////////////////////


export async function Move_In_Existing_Utility_Account(page: any, NewElectric: boolean, NewGas: boolean, SubmitRequest: boolean) {
    const moveInpage = new MoveInPage(page);
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Existing_Utility_Account_Connect_Request(PGUserEmail, SubmitRequest);
    return {
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export const MoveInTestUtilities = {
    New_User_Move_In_Auto_Payment_Added,
    New_User_Move_In_Manual_Payment_Added,
    New_User_Move_In_Skip_Payment,
    New_User_Move_In_Auto_Bank_Account_Added,
    New_User_Move_In_Manual_Bank_Account_Added,
    New_User_Move_In_Auto_Failed_Bank_Account_Added,
    New_User_Move_In_Manual_Failed_Bank_Account_Added,
    New_User_Move_In_Fix_TX_DEREG_Address,
    New_User_Move_In_Address_Parameter_Flow,
    New_User_Move_In_GUID_Flow,
    New_User_Move_In_Address_Parameter_And_GUID_Flow,

    Move_In_Existing_Utility_Account
};





