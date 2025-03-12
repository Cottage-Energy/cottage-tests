import { expect } from '@playwright/test';
import {linearClient} from '../../resources/utils/linear';


const env = process.env.ENV || 'dev';

export class LinearActions{


    async CountMoveInTicket(Email: string, ExpectedCount: number) {
        const emailLower = Email.toLowerCase();
        const MoveInteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `move-ins-${env}` } } })).nodes[0].id;

        const maxRetries = 2;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let issuesCount = 0;
        let issuesResponse;

        while (retries < maxRetries) {
            issuesResponse = await linearClient.issues({
                filter: {
                    team: { id: { eq: MoveInteamId } },
                    title: { contains: emailLower },
                },
            });
        
            issuesCount = issuesResponse.nodes.length;
            console.log(`Number of issues: ${issuesCount}`);
            console.log(issuesResponse);
        
            if (issuesCount === ExpectedCount) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(30000);
        }

        expect(issuesCount).toBe(ExpectedCount);
    }


    async DeleteLinearTickets(Email: string) {
        const emailLower = Email.toLowerCase();
        const MoveInteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `move-ins-${env}` } } })).nodes[0].id;
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
  
        const MoveInIssues = await linearClient.issues({
            filter: {
                team: { id: { eq: MoveInteamId } },
                title: { contains: emailLower },
            },
        });
        
        
        const BillingIssues = await linearClient.issues({
            filter: {
                team: { id: { eq: BillingteamId } },
                description: { contains: emailLower },
            },
        });


        
        const MoveInCount = MoveInIssues.nodes.length;
        const BillingCount = BillingIssues.nodes.length;

        if (MoveInCount > 0) {
            for (let i = 0; i < MoveInCount; i++) {
                const issuesId = MoveInIssues.nodes[i].id;
                await linearClient.deleteIssue(issuesId);
                console.log(`Deleted Move-In Ticket: ${issuesId}`);
            }
        }

        if (BillingCount > 0) {
            for (let i = 0; i < BillingCount; i++) {
                const issuesId = BillingIssues.nodes[i].id;
                await linearClient.deleteIssue(issuesId);
                console.log(`Deleted Billing Ticket: ${issuesId}`);
            }
        }
        
    }


}

export default LinearActions