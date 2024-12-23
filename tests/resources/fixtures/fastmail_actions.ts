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
    const maxRetries = 2;
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
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(AccountNumber);

    if (ElectricCompany) {
        await expect(email_body).toContain(`${ElectricCompany} logo`);
    }

    if (GasCompany) {
        await expect(email_body).toContain(`${GasCompany} logo`);
    }
}


export async function Check_Need_Payment_Method_to_Start_Electricity_Service(Email: string) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Electricity Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
}


export async function Check_Need_Payment_Method_to_Start_Gas_Service(Email: string) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Gas Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
}


export async function Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service(Email: string) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Action Required: Need Payment Method to Start Electricity and Gas Service`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
}



export async function Check_Electric_Bill_Scheduled_Payment_Email(Email: string, ElectricUsage: any, ElectricBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric Bill is Scheduled for Payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Scheduled Payment email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`${ElectricUsage}kWh`);
    await expect(email_body).toContain(`$${ElectricBillTotal}`);
}


export async function Check_Electric_Bill_Ready_Email(Email: string, ElectricUsage: any, ElectricBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Electric Bill is Ready for Payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Ready email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`${ElectricUsage}kWh`);
    await expect(email_body).toContain(`$${ElectricBillTotal}`);
}


export async function Check_Electric_Bill_Payment_Success(Email: string, ElectricBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Electric Bill Payment Success`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Electric Bill Payment Success email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${ElectricBillTotal}`);
}


export async function Check_Gas_Bill_Scheduled_Payment_Email(Email: string, GasUsage: any, GasBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Gas Bill is Scheduled for Payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Gas Bill Scheduled Payment email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`${GasUsage}therms`); // space is missing in the email
    await expect(email_body).toContain(`$${GasBillTotal}`);
}


export async function Check_Gas_Bill_Ready_Email(Email: string, GasUsage: any, GasBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your Gas Bill is Ready for Payment`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Gas Bill Ready email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`${GasUsage}therms`);
    await expect(email_body).toContain(`$${GasBillTotal}`);
}


export async function Check_Gas_Bill_Payment_Success(Email: string, GasBillTotal: any) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Gas Bill Payment Success`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch Gas Bill Payment Success email after multiple attempts.");
    }
    const email_body = content[0].bodyValues[1].value;
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(`$${GasBillTotal}`);
}


export async function Check_Failed_Payment_Email(Email: string, ElectricBillTotal: any | null, GasBillTotal: any | null) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `[Action Required] Update your Payment Details`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(30000); // delay
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to Get Failed Payment email after multiple attempts.");
    }


    if (ElectricBillTotal === null) {
        const email_body = content[0].bodyValues[1].value;
        //await expect(content.length).toEqual(1);

        await expect(email_body).toContain(`$${GasBillTotal}`);
    }
    else if (GasBillTotal === null) {
        const email_body = content[0].bodyValues[1].value;
        //await expect(content.length).toEqual(1);

        await expect(email_body).toContain(`$${ElectricBillTotal}`);
    }
    else {
        const email1_body = content[0].bodyValues[1].value;
        const email2_body = content[1].bodyValues[1].value;
        //await expect(content.length).toEqual(2);

        try {
            await expect(email1_body).toContain(`$${ElectricBillTotal}`);
            await expect(email2_body).toContain(`$${GasBillTotal}`);
        } catch (error) {
            await expect(email1_body).toContain(`$${GasBillTotal}`);
            await expect(email2_body).toContain(`$${ElectricBillTotal}`);
        }
    }
}








export const FastmailActions = {
    Get_OTP,
    Check_Start_Service_Confirmation,
    Check_Need_Payment_Method_to_Start_Electricity_Service,
    Check_Need_Payment_Method_to_Start_Gas_Service,
    Check_Need_Payment_Method_to_Start_Electricity_and_Gas_Service,
    Check_Electric_Bill_Scheduled_Payment_Email,
    Check_Electric_Bill_Ready_Email,
    Check_Electric_Bill_Payment_Success,
    Check_Gas_Bill_Scheduled_Payment_Email,
    Check_Gas_Bill_Ready_Email,
    Check_Gas_Bill_Payment_Success,
    Check_Failed_Payment_Email
    
};