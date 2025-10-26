import type { ApiResponse } from "@/types/api";
import backendApi from "@/api/api";
import type { ReferralFormValues, ReferralRecord } from "@/types/index";
import type { Pagination } from "@/types/case";

export interface ReferralResponse {
  data: ReferralRecord[];
  pagination: Pagination;
}

export const createReferral = async (
  caseId: string,
  data: ReferralFormValues,
  userId: string,
  locationId: string
) => {
  try {
    const formData = new FormData();
    formData.append("amount", data.amount.toString());
    formData.append("unit", data.unit);
    formData.append("category", data.category);
    formData.append("description", data.description);
    if (data.deadlineDate !== undefined && data.deadlineDate !== null) {
      formData.append("requestDeadline", data.deadlineDate as string);
    }
    formData.append("visibleTo", data.visibleTo);
    if (data.attachedFile) {
      formData.append("attachedFile", data.attachedFile);
    }
    if (data.referredAgencyService) {
      formData.append("service", data.referredAgencyService);
    }
    if (data.status) {
      formData.append("status", data.status);
    }

    const response = await backendApi.post<ApiResponse<ReferralRecord>>(
      `/api/assistance/${caseId}/referrals`,
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
    console.error("Error creating referral:", error);
    throw error?.response?.data?.message;
  }
};

export const updateReferral = async (
  referralId: string,
  data: ReferralFormValues,
  userId: string,
  locationId: string
) => {
  try {
    const formData = new FormData();
    formData.append("amount", data.amount.toString());
    formData.append("unit", data.unit);
    formData.append("category", data.category);
    formData.append("description", data.description);
    if (data.deadlineDate !== undefined && data.deadlineDate !== null) {
      formData.append("requestDeadline", data.deadlineDate as string);
    }
    formData.append("visibleTo", data.visibleTo);
    if (data.attachment) {
      formData.append("attachedFile", data.attachment);
    }
    if (data.referredAgencyService) {
      formData.append("service", data.referredAgencyService);
    }
    if (data.status) {
      formData.append("status", data.status);
    }

    const response = await backendApi.put<ApiResponse<ReferralRecord>>(
      `/api/assistance/referrals/${referralId}`,
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
    console.error("Error updating referral:", error);
    throw error?.response?.data?.message;
  }
};

export const deleteReferral = async (
  referralId: string,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/assistance/referrals/${referralId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting referral:", error);
    throw error?.response?.data?.message;
  }
};

export const fetchReferrals = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  relationshipType: string = "related"
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      relationshipType,
    });

    const response = await backendApi.get<ApiResponse<ReferralResponse>>(
      `/api/assistance/referrals/case/${caseId}?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching referrals:", error);
    throw error?.response?.data?.message;
  }
};

export const createRequestedAssistance = async (
  referralId: string,
  data: {
    amount: number;
    unit: string;
    category: string;
    description: string;
    visibleTo: string;
    attachment?: File | null;
  },
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
      formData.append("attachedFile", data.attachment);
    }

    const response = await backendApi.post<ApiResponse<any>>(
      `/api/assistance/referrals/${referralId}/requested-assistance`,
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
    console.error("Error creating requested assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const updateRequestedAssistance = async (
  referralId: string,
  requestedAssistanceId: string,
  data: {
    amount: number;
    unit: string;
    category: string;
    description: string;
    visibleTo: string;
    attachment?: File | null;
  },
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
      formData.append("attachedFile", data.attachment);
    }

    const response = await backendApi.put<ApiResponse<any>>(
      `/api/assistance/referrals/${referralId}/requested-assistance/${requestedAssistanceId}`,
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
    console.error("Error updating requested assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const deleteRequestedAssistance = async (
  referralId: string,
  requestedAssistanceId: string,
  userId: string,
  locationId: string
) => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/assistance/referrals/${referralId}/requested-assistance/${requestedAssistanceId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting requested assistance:", error);
    throw error?.response?.data?.message;
  }
};

export const updateReferralStatus = async (
  referralId: string,
  status: string,
  statusNotes: string,
  userId: string,
  locationId?: string,
  statusId?: string
) => {
  try {
    const endpoint = statusId
      ? `/api/assistance/referrals/${referralId}/status/${statusId}`
      : `/api/assistance/referrals/${referralId}/status`;
    const response = await backendApi.put<ApiResponse<any>>(
      endpoint,
      {
        status,
        statusNotes,
      },
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
    console.error("Error updating referral status:", error);
    throw error?.response?.data?.message;
  }
};
