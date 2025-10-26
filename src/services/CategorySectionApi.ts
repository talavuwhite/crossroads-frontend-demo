import backendApi from "@/api/api";
import type { CategorySection } from "@/types";
import type { ApiResponse } from "@/types/api";

export const getCategorySections = async (
  userId: string,
  locationId: string = ""
): Promise<CategorySection[]> => {
  try {
    const res = await backendApi.get<ApiResponse<CategorySection[]>>(
      "/api/category-sections/",
      {
        headers: { "x-user-id": userId, "x-location-id": locationId || "" },
      }
    );
    return res.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch category sections";
    throw new Error(message);
  }
};

export const getCategorySectionById = async (
  id: string,
  userId: string,
  locationId: string = ""
): Promise<CategorySection> => {
  try {
    const res = await backendApi.get<ApiResponse<CategorySection>>(
      `/api/category-sections/${id}`,
      {
        headers: { "x-user-id": userId, "x-location-id": locationId || "" },
      }
    );
    return res.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch category section";
    throw new Error(message);
  }
};

export const createCategorySection = async (
  name: string,
  userId: string,
  locationId: string = ""
): Promise<CategorySection> => {
  try {
    const res = await backendApi.post<ApiResponse<CategorySection>>(
      "/api/category-sections/",
      { name },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId || "",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to create category section";
    throw new Error(message);
  }
};

export const updateCategorySection = async (
  id: string,
  name: string,
  userId: string,
  locationId: string = ""
): Promise<CategorySection> => {
  try {
    const res = await backendApi.put<ApiResponse<CategorySection>>(
      `/api/category-sections/${id}`,
      { name },
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId || "",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to update category section";
    throw new Error(message);
  }
};

export const deleteCategorySection = async (
  id: string,
  userId: string,
  locationId: string = ""
): Promise<{ success: boolean }> => {
  try {
    const res = await backendApi.delete<ApiResponse<{ success: boolean }>>(
      `/api/category-sections/${id}`,
      {
        headers: { "x-user-id": userId, "x-location-id": locationId || "" },
      }
    );
    return res.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to delete category section";
    throw new Error(message);
  }
};
