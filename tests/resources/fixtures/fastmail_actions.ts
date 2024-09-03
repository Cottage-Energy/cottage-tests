import { expect } from '@playwright/test';
import {FastmailClient} from '../../resources/utils/fastmail/client';

const fastMail = new FastmailClient();

export async function Get_OTP(Email: string) {
    //add retries
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
    }
}





export const FastmailActions = {
    Get_OTP
};