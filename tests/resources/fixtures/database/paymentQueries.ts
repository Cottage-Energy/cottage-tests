import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { RETRY_CONFIG, TIMEOUTS } from '../../constants';
import type { RemittanceStatus } from '../../types';

/**
 * Database queries for Payment and Remittance tables
 */
export class PaymentQueries {
  /**
   * Check payment status with retry
   */
  async checkPaymentStatus(
    cottageUserId: string,
    amount: number,
    status: string
  ): Promise<void> {
    const maxRetries = RETRY_CONFIG.PAYMENT_STATUS_MAX_RETRIES;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let paymentStatus = '';

    while (retries < maxRetries) {
      try {
        const { data: payStatus } = await supabase
          .from('Payment')
          .select('paymentStatus')
          .eq('paidBy', cottageUserId)
          .eq('amount', amount)
          .single()
          .throwOnError();

        paymentStatus = payStatus?.paymentStatus ?? '';
        console.log('Payment Status:', paymentStatus);

        if (paymentStatus === status) {
          await expect(paymentStatus).toBe(status);
          break;
        }
      } catch (error: any) {
        if (error?.message?.includes('Cannot coerce the result to a single JSON object')) {
          console.log(`No payment record found yet for user ${cottageUserId} with amount ${amount}`);
        } else {
          throw error;
        }
      }

      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    if (paymentStatus !== status) {
      throw new Error(`Expected status '${status}' not met after ${maxRetries} retries.`);
    }
  }

  /**
   * Check payment is processing (processing, succeeded, or failed)
   */
  async checkPaymentProcessing(cottageUserId: string, amount: number): Promise<void> {
    const maxRetries = RETRY_CONFIG.PAYMENT_PROCESSING_MAX_RETRIES;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let paymentStatus = '';

    while (retries < maxRetries) {
      try {
        const { data: payStatus } = await supabase
          .from('Payment')
          .select('paymentStatus')
          .eq('paidBy', cottageUserId)
          .eq('amount', amount)
          .single()
          .throwOnError();

        paymentStatus = payStatus?.paymentStatus ?? '';
        console.log('Payment Status:', paymentStatus);

        if (['processing', 'succeeded', 'failed'].includes(paymentStatus)) {
          break;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('Cannot coerce the result to a single JSON object')) {
          console.log(`No payment record found yet for user ${cottageUserId} with amount ${amount}`);
        } else {
          throw error;
        }
      }

      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);
      await delay(TIMEOUTS.FAST_POLL_INTERVAL);
    }

    await expect(paymentStatus).toMatch(/^(processing|succeeded|failed)$/);
  }

  /**
   * Check utility remittance status
   */
  async checkUtilityRemittance(
    chargeAccountId: string,
    amount: number,
    status: RemittanceStatus
  ): Promise<void> {
    const maxRetries = RETRY_CONFIG.UTILITY_REMITTANCE_MAX_RETRIES;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let retries = 0;
    let utilityRemittance: { id: string } | null = null;

    while (retries < maxRetries) {
      try {
        const { data } = await supabase
          .from('UtilityRemittance')
          .select('*')
          .eq('chargeAccountID', chargeAccountId)
          .eq('amount', amount)
          .eq('remittanceStatus', status)
          .single()
          .throwOnError();

        utilityRemittance = data;

        if (utilityRemittance) {
          await expect(utilityRemittance.id).not.toBeNull();
          console.log('Utility Remittance ID:', utilityRemittance.id);
          break;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('Cannot coerce the result to a single JSON object')) {
          console.log(
            `No utility remittance record found yet for charge account ${chargeAccountId} with amount ${amount} and status ${status}`
          );
        } else {
          throw error;
        }
      }

      retries++;
      console.log(`Retrying... (${retries}/${maxRetries})`);
      await delay(TIMEOUTS.POLL_INTERVAL);
    }

    if (!utilityRemittance) {
      throw new Error(`Utility Remittance is not present after ${maxRetries} retries.`);
    }
  }
}

export const paymentQueries = new PaymentQueries();
