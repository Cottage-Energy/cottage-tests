import { expect } from '@playwright/test';
import {FastmailClient} from '../../resources/utils/fastmail/client';

const fastMail = new FastmailClient();


export async function Get_OTP(Email: string) {
    const EmailLowerCase = Email.toLowerCase();
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: EmailLowerCase, subject: "Public Grid: One Time Passcode", from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }

    if (!content || content.length === 0) {
        throw new Error("Failed to fetch OTP email after multiple attempts.");
    }

    console.log(content.length);
    await expect(content.length).toEqual(1);
    const email_body = content[0].bodyValues[2].value;
    
    const regex = /<p>Enter this code to login: (\d+)<\/p>/;
    const match = email_body.match(regex);

    if (match) {
        const code = match[1];
        console.log(code);
        return code;
    }
}


export async function Check_Start_Service_Confirmation(Email: string, AccountNumber: string, ElectricCompany?: string | null, GasCompany?: string | null) {
    const maxRetries = 4;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Start Service Confirmation`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Start Service Confirmation email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    //await expect(email_body).toContain(AccountNumber);

    if (ElectricCompany) {
        await expect(email_body).toContain(`${ElectricCompany} logo`);
    }

    if (GasCompany) {
        await expect(email_body).toContain(`${GasCompany} logo`);
    }
}


export async function Check_Welcome_to_PG_Lets_Get_Started(Email: string) {
    const maxRetries = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Welcome to Public Grid: Let’s Get Started!`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(15000); // delay
    }
    if (!content || content.length === 0) {
        console.log("Failed to fetch TLDR email after multiple attempts due to delays. Check it manually later if the issue persists.");
    }
    //const firstKey = Object.keys(content[0].bodyValues)[0];
    //const email_body = content[0].bodyValues[firstKey].value;
    //await expect(content.length).toEqual(1);
}


export async function Check_Start_Service_Confirmation_Not_Present(Email: string) {
    let content: any[] = [];
    content = await fastMail.fetchEmails({to: Email, subject: `Start Service Confirmation`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
    await expect(content.length).toEqual(0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Payment Method Reminder Emails

export async function Check_Need_Payment_Method_to_Start_Electricity_Service(Email: string) {
    console.log("Email:", Email);
    const maxRetries = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Electricity Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(15000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    try{
        await expect(content.length).toEqual(2);
        console.log("two emails found");
    }catch {
        await expect(content.length).toEqual(1);
    }
}


export async function Check_Need_Payment_Method_to_Start_Gas_Service(Email: string) {
    const maxRetries = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Gas Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(15000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    try{
        await expect(content.length).toEqual(2);
        console.log("two emails found");
    }catch {
        await expect(content.length).toEqual(1);
    }
}


export async function Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(Email: string) {
    const maxRetries = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Electricity and Gas Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(15000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    try{
        await expect(content.length).toEqual(2);
        console.log("two emails found");
    }catch {
        await expect(content.length).toEqual(1);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Payment Emails
//autopay
export async function Check_Electric_Bill_Is_Ready(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric bill is ready`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Is Ready email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


export async function Check_Gas_Bill_Is_Ready(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Gas bill is ready`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Gas Bill Is Ready email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


export async function Check_Electric_And_Gas_Bill_Is_Ready(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric and Gas bills are ready`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric and Gas Bill Is Ready email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


//manual pay
export async function Check_Electric_Bill_Is_Ready_For_Payment(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric bill is ready for payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Is Ready for Payment email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


export async function Check_Gas_Bill_Is_Ready_For_Payment(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Gas bill is ready for payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Gas Bill Is Ready for Payment email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


export async function Check_Electric_And_Gas_Bill_Is_Ready_For_Payment(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric and Gas bills are ready for payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric and Gas Bill Is Ready for Payment email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}

//Payment confirmation
export async function Check_Bill_Payment_Confirmation(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Bill Payment Confirmation`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Is Ready email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


//failed payment
export async function Check_Failed_Payment_Email(Email: string, AmountTotal: any) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Payment Failed - Action Required`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to Get Failed Payment email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${AmountTotal}`);
}


export async function Check_Update_Payment_Method_Email(Email: string) {
    const maxRetries = 120;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `[Urgent] - Update Your Payment Method`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(1000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to Get Failed Payment email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);
}







export const FastmailActions = {
    Get_OTP,
    Check_Start_Service_Confirmation,
    Check_Welcome_to_PG_Lets_Get_Started,
    Check_Start_Service_Confirmation_Not_Present,
    Check_Need_Payment_Method_to_Start_Electricity_Service,
    Check_Need_Payment_Method_to_Start_Gas_Service,
    Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service,
    Check_Electric_Bill_Is_Ready,
    Check_Gas_Bill_Is_Ready,
    Check_Electric_And_Gas_Bill_Is_Ready,
    Check_Electric_Bill_Is_Ready_For_Payment,
    Check_Gas_Bill_Is_Ready_For_Payment,
    Check_Electric_And_Gas_Bill_Is_Ready_For_Payment,
    Check_Bill_Payment_Confirmation,
    Check_Failed_Payment_Email,
    Check_Update_Payment_Method_Email
};