import backendApi from "@/api/api";
import type { FilteredService, Service, ServicesResponse } from "@/types";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";

interface CreateServiceData {
  sectionId: string;
  name: string;
  description: string;
  taxonomyCode: string;
}

export const getServices = async (
  page: number,
  limit: number,
  userId: string,
  locationId: string,
  search?: string,
  firstLetter?: string,
  pagination?: boolean
): Promise<ApiResponse<ServicesResponse>> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      hasPagination: String(pagination),
    });
    if (search) params.append("search", search);

    if (firstLetter) params.append("firstLetter", firstLetter);
    const response = await backendApi.get<ApiResponse<ServicesResponse>>(
      `/api/service?${params.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching services:", error);
    throw error.response?.data?.message || "Failed to fetch services";
  }
};

export const createService = async (
  serviceData: CreateServiceData,
  userId: string,
  locationId: string
): Promise<Service> => {
  try {
    const response = await backendApi.post<ApiResponse<Service>>(
      "/api/service",
      serviceData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId ?? "",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating service:", error.response?.data?.message);
    throw error.response?.data?.message;
  }
};

export const updateService = async (
  serviceId: string,
  serviceData: CreateServiceData,
  userId: string,
  locationId: string
): Promise<Service> => {
  try {
    const response = await backendApi.put<ApiResponse<Service>>(
      `/api/service/${serviceId}`,
      serviceData,
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
    console.error("Error updating service:", error);
    throw error.response?.data?.message || "Failed to update service";
  }
};

export const deleteServiceById = async (
  serviceId: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(`/api/service/${serviceId}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    throw error.response?.data?.message || "Failed to delete service";
  }
};

export const getFilteredServices = async (
  userId: string,
  locationId: string,
  id: string,
  page: number = 1,
  limit: number = 10
): Promise<
  ApiResponse<{
    results: FilteredService[];
    pagination: Pagination;
  }>
> => {
  try {
    const response = await backendApi.get<
      ApiResponse<{
        results: FilteredService[];
        pagination: Pagination;
      }>
    >(`/api/service/filter?id=${id}&page=${page}&limit=${limit}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId ?? "",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching filtered services:",
      error.response?.data?.message
    );
    throw error.response?.data?.message || "Failed to fetch filtered services";
  }
};
