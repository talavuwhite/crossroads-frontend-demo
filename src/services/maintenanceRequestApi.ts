import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";

export interface MaintenanceRequestDocument {
  _id: string;
  name: string;
  url: string;
  uploadedAt?: string;
}

export interface MaintenanceRequest {
  _id: string;
  caseId: string;
  requestId: string;
  agencyName?: string;
  locationId?: string;
  companyId?: string;
  categoryId: string;
  description: string;
  document: MaintenanceRequestDocument[] | null;
  priority: string;
  preferredVisitTime?: string;
  status: string;
  notes?: string;
  dateSubmitted: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequestListResponse {
  results: MaintenanceRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchMaintenanceRequestsByCase = async (
  caseId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<MaintenanceRequestListResponse>> => {
  try {
    const response = await backendApi.get<
      ApiResponse<MaintenanceRequestListResponse>
    >(`/api/maintenance-request/case/${caseId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch maintenance requests"
    );
  }
};

export const updateMaintenanceRequestStatus = async (
  requestId: string,
  status: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.patch<ApiResponse<any>>(
      `/api/maintenance-request/${requestId}/status`,
      { status },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update status");
  }
};
