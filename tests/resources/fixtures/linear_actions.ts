import { expect } from '@playwright/test';
import {linearClient} from '../../resources/utils/linear';


const env = process.env.ENV || 'dev';

export class LinearActions{

    async SetElectricBillToApprove(Email: string) {
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
        const NullStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "null" } } })).nodes[0].id;
        const ApprovedStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
        
        const maxRetries = 4;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let issuesCount = 0;
        let issuesResponse;
        
        while (retries < maxRetries) {
            issuesResponse = await linearClient.issues({
                filter: {
                    team: { id: { eq: BillingteamId } },
                    description: { contains: Email },
                    state: { id: { eq: NullStatusId } },
                    title: { contains: "Electric Bill" },
                },
            });
        
            issuesCount = issuesResponse.nodes.length;
            console.log(`Number of Electric Bills: ${issuesCount}`);
        
            if (issuesCount > 0) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(90000);
        }
        
        if (issuesCount === 0) {
            console.log('No issues found after maximum retries.');
            return;
        }
        
        for (let i = 0; i < issuesCount; i++) {
            const issuesId = issuesResponse.nodes[i].id;
            await linearClient.updateIssue(issuesId, { stateId: ApprovedStatusId, priority: 1 });
            console.log(issuesResponse);
        }
    }


    async SetGasBillToApprove(Email: string) {
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
        const NullStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "null" } } })).nodes[0].id;
        const ApprovedStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
        
        const maxRetries = 4;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let retries = 0;
        let issuesCount = 0;
        let issuesResponse;
        
        while (retries < maxRetries) {
            issuesResponse = await linearClient.issues({
                filter: {
                    team: { id: { eq: BillingteamId } },
                    description: { contains: Email },
                    state: { id: { eq: NullStatusId } },
                    title: { contains: "Gas Bill" },
                },
            });
        
            issuesCount = issuesResponse.nodes.length;
            console.log(`Number of Gas Bills: ${issuesCount}`);
        
            if (issuesCount > 0) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(90000); // Wait for 2 seconds before retrying
        }
        
        if (issuesCount === 0) {
            console.log('No issues found after maximum retries.');
            return;
        }
        
        for (let i = 0; i < issuesCount; i++) {
            const issuesId = issuesResponse.nodes[i].id;
            await linearClient.updateIssue(issuesId, { stateId: ApprovedStatusId, priority: 1 });
            console.log(issuesResponse);
        }
    }



    async CountMoveInTicket(Email: string, ExpectedCount: number) {
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
                    title: { contains: Email },
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
        const MoveInteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `move-ins-${env}` } } })).nodes[0].id;
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
  
        const MoveInIssues = await linearClient.issues({
            filter: {
                team: { id: { eq: MoveInteamId } },
                title: { contains: Email },
            },
        });
        
        
        const BillingIssues = await linearClient.issues({
            filter: {
                team: { id: { eq: BillingteamId } },
                description: { contains: Email },
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