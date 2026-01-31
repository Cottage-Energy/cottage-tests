import { supabase } from '../../utils/supabase';

/**
 * Database queries for utility company and building configurations
 */
export class UtilityQueries {
  /**
   * Check if prior address is required for a utility
   */
  async getIsPriorAddressRequiredUtility(utilityId: string): Promise<boolean> {
    console.log('Checking prior address required for utility:', utilityId);
    
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
    console.log('Is Handled Billing (Building):', isHandledBilling);
    return isHandledBilling;
  }

  /**
   * Check if billing is handled for a utility
   */
  async getIsHandledBillingUtility(utilityId: string): Promise<boolean> {
    console.log('Checking handled billing for utility:', utilityId);
    
    const { data: utility } = await supabase
      .from('UtilityCompany')
      .select('isHandleBilling')
      .eq('id', utilityId)
      .single()
      .throwOnError();

    const isHandledBilling = utility?.isHandleBilling ?? false;
    console.log('Is Handled Billing (Utility):', isHandledBilling);
    return isHandledBilling;
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
    console.log('Is Billing Required:', isBillingRequired);
    return isBillingRequired;
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

    console.log('Updated Building Companies:', data);
    if (error) console.log('Error:', error);
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

    console.log('Updated Building Billing:', data);
    if (error) console.log('Error:', error);
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

    console.log('Updated Building Encouraged Conversion:', data);
    if (error) console.log('Error:', error);
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

    console.log('Updated Partner Encouraged Conversion:', data);
    if (error) console.log('Error:', error);
  }
}

export const utilityQueries = new UtilityQueries();
