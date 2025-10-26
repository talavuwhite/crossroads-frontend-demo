import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";
import type { AssistanceBarcode } from "@/types/index";

export const fetchBarcodes = async (
  visibleTo: string,
  userId: string,
  locationId: string,
  page: number,
  limit: number
): Promise<{ barcodes: AssistanceBarcode[]; paginaion: Pagination }> => {
  try {
    const response = await backendApi.get<
      ApiResponse<{ barcodes: AssistanceBarcode[]; paginaion: Pagination }>
    >(
      `/api/assistance-barcodes${
        visibleTo ? `?visibleTo=${encodeURIComponent(visibleTo)}` : ""
      }&page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching barcodes:", error);
    throw error;
  }
};

export const createBarcode = async (
  data: Omit<
    AssistanceBarcode,
    | "_id"
    | "createdAt"
    | "updatedAt"
    | "__v"
    | "userId"
    | "userType"
    | "companyId"
    | "companyName"
    | "createdBy"
  >,
  userId: string,
  locationId: string
): Promise<AssistanceBarcode> => {
  try {
    const response = await backendApi.post<ApiResponse<AssistanceBarcode>>(
      "/api/assistance-barcodes",
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error creating barcode:", error);
    throw error;
  }
};

export const updateBarcode = async (
  id: string,
  data: Partial<AssistanceBarcode>,
  userId: string,
  locationId: string
): Promise<AssistanceBarcode> => {
  try {
    const response = await backendApi.put<ApiResponse<AssistanceBarcode>>(
      `/api/assistance-barcodes/${id}`,
      data,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error updating barcode:", error);
    throw error;
  }
};

export const deleteBarcode = async (
  id: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(
      `/api/assistance-barcodes/${id}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
  } catch (error) {
    console.error("Error deleting barcode:", error);
    throw error;
  }
};

export const fetchFilteredBarcodes = async (
  barcodeIds: string[],
  userId: string,
  locationId: string,
  visibleTo: string
) => {
  const response = await backendApi.post<
    ApiResponse<{ barcodes: AssistanceBarcode[] }>
  >(
    `/api/assistance-barcodes/filter?visibleTo=${encodeURIComponent(
      visibleTo
    )}`,
    { barcodeIds },
    {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.data.barcodes;
};
