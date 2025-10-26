import backendApi from "@/api/api";
import type {
  AssistanceReport,
  CaseReport,
  CategoriesReport,
  EventsReport,
  EnhancedAssistanceReport,
  AssistanceReportFilters,
  AssistanceReportFieldSelection,
  EnhancedCaseReport,
  CaseReportFilters,
  CaseReportFieldSelection,
  EnhancedReferralReport,
  ReferralReportFilters,
  ReferralReportFieldSelection,
  CategoryReportFilters,
  CategoryReportFieldSelection,
  EnhancedCategoryReport,
  EventReportFilters,
  EventReportFieldSelection,
  EventReportApiResponse,
  EnhancedOutcomeReport,
  OutcomeReportFilters,
  OutcomeReportFieldSelection,
  OutcomeGoalsReportFilters,
  OutcomeGoalsReportFieldSelection,
  EnhancedOutcomeGoalsReport,
} from "@/types";
import type { ApiResponse } from "@/types/api";

export const fetchAssistanceReport = async (
  caseId?: string,
  categoryId?: string,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();
    if (caseId) params.append("caseId", String(caseId));
    if (categoryId) params.append("categoryId", String(categoryId));
    const response = await backendApi.get<ApiResponse<AssistanceReport>>(
      `/api/reports/assistance?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching assistance report:", error);
    throw error;
  }
};

export const fetchEnhancedAssistanceReport = async (
  filters: AssistanceReportFilters,
  fieldSelection: AssistanceReportFieldSelection,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      params.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters.amountRange?.minAmount !== undefined) {
      params.append("minAmount", String(filters.amountRange.minAmount));
    }
    if (filters.amountRange?.maxAmount !== undefined) {
      params.append("maxAmount", String(filters.amountRange.maxAmount));
    }
    if (filters.demographics?.minAge !== undefined) {
      params.append("minAge", String(filters.demographics.minAge));
    }
    if (filters.demographics?.maxAge !== undefined) {
      params.append("maxAge", String(filters.demographics.maxAge));
    }
    if (filters.demographics?.gender) {
      params.append("gender", filters.demographics.gender);
    }
    if (filters.location?.county) {
      params.append("county", filters.location.county);
    }
    if (filters.location?.zipCode) {
      params.append("zipCode", filters.location.zipCode);
    }
    if (filters.location?.city) {
      params.append("city", filters.location.city);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }
    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId);
    }

    // Add field selection
    if (fieldSelection.orderBy) {
      params.append("orderBy", fieldSelection.orderBy);
    }
    if (fieldSelection.orderDirection) {
      params.append("orderDirection", fieldSelection.orderDirection);
    }
    if (fieldSelection.includeAssistanceSummary !== undefined) {
      params.append(
        "includeAssistanceSummary",
        String(fieldSelection.includeAssistanceSummary)
      );
    }
    if (fieldSelection.includeAssistanceRecord !== undefined) {
      params.append(
        "includeAssistanceRecord",
        String(fieldSelection.includeAssistanceRecord)
      );
    }

    // Summary fields
    if (fieldSelection.summaryAssistanceAmount !== undefined) {
      params.append(
        "summaryAssistanceAmount",
        String(fieldSelection.summaryAssistanceAmount)
      );
    }
    if (fieldSelection.summaryAssistanceCount !== undefined) {
      params.append(
        "summaryAssistanceCount",
        String(fieldSelection.summaryAssistanceCount)
      );
    }
    if (fieldSelection.summaryCaseCount !== undefined) {
      params.append(
        "summaryCaseCount",
        String(fieldSelection.summaryCaseCount)
      );
    }
    if (fieldSelection.summaryHouseholdCount !== undefined) {
      params.append(
        "summaryHouseholdCount",
        String(fieldSelection.summaryHouseholdCount)
      );
    }
    if (fieldSelection.summaryAgeRanges !== undefined) {
      params.append(
        "summaryAgeRanges",
        String(fieldSelection.summaryAgeRanges)
      );
    }
    if (fieldSelection.summaryHouseholdAgeRanges !== undefined) {
      params.append(
        "summaryHouseholdAgeRanges",
        String(fieldSelection.summaryHouseholdAgeRanges)
      );
    }

    // Case fields
    if (fieldSelection.caseNumber !== undefined) {
      params.append("caseNumber", String(fieldSelection.caseNumber));
    }
    if (fieldSelection.caseFullName !== undefined) {
      params.append("caseFullName", String(fieldSelection.caseFullName));
    }
    if (fieldSelection.caseCounty !== undefined) {
      params.append("caseCounty", String(fieldSelection.caseCounty));
    }
    if (fieldSelection.caseStreetAddress !== undefined) {
      params.append(
        "caseStreetAddress",
        String(fieldSelection.caseStreetAddress)
      );
    }
    if (fieldSelection.caseDateOfBirth !== undefined) {
      params.append("caseDateOfBirth", String(fieldSelection.caseDateOfBirth));
    }
    if (fieldSelection.casePhoneNumbers !== undefined) {
      params.append(
        "casePhoneNumbers",
        String(fieldSelection.casePhoneNumbers)
      );
    }
    if (fieldSelection.caseEntryDate !== undefined) {
      params.append("caseEntryDate", String(fieldSelection.caseEntryDate));
    }
    if (fieldSelection.casePersonalIncome !== undefined) {
      params.append(
        "casePersonalIncome",
        String(fieldSelection.casePersonalIncome)
      );
    }

    // Assistance fields
    if (fieldSelection.assistanceDate !== undefined) {
      params.append("assistanceDate", String(fieldSelection.assistanceDate));
    }
    if (fieldSelection.assistanceAgentName !== undefined) {
      params.append(
        "assistanceAgentName",
        String(fieldSelection.assistanceAgentName)
      );
    }
    if (fieldSelection.assistanceAgencyName !== undefined) {
      params.append(
        "assistanceAgencyName",
        String(fieldSelection.assistanceAgencyName)
      );
    }
    if (fieldSelection.assistanceCategory !== undefined) {
      params.append(
        "assistanceCategory",
        String(fieldSelection.assistanceCategory)
      );
    }
    if (fieldSelection.assistanceAmount !== undefined) {
      params.append(
        "assistanceAmount",
        String(fieldSelection.assistanceAmount)
      );
    }
    if (fieldSelection.assistanceUnit !== undefined) {
      params.append("assistanceUnit", String(fieldSelection.assistanceUnit));
    }
    if (fieldSelection.assistanceDescription !== undefined) {
      params.append(
        "assistanceDescription",
        String(fieldSelection.assistanceDescription)
      );
    }
    if (fieldSelection.assistanceOtherFields !== undefined) {
      params.append(
        "assistanceOtherFields",
        String(fieldSelection.assistanceOtherFields)
      );
    }

    const response = await backendApi.get<
      ApiResponse<EnhancedAssistanceReport>
    >(`/api/assistance-reports?${params.toString()}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching enhanced assistance report:", error);
    throw error;
  }
};

export const fetchEnhancedCaseReport = async (
  filters: CaseReportFilters,
  fieldSelection: CaseReportFieldSelection,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      params.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters.demographics?.minAge) {
      params.append("minAge", String(filters.demographics.minAge));
    }
    if (filters.demographics?.maxAge) {
      params.append("maxAge", String(filters.demographics.maxAge));
    }
    if (filters.demographics?.gender) {
      params.append("gender", filters.demographics.gender);
    }
    if (filters.demographics?.maritalStatus) {
      params.append("maritalStatus", filters.demographics.maritalStatus);
    }
    if (filters.location?.county) {
      params.append("county", filters.location.county);
    }
    if (filters.location?.zipCode) {
      params.append("zipCode", filters.location.zipCode);
    }
    if (filters.location?.city) {
      params.append("city", filters.location.city);
    }
    if (filters.location?.state) {
      params.append("state", filters.location.state);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }

    // Add field selection
    if (fieldSelection.orderBy) {
      params.append("orderBy", fieldSelection.orderBy);
    }
    if (fieldSelection.orderDirection) {
      params.append("orderDirection", fieldSelection.orderDirection);
    }
    if (fieldSelection.includeReportFilters !== undefined) {
      params.append(
        "includeReportFilters",
        String(fieldSelection.includeReportFilters)
      );
    }
    if (fieldSelection.includeCaseSummary !== undefined) {
      params.append(
        "includeCaseSummary",
        String(fieldSelection.includeCaseSummary)
      );
    }
    if (fieldSelection.includeCaseRecords !== undefined) {
      params.append(
        "includeCaseRecords",
        String(fieldSelection.includeCaseRecords)
      );
    }
    if (fieldSelection.summaryTotalCases !== undefined) {
      params.append(
        "summaryTotalCases",
        String(fieldSelection.summaryTotalCases)
      );
    }
    if (fieldSelection.summaryAgeRanges !== undefined) {
      params.append(
        "summaryAgeRanges",
        String(fieldSelection.summaryAgeRanges)
      );
    }
    if (fieldSelection.summaryGenderDistribution !== undefined) {
      params.append(
        "summaryGenderDistribution",
        String(fieldSelection.summaryGenderDistribution)
      );
    }
    if (fieldSelection.summaryHouseholdSizes !== undefined) {
      params.append(
        "summaryHouseholdSizes",
        String(fieldSelection.summaryHouseholdSizes)
      );
    }
    if (fieldSelection.summaryTotalAssistanceAmount !== undefined) {
      params.append(
        "summaryTotalAssistanceAmount",
        String(fieldSelection.summaryTotalAssistanceAmount)
      );
    }
    if (fieldSelection.summaryTotalAssistanceCount !== undefined) {
      params.append(
        "summaryTotalAssistanceCount",
        String(fieldSelection.summaryTotalAssistanceCount)
      );
    }
    if (fieldSelection.caseNumber !== undefined) {
      params.append("caseNumber", String(fieldSelection.caseNumber));
    }
    if (fieldSelection.caseEntryDate !== undefined) {
      params.append("caseEntryDate", String(fieldSelection.caseEntryDate));
    }
    if (fieldSelection.caseEntryAgent !== undefined) {
      params.append("caseEntryAgent", String(fieldSelection.caseEntryAgent));
    }
    if (fieldSelection.caseEntryAgency !== undefined) {
      params.append("caseEntryAgency", String(fieldSelection.caseEntryAgency));
    }
    if (fieldSelection.caseFullName !== undefined) {
      params.append("caseFullName", String(fieldSelection.caseFullName));
    }
    if (fieldSelection.caseMaidenName !== undefined) {
      params.append("caseMaidenName", String(fieldSelection.caseMaidenName));
    }
    if (fieldSelection.caseNickname !== undefined) {
      params.append("caseNickname", String(fieldSelection.caseNickname));
    }
    if (fieldSelection.caseDateOfBirth !== undefined) {
      params.append("caseDateOfBirth", String(fieldSelection.caseDateOfBirth));
    }
    if (fieldSelection.caseAge !== undefined) {
      params.append("caseAge", String(fieldSelection.caseAge));
    }
    if (fieldSelection.caseSSNumber !== undefined) {
      params.append("caseSSNumber", String(fieldSelection.caseSSNumber));
    }
    if (fieldSelection.caseStreetAddress !== undefined) {
      params.append(
        "caseStreetAddress",
        String(fieldSelection.caseStreetAddress)
      );
    }
    if (fieldSelection.caseCounty !== undefined) {
      params.append("caseCounty", String(fieldSelection.caseCounty));
    }
    if (fieldSelection.caseMailingAddress !== undefined) {
      params.append(
        "caseMailingAddress",
        String(fieldSelection.caseMailingAddress)
      );
    }
    if (fieldSelection.casePersonalIncome !== undefined) {
      params.append(
        "casePersonalIncome",
        String(fieldSelection.casePersonalIncome)
      );
    }
    if (fieldSelection.caseHouseholdIncome !== undefined) {
      params.append(
        "caseHouseholdIncome",
        String(fieldSelection.caseHouseholdIncome)
      );
    }
    if (fieldSelection.casePersonalExpenses !== undefined) {
      params.append(
        "casePersonalExpenses",
        String(fieldSelection.casePersonalExpenses)
      );
    }
    if (fieldSelection.caseHouseholdExpenses !== undefined) {
      params.append(
        "caseHouseholdExpenses",
        String(fieldSelection.caseHouseholdExpenses)
      );
    }
    if (fieldSelection.casePhoneNumbers !== undefined) {
      params.append(
        "casePhoneNumbers",
        String(fieldSelection.casePhoneNumbers)
      );
    }
    if (fieldSelection.caseEmail !== undefined) {
      params.append("caseEmail", String(fieldSelection.caseEmail));
    }
    if (fieldSelection.caseIdentificationNumbers !== undefined) {
      params.append(
        "caseIdentificationNumbers",
        String(fieldSelection.caseIdentificationNumbers)
      );
    }
    if (fieldSelection.caseDemographics !== undefined) {
      params.append(
        "caseDemographics",
        String(fieldSelection.caseDemographics)
      );
    }
    if (fieldSelection.caseAssistanceCount !== undefined) {
      params.append(
        "caseAssistanceCount",
        String(fieldSelection.caseAssistanceCount)
      );
    }
    if (fieldSelection.caseAssistanceAmount !== undefined) {
      params.append(
        "caseAssistanceAmount",
        String(fieldSelection.caseAssistanceAmount)
      );
    }
    if (fieldSelection.caseLastAssistanceDate !== undefined) {
      params.append(
        "caseLastAssistanceDate",
        String(fieldSelection.caseLastAssistanceDate)
      );
    }
    if (fieldSelection.caseHouseholdSize !== undefined) {
      params.append(
        "caseHouseholdSize",
        String(fieldSelection.caseHouseholdSize)
      );
    }
    if (fieldSelection.caseOtherInfo !== undefined) {
      params.append("caseOtherInfo", String(fieldSelection.caseOtherInfo));
    }

    const response = await backendApi.get<ApiResponse<EnhancedCaseReport>>(
      `/api/case-reports?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching enhanced case report:", error);
    throw error;
  }
};

export const fetchEnhancedReferralReport = async (
  filters: ReferralReportFilters,
  fieldSelection: ReferralReportFieldSelection,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      params.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters.deadlineRange?.startDate) {
      params.append("deadlineStartDate", filters.deadlineRange.startDate);
    }
    if (filters.deadlineRange?.endDate) {
      params.append("deadlineEndDate", filters.deadlineRange.endDate);
    }
    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.amountRange?.minAmount !== undefined) {
      params.append("minAmount", String(filters.amountRange.minAmount));
    }
    if (filters.amountRange?.maxAmount !== undefined) {
      params.append("maxAmount", String(filters.amountRange.maxAmount));
    }
    if (filters.requestedAmountRange?.minAmount !== undefined) {
      params.append(
        "minRequestedAmount",
        String(filters.requestedAmountRange.minAmount)
      );
    }
    if (filters.requestedAmountRange?.maxAmount !== undefined) {
      params.append(
        "maxRequestedAmount",
        String(filters.requestedAmountRange.maxAmount)
      );
    }
    if (filters.serviceType) {
      params.append("serviceType", filters.serviceType);
    }
    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId);
    }
    if (filters.unitId) {
      params.append("unitId", filters.unitId);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }
    if (filters.agencyId) {
      params.append("agencyId", filters.agencyId);
    }
    if (filters.locationId) {
      params.append("locationId", filters.locationId);
    }

    // Add field selection
    if (fieldSelection.orderBy) {
      params.append("orderBy", fieldSelection.orderBy);
    }
    if (fieldSelection.orderDirection) {
      params.append("orderDirection", fieldSelection.orderDirection);
    }

    // Add all field selection parameters
    Object.entries(fieldSelection).forEach(([key, value]) => {
      if (
        key !== "orderBy" &&
        key !== "orderDirection" &&
        value !== undefined
      ) {
        params.append(key, String(value));
      }
    });

    const response = await backendApi.get<ApiResponse<EnhancedReferralReport>>(
      `/api/referral-reports?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching enhanced referral report:", error);
    throw error;
  }
};

export const fetchEnhancedCategoryReport = async (
  filters: CategoryReportFilters,
  fieldSelection: CategoryReportFieldSelection,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<EnhancedCategoryReport>> => {
  const params = new URLSearchParams();

  // Add filters
  if (filters.dateRange?.startDate) {
    params.append("startDate", filters.dateRange.startDate);
  }
  if (filters.dateRange?.endDate) {
    params.append("endDate", filters.dateRange.endDate);
  }
  if (filters.lastUpdatedRange?.startDate) {
    params.append("lastUpdatedStartDate", filters.lastUpdatedRange.startDate);
  }
  if (filters.lastUpdatedRange?.endDate) {
    params.append("lastUpdatedEndDate", filters.lastUpdatedRange.endDate);
  }
  if (filters.sectionId) {
    params.append("sectionId", filters.sectionId);
  }
  if (filters.unitId) {
    params.append("unitId", filters.unitId);
  }
  if (filters.amountRange?.minAmount) {
    params.append("minAmount", String(filters.amountRange.minAmount));
  }
  if (filters.amountRange?.maxAmount) {
    params.append("maxAmount", String(filters.amountRange.maxAmount));
  }
  if (filters.visibility) {
    params.append("visibility", filters.visibility);
  }
  if (filters.createdBy) {
    params.append("createdBy", filters.createdBy);
  }
  if (filters.usageCount?.minCount) {
    params.append("minUsageCount", String(filters.usageCount.minCount));
  }
  if (filters.usageCount?.maxCount) {
    params.append("maxUsageCount", String(filters.usageCount.maxCount));
  }

  // Add field selection
  Object.entries(fieldSelection).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });

  const response = await backendApi.get<ApiResponse<EnhancedCategoryReport>>(
    `/api/category-reports?${params.toString()}`,
    {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    }
  );

  return response.data;
};

export const fetchEnhancedEventReport = async (
  filters: EventReportFilters,
  fieldSelection: EventReportFieldSelection,
  userId: string,
  locationId: string
): Promise<ApiResponse<EventReportApiResponse>> => {
  const params = new URLSearchParams();

  // Add filters
  if (filters.dateRange?.startDate) {
    params.append("startDate", filters.dateRange.startDate);
  }
  if (filters.dateRange?.endDate) {
    params.append("endDate", filters.dateRange.endDate);
  }
  if (filters.eventTypeId) {
    params.append("eventTypeId", filters.eventTypeId);
  }
  if (filters.eventLocationId) {
    params.append("eventLocationId", filters.eventLocationId);
  }
  if (filters.facilitatorId) {
    params.append("facilitatorId", filters.facilitatorId);
  }
  if (filters.createdBy) {
    params.append("createdBy", filters.createdBy);
  }
  if (filters.agencyId) {
    params.append("agencyId", filters.agencyId);
  }
  if (filters.locationId) {
    params.append("locationId", filters.locationId);
  }
  if (filters.activityTypeId) {
    params.append("activityTypeId", filters.activityTypeId);
  }
  if (filters.activityValue?.minValue) {
    params.append("minActivityValue", String(filters.activityValue.minValue));
  }
  if (filters.activityValue?.maxValue) {
    params.append("maxActivityValue", String(filters.activityValue.maxValue));
  }

  if (filters.eventVisibility) {
    params.append("visibilityFilter", filters.eventVisibility);
  }

  // Add field selection
  Object.entries(fieldSelection).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });

  const response = await backendApi.get<ApiResponse<EventReportApiResponse>>(
    `/api/event-reports?${params.toString()}`,
    {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    }
  );

  return response.data;
};

export const fetchCasesReport = async (
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<CaseReport>>(
      "/api/reports/cases",
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching cases report:", error);
    throw error;
  }
};

export const fetchCategoriesReport = async (
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<CategoriesReport>>(
      "/api/reports/categories",
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching categories report:", error);
    throw error;
  }
};

export const fetchEventsReport = async (
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<EventsReport>>(
      "/api/reports/events",
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching events report:", error);
    throw error;
  }
};

export const fetchEnhancedOutcomeReport = async (
  filters: OutcomeReportFilters,
  fieldSelection: OutcomeReportFieldSelection,
  userId?: string,
  locationId?: string
) => {
  try {
    // Prepare request body with filters and field selection
    const requestBody = {
      filters: {
        dateRange: filters.dateRange,
        dueDateRange: filters.dueDateRange,
        outcomeStatus: filters.outcomeStatus,
        goalStatus: filters.goalStatus,
        sectionStatus: filters.sectionStatus,
        goalType: filters.goalType,
        goalCompletionStatus: filters.goalCompletionStatus,
        createdBy: filters.createdBy,
        agencyId: filters.agencyId,
        locationId: filters.locationId,
        caseId: filters.caseId, // This is now an array of case IDs
        caseDemographics: filters.caseDemographics,
      },
      fieldSelection: fieldSelection,
    };

    const response = await backendApi.post<ApiResponse<EnhancedOutcomeReport>>(
      `/api/outcome-reports`,
      requestBody,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error fetching enhanced outcome report:", error);
    throw error;
  }
};

export const fetchEnhancedOutcomeGoalsReport = async (
  filters: OutcomeGoalsReportFilters,
  fieldSelection: OutcomeGoalsReportFieldSelection,
  userId?: string,
  locationId?: string
) => {
  try {
    // Prepare request body with filters and field selection
    const requestBody = {
      filters: {
        dateRange: filters.dateRange,
        dueDateRange: filters.dueDateRange,
        completionDateRange: filters.completionDateRange,
        goalId: filters.goalId,
        goalName: filters.goalName,
        sectionId: filters.sectionId,
        goalType: filters.goalType,
        goalStatus: filters.goalStatus,
        createdBy: filters.createdBy,
        agencyId: filters.agencyId,
        locationId: filters.locationId,
      },
      fieldSelection: fieldSelection,
    };

    const response = await backendApi.post<
      ApiResponse<EnhancedOutcomeGoalsReport>
    >(`/api/outcome-reports/goals`, requestBody, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error) {
    console.error("Error fetching enhanced outcome goals report:", error);
    throw error;
  }
};
