import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { CaseDocument, DocumentData, Pagination } from "@/types/case";

export interface CaseDocumentResponse {
  data: CaseDocument[];
  pagination: Pagination;
}

const handleDocumentOperation = async (
  method: "post" | "put",
  url: string,
  documentData: DocumentData,
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseDocument>> => {
  try {
    const formData = new FormData();
    formData.append("description", documentData.description);
    formData.append("visibleTo", documentData.visibleTo);
    if (documentData.attachment) {
      formData.append("attachment", documentData.attachment);
    }

    const response = await backendApi[method]<ApiResponse<CaseDocument>>(
      url,
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
    console.error(
      `Error ${method === "post" ? "creating" : "updating"} case document:`,
      error
    );
    throw new Error(
      error.response?.data?.message ||
      `Failed to ${method === "post" ? "create" : "update"} case document`
    );
  }
};

export const createCaseDocument = async (
  caseId: string,
  documentData: DocumentData,
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseDocument>> => {
  return handleDocumentOperation(
    "post",
    `/api/case-documents/${caseId}`,
    documentData,
    userId,
    locationId
  );
};

export const updateCaseDocument = async (
  documentId: string,
  documentData: DocumentData,
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseDocument>> => {
  return handleDocumentOperation(
    "put",
    `/api/case-documents/${documentId}`,
    documentData,
    userId,
    locationId
  );
};

export const deleteCaseDocument = async (
  documentId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/case-documents/${documentId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting case document:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete case document"
    );
  }
};

export const fetchCaseDocuments = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  relationshipType?: string,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<CaseDocumentResponse>> => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (relationshipType) {
      queryParams.append("relationshipType", relationshipType);
    }

    const response = await backendApi.get<ApiResponse<CaseDocumentResponse>>(
      `api/case-documents/${caseId}?${queryParams.toString()}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching case notes:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch case notes"
    );
  }
};
