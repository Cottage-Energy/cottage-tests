import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { RETRY_CONFIG, TIMEOUTS } from '../../constants';

/**
 * Database queries for Electric and Gas bill tables
 */
export class BillQueries {
  /**
   * Insert a new electric bill
   */
  async insertElectricBill(
    electricAccountId: string | null,
    totalAmountDue?: number,
    totalUsage?: number
  ): Promise<string> {
    const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
    const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);

    const { data: bill } = await supabase
      .from('ElectricBill')
      .insert({
        electricAccountID: parseInt(electricAccountId ?? ''),
        totalAmountDue: amount,
        totalUsage: usage,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visible: false,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select('id')
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Inserted Electric Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Insert a new gas bill
   */
  async insertGasBill(
    gasAccountId: string | null,
    totalAmountDue?: number,
    totalUsage?: number
  ): Promise<string> {
    const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
    const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);

    const { data: bill } = await supabase
      .from('GasBill')
      .insert({
        gasAccountID: parseInt(gasAccountId ?? ''),
        totalAmountDue: amount,
        totalUsage: usage,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visible: false,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select('id')
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Inserted Gas Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Insert an approved electric bill
   */
  async insertApprovedElectricBill(
    electricAccountId: string,
    totalAmountDue?: number,
    totalUsage?: number
  ): Promise<string> {
    const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
    const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);

    const { data: bill } = await supabase
      .from('ElectricBill')
      .insert({
        electricAccountID: parseInt(electricAccountId),
        totalAmountDue: amount,
        totalUsage: usage,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visible: false,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ingestionState: 'approved',
      })
      .select('id')
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Inserted Approved Electric Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Insert an approved gas bill
   */
  async insertApprovedGasBill(
    gasAccountId: string,
    totalAmountDue?: number,
    totalUsage?: number
  ): Promise<string> {
    const amount = totalAmountDue ?? Math.floor(Math.random() * (99999 - 1000 + 1) + 1000);
    const usage = totalUsage ?? Math.floor(Math.random() * (99 - 10 + 1) + 10);

    const { data: bill } = await supabase
      .from('GasBill')
      .insert({
        gasAccountID: parseInt(gasAccountId),
        totalAmountDue: amount,
        totalUsage: usage,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        statementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        visible: false,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ingestionState: 'approved',
      })
      .select('id')
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Inserted Approved Gas Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Approve an electric bill
   */
  async approveElectricBill(billId: string): Promise<void> {
    const { data, error } = await supabase
      .from('ElectricBill')
      .update({ ingestionState: 'approved' })
      .eq('id', parseInt(billId))
      .select()
      .throwOnError();

    console.log('Approved Electric Bill:', data);
    if (error) console.log('Error:', error);
  }

  /**
   * Approve a gas bill
   */
  async approveGasBill(billId: string): Promise<void> {
    const { data, error } = await supabase
      .from('GasBill')
      .update({ ingestionState: 'approved' })
      .eq('id', parseInt(billId))
      .select()
      .throwOnError();

    console.log('Approved Gas Bill:', data);
    if (error) console.log('Error:', error);
  }

  /**
   * Wait for electric bill to be processed
   */
  async checkElectricBillIsProcessed(billId: string): Promise<void> {
    const maxRetries = RETRY_CONFIG.BILL_PROCESSING_MAX_RETRIES;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let ingestionState = '';

    while (retries < maxRetries) {
      const { data: billData } = await supabase
        .from('ElectricBill')
        .select('ingestionState')
        .eq('id', parseInt(billId))
        .single()
        .throwOnError();

      ingestionState = billData?.ingestionState ?? '';
      console.log('Electric Bill Ingestion State:', ingestionState);

      if (ingestionState === 'processed') {
        await expect(ingestionState).toBe('processed');
        break;
      }

      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    if (ingestionState !== 'processed') {
      throw new Error(`Expected ingestion state 'processed' not met after ${maxRetries} retries.`);
    }
  }

  /**
   * Wait for gas bill to be processed
   */
  async checkGasBillIsProcessed(billId: string): Promise<void> {
    const maxRetries = RETRY_CONFIG.BILL_PROCESSING_MAX_RETRIES;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let ingestionState = '';

    while (retries < maxRetries) {
      const { data: billData } = await supabase
        .from('GasBill')
        .select('ingestionState')
        .eq('id', parseInt(billId))
        .single()
        .throwOnError();

      ingestionState = billData?.ingestionState ?? '';
      console.log('Gas Bill Ingestion State:', ingestionState);

      if (ingestionState === 'processed') {
        await expect(ingestionState).toBe('processed');
        break;
      }

      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    if (ingestionState !== 'processed') {
      throw new Error(`Expected ingestion state 'processed' not met after ${maxRetries} retries.`);
    }
  }

  /**
   * Get electric bill ID by account and amounts
   */
  async getElectricBillId(
    electricAccountId: string,
    amount: number,
    usage: number
  ): Promise<string> {
    const { data: bill } = await supabase
      .from('ElectricBill')
      .select('id')
      .eq('electricAccountID', parseInt(electricAccountId))
      .eq('totalAmountDue', amount)
      .eq('totalUsage', usage)
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Electric Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Get gas bill ID by account and amounts
   */
  async getGasBillId(gasAccountId: string, amount: number, usage: number): Promise<string> {
    const { data: bill } = await supabase
      .from('GasBill')
      .select('id')
      .eq('gasAccountID', parseInt(gasAccountId))
      .eq('totalAmountDue', amount)
      .eq('totalUsage', usage)
      .single()
      .throwOnError();

    const billId = bill?.id ?? '';
    console.log('Gas Bill ID:', billId.toString());
    return billId.toString();
  }

  /**
   * Get electric bill start date
   */
  async getElectricBillStartDate(billId: string): Promise<string> {
    const { data: bill } = await supabase
      .from('ElectricBill')
      .select('startDate')
      .eq('id', parseInt(billId))
      .maybeSingle()
      .throwOnError();

    return bill?.startDate ?? '';
  }

  /**
   * Get electric bill end date
   */
  async getElectricBillEndDate(billId: string): Promise<string> {
    const { data: bill } = await supabase
      .from('ElectricBill')
      .select('endDate')
      .eq('id', parseInt(billId))
      .maybeSingle()
      .throwOnError();

    return bill?.endDate ?? '';
  }

  /**
   * Get gas bill start date
   */
  async getGasBillStartDate(billId: string): Promise<string> {
    const { data: bill } = await supabase
      .from('GasBill')
      .select('startDate')
      .eq('id', parseInt(billId))
      .maybeSingle()
      .throwOnError();

    return bill?.startDate ?? '';
  }

  /**
   * Get gas bill end date
   */
  async getGasBillEndDate(billId: string): Promise<string> {
    const { data: bill } = await supabase
      .from('GasBill')
      .select('endDate')
      .eq('id', parseInt(billId))
      .maybeSingle()
      .throwOnError();

    return bill?.endDate ?? '';
  }
}

export const billQueries = new BillQueries();
