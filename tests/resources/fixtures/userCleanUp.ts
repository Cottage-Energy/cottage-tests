import { SupabaseQueries } from '../../resources/fixtures/database_queries';

const supabaseQueries = new SupabaseQueries();

export async function Test_User_Clean_Up(cottageUserId: string) {
  
  const ElectricPropertyID = await supabaseQueries.Get_Property_Id_by_Electric_Account(cottageUserId);
  const GasPropertyID = await supabaseQueries.Get_Property_Id_by_Gas_Account(cottageUserId);
  const ElectricAccountID = await supabaseQueries.Get_Electric_Account_Id_Non_Test(cottageUserId);
  const GasAccountID = await supabaseQueries.Get_Gas_Account_Id_Non_Test(cottageUserId);

  await supabaseQueries.delete_Cottage_User(cottageUserId);
  await supabaseQueries.delete_Electric_Account(parseInt(ElectricAccountID));
  await supabaseQueries.delete_Gas_Account(parseInt(GasAccountID));
  await supabaseQueries.delete_Property(parseInt(ElectricPropertyID));
  await supabaseQueries.delete_Property(parseInt(GasPropertyID));
}

export const CleanUp = {
  Test_User_Clean_Up
};