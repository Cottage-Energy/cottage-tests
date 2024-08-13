import { expect } from '@playwright/test';
import {linearClient} from '../../resources/utils/linear';


const env = process.env.ENV || 'dev';

export class LinearActions{

    async SetElectricBillToApprove(Email: string) {
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
        const NullStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "null" } } })).nodes[0].id;
        const ApprovedStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
        
        const maxRetries = 2;
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
            console.log(`Number of issues: ${issuesCount}`);
            console.log(issuesResponse);
        
            if (issuesCount > 0) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(30000);
        }
        
        if (issuesCount === 0) {
            console.log('No issues found after maximum retries.');
            return;
        }
        
        for (let i = 0; i < issuesCount; i++) {
            const issuesId = issuesResponse.nodes[i].id;
            await linearClient.updateIssue(issuesId, { stateId: ApprovedStatusId });
        }
    }


    async SetGasBillToApprove(Email: string) {
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
        const NullStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "null" } } })).nodes[0].id;
        const ApprovedStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
        
        const maxRetries = 2;
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
            console.log(`Number of issues: ${issuesCount}`);
            console.log(issuesResponse);
        
            if (issuesCount > 0) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(30000); // Wait for 2 seconds before retrying
        }
        
        if (issuesCount === 0) {
            console.log('No issues found after maximum retries.');
            return;
        }
        
        for (let i = 0; i < issuesCount; i++) {
            const issuesId = issuesResponse.nodes[i].id;
            await linearClient.updateIssue(issuesId, { stateId: ApprovedStatusId });
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
        
            if (issuesCount > 0) {
                break;
            }
        
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            await delay(30000);
        }

        if (issuesCount === 0) {
            console.log('No issues found after maximum retries.');
            return;
        }

        expect(issuesCount).toBe(ExpectedCount);
    }

}

export default LinearActions