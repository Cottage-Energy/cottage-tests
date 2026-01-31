import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';

/**
 * Database queries for CottageUsers and LightUsers tables
 */
export class UserQueries {
  /**
   * Check and return cottage user ID, validates text consent if provided
   */
  async checkCottageUserId(email: string, textConsent?: boolean): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    console.log('Checking cottage user:', normalizedEmail);

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single()
      .throwOnError();

    const cottageUserId = cottageUser?.id ?? '';
    const userDateOfTextConsent = cottageUser?.dateOfTextMessageConsent ?? null;
    const isAbleToSendText = cottageUser?.isAbleToSendTextMessages ?? null;

    console.log('Cottage User ID:', cottageUserId);
    console.log('Text Consent Date:', userDateOfTextConsent);
    console.log('Can Send Text:', isAbleToSendText);

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
    console.log('Getting cottage user:', normalizedEmail);

    const { data: cottageUser } = await supabase
      .from('CottageUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    const cottageUserId = cottageUser?.id ?? '';
    console.log('Cottage User ID:', cottageUserId);
    return cottageUserId;
  }

  /**
   * Verify that cottage user does not exist
   */
  async checkCottageUserIdNotPresent(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    console.log('Checking cottage user not present:', normalizedEmail);

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
    console.log('PG Account No.:', accountNumber.toString());
    return accountNumber.toString();
  }

  /**
   * Check and return light user ID
   */
  async checkLightUserId(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    console.log('Checking light user:', normalizedEmail);

    const { data: lightUser } = await supabase
      .from('LightUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single()
      .throwOnError();

    const lightUserId = lightUser?.id ?? '';
    console.log('Light User ID:', lightUserId);
    await expect(lightUserId).not.toBe('');

    return lightUserId;
  }

  /**
   * Get light user ID without assertions
   */
  async getLightUserId(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    console.log('Getting light user:', normalizedEmail);

    const { data: lightUser } = await supabase
      .from('LightUsers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    const lightUserId = lightUser?.id ?? '';
    console.log('Light User ID:', lightUserId);
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
    console.log('Waitlist ID:', waitListId);
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
    console.log('Is Registration Complete:', isRegistrationComplete);
    await expect(isRegistrationComplete).toBe(state);
  }
}

export const userQueries = new UserQueries();
