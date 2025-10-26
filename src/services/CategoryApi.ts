import type { ApiResponse } from "@/types/api";
import backendApi from "@/api/api";
import type { Category } from "@/types";

export const fetchCategories = async () => {
  try {
    const response = await backendApi.get<ApiResponse<Category[]>>(
      "/api/categories"
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
