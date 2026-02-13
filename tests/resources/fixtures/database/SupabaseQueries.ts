import { expect } from '@playwright/test';
import { supabase } from '../../utils/supabase';
import { RETRY_CONFIG, TIMEOUTS } from '../../constants';
import type { RemittanceStatus } from '../../types';

// Import individual query classes
import { UserQueries, userQueries } from './userQueries';
import { AccountQueries, accountQueries } from './accountQueries';
import { BillQueries, billQueries } from './billQueries';
import { PaymentQueries, paymentQueries } from './paymentQueries';
import { UtilityQueries, utilityQueries } from './utilityQueries';
import { CleanupQueries, cleanupQueries } from './cleanupQueries';

/**
 * Combined SupabaseQueries class for backward compatibility
 * This class aggregates all query modules and maintains the original API
 * 
 * @deprecated Consider using individual query modules directly for better organization
 */
export class SupabaseQueries {
  // User Queries
  async Check_Cottage_User_Id(email: string, textConsent?: boolean) {
    return userQueries.checkCottageUserId(email, textConsent);
  }

  async Get_Cottage_User_Id(email: string) {
    return userQueries.getCottageUserId(email);
  }

  async Check_Cottage_User_Id_Not_Present(email: string) {
    return userQueries.checkCottageUserIdNotPresent(email);
  }

  async Check_Cottage_User_Account_Number(email: string) {
    return userQueries.checkCottageUserAccountNumber(email);
  }

  async Check_Light_User_Id(email: string) {
    return userQueries.checkLightUserId(email);
  }

  async Get_Light_User_Id(email: string) {
    return userQueries.getLightUserId(email);
  }

  async Check_Waitlist(email: string) {
    return userQueries.checkWaitlist(email);
  }

  async Check_Waitlist_Not_Present(email: string) {
    return userQueries.checkWaitlistNotPresent(email);
  }

  async Check_isRegistrationComplete(cottageUserId: string, state: boolean = true) {
    return userQueries.checkIsRegistrationComplete(cottageUserId, state);
  }

  // Account Queries
  async Check_Get_Electric_Account_Id(cottageUserId: string) {
    return accountQueries.checkGetElectricAccountId(cottageUserId);
  }

  async Check_Electric_Account_Id_Not_Present(cottageUserId: string) {
    return accountQueries.checkElectricAccountIdNotPresent(cottageUserId);
  }

  async Get_Electric_Account_Id(cottageUserId: string) {
    return accountQueries.getElectricAccountId(cottageUserId);
  }

  async Check_Get_Gas_Account_Id(cottageUserId: string) {
    return accountQueries.checkGetGasAccountId(cottageUserId);
  }

  async Check_Gas_Account_Id_Not_Present(cottageUserId: string) {
    return accountQueries.checkGasAccountIdNotPresent(cottageUserId);
  }

  async Get_Gas_Account_Id(cottageUserId: string) {
    return accountQueries.getGasAccountId(cottageUserId);
  }

  async Get_Property_Id_by_Electric_Account(cottageUserId: string) {
    return accountQueries.getPropertyIdByElectricAccount(cottageUserId);
  }

  async Get_Property_Id_by_Gas_Account(cottageUserId: string) {
    return accountQueries.getPropertyIdByGasAccount(cottageUserId);
  }

  async Get_Check_Charge_Account(electricAccountId: string | null, gasAccountId: string | null) {
    return accountQueries.getCheckChargeAccount(electricAccountId, gasAccountId);
  }

  // Bill Queries
  async Insert_Electric_Bill(electricAccountId: string | null, totalAmountDue?: number, totalUsage?: number) {
    return billQueries.insertElectricBill(electricAccountId, totalAmountDue, totalUsage);
  }

  async Insert_Gas_Bill(gasAccountId: string | null, totalAmountDue?: number, totalUsage?: number) {
    return billQueries.insertGasBill(gasAccountId, totalAmountDue, totalUsage);
  }

  async Insert_Approved_Electric_Bill(electricAccountId: string, totalAmountDue?: number, totalUsage?: number) {
    return billQueries.insertApprovedElectricBill(electricAccountId, totalAmountDue, totalUsage);
  }

  async Insert_Approved_Gas_Bill(gasAccountId: string, totalAmountDue?: number, totalUsage?: number) {
    return billQueries.insertApprovedGasBill(gasAccountId, totalAmountDue, totalUsage);
  }

  async Approve_Electric_Bill(billId: string) {
    return billQueries.approveElectricBill(billId);
  }

  async Approve_Gas_Bill(billId: string) {
    return billQueries.approveGasBill(billId);
  }

  async Check_Electric_Bill_Is_Processed(billId: string) {
    return billQueries.checkElectricBillIsProcessed(billId);
  }

  async Check_Gas_Bill_Is_Processed(billId: string) {
    return billQueries.checkGasBillIsProcessed(billId);
  }

  async Get_Electric_Bill_Id(electricAccountId: string, amount: number, usage: number) {
    return billQueries.getElectricBillId(electricAccountId, amount, usage);
  }

  async Get_Gas_Bill_Id(gasAccountId: string, amount: number, usage: number) {
    return billQueries.getGasBillId(gasAccountId, amount, usage);
  }

  async Get_Electric_Bill_Start_Date(billId: string) {
    return billQueries.getElectricBillStartDate(billId);
  }

  async Get_Electric_Bill_End_Date(billId: string) {
    return billQueries.getElectricBillEndDate(billId);
  }

  async Get_Gas_Bill_Start_Date(billId: string) {
    return billQueries.getGasBillStartDate(billId);
  }

  async Get_Gas_Bill_End_Date(billId: string) {
    return billQueries.getGasBillEndDate(billId);
  }

  // Payment Queries
  async Check_Payment_Status(cottageUserId: string, amount: number, status: string) {
    return paymentQueries.checkPaymentStatus(cottageUserId, amount, status);
  }

  async Check_Payment_Processing(cottageUserId: string, amount: number) {
    return paymentQueries.checkPaymentProcessing(cottageUserId, amount);
  }

  async Check_Utility_Remittance(chargeAccountId: string, amount: number, status: RemittanceStatus) {
    return paymentQueries.checkUtilityRemittance(chargeAccountId, amount, status);
  }

  // Utility Queries
  async Get_isPriorAddressRequired_Utility(utilityId: string) {
    return utilityQueries.getIsPriorAddressRequiredUtility(utilityId);
  }

  async Get_isHandledBilling_Building(shortCode: string) {
    return utilityQueries.getIsHandledBillingBuilding(shortCode);
  }

  async Get_isHandledBilling_Utility(utilityId: string) {
    return utilityQueries.getIsHandledBillingUtility(utilityId);
  }

  async Get_isBillingRequired_Utility(utilityId: string) {
    return utilityQueries.getIsBillingRequiredUtility(utilityId);
  }

  async Get_Question_Id(company: string) {
    return utilityQueries.getQuestionId(company);
  }

  async Check_BGE_Answer(cottageUserId: string, questionId: string, answer: string) {
    return utilityQueries.checkBgeAnswer(cottageUserId, questionId, answer);
  }

  async Update_Companies_to_Building(shortCode: string, electricCompany: string | null, gasCompany: string | null) {
    return utilityQueries.updateCompaniesToBuilding(shortCode, electricCompany, gasCompany);
  }

  async Update_Building_Billing(shortCode: string, isHandledBilling: boolean) {
    return utilityQueries.updateBuildingBilling(shortCode, isHandledBilling);
  }

  async Update_Building_Use_Encourage_Conversion(shortCode: string, useEncourageConversion: boolean) {
    return utilityQueries.updateBuildingUseEncourageConversion(shortCode, useEncourageConversion);
  }

  async Update_Partner_Use_Encourage_Conversion(partnerName: string, useEncourageConversion: boolean) {
    return utilityQueries.updatePartnerUseEncourageConversion(partnerName, useEncourageConversion);
  }

  // Cleanup Queries
  async delete_Cottage_User(cottageUserId: string) {
    return cleanupQueries.deleteCottageUser(cottageUserId);
  }

  async delete_Electric_Account(electricAccountId: string | null) {
    return cleanupQueries.deleteElectricAccount(electricAccountId);
  }

  async delete_Gas_Account(gasAccountId: string | null) {
    return cleanupQueries.deleteGasAccount(gasAccountId);
  }

  async delete_Property(propertyId: number) {
    return cleanupQueries.deleteProperty(propertyId);
  }
}

export default SupabaseQueries;
