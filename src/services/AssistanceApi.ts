import type { ApiResponse } from "@/types/api";
import backendApi from "@/api/api";
import type { Pagination } from "@/types/case";
import type {
  AssistanceFormValues,
  AssistanceRecord,
  AssistanceReferralResponse,
} from "@/types";

export interface AssistanceResponse<T> {
  data: T;
  pagination: Pagination;
}

export const createAssistance = async (
  caseId: string,
  data: AssistanceFormValues,
  userId: string,
  locationId: string
) => {
  try {
    const formData = new FormData();

    formData.append("amount", data.amount.toString());
    formData.append("unit", data.unit);
    formData.append("category", data.category);
    formData.append("description", data.description);
    formData.append("visibleTo", data.visibleTo);

    if (data.attachment) {
      formData.append("attachment", data.attachment);
    }

    const response = await backendApi.post<ApiResponse<AssistanceRecord>>(
      `/api/assistance/${caseId}`,
      formData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const fetchAssistance = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  relationshipType?: string,
  category?: string,
  userId?: string,
  locationId?: string
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (relationshipType) params.append("relationshipType", relationshipType);
    if (category) params.append("category", category);

    const response = await backendApi.get<
      ApiResponse<AssistanceResponse<AssistanceReferralResponse>>
    >(`/api/assistance/${caseId}?${params.toString()}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const fetchAssistanceList = async (
  page: number = 1,
  limit: number = 10,
  userId?: string,
  locationId?: string,
  agencyId?: string,
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      id: agencyId?.toString() || "",
    });

    const response = await backendApi.get<
      ApiResponse<AssistanceResponse<AssistanceRecord[]>>
    >(`/api/assistance/by-agency?${params.toString()}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const updateAssistance = async (
  assistanceId: string,
  data: AssistanceFormValues,
  userId: string,
  locationId: string
) => {
  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        (typeof value === "string" || value instanceof Blob)
      ) {
        formData.append(key, value);
      }
    });

    const response = await backendApi.put<ApiResponse<AssistanceRecord>>(
      `/api/assistance/${assistanceId}`,
      formData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error updating assistance:", error?.response?.data?.message);
    throw error?.response?.data?.message;
  }
};

export const deleteAssistance = async (
  assistanceId: string,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/assistance/${assistanceId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const createMultipleAssistance = async (
  data: Omit<AssistanceFormValues, "attachment" | "amount"> & {
    amount: number;
    caseIds: string[];
  },
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.post<ApiResponse<AssistanceRecord>>(
      `/api/assistance/add`,
      data,
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
    console.error("Error creating multiple assistance records:", error);
    throw error?.response?.data?.message;
  }
};
