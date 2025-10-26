import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";

export interface AgeRange {
  _id: string;
  label: string;
  min: number;
  max: number;
  createdAt?: string;
  updatedAt?: string;
}

export const createAgeRange = async (
  label: string,
  min: number,
  max: number,
  userId: string
): Promise<AgeRange> => {
  try {
    const response = await backendApi.post<ApiResponse<AgeRange>>(
      "/api/age-ranges/",
      { label, min, max },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to create age range";
    throw new Error(message);
  }
};

export const getAgeRanges = async (userId: string): Promise<AgeRange[]> => {
  try {
    const response = await backendApi.get<ApiResponse<AgeRange[]>>(
      "/api/age-ranges/",
      { headers: { "x-user-id": userId } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch age ranges";
    throw new Error(message);
  }
};

export const updateAgeRange = async (
  id: string,
  label: string,
  min: number,
  max: number,
  userId: string
): Promise<AgeRange> => {
  try {
    const response = await backendApi.put<ApiResponse<AgeRange>>(
      `/api/age-ranges/${id}`,
      { label, min, max },
      { headers: { "x-user-id": userId, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to update age range";
    throw new Error(message);
  }
};

export const deleteAgeRange = async (
  id: string,
  userId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await backendApi.delete<ApiResponse<{ success: boolean }>>(
      `/api/age-ranges/${id}`,
      { headers: { "x-user-id": userId } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to delete age range";
    throw new Error(message);
  }
};
