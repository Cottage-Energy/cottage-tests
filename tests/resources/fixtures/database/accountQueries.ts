import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { loggers } from '../../utils/logger';

const log = loggers.database.child('AccountQueries');

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
    log.debug('Electric Account ID', { electricAccountId: electricAccountId.toString() });
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

    if (error) log.debug('Electric account check error', { error: String(error) });
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
    log.debug('Electric Account ID', { electricAccountId: electricAccountId?.toString() ?? 'null' });
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
    log.debug('Gas Account ID', { gasAccountId: gasAccountId.toString() });
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

    if (error) log.debug('Gas account check error', { error: String(error) });
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
    log.debug('Gas Account ID', { gasAccountId: gasAccountId?.toString() ?? 'null' });
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
    log.debug('Property ID (Electric)', { propertyId: propertyId.toString() });
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
    log.debug('Property ID (Gas)', { propertyId: propertyId.toString() });
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
    let chargeAccount: { id: string } | null = null;

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

        const { data } = await query.order('id', { ascending: false }).limit(1).single().throwOnError();
        chargeAccount = data;
        break;
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          log.warn(`Retrying Get_Check_Charge_Account`, { retry: retries, maxRetries });
          await delay(60000);
        } else {
          throw error;
        }
      }
    }

    const chargeAccountId = chargeAccount?.id ?? '';
    expect(chargeAccount).not.toBeNull();
    log.debug('Charge Account ID', { chargeAccountId: chargeAccountId.toString() });
    return chargeAccountId.toString();
  }

  /**
   * Seed delinquency state on an ElectricAccount for payment-clearance tests.
   * Use this to simulate the state left by the reminder pipeline without
   * actually running it (the reminder pipeline's delinquency logic is covered
   * by PR-005). The point of PR-005a/b is to verify that
   * `PaymentProcessor.recalculateDelinquency()` clears it on payment success.
   */
  async setElectricDelinquent(
    electricAccountId: string,
    delinquentDays: number
  ): Promise<void> {
    const { error } = await supabase
      .from('ElectricAccount')
      .update({ isDelinquent: true, delinquentDays })
      .eq('id', electricAccountId);
    if (error) {
      log.error('Failed to set ElectricAccount delinquent', { electricAccountId, error: error.message });
      throw error;
    }
    log.info('Seeded ElectricAccount delinquency', { electricAccountId, delinquentDays });
  }

  /**
   * Fetch current delinquency state on an ElectricAccount.
   */
  async getElectricDelinquency(
    electricAccountId: string
  ): Promise<{ isDelinquent: boolean; delinquentDays: number }> {
    const { data, error } = await supabase
      .from('ElectricAccount')
      .select('isDelinquent,delinquentDays')
      .eq('id', electricAccountId)
      .single();
    if (error) {
      log.error('Failed to fetch ElectricAccount delinquency', { electricAccountId, error: error.message });
      throw error;
    }
    return {
      isDelinquent: Boolean(data?.isDelinquent),
      delinquentDays: Number(data?.delinquentDays ?? 0),
    };
  }

  /**
   * Poll until delinquency clears (isDelinquent=false, delinquentDays=0) or timeout.
   * Used to verify PaymentProcessor.recalculateDelinquency() fired after a payment.
   */
  async waitForElectricDelinquencyCleared(
    electricAccountId: string,
    maxRetries: number = 30,
    pollIntervalMs: number = 2000
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const state = await this.getElectricDelinquency(electricAccountId);
      if (!state.isDelinquent && state.delinquentDays === 0) {
        log.info('ElectricAccount delinquency cleared', { electricAccountId, polls: i + 1 });
        return;
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    const final = await this.getElectricDelinquency(electricAccountId);
    throw new Error(
      `ElectricAccount ${electricAccountId} delinquency did not clear after ${maxRetries} polls. ` +
        `Final: isDelinquent=${final.isDelinquent}, delinquentDays=${final.delinquentDays}.`
    );
  }

  // ---------------------------------------------------------------------------
  // Gas delinquency (symmetric to Electric — same code path in
  // PaymentProcessor.recalculateDelinquency but via GasAccount.isDelinquent)
  // ---------------------------------------------------------------------------

  async setGasDelinquent(
    gasAccountId: string,
    delinquentDays: number
  ): Promise<void> {
    const { error } = await supabase
      .from('GasAccount')
      .update({ isDelinquent: true, delinquentDays })
      .eq('id', gasAccountId);
    if (error) {
      log.error('Failed to set GasAccount delinquent', { gasAccountId, error: error.message });
      throw error;
    }
    log.info('Seeded GasAccount delinquency', { gasAccountId, delinquentDays });
  }

  async getGasDelinquency(
    gasAccountId: string
  ): Promise<{ isDelinquent: boolean; delinquentDays: number }> {
    const { data, error } = await supabase
      .from('GasAccount')
      .select('isDelinquent,delinquentDays')
      .eq('id', gasAccountId)
      .single();
    if (error) {
      log.error('Failed to fetch GasAccount delinquency', { gasAccountId, error: error.message });
      throw error;
    }
    return {
      isDelinquent: Boolean(data?.isDelinquent),
      delinquentDays: Number(data?.delinquentDays ?? 0),
    };
  }

  async waitForGasDelinquencyCleared(
    gasAccountId: string,
    maxRetries: number = 30,
    pollIntervalMs: number = 2000
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const state = await this.getGasDelinquency(gasAccountId);
      if (!state.isDelinquent && state.delinquentDays === 0) {
        log.info('GasAccount delinquency cleared', { gasAccountId, polls: i + 1 });
        return;
      }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    const final = await this.getGasDelinquency(gasAccountId);
    throw new Error(
      `GasAccount ${gasAccountId} delinquency did not clear after ${maxRetries} polls. ` +
        `Final: isDelinquent=${final.isDelinquent}, delinquentDays=${final.delinquentDays}.`
    );
  }
}

export const accountQueries = new AccountQueries();
