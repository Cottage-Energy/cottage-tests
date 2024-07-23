import { expect } from '@playwright/test';
import {linearClient} from '../../resources/utils/linear';


const env = process.env.ENV || 'dev';

export class LinearActions{
    
    async SetBillToApprove(Email: string) {
        const BillingteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `billing-${env}` } } })).nodes[0].id;
        const ApprovedStatusId = (await linearClient.workflowStates({ filter: { team: { id: { eq: BillingteamId } }, name: { eqIgnoreCase: "approved" } } })).nodes[0].id;
        const issuesResponse = await linearClient.issues({
            filter: {
                team: { id: { eq: BillingteamId } },
                description: { contains:Email },
            },
        });
    
        const issuesId = issuesResponse.nodes[0].id;
        const issuesCount = issuesResponse.nodes.length;
        console.log(`Number of issues: ${issuesCount}`);
        console.log(issuesResponse);

        await linearClient.updateIssue(issuesId, { stateId: ApprovedStatusId });
    }


    async CountMoveInTicket(Email: string, ExpectedCount: number) {
        const MoveInteamId = (await linearClient.teams({ filter: { name: { eqIgnoreCase: `move-ins-${env}` } } })).nodes[0].id;
        const issuesResponse = await linearClient.issues({
            filter: {
                team: { id: { eq: MoveInteamId } },
                title: { contains:Email },
            },
        });
    
      
        const issuesCount = issuesResponse.nodes.length;
        console.log(`Number of issues: ${issuesCount}`);
        console.log(issuesResponse);

        expect(issuesCount).toBe(ExpectedCount);
    }

}

export default LinearActions