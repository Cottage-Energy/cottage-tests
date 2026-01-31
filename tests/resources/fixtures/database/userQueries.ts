import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { loggers } from '../../utils/logger';

const log = loggers.database.child('UserQueries');

/**
 * Database queries for CottageUsers and LightUsers tables
 */
export class UserQueries {
  /**
   * Check and return cottage user ID, validates text consent if provided
   */
  async checkCottageUserId(email: string, textConsent?: boolean): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    log.info('Checking cottage user', { email: normalizedEmail });

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single()
      .throwOnError();

    const cottageUserId = cottageUser?.id ?? '';
    const userDateOfTextConsent = cottageUser?.dateOfTextMessageConsent ?? null;
    const isAbleToSendText = cottageUser?.isAbleToSendTextMessages ?? null;

    log.debug('Cottage user details', {
      cottageUserId,
      textConsentDate: userDateOfTextConsent,
      canSendText: isAbleToSendText,
    });

    await expect(cottageUserId).not.toBe('');

    if (textConsent === true) {
      await expect(userDateOfTextConsent).not.toBeNull();
      await expect(isAbleToSendText).toBe(true);
    } else if (textConsent === false) {
      await expect(userDateOfTextConsent).toBeNull();
      await expect(isAbleToSendText).toBe(false);
    }

    return cottageUserId;
  }

  /**
   * Get cottage user ID without assertions
   */
  async getCottageUserId(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    log.info('Getting cottage user', { email: normalizedEmail });

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    const cottageUserId = cottageUser?.id ?? '';
    log.debug('Retrieved cottage user', { cottageUserId });
    return cottageUserId;
  }

  /**
   * Verify that cottage user does not exist
   */
  async checkCottageUserIdNotPresent(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    log.info('Verifying cottage user does not exist', { email: normalizedEmail });

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    await expect(cottageUser).toBeNull();
  }

  /**
   * Check and return cottage user account number
   */
  async checkCottageUserAccountNumber(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('accountNumber')
      .eq('email', normalizedEmail)
      .single()
      .throwOnError();

    const accountNumber = cottageUser?.accountNumber ?? '';
    await expect(accountNumber).not.toBeNull;
    log.debug('Account number retrieved', { accountNumber: accountNumber.toString() });
    return accountNumber.toString();
  }

  /**
   * Check and return light user ID
   */
  async checkLightUserId(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    log.info('Checking light user', { email: normalizedEmail });

    const { data: lightUser } = await supabase
      .from('LightUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single()
      .throwOnError();

    const lightUserId = lightUser?.id ?? '';
    log.debug('Light user found', { lightUserId });
    await expect(lightUserId).not.toBe('');

    return lightUserId;
  }

  /**
   * Get light user ID without assertions
   */
  async getLightUserId(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    log.info('Getting light user', { email: normalizedEmail });

    const { data: lightUser } = await supabase
      .from('LightUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    const lightUserId = lightUser?.id ?? '';
    log.debug('Retrieved light user', { lightUserId });
    return lightUserId;
  }

  /**
   * Check waitlist entry exists
   */
  async checkWaitlist(email: string): Promise<void> {
    const { data: waitList } = await supabase
      .from('WaitList')
      .select('id')
      .eq('email', email)
      .single()
      .throwOnError();

    const waitListId = waitList?.id ?? '';
    log.debug('Waitlist entry found', { waitListId });
    await expect(waitList).not.toBeNull();
  }

  /**
   * Verify waitlist entry does not exist
   */
  async checkWaitlistNotPresent(email: string): Promise<void> {
    const { data: waitList } = await supabase
      .from('WaitList')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    await expect(waitList).toBeNull();
  }

  /**
   * Check if registration is complete for a user
   */
  async checkIsRegistrationComplete(cottageUserId: string, state: boolean = true): Promise<void> {
    const { data: resident } = await supabase
      .from('Resident')
      .select('isRegistrationComplete')
      .eq('cottageUserID', cottageUserId)
      .single()
      .throwOnError();

    const isRegistrationComplete = resident?.isRegistrationComplete ?? '';
    log.debug('Registration status', { isRegistrationComplete, expectedState: state });
    await expect(isRegistrationComplete).toBe(state);
  }
}

export const userQueries = new UserQueries();
