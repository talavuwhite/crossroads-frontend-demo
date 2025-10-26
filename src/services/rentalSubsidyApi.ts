import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";

export interface RentalSubsidyDocument {
  name: string;
  url: string;
  _id: string;
}

export interface RentalSubsidyData {
  propertyAddress: string;
  agencyName: string;
  rentAmount: number;
  dueAmount: number;
  payableAmount: number;
  rentDueDate: string;
  lastPaymentDate: string;
  paymentStatus: string;
  subsidyType: string;
  subsidyAmount: number;
  subsidyStatus: string;
  leaseStartDate: string;
  leaseEndDate: string;
  documents?: RentalSubsidyDocument[];
}

export const createRentalSubsidy = async (
  caseId: string,
  data: RentalSubsidyData,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.post<ApiResponse<any>>(
      `/api/rental-subsidy/${caseId}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to create rental & subsidy"
    );
  }
};

export const fetchRentalSubsidyByCase = async (
  caseId: string,
  userId: string,
  locationId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.get<ApiResponse<any>>(
      `/api/rental-subsidy/case/${caseId}?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch rental & subsidy"
    );
  }
};

export const updateRentalSubsidy = async (
  rentalSubsidyId: string,
  data: RentalSubsidyData,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.put<ApiResponse<any>>(
      `/api/rental-subsidy/${rentalSubsidyId}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update rental & subsidy"
    );
  }
};

export const deleteRentalSubsidy = async (
  rentalSubsidyId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.delete<ApiResponse<any>>(
      `/api/rental-subsidy/${rentalSubsidyId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete rental & subsidy"
    );
  }
};

export const uploadRentalSubsidyDocument = async (
  rentalSubsidyId: string,
  file: File,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const formData = new FormData();
    formData.append("document", file);
    const response = await backendApi.post<ApiResponse<any>>(
      `/api/rental-subsidy/${rentalSubsidyId}/documents`,
      formData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to upload document"
    );
  }
};

export const deleteRentalSubsidyDocument = async (
  rentalSubsidyId: string,
  documentId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await backendApi.delete<ApiResponse<any>>(
      `/api/rental-subsidy/${rentalSubsidyId}/documents/${documentId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete document"
    );
  }
};
