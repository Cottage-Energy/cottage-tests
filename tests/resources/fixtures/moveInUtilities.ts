import { generateTestUserData } from '../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import * as MoveIndata from '../../resources/data/move_in-data.json';
import * as PaymentData from '../../resources/data/payment-data.json';
import { tr } from '@faker-js/faker';

const supabaseQueries = new SupabaseQueries();

//Modify flow such that if both electric and gas are false it will not continue the flow
//Modify also, that if Electric is false and Gas is not visible it not continue the flow

export async function COMED_New_User_Move_In(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Payment_Details(PaymentData.ValidCardNUmber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    return {
        cottageUserId,
        PGUserEmail
    };
}


export const MoveInTestUtilities = {
    COMED_New_User_Move_In,
    CON_ED_New_User_Move_In_Auto_Payment_Added,
    EVERSOURCE_New_User_Move_In_Auto_Payment_Added,
    CON_ED_New_User_Move_In_Manual_Payment_Added,
    EVERSOURCE_New_User_Move_In_Manual_Payment_Added,
    CON_ED_New_User_Move_In_Skip_Payment,
    EVERSOURCE_New_User_Move_In_Skip_Payment
};