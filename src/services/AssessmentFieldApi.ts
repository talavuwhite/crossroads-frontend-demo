import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";

export interface AssessmentField {
  _id: string;
  name: string;
  type: string;
  options: any[];
  isGlobal: boolean;
  isRequired: boolean;
  companyId: string;
  locationId: string | null;
  createdBy: string;
  isArchived: boolean;
  order: number;
  updatedAt: string;
  description?: string;
  value?: number | string | any;
}

export interface AssessmentFieldPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AssessmentFieldResponse {
  data: AssessmentField[];
  pagination: AssessmentFieldPagination;
}

export interface CreateAssessmentFieldPayload {
  name: string;
  type: string;
  isGlobal: boolean;
  isRequired: boolean;
  options: string[];
}

export const fetchAssessmentFields = async (
  id: string,
  locationId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const response = await backendApi.get<ApiResponse<AssessmentFieldResponse>>(
      `/api/assessment-fields/context/${id}?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching assessment fields:", error);
    throw error?.response?.data?.message || "Failed to fetch assessment fields";
  }
};

export const createAssessmentField = async (
  data: CreateAssessmentFieldPayload,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<AssessmentField>>(
      "/api/assessment-fields",
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating assessment field:", error);
    throw error?.response?.data?.message || "Failed to create assessment field";
  }
};

// Update assessment field
export const updateAssessmentField = async (
  id: string,
  data: Partial<
    Pick<
      AssessmentField,
      "name" | "type" | "isGlobal" | "isRequired" | "options"
    >
  >,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.put<ApiResponse<AssessmentField>>(
      `/api/assessment-fields/${id}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error updating assessment field:", error);
    throw error?.response?.data?.message || "Failed to update assessment field";
  }
};

// Delete assessment field
export const deleteAssessmentField = async (
  id: string,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/assessment-fields/${id}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting assessment field:", error);
    throw error?.response?.data?.message || "Failed to delete assessment field";
  }
};

// Update assessment field order
export const updateAssessmentFieldOrder = async (
  fieldOrder: string[],
  userId: string
) => {
  try {
    const response = await backendApi.put<ApiResponse<void>>(
      `/api/assessment-fields/order`,
      { fieldOrder },
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating assessment field order:", error);
    throw error?.response?.data?.message || "Failed to update field order";
  }
};

export const fetchGlobalAssessmentFields = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const response = await backendApi.get<ApiResponse<AssessmentFieldResponse>>(
      `/api/assessment-fields/global?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching global assessment fields:", error);
    throw (
      error?.response?.data?.message ||
      "Failed to fetch global assessment fields"
    );
  }
};
