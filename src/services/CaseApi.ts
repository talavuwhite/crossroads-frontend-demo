import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type {
  CaseHistoryItem,
  CaseReport,
  CaseType,
  Pagination,
  RecentCase,
  RecentSearch,
  RelatedCounts,
  RelationshipsResponseData,
  SearchCaseFormValues,
  SearchMergeCaseResult,
} from "@/types/case";

export const fetchCaseById = async (
  id: string,
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<CaseType>>(
      `/api/cases/${id}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching case by ID:", error);
    throw error;
  }
};

export const deleteCase = async (
  id: string,
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/cases/${id}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
};

export const searchCasesForMerge = async (
  name?: string,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();
    if (name) {
      params.append("name", name);
      params.append("caseId", name);
    }

    const response = await backendApi.get<ApiResponse<SearchMergeCaseResult[]>>(
      `/api/cases/search/merge?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error searching cases for merge:", error);
    throw error;
  }
};

export const createCase = async (
  caseData: any,
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<CaseType>>(
      `/api/cases`,
      caseData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
};

export const updateCase = async (
  id: string,
  caseData: any,
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.put<ApiResponse<CaseType>>(
      `/api/cases/${id}`,
      caseData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
};

export const fetchCaseHistory = async (caseId: string) => {
  try {
    const response = await backendApi.get<ApiResponse<CaseHistoryItem>>(
      `/api/cases/${caseId}/history`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching case history:", error);
    throw error;
  }
};

export const mergeCases = async (
  keptId: string,
  removedId: string,
  mergedFields: Record<string, any>,
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<CaseType>>(
      `/api/cases/merge`,
      {
        keepId: keptId,
        removeId: removedId,
        mergedFields: mergedFields,
      },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error merging cases:", error);
    throw error;
  }
};

export const createCaseRelationship = async (
  data: {
    caseAId: string;
    caseBId: string;
    relationshipType: string[];
    customLabelAtoB?: string;
    customLabelBtoA?: string;
  },
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.post<
      ApiResponse<RelationshipsResponseData>
    >("/api/case-relationships", data, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating relationship:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create relationship"
    );
  }
};

export const fetchCaseRelationships = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<
      ApiResponse<RelationshipsResponseData>
    >(`/api/case-relationships/${caseId}?page=${page}&limit=${limit}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching case relationships:", error);
    throw error;
  }
};

export const updateCaseRelationship = async (
  relationshipId: string,
  data: {
    relationshipType: string[];
    customLabelAtoB?: string;
    customLabelBtoA?: string;
  },
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.put<
      ApiResponse<RelationshipsResponseData>
    >(`/api/case-relationships/${relationshipId}`, data, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating relationship:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update relationship"
    );
  }
};

export const deleteCaseRelationship = async (
  relationshipId: string,
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/case-relationships/${relationshipId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting relationship:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete relationship"
    );
  }
};

export const flagCase = async (
  caseId: string,
  message: string,
  userId: string,
  locationId?: string
): Promise<ApiResponse<null>> => {
  try {
    const response = await backendApi.post<ApiResponse<null>>(
      `/api/cases/flag/${caseId}`,
      { message },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data as ApiResponse<null>;
  } catch (error: any) {
    console.error("Error flagging case:", error);
    throw new Error(error.response?.data?.message || "Failed to flag case");
  }
};

export const addRecentCases = async (
  caseId: string,
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<CaseType[]>>(
      `/api/recent/cases`,
      { caseId },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching recent cases:", error);
    throw error;
  }
};

export const getRecentCases = async (userId: string, locationId?: string) => {
  try {
    const response = await backendApi.get<ApiResponse<RecentCase[]>>(
      `/api/recent/cases`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error getting recent cases:", error);
    throw error.response?.data?.message;
  }
};

export const getRecentSearchTerms = async (
  userId: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<RecentSearch[]>>(
      `/api/recent/searches`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error getting recent search terms:", error);
    throw error.response?.data?.message;
  }
};

export const searchCases = async (
  searchParams: SearchCaseFormValues,
  userId: string,
  locationId?: string,
  page: number = 1,
  limit: number = 10,
  isRecentClick: boolean = false
) => {
  try {
    const params = new URLSearchParams();
    if (searchParams.name) params.append("name", searchParams.name);
    if (searchParams.firstName)
      params.append("firstName", searchParams.firstName);
    if (searchParams.lastName) params.append("lastName", searchParams.lastName);
    if (searchParams.caseId) params.append("caseId", searchParams.caseId);
    if (searchParams.dateOfBirth) {
      const date = new Date(searchParams.dateOfBirth);
      if (!isNaN(date.getTime())) {
        params.append("dateOfBirth", date.toISOString().split("T")[0]);
      }
    }
    if (searchParams.ssn) params.append("ssn", searchParams.ssn);
    if (searchParams.address) params.append("address", searchParams.address);
    if (searchParams.city) params.append("city", searchParams.city);
    if (searchParams.state) params.append("state", searchParams.state);
    if (searchParams.zip) params.append("zip", searchParams.zip);
    if (searchParams.phoneNumber)
      params.append("phoneNumber", searchParams.phoneNumber);
    if (searchParams.email) params.append("email", searchParams.email);
    if (searchParams.headOfHousehold) params.append("headOfHousehold", "true");

    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const response = await backendApi.post<
      ApiResponse<{
        results: CaseType[];
        pagination: Pagination;
      }>
    >(
      `/api/recent/searches?${params.toString()}`,
      {},
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "x-recent-click": isRecentClick.toString(),
          "Content-Type": "application/json",
        },
      }
    );

    return {
      results: response.data.data.results,
      total: response.data.data.pagination.total,
      page: response.data.data.pagination.page,
      limit: response.data.data.pagination.limit,
      totalPages: response.data.data.pagination.totalPages,
    };
  } catch (error: any) {
    console.error("Error searching cases:", error);
    throw error.response?.data?.message || "Failed to search cases";
  }
};

// =============================================================
// 4. MANAGE CASE OUTCOMES
// =============================================================
// These APIs and types are for managing case outcomes (goal sets)

// Represents a single case outcome goal set
export interface ICaseOutcomeGoal {
  _id: string;
  name: string;
  goalName?: string; // -> Alternative name property for goal
  status?: string;
  statusName?: string; // -> Alternative status property for goal
  dueDate?: string;
  isComplete?: boolean;
}

// Represents a section within a case outcome
export interface ICaseOutcomeSection {
  section: string;
  sectionName: string;
  goals: ICaseOutcomeGoal[];
}

// Represents the creator of a case outcome
export interface ICaseOutcomeCreator {
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
}

// Represents goal statistics for a case outcome
export interface ICaseOutcomeGoalStats {
  percentComplete: number;
  completedGoals: number;
  totalGoals: number;
  label: string;
}

// Represents a history item for case outcomes
export interface ICaseOutcomeHistory {
  action: string;
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  goalName: string;
  status: string;
  date: string;
}

// Represents a comment for case outcomes
export interface ICaseOutcomeComment {
  _id: string;
  createdBy: {
    userId: string;
    userName: string;
    companyId: string;
    companyName: string;
  };
  text: string;
  file?: string;
  createdAt: string;
}

// Represents a single case outcome (goal set)
export interface ICaseOutcome {
  _id: string;
  title: string;
  status: string;
  caseId: string;
  sections: ICaseOutcomeSection[];
  visibleTo: string;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
  goalStats: ICaseOutcomeGoalStats;
  createdBy: ICaseOutcomeCreator;
  history?: ICaseOutcomeHistory[];
  comments?: ICaseOutcomeComment[];
  __v: number;
  caseDetails?: ICaseDetails;
}
export interface ICaseDetails {
  caseId: string;
  caseAgencyName: string;
  locationId?: string | null;
  companyId?: string | null;
  visibleTo: string;
}
// API response for fetching case outcomes (paginated)
export interface ICaseOutcomesApiResponse {
  data: ICaseOutcome[];
  pagination?: Pagination;
}

// -> Gets all case outcomes for a specific case, with pagination
export const getCaseOutcomes = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<ICaseOutcomesApiResponse>> => {
  try {
    const response = await backendApi.get<
      ApiResponse<ICaseOutcomesApiResponse>
    >(`/api/case-outcomes/by-case/${caseId}?page=${page}&limit=${limit}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching case outcomes:", error);
    throw new Error("Failed to fetch case outcomes");
  }
};

// =============================================================
// 5. MANAGE CASE GOAL SETS (Case-Specific Outcomes)
// =============================================================
// These APIs and types are for managing goal sets within specific cases

// → Represents a single goal within a section
export interface IGoalSetGoal {
  goal: string;
  goalName: string;
}

// → Represents a section within a goal set
export interface IGoalSetSection {
  section: string;
  sectionName: string;
  goals: IGoalSetGoal[];
  comments: unknown[]; // → Empty array as per API structure
}

// → Request payload for creating/updating a goal set
export interface IGoalSetRequestPayload {
  title: string;
  status: string;
  visibleTo: string;
  caseId: string;
  sections: IGoalSetSection[];
}

// → API response for creating a goal set
export interface ICreateGoalSetResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    title: string;
    status: string;
    visibleTo: string;
    caseId: string;
    sections: IGoalSetSection[];
    createdAt: string;
    updatedAt: string;
    __v?: number;
  };
  code: number;
}

// → Creates a new goal set with sections and goals for a specific case
export const createGoalSet = async (
  payload: IGoalSetRequestPayload,
  userId: string,
  locationId?: string
): Promise<ICreateGoalSetResponse> => {
  try {
    const response = await backendApi.post<ICreateGoalSetResponse>(
      "/api/case-outcomes",
      payload,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error creating goal set:", error);
    throw new Error("Failed to create goal set");
  }
};

// → API response for updating a goal set
export interface IUpdateGoalSetResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    title: string;
    status: string;
    visibleTo: string;
    caseId: string;
    sections: IGoalSetSection[];
    createdAt: string;
    updatedAt: string;
    __v?: number;
  };
  code: number;
}

// → Updates an existing goal set by ID for a specific case
export const updateGoalSet = async (
  id: string,
  payload: IGoalSetRequestPayload,
  userId: string,
  locationId?: string
): Promise<IUpdateGoalSetResponse> => {
  try {
    const response = await backendApi.put<IUpdateGoalSetResponse>(
      `/api/case-outcomes/${id}`,
      payload,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error updating goal set:", error);
    throw new Error("Failed to update goal set");
  }
};

// → API response for deleting a goal set
export interface IDeleteGoalSetResponse {
  success: boolean;
  message?: string;
  data?: null;
  code: number;
}

// → Deletes a goal set by ID for a specific case
export const deleteGoalSet = async (
  id: string,
  userId: string,
  locationId?: string
): Promise<IDeleteGoalSetResponse> => {
  try {
    const response = await backendApi.delete<IDeleteGoalSetResponse>(
      `/api/case-outcomes/${id}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error deleting goal set:", error);
    throw new Error("Failed to delete goal set");
  }
};

// API response for fetching outcome goals by section
export interface IOutcomeGoalsBySectionResponse {
  section: {
    _id: string;
    name: string;
  };
  goals: {
    _id: string;
    name: string;
  }[];
}

// Unified Outcome Goal Types (API <-> Form)
export type TDateParts = {
  day: string;
  month: string;
  year: string;
} | null;

export interface IGoalStep {
  _id: string;
  name: string;
  isComplete: boolean;
  dueDate: TDateParts;
  emailNotification: string; // userId or userName
}

export interface IOutcomeGoal {
  _id: string;
  name: string;
  status: string; // statusId
  dueDate: TDateParts;
  emailNotification: string; // userId or userName
  isCustom: boolean;
  steps: IGoalStep[];
}

// -> Gets outcome goals for a specific outcome + section
export const getOutcomeGoalsByOutcomeAndSection = async (
  outcomeId: string,
  sectionId: string
): Promise<IOutcomeGoalsBySectionResponse> => {
  const response = await backendApi.get<{
    data: IOutcomeGoalsBySectionResponse;
  }>(`/api/outcome-goals/outcome/${outcomeId}/section/${sectionId}`);

  return response?.data?.data;
};

// Update outcome goals for a section
export const updateOutcomeGoalsForSection = async (
  outcomeId: string,
  sectionId: string,
  payload: IOutcomeGoalsBySectionResponse,
  userId: string
) => {
  try {
    const response = await backendApi.put(
      `/api/case-outcomes/${outcomeId}/sections/${sectionId}/goals`,
      payload,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating outcome goals for section:", error);
    throw (
      error?.response?.data?.message ||
      error.message ||
      "Failed to update outcome goals"
    );
  }
};

// Create a comment for a case outcome (with optional file upload)
export const createOutcomeComment = async (
  outcomeId: string,
  data: { text: string; file?: File | null },
  userId: string
) => {
  try {
    const formData = new FormData();
    formData.append("text", data.text);
    if (data.file) {
      formData.append("file", data.file);
    }
    const response = await backendApi.post(
      `/api/case-outcomes/${outcomeId}/comments`,
      formData,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating outcome comment:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to create outcome comment"
    );
  }
};

// Update a comment for a case outcome (with optional file upload)
export const updateOutcomeComment = async (
  outcomeId: string,
  commentId: string,
  data: { text: string; file?: File | null },
  userId: string
) => {
  try {
    const formData = new FormData();
    formData.append("text", data.text);
    if (data.file) {
      formData.append("file", data.file);
    }
    const response = await backendApi.put(
      `/api/case-outcomes/${outcomeId}/comments/${commentId}`,
      formData,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating outcome comment:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update outcome comment"
    );
  }
};

// Delete a comment for a case outcome
export const deleteOutcomeComment = async (
  outcomeId: string,
  commentId: string,
  userId: string
) => {
  try {
    const url = `/api/case-outcomes/${outcomeId}/comments/${commentId}`;
    const headers = {
      "x-user-id": userId,
    };

    const response = await backendApi.delete(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error("Error deleting outcome comment:", error);
    console.error("Error response:", error?.response);
    throw new Error(
      error?.response?.data?.message || "Failed to delete outcome comment"
    );
  }
};

export const fetchCaseReport = async (
  id: string,
  includeRelationships: boolean,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams();
    params.append(
      "includeRelationships",
      includeRelationships ? "true" : "false"
    );
    const response = await backendApi.get<ApiResponse<CaseReport>>(
      `/api/cases/${id}/report?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching case report:", error);
    throw error;
  }
};

export const fetchCaseRelatedCounts = async (
  caseId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<RelatedCounts>> => {
  try {
    const response = await backendApi.get<ApiResponse<RelatedCounts>>(
      `/api/cases/${caseId}/related-counts`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching related counts:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch related counts"
    );
  }
};

export const fetchAssistanceBarcodeData = async (
  barcodeId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.get<ApiResponse<any>>(
      `/api/assistance-barcodes/${barcodeId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching assistance barcode data:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch assistance barcode data"
    );
  }
};
