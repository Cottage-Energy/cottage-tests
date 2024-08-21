export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
            foreignKeyName: "public_ApiKey_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ApiKey_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ApiKey_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      Building: {
        Row: {
          addressID: string | null;
          electricCompanyID: string | null;
          gasCompanyID: string | null;
          id: string;
          isHandleBilling: boolean | null;
          moveInPartnerID: string | null;
          name: string | null;
          shortCode: string | null;
          utilityFriendlyAddress: string | null;
        };
        Insert: {
          addressID?: string | null;
          electricCompanyID?: string | null;
          gasCompanyID?: string | null;
          id?: string;
          isHandleBilling?: boolean | null;
          moveInPartnerID?: string | null;
          name?: string | null;
          shortCode?: string | null;
          utilityFriendlyAddress?: string | null;
        };
        Update: {
          addressID?: string | null;
          electricCompanyID?: string | null;
          gasCompanyID?: string | null;
          id?: string;
          isHandleBilling?: boolean | null;
          moveInPartnerID?: string | null;
          name?: string | null;
          shortCode?: string | null;
          utilityFriendlyAddress?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Building_addressID_fkey";
            columns: ["addressID"];
            isOneToOne: false;
            referencedRelation: "Address";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Building_gasCompanyID_fkey";
            columns: ["gasCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Building_moveInPartnerID_fkey";
            columns: ["moveInPartnerID"];
            isOneToOne: false;
            referencedRelation: "MoveInPartner";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Building_moveInPartnerID_fkey";
            columns: ["moveInPartnerID"];
            isOneToOne: false;
            referencedRelation: "ViewMoveInPartnerReferral";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Building_utilityCompanyID_fkey";
            columns: ["electricCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
        ];
      };
      Building_BuildingManager: {
        Row: {
          buildingID: string;
          buildingManagerID: string;
          isActive: boolean | null;
        };
        Insert: {
          buildingID: string;
          buildingManagerID: string;
          isActive?: boolean | null;
        };
        Update: {
          buildingID?: string;
          buildingManagerID?: string;
          isActive?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "Building_BuildingManager_buildingID_fkey";
            columns: ["buildingID"];
            isOneToOne: false;
            referencedRelation: "Building";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Building_BuildingManager_buildingManagerID_fkey";
            columns: ["buildingManagerID"];
            isOneToOne: false;
            referencedRelation: "BuildingManager";
            referencedColumns: ["id"];
          },
        ];
      };
      Building_ServiceAccounts: {
        Row: {
          active: boolean | null;
          buildingID: string;
          created_at: string;
          serviceAccount: string;
        };
        Insert: {
          active?: boolean | null;
          buildingID: string;
          created_at?: string;
          serviceAccount: string;
        };
        Update: {
          active?: boolean | null;
          buildingID?: string;
          created_at?: string;
          serviceAccount?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Building_ServiceAccounts_id_fkey";
            columns: ["buildingID"];
            isOneToOne: false;
            referencedRelation: "Building";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_Building_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_Building_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_Building_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      BuildingManager: {
        Row: {
          firstName: string | null;
          id: string;
          lastName: string | null;
        };
        Insert: {
          firstName?: string | null;
          id: string;
          lastName?: string | null;
        };
        Update: {
          firstName?: string | null;
          id?: string;
          lastName?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "BuildingManager_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "BuildingManager_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "BuildingManager_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      Charges: {
        Row: {
          id: string;
          isBillCreated: boolean;
          issueID: string | null;
          total: number;
        };
        Insert: {
          id?: string;
          isBillCreated?: boolean;
          issueID?: string | null;
          total?: number;
        };
        Update: {
          id?: string;
          isBillCreated?: boolean;
          issueID?: string | null;
          total?: number;
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
            foreignKeyName: "CommunitySolarProvider_coverageServiceGroupID_fkey";
            columns: ["coverageServiceGroupID"];
            isOneToOne: false;
            referencedRelation: "ServiceGroup";
            referencedColumns: ["id"];
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
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["requestedFromId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["requestedFromId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["requestedFromId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["requestorId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["requestorId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["requestorId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      CottageUsers: {
        Row: {
          accountNumber: number | null;
          cottageConnectUserType: Database["public"]["Enums"]["enum_CottageUsers_cottageConnectUserType"] | null;
          createdAt: string | null;
          didDropOff: boolean | null;
          email: string | null;
          id: string;
          isAutoPaymentEnabled: boolean | null;
          paymentMethodStatus: Database["public"]["Enums"]["paymentmethodstatus"] | null;
          referralCode: string | null;
          stripeCustomerID: string | null;
          stripePaymentMethodID: string | null;
          stripePaymentMethodType: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"] | null;
          termsAndConditionsDate: string | null;
        };
        Insert: {
          accountNumber?: number | null;
          cottageConnectUserType?: Database["public"]["Enums"]["enum_CottageUsers_cottageConnectUserType"] | null;
          createdAt?: string | null;
          didDropOff?: boolean | null;
          email?: string | null;
          id: string;
          isAutoPaymentEnabled?: boolean | null;
          paymentMethodStatus?: Database["public"]["Enums"]["paymentmethodstatus"] | null;
          referralCode?: string | null;
          stripeCustomerID?: string | null;
          stripePaymentMethodID?: string | null;
          stripePaymentMethodType?: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"] | null;
          termsAndConditionsDate?: string | null;
        };
        Update: {
          accountNumber?: number | null;
          cottageConnectUserType?: Database["public"]["Enums"]["enum_CottageUsers_cottageConnectUserType"] | null;
          createdAt?: string | null;
          didDropOff?: boolean | null;
          email?: string | null;
          id?: string;
          isAutoPaymentEnabled?: boolean | null;
          paymentMethodStatus?: Database["public"]["Enums"]["paymentmethodstatus"] | null;
          referralCode?: string | null;
          stripeCustomerID?: string | null;
          stripePaymentMethodID?: string | null;
          stripePaymentMethodType?: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"] | null;
          termsAndConditionsDate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "CottageUsers_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ElectricAccount: {
        Row: {
          accountNumber: string | null;
          accountType: string | null;
          balanceAt: string | null;
          communitySolarProviderID: number | null;
          communitySolarStatus: Database["public"]["Enums"]["enum_ElectricAccount_communitySolarStatus"] | null;
          confirmationNumber: number | null;
          cottageUserID: string | null;
          createdAt: string | null;
          defaultBillFeeStructure: number | null;
          electricGeneratingEquipment: string | null;
          electricSupplyPlanID: number | null;
          endDate: string | null;
          hasElectricVehicle: boolean | null;
          id: number;
          isAccountLinkedWithUtility: boolean | null;
          isActive: boolean | null;
          isEnrolledInUtilityAutoPay: boolean | null;
          isUnderCottageEIN: boolean | null;
          lastSync: string | null;
          linearTicketId: string | null;
          maintainedFor: string | null;
          nextUtilityPaymentDate: string | null;
          propertyID: number | null;
          retries: number;
          startDate: string | null;
          status: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          supplyStatus: Database["public"]["Enums"]["enum_ElectricAccount_supplyStatus"] | null;
          tmpPassword: string | null;
          totalOutstandingBalance: number | null;
          uniqueIdentifier: string | null;
          updatedAt: string;
          utilityCompanyID: string | null;
          vehicleMakeModel: string | null;
        };
        Insert: {
          accountNumber?: string | null;
          accountType?: string | null;
          balanceAt?: string | null;
          communitySolarProviderID?: number | null;
          communitySolarStatus?: Database["public"]["Enums"]["enum_ElectricAccount_communitySolarStatus"] | null;
          confirmationNumber?: number | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          electricGeneratingEquipment?: string | null;
          electricSupplyPlanID?: number | null;
          endDate?: string | null;
          hasElectricVehicle?: boolean | null;
          id?: number;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastSync?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          propertyID?: number | null;
          retries?: number;
          startDate?: string | null;
          status?: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          supplyStatus?: Database["public"]["Enums"]["enum_ElectricAccount_supplyStatus"] | null;
          tmpPassword?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
          vehicleMakeModel?: string | null;
        };
        Update: {
          accountNumber?: string | null;
          accountType?: string | null;
          balanceAt?: string | null;
          communitySolarProviderID?: number | null;
          communitySolarStatus?: Database["public"]["Enums"]["enum_ElectricAccount_communitySolarStatus"] | null;
          confirmationNumber?: number | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          electricGeneratingEquipment?: string | null;
          electricSupplyPlanID?: number | null;
          endDate?: string | null;
          hasElectricVehicle?: boolean | null;
          id?: number;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastSync?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          propertyID?: number | null;
          retries?: number;
          startDate?: string | null;
          status?: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          supplyStatus?: Database["public"]["Enums"]["enum_ElectricAccount_supplyStatus"] | null;
          tmpPassword?: string | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
          vehicleMakeModel?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ElectricAccount_communitySolarProviderID_fkey";
            columns: ["communitySolarProviderID"];
            isOneToOne: false;
            referencedRelation: "CommunitySolarProvider";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ElectricAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_defaultBillFeeStructure_fkey";
            columns: ["defaultBillFeeStructure"];
            isOneToOne: false;
            referencedRelation: "FeeStructure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_electricSupplyPlanID_fkey";
            columns: ["electricSupplyPlanID"];
            isOneToOne: false;
            referencedRelation: "ElectricSupplyPlan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_residenceID_fkey";
            columns: ["propertyID"];
            isOneToOne: false;
            referencedRelation: "Property";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ElectricAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ElectricAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ElectricAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      ElectricBill: {
        Row: {
          createdAt: string | null;
          deliveryCharge: number | null;
          dueDate: string | null;
          electricAccountID: number;
          endDate: string;
          feeStructure: number | null;
          id: number;
          isPaidUtilityCompany: boolean | null;
          isSendReminder: boolean | null;
          lastPaymentAttemptDate: string | null;
          manual: boolean | null;
          otherCharges: number | null;
          paidByUser: string | null;
          paidNotificationSent: boolean | null;
          paymentDate: string | null;
          paymentStatus: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId: string | null;
          supplierCharge: number | null;
          ticketID: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee: number | null;
          utilityCompanyPaidAt: string | null;
          visible: boolean;
        };
        Insert: {
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          electricAccountID: number;
          endDate: string;
          feeStructure?: number | null;
          id?: number;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: number | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee?: number | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Update: {
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          electricAccountID?: number;
          endDate?: string;
          feeStructure?: number | null;
          id?: number;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: number | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate?: string;
          statementDate?: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue?: number;
          totalUsage?: number;
          transactionFee?: number | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "ElectricBill_electricAccountID_fkey";
            columns: ["electricAccountID"];
            isOneToOne: false;
            referencedRelation: "ElectricAccount";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricBill_feeStructure_fkey";
            columns: ["feeStructure"];
            isOneToOne: false;
            referencedRelation: "FeeStructure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ElectricBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
            foreignKeyName: "ElectricBillSavings_electricAccountID_fkey";
            columns: ["electricAccountID"];
            isOneToOne: false;
            referencedRelation: "ElectricAccount";
            referencedColumns: ["id"];
          },
        ];
      };
      ElectricSupplyPlan: {
        Row: {
          cancellationFee: string | null;
          contractLengthMonths: number | null;
          endDate: string | null;
          hasCancellationFees: boolean | null;
          id: number;
          rate: string | null;
          rateType: Database["public"]["Enums"]["enum_ElectricSupplyPlan_rateType"] | null;
          renewablePercentage: number | null;
          startDate: string | null;
          supplierName: string | null;
          utilityCompanyID: string | null;
        };
        Insert: {
          cancellationFee?: string | null;
          contractLengthMonths?: number | null;
          endDate?: string | null;
          hasCancellationFees?: boolean | null;
          id?: number;
          rate?: string | null;
          rateType?: Database["public"]["Enums"]["enum_ElectricSupplyPlan_rateType"] | null;
          renewablePercentage?: number | null;
          startDate?: string | null;
          supplierName?: string | null;
          utilityCompanyID?: string | null;
        };
        Update: {
          cancellationFee?: string | null;
          contractLengthMonths?: number | null;
          endDate?: string | null;
          hasCancellationFees?: boolean | null;
          id?: number;
          rate?: string | null;
          rateType?: Database["public"]["Enums"]["enum_ElectricSupplyPlan_rateType"] | null;
          renewablePercentage?: number | null;
          startDate?: string | null;
          supplierName?: string | null;
          utilityCompanyID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ElectricSupplyPlan_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
      ExternalCompany: {
        Row: {
          created_at: string | null;
          hasMoveInPermission: boolean | null;
          id: string;
          name: string | null;
          ownerCottageUserID: string | null;
          status: Database["public"]["Enums"]["ExternalCompanyStatusEnum"];
        };
        Insert: {
          created_at?: string | null;
          hasMoveInPermission?: boolean | null;
          id?: string;
          name?: string | null;
          ownerCottageUserID?: string | null;
          status?: Database["public"]["Enums"]["ExternalCompanyStatusEnum"];
        };
        Update: {
          created_at?: string | null;
          hasMoveInPermission?: boolean | null;
          id?: string;
          name?: string | null;
          ownerCottageUserID?: string | null;
          status?: Database["public"]["Enums"]["ExternalCompanyStatusEnum"];
        };
        Relationships: [
          {
            foreignKeyName: "ExternalCompany_ownerCottageUserID_fkey";
            columns: ["ownerCottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ExternalCompany_ownerCottageUserID_fkey";
            columns: ["ownerCottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ExternalCompany_ownerCottageUserID_fkey";
            columns: ["ownerCottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
            foreignKeyName: "ExternalCompanyEmployee_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ExternalCompanyEmployee_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ExternalCompanyEmployee_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ExternalCompanyEmployee_externalCompanyID_fkey";
            columns: ["externalCompanyID"];
            isOneToOne: false;
            referencedRelation: "ExternalCompany";
            referencedColumns: ["id"];
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
          targetPaymentMethodTypes: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"][] | null;
        };
        Insert: {
          created_at?: string;
          fixed?: number | null;
          id?: number;
          name?: string | null;
          percentage?: number | null;
          targetPaymentMethodTypes?: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"][] | null;
        };
        Update: {
          created_at?: string;
          fixed?: number | null;
          id?: number;
          name?: string | null;
          percentage?: number | null;
          targetPaymentMethodTypes?: Database["public"]["Enums"]["enum_CottageUsers_stripePaymentMethodType"][] | null;
        };
        Relationships: [];
      };
      GasAccount: {
        Row: {
          accountNumber: string | null;
          balanceAt: string | null;
          cottageUserID: string | null;
          createdAt: string | null;
          defaultBillFeeStructure: number | null;
          endDate: string | null;
          id: number;
          isAccountLinkedWithUtility: boolean | null;
          isActive: boolean | null;
          isEnrolledInUtilityAutoPay: boolean | null;
          isUnderCottageEIN: boolean | null;
          lastSync: string | null;
          linearTicketId: string | null;
          maintainedFor: string | null;
          nextUtilityPaymentDate: string | null;
          propertyID: number | null;
          retries: number;
          startDate: string | null;
          status: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          totalOutstandingBalance: number | null;
          uniqueIdentifier: string | null;
          updatedAt: string;
          utilityCompanyID: string | null;
        };
        Insert: {
          accountNumber?: string | null;
          balanceAt?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          endDate?: string | null;
          id?: number;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastSync?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          propertyID?: number | null;
          retries?: number;
          startDate?: string | null;
          status?: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
        };
        Update: {
          accountNumber?: string | null;
          balanceAt?: string | null;
          cottageUserID?: string | null;
          createdAt?: string | null;
          defaultBillFeeStructure?: number | null;
          endDate?: string | null;
          id?: number;
          isAccountLinkedWithUtility?: boolean | null;
          isActive?: boolean | null;
          isEnrolledInUtilityAutoPay?: boolean | null;
          isUnderCottageEIN?: boolean | null;
          lastSync?: string | null;
          linearTicketId?: string | null;
          maintainedFor?: string | null;
          nextUtilityPaymentDate?: string | null;
          propertyID?: number | null;
          retries?: number;
          startDate?: string | null;
          status?: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          totalOutstandingBalance?: number | null;
          uniqueIdentifier?: string | null;
          updatedAt?: string;
          utilityCompanyID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "GasAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "GasAccount_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gasaccount_defaultbillfeestructure_fkey";
            columns: ["defaultBillFeeStructure"];
            isOneToOne: false;
            referencedRelation: "FeeStructure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "GasAccount_maintainedFor_fkey";
            columns: ["maintainedFor"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasAccount_propertyID_fkey";
            columns: ["propertyID"];
            isOneToOne: false;
            referencedRelation: "Property";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasAccount_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
        ];
      };
      GasBill: {
        Row: {
          createdAt: string | null;
          deliveryCharge: number | null;
          dueDate: string | null;
          endDate: string;
          feeStructure: number | null;
          gasAccountID: number;
          id: number;
          isPaidUtilityCompany: boolean | null;
          isSendReminder: boolean | null;
          lastPaymentAttemptDate: string | null;
          manual: boolean | null;
          otherCharges: Json | null;
          paidByUser: string | null;
          paidNotificationSent: boolean | null;
          paymentDate: string | null;
          paymentStatus: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId: string | null;
          supplierCharge: number | null;
          ticketID: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee: number | null;
          utilityCompanyPaidAt: string | null;
          visible: boolean;
        };
        Insert: {
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          endDate: string;
          feeStructure?: number | null;
          gasAccountID: number;
          id?: number;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: Json | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate: string;
          statementDate: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue: number;
          totalUsage: number;
          transactionFee?: number | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Update: {
          createdAt?: string | null;
          deliveryCharge?: number | null;
          dueDate?: string | null;
          endDate?: string;
          feeStructure?: number | null;
          gasAccountID?: number;
          id?: number;
          isPaidUtilityCompany?: boolean | null;
          isSendReminder?: boolean | null;
          lastPaymentAttemptDate?: string | null;
          manual?: boolean | null;
          otherCharges?: Json | null;
          paidByUser?: string | null;
          paidNotificationSent?: boolean | null;
          paymentDate?: string | null;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          startDate?: string;
          statementDate?: string;
          stripePaymentId?: string | null;
          supplierCharge?: number | null;
          ticketID?: string | null;
          totalAmountDue?: number;
          totalUsage?: number;
          transactionFee?: number | null;
          utilityCompanyPaidAt?: string | null;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "GasBill_feeStructure_fkey";
            columns: ["feeStructure"];
            isOneToOne: false;
            referencedRelation: "FeeStructure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasBill_gasAccountID_fkey";
            columns: ["gasAccountID"];
            isOneToOne: false;
            referencedRelation: "GasAccount";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GasBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "GasBill_paidByUser_fkey";
            columns: ["paidByUser"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
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
            foreignKeyName: "GreenButtonMeterReading_greenButtonOAuthId_fkey";
            columns: ["greenButtonOAuthId"];
            isOneToOne: false;
            referencedRelation: "GreenButtonOAuth";
            referencedColumns: ["id"];
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
            foreignKeyName: "GreenButtonOAuth_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GreenButtonOAuth_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "GreenButtonOAuth_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GreenButtonOAuth_electricAccountID_fkey";
            columns: ["electricAccountID"];
            isOneToOne: false;
            referencedRelation: "ElectricAccount";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "GreenButtonOAuth_provider_fkey";
            columns: ["provider"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
      LinkAccountJob: {
        Row: {
          connectRequestId: string | null;
          createdAt: string | null;
          externalCompanyId: string;
          id: string;
          message: string | null;
          status: Database["public"]["Enums"]["enum_LinkAccountJob_status"];
          updatedAt: string | null;
        };
        Insert: {
          connectRequestId?: string | null;
          createdAt?: string | null;
          externalCompanyId: string;
          id?: string;
          message?: string | null;
          status: Database["public"]["Enums"]["enum_LinkAccountJob_status"];
          updatedAt?: string | null;
        };
        Update: {
          connectRequestId?: string | null;
          createdAt?: string | null;
          externalCompanyId?: string;
          id?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["enum_LinkAccountJob_status"];
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "LinkAccountJob_externalCompanyId_fkey";
            columns: ["externalCompanyId"];
            isOneToOne: false;
            referencedRelation: "ExternalCompany";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_LinkAccountJob_connectRequestId_fkey";
            columns: ["connectRequestId"];
            isOneToOne: false;
            referencedRelation: "ConnectRequest";
            referencedColumns: ["id"];
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
            foreignKeyName: "MeterReadings_electricAccountID_fkey";
            columns: ["electricAccountID"];
            isOneToOne: false;
            referencedRelation: "ElectricAccount";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "MeterReadings_gasAccountID_fkey";
            columns: ["gasAccountID"];
            isOneToOne: false;
            referencedRelation: "GasAccount";
            referencedColumns: ["id"];
          },
        ];
      };
      MoveInPartner: {
        Row: {
          id: string;
          imgURL: string | null;
          isThemed: boolean;
          name: string | null;
          themeID: string | null;
        };
        Insert: {
          id: string;
          imgURL?: string | null;
          isThemed?: boolean;
          name?: string | null;
          themeID?: string | null;
        };
        Update: {
          id?: string;
          imgURL?: string | null;
          isThemed?: boolean;
          name?: string | null;
          themeID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      Payments: {
        Row: {
          chargeId: string;
          feeStructure: number | null;
          id: string;
          paidBy: string;
          paidNotificationSent: boolean;
          paymentStatus: Database["public"]["Enums"]["paymentstatus"] | null;
          stripePaymentID: string | null;
          transactionFee: number;
        };
        Insert: {
          chargeId: string;
          feeStructure?: number | null;
          id?: string;
          paidBy: string;
          paidNotificationSent?: boolean;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          stripePaymentID?: string | null;
          transactionFee?: number;
        };
        Update: {
          chargeId?: string;
          feeStructure?: number | null;
          id?: string;
          paidBy?: string;
          paidNotificationSent?: boolean;
          paymentStatus?: Database["public"]["Enums"]["paymentstatus"] | null;
          stripePaymentID?: string | null;
          transactionFee?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Payments_chargeId_fkey";
            columns: ["chargeId"];
            isOneToOne: false;
            referencedRelation: "Charges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Payments_feeStructure_fkey";
            columns: ["feeStructure"];
            isOneToOne: false;
            referencedRelation: "FeeStructure";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Payments_paidBy_fkey";
            columns: ["paidBy"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Payments_paidBy_fkey";
            columns: ["paidBy"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Payments_paidBy_fkey";
            columns: ["paidBy"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      Property: {
        Row: {
          addressID: string | null;
          buildingID: string | null;
          createdAt: string | null;
          id: number;
          isRenewablePaidFor: boolean | null;
          type: Database["public"]["Enums"]["enum_Unit_residenceType"] | null;
          unitNumber: string | null;
        };
        Insert: {
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          id?: number;
          isRenewablePaidFor?: boolean | null;
          type?: Database["public"]["Enums"]["enum_Unit_residenceType"] | null;
          unitNumber?: string | null;
        };
        Update: {
          addressID?: string | null;
          buildingID?: string | null;
          createdAt?: string | null;
          id?: number;
          isRenewablePaidFor?: boolean | null;
          type?: Database["public"]["Enums"]["enum_Unit_residenceType"] | null;
          unitNumber?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Property_addressID_fkey";
            columns: ["addressID"];
            isOneToOne: false;
            referencedRelation: "Address";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Property_buildingID_fkey";
            columns: ["buildingID"];
            isOneToOne: false;
            referencedRelation: "Building";
            referencedColumns: ["id"];
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
          providerStatus: Database["public"]["Enums"]["providerStatus"];
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
          providerStatus?: Database["public"]["Enums"]["providerStatus"];
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
          providerStatus?: Database["public"]["Enums"]["providerStatus"];
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
            foreignKeyName: "Ratings_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Ratings_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Ratings_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
            foreignKeyName: "ReferralPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ReferralPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ReferralPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      Referrals: {
        Row: {
          createdAt: string | null;
          id: string;
          referralStatus: Database["public"]["Enums"]["referral_status"];
          referred: string | null;
          referredBy: string;
        };
        Insert: {
          createdAt?: string | null;
          id?: string;
          referralStatus?: Database["public"]["Enums"]["referral_status"];
          referred?: string | null;
          referredBy: string;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          referralStatus?: Database["public"]["Enums"]["referral_status"];
          referred?: string | null;
          referredBy?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
          status: Database["public"]["Enums"]["enum_RegistrationJob_status"];
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
          status?: Database["public"]["Enums"]["enum_RegistrationJob_status"];
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
          status?: Database["public"]["Enums"]["enum_RegistrationJob_status"];
          statusMessage?: string | null;
          updatedAt?: string | null;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_RegistrationJob_forCottageUserID_fkey";
            columns: ["forCottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_RegistrationJob_forCottageUserID_fkey";
            columns: ["forCottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_RegistrationJob_forCottageUserID_fkey";
            columns: ["forCottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "RegistrationJob_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
        ];
      };
      RenewableSubscriptionPayments: {
        Row: {
          amount: number | null;
          id: number;
          isProcessed: boolean | null;
          payerID: string | null;
          paymentDate: string | null;
          renewableSubscription: number | null;
          status: Database["public"]["Enums"]["stripepaymentstatus"] | null;
          stripePaymentID: string | null;
        };
        Insert: {
          amount?: number | null;
          id?: number;
          isProcessed?: boolean | null;
          payerID?: string | null;
          paymentDate?: string | null;
          renewableSubscription?: number | null;
          status?: Database["public"]["Enums"]["stripepaymentstatus"] | null;
          stripePaymentID?: string | null;
        };
        Update: {
          amount?: number | null;
          id?: number;
          isProcessed?: boolean | null;
          payerID?: string | null;
          paymentDate?: string | null;
          renewableSubscription?: number | null;
          status?: Database["public"]["Enums"]["stripepaymentstatus"] | null;
          stripePaymentID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "RenewableSubscriptionPayments_payerID_fkey";
            columns: ["payerID"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "RenewableSubscriptionPayments_renewableSubscription_fkey";
            columns: ["renewableSubscription"];
            isOneToOne: false;
            referencedRelation: "RenewableSubscriptions";
            referencedColumns: ["id"];
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
            foreignKeyName: "RenewableSubscriptions_cottageUserId_fkey";
            columns: ["cottageUserId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "RenewableSubscriptions_cottageUserId_fkey";
            columns: ["cottageUserId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "RenewableSubscriptions_cottageUserId_fkey";
            columns: ["cottageUserId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "RenewableSubscriptions_renewableSubscriptionPlan_fkey";
            columns: ["renewableSubscriptionPlan"];
            isOneToOne: false;
            referencedRelation: "RenewableSubscriptionPlan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "RenewableSubscriptions_unit_fkey";
            columns: ["propertyID"];
            isOneToOne: false;
            referencedRelation: "Property";
            referencedColumns: ["id"];
          },
        ];
      };
      Resident: {
        Row: {
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
            foreignKeyName: "Resident_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Resident_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Resident_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
          priorAddressID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ResidentIdentity_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ResidentIdentity_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ResidentIdentity_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ResidentIdentity_priorAddressID_fkey";
            columns: ["priorAddressID"];
            isOneToOne: false;
            referencedRelation: "Address";
            referencedColumns: ["id"];
          },
        ];
      };
      ResourceMix: {
        Row: {
          BeginDate: string;
          Coal: number | null;
          "Dual Fuel": number | null;
          electricZone: string;
          Hydro: number | null;
          LandfillGas: number | null;
          "Multiple Fuels": number | null;
          NaturalGas: number | null;
          NetImports: number | null;
          Nuclear: number | null;
          Oil: number | null;
          Other: number | null;
          "Other Fossil Fuels": number | null;
          "Other Renewables": number | null;
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
          "Dual Fuel"?: number | null;
          electricZone: string;
          Hydro?: number | null;
          LandfillGas?: number | null;
          "Multiple Fuels"?: number | null;
          NaturalGas?: number | null;
          NetImports?: number | null;
          Nuclear?: number | null;
          Oil?: number | null;
          Other?: number | null;
          "Other Fossil Fuels"?: number | null;
          "Other Renewables"?: number | null;
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
          "Dual Fuel"?: number | null;
          electricZone?: string;
          Hydro?: number | null;
          LandfillGas?: number | null;
          "Multiple Fuels"?: number | null;
          NaturalGas?: number | null;
          NetImports?: number | null;
          Nuclear?: number | null;
          Oil?: number | null;
          Other?: number | null;
          "Other Fossil Fuels"?: number | null;
          "Other Renewables"?: number | null;
          Refuse?: number | null;
          Renewables?: number | null;
          Solar?: number | null;
          Storage?: number | null;
          Wind?: number | null;
          Wood?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_ResourceMix_electricZone_fkey";
            columns: ["electricZone"];
            isOneToOne: false;
            referencedRelation: "ElectricZone";
            referencedColumns: ["id"];
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
          communitySolarAvailability: Database["public"]["Enums"]["serviceGroupCommunitySolarAvailability"] | null;
          id: string;
          isActiveReferralProgram: boolean | null;
          referralProgramAmount: number | null;
          renewableSubscriptionPlanID: number | null;
          status: Database["public"]["Enums"]["serviceGroupStatus"] | null;
          utilityCompanyID: string | null;
        };
        Insert: {
          activeSupplyPlanID?: number | null;
          communitySolarAvailability?: Database["public"]["Enums"]["serviceGroupCommunitySolarAvailability"] | null;
          id: string;
          isActiveReferralProgram?: boolean | null;
          referralProgramAmount?: number | null;
          renewableSubscriptionPlanID?: number | null;
          status?: Database["public"]["Enums"]["serviceGroupStatus"] | null;
          utilityCompanyID?: string | null;
        };
        Update: {
          activeSupplyPlanID?: number | null;
          communitySolarAvailability?: Database["public"]["Enums"]["serviceGroupCommunitySolarAvailability"] | null;
          id?: string;
          isActiveReferralProgram?: boolean | null;
          referralProgramAmount?: number | null;
          renewableSubscriptionPlanID?: number | null;
          status?: Database["public"]["Enums"]["serviceGroupStatus"] | null;
          utilityCompanyID?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ServiceGroup_activeSupplyPlanID_fkey";
            columns: ["activeSupplyPlanID"];
            isOneToOne: false;
            referencedRelation: "ElectricSupplyPlan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ServiceGroup_renewableSubscriptionPlanID_fkey";
            columns: ["renewableSubscriptionPlanID"];
            isOneToOne: false;
            referencedRelation: "RenewableSubscriptionPlan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ServiceGroup_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
            foreignKeyName: "ServiceZip_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
            foreignKeyName: "UtilityAccountPaymentState_electricAccount_fkey";
            columns: ["electricAccount"];
            isOneToOne: true;
            referencedRelation: "ElectricAccount";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "UtilityAccountPaymentState_gasAccount_fkey";
            columns: ["gasAccount"];
            isOneToOne: true;
            referencedRelation: "GasAccount";
            referencedColumns: ["id"];
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
        Relationships: [
          {
            foreignKeyName: "UtilityAPIReferrals_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
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
          checkOutageStatusURL: string | null;
          createdAt: string | null;
          electricZoneID: string | null;
          id: string;
          identityVerificationTypes: Database["public"]["Enums"]["identityVerificationType"][] | null;
          isActiveReferralProgram: boolean | null;
          isBillingRequired: boolean;
          isDocUploadRequired: boolean;
          isHandleBilling: boolean | null;
          isHandleMoveIns: boolean | null;
          isPriorAddressRequired: boolean;
          isReviewBilling: boolean;
          isSSNRequired: boolean | null;
          logoURL: string | null;
          name: string | null;
          outageMapURL: string | null;
          referralProgramAmount: number | null;
          registrationURL: string | null;
          reportOutageURL: string | null;
          signupReady: boolean | null;
          status: Database["public"]["Enums"]["utilityCompanyStatus"] | null;
          utilitiesHandled: Database["public"]["Enums"]["UtilityCompany_utilitiesHandled"][] | null;
          utilityCode: string | null;
          utilityIntegrationType: Database["public"]["Enums"]["utilityIntegrationType"] | null;
          website: string | null;
        };
        Insert: {
          checkOutageStatusURL?: string | null;
          createdAt?: string | null;
          electricZoneID?: string | null;
          id: string;
          identityVerificationTypes?: Database["public"]["Enums"]["identityVerificationType"][] | null;
          isActiveReferralProgram?: boolean | null;
          isBillingRequired?: boolean;
          isDocUploadRequired?: boolean;
          isHandleBilling?: boolean | null;
          isHandleMoveIns?: boolean | null;
          isPriorAddressRequired?: boolean;
          isReviewBilling?: boolean;
          isSSNRequired?: boolean | null;
          logoURL?: string | null;
          name?: string | null;
          outageMapURL?: string | null;
          referralProgramAmount?: number | null;
          registrationURL?: string | null;
          reportOutageURL?: string | null;
          signupReady?: boolean | null;
          status?: Database["public"]["Enums"]["utilityCompanyStatus"] | null;
          utilitiesHandled?: Database["public"]["Enums"]["UtilityCompany_utilitiesHandled"][] | null;
          utilityCode?: string | null;
          utilityIntegrationType?: Database["public"]["Enums"]["utilityIntegrationType"] | null;
          website?: string | null;
        };
        Update: {
          checkOutageStatusURL?: string | null;
          createdAt?: string | null;
          electricZoneID?: string | null;
          id?: string;
          identityVerificationTypes?: Database["public"]["Enums"]["identityVerificationType"][] | null;
          isActiveReferralProgram?: boolean | null;
          isBillingRequired?: boolean;
          isDocUploadRequired?: boolean;
          isHandleBilling?: boolean | null;
          isHandleMoveIns?: boolean | null;
          isPriorAddressRequired?: boolean;
          isReviewBilling?: boolean;
          isSSNRequired?: boolean | null;
          logoURL?: string | null;
          name?: string | null;
          outageMapURL?: string | null;
          referralProgramAmount?: number | null;
          registrationURL?: string | null;
          reportOutageURL?: string | null;
          signupReady?: boolean | null;
          status?: Database["public"]["Enums"]["utilityCompanyStatus"] | null;
          utilitiesHandled?: Database["public"]["Enums"]["UtilityCompany_utilitiesHandled"][] | null;
          utilityCode?: string | null;
          utilityIntegrationType?: Database["public"]["Enums"]["utilityIntegrationType"] | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ElectricCompany_electricZoneID_fkey";
            columns: ["electricZoneID"];
            isOneToOne: false;
            referencedRelation: "ElectricZone";
            referencedColumns: ["id"];
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
            foreignKeyName: "public_ElectricCompany_ServiceAccounts_id_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ElectricCompany_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ElectricCompany_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ElectricCompany_ServiceAccounts_serviceAccount_fkey";
            columns: ["serviceAccount"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      UtilityCompanyQuestion: {
        Row: {
          answerChoices: string[] | null;
          defaultValue: string | null;
          displayLocation: Database["public"]["Enums"]["UtilityCompanyQuestion_displayLocation"];
          id: string;
          inputType: Database["public"]["Enums"]["UtilityCompanyQuestion_inputType"];
          questionText: string;
          utilityCompanyID: string;
        };
        Insert: {
          answerChoices?: string[] | null;
          defaultValue?: string | null;
          displayLocation?: Database["public"]["Enums"]["UtilityCompanyQuestion_displayLocation"];
          id?: string;
          inputType?: Database["public"]["Enums"]["UtilityCompanyQuestion_inputType"];
          questionText: string;
          utilityCompanyID: string;
        };
        Update: {
          answerChoices?: string[] | null;
          defaultValue?: string | null;
          displayLocation?: Database["public"]["Enums"]["UtilityCompanyQuestion_displayLocation"];
          id?: string;
          inputType?: Database["public"]["Enums"]["UtilityCompanyQuestion_inputType"];
          questionText?: string;
          utilityCompanyID?: string;
        };
        Relationships: [
          {
            foreignKeyName: "UtilityCompanyQuestion_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
            foreignKeyName: "UtilityCompanyRefreshSettings_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
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
            foreignKeyName: "UtilityQuestionAnswer_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "UtilityQuestionAnswer_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "UtilityQuestionAnswer_cottageUserID_fkey";
            columns: ["cottageUserID"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "UtilityQuestionAnswer_questionID_fkey";
            columns: ["questionID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompanyQuestion";
            referencedColumns: ["id"];
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
      ViewCompanyCustomerPermission: {
        Row: {
          companyId: string | null;
          customerId: string | null;
          utilityAccounts: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "ConnectRequest_requestedFromId_fkey";
            columns: ["customerId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "public_ConnectRequest_requestorId_fkey";
            columns: ["companyId"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "CottageUsers_id_fkey";
            columns: ["cottageUserID"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ViewMoveInPartnerReferral: {
        Row: {
          id: string | null;
          imgURL: string | null;
          isThemed: boolean | null;
          name: string | null;
          referralCode: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "MoveInPartner_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
        ];
      };
      ViewReferralsWithResidentInfo: {
        Row: {
          createdAt: string | null;
          firstName: string | null;
          lastName: string | null;
          referralStatus: Database["public"]["Enums"]["referral_status"] | null;
          referred: string | null;
          referredBy: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Referrals_referred_fkey";
            columns: ["referred"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "CottageUsers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "ViewCottageUserWithUtilityAccount";
            referencedColumns: ["cottageUserID"];
          },
          {
            foreignKeyName: "Referrals_referredBy_fkey";
            columns: ["referredBy"];
            isOneToOne: false;
            referencedRelation: "ViewResidentDetails";
            referencedColumns: ["id"];
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
          paymentMethodStatus: Database["public"]["Enums"]["paymentmethodstatus"] | null;
          phone: string | null;
          referralCode: string | null;
          startServiceDate: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["enum_UtilityAccount_status"] | null;
          street: string | null;
          unitNumber: string | null;
          utilityCompanyID: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "CottageUsers_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ElectricAccount_utilityCompanyID_fkey";
            columns: ["utilityCompanyID"];
            isOneToOne: false;
            referencedRelation: "UtilityCompany";
            referencedColumns: ["id"];
          },
        ];
      };
      ViewServiceAccounts: {
        Row: {
          lookupID: string | null;
          serviceAccount: string | null;
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
      approve_user_external_company: {
        Args: {
          email_arg: string;
        };
        Returns: undefined;
      };
      electric_bill_rls_check: {
        Args: {
          id_check: string;
          test: number;
        };
        Returns: boolean;
      };
      gas_bill_rls_check: {
        Args: {
          id_check: string;
          test: number;
        };
        Returns: boolean;
      };
      get_green_button_sync_jobs_to_retry: {
        Args: Record<PropertyKey, never>;
        Returns: {
          greenbuttonoauthid: number;
          operation: string;
          status: string;
          subscriptionid: string;
          refreshtoken: string;
          userid: string;
          provider: string;
        }[];
      };
      get_meter_readings_interval: {
        Args: {
          electric_account_id: number;
          start_time: string;
          end_time: string;
        };
        Returns: {
          readingAt: string;
          reading: number;
        }[];
      };
      get_referrals: {
        Args: {
          userid: string;
        };
        Returns: {
          referred: string;
          referredBy: string;
          referralStatus: Database["public"]["Enums"]["referral_status"];
          firstName: string;
          lastName: string;
          createdAt: string;
        }[];
      };
      get_tables_and_columns: {
        Args: Record<PropertyKey, never>;
        Returns: {
          table_name: string;
          column_name: string;
        }[];
      };
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"];
        };
        Returns: unknown;
      };
      http_delete:
        | {
            Args: {
              uri: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              content: string;
              content_type: string;
            };
            Returns: unknown;
          };
      http_get:
        | {
            Args: {
              uri: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              data: Json;
            };
            Returns: unknown;
          };
      http_head: {
        Args: {
          uri: string;
        };
        Returns: unknown;
      };
      http_header: {
        Args: {
          field: string;
          value: string;
        };
        Returns: Database["public"]["CompositeTypes"]["http_header"];
      };
      http_list_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: {
          curlopt: string;
          value: string;
        }[];
      };
      http_patch: {
        Args: {
          uri: string;
          content: string;
          content_type: string;
        };
        Returns: unknown;
      };
      http_post:
        | {
            Args: {
              uri: string;
              content: string;
              content_type: string;
            };
            Returns: unknown;
          }
        | {
            Args: {
              uri: string;
              data: Json;
            };
            Returns: unknown;
          };
      http_put: {
        Args: {
          uri: string;
          content: string;
          content_type: string;
        };
        Returns: unknown;
      };
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      http_set_curlopt: {
        Args: {
          curlopt: string;
          value: string;
        };
        Returns: boolean;
      };
      retry_green_button_jobs:
        | {
            Args: {
              url: string;
            };
            Returns: {
              http_post: string;
            }[];
          }
        | {
            Args: {
              url: string;
              secret: string;
            };
            Returns: {
              http_post: string;
            }[];
          };
      retry_utility_automation_jobs: {
        Args: {
          url: string;
          secret: string;
        };
        Returns: {
          http_post: string;
        }[];
      };
      urlencode:
        | {
            Args: {
              data: Json;
            };
            Returns: string;
          }
        | {
            Args: {
              string: string;
            };
            Returns: string;
          }
        | {
            Args: {
              string: string;
            };
            Returns: string;
          };
    };
    Enums: {
      enum_CottageUsers_cottageConnectUserType: "CUSTOMER" | "COMPANY" | "REFERRAL_PARTNER" | "BUILDING" | "MOVE_IN" | "SERVICE_ACCOUNT";
      enum_CottageUsers_stripePaymentMethodType: "card" | "us_bank_account";
      enum_ElectricAccount_communitySolarStatus: "NONE" | "PENDING" | "ENROLLED";
      enum_ElectricAccount_supplyStatus: "DEFAULT" | "CHANGE_PENDING" | "NON_DEFAULT";
      enum_ElectricSupplyPlan_rateType: "FIXED" | "VARIABLE" | "TIME_OF_USE";
      enum_LinkAccountJob_status: "PENDING" | "SUCCESS" | "ERROR" | "MFA_CODE_PENDING" | "MFA_CODE_VALID";
      enum_RegistrationJob_status: "FAILED" | "COMPLETE" | "RUNNING";
      enum_Unit_residenceType: "APARTMENT" | "HOME";
      enum_UtilityAccount_status:
        | "NEW"
        | "PENDING_CREATE"
        | "ACTIVE"
        | "INACTIVE"
        | "PENDING_SYNC"
        | "PENDING_ONLINE_ACCOUNT_CREATION"
        | "PENDING_START_SERVICE"
        | "PENDING_ISSUE"
        | "PENDING_ACCOUNT_NUMBER"
        | "PENDING_FIRST_BILL"
        | "RESYNC_REQUIRED";
      ExternalCompanyStatusEnum: "PENDING" | "APPROVED";
      identityVerificationType: "ssn" | "driversLicense" | "passport" | "publicAssistanceID" | "alienID";
      paymentmethodstatus: "VALID" | "INVALID";
      paymentstatus: "processing" | "succeeded" | "failed" | "scheduled_for_payment" | "waiting_for_user" | "canceled";
      providerStatus: "AVAILABLE" | "DEGRADED" | "DOWN";
      referral_status: "pending" | "complete" | "invalid";
      serviceGroupCommunitySolarAvailability: "NONE" | "WAITLIST" | "ACTIVE";
      serviceGroupStatus: "ACTIVE" | "BETA" | "NOT_ACTIVE";
      stripepaymentstatus:
        | "requires_payment_method"
        | "requires_confirmation"
        | "requires_action"
        | "processing"
        | "requires_capture"
        | "canceled"
        | "succeeded";
      UtilityCompany_utilitiesHandled: "gas" | "electricity";
      UtilityCompanyQuestion_displayLocation: "moveIn" | "ev";
      UtilityCompanyQuestion_inputType:
        | "text"
        | "radio"
        | "textarea"
        | "checkbox"
        | "select"
        | "button"
        | "submit"
        | "reset"
        | "file"
        | "hidden"
        | "image"
        | "date"
        | "email"
        | "number"
        | "url";
      utilityCompanyStatus: "BETA" | "ACTIVE" | "NOT_ACTIVE";
      utilityIntegrationType: "greenButton" | "automation" | "other" | "utilityCode";
    };
    CompositeTypes: {
      http_header: {
        field: string | null;
        value: string | null;
      };
      http_request: {
        method: unknown | null;
        uri: string | null;
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null;
        content_type: string | null;
        content: string | null;
      };
      http_response: {
        status: number | null;
        content_type: string | null;
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null;
        content: string | null;
      };
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;
