import { expect } from '@playwright/test';
import {FastmailClient} from '../../resources/utils/fastmail/client';

const fastMail = new FastmailClient();

export async function Get_OTP(Email: string) {
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


export async function Check_Start_Service_Confirmation(Email: string, AccountNumber: string, ElectricCompany?: string | null, GasCompany?: string | null) {
    const content = await fastMail.fetchEmails({to: Email, subject: `Start Service Confirmation: ${AccountNumber}`, from: "Public Grid Team <welcome@onepublicgrid.com>"});
    const email_body = content[0].bodyValues[1].value;
    //console.log(email_body);
    await expect(content.length).toEqual(1);
    await expect(email_body).toContain(AccountNumber);

    if (ElectricCompany) {
        await expect(email_body).toContain(`${ElectricCompany} logo`);
    }

    if (GasCompany) {
        await expect(email_body).toContain(`${GasCompany} logo`);
    }
}





export const FastmailActions = {
    Get_OTP,
    Check_Start_Service_Confirmation
};