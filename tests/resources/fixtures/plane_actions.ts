import { expect } from '@playwright/test';
import { planeClient } from '../../resources/utils/plane';
import { SupabaseQueries } from '../../resources/fixtures/database_queries';

const supabaseQueries = new SupabaseQueries();

export class PlaneActions{


    async CheckMoveInTickets(Email: string, ElectricTicket: boolean, GasTicket: boolean, SameCompany: boolean) {
        const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(Email);


    }


    async DeleteTickets(Email: string) {
        const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(Email);
        //GET TICKET ID Electric
        //GET TICKET ID Gas
    }


}

export default PlaneActions