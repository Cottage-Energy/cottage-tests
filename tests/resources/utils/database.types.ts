export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.4';
  };
  public: {
    Tables: {
      Address: {
        Row: {
          city: string | null;
          createdAt: string | null;
          googlePlaceID: string | null;
          id: string;
          state: string | null;
          street: string | null;
          utilityFriendlyAddress: string | null;
          zip: string | null;
        };
        Insert: {
          city?: string | null;
          createdAt?: string | null;
          googlePlaceID?: string | null;
          id?: string;
          state?: string | null;
          street?: string | null;
          utilityFriendlyAddress?: string | null;
          zip?: string | null;
        };
        Update: {
          city?: string | null;
          createdAt?: string | null;
          googlePlaceID?: string | null;
          id?: string;
          state?: string | null;
          street?: string | null;
          utilityFriendlyAddress?: string | null;
          zip?: string | null;
        };
        Relationships: [];
      };
      ApiKey: {
        Row: {
          cottageUserID: string | null;
          createdAt: string | null;
          id: string;
          invalidatedAt: string | null;
          isValid: boolean | null;
          lastFive: string | null;
          nickname: string | null;
        };
        Insert: {
          cottageUserID?: string | null;
          createdAt?: string | null;
          id?: string;
          invalidatedAt?: string | null;
          isValid?: boolean | null;
          lastFive?: string | null;
          nickname?: string | null;
        };
        Update: {
          cottageUserID?: string | null;
          createdAt?: string | null;
          id?: string;
          invalidatedAt?: string | null;
          isValid?: boolean | null;
          lastFive?: string | null;
          nickname?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ApiKey_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      AuditHealthTimeSeriesMetrics: {
        Row: {
          accountNumber: string | null;
          accounttype: string | null;
          cottageUserID: string | null;
          delta: unknown | null;
          deltaAttempt: unknown | null;
          id: number;
          maintainedFor: string | null;
          run_at: string | null;
          status: string | null;
          utilityCompanyID: string | null;
        };
        Insert: {
          accountNumber?: string | null;
          accounttype?: string | null;
          cottageUserID?: string | null;
          delta?: unknown | null;
          deltaAttempt?: unknown | null;
          id?: number;
          maintainedFor?: string | null;
          run_at?: string | null;
          status?: string | null;
          utilityCompanyID?: string | null;
        };
        Update: {
          accountNumber?: string | null;
          accounttype?: string | null;
          cottageUserID?: string | null;
          delta?: unknown | null;
          deltaAttempt?: unknown | null;
          id?: number;
          maintainedFor?: string | null;
          run_at?: string | null;
          status?: string | null;
          utilityCompanyID?: string | null;
        };
        Relationships: [];
      };
      BillAdjustment: {
        Row: {
          adjustedBy: string | null;
          adjustmentPhase: Database['public']['Enums']['adjustment_phase_type'];
          amount: number | null;
          category: string;
          createdAt: string | null;
          electricBillID: number | null;
          gasBillID: number | null;
          id: string;
          ledgerTransactionID: string | null;
          reason: string | null;
          visible: boolean | null;
          willRemitOriginalAmount: boolean;
        };
        Insert: {
          adjustedBy?: string | null;
          adjustmentPhase?: Database['public']['Enums']['adjustment_phase_type'];
          amount?: number | null;
          category: string;
          createdAt?: string | null;
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          ledgerTransactionID?: string | null;
          reason?: string | null;
          visible?: boolean | null;
          willRemitOriginalAmount?: boolean;
        };
        Update: {
          adjustedBy?: string | null;
          adjustmentPhase?: Database['public']['Enums']['adjustment_phase_type'];
          amount?: number | null;
          category?: string;
          createdAt?: string | null;
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          ledgerTransactionID?: string | null;
          reason?: string | null;
          visible?: boolean | null;
          willRemitOriginalAmount?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'BillAdjustment_adjustedBy_fkey';
            columns: ['adjustedBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillAdjustment_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillAdjustment_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['electric_bill_id'];
          },
          {
            foreignKeyName: 'BillAdjustment_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'GasBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillAdjustment_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['gas_bill_id'];
          },
        ];
      };
      BillCredit: {
        Row: {
          amount: number;
          applicationStatus: string;
          appliedAt: string | null;
          appliedBy: string | null;
          category: string | null;
          chargeAccountID: string;
          createdAt: string;
          createdBy: string | null;
          creditType: Database['public']['Enums']['bill_credit_type'];
          electricBillID: number | null;
          gasBillID: number | null;
          id: string;
          reason: string | null;
        };
        Insert: {
          amount: number;
          applicationStatus?: string;
          appliedAt?: string | null;
          appliedBy?: string | null;
          category?: string | null;
          chargeAccountID: string;
          createdAt?: string;
          createdBy?: string | null;
          creditType: Database['public']['Enums']['bill_credit_type'];
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          reason?: string | null;
        };
        Update: {
          amount?: number;
          applicationStatus?: string;
          appliedAt?: string | null;
          appliedBy?: string | null;
          category?: string | null;
          chargeAccountID?: string;
          createdAt?: string;
          createdBy?: string | null;
          creditType?: Database['public']['Enums']['bill_credit_type'];
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'BillCredit_chargeAccountID_fkey';
            columns: ['chargeAccountID'];
            isOneToOne: false;
            referencedRelation: 'ChargeAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillCredit_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillCredit_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['electric_bill_id'];
          },
          {
            foreignKeyName: 'BillCredit_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'GasBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BillCredit_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['gas_bill_id'];
          },
          {
            foreignKeyName: 'fk_billcredit_appliedby_pgadminuser';
            columns: ['appliedBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_billcredit_createdby_pgadminuser';
            columns: ['createdBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
        ];
      };
      BillHistory: {
        Row: {
          action: string;
          billId: number;
          billType: string;
          changes: Json | null;
          createdAt: string;
          entityType: string;
          id: string;
          metadata: Json | null;
          previousValues: Json | null;
          updatedByUserID: string | null;
        };
        Insert: {
          action: string;
          billId: number;
          billType: string;
          changes?: Json | null;
          createdAt?: string;
          entityType: string;
          id?: string;
          metadata?: Json | null;
          previousValues?: Json | null;
          updatedByUserID?: string | null;
        };
        Update: {
          action?: string;
          billId?: number;
          billType?: string;
          changes?: Json | null;
          createdAt?: string;
          entityType?: string;
          id?: string;
          metadata?: Json | null;
          previousValues?: Json | null;
          updatedByUserID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'BillHistory_updatedByUserID_fkey';
            columns: ['updatedByUserID'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
        ];
      };
      Building: {
        Row: {
          addressID: string | null;
          allowDataSharing: boolean | null;
          electricCompanyID: string | null;
          gasCompanyID: string | null;
          id: string;
          isAutopayRequired: boolean | null;
          isBillingRequired: boolean | null;
          isDefaultBillingEnabled: boolean | null;
          isHandleBilling: boolean | null;
          moveInPartnerID: string | null;
          name: string | null;
          needsAddressVerification: boolean | null;
          offerLayla: boolean | null;
          offerRenewableEnergy: boolean;
          ownershipCompanyID: string | null;
          prefillAddress: boolean;
          prefillUnit: boolean;
          redirectToUtility: boolean;
          shortCode: string | null;
          showPGAccountNumber: boolean;
          totalUnitCount: number | null;
          utilityCity: string | null;
          utilityFriendlyAddress: string | null;
          utilityState: string | null;
          utilityStreet: string | null;
          utilityZip: string | null;
        };
        Insert: {
          addressID?: string | null;
          allowDataSharing?: boolean | null;
          electricCompanyID?: string | null;
          gasCompanyID?: string | null;
          id?: string;
          isAutopayRequired?: boolean | null;
          isBillingRequired?: boolean | null;
          isDefaultBillingEnabled?: boolean | null;
          isHandleBilling?: boolean | null;
          moveInPartnerID?: string | null;
          name?: string | null;
          needsAddressVerification?: boolean | null;
          offerLayla?: boolean | null;
          offerRenewableEnergy?: boolean;
          ownershipCompanyID?: string | null;
          prefillAddress?: boolean;
          prefillUnit?: boolean;
          redirectToUtility?: boolean;
          shortCode?: string | null;
          showPGAccountNumber?: boolean;
          totalUnitCount?: number | null;
          utilityCity?: string | null;
          utilityFriendlyAddress?: string | null;
          utilityState?: string | null;
          utilityStreet?: string | null;
          utilityZip?: string | null;
        };
        Update: {
          addressID?: string | null;
          allowDataSharing?: boolean | null;
          electricCompanyID?: string | null;
          gasCompanyID?: string | null;
          id?: string;
          isAutopayRequired?: boolean | null;
          isBillingRequired?: boolean | null;
          isDefaultBillingEnabled?: boolean | null;
          isHandleBilling?: boolean | null;
          moveInPartnerID?: string | null;
          name?: string | null;
          needsAddressVerification?: boolean | null;
          offerLayla?: boolean | null;
          offerRenewableEnergy?: boolean;
          ownershipCompanyID?: string | null;
          prefillAddress?: boolean;
          prefillUnit?: boolean;
          redirectToUtility?: boolean;
          shortCode?: string | null;
          showPGAccountNumber?: boolean;
          totalUnitCount?: number | null;
          utilityCity?: string | null;
          utilityFriendlyAddress?: string | null;
          utilityState?: string | null;
          utilityStreet?: string | null;
          utilityZip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Building_addressID_fkey';
            columns: ['addressID'];
            isOneToOne: false;
            referencedRelation: 'Address';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Building_gasCompanyID_fkey';
            columns: ['gasCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Building_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'MoveInPartner';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Building_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewMoveInPartnerReferral';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Building_ownershipCompanyID_fkey';
            columns: ['ownershipCompanyID'];
            isOneToOne: false;
            referencedRelation: 'BuildingOwnershipCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Building_utilityCompanyID_fkey';
            columns: ['electricCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      BuildingCompanyOwner: {
        Row: {
          createdAt: string;
          createdBy: string | null;
          isActive: boolean;
          managerProfileID: string;
          ownershipCompanyID: string;
        };
        Insert: {
          createdAt?: string;
          createdBy?: string | null;
          isActive?: boolean;
          managerProfileID: string;
          ownershipCompanyID: string;
        };
        Update: {
          createdAt?: string;
          createdBy?: string | null;
          isActive?: boolean;
          managerProfileID?: string;
          ownershipCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'BuildingCompanyOwner_managerProfileID_fkey';
            columns: ['managerProfileID'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BuildingCompanyOwner_ownershipCompanyID_fkey';
            columns: ['ownershipCompanyID'];
            isOneToOne: false;
            referencedRelation: 'BuildingOwnershipCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      BuildingManagerAssignment: {
        Row: {
          assignedAt: string;
          assignedBy: string;
          buildingID: string;
          isActive: boolean;
          managerProfileID: string;
        };
        Insert: {
          assignedAt?: string;
          assignedBy: string;
          buildingID: string;
          isActive?: boolean;
          managerProfileID: string;
        };
        Update: {
          assignedAt?: string;
          assignedBy?: string;
          buildingID?: string;
          isActive?: boolean;
          managerProfileID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'BuildingManagerAssignment_buildingID_fkey';
            columns: ['buildingID'];
            isOneToOne: false;
            referencedRelation: 'Building';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BuildingManagerAssignment_managerProfileID_fkey';
            columns: ['managerProfileID'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
        ];
      };
      BuildingManagerProfile: {
        Row: {
          acceptedAt: string | null;
          companyId: string | null;
          createdAt: string;
          email: string;
          firstName: string;
          id: string;
          invitedAt: string | null;
          invitedBy: string | null;
          inviteExpiresAt: string | null;
          inviteToken: string | null;
          lastName: string;
          phone: string | null;
          role: string | null;
          status: string;
          updatedAt: string;
        };
        Insert: {
          acceptedAt?: string | null;
          companyId?: string | null;
          createdAt?: string;
          email: string;
          firstName: string;
          id: string;
          invitedAt?: string | null;
          invitedBy?: string | null;
          inviteExpiresAt?: string | null;
          inviteToken?: string | null;
          lastName: string;
          phone?: string | null;
          role?: string | null;
          status?: string;
          updatedAt?: string;
        };
        Update: {
          acceptedAt?: string | null;
          companyId?: string | null;
          createdAt?: string;
          email?: string;
          firstName?: string;
          id?: string;
          invitedAt?: string | null;
          invitedBy?: string | null;
          inviteExpiresAt?: string | null;
          inviteToken?: string | null;
          lastName?: string;
          phone?: string | null;
          role?: string | null;
          status?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'BuildingManagerProfile_companyId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'BuildingOwnershipCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      BuildingOwnershipCompany: {
        Row: {
          allowDataSharing: boolean | null;
          createdAt: string;
          id: string;
          isActive: boolean;
          name: string;
          updatedAt: string;
        };
        Insert: {
          allowDataSharing?: boolean | null;
          createdAt?: string;
          id?: string;
          isActive?: boolean;
          name: string;
          updatedAt?: string;
        };
        Update: {
          allowDataSharing?: boolean | null;
          createdAt?: string;
          id?: string;
          isActive?: boolean;
          name?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      BuildingPermission: {
        Row: {
          buildingID: string;
          grantedAt: string;
          grantedBy: string;
          id: string;
          managerProfileID: string;
          permissionType: string;
        };
        Insert: {
          buildingID: string;
          grantedAt?: string;
          grantedBy: string;
          id?: string;
          managerProfileID: string;
          permissionType: string;
        };
        Update: {
          buildingID?: string;
          grantedAt?: string;
          grantedBy?: string;
          id?: string;
          managerProfileID?: string;
          permissionType?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'BuildingPermission_buildingID_fkey';
            columns: ['buildingID'];
            isOneToOne: false;
            referencedRelation: 'Building';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BuildingPermission_grantedBy_fkey';
            columns: ['grantedBy'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'BuildingPermission_managerProfileID_fkey';
            columns: ['managerProfileID'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
        ];
      };
      ChargeAccount: {
        Row: {
          _audit: Json | null;
          createdAt: string;
          electricAccountID: number | null;
          gasAccountID: number | null;
          id: string;
          ledgerBalanceID: string;
          paymentInstrumentId: string | null;
          propertyID: number | null;
          status: string;
        };
        Insert: {
          _audit?: Json | null;
          createdAt?: string;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: string;
          ledgerBalanceID: string;
          paymentInstrumentId?: string | null;
          propertyID?: number | null;
          status: string;
        };
        Update: {
          _audit?: Json | null;
          createdAt?: string;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: string;
          ledgerBalanceID?: string;
          paymentInstrumentId?: string | null;
          propertyID?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ChargeAccount_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ChargeAccount_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ChargeAccount_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ChargeAccount_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ChargeAccount_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'ChargeAccount_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'ChargeAccount_paymentInstrumentId_fkey';
            columns: ['paymentInstrumentId'];
            isOneToOne: false;
            referencedRelation: 'PaymentInstrument';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ChargeAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'Property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ChargeAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['propertyID'];
          },
        ];
      };
      Charges: {
        Row: {
          approvedOn: string | null;
          closeBy: string | null;
          closedAt: string | null;
          created_at: string | null;
          id: string;
          isBillCreated: boolean;
          isVisible: boolean;
          ownedBy: string | null;
        };
        Insert: {
          approvedOn?: string | null;
          closeBy?: string | null;
          closedAt?: string | null;
          created_at?: string | null;
          id?: string;
          isBillCreated?: boolean;
          isVisible?: boolean;
          ownedBy?: string | null;
        };
        Update: {
          approvedOn?: string | null;
          closeBy?: string | null;
          closedAt?: string | null;
          created_at?: string | null;
          id?: string;
          isBillCreated?: boolean;
          isVisible?: boolean;
          ownedBy?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Charges_ownedBy_fkey';
            columns: ['ownedBy'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      Comment: {
        Row: {
          content: string;
          cottageUserID: string | null;
          createdAt: string | null;
          createdBy: string;
          entityTextId: string | null;
          entityType: string;
          entityUUID: string | null;
          id: string;
          isDeleted: boolean | null;
          metadata: Json | null;
          parentCommentID: string | null;
          updatedAt: string | null;
        };
        Insert: {
          content: string;
          cottageUserID?: string | null;
          createdAt?: string | null;
          createdBy: string;
          entityTextId?: string | null;
          entityType: string;
          entityUUID?: string | null;
          id?: string;
          isDeleted?: boolean | null;
          metadata?: Json | null;
          parentCommentID?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          content?: string;
          cottageUserID?: string | null;
          createdAt?: string | null;
          createdBy?: string;
          entityTextId?: string | null;
          entityType?: string;
          entityUUID?: string | null;
          id?: string;
          isDeleted?: boolean | null;
          metadata?: Json | null;
          parentCommentID?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Comment_createdBy_fkey';
            columns: ['createdBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Comment_entityType_fkey';
            columns: ['entityType'];
            isOneToOne: false;
            referencedRelation: 'CommentableEntity';
            referencedColumns: ['entityType'];
          },
          {
            foreignKeyName: 'Comment_parentCommentID_fkey';
            columns: ['parentCommentID'];
            isOneToOne: false;
            referencedRelation: 'Comment';
            referencedColumns: ['id'];
          },
        ];
      };
      CommentableEntity: {
        Row: {
          createdAt: string | null;
          entityType: string;
          idType: string;
        };
        Insert: {
          createdAt?: string | null;
          entityType: string;
          idType: string;
        };
        Update: {
          createdAt?: string | null;
          entityType?: string;
          idType?: string;
        };
        Relationships: [];
      };
      CommunitySolarBill: {
        Row: {
          amountDue: number;
          dueDate: string;
          electricBill: number | null;
          id: string;
          netMeterCredit: number;
          savings: number;
          savingsShare: number;
          usage: number;
        };
        Insert: {
          amountDue: number;
          dueDate: string;
          electricBill?: number | null;
          id?: string;
          netMeterCredit: number;
          savings: number;
          savingsShare: number;
          usage: number;
        };
        Update: {
          amountDue?: number;
          dueDate?: string;
          electricBill?: number | null;
          id?: string;
          netMeterCredit?: number;
          savings?: number;
          savingsShare?: number;
          usage?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'CommunitySolarBill_electricBill_fkey';
            columns: ['electricBill'];
            isOneToOne: false;
            referencedRelation: 'ElectricBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'CommunitySolarBill_electricBill_fkey';
            columns: ['electricBill'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['electric_bill_id'];
          },
        ];
      };
      CommunitySolarBillCharge: {
        Row: {
          billId: string;
          chargeId: string;
          created_at: string;
          id: string;
          isValid: boolean;
        };
        Insert: {
          billId: string;
          chargeId: string;
          created_at?: string;
          id?: string;
          isValid?: boolean;
        };
        Update: {
          billId?: string;
          chargeId?: string;
          created_at?: string;
          id?: string;
          isValid?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'CommunitySolarBillCharge_billId_fkey';
            columns: ['billId'];
            isOneToOne: false;
            referencedRelation: 'CommunitySolarBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'CommunitySolarBillCharge_chargeId_fkey';
            columns: ['chargeId'];
            isOneToOne: false;
            referencedRelation: 'Charges';
            referencedColumns: ['id'];
          },
        ];
      };
      CommunitySolarBillingConfig: {
        Row: {
          created_at: string;
          fixed: number;
          id: string;
          percentage: number;
        };
        Insert: {
          created_at?: string;
          fixed: number;
          id?: string;
          percentage: number;
        };
        Update: {
          created_at?: string;
          fixed?: number;
          id?: string;
          percentage?: number;
        };
        Relationships: [];
      };
      CommunitySolarProvider: {
        Row: {
          capacity: number | null;
          companyName: string | null;
          coverageServiceGroupID: string | null;
          enrollment: number | null;
          id: number;
          savingsPercent: string | null;
        };
        Insert: {
          capacity?: number | null;
          companyName?: string | null;
          coverageServiceGroupID?: string | null;
          enrollment?: number | null;
          id?: number;
          savingsPercent?: string | null;
        };
        Update: {
          capacity?: number | null;
          companyName?: string | null;
          coverageServiceGroupID?: string | null;
          enrollment?: number | null;
          id?: number;
          savingsPercent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'CommunitySolarProvider_coverageServiceGroupID_fkey';
            columns: ['coverageServiceGroupID'];
            isOneToOne: false;
            referencedRelation: 'ServiceGroup';
            referencedColumns: ['id'];
          },
        ];
      };
      ConnectCache: {
        Row: {
          created: string | null;
          identifier: string;
          method: string | null;
          owner: string | null;
          payload: Json;
          updated_at: string | null;
        };
        Insert: {
          created?: string | null;
          identifier: string;
          method?: string | null;
          owner?: string | null;
          payload: Json;
          updated_at?: string | null;
        };
        Update: {
          created?: string | null;
          identifier?: string;
          method?: string | null;
          owner?: string | null;
          payload?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ConnectRequest: {
        Row: {
          canceled: boolean | null;
          completed: boolean | null;
          createdAt: string | null;
          expiresAt: string | null;
          grantedAt: string | null;
          id: string;
          permissions: string[] | null;
          redirectUrl: string | null;
          requestedFromId: string | null;
          requestorId: string | null;
          revoked: boolean | null;
          revokedAt: string | null;
        };
        Insert: {
          canceled?: boolean | null;
          completed?: boolean | null;
          createdAt?: string | null;
          expiresAt?: string | null;
          grantedAt?: string | null;
          id?: string;
          permissions?: string[] | null;
          redirectUrl?: string | null;
          requestedFromId?: string | null;
          requestorId?: string | null;
          revoked?: boolean | null;
          revokedAt?: string | null;
        };
        Update: {
          canceled?: boolean | null;
          completed?: boolean | null;
          createdAt?: string | null;
          expiresAt?: string | null;
          grantedAt?: string | null;
          id?: string;
          permissions?: string[] | null;
          redirectUrl?: string | null;
          requestedFromId?: string | null;
          requestorId?: string | null;
          revoked?: boolean | null;
          revokedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['requestedFromId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['requestorId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      CottageUserHistory: {
        Row: {
          action: string;
          changes: Json | null;
          cottageUserID: string;
          createdAt: string;
          entityID: string | null;
          entityType: string;
          id: string;
          metadata: Json | null;
          previousValues: Json | null;
          updatedByUserID: string | null;
        };
        Insert: {
          action: string;
          changes?: Json | null;
          cottageUserID: string;
          createdAt?: string;
          entityID?: string | null;
          entityType: string;
          id?: string;
          metadata?: Json | null;
          previousValues?: Json | null;
          updatedByUserID?: string | null;
        };
        Update: {
          action?: string;
          changes?: Json | null;
          cottageUserID?: string;
          createdAt?: string;
          entityID?: string | null;
          entityType?: string;
          id?: string;
          metadata?: Json | null;
          previousValues?: Json | null;
          updatedByUserID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'CottageUserHistory_updatedByUserID_fkey';
            columns: ['updatedByUserID'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
        ];
      };
      CottageUsers: {
        Row: {
          _audit: Json | null;
          accountNumber: number;
          auditTicketId: string | null;
          cottageConnectUserType:
            | Database['public']['Enums']['enum_CottageUsers_cottageConnectUserType']
            | null;
          createdAt: string | null;
          dateOfESCOConsent: string | null;
          dateOfTextMessageConsent: string | null;
          dateSubscribedToLayla: string | null;
          didDropOff: boolean | null;
          email: string | null;
          enrollmentPreference:
            | Database['public']['Enums']['enum_CottageUsers_enrollmentPreferenceType']
            | null;
          fee_structure: number | null;
          id: string;
          intercomID: string | null;
          isAbleToSendTextMessages: boolean;
          isAutoPaymentEnabled: boolean | null;
          isEligibleForRetargeting: boolean | null;
          isReceivingSetupReminders: boolean;
          moveInIdentifier: string | null;
          paymentMethodStatus:
            | Database['public']['Enums']['paymentmethodstatus']
            | null;
          pgEmail: string | null;
          referralCode: string | null;
          requiresMicroDepositVerification: boolean;
          stripeCustomerID: string | null;
          stripePaymentMethodID: string | null;
          stripePaymentMethodType:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType']
            | null;
          termsAndConditionsDate: string | null;
        };
        Insert: {
          _audit?: Json | null;
          accountNumber?: number;
          auditTicketId?: string | null;
          cottageConnectUserType?:
            | Database['public']['Enums']['enum_CottageUsers_cottageConnectUserType']
            | null;
          createdAt?: string | null;
          dateOfESCOConsent?: string | null;
          dateOfTextMessageConsent?: string | null;
          dateSubscribedToLayla?: string | null;
          didDropOff?: boolean | null;
          email?: string | null;
          enrollmentPreference?:
            | Database['public']['Enums']['enum_CottageUsers_enrollmentPreferenceType']
            | null;
          fee_structure?: number | null;
          id: string;
          intercomID?: string | null;
          isAbleToSendTextMessages?: boolean;
          isAutoPaymentEnabled?: boolean | null;
          isEligibleForRetargeting?: boolean | null;
          isReceivingSetupReminders?: boolean;
          moveInIdentifier?: string | null;
          paymentMethodStatus?:
            | Database['public']['Enums']['paymentmethodstatus']
            | null;
          pgEmail?: string | null;
          referralCode?: string | null;
          requiresMicroDepositVerification?: boolean;
          stripeCustomerID?: string | null;
          stripePaymentMethodID?: string | null;
          stripePaymentMethodType?:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType']
            | null;
          termsAndConditionsDate?: string | null;
        };
        Update: {
          _audit?: Json | null;
          accountNumber?: number;
          auditTicketId?: string | null;
          cottageConnectUserType?:
            | Database['public']['Enums']['enum_CottageUsers_cottageConnectUserType']
            | null;
          createdAt?: string | null;
          dateOfESCOConsent?: string | null;
          dateOfTextMessageConsent?: string | null;
          dateSubscribedToLayla?: string | null;
          didDropOff?: boolean | null;
          email?: string | null;
          enrollmentPreference?:
            | Database['public']['Enums']['enum_CottageUsers_enrollmentPreferenceType']
            | null;
          fee_structure?: number | null;
          id?: string;
          intercomID?: string | null;
          isAbleToSendTextMessages?: boolean;
          isAutoPaymentEnabled?: boolean | null;
          isEligibleForRetargeting?: boolean | null;
          isReceivingSetupReminders?: boolean;
          moveInIdentifier?: string | null;
          paymentMethodStatus?:
            | Database['public']['Enums']['paymentmethodstatus']
            | null;
          pgEmail?: string | null;
          referralCode?: string | null;
          requiresMicroDepositVerification?: boolean;
          stripeCustomerID?: string | null;
          stripePaymentMethodID?: string | null;
          stripePaymentMethodType?:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType']
            | null;
          termsAndConditionsDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'CottageUsers_fee_structure_fkey';
            columns: ['fee_structure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
        ];
      };
      DialpadSMS: {
        Row: {
          content: string | null;
          cottageUserID: string | null;
          createdAt: string;
          department: string | null;
          direction: Database['public']['Enums']['enum_DialpadSMS_direction'];
          id: number;
          status: string | null;
          webhookPayload: Json | null;
        };
        Insert: {
          content?: string | null;
          cottageUserID?: string | null;
          createdAt?: string;
          department?: string | null;
          direction: Database['public']['Enums']['enum_DialpadSMS_direction'];
          id?: number;
          status?: string | null;
          webhookPayload?: Json | null;
        };
        Update: {
          content?: string | null;
          cottageUserID?: string | null;
          createdAt?: string;
          department?: string | null;
          direction?: Database['public']['Enums']['enum_DialpadSMS_direction'];
          id?: number;
          status?: string | null;
          webhookPayload?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'DialpadSMS_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      Documents: {
        Row: {
          cottageUserID: string | null;
          createdAt: string;
          fileName: string | null;
          id: number;
          propertyID: number | null;
          storageName: string | null;
          type: string | null;
          updatedAt: string | null;
        };
        Insert: {
          cottageUserID?: string | null;
          createdAt?: string;
          fileName?: string | null;
          id?: number;
          propertyID?: number | null;
          storageName?: string | null;
          type?: string | null;
          updatedAt?: string | null;
        };
        Update: {
          cottageUserID?: string | null;
          createdAt?: string;
          fileName?: string | null;
          id?: number;
          propertyID?: number | null;
          storageName?: string | null;
          type?: string | null;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Documents_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Documents_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'Property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Documents_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['propertyID'];
          },
        ];
      };
      ElectricAccount: {
        Row: {
          _audit: Json | null;
          accountIdentifiers: Json | null;
          accountNumber: string | null;
          accountType: string | null;
          auditTicketId: string | null;
          balanceAt: string | null;
          communitySolarProviderID: number | null;
          communitySolarSavingsConfig: string | null;
          communitySolarStatus:
            | Database['public']['Enums']['enum_ElectricAccount_communitySolarStatus']
            | null;
          confirmationNumber: number | null;
          cottageUserID: string | null;
          createdAt: string | null;
          customerNumber: string | null;
          defaultBillFeeStructure: number | null;
          delinquentDays: number;
          depositAmount: number | null;
          depositInstallments: number | null;
          didSendAccountNumber: boolean | null;
          electricChoiceID: string | null;
          electricGeneratingEquipment: string | null;
          endDate: string | null;
          hasDeposit: boolean;
          hasElectricVehicle: boolean | null;
          hasOverdueBalance: boolean;
          id: number;
          inactiveReason: string | null;
          isAccountLinkedWithUtility: boolean | null;
          isActive: boolean | null;
          isDelinquent: boolean;
          isEnrolledInCCA: boolean | null;
          isEnrolledInUtilityAutoPay: boolean | null;
          isUnderCottageEIN: boolean | null;
          lastAuditAttempt: string | null;
          lastAuditDate: string | null;
          lastAuditLog: string | null;
          lastSuccessfulAudit: string | null;
          lastSync: string | null;
          lastUtilityPaymentDate: string | null;
          linearTicketId: string | null;
          maintainedFor: string | null;
          nextUtilityPaymentDate: string | null;
          nonManagedAccountVerificationDate: string | null;
          onlineAccountMetadata: Json | null;
          planeTicketID: string | null;
          podID: string | null;
          propertyID: number | null;
          registrationDocumentsStatus:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries: number;
          sentAccountNumberDate: string | null;
          serviceNumber: string | null;
          startDate: string | null;
          status:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt: string;
          supplyStatus:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          timestamp: string | null;
          tmpPassword: string | null;
          totalOutstandingBalance: number | null;
          uniqueIdentifier: string | null;
          updatedAt: string;
          utilityCompanyID: string | null;
          vehicleMakeModel: string | null;
        };
        Insert: {
          _audit?: Json | null;
          accountIdentifiers?: Json | null;
          accountNumber?: string | null;
          accountType?: string | null;
          auditTicketId?: string | null;
          balanceAt?: string | null;
          communitySolarProviderID?: number | null;
          communitySolarSavingsConfig?: string | null;
          communitySolarStatus?:
            | Database['public']['Enums']['enum_ElectricAccount_communitySolarStatus']
            | null;
          confirmationNumber?: number | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          customerNumber?: string | null;
          defaultBillFeeStructure?: number | null;
          delinquentDays?: number;
          depositAmount?: number | null;
          depositInstallments?: number | null;
          didSendAccountNumber?: boolean | null;
          electricChoiceID?: string | null;
          electricGeneratingEquipment?: string | null;
          endDate?: string | null;
          hasDeposit?: boolean;
          hasElectricVehicle?: boolean | null;
          hasOverdueBalance?: boolean;
          id?: number;
          inactiveReason?: string | null;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isDelinquent?: boolean;
          isEnrolledInCCA?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastAuditAttempt?: string | null;
          lastAuditDate?: string | null;
          lastAuditLog?: string | null;
          lastSuccessfulAudit?: string | null;
          lastSync?: string | null;
          lastUtilityPaymentDate?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          nonManagedAccountVerificationDate?: string | null;
          onlineAccountMetadata?: Json | null;
          planeTicketID?: string | null;
          podID?: string | null;
          propertyID?: number | null;
          registrationDocumentsStatus?:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries?: number;
          sentAccountNumberDate?: string | null;
          serviceNumber?: string | null;
          startDate?: string | null;
          status?:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt?: string;
          supplyStatus?:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          timestamp?: string | null;
          tmpPassword?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
          vehicleMakeModel?: string | null;
        };
        Update: {
          _audit?: Json | null;
          accountIdentifiers?: Json | null;
          accountNumber?: string | null;
          accountType?: string | null;
          auditTicketId?: string | null;
          balanceAt?: string | null;
          communitySolarProviderID?: number | null;
          communitySolarSavingsConfig?: string | null;
          communitySolarStatus?:
            | Database['public']['Enums']['enum_ElectricAccount_communitySolarStatus']
            | null;
          confirmationNumber?: number | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          customerNumber?: string | null;
          defaultBillFeeStructure?: number | null;
          delinquentDays?: number;
          depositAmount?: number | null;
          depositInstallments?: number | null;
          didSendAccountNumber?: boolean | null;
          electricChoiceID?: string | null;
          electricGeneratingEquipment?: string | null;
          endDate?: string | null;
          hasDeposit?: boolean;
          hasElectricVehicle?: boolean | null;
          hasOverdueBalance?: boolean;
          id?: number;
          inactiveReason?: string | null;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isDelinquent?: boolean;
          isEnrolledInCCA?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastAuditAttempt?: string | null;
          lastAuditDate?: string | null;
          lastAuditLog?: string | null;
          lastSuccessfulAudit?: string | null;
          lastSync?: string | null;
          lastUtilityPaymentDate?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          nonManagedAccountVerificationDate?: string | null;
          onlineAccountMetadata?: Json | null;
          planeTicketID?: string | null;
          podID?: string | null;
          propertyID?: number | null;
          registrationDocumentsStatus?:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries?: number;
          sentAccountNumberDate?: string | null;
          serviceNumber?: string | null;
          startDate?: string | null;
          status?:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt?: string;
          supplyStatus?:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          timestamp?: string | null;
          tmpPassword?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
          vehicleMakeModel?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricAccount_communitySolarProviderID_fkey';
            columns: ['communitySolarProviderID'];
            isOneToOne: false;
            referencedRelation: 'CommunitySolarProvider';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_communitySolarSavingsConfig_fkey';
            columns: ['communitySolarSavingsConfig'];
            isOneToOne: false;
            referencedRelation: 'CommunitySolarBillingConfig';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ElectricAccount_defaultBillFeeStructure_fkey';
            columns: ['defaultBillFeeStructure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'Property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['propertyID'];
          },
          {
            foreignKeyName: 'ElectricAccount_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ElectricAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ElectricBill: {
        Row: {
          _audit: Json | null;
          approvedBy: string | null;
          approvedDate: string | null;
          communitySolarBill: string | null;
          createdAt: string | null;
          deliveryCharge: number | null;
          dueDate: string | null;
          electricAccountID: number;
          endDate: string;
          feeStructure: number | null;
          id: number;
          ingestionState: Database['public']['Enums']['ingestion_state'] | null;
          isDepositOnlyBill: boolean;
          isIncomplete: boolean;
          isPaidByUser: boolean | null;
          isPaidUtilityCompany: boolean | null;
          isSendReminder: boolean | null;
          lastPaymentAttemptDate: string | null;
          manual: boolean | null;
          otherCharges: number | null;
          paidByUser: string | null;
          paidNotificationSent: boolean | null;
          paymentDate: string | null;
          paymentStatus: Database['public']['Enums']['paymentstatus'] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId: string | null;
          supplierCharge: number | null;
          ticketID: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee: number | null;
          updatedAt: string | null;
          utilityCompanyPaidAt: string | null;
          visible: boolean;
        };
        Insert: {
          _audit?: Json | null;
          approvedBy?: string | null;
          approvedDate?: string | null;
          communitySolarBill?: string | null;
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          electricAccountID: number;
          endDate: string;
          feeStructure?: number | null;
          id?: number;
          ingestionState?:
            | Database['public']['Enums']['ingestion_state']
            | null;
          isDepositOnlyBill?: boolean;
          isIncomplete?: boolean;
          isPaidByUser?: boolean | null;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: number | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee?: number | null;
          updatedAt?: string | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Update: {
          _audit?: Json | null;
          approvedBy?: string | null;
          approvedDate?: string | null;
          communitySolarBill?: string | null;
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          electricAccountID?: number;
          endDate?: string;
          feeStructure?: number | null;
          id?: number;
          ingestionState?:
            | Database['public']['Enums']['ingestion_state']
            | null;
          isDepositOnlyBill?: boolean;
          isIncomplete?: boolean;
          isPaidByUser?: boolean | null;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: number | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          startDate?: string;
          statementDate?: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue?: number;
          totalUsage?: number;
          transactionFee?: number | null;
          updatedAt?: string | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricBill_approvedBy_fkey';
            columns: ['approvedBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_communitySolarBill_fkey';
            columns: ['communitySolarBill'];
            isOneToOne: false;
            referencedRelation: 'CommunitySolarBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ElectricBill_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ElectricBill_feeStructure_fkey';
            columns: ['feeStructure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ElectricBillCharge: {
        Row: {
          chargeId: string;
          created_at: string | null;
          electricBillId: number;
          isValid: boolean;
        };
        Insert: {
          chargeId: string;
          created_at?: string | null;
          electricBillId: number;
          isValid?: boolean;
        };
        Update: {
          chargeId?: string;
          created_at?: string | null;
          electricBillId?: number;
          isValid?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricBillCharge_chargeId_fkey';
            columns: ['chargeId'];
            isOneToOne: false;
            referencedRelation: 'Charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBillCharge_electricBillId_fkey';
            columns: ['electricBillId'];
            isOneToOne: false;
            referencedRelation: 'ElectricBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBillCharge_electricBillId_fkey';
            columns: ['electricBillId'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['electric_bill_id'];
          },
        ];
      };
      ElectricBillSavings: {
        Row: {
          createdAt: string | null;
          currentInCents: number | null;
          electricAccountID: number | null;
          hourlyInCents: number | null;
          id: number;
        };
        Insert: {
          createdAt?: string | null;
          currentInCents?: number | null;
          electricAccountID?: number | null;
          hourlyInCents?: number | null;
          id?: number;
        };
        Update: {
          createdAt?: string | null;
          currentInCents?: number | null;
          electricAccountID?: number | null;
          hourlyInCents?: number | null;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricBillSavings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricBillSavings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ElectricBillSavings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
        ];
      };
      ElectricSupplyPlan: {
        Row: {
          contractDocumentID: number | null;
          contractExternalID: string | null;
          contractLengthMonths: number | null;
          contractSentDate: string | null;
          electricAccountID: number | null;
          endDate: string | null;
          id: number;
          isActive: boolean | null;
          lastSyncedAt: string | null;
          milAdder: number | null;
          newRate: number | null;
          oldRate: number | null;
          platform: string | null;
          startDate: string | null;
          supplierID: number | null;
          supplyStatus:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          upfrontFee: number | null;
        };
        Insert: {
          contractDocumentID?: number | null;
          contractExternalID?: string | null;
          contractLengthMonths?: number | null;
          contractSentDate?: string | null;
          electricAccountID?: number | null;
          endDate?: string | null;
          id?: number;
          isActive?: boolean | null;
          lastSyncedAt?: string | null;
          milAdder?: number | null;
          newRate?: number | null;
          oldRate?: number | null;
          platform?: string | null;
          startDate?: string | null;
          supplierID?: number | null;
          supplyStatus?:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          upfrontFee?: number | null;
        };
        Update: {
          contractDocumentID?: number | null;
          contractExternalID?: string | null;
          contractLengthMonths?: number | null;
          contractSentDate?: string | null;
          electricAccountID?: number | null;
          endDate?: string | null;
          id?: number;
          isActive?: boolean | null;
          lastSyncedAt?: string | null;
          milAdder?: number | null;
          newRate?: number | null;
          oldRate?: number | null;
          platform?: string | null;
          startDate?: string | null;
          supplierID?: number | null;
          supplyStatus?:
            | Database['public']['Enums']['enum_electricsupplyplan_supplystatus']
            | null;
          upfrontFee?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricSupplyPlan_contractDocumentID_fkey';
            columns: ['contractDocumentID'];
            isOneToOne: false;
            referencedRelation: 'Documents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ElectricSupplyPlan_supplierID_fkey';
            columns: ['supplierID'];
            isOneToOne: false;
            referencedRelation: 'Supplier';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_electricsupplyplan_electricaccount';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_electricsupplyplan_electricaccount';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'fk_electricsupplyplan_electricaccount';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
        ];
      };
      ElectricZone: {
        Row: {
          activeUsers: number | null;
          created_at: string;
          electricityMapsZoneKey: string | null;
          id: string;
          name: string | null;
        };
        Insert: {
          activeUsers?: number | null;
          created_at?: string;
          electricityMapsZoneKey?: string | null;
          id: string;
          name?: string | null;
        };
        Update: {
          activeUsers?: number | null;
          created_at?: string;
          electricityMapsZoneKey?: string | null;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      EmissionFactor: {
        Row: {
          EmissionFactor: number;
          Resource: string;
        };
        Insert: {
          EmissionFactor: number;
          Resource: string;
        };
        Update: {
          EmissionFactor?: number;
          Resource?: string;
        };
        Relationships: [];
      };
      existing_property: {
        Row: {
          addressID: string | null;
          buildingID: string | null;
          createdAt: string | null;
          id: number | null;
          isRenewablePaidFor: boolean | null;
          propertyGroupID: string | null;
          type: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber: string | null;
        };
        Insert: {
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          id?: number | null;
          isRenewablePaidFor?: boolean | null;
          propertyGroupID?: string | null;
          type?: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber?: string | null;
        };
        Update: {
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          id?: number | null;
          isRenewablePaidFor?: boolean | null;
          propertyGroupID?: string | null;
          type?: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber?: string | null;
        };
        Relationships: [];
      };
      ExternalCompany: {
        Row: {
          created_at: string | null;
          hasMoveInPermission: boolean | null;
          id: string;
          name: string | null;
          ownerCottageUserID: string | null;
          status: Database['public']['Enums']['ExternalCompanyStatusEnum'];
        };
        Insert: {
          created_at?: string | null;
          hasMoveInPermission?: boolean | null;
          id?: string;
          name?: string | null;
          ownerCottageUserID?: string | null;
          status?: Database['public']['Enums']['ExternalCompanyStatusEnum'];
        };
        Update: {
          created_at?: string | null;
          hasMoveInPermission?: boolean | null;
          id?: string;
          name?: string | null;
          ownerCottageUserID?: string | null;
          status?: Database['public']['Enums']['ExternalCompanyStatusEnum'];
        };
        Relationships: [
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompany_ownerCottageUserID_fkey';
            columns: ['ownerCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ExternalCompanyEmployee: {
        Row: {
          cottageUserID: string;
          externalCompanyID: string;
          firstName: string;
          id: string;
          lastName: string;
        };
        Insert: {
          cottageUserID: string;
          externalCompanyID: string;
          firstName: string;
          id?: string;
          lastName: string;
        };
        Update: {
          cottageUserID?: string;
          externalCompanyID?: string;
          firstName?: string;
          id?: string;
          lastName?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ExternalCompanyEmployee_externalCompanyID_fkey';
            columns: ['externalCompanyID'];
            isOneToOne: false;
            referencedRelation: 'ExternalCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      FeeStructure: {
        Row: {
          created_at: string;
          fixed: number | null;
          id: number;
          name: string | null;
          percentage: number | null;
          targetPaymentMethodTypes:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType'][]
            | null;
        };
        Insert: {
          created_at?: string;
          fixed?: number | null;
          id?: number;
          name?: string | null;
          percentage?: number | null;
          targetPaymentMethodTypes?:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType'][]
            | null;
        };
        Update: {
          created_at?: string;
          fixed?: number | null;
          id?: number;
          name?: string | null;
          percentage?: number | null;
          targetPaymentMethodTypes?:
            | Database['public']['Enums']['enum_CottageUsers_stripePaymentMethodType'][]
            | null;
        };
        Relationships: [];
      };
      GasAccount: {
        Row: {
          _audit: Json | null;
          accountIdentifiers: Json | null;
          accountNumber: string | null;
          auditTicketId: string | null;
          balanceAt: string | null;
          cottageUserID: string | null;
          createdAt: string | null;
          defaultBillFeeStructure: number | null;
          delinquentDays: number;
          depositAmount: number | null;
          depositInstallments: number | null;
          didSendAccountNumber: boolean | null;
          endDate: string | null;
          hasDeposit: boolean;
          hasOverdueBalance: boolean;
          id: number;
          inactiveReason: string | null;
          isAccountLinkedWithUtility: boolean | null;
          isActive: boolean | null;
          isDelinquent: boolean;
          isEnrolledInUtilityAutoPay: boolean | null;
          isUnderCottageEIN: boolean | null;
          lastAuditAttempt: string | null;
          lastAuditDate: string | null;
          lastAuditLog: string | null;
          lastSuccessfulAudit: string | null;
          lastSync: string | null;
          lastUtilityPaymentDate: string | null;
          linearTicketId: string | null;
          maintainedFor: string | null;
          nextUtilityPaymentDate: string | null;
          nonManagedAccountVerificationDate: string | null;
          onlineAccountMetadata: Json | null;
          planeTicketID: string | null;
          propertyID: number | null;
          registrationDocumentsStatus:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries: number;
          sentAccountNumberDate: string | null;
          startDate: string | null;
          status:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt: string;
          timestamp: string | null;
          totalOutstandingBalance: number | null;
          uniqueIdentifier: string | null;
          updatedAt: string;
          utilityCompanyID: string | null;
        };
        Insert: {
          _audit?: Json | null;
          accountIdentifiers?: Json | null;
          accountNumber?: string | null;
          auditTicketId?: string | null;
          balanceAt?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          delinquentDays?: number;
          depositAmount?: number | null;
          depositInstallments?: number | null;
          didSendAccountNumber?: boolean | null;
          endDate?: string | null;
          hasDeposit?: boolean;
          hasOverdueBalance?: boolean;
          id?: number;
          inactiveReason?: string | null;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isDelinquent?: boolean;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastAuditAttempt?: string | null;
          lastAuditDate?: string | null;
          lastAuditLog?: string | null;
          lastSuccessfulAudit?: string | null;
          lastSync?: string | null;
          lastUtilityPaymentDate?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          nonManagedAccountVerificationDate?: string | null;
          onlineAccountMetadata?: Json | null;
          planeTicketID?: string | null;
          propertyID?: number | null;
          registrationDocumentsStatus?:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries?: number;
          sentAccountNumberDate?: string | null;
          startDate?: string | null;
          status?:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt?: string;
          timestamp?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
        };
        Update: {
          _audit?: Json | null;
          accountIdentifiers?: Json | null;
          accountNumber?: string | null;
          auditTicketId?: string | null;
          balanceAt?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          delinquentDays?: number;
          depositAmount?: number | null;
          depositInstallments?: number | null;
          didSendAccountNumber?: boolean | null;
          endDate?: string | null;
          hasDeposit?: boolean;
          hasOverdueBalance?: boolean;
          id?: number;
          inactiveReason?: string | null;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isDelinquent?: boolean;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastAuditAttempt?: string | null;
          lastAuditDate?: string | null;
          lastAuditLog?: string | null;
          lastSuccessfulAudit?: string | null;
          lastSync?: string | null;
          lastUtilityPaymentDate?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          nonManagedAccountVerificationDate?: string | null;
          onlineAccountMetadata?: Json | null;
          planeTicketID?: string | null;
          propertyID?: number | null;
          registrationDocumentsStatus?:
            | Database['public']['Enums']['registrationDocumentsStatus']
            | null;
          retries?: number;
          sentAccountNumberDate?: string | null;
          startDate?: string | null;
          status?:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          statusUpdatedAt?: string;
          timestamp?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'gasaccount_defaultbillfeestructure_fkey';
            columns: ['defaultBillFeeStructure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_maintainedFor_fkey';
            columns: ['maintainedFor'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GasAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'Property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasAccount_propertyID_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['propertyID'];
          },
          {
            foreignKeyName: 'GasAccount_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      GasBill: {
        Row: {
          _audit: Json | null;
          approvedBy: string | null;
          approvedDate: string | null;
          createdAt: string | null;
          deliveryCharge: number | null;
          dueDate: string | null;
          endDate: string;
          feeStructure: number | null;
          gasAccountID: number;
          id: number;
          ingestionState: Database['public']['Enums']['ingestion_state'] | null;
          isDepositOnlyBill: boolean;
          isIncomplete: boolean;
          isPaidByUser: boolean | null;
          isPaidUtilityCompany: boolean | null;
          isSendReminder: boolean | null;
          lastPaymentAttemptDate: string | null;
          manual: boolean | null;
          otherCharges: Json | null;
          paidByUser: string | null;
          paidNotificationSent: boolean | null;
          paymentDate: string | null;
          paymentStatus: Database['public']['Enums']['paymentstatus'] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId: string | null;
          supplierCharge: number | null;
          ticketID: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee: number | null;
          updatedAt: string | null;
          utilityCompanyPaidAt: string | null;
          visible: boolean;
        };
        Insert: {
          _audit?: Json | null;
          approvedBy?: string | null;
          approvedDate?: string | null;
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          endDate: string;
          feeStructure?: number | null;
          gasAccountID: number;
          id?: number;
          ingestionState?:
            | Database['public']['Enums']['ingestion_state']
            | null;
          isDepositOnlyBill?: boolean;
          isIncomplete?: boolean;
          isPaidByUser?: boolean | null;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: Json | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee?: number | null;
          updatedAt?: string | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Update: {
          _audit?: Json | null;
          approvedBy?: string | null;
          approvedDate?: string | null;
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          endDate?: string;
          feeStructure?: number | null;
          gasAccountID?: number;
          id?: number;
          ingestionState?:
            | Database['public']['Enums']['ingestion_state']
            | null;
          isDepositOnlyBill?: boolean;
          isIncomplete?: boolean;
          isPaidByUser?: boolean | null;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: Json | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          startDate?: string;
          statementDate?: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue?: number;
          totalUsage?: number;
          transactionFee?: number | null;
          updatedAt?: string | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'GasBill_approvedBy_fkey';
            columns: ['approvedBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_feeStructure_fkey';
            columns: ['feeStructure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'GasBill_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBill_paidByUser_fkey';
            columns: ['paidByUser'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      GasBillCharge: {
        Row: {
          chargeId: string;
          created_at: string;
          gasBillId: number;
          isValid: boolean;
        };
        Insert: {
          chargeId: string;
          created_at?: string;
          gasBillId: number;
          isValid?: boolean;
        };
        Update: {
          chargeId?: string;
          created_at?: string;
          gasBillId?: number;
          isValid?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'GasBillCharge_chargeId_fkey';
            columns: ['chargeId'];
            isOneToOne: false;
            referencedRelation: 'Charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBillCharge_gasBillId_fkey';
            columns: ['gasBillId'];
            isOneToOne: false;
            referencedRelation: 'GasBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GasBillCharge_gasBillId_fkey';
            columns: ['gasBillId'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['gas_bill_id'];
          },
        ];
      };
      gorp_migrations: {
        Row: {
          applied_at: string | null;
          id: string;
        };
        Insert: {
          applied_at?: string | null;
          id: string;
        };
        Update: {
          applied_at?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      GreenButtonMeterReadingMetadata: {
        Row: {
          greenButtonOAuthId: number;
          id: number;
          meterReadingId: string;
          serviceCategoryKind: number | null;
          usagePointId: string;
        };
        Insert: {
          greenButtonOAuthId: number;
          id?: number;
          meterReadingId: string;
          serviceCategoryKind?: number | null;
          usagePointId: string;
        };
        Update: {
          greenButtonOAuthId?: number;
          id?: number;
          meterReadingId?: string;
          serviceCategoryKind?: number | null;
          usagePointId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'GreenButtonMeterReadingMetadata_greenButtonOAuthId_fkey';
            columns: ['greenButtonOAuthId'];
            isOneToOne: false;
            referencedRelation: 'GreenButtonOAuth';
            referencedColumns: ['id'];
          },
        ];
      };
      GreenButtonOAuth: {
        Row: {
          accessToken: string | null;
          accountNumber: string | null;
          cottageUserID: string | null;
          createdAt: string | null;
          electricAccountID: number | null;
          endDate: string | null;
          id: number;
          provider: string | null;
          refreshToken: string | null;
          scopes: string | null;
          startDate: string | null;
          subscriptionID: string;
        };
        Insert: {
          accessToken?: string | null;
          accountNumber?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          electricAccountID?: number | null;
          endDate?: string | null;
          id?: number;
          provider?: string | null;
          refreshToken?: string | null;
          scopes?: string | null;
          startDate?: string | null;
          subscriptionID: string;
        };
        Update: {
          accessToken?: string | null;
          accountNumber?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          electricAccountID?: number | null;
          endDate?: string | null;
          id?: number;
          provider?: string | null;
          refreshToken?: string | null;
          scopes?: string | null;
          startDate?: string | null;
          subscriptionID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'GreenButtonOAuth_provider_fkey';
            columns: ['provider'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      InngestLog: {
        Row: {
          createdAt: string | null;
          eventName: string | null;
          functionName: string | null;
          id: number;
          JSON: Json | null;
          level: string | null;
          message: string | null;
          runID: string | null;
          stack: string | null;
        };
        Insert: {
          createdAt?: string | null;
          eventName?: string | null;
          functionName?: string | null;
          id?: number;
          JSON?: Json | null;
          level?: string | null;
          message?: string | null;
          runID?: string | null;
          stack?: string | null;
        };
        Update: {
          createdAt?: string | null;
          eventName?: string | null;
          functionName?: string | null;
          id?: number;
          JSON?: Json | null;
          level?: string | null;
          message?: string | null;
          runID?: string | null;
          stack?: string | null;
        };
        Relationships: [];
      };
      LightUsers: {
        Row: {
          accountMetadata: Json | null;
          createdAt: string;
          email: string;
          hasMigratedPaymentMethod: boolean | null;
          id: string;
          lightDevID: string;
          moveInIdentifier: string | null;
          moveInPartnerID: string | null;
          updatedAt: string;
        };
        Insert: {
          accountMetadata?: Json | null;
          createdAt?: string;
          email: string;
          hasMigratedPaymentMethod?: boolean | null;
          id: string;
          lightDevID: string;
          moveInIdentifier?: string | null;
          moveInPartnerID?: string | null;
          updatedAt?: string;
        };
        Update: {
          accountMetadata?: Json | null;
          createdAt?: string;
          email?: string;
          hasMigratedPaymentMethod?: boolean | null;
          id?: string;
          lightDevID?: string;
          moveInIdentifier?: string | null;
          moveInPartnerID?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'LightUsers_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'MoveInPartner';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'LightUsers_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewMoveInPartnerReferral';
            referencedColumns: ['id'];
          },
        ];
      };
      LinkAccountJob: {
        Row: {
          connectRequestId: string | null;
          createdAt: string | null;
          externalCompanyId: string;
          id: string;
          message: string | null;
          status: Database['public']['Enums']['enum_LinkAccountJob_status'];
          updatedAt: string | null;
        };
        Insert: {
          connectRequestId?: string | null;
          createdAt?: string | null;
          externalCompanyId: string;
          id?: string;
          message?: string | null;
          status: Database['public']['Enums']['enum_LinkAccountJob_status'];
          updatedAt?: string | null;
        };
        Update: {
          connectRequestId?: string | null;
          createdAt?: string | null;
          externalCompanyId?: string;
          id?: string;
          message?: string | null;
          status?: Database['public']['Enums']['enum_LinkAccountJob_status'];
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'LinkAccountJob_externalCompanyId_fkey';
            columns: ['externalCompanyId'];
            isOneToOne: false;
            referencedRelation: 'ExternalCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_LinkAccountJob_connectRequestId_fkey';
            columns: ['connectRequestId'];
            isOneToOne: false;
            referencedRelation: 'ConnectRequest';
            referencedColumns: ['id'];
          },
        ];
      };
      ManualRemittances: {
        Row: {
          amount: number | null;
          created_at: string;
          electricAccountID: number | null;
          errorMessage: string | null;
          gasAccountID: number | null;
          id: number;
          remarks: string | null;
          remittanceIds: Json | null;
          status: string | null;
          triggeredBy: string | null;
          triggerRunId: string | null;
          userId: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          electricAccountID?: number | null;
          errorMessage?: string | null;
          gasAccountID?: number | null;
          id?: number;
          remarks?: string | null;
          remittanceIds?: Json | null;
          status?: string | null;
          triggeredBy?: string | null;
          triggerRunId?: string | null;
          userId?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          electricAccountID?: number | null;
          errorMessage?: string | null;
          gasAccountID?: number | null;
          id?: number;
          remarks?: string | null;
          remittanceIds?: Json | null;
          status?: string | null;
          triggeredBy?: string | null;
          triggerRunId?: string | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ManualRemittances_electricAccountId_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ManualRemittances_electricAccountId_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ManualRemittances_electricAccountId_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'ManualRemittances_gasAccountId_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ManualRemittances_gasAccountId_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'ManualRemittances_gasAccountId_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'ManualRemittances_triggeredBy_fkey';
            columns: ['triggeredBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ManualRemittances_triggerRunId_fkey';
            columns: ['triggerRunId'];
            isOneToOne: false;
            referencedRelation: 'TriggerRuns';
            referencedColumns: ['id'];
          },
        ];
      };
      MeterReadings: {
        Row: {
          created_at: string | null;
          duration: number | null;
          electricAccountID: number | null;
          gasAccountID: number | null;
          propertyID: number | null;
          reading: number | null;
          readingAt: string;
        };
        Insert: {
          created_at?: string | null;
          duration?: number | null;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          propertyID?: number | null;
          reading?: number | null;
          readingAt: string;
        };
        Update: {
          created_at?: string | null;
          duration?: number | null;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          propertyID?: number | null;
          reading?: number | null;
          readingAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'MeterReadings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MeterReadings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'MeterReadings_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'MeterReadings_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MeterReadings_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'MeterReadings_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
        ];
      };
      MoveInPartner: {
        Row: {
          bccEmail: string | null;
          id: string;
          imgURL: string | null;
          isAddressPrefillEnabled: boolean | null;
          isThemed: boolean;
          isUtilityVerificationEnabled: boolean;
          name: string | null;
          offerLayla: boolean | null;
          shouldSkipSuccessScreen: boolean;
          themeID: string | null;
        };
        Insert: {
          bccEmail?: string | null;
          id: string;
          imgURL?: string | null;
          isAddressPrefillEnabled?: boolean | null;
          isThemed?: boolean;
          isUtilityVerificationEnabled?: boolean;
          name?: string | null;
          offerLayla?: boolean | null;
          shouldSkipSuccessScreen?: boolean;
          themeID?: string | null;
        };
        Update: {
          bccEmail?: string | null;
          id?: string;
          imgURL?: string | null;
          isAddressPrefillEnabled?: boolean | null;
          isThemed?: boolean;
          isUtilityVerificationEnabled?: boolean;
          name?: string | null;
          offerLayla?: boolean | null;
          shouldSkipSuccessScreen?: boolean;
          themeID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      MoveInSessionTracker: {
        Row: {
          createdAt: string | null;
          didAddPaymentInformation: boolean;
          didCompleteUserCreationStep: boolean;
          didDropOff: boolean;
          email: string | null;
          flowCompleted: boolean;
          haveUtilitiesSignedUp: boolean;
          id: string;
          moveInPartnerID: string;
          shortCode: string;
        };
        Insert: {
          createdAt?: string | null;
          didAddPaymentInformation?: boolean;
          didCompleteUserCreationStep?: boolean;
          didDropOff?: boolean;
          email?: string | null;
          flowCompleted?: boolean;
          haveUtilitiesSignedUp?: boolean;
          id?: string;
          moveInPartnerID: string;
          shortCode: string;
        };
        Update: {
          createdAt?: string | null;
          didAddPaymentInformation?: boolean;
          didCompleteUserCreationStep?: boolean;
          didDropOff?: boolean;
          email?: string | null;
          flowCompleted?: boolean;
          haveUtilitiesSignedUp?: boolean;
          id?: string;
          moveInPartnerID?: string;
          shortCode?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInSessionTracker_moveInPartnerID_fkey';
            columns: ['moveInPartnerID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      OCR_Output: {
        Row: {
          account: string;
          accountNumber: string | null;
          created_at: string;
          deliveryChargesElectric: number | null;
          deliveryChargesGas: number | null;
          dueByDate: string | null;
          endDate: string | null;
          file: string;
          id: number;
          output: Json;
          pastDueCharges: number | null;
          provider: string;
          serviceAddress: string | null;
          startDate: string | null;
          statementDate: string | null;
          supplyChargesElectric: number | null;
          supplyChargesGas: number | null;
          totalAmountDue: number | null;
          totalAmountDueElectric: number | null;
          totalAmountDueGas: number | null;
          totalChargesForPeriod: number | null;
          totalUsageKwh: number | null;
          totalUsageTherms: number | null;
          user: string;
        };
        Insert: {
          account: string;
          accountNumber?: string | null;
          created_at?: string;
          deliveryChargesElectric?: number | null;
          deliveryChargesGas?: number | null;
          dueByDate?: string | null;
          endDate?: string | null;
          file: string;
          id?: number;
          output: Json;
          pastDueCharges?: number | null;
          provider: string;
          serviceAddress?: string | null;
          startDate?: string | null;
          statementDate?: string | null;
          supplyChargesElectric?: number | null;
          supplyChargesGas?: number | null;
          totalAmountDue?: number | null;
          totalAmountDueElectric?: number | null;
          totalAmountDueGas?: number | null;
          totalChargesForPeriod?: number | null;
          totalUsageKwh?: number | null;
          totalUsageTherms?: number | null;
          user: string;
        };
        Update: {
          account?: string;
          accountNumber?: string | null;
          created_at?: string;
          deliveryChargesElectric?: number | null;
          deliveryChargesGas?: number | null;
          dueByDate?: string | null;
          endDate?: string | null;
          file?: string;
          id?: number;
          output?: Json;
          pastDueCharges?: number | null;
          provider?: string;
          serviceAddress?: string | null;
          startDate?: string | null;
          statementDate?: string | null;
          supplyChargesElectric?: number | null;
          supplyChargesGas?: number | null;
          totalAmountDue?: number | null;
          totalAmountDueElectric?: number | null;
          totalAmountDueGas?: number | null;
          totalChargesForPeriod?: number | null;
          totalUsageKwh?: number | null;
          totalUsageTherms?: number | null;
          user?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'OCR_Output_provider_fkey';
            columns: ['provider'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'OCR_Output_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      Payment: {
        Row: {
          amount: number;
          contributions: Json;
          created_at: string;
          id: string;
          ledgerTransactionID: string | null;
          paidBy: string;
          paymentMethodID: string;
          paymentStatus: Database['public']['Enums']['paymentstatus'] | null;
          payout_id: string | null;
          stripePaymentID: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          contributions?: Json;
          created_at?: string;
          id?: string;
          ledgerTransactionID?: string | null;
          paidBy: string;
          paymentMethodID: string;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          payout_id?: string | null;
          stripePaymentID?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          contributions?: Json;
          created_at?: string;
          id?: string;
          ledgerTransactionID?: string | null;
          paidBy?: string;
          paymentMethodID?: string;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          payout_id?: string | null;
          stripePaymentID?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_payment_payout';
            columns: ['payout_id'];
            isOneToOne: false;
            referencedRelation: 'Payout';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payment_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      PaymentInstrument: {
        Row: {
          allowOnboard: boolean;
          createdAt: string;
          id: string;
          isActive: boolean;
          provider: string | null;
          reference: string;
          remittancePoolId: string | null;
          type: string;
          updatedAt: string;
          utilityCompanyId: string | null;
        };
        Insert: {
          allowOnboard?: boolean;
          createdAt?: string;
          id?: string;
          isActive?: boolean;
          provider?: string | null;
          reference: string;
          remittancePoolId?: string | null;
          type: string;
          updatedAt?: string;
          utilityCompanyId?: string | null;
        };
        Update: {
          allowOnboard?: boolean;
          createdAt?: string;
          id?: string;
          isActive?: boolean;
          provider?: string | null;
          reference?: string;
          remittancePoolId?: string | null;
          type?: string;
          updatedAt?: string;
          utilityCompanyId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_pi_remittancepool';
            columns: ['remittancePoolId'];
            isOneToOne: false;
            referencedRelation: 'RemittancePool';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_pi_utilitycompany';
            columns: ['utilityCompanyId'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      Payments: {
        Row: {
          amountDue: number;
          chargeId: string;
          created_at: string | null;
          dueBy: string | null;
          feeStructure: number | null;
          id: string;
          paidBy: string;
          paidNotificationSent: boolean;
          paymentStatus: Database['public']['Enums']['paymentstatus'] | null;
          shouldSendReminders: boolean | null;
          stripePaymentID: string | null;
          transactionFee: number;
        };
        Insert: {
          amountDue: number;
          chargeId: string;
          created_at?: string | null;
          dueBy?: string | null;
          feeStructure?: number | null;
          id?: string;
          paidBy: string;
          paidNotificationSent?: boolean;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          shouldSendReminders?: boolean | null;
          stripePaymentID?: string | null;
          transactionFee?: number;
        };
        Update: {
          amountDue?: number;
          chargeId?: string;
          created_at?: string | null;
          dueBy?: string | null;
          feeStructure?: number | null;
          id?: string;
          paidBy?: string;
          paidNotificationSent?: boolean;
          paymentStatus?: Database['public']['Enums']['paymentstatus'] | null;
          shouldSendReminders?: boolean | null;
          stripePaymentID?: string | null;
          transactionFee?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'Payments_chargeId_fkey';
            columns: ['chargeId'];
            isOneToOne: false;
            referencedRelation: 'Charges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_feeStructure_fkey';
            columns: ['feeStructure'];
            isOneToOne: false;
            referencedRelation: 'FeeStructure';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['paidBy'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      Payout: {
        Row: {
          amount: number;
          baasProvider: string | null;
          createdAt: string;
          currency: string;
          destinationAccountId: string;
          id: string;
          ledgerTransactionId: string | null;
          paidAt: string | null;
          provider: string;
          providerPayoutId: string;
          status: string;
        };
        Insert: {
          amount: number;
          baasProvider?: string | null;
          createdAt?: string;
          currency: string;
          destinationAccountId: string;
          id?: string;
          ledgerTransactionId?: string | null;
          paidAt?: string | null;
          provider: string;
          providerPayoutId: string;
          status: string;
        };
        Update: {
          amount?: number;
          baasProvider?: string | null;
          createdAt?: string;
          currency?: string;
          destinationAccountId?: string;
          id?: string;
          ledgerTransactionId?: string | null;
          paidAt?: string | null;
          provider?: string;
          providerPayoutId?: string;
          status?: string;
        };
        Relationships: [];
      };
      Permissions: {
        Row: {
          description: string | null;
          id: number;
          name: string;
        };
        Insert: {
          description?: string | null;
          id?: number;
          name: string;
        };
        Update: {
          description?: string | null;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      PGAdminUsers: {
        Row: {
          acceptedIPs: string[] | null;
          canViewSensitiveInformation: boolean | null;
          createdAt: string;
          id: string;
          intercomID: number | null;
          isActive: boolean | null;
          name: string | null;
        };
        Insert: {
          acceptedIPs?: string[] | null;
          canViewSensitiveInformation?: boolean | null;
          createdAt?: string;
          id?: string;
          intercomID?: number | null;
          isActive?: boolean | null;
          name?: string | null;
        };
        Update: {
          acceptedIPs?: string[] | null;
          canViewSensitiveInformation?: boolean | null;
          createdAt?: string;
          id?: string;
          intercomID?: number | null;
          isActive?: boolean | null;
          name?: string | null;
        };
        Relationships: [];
      };
      PMCompanyFeatureFlags: {
        Row: {
          companyId: string;
          featureFlagId: string;
          grantedAt: string;
          grantedBy: string;
          id: string;
          isEnabled: boolean;
        };
        Insert: {
          companyId: string;
          featureFlagId: string;
          grantedAt?: string;
          grantedBy: string;
          id?: string;
          isEnabled?: boolean;
        };
        Update: {
          companyId?: string;
          featureFlagId?: string;
          grantedAt?: string;
          grantedBy?: string;
          id?: string;
          isEnabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'PMCompanyFeatureFlags_companyId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'BuildingOwnershipCompany';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PMCompanyFeatureFlags_featureFlagId_fkey';
            columns: ['featureFlagId'];
            isOneToOne: false;
            referencedRelation: 'PMFeatureFlags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PMCompanyFeatureFlags_grantedBy_fkey';
            columns: ['grantedBy'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
        ];
      };
      PMFeatureFlags: {
        Row: {
          createdAt: string;
          description: string;
          id: string;
          isActive: boolean;
          isGlobal: boolean;
          name: string;
          updatedAt: string;
        };
        Insert: {
          createdAt?: string;
          description: string;
          id?: string;
          isActive?: boolean;
          isGlobal?: boolean;
          name: string;
          updatedAt?: string;
        };
        Update: {
          createdAt?: string;
          description?: string;
          id?: string;
          isActive?: boolean;
          isGlobal?: boolean;
          name?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      PMUserFeatureFlags: {
        Row: {
          featureFlagId: string;
          grantedAt: string;
          grantedBy: string;
          id: string;
          isEnabled: boolean;
          userId: string;
        };
        Insert: {
          featureFlagId: string;
          grantedAt?: string;
          grantedBy: string;
          id?: string;
          isEnabled?: boolean;
          userId: string;
        };
        Update: {
          featureFlagId?: string;
          grantedAt?: string;
          grantedBy?: string;
          id?: string;
          isEnabled?: boolean;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'PMUserFeatureFlags_featureFlagId_fkey';
            columns: ['featureFlagId'];
            isOneToOne: false;
            referencedRelation: 'PMFeatureFlags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PMUserFeatureFlags_grantedBy_fkey';
            columns: ['grantedBy'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PMUserFeatureFlags_userId_fkey';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'BuildingManagerProfile';
            referencedColumns: ['id'];
          },
        ];
      };
      Property: {
        Row: {
          _audit: Json | null;
          addressID: string | null;
          buildingID: string | null;
          createdAt: string | null;
          dateOfDataSharingConsent: string | null;
          electricAccountID: number | null;
          gasAccountID: number | null;
          id: number;
          isRenewablePaidFor: boolean | null;
          propertyGroupID: string | null;
          type: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber: string | null;
        };
        Insert: {
          _audit?: Json | null;
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          dateOfDataSharingConsent?: string | null;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: number;
          isRenewablePaidFor?: boolean | null;
          propertyGroupID?: string | null;
          type?: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber?: string | null;
        };
        Update: {
          _audit?: Json | null;
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          dateOfDataSharingConsent?: string | null;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: number;
          isRenewablePaidFor?: boolean | null;
          propertyGroupID?: string | null;
          type?: Database['public']['Enums']['enum_Unit_residenceType'] | null;
          unitNumber?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Property_addressID_fkey';
            columns: ['addressID'];
            isOneToOne: false;
            referencedRelation: 'Address';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Property_buildingID_fkey';
            columns: ['buildingID'];
            isOneToOne: false;
            referencedRelation: 'Building';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Property_propertyGroupID_fkey';
            columns: ['propertyGroupID'];
            isOneToOne: true;
            referencedRelation: 'PropertyGroup';
            referencedColumns: ['id'];
          },
        ];
      };
      PropertyGroup: {
        Row: {
          id: string;
          ownerID: string;
        };
        Insert: {
          id?: string;
          ownerID: string;
        };
        Update: {
          id?: string;
          ownerID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'PropertyGroup_ownerID_fkey';
            columns: ['ownerID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      PropertyGroupResident: {
        Row: {
          cottageUserID: string | null;
          email: string;
          id: string;
          inviteCode: string | null;
          invited_at: string | null;
          propertyGroupID: string | null;
          status:
            | Database['public']['Enums']['enum_PropertyGroupResident_inviteStatus']
            | null;
        };
        Insert: {
          cottageUserID?: string | null;
          email: string;
          id?: string;
          inviteCode?: string | null;
          invited_at?: string | null;
          propertyGroupID?: string | null;
          status?:
            | Database['public']['Enums']['enum_PropertyGroupResident_inviteStatus']
            | null;
        };
        Update: {
          cottageUserID?: string | null;
          email?: string;
          id?: string;
          inviteCode?: string | null;
          invited_at?: string | null;
          propertyGroupID?: string | null;
          status?:
            | Database['public']['Enums']['enum_PropertyGroupResident_inviteStatus']
            | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_cottageUserID';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'fk_propertyGroupID';
            columns: ['propertyGroupID'];
            isOneToOne: false;
            referencedRelation: 'PropertyGroup';
            referencedColumns: ['id'];
          },
        ];
      };
      ProviderStatus: {
        Row: {
          availability: number;
          created_at: string;
          failCount: number;
          failList: string[];
          id: number;
          jobName: string;
          permanentFail: number;
          provider: string;
          providerStatus: Database['public']['Enums']['providerStatus'];
          retriable: boolean;
          targets: string[];
          total: number;
        };
        Insert: {
          availability?: number;
          created_at?: string;
          failCount: number;
          failList: string[];
          id?: number;
          jobName: string;
          permanentFail?: number;
          provider: string;
          providerStatus?: Database['public']['Enums']['providerStatus'];
          retriable?: boolean;
          targets: string[];
          total: number;
        };
        Update: {
          availability?: number;
          created_at?: string;
          failCount?: number;
          failList?: string[];
          id?: number;
          jobName?: string;
          permanentFail?: number;
          provider?: string;
          providerStatus?: Database['public']['Enums']['providerStatus'];
          retriable?: boolean;
          targets?: string[];
          total?: number;
        };
        Relationships: [];
      };
      Ratings: {
        Row: {
          cottageUserID: string | null;
          createdAt: string;
          flow: string | null;
          flowVersion: string | null;
          id: number;
          rating: number | null;
        };
        Insert: {
          cottageUserID?: string | null;
          createdAt?: string;
          flow?: string | null;
          flowVersion?: string | null;
          id?: number;
          rating?: number | null;
        };
        Update: {
          cottageUserID?: string | null;
          createdAt?: string;
          flow?: string | null;
          flowVersion?: string | null;
          id?: number;
          rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Ratings_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ReferralPartner: {
        Row: {
          code: string | null;
          id: string;
          imgURL: string | null;
          name: string | null;
        };
        Insert: {
          code?: string | null;
          id: string;
          imgURL?: string | null;
          name?: string | null;
        };
        Update: {
          code?: string | null;
          id?: string;
          imgURL?: string | null;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ReferralPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      Referrals: {
        Row: {
          createdAt: string | null;
          id: string;
          referralStatus: Database['public']['Enums']['referral_status'];
          referred: string | null;
          referredBy: string;
        };
        Insert: {
          createdAt?: string | null;
          id?: string;
          referralStatus?: Database['public']['Enums']['referral_status'];
          referred?: string | null;
          referredBy: string;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          referralStatus?: Database['public']['Enums']['referral_status'];
          referred?: string | null;
          referredBy?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      RegistrationJob: {
        Row: {
          createdAt: string;
          endTime: string | null;
          forCottageUserID: string;
          id: string;
          lastStep: string | null;
          startTime: string;
          status: Database['public']['Enums']['enum_RegistrationJob_status'];
          statusMessage: string | null;
          updatedAt: string | null;
          utilityCompanyID: string;
        };
        Insert: {
          createdAt?: string;
          endTime?: string | null;
          forCottageUserID?: string;
          id?: string;
          lastStep?: string | null;
          startTime?: string;
          status?: Database['public']['Enums']['enum_RegistrationJob_status'];
          statusMessage?: string | null;
          updatedAt?: string | null;
          utilityCompanyID: string;
        };
        Update: {
          createdAt?: string;
          endTime?: string | null;
          forCottageUserID?: string;
          id?: string;
          lastStep?: string | null;
          startTime?: string;
          status?: Database['public']['Enums']['enum_RegistrationJob_status'];
          statusMessage?: string | null;
          updatedAt?: string | null;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_RegistrationJob_forCottageUserID_fkey';
            columns: ['forCottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'RegistrationJob_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      RemittanceExecution: {
        Row: {
          actualRemitted: number | null;
          chargeAccountID: string;
          confirmationNumber: string | null;
          createdAt: string;
          failedExplanation: string | null;
          id: string;
          remittedAmountAttempt: number;
          status: Database['public']['Enums']['remittance_execution_status'];
          successScreenshot: string | null;
        };
        Insert: {
          actualRemitted?: number | null;
          chargeAccountID: string;
          confirmationNumber?: string | null;
          createdAt?: string;
          failedExplanation?: string | null;
          id?: string;
          remittedAmountAttempt: number;
          status: Database['public']['Enums']['remittance_execution_status'];
          successScreenshot?: string | null;
        };
        Update: {
          actualRemitted?: number | null;
          chargeAccountID?: string;
          confirmationNumber?: string | null;
          createdAt?: string;
          failedExplanation?: string | null;
          id?: string;
          remittedAmountAttempt?: number;
          status?: Database['public']['Enums']['remittance_execution_status'];
          successScreenshot?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'remittanceexecution_chargeaccount_fk';
            columns: ['chargeAccountID'];
            isOneToOne: false;
            referencedRelation: 'ChargeAccount';
            referencedColumns: ['id'];
          },
        ];
      };
      RemittanceExecutionItem: {
        Row: {
          createdAt: string;
          id: string;
          remittanceExecutionID: string;
          utilityRemittanceID: string;
        };
        Insert: {
          createdAt?: string;
          id?: string;
          remittanceExecutionID: string;
          utilityRemittanceID: string;
        };
        Update: {
          createdAt?: string;
          id?: string;
          remittanceExecutionID?: string;
          utilityRemittanceID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'remittanceexecutionitem_execution_fk';
            columns: ['remittanceExecutionID'];
            isOneToOne: false;
            referencedRelation: 'RemittanceExecution';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'remittanceexecutionitem_remittance_fk';
            columns: ['utilityRemittanceID'];
            isOneToOne: false;
            referencedRelation: 'UtilityRemittance';
            referencedColumns: ['id'];
          },
        ];
      };
      RemittancePool: {
        Row: {
          baasAccountId: string;
          baasProvider: string;
          createdAt: string;
          id: string;
          ledgerAccountIdentifier: string;
          status: string;
          updatedAt: string;
        };
        Insert: {
          baasAccountId: string;
          baasProvider: string;
          createdAt?: string;
          id: string;
          ledgerAccountIdentifier: string;
          status?: string;
          updatedAt?: string;
        };
        Update: {
          baasAccountId?: string;
          baasProvider?: string;
          createdAt?: string;
          id?: string;
          ledgerAccountIdentifier?: string;
          status?: string;
          updatedAt?: string;
        };
        Relationships: [];
      };
      RenewableSubscriptionPayments: {
        Row: {
          amount: number | null;
          id: number;
          isProcessed: boolean | null;
          payerID: string | null;
          paymentDate: string | null;
          renewableSubscription: number | null;
          status: Database['public']['Enums']['stripepaymentstatus'] | null;
          stripePaymentID: string | null;
        };
        Insert: {
          amount?: number | null;
          id?: number;
          isProcessed?: boolean | null;
          payerID?: string | null;
          paymentDate?: string | null;
          renewableSubscription?: number | null;
          status?: Database['public']['Enums']['stripepaymentstatus'] | null;
          stripePaymentID?: string | null;
        };
        Update: {
          amount?: number | null;
          id?: number;
          isProcessed?: boolean | null;
          payerID?: string | null;
          paymentDate?: string | null;
          renewableSubscription?: number | null;
          status?: Database['public']['Enums']['stripepaymentstatus'] | null;
          stripePaymentID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'RenewableSubscriptionPayments_renewableSubscription_fkey';
            columns: ['renewableSubscription'];
            isOneToOne: false;
            referencedRelation: 'RenewableSubscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      RenewableSubscriptionPlan: {
        Row: {
          costPerMonth: number | null;
          id: number;
        };
        Insert: {
          costPerMonth?: number | null;
          id?: number;
        };
        Update: {
          costPerMonth?: number | null;
          id?: number;
        };
        Relationships: [];
      };
      RenewableSubscriptions: {
        Row: {
          cottageUserId: string | null;
          createdAt: string | null;
          endDate: string | null;
          id: number;
          propertyID: number | null;
          renewableSubscriptionPlan: number | null;
          startDate: string | null;
        };
        Insert: {
          cottageUserId?: string | null;
          createdAt?: string | null;
          endDate?: string | null;
          id?: number;
          propertyID?: number | null;
          renewableSubscriptionPlan?: number | null;
          startDate?: string | null;
        };
        Update: {
          cottageUserId?: string | null;
          createdAt?: string | null;
          endDate?: string | null;
          id?: number;
          propertyID?: number | null;
          renewableSubscriptionPlan?: number | null;
          startDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_cottageUserId_fkey';
            columns: ['cottageUserId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_renewableSubscriptionPlan_fkey';
            columns: ['renewableSubscriptionPlan'];
            isOneToOne: false;
            referencedRelation: 'RenewableSubscriptionPlan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_unit_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'Property';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'RenewableSubscriptions_unit_fkey';
            columns: ['propertyID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['propertyID'];
          },
        ];
      };
      Resident: {
        Row: {
          _audit: Json | null;
          cottageUserID: string | null;
          createdAt: string | null;
          firstName: string | null;
          hasCompleteDetails: boolean | null;
          id: number;
          isRegistrationComplete: boolean | null;
          lastName: string | null;
          phone: string | null;
          startServiceDate: string | null;
        };
        Insert: {
          _audit?: Json | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          firstName?: string | null;
          hasCompleteDetails?: boolean | null;
          id?: number;
          isRegistrationComplete?: boolean | null;
          lastName?: string | null;
          phone?: string | null;
          startServiceDate?: string | null;
        };
        Update: {
          _audit?: Json | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          firstName?: string | null;
          hasCompleteDetails?: boolean | null;
          id?: number;
          isRegistrationComplete?: boolean | null;
          lastName?: string | null;
          phone?: string | null;
          startServiceDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Resident_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ResidentIdentity: {
        Row: {
          cottageUserID: string | null;
          createdAt: string | null;
          dateOfBirth: string | null;
          id: number;
          identificationCipherIv: string | null;
          identificationNumber: string | null;
          identificationOther: string | null;
          identificationType: string | null;
          last4identificationNumber: string | null;
          last4identificationNumberIv: string | null;
          priorAddressID: string | null;
        };
        Insert: {
          cottageUserID?: string | null;
          createdAt?: string | null;
          dateOfBirth?: string | null;
          id?: number;
          identificationCipherIv?: string | null;
          identificationNumber?: string | null;
          identificationOther?: string | null;
          identificationType?: string | null;
          last4identificationNumber?: string | null;
          last4identificationNumberIv?: string | null;
          priorAddressID?: string | null;
        };
        Update: {
          cottageUserID?: string | null;
          createdAt?: string | null;
          dateOfBirth?: string | null;
          id?: number;
          identificationCipherIv?: string | null;
          identificationNumber?: string | null;
          identificationOther?: string | null;
          identificationType?: string | null;
          last4identificationNumber?: string | null;
          last4identificationNumberIv?: string | null;
          priorAddressID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ResidentIdentity_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: true;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ResidentIdentity_priorAddressID_fkey';
            columns: ['priorAddressID'];
            isOneToOne: false;
            referencedRelation: 'Address';
            referencedColumns: ['id'];
          },
        ];
      };
      ResidentPermissions: {
        Row: {
          permissionID: number;
          residentID: string;
        };
        Insert: {
          permissionID: number;
          residentID: string;
        };
        Update: {
          permissionID?: number;
          residentID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ResidentPermissions_permissionID_fkey';
            columns: ['permissionID'];
            isOneToOne: false;
            referencedRelation: 'Permissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ResidentPermissions_residentID_fkey';
            columns: ['residentID'];
            isOneToOne: false;
            referencedRelation: 'PropertyGroupResident';
            referencedColumns: ['id'];
          },
        ];
      };
      ResourceMix: {
        Row: {
          BeginDate: string;
          Coal: number | null;
          DualFuel: number | null;
          electricZone: string;
          Hydro: number | null;
          LandfillGas: number | null;
          MultipleFuels: number | null;
          NaturalGas: number | null;
          NetImports: number | null;
          Nuclear: number | null;
          Oil: number | null;
          Other: number | null;
          OtherFossilFuels: number | null;
          OtherRenewables: number | null;
          Refuse: number | null;
          Renewables: number | null;
          Solar: number | null;
          Storage: number | null;
          Wind: number | null;
          Wood: number | null;
        };
        Insert: {
          BeginDate: string;
          Coal?: number | null;
          DualFuel?: number | null;
          electricZone: string;
          Hydro?: number | null;
          LandfillGas?: number | null;
          MultipleFuels?: number | null;
          NaturalGas?: number | null;
          NetImports?: number | null;
          Nuclear?: number | null;
          Oil?: number | null;
          Other?: number | null;
          OtherFossilFuels?: number | null;
          OtherRenewables?: number | null;
          Refuse?: number | null;
          Renewables?: number | null;
          Solar?: number | null;
          Storage?: number | null;
          Wind?: number | null;
          Wood?: number | null;
        };
        Update: {
          BeginDate?: string;
          Coal?: number | null;
          DualFuel?: number | null;
          electricZone?: string;
          Hydro?: number | null;
          LandfillGas?: number | null;
          MultipleFuels?: number | null;
          NaturalGas?: number | null;
          NetImports?: number | null;
          Nuclear?: number | null;
          Oil?: number | null;
          Other?: number | null;
          OtherFossilFuels?: number | null;
          OtherRenewables?: number | null;
          Refuse?: number | null;
          Renewables?: number | null;
          Solar?: number | null;
          Storage?: number | null;
          Wind?: number | null;
          Wood?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_ResourceMix_electricZone_fkey';
            columns: ['electricZone'];
            isOneToOne: false;
            referencedRelation: 'ElectricZone';
            referencedColumns: ['id'];
          },
        ];
      };
      SequelizeMeta: {
        Row: {
          name: string;
        };
        Insert: {
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      ServiceGroup: {
        Row: {
          activeSupplyPlanID: number | null;
          communitySolarAvailability:
            | Database['public']['Enums']['serviceGroupCommunitySolarAvailability']
            | null;
          id: string;
          isActiveReferralProgram: boolean | null;
          referralProgramAmount: number | null;
          renewableSubscriptionPlanID: number | null;
          status: Database['public']['Enums']['serviceGroupStatus'] | null;
          utilityCompanyID: string | null;
        };
        Insert: {
          activeSupplyPlanID?: number | null;
          communitySolarAvailability?:
            | Database['public']['Enums']['serviceGroupCommunitySolarAvailability']
            | null;
          id: string;
          isActiveReferralProgram?: boolean | null;
          referralProgramAmount?: number | null;
          renewableSubscriptionPlanID?: number | null;
          status?: Database['public']['Enums']['serviceGroupStatus'] | null;
          utilityCompanyID?: string | null;
        };
        Update: {
          activeSupplyPlanID?: number | null;
          communitySolarAvailability?:
            | Database['public']['Enums']['serviceGroupCommunitySolarAvailability']
            | null;
          id?: string;
          isActiveReferralProgram?: boolean | null;
          referralProgramAmount?: number | null;
          renewableSubscriptionPlanID?: number | null;
          status?: Database['public']['Enums']['serviceGroupStatus'] | null;
          utilityCompanyID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ServiceGroup_activeSupplyPlanID_fkey';
            columns: ['activeSupplyPlanID'];
            isOneToOne: false;
            referencedRelation: 'ElectricSupplyPlan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ServiceGroup_renewableSubscriptionPlanID_fkey';
            columns: ['renewableSubscriptionPlanID'];
            isOneToOne: false;
            referencedRelation: 'RenewableSubscriptionPlan';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ServiceGroup_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      ServiceZip: {
        Row: {
          id: number;
          isPrimaryUtility: boolean | null;
          state: string | null;
          utilityCompanyID: string | null;
          zip: string | null;
        };
        Insert: {
          id?: number;
          isPrimaryUtility?: boolean | null;
          state?: string | null;
          utilityCompanyID?: string | null;
          zip?: string | null;
        };
        Update: {
          id?: number;
          isPrimaryUtility?: boolean | null;
          state?: string | null;
          utilityCompanyID?: string | null;
          zip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ServiceZip_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      StartServiceRuns: {
        Row: {
          createdAt: string;
          electricAccountID: number | null;
          gasAccountID: number | null;
          id: number;
          triggerRunId: string;
        };
        Insert: {
          createdAt?: string;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: number;
          triggerRunId: string;
        };
        Update: {
          createdAt?: string;
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: number;
          triggerRunId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'StartServiceRuns_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'StartServiceRuns_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'StartServiceRuns_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'StartServiceRuns_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'StartServiceRuns_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'StartServiceRuns_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
        ];
      };
      StripeWebhookEvents: {
        Row: {
          createdAt: string | null;
          id: string;
          lastUpdated: string | null;
          stripeApiVersion: string;
          stripeCreatedAt: string;
          stripeEventID: string;
          stripeEventType: string;
          stripeJson: Json;
          stripeLiveMode: boolean;
          stripeRequestID: string | null;
          stripeRequestIdempotencyKey: string | null;
        };
        Insert: {
          createdAt?: string | null;
          id?: string;
          lastUpdated?: string | null;
          stripeApiVersion: string;
          stripeCreatedAt: string;
          stripeEventID: string;
          stripeEventType: string;
          stripeJson: Json;
          stripeLiveMode: boolean;
          stripeRequestID?: string | null;
          stripeRequestIdempotencyKey?: string | null;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          lastUpdated?: string | null;
          stripeApiVersion?: string;
          stripeCreatedAt?: string;
          stripeEventID?: string;
          stripeEventType?: string;
          stripeJson?: Json;
          stripeLiveMode?: boolean;
          stripeRequestID?: string | null;
          stripeRequestIdempotencyKey?: string | null;
        };
        Relationships: [];
      };
      Supplier: {
        Row: {
          created_at: string;
          id: number;
          name: string | null;
          powerKioskID: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string | null;
          powerKioskID?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string | null;
          powerKioskID?: string | null;
        };
        Relationships: [];
      };
      TempAuditInfo: {
        Row: {
          auditData: Json | null;
          created_at: string | null;
          id: number;
          recordId: string | null;
          tableOid: unknown | null;
          txid: number | null;
        };
        Insert: {
          auditData?: Json | null;
          created_at?: string | null;
          id?: number;
          recordId?: string | null;
          tableOid?: unknown | null;
          txid?: number | null;
        };
        Update: {
          auditData?: Json | null;
          created_at?: string | null;
          id?: number;
          recordId?: string | null;
          tableOid?: unknown | null;
          txid?: number | null;
        };
        Relationships: [];
      };
      TermsAndConditions: {
        Row: {
          emailContent: string | null;
          id: string;
          versionDate: string | null;
          websiteContent: string | null;
        };
        Insert: {
          emailContent?: string | null;
          id?: string;
          versionDate?: string | null;
          websiteContent?: string | null;
        };
        Update: {
          emailContent?: string | null;
          id?: string;
          versionDate?: string | null;
          websiteContent?: string | null;
        };
        Relationships: [];
      };
      TransactionalEmails: {
        Row: {
          bcc: string[] | null;
          cc: string[] | null;
          cottageUserID: string | null;
          createdAt: string;
          from: string;
          html: string | null;
          id: string;
          lastEvent: string | null;
          replyTo: string[] | null;
          subject: string;
          text: string | null;
          to: string[] | null;
        };
        Insert: {
          bcc?: string[] | null;
          cc?: string[] | null;
          cottageUserID?: string | null;
          createdAt?: string;
          from: string;
          html?: string | null;
          id?: string;
          lastEvent?: string | null;
          replyTo?: string[] | null;
          subject: string;
          text?: string | null;
          to?: string[] | null;
        };
        Update: {
          bcc?: string[] | null;
          cc?: string[] | null;
          cottageUserID?: string | null;
          createdAt?: string;
          from?: string;
          html?: string | null;
          id?: string;
          lastEvent?: string | null;
          replyTo?: string[] | null;
          subject?: string;
          text?: string | null;
          to?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'TransactionalEmails_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      TransactionMetadata: {
        Row: {
          createdAt: string;
          dueDate: string | null;
          electricBillID: number | null;
          gasBillID: number | null;
          id: string;
          ledgerTransactionID: string;
        };
        Insert: {
          createdAt?: string;
          dueDate?: string | null;
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          ledgerTransactionID: string;
        };
        Update: {
          createdAt?: string;
          dueDate?: string | null;
          electricBillID?: number | null;
          gasBillID?: number | null;
          id?: string;
          ledgerTransactionID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'TransactionMetadata_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'TransactionMetadata_electricBillID_fkey';
            columns: ['electricBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['electric_bill_id'];
          },
          {
            foreignKeyName: 'TransactionMetadata_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'GasBill';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'TransactionMetadata_gasBillID_fkey';
            columns: ['gasBillID'];
            isOneToOne: false;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['gas_bill_id'];
          },
        ];
      };
      TriggerRuns: {
        Row: {
          context: Json | null;
          created_at: string;
          id: string;
          jobType: Database['public']['Enums']['job_types_enum'] | null;
          sessionDuration: number | null;
          sessionEnd: string | null;
          sessionStart: string | null;
          status: string | null;
          steelSessionId: string | null;
          triggeredBy: string | null;
          triggerId: string | null;
          userId: string | null;
        };
        Insert: {
          context?: Json | null;
          created_at?: string;
          id?: string;
          jobType?: Database['public']['Enums']['job_types_enum'] | null;
          sessionDuration?: number | null;
          sessionEnd?: string | null;
          sessionStart?: string | null;
          status?: string | null;
          steelSessionId?: string | null;
          triggeredBy?: string | null;
          triggerId?: string | null;
          userId?: string | null;
        };
        Update: {
          context?: Json | null;
          created_at?: string;
          id?: string;
          jobType?: Database['public']['Enums']['job_types_enum'] | null;
          sessionDuration?: number | null;
          sessionEnd?: string | null;
          sessionStart?: string | null;
          status?: string | null;
          steelSessionId?: string | null;
          triggeredBy?: string | null;
          triggerId?: string | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'TriggerRuns_triggered_by_fkey';
            columns: ['triggeredBy'];
            isOneToOne: false;
            referencedRelation: 'PGAdminUsers';
            referencedColumns: ['id'];
          },
        ];
      };
      UserTermsAcceptance: {
        Row: {
          accepted_at: string;
          terms_id: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string;
          terms_id: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string;
          terms_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_terms';
            columns: ['terms_id'];
            isOneToOne: false;
            referencedRelation: 'TermsAndConditions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      UtilityAccountPaymentState: {
        Row: {
          created_at: string;
          dueAmount: number | null;
          dueInDB: number | null;
          electricAccount: number | null;
          errors: string[] | null;
          gasAccount: number | null;
          id: string;
          info: string[] | null;
          unpaidElectricBills: number[] | null;
          unpaidGasBills: number[] | null;
          updated_at: string | null;
          warnings: string[] | null;
        };
        Insert: {
          created_at?: string;
          dueAmount?: number | null;
          dueInDB?: number | null;
          electricAccount?: number | null;
          errors?: string[] | null;
          gasAccount?: number | null;
          id?: string;
          info?: string[] | null;
          unpaidElectricBills?: number[] | null;
          unpaidGasBills?: number[] | null;
          updated_at?: string | null;
          warnings?: string[] | null;
        };
        Update: {
          created_at?: string;
          dueAmount?: number | null;
          dueInDB?: number | null;
          electricAccount?: number | null;
          errors?: string[] | null;
          gasAccount?: number | null;
          id?: string;
          info?: string[] | null;
          unpaidElectricBills?: number[] | null;
          unpaidGasBills?: number[] | null;
          updated_at?: string | null;
          warnings?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityAccountPaymentState_electricAccount_fkey';
            columns: ['electricAccount'];
            isOneToOne: true;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityAccountPaymentState_electricAccount_fkey';
            columns: ['electricAccount'];
            isOneToOne: true;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'UtilityAccountPaymentState_electricAccount_fkey';
            columns: ['electricAccount'];
            isOneToOne: true;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'UtilityAccountPaymentState_gasAccount_fkey';
            columns: ['gasAccount'];
            isOneToOne: true;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityAccountPaymentState_gasAccount_fkey';
            columns: ['gasAccount'];
            isOneToOne: true;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'UtilityAccountPaymentState_gasAccount_fkey';
            columns: ['gasAccount'];
            isOneToOne: true;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
        ];
      };
      UtilityAPIReferrals: {
        Row: {
          id: number;
          manuallyProcessed: boolean | null;
          needsManualChecking: boolean;
          provider: string | null;
          referral: string | null;
          userId: string | null;
        };
        Insert: {
          id?: number;
          manuallyProcessed?: boolean | null;
          needsManualChecking?: boolean;
          provider?: string | null;
          referral?: string | null;
          userId?: string | null;
        };
        Update: {
          id?: number;
          manuallyProcessed?: boolean | null;
          needsManualChecking?: boolean;
          provider?: string | null;
          referral?: string | null;
          userId?: string | null;
        };
        Relationships: [];
      };
      UtilityAuditAccountError: {
        Row: {
          electricAccountID: number | null;
          gasAccountID: number | null;
          id: string;
          issueID: string;
          parentErrorID: string;
        };
        Insert: {
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: string;
          issueID: string;
          parentErrorID: string;
        };
        Update: {
          electricAccountID?: number | null;
          gasAccountID?: number | null;
          id?: string;
          issueID?: string;
          parentErrorID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'utilityauditaccounterror_electricaccountid_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_electricaccountid_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_electricaccountid_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_gasaccountid_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_gasaccountid_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_gasaccountid_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'utilityauditaccounterror_parenterrorid_fkey';
            columns: ['parentErrorID'];
            isOneToOne: false;
            referencedRelation: 'UtilityAuditParentError';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityAuditParentError: {
        Row: {
          errorType: string;
          id: string;
          moduleID: string;
          parentErrorTicketID: string;
          projectID: string;
          utilityCompanyID: string;
        };
        Insert: {
          errorType: string;
          id?: string;
          moduleID: string;
          parentErrorTicketID: string;
          projectID: string;
          utilityCompanyID: string;
        };
        Update: {
          errorType?: string;
          id?: string;
          moduleID?: string;
          parentErrorTicketID?: string;
          projectID?: string;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityAuditParentError_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityAutomationLog: {
        Row: {
          attempt_count: number | null;
          created_at: string | null;
          description: string | null;
          id: number;
          operation: string;
          payload: string | null;
          provider: string;
          status: string;
          updated_at: string | null;
          user: string | null;
        };
        Insert: {
          attempt_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          operation: string;
          payload?: string | null;
          provider: string;
          status: string;
          updated_at?: string | null;
          user?: string | null;
        };
        Update: {
          attempt_count?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          operation?: string;
          payload?: string | null;
          provider?: string;
          status?: string;
          updated_at?: string | null;
          user?: string | null;
        };
        Relationships: [];
      };
      UtilityCompany: {
        Row: {
          addsDepositToFirstBill: boolean | null;
          checkOutageStatusURL: string | null;
          createdAt: string | null;
          description: string | null;
          electricZoneID: string | null;
          id: string;
          identityVerificationTypes:
            | Database['public']['Enums']['identityVerificationType'][]
            | null;
          instrumentAssignmentDirection:
            | Database['public']['Enums']['payment_instrument_assignment_direction']
            | null;
          isActiveReferralProgram: boolean | null;
          isAutopayRequired: boolean | null;
          isBillingRequired: boolean;
          isBillUploadAvailable: boolean;
          isDefaultBillingEnabled: boolean | null;
          isDocUploadRequired: boolean;
          isHandleBilling: boolean | null;
          isHandleMoveIns: boolean | null;
          isPriorAddressRequired: boolean;
          isReviewBilling: boolean;
          isSSNRequired: boolean | null;
          isSSOEnabled: boolean;
          lastAssignedInstrumentId: string | null;
          logoURL: string | null;
          maintenanceAt: string | null;
          name: string | null;
          needsAdditionalDocuments: boolean;
          numberOfCustomersHelped: number | null;
          offerRenewableEnergy: boolean;
          outageMapURL: string | null;
          phone: string | null;
          preferPhoneSignUp: boolean;
          referralProgramAmount: number | null;
          registrationURL: string | null;
          reportOutageURL: string | null;
          shouldShowDisplayContent: boolean;
          signupReady: boolean | null;
          status: Database['public']['Enums']['utilityCompanyStatus'] | null;
          utilitiesHandled:
            | Database['public']['Enums']['UtilityCompany_utilitiesHandled'][]
            | null;
          utilityCode: string | null;
          utilityIntegrationType:
            | Database['public']['Enums']['utilityIntegrationType']
            | null;
          website: string | null;
        };
        Insert: {
          addsDepositToFirstBill?: boolean | null;
          checkOutageStatusURL?: string | null;
          createdAt?: string | null;
          description?: string | null;
          electricZoneID?: string | null;
          id: string;
          identityVerificationTypes?:
            | Database['public']['Enums']['identityVerificationType'][]
            | null;
          instrumentAssignmentDirection?:
            | Database['public']['Enums']['payment_instrument_assignment_direction']
            | null;
          isActiveReferralProgram?: boolean | null;
          isAutopayRequired?: boolean | null;
          isBillingRequired?: boolean;
          isBillUploadAvailable?: boolean;
          isDefaultBillingEnabled?: boolean | null;
          isDocUploadRequired?: boolean;
          isHandleBilling?: boolean | null;
          isHandleMoveIns?: boolean | null;
          isPriorAddressRequired?: boolean;
          isReviewBilling?: boolean;
          isSSNRequired?: boolean | null;
          isSSOEnabled?: boolean;
          lastAssignedInstrumentId?: string | null;
          logoURL?: string | null;
          maintenanceAt?: string | null;
          name?: string | null;
          needsAdditionalDocuments?: boolean;
          numberOfCustomersHelped?: number | null;
          offerRenewableEnergy?: boolean;
          outageMapURL?: string | null;
          phone?: string | null;
          preferPhoneSignUp?: boolean;
          referralProgramAmount?: number | null;
          registrationURL?: string | null;
          reportOutageURL?: string | null;
          shouldShowDisplayContent?: boolean;
          signupReady?: boolean | null;
          status?: Database['public']['Enums']['utilityCompanyStatus'] | null;
          utilitiesHandled?:
            | Database['public']['Enums']['UtilityCompany_utilitiesHandled'][]
            | null;
          utilityCode?: string | null;
          utilityIntegrationType?:
            | Database['public']['Enums']['utilityIntegrationType']
            | null;
          website?: string | null;
        };
        Update: {
          addsDepositToFirstBill?: boolean | null;
          checkOutageStatusURL?: string | null;
          createdAt?: string | null;
          description?: string | null;
          electricZoneID?: string | null;
          id?: string;
          identityVerificationTypes?:
            | Database['public']['Enums']['identityVerificationType'][]
            | null;
          instrumentAssignmentDirection?:
            | Database['public']['Enums']['payment_instrument_assignment_direction']
            | null;
          isActiveReferralProgram?: boolean | null;
          isAutopayRequired?: boolean | null;
          isBillingRequired?: boolean;
          isBillUploadAvailable?: boolean;
          isDefaultBillingEnabled?: boolean | null;
          isDocUploadRequired?: boolean;
          isHandleBilling?: boolean | null;
          isHandleMoveIns?: boolean | null;
          isPriorAddressRequired?: boolean;
          isReviewBilling?: boolean;
          isSSNRequired?: boolean | null;
          isSSOEnabled?: boolean;
          lastAssignedInstrumentId?: string | null;
          logoURL?: string | null;
          maintenanceAt?: string | null;
          name?: string | null;
          needsAdditionalDocuments?: boolean;
          numberOfCustomersHelped?: number | null;
          offerRenewableEnergy?: boolean;
          outageMapURL?: string | null;
          phone?: string | null;
          preferPhoneSignUp?: boolean;
          referralProgramAmount?: number | null;
          registrationURL?: string | null;
          reportOutageURL?: string | null;
          shouldShowDisplayContent?: boolean;
          signupReady?: boolean | null;
          status?: Database['public']['Enums']['utilityCompanyStatus'] | null;
          utilitiesHandled?:
            | Database['public']['Enums']['UtilityCompany_utilitiesHandled'][]
            | null;
          utilityCode?: string | null;
          utilityIntegrationType?:
            | Database['public']['Enums']['utilityIntegrationType']
            | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricCompany_electricZoneID_fkey';
            columns: ['electricZoneID'];
            isOneToOne: false;
            referencedRelation: 'ElectricZone';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityCompany_lastAssignedInstrumentId_fkey';
            columns: ['lastAssignedInstrumentId'];
            isOneToOne: false;
            referencedRelation: 'PaymentInstrument';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityCompany_ServiceAccounts: {
        Row: {
          active: boolean | null;
          created_at: string;
          serviceAccount: string;
          utilityCompanyID: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          serviceAccount: string;
          utilityCompanyID: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          serviceAccount?: string;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_serviceAccount_fkey';
            columns: ['serviceAccount'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityCompany_ServiceAccounts_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityCompanyAuditSettings: {
        Row: {
          active: boolean | null;
          createdAt: string;
          disableIncognito: boolean | null;
          id: string;
          lastAuditThreshold: number;
          maxConcurrency: number;
          proxyProvider:
            | Database['public']['Enums']['proxy_providers_enum']
            | null;
          useFirefox: boolean | null;
          webSocket: Database['public']['Enums']['websocket_enum'] | null;
          withProxy: boolean;
        };
        Insert: {
          active?: boolean | null;
          createdAt?: string;
          disableIncognito?: boolean | null;
          id: string;
          lastAuditThreshold?: number;
          maxConcurrency?: number;
          proxyProvider?:
            | Database['public']['Enums']['proxy_providers_enum']
            | null;
          useFirefox?: boolean | null;
          webSocket?: Database['public']['Enums']['websocket_enum'] | null;
          withProxy?: boolean;
        };
        Update: {
          active?: boolean | null;
          createdAt?: string;
          disableIncognito?: boolean | null;
          id?: string;
          lastAuditThreshold?: number;
          maxConcurrency?: number;
          proxyProvider?:
            | Database['public']['Enums']['proxy_providers_enum']
            | null;
          useFirefox?: boolean | null;
          webSocket?: Database['public']['Enums']['websocket_enum'] | null;
          withProxy?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCompanyAuditSettings_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityCompanyPasswordSettings: {
        Row: {
          allowedCharacters: string;
          createdAt: string;
          id: string;
        };
        Insert: {
          allowedCharacters: string;
          createdAt?: string;
          id: string;
        };
        Update: {
          allowedCharacters?: string;
          createdAt?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCompanyPasswordSettings_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityCompanyQuestion: {
        Row: {
          answerChoices: string[] | null;
          defaultValue: string | null;
          displayLocation: Database['public']['Enums']['UtilityCompanyQuestion_displayLocation'];
          id: string;
          inputType: Database['public']['Enums']['UtilityCompanyQuestion_inputType'];
          questionText: string;
          utilityCompanyID: string;
        };
        Insert: {
          answerChoices?: string[] | null;
          defaultValue?: string | null;
          displayLocation?: Database['public']['Enums']['UtilityCompanyQuestion_displayLocation'];
          id?: string;
          inputType?: Database['public']['Enums']['UtilityCompanyQuestion_inputType'];
          questionText: string;
          utilityCompanyID: string;
        };
        Update: {
          answerChoices?: string[] | null;
          defaultValue?: string | null;
          displayLocation?: Database['public']['Enums']['UtilityCompanyQuestion_displayLocation'];
          id?: string;
          inputType?: Database['public']['Enums']['UtilityCompanyQuestion_inputType'];
          questionText?: string;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCompanyQuestion_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityCompanyRefreshSettings: {
        Row: {
          billRefreshFrequency: number | null;
          created_at: string;
          id: string;
          pdfPullFrequency: number | null;
          usageRefreshFrequency: number | null;
        };
        Insert: {
          billRefreshFrequency?: number | null;
          created_at?: string;
          id: string;
          pdfPullFrequency?: number | null;
          usageRefreshFrequency?: number | null;
        };
        Update: {
          billRefreshFrequency?: number | null;
          created_at?: string;
          id?: string;
          pdfPullFrequency?: number | null;
          usageRefreshFrequency?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCompanyRefreshSettings_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityPaymentHistory: {
        Row: {
          amount: number;
          datePaid: string;
          electricAccountID: number | null;
          forUser: string;
          gasAccountID: number | null;
          id: number;
          paidBy: string | null;
          status: string;
          utilityCompanyID: string;
        };
        Insert: {
          amount: number;
          datePaid: string;
          electricAccountID?: number | null;
          forUser: string;
          gasAccountID?: number | null;
          id?: number;
          paidBy?: string | null;
          status: string;
          utilityCompanyID: string;
        };
        Update: {
          amount?: number;
          datePaid?: string;
          electricAccountID?: number | null;
          forUser?: string;
          gasAccountID?: number | null;
          id?: number;
          paidBy?: string | null;
          status?: string;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityPaymentHistory_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'ElectricBillingMetrics';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_electricAccountID_fkey';
            columns: ['electricAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['electricAccountID'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_forUser_fkey';
            columns: ['forUser'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasAccount';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'GasBillingMetrics';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_gasAccountID_fkey';
            columns: ['gasAccountID'];
            isOneToOne: false;
            referencedRelation: 'PropertyWithAccountsAndUsers';
            referencedColumns: ['gasAccountID'];
          },
          {
            foreignKeyName: 'UtilityPaymentHistory_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityQuestionAnswer: {
        Row: {
          answer: string;
          cottageUserID: string;
          id: string;
          questionID: string;
        };
        Insert: {
          answer: string;
          cottageUserID: string;
          id?: string;
          questionID: string;
        };
        Update: {
          answer?: string;
          cottageUserID?: string;
          id?: string;
          questionID?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_cottageUserID_fkey';
            columns: ['cottageUserID'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'UtilityQuestionAnswer_questionID_fkey';
            columns: ['questionID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompanyQuestion';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityRemittance: {
        Row: {
          amount: number;
          chargeAccountID: string;
          created_at: string | null;
          id: string;
          paymentId: string | null;
          processingAt: string | null;
          remittanceStatus: Database['public']['Enums']['remittance_status'];
        };
        Insert: {
          amount: number;
          chargeAccountID: string;
          created_at?: string | null;
          id?: string;
          paymentId?: string | null;
          processingAt?: string | null;
          remittanceStatus: Database['public']['Enums']['remittance_status'];
        };
        Update: {
          amount?: number;
          chargeAccountID?: string;
          created_at?: string | null;
          id?: string;
          paymentId?: string | null;
          processingAt?: string | null;
          remittanceStatus?: Database['public']['Enums']['remittance_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityRemittance_chargeAccountID_fkey';
            columns: ['chargeAccountID'];
            isOneToOne: false;
            referencedRelation: 'ChargeAccount';
            referencedColumns: ['id'];
          },
        ];
      };
      UtilityRemittanceRecord: {
        Row: {
          created_at: string;
          historyRecord: number | null;
          id: string;
          ledgerTransactionID: string | null;
          payment: string;
          paymentMethodTransactionId: string | null;
          remittance_status: Database['public']['Enums']['remittance_status'];
        };
        Insert: {
          created_at?: string;
          historyRecord?: number | null;
          id?: string;
          ledgerTransactionID?: string | null;
          payment: string;
          paymentMethodTransactionId?: string | null;
          remittance_status: Database['public']['Enums']['remittance_status'];
        };
        Update: {
          created_at?: string;
          historyRecord?: number | null;
          id?: string;
          ledgerTransactionID?: string | null;
          payment?: string;
          paymentMethodTransactionId?: string | null;
          remittance_status?: Database['public']['Enums']['remittance_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'fk_historyRecord';
            columns: ['historyRecord'];
            isOneToOne: false;
            referencedRelation: 'UtilityPaymentHistory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_payment';
            columns: ['payment'];
            isOneToOne: true;
            referencedRelation: 'Payments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_payment';
            columns: ['payment'];
            isOneToOne: true;
            referencedRelation: 'ViewRemittanceReview';
            referencedColumns: ['payment_id'];
          },
        ];
      };
      v_partner_id: {
        Row: {
          id: string | null;
        };
        Insert: {
          id?: string | null;
        };
        Update: {
          id?: string | null;
        };
        Relationships: [];
      };
      VoidOperations: {
        Row: {
          completed: boolean | null;
          completedAt: string | null;
          context: string | null;
          errorMessage: string | null;
          initiatedAt: string;
          initiatedBy: string;
          paymentID: string;
          transactionID: string;
          updatedAt: string | null;
        };
        Insert: {
          completed?: boolean | null;
          completedAt?: string | null;
          context?: string | null;
          errorMessage?: string | null;
          initiatedAt?: string;
          initiatedBy: string;
          paymentID: string;
          transactionID: string;
          updatedAt?: string | null;
        };
        Update: {
          completed?: boolean | null;
          completedAt?: string | null;
          context?: string | null;
          errorMessage?: string | null;
          initiatedAt?: string;
          initiatedBy?: string;
          paymentID?: string;
          transactionID?: string;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'VoidOperations_paymentID_fkey';
            columns: ['paymentID'];
            isOneToOne: false;
            referencedRelation: 'Payment';
            referencedColumns: ['id'];
          },
        ];
      };
      WaitList: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          id: number;
          isForBeta: boolean | null;
          name: string | null;
          reference: string | null;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: number;
          isForBeta?: boolean | null;
          name?: string | null;
          reference?: string | null;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: number;
          isForBeta?: boolean | null;
          name?: string | null;
          reference?: string | null;
          zip?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      ElectricBillingMetrics: {
        Row: {
          billsPendingUtilityPayment: number | null;
          daysSinceLastAudit: number | null;
          daysSinceLastBill: number | null;
          daysUntilPaymentDue: number | null;
          delinquentDays: number | null;
          electricAccountID: number | null;
          isOutOfSync: boolean | null;
          isPaymentDue: boolean | null;
          nonTriggeredBills: number | null;
          numberOfDelinquentBills: number | null;
          totalBills: number | null;
          totalOutstandingBalance: number | null;
        };
        Relationships: [];
      };
      files_awaiting_ocr: {
        Row: {
          name: string | null;
        };
        Relationships: [];
      };
      filesawaitingocr: {
        Row: {
          created_at: string | null;
          name: string | null;
        };
        Insert: {
          created_at?: string | null;
          name?: string | null;
        };
        Update: {
          created_at?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
      GasBillingMetrics: {
        Row: {
          billsPendingUtilityPayment: number | null;
          daysSinceLastAudit: number | null;
          daysSinceLastBill: number | null;
          daysUntilPaymentDue: number | null;
          delinquentDays: number | null;
          gasAccountID: number | null;
          isOutOfSync: boolean | null;
          isPaymentDue: boolean | null;
          nonTriggeredBills: number | null;
          numberOfDelinquentBills: number | null;
          totalBills: number | null;
          totalOutstandingBalance: number | null;
        };
        Relationships: [];
      };
      PropertyWithAccountsAndUsers: {
        Row: {
          electricAccountID: number | null;
          electricAccountNumber: string | null;
          electricStatus:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          electricUserFirstName: string | null;
          electricUserLastName: string | null;
          gasAccountID: number | null;
          gasAccountNumber: string | null;
          gasStatus:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          gasUserFirstName: string | null;
          gasUserLastName: string | null;
          propertyID: number | null;
        };
        Relationships: [];
      };
      ViewAllBills: {
        Row: {
          accountId: number | null;
          accountNumber: string | null;
          accountStatus:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          approvedBy: string | null;
          approvedByName: string | null;
          approvedDate: string | null;
          billType: string | null;
          city: string | null;
          communitySolarStatus:
            | Database['public']['Enums']['enum_ElectricAccount_communitySolarStatus']
            | null;
          createdAt: string | null;
          dueDate: string | null;
          endDate: string | null;
          feeStructure: number | null;
          id: number | null;
          ingestionState: Database['public']['Enums']['ingestion_state'] | null;
          isDepositOnlyBill: boolean | null;
          isIncomplete: boolean | null;
          isPaidByUser: boolean | null;
          isPaidUtilityCompany: boolean | null;
          isSendReminder: boolean | null;
          lastPaymentAttemptDate: string | null;
          manual: boolean | null;
          paidByUser: string | null;
          paidNotificationSent: boolean | null;
          paymentDate: string | null;
          pdfPath: string | null;
          propertyId: number | null;
          residentFirstName: string | null;
          residentLastName: string | null;
          startDate: string | null;
          state: string | null;
          statementDate: string | null;
          street: string | null;
          stripePaymentId: string | null;
          ticketID: string | null;
          totalAmountDue: number | null;
          totalOutstandingBalance: number | null;
          totalUsage: number | null;
          transactionFee: number | null;
          unitNumber: string | null;
          updatedAt: string | null;
          userEmail: string | null;
          userId: string | null;
          utilityCompanyID: string | null;
          utilityCompanyLogo: string | null;
          utilityCompanyName: string | null;
          utilityCompanyPaidAt: string | null;
          visible: boolean | null;
          zip: string | null;
        };
        Relationships: [];
      };
      ViewCompanyCustomerPermission: {
        Row: {
          companyId: string | null;
          customerId: string | null;
          utilityAccounts: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ViewConnectCustomerInfoV2: {
        Row: {
          address: Json | null;
          canceled: boolean | null;
          companyId: string | null;
          completed: boolean | null;
          createdAt: string | null;
          customerId: string | null;
          customerInfo: Json | null;
          expiresAt: string | null;
          grantedAt: string | null;
          revoked: boolean | null;
          revokedAt: string | null;
          utilityAccounts: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ConnectRequest_requestedFromId_fkey';
            columns: ['customerId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_ConnectRequest_requestorId_fkey';
            columns: ['companyId'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ViewConsolidatedUnpaidBills: {
        Row: {
          hasOverdueBalance: boolean | null;
          lastPaymentStatusChangedDate: string | null;
          lastSuccessfulAudit: string | null;
          lastUtilityCompanyPaidAt: string | null;
          remittances: Json | null;
          totalOutstandingBalance: number | null;
          totalUnpaidBillAmount: number | null;
          totalUnpaidBillCount: number | null;
          totalUnpaidElectricBillAmount: number | null;
          totalUnpaidElectricBillCount: number | null;
          totalUnpaidGasBillAmount: number | null;
          totalUnpaidGasBillCount: number | null;
          userEmail: string | null;
          userId: string | null;
          utilityCompanyName: string | null;
        };
        Relationships: [];
      };
      ViewCottageUserWithUtilityAccount: {
        Row: {
          accountID: number | null;
          accountNumber: string | null;
          accountType: string | null;
          cottageUserID: string | null;
          maintainedFor: string | null;
          propertyID: number | null;
          uniqueIdentifier: string | null;
          utilityCompanyID: string | null;
        };
        Relationships: [];
      };
      ViewMoveInPartnerReferral: {
        Row: {
          id: string | null;
          imgURL: string | null;
          isAddressPrefillEnabled: boolean | null;
          isThemed: boolean | null;
          isUtilityVerificationEnabled: boolean | null;
          name: string | null;
          referralCode: string | null;
          themeID: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'MoveInPartner_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ViewPGAdminServiceAccounts: {
        Row: {
          createdAt: string | null;
          electric_accounts: number | null;
          email: string | null;
          gas_accounts: number | null;
          id: string | null;
          isReady: boolean | null;
          isValid: boolean | null;
          sessionPersistenceTokenStatus: boolean | null;
          total_linked_accounts: number | null;
          utilityCompanyID: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'UtilityCredentials_provider_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      ViewReferralsWithResidentInfo: {
        Row: {
          createdAt: string | null;
          firstName: string | null;
          lastName: string | null;
          referralStatus: Database['public']['Enums']['referral_status'] | null;
          referred: string | null;
          referredBy: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referred_fkey';
            columns: ['referred'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Referrals_referredBy_fkey';
            columns: ['referredBy'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ViewRemittanceReview: {
        Row: {
          amountDue: number | null;
          bill_type: string | null;
          customer_email: string | null;
          customer_id: string | null;
          electric_account_number: string | null;
          electric_bill_amount: number | null;
          electric_bill_due_date: string | null;
          electric_bill_id: number | null;
          electric_utility_company_paid_at: string | null;
          gas_account_number: string | null;
          gas_bill_amount: number | null;
          gas_bill_due_date: string | null;
          gas_bill_id: number | null;
          gas_utility_company_paid_at: string | null;
          payment_created_at: string | null;
          payment_id: string | null;
          paymentStatus: Database['public']['Enums']['paymentstatus'] | null;
          remittance_created_at: string | null;
          remittance_id: string | null;
          remittance_status:
            | Database['public']['Enums']['remittance_status']
            | null;
          stripePaymentID: string | null;
          stripePaymentIntentId: string | null;
          utility_company_id: string | null;
          utility_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'CottageUsers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'ViewConsolidatedUnpaidBills';
            referencedColumns: ['userId'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'ViewCottageUserWithUtilityAccount';
            referencedColumns: ['cottageUserID'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'ViewPGAdminServiceAccounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'ViewResidentDetails';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'Payments_paidBy_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'ViewUnpaidRemittances';
            referencedColumns: ['userId'];
          },
        ];
      };
      ViewResidentDetails: {
        Row: {
          accountNumber: string | null;
          city: string | null;
          confirmationNumber: number | null;
          email: string | null;
          firstName: string | null;
          id: string | null;
          isBillingCustomer: boolean | null;
          isRegistrationComplete: boolean | null;
          lastName: string | null;
          paymentMethodStatus:
            | Database['public']['Enums']['paymentmethodstatus']
            | null;
          phone: string | null;
          referralCode: string | null;
          startServiceDate: string | null;
          state: string | null;
          status:
            | Database['public']['Enums']['enum_UtilityAccount_status']
            | null;
          street: string | null;
          unitNumber: string | null;
          utilityCompanyID: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ElectricAccount_utilityCompanyID_fkey';
            columns: ['utilityCompanyID'];
            isOneToOne: false;
            referencedRelation: 'UtilityCompany';
            referencedColumns: ['id'];
          },
        ];
      };
      ViewUnpaidRemittances: {
        Row: {
          amountToBeRemitted: number | null;
          hasOverdue: string | null;
          lastPaymentStatusChangedDate: string | null;
          lastSuccessfulAudit: string | null;
          totalOutstandingBalance: number | null;
          userEmail: string | null;
          userId: string | null;
          utilityCompanyName: string | null;
        };
        Relationships: [];
      };
      ViewUtilityCompaniesForZip: {
        Row: {
          otherUtilityCompanies: Json[] | null;
          primaryUtilityCompany: Json | null;
          state: string | null;
          zip: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_upsert_utility_credentials: {
        Args: {
          p_cipheriv?: string;
          p_encryptedpassword?: string;
          p_encryptedusername?: string;
          p_id?: number;
          p_isready?: boolean;
          p_mfaemail?: string;
          p_mfatextanswer?: string;
          p_provider?: string;
          p_user: string;
        };
        Returns: {
          cipherIv: string;
          created_at: string;
          encryptedPassword: string;
          encryptedUsername: string;
          isReady: boolean;
          mfaEmail: string;
          mfaTextAnswer: string;
          provider: string;
          user: string;
        }[];
      };
      approve_user_external_company: {
        Args: { email_arg: string };
        Returns: undefined;
      };
      bytea_to_text: {
        Args: { data: string };
        Returns: string;
      };
      check_duplicate_pg_email: {
        Args: { input_email: string };
        Returns: boolean;
      };
      check_electric_bill_for_roommate: {
        Args: { billid: number; id_check: string };
        Returns: boolean;
      };
      cleanup_temp_audit_info: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_bill_upload_user: {
        Args: {
          p_anonymous_user_id?: string;
          p_auth_user_id: string;
          p_consent_to_esco?: boolean;
          p_cottage_connect_user_type: string;
          p_email?: string;
          p_enrollment_preference: string;
          p_is_eligible_for_retargeting?: boolean;
          p_partner?: string;
          p_utility_company_id: string;
          p_zip?: string;
        };
        Returns: Json;
      };
      create_manual_remittance_execution: {
        Args: {
          p_adjustment_amount?: number;
          p_charge_account_id: string;
          p_is_prepay?: boolean;
          p_selected_remittance_ids?: string[];
          p_success_screenshot_id?: string;
          p_total_amount: number;
        };
        Returns: Json;
      };
      create_move_in_resident: {
        Args: {
          address_id: string;
          answers: Json;
          building_id?: string;
          default_fee_id?: number;
          electric_company_id?: string;
          email_input: string;
          first_name: string;
          gas_company_id?: string;
          is_handle_billing: boolean;
          last_name: string;
          move_in_identifier?: string;
          phone_input?: string;
          prior_address_id?: string;
          property_type: Database['public']['Enums']['enum_Unit_residenceType'];
          start_service_date: string;
          unit_number?: string;
          user_id: string;
        };
        Returns: boolean;
      };
      create_remittance_execution: {
        Args: {
          p_charge_account_id: string;
          p_remittance_ids: string[];
          p_total_amount: number;
        };
        Returns: Json;
      };
      create_resident_from_utility_verification: {
        Args: {
          address_id: string;
          building_id?: string;
          default_fee_id?: number;
          electric_company_id?: string;
          email_input: string;
          first_name: string;
          gas_company_id?: string;
          is_handle_billing: boolean;
          last_name: string;
          move_in_identifier?: string;
          phone_input: string;
          property_type: Database['public']['Enums']['enum_Unit_residenceType'];
          start_service_date?: string;
          stripe_customer_id?: string;
          unit_number?: string;
          user_id: string;
        };
        Returns: boolean;
      };
      decrypt_aes_cbc: {
        Args: { encrypted: string; iv: string };
        Returns: string;
      };
      electric_bill_rls_check: {
        Args: { id_check: string; test: number };
        Returns: boolean;
      };
      gas_bill_rls_check: {
        Args: { id_check: string; test: number };
        Returns: boolean;
      };
      get_charge_account_remittances_grouped: {
        Args: { p_charge_account_id: string };
        Returns: Json;
      };
      get_current_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_daily_delta_stats: {
        Args: {
          p_accounttype?: string;
          p_end_date?: string;
          p_lower_pct?: number;
          p_start_date?: string;
          p_status?: string;
          p_upper_pct?: number;
          p_utilitycompanyid?: string;
        };
        Returns: {
          day: string;
          mean_delta: unknown;
          median_delta: unknown;
          mode_delta: unknown;
        }[];
      };
      get_green_button_sync_jobs_to_retry: {
        Args: Record<PropertyKey, never>;
        Returns: {
          greenbuttonoauthid: number;
          operation: string;
          provider: string;
          refreshtoken: string;
          status: string;
          subscriptionid: string;
          userid: string;
        }[];
      };
      get_last_7_days_usage_interval: {
        Args: { account_id: number; account_type: string; end_date: string };
        Returns: {
          duration: number;
          reading: number;
          readingAt: string;
        }[];
      };
      get_latest_audit_dates: {
        Args: Record<PropertyKey, never>;
        Returns: {
          lastSuccessfulAudit: string;
          utilityCompanyID: string;
        }[];
      };
      get_meter_readings_interval: {
        Args: {
          electric_account_id: number;
          end_time: string;
          start_time: string;
        };
        Returns: {
          reading: number;
          readingAt: string;
        }[];
      };
      get_pending_executions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_referrals: {
        Args: { userid: string };
        Returns: {
          createdAt: string;
          firstName: string;
          lastName: string;
          referralStatus: Database['public']['Enums']['referral_status'];
          referred: string;
          referredBy: string;
        }[];
      };
      get_remittances_count: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_email_search?: string;
          p_execution_status_filter?: string[];
          p_status_filter?: string[];
          p_utility_company_id?: string[];
        };
        Returns: {
          status_counts: Json;
          total_count: number;
        }[];
      };
      get_remittances_with_executions: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_email_search?: string;
          p_execution_status_filter?: string[];
          p_limit?: number;
          p_offset?: number;
          p_status_filter?: string[];
          p_utility_company_id?: string[];
        };
        Returns: Json;
      };
      get_review_executions: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_tables_and_columns: {
        Args: Record<PropertyKey, never>;
        Returns: {
          column_name: string;
          table_name: string;
        }[];
      };
      get_temp_audit_info: {
        Args: { p_record_id: string; p_relid: unknown };
        Returns: {
          audit_user_id: string;
          change_source: string;
        }[];
      };
      get_unlinked_remittances: {
        Args: { p_charge_account_id?: string };
        Returns: Json;
      };
      get_user_buildings: {
        Args: { user_id: string };
        Returns: {
          accessLevel: string;
          city: string;
          company_name: string;
          id: string;
          name: string;
          shortCode: string;
          state: string;
          street: string;
          totalUnitCount: number;
          unitCount: number;
          zip: string;
        }[];
      };
      get_user_data: {
        Args: { user_id?: string };
        Returns: {
          createdAt: string;
          dateOfBirth: string;
          email: string;
          firstName: string;
          id: string;
          isAutoPaymentEnabled: boolean;
          isRegistrationComplete: boolean;
          lastName: string;
          phone: string;
          properties: Json;
          startServiceDate: string;
          stripePaymentMethodID: string;
        }[];
      };
      get_user_data_single: {
        Args: { user_id: string };
        Returns: {
          createdAt: string;
          dateOfBirth: string;
          email: string;
          firstName: string;
          id: string;
          isAutoPaymentEnabled: boolean;
          isRegistrationComplete: boolean;
          lastName: string;
          phone: string;
          properties: Json;
          startServiceDate: string;
          stripePaymentMethodID: string;
        }[];
      };
      get_user_data_small: {
        Args: { user_id?: string };
        Returns: {
          createdAt: string;
          email: string;
          firstName: string;
          id: string;
          isRegistrationComplete: boolean;
          lastName: string;
          moveInIdentifier: string;
          moveInPartnerName: string;
          phone: string;
          properties: Json;
          startServiceDate: string;
        }[];
      };
      get_user_data_small_2: {
        Args: {
          excluded_statuses?: Database['public']['Enums']['enum_UtilityAccount_status'][];
          user_id?: string;
        };
        Returns: {
          createdAt: string;
          email: string;
          firstName: string;
          id: string;
          isRegistrationComplete: boolean;
          lastName: string;
          moveInIdentifier: string;
          moveInPartnerName: string;
          phone: string;
          properties: Json;
          startServiceDate: string;
        }[];
      };
      get_user_data_small_verification: {
        Args: {
          excluded_statuses?: Database['public']['Enums']['enum_UtilityAccount_status'][];
          user_id?: string;
        };
        Returns: {
          createdAt: string;
          email: string;
          firstName: string;
          id: string;
          intercomID: string;
          isRegistrationComplete: boolean;
          lastName: string;
          moveInIdentifier: string;
          moveInPartnerName: string;
          phone: string;
          properties: Json;
          startServiceDate: string;
        }[];
      };
      get_user_data_v2: {
        Args: { user_id?: string };
        Returns: {
          createdAt: string;
          dateOfBirth: string;
          dateOfTextMessageConsent: string;
          email: string;
          firstName: string;
          id: string;
          intercomID: string;
          isAbleToSendTextMessages: boolean;
          isAutoPaymentEnabled: boolean;
          isRegistrationComplete: boolean;
          lastName: string;
          moveInIdentifier: string;
          moveInPartnerId: string;
          moveInPartnerName: string;
          pgEmail: string;
          phone: string;
          properties: Json;
          referralId: string;
          startServiceDate: string;
          stripePaymentMethodID: string;
          utilityCompanyQuestions: Json;
        }[];
      };
      get_utility_error_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          error_count: number;
          error_type: string;
          utility_company_id: string;
        }[];
      };
      get_utility_readings_interval: {
        Args: {
          account_id: number;
          account_type: string;
          end_time: string;
          start_time: string;
        };
        Returns: {
          duration: number;
          reading: number;
          readingAt: string;
        }[];
      };
      http: {
        Args: { request: Database['public']['CompositeTypes']['http_request'] };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_get: {
        Args: { data: Json; uri: string } | { uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_head: {
        Args: { uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_header: {
        Args: { field: string; value: string };
        Returns: Database['public']['CompositeTypes']['http_header'];
      };
      http_list_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: {
          curlopt: string;
          value: string;
        }[];
      };
      http_patch: {
        Args: { content: string; content_type: string; uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_put: {
        Args: { content: string; content_type: string; uri: string };
        Returns: Database['public']['CompositeTypes']['http_response'];
      };
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      http_set_curlopt: {
        Args: { curlopt: string; value: string };
        Returns: boolean;
      };
      list_utility_credential_users: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      pg_admin_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
      populate_user_data: {
        Args: { input_email: string };
        Returns: undefined;
      };
      refresh_billing_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      register_user: {
        Args: {
          address_id: string;
          answers: Json;
          building_id?: string;
          date_of_birth?: string;
          default_fee_id?: number;
          did_setup_payment: boolean;
          electric_company_id?: string;
          email_input: string;
          first_name: string;
          gas_company_id?: string;
          identity_number?: string;
          identity_other?: string;
          identity_type?: string;
          is_handle_billing: boolean;
          last_name: string;
          move_in_identifier?: string;
          partner_id?: string;
          phone_input?: string;
          prior_address_id?: string;
          property_type: Database['public']['Enums']['enum_Unit_residenceType'];
          start_service_date: string;
          unit_number?: string;
          user_id: string;
          with_resident_identity: boolean;
        };
        Returns: {
          address_data: Json;
          bcc_email: string;
        }[];
      };
      remove_timescaledb: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      retry_green_button_jobs: {
        Args: { secret: string; url: string } | { url: string };
        Returns: {
          http_post: string;
        }[];
      };
      retry_utility_automation_jobs: {
        Args: { secret: string; url: string };
        Returns: {
          http_post: string;
        }[];
      };
      safe_drop_timescaledb: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      text_to_bytea: {
        Args: { data: string };
        Returns: string;
      };
      update_remittance_execution: {
        Args: {
          p_execution_id: string;
          p_failed_explanation?: string;
          p_status: Database['public']['Enums']['remittance_execution_status'];
          p_success_screenshot?: string;
        };
        Returns: Json;
      };
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string };
        Returns: string;
      };
    };
    Enums: {
      adjustment_phase_type: 'pre-ingestion' | 'post-ingestion';
      bill_credit_type: 'PG_PAYS' | 'OVERPAYMENT';
      enum_CottageUsers_cottageConnectUserType:
        | 'CUSTOMER'
        | 'COMPANY'
        | 'REFERRAL_PARTNER'
        | 'BUILDING'
        | 'MOVE_IN'
        | 'SERVICE_ACCOUNT'
        | 'BILL_UPLOAD'
        | 'VERIFY_UTILITIES'
        | 'TESTTYPE';
      enum_CottageUsers_enrollmentPreferenceType:
        | 'automatic'
        | 'manual'
        | 'verification_only';
      enum_CottageUsers_stripePaymentMethodType: 'card' | 'us_bank_account';
      enum_DialpadSMS_direction: 'inbound' | 'outbound';
      enum_ElectricAccount_communitySolarStatus:
        | 'NONE'
        | 'PENDING'
        | 'ENROLLED';
      enum_ElectricAccount_supplyStatus:
        | 'DEFAULT'
        | 'CHANGE_PENDING'
        | 'NON_DEFAULT';
      enum_ElectricSupplyPlan_rateType: 'FIXED' | 'VARIABLE' | 'TIME_OF_USE';
      enum_electricsupplyplan_supplystatus:
        | 'NOT_ENROLLED'
        | 'REQUEST_PRICE'
        | 'PENDING_REVIEW'
        | 'PENDING_DEPOSIT'
        | 'SIGNED'
        | 'CONFIRMED'
        | 'REJECTED'
        | 'DROPPED'
        | 'EXPIRED'
        | 'FRAUD';
      enum_LinkAccountJob_status:
        | 'PENDING'
        | 'SUCCESS'
        | 'ERROR'
        | 'MFA_CODE_PENDING'
        | 'MFA_CODE_VALID';
      enum_PropertyGroupResident_inviteStatus:
        | 'accepted'
        | 'rejected'
        | 'pending'
        | 'removed';
      enum_RegistrationJob_status: 'FAILED' | 'COMPLETE' | 'RUNNING';
      enum_transaction_code:
        | 'credit_for_overpayment'
        | 'credit_for_incentive'
        | 'credit_for_late';
      enum_unit_residencetype: 'APARTMENT' | 'HOME';
      enum_Unit_residenceType: 'APARTMENT' | 'HOME';
      enum_UtilityAccount_status:
        | 'NEW'
        | 'PENDING_CREATE'
        | 'ACTIVE'
        | 'INACTIVE'
        | 'PENDING_SYNC'
        | 'PENDING_ONLINE_ACCOUNT_CREATION'
        | 'PENDING_START_SERVICE'
        | 'PENDING_ISSUE'
        | 'PENDING_ACCOUNT_NUMBER'
        | 'PENDING_FIRST_BILL'
        | 'RESYNC_REQUIRED'
        | 'PENDING_LAST_BILL'
        | 'IN_PROGRESS'
        | 'CREATE_ONLINE_ACCOUNT'
        | 'ON_HOLD'
        | 'AWAITING_EMAIL_CONFIRMATION'
        | 'LINK_ONLINE_ACCOUNT'
        | 'ADDRESS_VERIFICATION_NEEDED'
        | 'METER_VERIFICATION_NEEDED'
        | 'WAITING_FOR_DOCS'
        | 'CALL_IN_REQUIRED'
        | 'ROADBLOCKED'
        | 'INVALID_IDENTITY_INFORMATION'
        | 'UTILITY_VERIFICATION_NEEDED'
        | 'UTILITY_VERIFICATION_SUBMITTED'
        | 'AUTOMATED_START_SERVICE_ERROR'
        | 'NEEDS_OFF_BOARDING'
        | 'UTILITY_VERIFIED'
        | 'REVIEW_UPLOAD_BILL'
        | 'REVIEW_VERIFICATION'
        | 'COMPLETE_VERIFICATION'
        | 'ISSUE_UPLOAD_BILL'
        | 'ELIGIBLE'
        | 'ISSUE_VERIFICATION'
        | 'NEED_VERIFICATION'
        | 'SETUP_COMPLETE'
        | 'TRANSFER_READY';
      ExternalCompanyStatusEnum: 'PENDING' | 'APPROVED';
      identityVerificationType:
        | 'ssn'
        | 'driversLicense'
        | 'passport'
        | 'publicAssistanceID'
        | 'alienID';
      ingestion_state: 'approved' | 'processed' | 'cancelled';
      job_types_enum: 'payBills' | 'audit' | 'start_service';
      payment_instrument_assignment_direction: 'up' | 'down';
      paymentmethodstatus: 'VALID' | 'INVALID';
      paymentstatus:
        | 'processing'
        | 'succeeded'
        | 'failed'
        | 'scheduled_for_payment'
        | 'waiting_for_user'
        | 'canceled'
        | 'paid_by_user'
        | 'approved'
        | 'requires_capture'
        | 'awaiting_refund'
        | 'refund_processing'
        | 'refunded'
        | 'succeeded_but_unverified';
      providerStatus: 'AVAILABLE' | 'DEGRADED' | 'DOWN';
      proxy_providers_enum: 'default' | 'steel';
      referral_status: 'pending' | 'complete' | 'invalid';
      registrationDocumentsStatus: 'REQUESTED' | 'RECEIVED';
      remittance_execution_status:
        | 'pending'
        | 'failed'
        | 'completed'
        | 'to_review'
        | 'posted';
      remittance_status:
        | 'ready_for_remittance'
        | 'cancelled'
        | 'pending_confirmation'
        | 'requires_review'
        | 'manually_approved'
        | 'failed'
        | 'done'
        | 'waiting_for_payment'
        | 'for_bundling'
        | 'processing';
      serviceGroupCommunitySolarAvailability: 'NONE' | 'WAITLIST' | 'ACTIVE';
      serviceGroupStatus: 'ACTIVE' | 'BETA' | 'NOT_ACTIVE';
      stripepaymentstatus:
        | 'requires_payment_method'
        | 'requires_confirmation'
        | 'requires_action'
        | 'processing'
        | 'requires_capture'
        | 'canceled'
        | 'succeeded';
      UtilityCompany_utilitiesHandled: 'gas' | 'electricity';
      UtilityCompanyQuestion_displayLocation: 'moveIn' | 'ev';
      UtilityCompanyQuestion_inputType:
        | 'text'
        | 'radio'
        | 'textarea'
        | 'checkbox'
        | 'select'
        | 'button'
        | 'submit'
        | 'reset'
        | 'file'
        | 'hidden'
        | 'image'
        | 'date'
        | 'email'
        | 'number'
        | 'url';
      utilityCompanyStatus: 'BETA' | 'ACTIVE' | 'NOT_ACTIVE';
      utilityIntegrationType:
        | 'greenButton'
        | 'automation'
        | 'other'
        | 'utilityCode';
      UtilityVerificationStatus:
        | 'UTILITY_VERIFICATION_NEEDED'
        | 'UTILITY_VERIFICATION_SUBMITTED'
        | 'ADDRESS_VERIFICATION_NEEDED'
        | 'WAITING_FOR_DOCS'
        | 'METER_VERIFICATION_NEEDED'
        | 'UTILITY_VERIFIED';
      websocket_enum: 'default' | 'browserless' | 'steel';
    };
    CompositeTypes: {
      http_header: {
        field: string | null;
        value: string | null;
      };
      http_request: {
        method: unknown | null;
        uri: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content_type: string | null;
        content: string | null;
      };
      http_response: {
        status: number | null;
        content_type: string | null;
        headers: Database['public']['CompositeTypes']['http_header'][] | null;
        content: string | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      adjustment_phase_type: ['pre-ingestion', 'post-ingestion'],
      bill_credit_type: ['PG_PAYS', 'OVERPAYMENT'],
      enum_CottageUsers_cottageConnectUserType: [
        'CUSTOMER',
        'COMPANY',
        'REFERRAL_PARTNER',
        'BUILDING',
        'MOVE_IN',
        'SERVICE_ACCOUNT',
        'BILL_UPLOAD',
        'VERIFY_UTILITIES',
        'TESTTYPE',
      ],
      enum_CottageUsers_enrollmentPreferenceType: [
        'automatic',
        'manual',
        'verification_only',
      ],
      enum_CottageUsers_stripePaymentMethodType: ['card', 'us_bank_account'],
      enum_DialpadSMS_direction: ['inbound', 'outbound'],
      enum_ElectricAccount_communitySolarStatus: [
        'NONE',
        'PENDING',
        'ENROLLED',
      ],
      enum_ElectricAccount_supplyStatus: [
        'DEFAULT',
        'CHANGE_PENDING',
        'NON_DEFAULT',
      ],
      enum_ElectricSupplyPlan_rateType: ['FIXED', 'VARIABLE', 'TIME_OF_USE'],
      enum_electricsupplyplan_supplystatus: [
        'NOT_ENROLLED',
        'REQUEST_PRICE',
        'PENDING_REVIEW',
        'PENDING_DEPOSIT',
        'SIGNED',
        'CONFIRMED',
        'REJECTED',
        'DROPPED',
        'EXPIRED',
        'FRAUD',
      ],
      enum_LinkAccountJob_status: [
        'PENDING',
        'SUCCESS',
        'ERROR',
        'MFA_CODE_PENDING',
        'MFA_CODE_VALID',
      ],
      enum_PropertyGroupResident_inviteStatus: [
        'accepted',
        'rejected',
        'pending',
        'removed',
      ],
      enum_RegistrationJob_status: ['FAILED', 'COMPLETE', 'RUNNING'],
      enum_transaction_code: [
        'credit_for_overpayment',
        'credit_for_incentive',
        'credit_for_late',
      ],
      enum_unit_residencetype: ['APARTMENT', 'HOME'],
      enum_Unit_residenceType: ['APARTMENT', 'HOME'],
      enum_UtilityAccount_status: [
        'NEW',
        'PENDING_CREATE',
        'ACTIVE',
        'INACTIVE',
        'PENDING_SYNC',
        'PENDING_ONLINE_ACCOUNT_CREATION',
        'PENDING_START_SERVICE',
        'PENDING_ISSUE',
        'PENDING_ACCOUNT_NUMBER',
        'PENDING_FIRST_BILL',
        'RESYNC_REQUIRED',
        'PENDING_LAST_BILL',
        'IN_PROGRESS',
        'CREATE_ONLINE_ACCOUNT',
        'ON_HOLD',
        'AWAITING_EMAIL_CONFIRMATION',
        'LINK_ONLINE_ACCOUNT',
        'ADDRESS_VERIFICATION_NEEDED',
        'METER_VERIFICATION_NEEDED',
        'WAITING_FOR_DOCS',
        'CALL_IN_REQUIRED',
        'ROADBLOCKED',
        'INVALID_IDENTITY_INFORMATION',
        'UTILITY_VERIFICATION_NEEDED',
        'UTILITY_VERIFICATION_SUBMITTED',
        'AUTOMATED_START_SERVICE_ERROR',
        'NEEDS_OFF_BOARDING',
        'UTILITY_VERIFIED',
        'REVIEW_UPLOAD_BILL',
        'REVIEW_VERIFICATION',
        'COMPLETE_VERIFICATION',
        'ISSUE_UPLOAD_BILL',
        'ELIGIBLE',
        'ISSUE_VERIFICATION',
        'NEED_VERIFICATION',
        'SETUP_COMPLETE',
        'TRANSFER_READY',
      ],
      ExternalCompanyStatusEnum: ['PENDING', 'APPROVED'],
      identityVerificationType: [
        'ssn',
        'driversLicense',
        'passport',
        'publicAssistanceID',
        'alienID',
      ],
      ingestion_state: ['approved', 'processed', 'cancelled'],
      job_types_enum: ['payBills', 'audit', 'start_service'],
      payment_instrument_assignment_direction: ['up', 'down'],
      paymentmethodstatus: ['VALID', 'INVALID'],
      paymentstatus: [
        'processing',
        'succeeded',
        'failed',
        'scheduled_for_payment',
        'waiting_for_user',
        'canceled',
        'paid_by_user',
        'approved',
        'requires_capture',
        'awaiting_refund',
        'refund_processing',
        'refunded',
        'succeeded_but_unverified',
      ],
      providerStatus: ['AVAILABLE', 'DEGRADED', 'DOWN'],
      proxy_providers_enum: ['default', 'steel'],
      referral_status: ['pending', 'complete', 'invalid'],
      registrationDocumentsStatus: ['REQUESTED', 'RECEIVED'],
      remittance_execution_status: [
        'pending',
        'failed',
        'completed',
        'to_review',
        'posted',
      ],
      remittance_status: [
        'ready_for_remittance',
        'cancelled',
        'pending_confirmation',
        'requires_review',
        'manually_approved',
        'failed',
        'done',
        'waiting_for_payment',
        'for_bundling',
        'processing',
      ],
      serviceGroupCommunitySolarAvailability: ['NONE', 'WAITLIST', 'ACTIVE'],
      serviceGroupStatus: ['ACTIVE', 'BETA', 'NOT_ACTIVE'],
      stripepaymentstatus: [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'requires_capture',
        'canceled',
        'succeeded',
      ],
      UtilityCompany_utilitiesHandled: ['gas', 'electricity'],
      UtilityCompanyQuestion_displayLocation: ['moveIn', 'ev'],
      UtilityCompanyQuestion_inputType: [
        'text',
        'radio',
        'textarea',
        'checkbox',
        'select',
        'button',
        'submit',
        'reset',
        'file',
        'hidden',
        'image',
        'date',
        'email',
        'number',
        'url',
      ],
      utilityCompanyStatus: ['BETA', 'ACTIVE', 'NOT_ACTIVE'],
      utilityIntegrationType: [
        'greenButton',
        'automation',
        'other',
        'utilityCode',
      ],
      UtilityVerificationStatus: [
        'UTILITY_VERIFICATION_NEEDED',
        'UTILITY_VERIFICATION_SUBMITTED',
        'ADDRESS_VERIFICATION_NEEDED',
        'WAITING_FOR_DOCS',
        'METER_VERIFICATION_NEEDED',
        'UTILITY_VERIFIED',
      ],
      websocket_enum: ['default', 'browserless', 'steel'],
    },
  },
} as const;
