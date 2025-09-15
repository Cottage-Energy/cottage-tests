import { SupabaseQueries } from '../../resources/fixtures/database_queries';
import { PlaneActions } from '../../resources/fixtures/plane_actions';

const supabaseQueries = new SupabaseQueries();
const planeActions = new PlaneActions();

export async function Test_User_Clean_Up(Email: string) {
  
  const cottageUserId = await supabaseQueries.Get_Cottage_User_Id(Email);
  const ElectricPropertyID = await supabaseQueries.Get_Property_Id_by_Electric_Account(cottageUserId);
  const GasPropertyID = await supabaseQueries.Get_Property_Id_by_Gas_Account(cottageUserId);
  const ElectricAccountID = await supabaseQueries.Get_Electric_Account_Id(cottageUserId);
  const GasAccountID = await supabaseQueries.Get_Gas_Account_Id(cottageUserId);

  //await planeActions.DeleteTickets(Email);
  
  await supabaseQueries.delete_Cottage_User(cottageUserId);
  await supabaseQueries.delete_Electric_Account(ElectricAccountID);
  await supabaseQueries.delete_Gas_Account(GasAccountID);
  await supabaseQueries.delete_Property(parseInt(ElectricPropertyID));
  await supabaseQueries.delete_Property(parseInt(GasPropertyID));
}

export const CleanUp = {
  Test_User_Clean_Up
};