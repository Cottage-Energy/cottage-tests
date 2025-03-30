import { generateTestUserData } from '../../resources/fixtures/test_user';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import * as MoveIndata from '../../resources/data/move_in-data.json';
import * as PaymentData from '../../resources/data/payment-data.json';
import { TIMEOUT } from 'dns';

const supabaseQueries = new SupabaseQueries();

//Modify flow such that if both electric and gas are false it will not continue the flow
//Modify also, that if Electric is false and Gas is not visible it not continue the flow
//COMED block can be used for DTE, PSEG
//EVERSOURCE block can be used for NGMA, NYS-EG

//Create a unified code block for all the move in flows
//Move pay through PG here with default value of true

export async function COMED_New_User_Move_In(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
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
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_TX_Address(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.TEXASaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_isRegistrationComplete(cottageUserId);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Skip_Payment(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();

    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer()
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Manual_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Bank_Account_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COMED_New_User_Move_In_Failed_Bank_Account_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COMEDaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Bank_Account_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Auto_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Manual_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Manual_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_New_User_Move_In_Skip_Payment(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer()
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function EVERSOURCE_New_User_Move_In_Skip_Payment(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.EVERSOURCEaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_New_User_Move_In_Auto_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    
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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
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


export async function BGE_New_User_Move_In_Manual_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
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


export async function BGE_New_User_Move_In_Manual_Bank_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
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


export async function BGE_New_User_Move_In_Bank_Account_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);
    
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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
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


export async function BGE_New_User_Move_In_Skip_Payment(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    //await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function BGE_CON_ED_New_User_Move_In_Auto_Payment_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    const BGEanswer = await moveInpage.BGE_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
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


export async function CON_ED_COMED_New_User_Move_In_Bank_Account_Added(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Added_Payment_Overview_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function CON_ED_COMED_New_User_Move_In_Skip_Payment(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;

    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.ConEDISONaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Read_ESCO_Conditions();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.CON_ED_Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Skip_Payment_Details();
    await moveInpage.Check_Almost_Done_Move_In_Billing_Customer();
    await moveInpage.Click_Dashboard_Link();
    await moveInpage.Check_Billing_Customer_Skip_Payment_Finish_Account_Redirect();

    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    const accountNumber = await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function TEXAS_New_User_Move_In(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.TEXASaddress,PGuser.UnitNumber);
    //await moveInpage.Enter_Address(MoveIndata.COSERVaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Texas_Service_Agreement();
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Texas_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function TX_DEREG_New_User_Move_In(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.TEXASaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Texas_Questions();
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function COSERV_New_User_Move_In(moveInpage: any, ElectricCompany: string | null, GasCompany: string | null, NewElectric: boolean, NewGas: boolean, PayThroughPG:boolean = true, CCcardNumber?: string) {
    
    const PGuser = await generateTestUserData();
    const PGUserName = "PGTest " + PGuser.FirstName + " " + PGuser.LastName;
    const PGUserFirstName = "PGTest " + PGuser.FirstName;
    const PGUserEmail = PGuser.Email;
    const cardNumber = CCcardNumber || PaymentData.ValidCardNUmber;
    
    await moveInpage.Agree_on_Terms_and_Get_Started()
    await moveInpage.Enter_Address(MoveIndata.COSERVaddress,PGuser.UnitNumber);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Setup_Account(NewElectric, NewGas);
    await moveInpage.Next_Move_In_Button();
    const SMS = await moveInpage.Enter_Personal_Info("PGTest " + PGuser.FirstName,PGuser.LastName,PGuser.PhoneNumber,PGuser.Email,PGuser.Today);
    await moveInpage.Next_Move_In_Button();
    await moveInpage.Enter_ID_Info(PGuser.BirthDate,PGuser.SSN);
    await moveInpage.Enter_ID_Info_Prev_Add(MoveIndata.COMEDaddress, ElectricCompany, GasCompany);
    await moveInpage.Next_Move_In_Button();
    const PaymentPageVisibility = await moveInpage.Check_Payment_Page_Visibility(ElectricCompany, GasCompany);

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
    const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(PGuser.Email, SMS);
    await supabaseQueries.Check_Cottage_User_Account_Number(PGUserEmail);
    return {
        accountNumber,
        cottageUserId,
        PGUserName,
        PGUserFirstName,
        PGUserEmail
    };
}


export async function Move_In_Existing_Utility_Account(moveInpage: any, NewElectric: boolean, NewGas: boolean, SubmitRequest: boolean) {
    
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
    //COMED Block can be used for DTE
    COMED_New_User_Move_In,
    COMED_New_User_TX_Address,
    COMED_New_User_Move_In_Skip_Payment,
    COMED_New_User_Move_In_Auto_Payment_Added,
    COMED_New_User_Move_In_Manual_Payment_Added,
    COMED_New_User_Move_In_Bank_Account_Added,
    COMED_New_User_Move_In_Failed_Bank_Account_Added,

    CON_ED_New_User_Move_In_Auto_Payment_Added,
    CON_ED_New_User_Move_In_Bank_Account_Added,
    CON_ED_New_User_Move_In_Manual_Payment_Added,
    CON_ED_New_User_Move_In_Manual_Bank_Payment_Added,
    CON_ED_New_User_Move_In_Skip_Payment,

    //EVERSOURCE Block can be used for NGMA, PSEG
    EVERSOURCE_New_User_Move_In_Auto_Payment_Added,
    EVERSOURCE_New_User_Move_In_Manual_Payment_Added,
    EVERSOURCE_New_User_Move_In_Manual_Bank_Payment_Added,
    EVERSOURCE_New_User_Move_In_Skip_Payment,

    BGE_New_User_Move_In_Auto_Payment_Added,
    BGE_New_User_Move_In_Manual_Payment_Added,
    BGE_New_User_Move_In_Manual_Bank_Payment_Added,
    BGE_New_User_Move_In_Bank_Account_Added,
    BGE_New_User_Move_In_Skip_Payment,

    BGE_CON_ED_New_User_Move_In_Auto_Payment_Added,

    CON_ED_COMED_New_User_Move_In_Bank_Account_Added,
    CON_ED_COMED_New_User_Move_In_Skip_Payment,

    TEXAS_New_User_Move_In,
    TX_DEREG_New_User_Move_In,
    COSERV_New_User_Move_In,

    Move_In_Existing_Utility_Account
};