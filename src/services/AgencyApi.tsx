import type { ApiResponse } from "@/types/api";
import backendApi from "@/api/api";
import type {
  AddAgencyPayload,
  AgencyDetailsTypes,
  BaseAgency,
  NetworkAdminsApiResponse,
  SubAccountData,
} from "@/types/agency";
import type { Pagination } from "@/types/case";

export const createSubAgency = async (
  data: AddAgencyPayload,
  userId: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<any>>(
      `/api/ghl-location/sub-agency`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error creating sub-agency:",
      error?.response?.data?.message || error.message
    );
    throw error?.response?.data?.message || "Failed to create sub-agency";
  }
};

export const getAgencyDetails = async (
  userId: string
): Promise<ApiResponse<SubAccountData>> => {
  try {
    const response = await backendApi.get<ApiResponse<SubAccountData>>(
      `/api/ghl-location/user/${userId}/sub-accounts`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching agency details:",
      error?.response?.data?.message || error.message
    );
    throw error?.response?.data?.message || "Failed to fetch agency details";
  }
};

export const updateAgency = async (
  agencyId: string,
  data: Omit<AddAgencyPayload, "timezone" | "prospectInfo">,
  userId: string
) => {
  try {
    const response = await backendApi.put<ApiResponse<any>>(
      `/api/ghl-location/agency-or-subagency/${agencyId}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error updating agency:",
      error?.response?.data?.message || error.message
    );
    throw error?.response?.data?.message || "Failed to update agency";
  }
};

export const getAgenciesAndSubAgencies = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
  startsWith: string = "",
  paginate: boolean = true
): Promise<{ data: BaseAgency[]; pagination: Pagination }> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (startsWith) params.append("startsWith", startsWith);

    const response = await backendApi.get<
      ApiResponse<{ data: BaseAgency[]; pagination: Pagination }>
    >(
      `/api/ghl-location/agencies-and-sub-agencies?${params.toString()}&paginate=${paginate}`
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error fetching agencies and sub-agencies:",
      error?.response?.data?.message || error.message
    );
    throw (
      error?.response?.data?.message ||
      "Failed to fetch agencies and sub-agencies"
    );
  }
};

export const getAgencyOrSubagencyDetails = async (
  agencyId: string,
  userId: string
): Promise<ApiResponse<AgencyDetailsTypes>> => {
  try {
    const response = await backendApi.get<ApiResponse<AgencyDetailsTypes>>(
      `/api/ghl-location/agency-or-subagency/${agencyId}`,
      {
        headers: {
          "x-user-id": userId,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching agency or subagency details:",
      error?.response?.data?.message || error.message
    );
    throw (
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch agency or subagency details"
    );
  }
};

export const getNetworkAdministrators = async (
  agencyId: string,
  userId: string
): Promise<ApiResponse<NetworkAdminsApiResponse>> => {
  try {
    const response = await backendApi.get<
      ApiResponse<NetworkAdminsApiResponse>
    >(`/api/ghl-location/agency/${agencyId}/network-administrators`, {
      headers: {
        "x-user-id": userId,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching network administrators:",
      error?.response?.data?.message || error.message
    );
    throw (
      error?.response?.data?.message || "Failed to fetch network administrators"
    );
  }
};
