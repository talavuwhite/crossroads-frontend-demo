import backendApi from "@/api/api";
import type { Unit } from "@/types";
import type { ApiResponse } from "@/types/api";

export const createUnit = async (
  name: string,
  userId: string
): Promise<Unit> => {
  try {
    const response = await backendApi.post<ApiResponse<Unit>>(
      "/api/units",
      { name },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to create unit";
    throw new Error(message);
  }
};

export const getUnits = async (
  userId: string,
  locationId: string = ""
): Promise<Unit[]> => {
  try {
    const response = await backendApi.get<ApiResponse<Unit[]>>("/api/units", {
      headers: { "x-user-id": userId, "x-location-id": locationId || "" },
    });
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch units";
    throw new Error(message);
  }
};

export const updateUnit = async (
  unitId: string,
  name: string,
  userId: string
): Promise<Unit> => {
  try {
    const response = await backendApi.put<ApiResponse<Unit>>(
      `/api/units/${unitId}`,
      { name },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to update unit";
    throw new Error(message);
  }
};

export const deleteUnit = async (
  unitId: string,
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await backendApi.delete<ApiResponse<{ success: boolean }>>(
      `/api/units/${unitId}`,
      { headers: { "x-user-id": userId } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to delete unit";
    throw new Error(message);
  }
};
