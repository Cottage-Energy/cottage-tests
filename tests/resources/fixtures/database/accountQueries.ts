import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';

/**
 * Database queries for Electric and Gas account tables
 */
export class AccountQueries {
  /**
   * Check and return electric account ID
   */
  async checkGetElectricAccountId(cottageUserId: string): Promise<string> {
    const { data: account } = await supabase
      .from('ElectricAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .single()
      .throwOnError();

    const electricAccountId = account?.id ?? '';
    console.log('Electric Account ID:', electricAccountId.toString());
    await expect(electricAccountId).not.toBe('');
    return electricAccountId.toString();
  }

  /**
   * Verify electric account does not exist
   */
  async checkElectricAccountIdNotPresent(cottageUserId: string): Promise<void> {
    const { data: account, error } = await supabase
      .from('ElectricAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle();

    console.log('Error:', error);
    await expect(account).toBeNull();
  }

  /**
   * Get electric account ID without assertions
   */
  async getElectricAccountId(cottageUserId: string): Promise<string | null> {
    const { data: account } = await supabase
      .from('ElectricAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle()
      .throwOnError();

    const electricAccountId = account?.id ?? null;
    console.log('Electric Account ID:', electricAccountId?.toString() ?? 'null');
    return electricAccountId?.toString() ?? null;
  }

  /**
   * Check and return gas account ID
   */
  async checkGetGasAccountId(cottageUserId: string): Promise<string> {
    const { data: account } = await supabase
      .from('GasAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .single()
      .throwOnError();

    const gasAccountId = account?.id ?? '';
    console.log('Gas Account ID:', gasAccountId.toString());
    await expect(gasAccountId).not.toBe('');
    return gasAccountId.toString();
  }

  /**
   * Verify gas account does not exist
   */
  async checkGasAccountIdNotPresent(cottageUserId: string): Promise<void> {
    const { data: account, error } = await supabase
      .from('GasAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle();

    console.log('Error:', error);
    await expect(account).toBeNull();
  }

  /**
   * Get gas account ID without assertions
   */
  async getGasAccountId(cottageUserId: string): Promise<string | null> {
    const { data: account } = await supabase
      .from('GasAccount')
      .select('id')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle()
      .throwOnError();

    const gasAccountId = account?.id ?? null;
    console.log('Gas Account ID:', gasAccountId?.toString() ?? 'null');
    return gasAccountId?.toString() ?? null;
  }

  /**
   * Get property ID from electric account
   */
  async getPropertyIdByElectricAccount(cottageUserId: string): Promise<string> {
    const { data: account } = await supabase
      .from('ElectricAccount')
      .select('propertyID')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle()
      .throwOnError();

    const propertyId = account?.propertyID ?? '';
    console.log('Property ID (Electric):', propertyId.toString());
    return propertyId.toString();
  }

  /**
   * Get property ID from gas account
   */
  async getPropertyIdByGasAccount(cottageUserId: string): Promise<string> {
    const { data: account } = await supabase
      .from('GasAccount')
      .select('propertyID')
      .eq('cottageUserID', cottageUserId)
      .maybeSingle()
      .throwOnError();

    const propertyId = account?.propertyID ?? '';
    console.log('Property ID (Gas):', propertyId.toString());
    return propertyId.toString();
  }

  /**
   * Check and return charge account
   */
  async getCheckChargeAccount(
    electricAccountId: string | null,
    gasAccountId: string | null
  ): Promise<string> {
    const maxRetries = 2;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let chargeAccount: any = null;

    while (retries <= maxRetries) {
      try {
        let query = supabase.from('ChargeAccount').select('id');

        if (electricAccountId) {
          query = query.eq('electricAccountID', parseInt(electricAccountId));
        } else {
          query = query.is('electricAccountID', null);
        }

        if (gasAccountId) {
          query = query.eq('gasAccountID', parseInt(gasAccountId));
        } else {
          query = query.is('gasAccountID', null);
        }

        const { data } = await query.single().throwOnError();
        chargeAccount = data;
        break;
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Retrying Get_Check_Charge_Account... (${retries}/${maxRetries})`);
          await delay(60000);
        } else {
          throw error;
        }
      }
    }

    const chargeAccountId = chargeAccount?.id ?? '';
    expect(chargeAccount).not.toBeNull();
    console.log('Charge Account ID:', chargeAccountId.toString());
    return chargeAccountId.toString();
  }
}

export const accountQueries = new AccountQueries();
