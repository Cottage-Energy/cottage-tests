import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { RETRY_CONFIG } from '../../constants';
import { logger } from '../../utils/logger';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Database queries for DialpadSMS table — verify SMS messages sent by the system.
 *
 * The DialpadSMS table stores all outbound SMS sent via Dialpad (reminders, shutoff warnings, etc.)
 * Schema: id, createdAt, content, department, direction, cottageUserID, webhookPayload, status
 */
export class SMSQueries {

  /**
   * Check that an SMS was sent to a user containing specific text.
   * Polls with retries since SMS sending is async (triggered by Inngest).
   */
  async checkSMSSent(cottageUserId: string, contentMatch: string): Promise<void> {
    for (let attempt = 0; attempt < RETRY_CONFIG.MAX_RETRIES; attempt++) {
      const { data } = await supabase
        .from('DialpadSMS')
        .select('id, content, status, createdAt')
        .eq('cottageUserID', cottageUserId)
        .ilike('content', `%${contentMatch}%`)
        .order('createdAt', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        logger.info(`SMS found for user ${cottageUserId}: "${data[0].content?.substring(0, 80)}..."`);
        return;
      }
      await delay(RETRY_CONFIG.POLL_INTERVAL);
    }
    throw new Error(`SMS containing "${contentMatch}" not found for user ${cottageUserId} after ${RETRY_CONFIG.MAX_RETRIES} attempts`);
  }

  /**
   * Check that NO SMS was sent to a user (e.g., for non-SMS reminder days).
   */
  async checkSMSNotSent(cottageUserId: string, afterDate: Date): Promise<void> {
    const { data } = await supabase
      .from('DialpadSMS')
      .select('id, content')
      .eq('cottageUserID', cottageUserId)
      .gte('createdAt', afterDate.toISOString())
      .limit(1);

    expect(data?.length ?? 0).toBe(0);
    logger.info(`Confirmed: no SMS sent to user ${cottageUserId} after ${afterDate.toISOString()}`);
  }

  /**
   * Get the most recent SMS sent to a user.
   */
  async getLatestSMS(cottageUserId: string): Promise<{ content: string; status: string; createdAt: string } | null> {
    const { data } = await supabase
      .from('DialpadSMS')
      .select('content, status, createdAt')
      .eq('cottageUserID', cottageUserId)
      .order('createdAt', { ascending: false })
      .limit(1);

    return data && data.length > 0 ? data[0] : null;
  }
}

export const smsQueries = new SMSQueries();
