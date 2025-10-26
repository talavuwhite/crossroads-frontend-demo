import type { ApiResponse } from "@/types/api";
import backendApi from "@/api/api";
import type { Category } from "@/types";
import type { Pagination } from "@/types/case";

export const categoryService = {
  createCategory: async (
    category: Omit<
      Category,
      | "_id"
      | "userId"
      | "createdBy"
      | "createdAt"
      | "caseName"
      | "isRelatedCase"
    >,
    userId: string,
    locationId: string
  ) => {
    try {
      const response = await backendApi.post<ApiResponse<Category>>(
        "/api/category",
        category,
        {
          headers: {
            "x-user-id": userId,
            "x-location-id": locationId,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error(
        error.response?.data?.message,
        "Error creating category:",
        error
      );
      throw error.response?.data?.message | error;
    }
  },

  getCategories: async (
    page: number = 1,
    limit: number = 10,
    userId: string,
    locationId?: string
  ) => {
    try {
      const response = await backendApi.get<
        ApiResponse<{ data: Category[]; pagination: Pagination }>
      >(`/api/category?page=${page}&limit=${limit}`, {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      throw error.response?.data?.message | error;
    }
  },

  updateCategory: async (
    categoryId: string,
    category: Omit<
      Category,
      | "_id"
      | "userId"
      | "createdBy"
      | "createdAt"
      | "caseName"
      | "isRelatedCase"
    >,
    userId: string,
    locationId: string
  ) => {
    try {
      const response = await backendApi.put<ApiResponse<Category>>(
        `/api/category/${categoryId}`,
        category,
        {
          headers: {
            "x-user-id": userId,
            "x-location-id": locationId,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating category:", error);
      throw error.response?.data?.message | error;
    }
  },

  deleteCategory: async (
    categoryId: string,
    userId: string,
    locationId: string
  ) => {
    try {
      const response = await backendApi.delete<ApiResponse<void>>(
        `/api/category/${categoryId}`,
        {
          headers: {
            "x-user-id": userId,
            "x-location-id": locationId,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(error.response, "Error deleting category:", error);
      throw error.response?.data?.message || error.message || error;
    }
  },

  agencyCategories: async (id: string, userId: string, locationId: string) => {
    try {
      const response = await backendApi.get<ApiResponse<{ data: Category[] }>>(
        `/api/category/filter?id=${id}`,
        {
          headers: {
            "x-user-id": userId,
            "x-location-id": locationId,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error filtering categories:", error);
      throw error.response?.data?.message || error;
    }
  },
};
