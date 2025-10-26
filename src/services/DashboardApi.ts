import backendApi from "@/api/api";
import type { DashboardStatsResponse } from "@/types";
import type { ApiResponse } from "@/types/api";

export const fetchDashboardStats = async (
  page: number,
  limit: number,
  userId?: string,
  locationId?: string
) => {
  try {
    const response = await backendApi.get<
      ApiResponse<DashboardStatsResponse>
    >(`/api/dashboard-stats?page=${page}&limit=${limit}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    throw error?.response?.data?.message;
  }
};
