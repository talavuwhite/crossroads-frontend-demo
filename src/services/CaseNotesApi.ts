import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { CaseNote, Pagination } from "@/types/case";

export interface FetchCaseNotesResponse {
  data: CaseNote[];
  pagination: Pagination;
}

export const createCaseNote = async (
  caseId: string,
  noteData: { description: string; visibleTo: string; attachment?: File },
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseNote>> => {
  try {
    const formData = new FormData();
    formData.append("description", noteData.description);
    formData.append("visibleTo", noteData.visibleTo);
    if (noteData.attachment) {
      formData.append("attachment", noteData.attachment);
    }

    const response = await backendApi.post<ApiResponse<CaseNote>>(
      `/api/case-notes/${caseId}`,
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
    console.error("Error creating case note:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create case note"
    );
  }
};

export const updateCaseNote = async (
  noteId: string,
  noteData: { description: string; visibleTo: string; attachment?: File },
  userId: string,
  locationId: string
): Promise<ApiResponse<CaseNote>> => {
  try {
    const formData = new FormData();
    formData.append("description", noteData.description);
    formData.append("visibleTo", noteData.visibleTo);
    if (noteData.attachment) {
      formData.append("attachment", noteData.attachment);
    }

    const response = await backendApi.put<ApiResponse<CaseNote>>(
      `/api/case-notes/${noteId}`,
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
    console.error("Error updating case note:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update case note"
    );
  }
};

export const deleteCaseNote = async (
  noteId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await backendApi.delete<ApiResponse<void>>(
      `/api/case-notes/${noteId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting case note:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete case note"
    );
  }
};

export const fetchCaseNotes = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  relationshipType?: string,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<FetchCaseNotesResponse>> => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (relationshipType) {
      queryParams.append("relationshipType", relationshipType);
    }

    const response = await backendApi.get<ApiResponse<FetchCaseNotesResponse>>(
      `/api/case-notes/${caseId}?${queryParams.toString()}`,{
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
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
