import { supabase } from '../../utils/supabase';
import { logger } from '../../utils/logger';

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
      logger.error('Error deleting Cottage User', { error });
    } else {
      logger.info('Successfully deleted Cottage User');
    }
  }

  /**
   * Delete an electric account by ID
   */
  async deleteElectricAccount(electricAccountId: string | null): Promise<void> {
    if (!electricAccountId) return;
    const eaId = parseInt(electricAccountId);

    // Delete DemandResponseEnrollment first (FK constraint)
    await supabase
      .from('DemandResponseEnrollment')
      .delete()
      .eq('electricAccountID', eaId);

    const { error } = await supabase
      .from('ElectricAccount')
      .delete()
      .eq('id', eaId);

    if (error) {
      logger.error('Error deleting Electric Account', { error });
    } else {
      logger.info('Successfully deleted Electric Account');
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
      logger.error('Error deleting Gas Account', { error });
    } else {
      logger.info('Successfully deleted Gas Account');
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
      logger.error('Error deleting Property', { error });
    } else {
      logger.info('Successfully deleted Property');
    }
  }
}

export const cleanupQueries = new CleanupQueries();
