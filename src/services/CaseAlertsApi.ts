import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { CaseAlert, Pagination } from "@/types/case";

export interface FetchCaseAlertsResponse {
  data: CaseAlert[];
  pagination: Pagination;
}

export const fetchCaseAlerts = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  relationshipType?: string,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<FetchCaseAlertsResponse>> => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (relationshipType) {
      queryParams.append("relationshipType", relationshipType);
    }
    const response = await backendApi.get<ApiResponse<FetchCaseAlertsResponse>>(
      `/api/case-alerts/${caseId}?${queryParams.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching case alerts:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch case alerts"
    );
  }
};

export const createCaseAlert = async (
  caseId: string,
  alertData: { description: string; sendEmail: boolean },
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseAlert>> => {
  try {
    const response = await backendApi.post<ApiResponse<CaseAlert>>(
      `/api/case-alerts/${caseId}`,
      {
        description: alertData.description,
        isEmailSendChecked: alertData.sendEmail,
      },
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
    console.error("Error creating case alert:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create case alert"
    );
  }
};

export const updateCaseAlert = async (
  alertId: string,
  alertData: { description: string; sendEmail: boolean },
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseAlert>> => {
  try {
    const response = await backendApi.put<ApiResponse<CaseAlert>>(
      `/api/case-alerts/${alertId}`,
      {
        description: alertData.description,
        isEmailSendChecked: alertData.sendEmail,
      },
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
    console.error("Error updating case alert:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update case alert"
    );
  }
};

export const deleteCaseAlert = async (
  alertId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/case-alerts/${alertId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting case alert:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete case alert"
    );
  }
};
