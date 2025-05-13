import { expect } from '@playwright/test';
import { planeClient } from '../../resources/utils/plane';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';

const supabaseQueries = new SupabaseQueries();

export class PlaneActions{

    async CheckMoveInTickets(Email: string, ElectricTicket: boolean, GasTicket: boolean, SameCompany: boolean) {
        const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(Email);
        const electricPlaneTicketID = await supabaseQueries.Get_Electric_Plane_Ticket_Id(cottageUserId);
        const gasPlaneTicketID = await supabaseQueries.Get_Gas_Plane_Ticket_Id(cottageUserId);

        if(ElectricTicket == true && GasTicket == true){
            if(SameCompany == true){
                expect(electricPlaneTicketID).toEqual(gasPlaneTicketID);
            }
            else{
                expect(electricPlaneTicketID).not.toEqual(gasPlaneTicketID);
            }
        }
        else if(ElectricTicket == false && GasTicket == false){
            expect(electricPlaneTicketID).toEqual(gasPlaneTicketID);
        }
        else{
            expect(electricPlaneTicketID).not.toEqual(gasPlaneTicketID);
        }

        if(ElectricTicket == true){
            await expect(electricPlaneTicketID).not.toBe("");
            const electricPlaneTicket = await planeClient.getIssueWithState(process.env.PLANE_MOVE_IN_PROJECT_ID!, electricPlaneTicketID);
            expect(electricPlaneTicket).toBeTruthy();
        }
        else{
            await expect(electricPlaneTicketID).toBe("");
        }

        if(GasTicket == true){
            await expect(gasPlaneTicketID).not.toBe("");
            const gasPlaneTicket = await planeClient.getIssueWithState(process.env.PLANE_MOVE_IN_PROJECT_ID!, gasPlaneTicketID);
            expect(gasPlaneTicket).toBeTruthy();
        }
        else{
            await expect(gasPlaneTicketID).toBe("");
        }
    }


    async DeleteTickets(Email: string) {
        const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(Email);
        
        try{
            const electricPlaneTicketID = await supabaseQueries.Get_Electric_Plane_Ticket_Id(cottageUserId);
            await planeClient.deleteIssue(process.env.PLANE_MOVE_IN_PROJECT_ID!, electricPlaneTicketID);
            console.log("Electric Account Plane Ticket Deleted")
        }
        catch{
            console.log("No Plane Ticket at Electric Account to be Deleted")
        }

        try{
            const gasPlaneTicketID = await supabaseQueries.Get_Gas_Plane_Ticket_Id(cottageUserId);
            await planeClient.deleteIssue(process.env.PLANE_MOVE_IN_PROJECT_ID!, gasPlaneTicketID);
            console.log("Gas Account Plane Ticket Deleted")
        }
        catch{
            console.log("No Plane Ticket at Gas Account to be Deleted")
        }
    }


}

export default PlaneActions