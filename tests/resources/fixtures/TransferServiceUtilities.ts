import { generateTestUserData } from './test_user';
import { SupabaseQueries } from './database_queries';
import * as MoveIndata from '../data/move_in-data.json';
import * as PaymentData from '../data/payment-data.json';


const supabaseQueries = new SupabaseQueries();

//Modify flow such that if both electric and gas are false it will not continue the flow
//Modify also, that if Electric is false and Gas is not visible it not continue the flow
//COMED block can be used for DTE
//EVERSOURCE block can be used for NGMA, PSEG

export async function COMED_New_User_Move_In(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();


    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility();
    if (PaymentPageVisibility === true) {
        await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
        await moveInpage.Confirm_Payment_Details();
        await moveInpage.Check_Successful_Move_In_Billing_Customer();
    }
    else {
        await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    }

    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Skip_Payment_Details();

    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer()
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Bank_Account_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Failed_Bank_Account_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Invalid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Bank_Account_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Non_Billing(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Non_Billing(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer()
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Manual_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Disable_Auto_Payment();
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Bank_Account_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Non_Billing(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Payment_Details(cardNumber,PGuser.CardExpiry,PGuser.CVC,PGuser.Country,PGuser.Zip);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_CON_ED_New_User_Move_In_Non_Billing(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Check_Successful_Move_In_Non_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    const questionId = await supabaseQueries.Get_Question_Id("BGE");
    await supabaseQueries.Check_BGE_Answer(cottageUserId, questionId, BGEanswer);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_COMED_New_User_Move_In_Bank_Account_Added(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Enter_Valid_Bank_Details(PGuser.Email, PGUserName);
    await moveInpage.Confirm_Payment_Details();
    await moveInpage.Check_Successful_Move_In_Billing_Customer();
    const accountNumber = await moveInpage.Get_Account_Number();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_COMED_New_User_Move_In_Skip_Payment(moveInpage: any, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Transfer_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();

    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export const TransferServiceTestUtilities = {
    //COMED Block can be used for DTE
    COMED_New_User_Move_In,
    COMED_New_User_Move_In_Skip_Payment,
    COMED_New_User_Move_In_Auto_Payment_Added,
    COMED_New_User_Move_In_Manual_Payment_Added,
    COMED_New_User_Move_In_Bank_Account_Added,
    COMED_New_User_Move_In_Failed_Bank_Account_Added,

    CON_ED_New_User_Move_In_Auto_Payment_Added,
    CON_ED_New_User_Move_In_Bank_Account_Added,
    CON_ED_New_User_Move_In_Non_Billing,
    CON_ED_New_User_Move_In_Manual_Payment_Added,
    CON_ED_New_User_Move_In_Manual_Bank_Payment_Added,
    CON_ED_New_User_Move_In_Skip_Payment,

    //EVERSOURCE Block can be used for NGMA, PSEG
    EVERSOURCE_New_User_Move_In_Auto_Payment_Added,
    EVERSOURCE_New_User_Move_In_Non_Billing,
    EVERSOURCE_New_User_Move_In_Manual_Payment_Added,
    EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added,
    EVERSOURCE_New_User_Move_In_Skip_Payment,

    BGE_New_User_Move_In_Auto_Payment_Added,
    BGE_New_User_Move_In_Manual_Payment_Added,
    BGE_New_User_Move_In_Manual_Bank_Payment_Added,
    BGE_New_User_Move_In_Bank_Account_Added,
    BGE_New_User_Move_In_Skip_Payment,
    BGE_New_User_Move_In_Non_Billing,

    BGE_CON_ED_New_User_Move_In_Auto_Payment_Added,
    BGE_CON_ED_New_User_Move_In_Non_Billing,

    CON_ED_COMED_New_User_Move_In_Bank_Account_Added,
    CON_ED_COMED_New_User_Move_In_Skip_Payment
};