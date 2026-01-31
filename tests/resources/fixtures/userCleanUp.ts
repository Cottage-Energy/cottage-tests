import { userQueries } from './database/userQueries';
import { accountQueries } from './database/accountQueries';
import { cleanupQueries } from './database/cleanupQueries';

/**
 * Clean up test user and associated data after test execution
 * @param email - The email address of the test user to clean up
 */
export async function Test_User_Clean_Up(email: string): Promise<void> {
  const cottageUserId = await userQueries.getCottageUserId(email);
  
  if (!cottageUserId) {
    console.log('No cottage user found for cleanup:', email);
    return;
  }

  // Get associated IDs
  const electricPropertyId = await accountQueries.getPropertyIdByElectricAccount(cottageUserId);
  const gasPropertyId = await accountQueries.getPropertyIdByGasAccount(cottageUserId);
  const electricAccountId = await accountQueries.getElectricAccountId(cottageUserId);
  const gasAccountId = await accountQueries.getGasAccountId(cottageUserId);

  // Delete in correct order (dependencies first)
  await cleanupQueries.deleteCottageUser(cottageUserId);
  await cleanupQueries.deleteElectricAccount(electricAccountId);
  await cleanupQueries.deleteGasAccount(gasAccountId);
  
  if (electricPropertyId) {
    await cleanupQueries.deleteProperty(parseInt(electricPropertyId));
  }
  if (gasPropertyId) {
    await cleanupQueries.deleteProperty(parseInt(gasPropertyId));
  }
}

/**
 * CleanUp namespace for backward compatibility
 */
export const CleanUp = {
  Test_User_Clean_Up,
};