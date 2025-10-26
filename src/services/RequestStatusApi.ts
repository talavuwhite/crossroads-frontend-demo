import backendApi from "@/api/api";
import type { RequestStatus } from "@/types";
import type { ApiResponse } from "@/types/api";

export const createRequestStatus = async (
  name: string,
  userId: string
): Promise<RequestStatus> => {
  try {
    const response = await backendApi.post<ApiResponse<RequestStatus>>(
      "/api/request-status",
      { name },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to create request status";
    throw new Error(message);
  }
};

export const getRequestStatuses = async (
  userId: string,
  locationId?: string
): Promise<RequestStatus[]> => {
  try {
    const response = await backendApi.get<ApiResponse<RequestStatus[]>>(
      "/api/request-status/",
      { headers: { "x-user-id": userId, "x-location-id": locationId } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch request statuses";
    throw new Error(message);
  }
};

export const updateRequestStatus = async (
  id: string,
  name: string,
  userId: string
): Promise<RequestStatus> => {
  try {
    const response = await backendApi.put<ApiResponse<RequestStatus>>(
      `/api/request-status/${id}`,
      { name },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to update request status";
    throw new Error(message);
  }
};

export const deleteRequestStatus = async (
  id: string,
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await backendApi.delete<ApiResponse<{ success: boolean }>>(
      `/api/request-status/${id}`,
      { headers: { "x-user-id": userId } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to delete request status";
    throw new Error(message);
  }
};
