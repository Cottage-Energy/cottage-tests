import { supabase } from '../../utils/supabase';
import { loggers } from '../../utils/logger';

const log = loggers.database.child('UtilityQueries');

/**
 * Database queries for utility company and building configurations
 */
export class UtilityQueries {
  /**
   * Check if prior address is required for a utility
   */
  async getIsPriorAddressRequiredUtility(utilityId: string): Promise<boolean> {
    log.debug('Checking prior address required for utility', { utilityId });

    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('isPriorAddressRequired')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    return utility?.isPriorAddressRequired ?? false;
  }

  /**
   * Check if billing is handled for a building
   */
  async getIsHandledBillingBuilding(shortCode: string): Promise<boolean> {
    const { data: building } = await supabase
      .from('Building')
      .select('isHandleBilling')
      .eq('shortCode', shortCode)
      .single()
      .throwOnError();

    const isHandledBilling = building?.isHandleBilling ?? false;
    log.debug('Is Handled Billing (Building)', { shortCode, isHandledBilling });
    return isHandledBilling;
  }

  /**
   * Check if billing is handled for a utility
   */
  async getIsHandledBillingUtility(utilityId: string): Promise<boolean> {
    log.debug('Checking handled billing for utility', { utilityId });

    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('isHandleBilling')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    const isHandledBilling = utility?.isHandleBilling ?? false;
    log.debug('Is Handled Billing (Utility)', { utilityId, isHandledBilling });
    return isHandledBilling;
  }

  /**
   * Check if setupPaymentDuringOnboarding is enabled for a building
   * Building-level flag takes priority when shortCode is present
   */
  async getSetupPaymentDuringOnboardingBuilding(shortCode: string): Promise<boolean> {
    log.debug('Checking setupPaymentDuringOnboarding for building', { shortCode });

    const { data: building } = await supabase
      .from('Building')
      .select('setUpPaymentDuringOnboarding')
      .eq('shortCode', shortCode)
      .single()
      .throwOnError();

    const setupPayment = building?.setUpPaymentDuringOnboarding ?? false;
    log.debug('setupPaymentDuringOnboarding (Building)', { shortCode, setupPayment });
    return setupPayment;
  }

  /**
   * Check if setupPaymentDuringOnboarding is enabled for a utility company
   * Used when no shortCode is present (fallback to utility-level)
   */
  async getSetupPaymentDuringOnboardingUtility(utilityId: string): Promise<boolean> {
    log.debug('Checking setupPaymentDuringOnboarding for utility', { utilityId });

    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('setUpPaymentDuringOnboarding')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    const setupPayment = utility?.setUpPaymentDuringOnboarding ?? false;
    log.debug('setupPaymentDuringOnboarding (Utility)', { utilityId, setupPayment });
    return setupPayment;
  }

  /**
   * Check if billing is required for a utility
   */
  async getIsBillingRequiredUtility(utilityId: string): Promise<boolean> {
    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('isBillingRequired')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    const isBillingRequired = utility?.isBillingRequired ?? false;
    log.debug('Is Billing Required', { utilityId, isBillingRequired });
    return isBillingRequired;
  }

  /**
   * Check if autopay is required for a utility
   */
  async getIsAutopayRequiredUtility(utilityId: string): Promise<boolean> {
    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('isAutopayRequired')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    const isAutopayRequired = utility?.isAutopayRequired ?? false;
    log.debug('Is Autopay Required', { utilityId, isAutopayRequired });
    return isAutopayRequired;
  }

  /**
   * Check if autopay is required for a building
   */
  async getIsAutopayRequiredBuilding(shortCode: string): Promise<boolean> {
    const { data: building } = await supabase
      .from('Building')
      .select('isAutopayRequired')
      .eq('shortCode', shortCode)
      .single()
      .throwOnError();

    const isAutopayRequired = building?.isAutopayRequired ?? false;
    log.debug('Is Autopay Required (Building)', { shortCode, isAutopayRequired });
    return isAutopayRequired;
  }

  /**
   * Get question ID for a utility company
   */
  async getQuestionId(company: string): Promise<string> {
    const { data: question } = await supabase
      .from('UtilityCompanyQuestion')
      .select('id')
      .eq('utilityCompanyID', company)
      .maybeSingle()
      .throwOnError();

    return question?.id ?? '';
  }

  /**
   * Check BGE question answer
   */
  async checkBgeAnswer(
    cottageUserId: string,
    questionId: string,
    answer: string
  ): Promise<void> {
    const { data: utilAnswer } = await supabase
      .from('UtilityQuestionAnswer')
      .select('answer')
      .eq('cottageUserID', cottageUserId)
      .eq('questionID', questionId)
      .single()
      .throwOnError();

    const actualAnswer = utilAnswer?.answer ?? '';
    if (actualAnswer !== answer) {
      throw new Error(`Expected answer '${answer}' but got '${actualAnswer}'`);
    }
  }

  /**
   * Update companies assigned to a building
   */
  async updateCompaniesToBuilding(
    shortCode: string,
    electricCompany: string | null,
    gasCompany: string | null
  ): Promise<void> {
    const { data, error } = await supabase
      .from('Building')
      .update({ electricCompanyID: electricCompany, gasCompanyID: gasCompany })
      .eq('shortCode', shortCode)
      .select()
      .throwOnError();

    log.debug('Updated Building Companies', { shortCode, data });
    if (error) log.error('Update Building Companies failed', { error: String(error) });
  }

  /**
   * Update building billing setting
   */
  async updateBuildingBilling(shortCode: string, isHandledBilling: boolean): Promise<void> {
    const { data, error } = await supabase
      .from('Building')
      .update({ isHandleBilling: isHandledBilling })
      .eq('shortCode', shortCode)
      .select()
      .throwOnError();

    log.debug('Updated Building Billing', { shortCode, isHandledBilling, data });
    if (error) log.error('Update Building Billing failed', { error: String(error) });
  }

  /**
   * Update building encouraged conversion setting
   */
  async updateBuildingUseEncourageConversion(
    shortCode: string,
    useEncourageConversion: boolean
  ): Promise<void> {
    const { data, error } = await supabase
      .from('Building')
      .update({ useEncouragedConversion: useEncourageConversion })
      .eq('shortCode', shortCode)
      .select()
      .throwOnError();

    log.debug('Updated Building Encouraged Conversion', { shortCode, useEncourageConversion, data });
    if (error) log.error('Update Building Encouraged Conversion failed', { error: String(error) });
  }

  /**
   * Update partner encouraged conversion setting
   */
  async updatePartnerUseEncourageConversion(
    partnerName: string,
    useEncourageConversion: boolean
  ): Promise<void> {
    const { data, error } = await supabase
      .from('MoveInPartner')
      .update({ useEncouragedConversion: useEncourageConversion })
      .eq('name', partnerName)
      .select()
      .throwOnError();

    log.debug('Updated Partner Encouraged Conversion', { partnerName, useEncourageConversion, data });
    if (error) log.error('Update Partner Encouraged Conversion failed', { error: String(error) });
  }
}

export const utilityQueries = new UtilityQueries();
