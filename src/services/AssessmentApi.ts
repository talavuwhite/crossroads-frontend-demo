import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { AssessmentField } from "@/services/AssessmentFieldApi";

export interface AssessmentFieldValue {
  fieldId: string;
  value: string | number | boolean;
  name: string;
  type: string;
  options: string[];
  isRequired: boolean;
  isArchived?: boolean;
}

export interface AssessmentComment {
  comment: string;
  commentedBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  commentedAt: string;
  locationId?: string;
  companyId?: string;
  _id?: string;
  locationName?: string;
  companyName?: string;
}

export interface AssessmentHistoryChange {
  field: string;
  fieldId?: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

export interface AssessmentHistory {
  changedBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  changedAt: string;
  changes: AssessmentHistoryChange[];
  companyId?: string;
  companyName?: string;
  locationId?: string;
  locationName?: string;
}

export interface Assessment {
  _id: string;
  caseId: string | { _id: string; firstName: string; lastName: string };
  companyId?: string;
  locationId?: string;
  fields: AssessmentFieldValue[];
  description?: string;
  createdBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  companyName?: string;
  locationName?: string;
  comments?: AssessmentComment[];
  history?: AssessmentHistory[];
}

export interface AssessmentResponse {
  results?: Assessment[];
  data?: Assessment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Get all assessments for a case
export const fetchAssessmentsForCase = async (
  caseId: string,
  userId: string,
  locationId: string,
  page = 1,
  limit = 10
): Promise<ApiResponse<AssessmentResponse>> => {
  try {
    const res = await backendApi.get<ApiResponse<AssessmentResponse>>(
      `/api/assessments/case/${caseId}?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching assessments:", error);
    throw error?.response?.data?.message || "Failed to fetch assessments";
  }
};

// Create assessment
export const createAssessment = async (
  caseId: string,
  data: { fields: AssessmentFieldValue[]; description?: string },
  userId: string,
  locationId: string
): Promise<ApiResponse<Assessment>> => {
  try {
    const res = await backendApi.post<ApiResponse<Assessment>>(
      `/api/assessments/${caseId}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error creating assessment:", error);
    throw error?.response?.data?.message || "Failed to create assessment";
  }
};

// Update assessment
export const updateAssessment = async (
  assessmentId: string,
  data: { fields: AssessmentFieldValue[]; description?: string },
  userId: string,
  locationId: string
): Promise<ApiResponse<Assessment>> => {
  try {
    const res = await backendApi.put<ApiResponse<Assessment>>(
      `/api/assessments/${assessmentId}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error updating assessment:", error);
    throw error?.response?.data?.message || "Failed to update assessment";
  }
};

// Delete assessment
export const deleteAssessment = async (
  assessmentId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<void>> => {
  try {
    const res = await backendApi.delete<ApiResponse<void>>(
      `/api/assessments/${assessmentId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    throw error?.response?.data?.message || "Failed to delete assessment";
  }
};

// Get assessment fields for user context
export const fetchAssessmentFieldsForUser = async (
  userId: string,
  locationId: string
): Promise<ApiResponse<AssessmentField[]>> => {
  try {
    const res = await backendApi.get<ApiResponse<AssessmentField[]>>(
      `/api/assessment-fields/user-context`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching assessment fields:", error);
    throw error?.response?.data?.message || "Failed to fetch assessment fields";
  }
};

// Get assessment fields for edit
export const fetchAssessmentFieldsForEdit = async (
  assessmentId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<AssessmentField[]>> => {
  try {
    const res = await backendApi.get<ApiResponse<AssessmentField[]>>(
      `/api/assessment-fields/user-context/${assessmentId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching assessment fields for edit:", error);
    throw (
      error?.response?.data?.message ||
      "Failed to fetch assessment fields for edit"
    );
  }
};
export const addAssessmentComment = async (
  assessmentId: string,
  comment: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await backendApi.post<ApiResponse<{ message: string }>>(
      `/api/assessments/${assessmentId}/comments`,
      { comment },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error adding assessment comment:", error);
    throw error?.response?.data?.message || "Failed to add comment";
  }
};
export const updateAssessmentComment = async (
  assessmentId: string,
  commentId: string,
  comment: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await backendApi.put<ApiResponse<{ message: string }>>(
      `/api/assessments/${assessmentId}/comments/${commentId}`,
      { comment },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error updating assessment comment:", error);
    throw error?.response?.data?.message || "Failed to update comment";
  }
};
export const deleteAssessmentComment = async (
  assessmentId: string,
  commentId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const res = await backendApi.delete<ApiResponse<{ message: string }>>(
      `/api/assessments/${assessmentId}/comments/${commentId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error deleting assessment comment:", error);
    throw error?.response?.data?.message || "Failed to delete comment";
  }
};

// Get assessment fields by caseId and date
export const fetchAssessmentFieldsByDate = async (
  caseId: string,
  date: string, // expected format: YYYY-MM-DD
  userId: string,
  locationId: string
): Promise<ApiResponse<AssessmentField[]>> => {
  try {
    const res = await backendApi.get<ApiResponse<AssessmentField[]>>(
      `/api/assessments/questions/${caseId}/fields-by-date?date=${encodeURIComponent(
        date
      )}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error fetching assessment fields by date:", error);
    throw error?.response?.data?.message || "Failed to fetch fields by date";
  }
};
