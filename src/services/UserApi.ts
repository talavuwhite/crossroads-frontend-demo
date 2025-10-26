import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";
import type { CreateUserData, UserData } from "@/types/user";

export const createUser = async (
  userData: CreateUserData,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<any>>(
      `/api/users`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error("Error creating user:", error);
    throw error?.response;
  }
};

export const getUsers = async (
  page: number = 1,
  limit: number = 10,
  userId: string,
  locationId: string,
  search?: string,
  firstNameStartsWith?: string
) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    if (firstNameStartsWith)
      params.append("firstNameStartsWith", firstNameStartsWith);
    const response = await backendApi.get<
      ApiResponse<{ users: UserData[]; pagination: Pagination }>
    >(`/api/users?${params.toString()}&hasPaginations=true`, {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching users:", error);
    throw error?.response;
  }
};

export const getUsersWithoutPagination = async (
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.get<ApiResponse<UserData[]>>(
      `/api/users?hasPaginations=false`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching users:", error);
    throw error?.response;
  }
};

export const updateUser = async (
  userIdToUpdate: string,
  userData: FormData,
  currentUserId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.put<ApiResponse<any>>(
      `/api/users/${userIdToUpdate}`,
      userData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-user-id": currentUserId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error(error?.response, "Error updating user:", error);
    throw error?.response;
  }
};

export const deleteUser = async (
  userIdToDelete: string,
  locationId: string,
  currentUserId: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<any>>(
      `/api/users/${userIdToDelete}?locationId=${locationId}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
          "x-location-id": locationId,
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    throw error?.response;
  }
};

export const getUsersByLocationAgency = async (
  locationId: string,
  page: number = 1,
  limit: number = 10,
  showDisabledAgents: boolean = true,
  userId: string,
  agencyId?: string
) => {
  try {
    let url = "";
    if (agencyId) {
      url = `/api/users/by-location-agency?agencyId=${agencyId}&page=${page}&limit=${limit}&showDisabledAgents=${showDisabledAgents}`;
    } else {
      url = `/api/users/by-location-agency?locationId=${locationId}&page=${page}&limit=${limit}&showDisabledAgents=${showDisabledAgents}`;
    }
    const response = await backendApi.get<
      ApiResponse<{
        users: UserData[];
        pagination: Pagination;
        disabledCount?: number;
      }>
    >(url, {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
    });
    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching users by location agency:", error);
    throw error?.response;
  }
};

export const getUsersByLocationAgencyWithoutPagination = async (
  locationId: string,
  userId: string,
  agencyId?: string,
  hasPaginations?: boolean
) => {
  try {
    let url = "";
    if (agencyId) {
      url = `/api/users/by-location-agency?agencyId=${agencyId}&hasPaginations=${hasPaginations}`;
    } else {
      url = `/api/users/by-location-agency?locationId=${locationId}&hasPaginations=${hasPaginations}`;
    }
    const response = await backendApi.get<ApiResponse<UserData[]>>(url, {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching users by location agency:", error);
    throw error?.response;
  }
};
