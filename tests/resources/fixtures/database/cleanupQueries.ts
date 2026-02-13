import { supabase } from '../../utils/supabase';

/**
 * Database cleanup queries for test teardown
 */
export class CleanupQueries {
  /**
   * Delete a cottage user by ID
   */
  async deleteCottageUser(cottageUserId: string): Promise<void> {
    const { error } = await supabase
      .from('CottageUsers')
      .delete()
      .eq('id', cottageUserId);

    if (error) {
      console.error('Error deleting Cottage User:', error);
    } else {
      console.log('Successfully deleted Cottage User');
    }
  }

  /**
   * Delete an electric account by ID
   */
  async deleteElectricAccount(electricAccountId: string | null): Promise<void> {
    if (!electricAccountId) return;

    const { error } = await supabase
      .from('ElectricAccount')
      .delete()
      .eq('id', parseInt(electricAccountId));

    if (error) {
      console.error('Error deleting Electric Account:', error);
    } else {
      console.log('Successfully deleted Electric Account');
    }
  }

  /**
   * Delete a gas account by ID
   */
  async deleteGasAccount(gasAccountId: string | null): Promise<void> {
    if (!gasAccountId) return;

    const { error } = await supabase
      .from('GasAccount')
      .delete()
      .eq('id', parseInt(gasAccountId));

    if (error) {
      console.error('Error deleting Gas Account:', error);
    } else {
      console.log('Successfully deleted Gas Account');
    }
  }

  /**
   * Delete a property by ID
   */
  async deleteProperty(propertyId: number): Promise<void> {
    if (!propertyId) return;

    const { error } = await supabase
      .from('Property')
      .delete()
      .eq('id', propertyId);

    if (error) {
      console.error('Error deleting Property:', error);
    } else {
      console.log('Successfully deleted Property');
    }
  }
}

export const cleanupQueries = new CleanupQueries();
