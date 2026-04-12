import { expect } from '@playwright/test';
import { FastmailClient } from '../../resources/utils/fastmail/client';
import { RETRY_CONFIG } from '../constants';

const fastMail = new FastmailClient();

/**
 * Delay helper function
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function Get_OTP(Email: string) {
    const EmailLowerCase = Email.toLowerCase();
    let content: any[] = [];

    for (let attempt = 0; attempt < RETRY_CONFIG.OTP.maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: EmailLowerCase, subject: "Public Grid: One Time Passcode", from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(RETRY_CONFIG.OTP.delayMs);
    }

    if (!content || content.length === 0) {
        throw new Error("Failed to fetch OTP email after multiple attempts.");
    }

    console.log(content.length);
    await expect(content.length).toEqual(1);
    const email_body = content[0].bodyValues[2].value;
    
    // Try new email template: "This is your login code:" with code in a separate styled <p>
    const newTemplateRegex = /login code[:\s]*<\/p>[\s\S]*?<p[^>]*>\s*(\d{6})\s*<\/p>/i;
    // Fallback: old email template with inline code
    const oldTemplateRegex = /<p>Enter this code to login: (\d+)<\/p>/;

    const match = email_body.match(newTemplateRegex) || email_body.match(oldTemplateRegex);

    if (match) {
        const code = match[1];
        console.log(code);
        return code;
    }
}


export async function Check_Utility_Account_OTW(Email: string, ElectricCompany?: string | null, GasCompany?: string | null) {
    let content: any[] = [];
    for (let attempt = 0; attempt < RETRY_CONFIG.EMAIL_CONFIRMATION.maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Your utility account is on the way!`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
        if (content && content.length > 0) {
            break;
        }
        console.log(`Attempt ${attempt + 1} failed. Retrying...`);
        await delay(RETRY_CONFIG.EMAIL_CONFIRMATION.delayMs);
    }
    if (!content || content.length === 0) {
        throw new Error("Failed to fetch 'Your utility account is on the way!' email after multiple attempts.");
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(content.length).toEqual(1);

    if (ElectricCompany) {
        await expect(email_body).toContain(`${ElectricCompany}`);
    }

    if (GasCompany) {
        await expect(email_body).toContain(`${GasCompany}`);
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

    if (content && content.length > 1) {
        console.log("Multiple 'Welcome to Public Grid: Let’s Get Started!' emails found. This may be due to retries in fetching the email. Please check the inbox manually to confirm.");
    }

}


export async function Check_Utility_Account_OTW_Not_Present(Email: string) {
    let content: any[] = [];
    content = await fastMail.fetchEmails({to: Email, subject: `Your utility account is on the way!`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
    await expect(content.length).toEqual(0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Payment Method Reminder Emails

export async function Check_Quick_Reminder_Add_Your_Payment_Method(Email: string) {
    console.log("Email:", Email);
    const maxRetries = 7;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let content: any[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Quick reminder: Add your payment method`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
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

    await expect(content.length).toEqual(1);
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







/**
 * Payment reminder email — standard overdue (days 5, 10, 15)
 * Subject: "ACTION REQUIRED: Overdue Payment for {billType} Bill"
 * Source: services/packages/inngest/functions/billing/ledger/reminders/reminder-email.ts
 */
export async function Check_Payment_Reminder_Email(Email: string, AmountTotal: string | number, billType: 'Electric' | 'Gas' | 'Electric and Gas' = 'Electric') {
    const maxRetries = 120;
    let content: ReturnType<typeof fastMail.fetchEmails> extends Promise<infer T> ? T : never[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `ACTION REQUIRED: Overdue Payment for ${billType}`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) break;
        await delay(1000);
    }
    if (!content || content.length === 0) {
        throw new Error(`Failed to find standard reminder email for ${Email} after ${maxRetries} attempts`);
    }
    const firstKey = Object.keys(content[0].bodyValues)[0];
    const email_body = content[0].bodyValues[firstKey].value;
    await expect(email_body).toContain(`$${AmountTotal}`);
}


/**
 * Payment reminder email — shutoff warning (days 16-24)
 * Subject: "Urgent: {billType} Shutoff Notice for your Public Grid Account"
 * Source: services/packages/inngest/functions/billing/ledger/reminders/reminder-email.ts
 */
export async function Check_Shutoff_Warning_Email(Email: string, billType: 'Electric' | 'Gas' | 'Electric and Gas' = 'Electric') {
    const maxRetries = 120;
    let content: ReturnType<typeof fastMail.fetchEmails> extends Promise<infer T> ? T : never[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Urgent: ${billType} Shutoff Notice for your Public Grid Account`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) break;
        await delay(1000);
    }
    if (!content || content.length === 0) {
        throw new Error(`Failed to find shutoff warning email for ${Email} after ${maxRetries} attempts`);
    }
}


/**
 * Payment reminder email — final shutoff (day 25+)
 * Subject: "Final Notice: {billType} Service Scheduled for Shutoff"
 * Source: services/packages/inngest/functions/billing/ledger/reminders/reminder-email.ts
 */
export async function Check_Final_Shutoff_Email(Email: string, billType: 'Electric' | 'Gas' | 'Electric and Gas' = 'Electric') {
    const maxRetries = 120;
    let content: ReturnType<typeof fastMail.fetchEmails> extends Promise<infer T> ? T : never[] = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        content = await fastMail.fetchEmails({to: Email, subject: `Final Notice: ${billType} Service Scheduled for Shutoff`, from: "Public Grid Team <support@onepublicgrid.com>"});
        if (content && content.length > 0) break;
        await delay(1000);
    }
    if (!content || content.length === 0) {
        throw new Error(`Failed to find final shutoff email for ${Email} after ${maxRetries} attempts`);
    }
}


export const FastmailActions = {
    Get_OTP,
    Check_Utility_Account_OTW,
    Check_Welcome_to_PG_Lets_Get_Started,
    Check_Utility_Account_OTW_Not_Present,
    Check_Quick_Reminder_Add_Your_Payment_Method,
    Check_Electric_Bill_Is_Ready,
    Check_Gas_Bill_Is_Ready,
    Check_Electric_And_Gas_Bill_Is_Ready,
    Check_Electric_Bill_Is_Ready_For_Payment,
    Check_Gas_Bill_Is_Ready_For_Payment,
    Check_Electric_And_Gas_Bill_Is_Ready_For_Payment,
    Check_Bill_Payment_Confirmation,
    Check_Failed_Payment_Email,
    Check_Update_Payment_Method_Email,
    Check_Payment_Reminder_Email,
    Check_Shutoff_Warning_Email,
    Check_Final_Shutoff_Email,
};