import { expect } from '@playwright/test';
import {FastmailClient} from '../../resources/utils/fastmail/client';

const fastMail = new FastmailClient();

export async function Get_OTP(Email: string) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;

    
    while (retries < maxRetries) {
        const EmailLowerCase = Email.toLowerCase();
        const content = await fastMail.fetchEmails({to: EmailLowerCase, subject: "Public Grid: One Time Passcode", from: "Public Grid Team <support@onepublicgrid.com>"});
        console.log(content.length);
        await expect(content.length).toEqual(1);
        const email_body = content[0].bodyValues[2].value;
    
        const regex = /<p>Enter this code to login: (\d+)<\/p>/;
        const match = email_body.match(regex);

        if (match) {
            const code = match[1];
            console.log(code);
            return code;
            break;
        }

        retries++;
        console.log(`Retrying... (${retries}/${maxRetries})`);
        await delay(30000);
    }
}


export async function Check_Start_Service_Confirmation(Email: string, AccountNumber: string) {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;

    
    while (retries < maxRetries) {
        const EmailLowerCase = Email.toLowerCase();
        const content = await fastMail.fetchEmails({to: EmailLowerCase, subject: `Start Service Confirmation: ${AccountNumber}`, from: "Public Grid Team <support@onepublicgrid.com>"});
        console.log(content.length);
        await expect(content.length).toEqual(1);
        const email_body = content[0].bodyValues[2].value;
    
        const regex = /<p>Enter this code to login: (\d+)<\/p>/;
        const match = email_body.match(regex);

        if (match) {
            const code = match[1];
            console.log(code);
            return code;
            break;
        }

        retries++;
        console.log(`Retrying... (${retries}/${maxRetries})`);
        await delay(30000);
    }
}





export const FastmailActions = {
    Get_OTP
};