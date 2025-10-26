import backendApi from "@/api/api";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { IBedForm, IBedType, ISiteListItem } from "@/types/bedManagement";
import type { Pagination } from "@/types/case";

// Fetch all bed management blocks (properties with beds)
export const fetchBedsByCompany = async (userId: string) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<ApiResponse<ISiteListItem[]>>(
      "/api/beds/by-company",
      { headers }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching beds by company:", error);
    throw error;
  }
};

// Fetch bed types for filtering (all bed types across sites)
export const fetchBedTypesForFilter = async (userId: string) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<
      ApiResponse<{
        total: number;
        bedTypes: Array<{
          _id: string;
          name: string;
          description: string;
        }>;
      }>
    >("/api/bed-types/filter", { headers });
    return response.data.data.bedTypes;
  } catch (error) {
    console.error("Error fetching bed types for filter:", error);
    throw error;
  }
};

// Fetch bed types for a specific site
export const fetchBedTypesBySite = async (userId: string, siteId: string) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<ApiResponse<IBedType[]>>(
      `/api/bed-types?siteId=${siteId}`,
      { headers }
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching bed types by site:", error);
    throw error;
  }
};

// Upsert (create/update) beds for a site
export const upsertBeds = async (userId: string, beds: IBedForm[]) => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<IBedForm>>(
      "/api/beds/upsert",
      { beds },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error upserting beds:", error);
    throw error;
  }
};

// Create a new bed type
export const createBedType = async (
  userId: string,
  name: string,
  siteId: string
): Promise<{ success: boolean; data: IBedType; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<IBedType>>(
      "/api/bed-types",
      { name, siteId },
      { headers }
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating bed type:", error);
    throw error;
  }
};

// Delete a bed type by ID
export const deleteBedType = async (
  userId: string,
  bedTypeId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.delete<ApiResponse<null>>(
      `/api/bed-types/${bedTypeId}`,
      { headers }
    );
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    console.error("Error deleting bed type:", error);
    throw error;
  }
};

// Update (rename) a bed type by ID
export const updateBedType = async (
  userId: string,
  bedTypeId: string,
  name: string,
  siteId: string
): Promise<{ success: boolean; data: IBedType; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.put<ApiResponse<IBedType>>(
      `/api/bed-types/${bedTypeId}/rename`,
      { name, siteId },
      { headers }
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error updating bed type:", error);
    throw error;
  }
};

// Bed check-in
export interface IBedCheckInPayload {
  caseId: string;
  caseName: string;
  bedId: string;
  bedName: string;
  room: string;
  bedTypeId: string;
  bedTypeName: string;
  checkInDate: string;
  notes?: string;
}

export const checkInBed = async (
  userId: string,
  payload: IBedCheckInPayload
) => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<null>>(
      "/api/beds/check-in",
      payload,
      { headers }
    );
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (err) {
    const error = err as ApiErrorResponse;
    // Return structured error response instead of throwing
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to check in bed",
      data: error?.response?.data || null,
    };
  }
};

export interface IBedEditCheckInPayload {
  checkInId: string;
  caseId: string;
  caseName: string;
  bedId: string;
  bedName: string;
  room: string;
  bedTypeId: string;
  bedTypeName: string;
  checkInDate: string;
  notes?: string;
}

export const editBedCheckIn = async (
  userId: string,
  payload: IBedEditCheckInPayload
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<null>>(
      "/api/beds/check-in/edit",
      payload,
      { headers }
    );
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    console.error("Error editing bed check-in:", error);
    throw error;
  }
};

export interface IBedCheckOutPayload {
  checkInId: string;
  checkOutDate: string;
  checkOutNotes?: string;
}

export const bedCheckOut = async (
  userId: string,
  payload: IBedCheckOutPayload
) => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<IBedCheckOutPayload>>(
      "/api/beds/check-out",
      payload,
      { headers }
    );

    return response?.data;
  } catch (error) {
    console.error("Error during bed check-out:", error);
    throw error;
  }
};

// -------------------------------------------------------------------------------------------------------------------
// Bed Requests API Services
// -------------------------------------------------------------------------------------------------------------------

export interface IBedCheckInRequestItem {
  _id: string;
  caseId: string;
  caseName: string;
  agencyId: string;
  agencyName: string;
  siteId: string;
  siteName: string;
  dateOfArrival: string;
  notes: string;
  sendMail: boolean;
  status: string;
  createdBy: {
    userId: string;
    userName: string;
    companyId: string;
    companyName: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  // New fields from updated API
  caseGender: string[];
  caseAge: number;
  hasAllocatedBed: boolean;
  currentBedAssignment: {
    checkInId: string;
    bedId: {
      _id: string;
      bedName: string;
      room: string;
      bedTypeId: string;
      siteId: string;
      availability: string;
      archived: boolean;
      companyId: string;
      companyName: string;
      createdBy: string;
      currentCheckInId: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
      isArchived: boolean;
      isDeleted: boolean;
    };
    bedName: string;
    room: string;
    bedTypeName: string;
    checkInDate: string;
    notes: string;
    siteId: string;
    siteName: string;
  } | null;
  // Legacy fields for backward compatibility
  caseImage?: string[];
  checkInDetails?: {
    checkInId: string;
    checkInDate: string;
    bedName: string;
    room: string;
    bedTypeId: string;
    bedTypeName: string;
    bedId: string;
    notes: string;
  } | null;
  checkOutDetails?: {
    checkOutDate: string;
    checkOutNotes: string;
    checkOutId: string;
    durationOfStay: {
      days: number;
      hours: number;
      minutes: number;
    };
  } | null;
  bedStatus?: "Available" | "Occupied" | "Unavailable";
  // --- Legacy fields for backward compatibility ---
  bedName?: string; // Only present in static/mock/demo data
  room?: string; // Only present in static/mock/demo data
  bedTypeName?: string; // Only present in static/mock/demo data
  denialReason?: string; // Only present in static/mock/demo data
  checkInDate?: string; // Only present in static/mock/demo data
  checkOutDate?: string; // Only present in static/mock/demo data
}

/**
 * Fetch all bed requests for the current user
 * @param userId - Current user's ID, used for authentication header.
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of items per page (default: 10)
 * @returns response containing an array of bed requests with pagination
 */
export const fetchAllBedRequests = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<
      ApiResponse<{
        data: IBedCheckInRequestItem[];
        pagination: Pagination;
      }>
    >(`/api/beds/request?page=${page}&limit=${limit}`, { headers });
    return response?.data;
  } catch (error) {
    console.error("Error fetching bed requests:", error);
    throw error;
  }
};

//-----------------------------------------------------------------------------------------------------------------------

export interface IDenyBedRequestPayload {
  denialReason: string;
}
/**
 * Deny a bed request by ID
 * @param userId - Current user's ID, used for authentication header.
 * @param requestId - The bed request ID to deny.
 * @param payload - The denial reason payload.
 * @returns response containing success and message
 */
export const denyBedRequest = async (
  userId: string,
  requestId: string,
  payload: IDenyBedRequestPayload
) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.post<ApiResponse<null>>(
      `/api/beds/request/${requestId}/deny`,
      payload,
      { headers }
    );
    return response?.data;
  } catch (error) {
    console.error("Error denying bed request:", error);
    throw error;
  }
};

//-----------------------------------------------------------------------------------------------------------------------

export interface IAvailableBedOfSiteForCheckIn {
  bedId: string;
  bedName: string;
  room: string;
  bedType: {
    bedTypeId: string;
    name: string;
  };
  availability: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAvailableBedsBySiteAPIResponse {
  siteId: string;
  siteName: string;
  siteAddress: string;
  city: string;
  state: string;
  zipCode: string;
  totalAvailableBeds: number;
  beds: IAvailableBedOfSiteForCheckIn[];
}

/**
 * Fetch available beds for a specified site.
 * @param siteId - ID of the site to fetch available beds from.
 * @param userId - Current user's ID, used for authentication header.
 * @returns The available beds data of the site
 */
export const fetchAvailableBedsBySite = async (
  siteId: string,
  userId: string
) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<
      ApiResponse<IAvailableBedsBySiteAPIResponse>
    >(`/api/beds/available/site/${siteId}`, { headers });
    return response?.data;
  } catch (error) {
    console.error("Error fetching available beds by site:", error);
    throw error;
  }
};

// -------------------------------------------------------------------------------------------------------------------
// Company-Site-Bed Summary API
// -------------------------------------------------------------------------------------------------------------------

export interface ICompanySiteBedTypeSummary {
  bedTypeId: string;
  bedTypeName: string;
  availableUnits: number;
  bedId: string;
  bedName: string;
  room: string;
}

export interface ICompanySiteSummary {
  siteId: string;
  siteName: string;
  totalAvailableBeds: number;
  bedTypes: ICompanySiteBedTypeSummary[];
}

export interface ICompanyBedSummary {
  companyId: string;
  companyName: string;
  sites: ICompanySiteSummary[];
}

/**
 * Fetch a summary of available beds of a company and site
 * @param userId - Current user's ID, used for authentication header.
 * @returns The company-site-bed summary response
 */
export const fetchCompanySiteBedSummary = async (userId: string) => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<ApiResponse<ICompanyBedSummary>>(
      "/api/beds",
      { headers }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching company-site-bed summary:", error);
    throw error;
  }
};

// -------------------------------------------------------------------------------------------------------------------
// Print Bed List API Service
// -------------------------------------------------------------------------------------------------------------------

export interface IPrintBedListPayload {
  listTitle: string;
  description?: string;
  siteIds?: string[];
  bedTypeIds?: string[];
  bedStatuses?: string[];
}

export interface IPrintBedListResponse {
  success: boolean;
  message: string;
  data: {
    sites: ISiteListItem[];
  };
}

/**
 * Generate a print bed list based on filters
 * @param userId - Current user's ID, used for authentication header.
 * @param payload - The print bed list configuration payload.
 * @returns response containing the bed list data for printing
 */
export const printBedList = async (
  userId: string,
  payload: IPrintBedListPayload
): Promise<IPrintBedListResponse> => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<
      ApiResponse<{ sites: ISiteListItem[] }>
    >("/api/beds/print-list", payload, { headers });
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error generating print bed list:", error);
    throw error;
  }
};

// -------------------------------------------------------------------------------------------------------------------
// Create Bed Request API Service
// -------------------------------------------------------------------------------------------------------------------

export interface ICreateBedRequestPayload {
  cases: { caseId: string; caseName: string }[];
  agencyId: string;
  agencyName: string;
  siteId: string;
  siteName: string;
  dateOfArrival: string;
  notes: string;
  sendMail: boolean;
}

export const createBedRequest = async (
  userId: string,
  payload: ICreateBedRequestPayload
) => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<
      ApiResponse<ICreateBedRequestPayload>
    >("/api/beds/request", payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Error creating bed request:", error);
    throw error;
  }
};

// Update (edit) a bed request by ID
export interface IUpdateBedRequestPayload {
  caseId: string;
  caseName: string;
  agencyId: string;
  agencyName: string;
  siteId: string;
  siteName: string;
  dateOfArrival: string;
  notes: string;
  sendMail: boolean;
}

export const updateBedRequest = async (
  userId: string,
  requestId: string,
  payload: IUpdateBedRequestPayload
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.put<ApiResponse<null>>(
      `/api/beds/request/${requestId}`,
      payload,
      { headers }
    );
    return { success: response.data.success, message: response.data.message };
  } catch (error: any) {
    console.error(
      "Error updating bed request:",
      error?.response?.data?.message
    );
    throw (
      error?.response?.data || error?.message || "Failed to update bed request"
    );
  }
};

export interface IAssignBedPayload {
  caseId: string;
  caseName: string;
  siteId: string;
  bedId: string;
  bedTypeId: string;
  bedTypeName: string;
  checkInDate: string;
  notes: string;
}

// -------------------------------------------------------------------------------------------------------------------
// Fetch Bed Requests for a Specific Case
// -------------------------------------------------------------------------------------------------------------------

/**
 * Fetch all bed requests for a specific case
 * @param userId - Current user's ID, used for authentication header.
 * @param caseId - The case ID to fetch bed requests for.
 * @returns response containing an array of bed requests for the case
 *
 * Example usage:
 *   fetchBedRequestsByCase('2zL50iglbhpARq5M27Iv', '686d092b0156ea1f8b879b72')
 */
export const fetchBedRequestsByCase = async (
  userId: string,
  caseId: string,
  page: number = 1,
  limit: number = 10
): Promise<
  ApiResponse<{
    data: IBedCheckInRequestItem[];
    pagination: Pagination;
  }>
> => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.get<
      ApiResponse<{
        data: IBedCheckInRequestItem[];
        pagination: Pagination;
      }>
    >(`/api/beds/request/case/${caseId}?page=${page}&limit=${limit}`, {
      headers,
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching bed requests by case:", error);
    throw error;
  }
};

export const deleteBedRequest = async (
  userId: string,
  requestId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const headers = {
      "x-user-id": userId,
    };
    const response = await backendApi.delete<ApiResponse<null>>(
      `/api/beds/request/${requestId}`,
      { headers }
    );
    return { success: response.data.success, message: response.data.message };
  } catch (error) {
    console.error("Error deleting bed request:", error);
    return { success: false, message: "Failed to delete bed request." };
  }
};
export const assignBed = async (
  payload: IAssignBedPayload,
  userId?: string,
  locationId?: string
) => {
  try {
    const headers = {
      "x-user-id": userId,
      "x-location-id": locationId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.post<ApiResponse<IAssignBedPayload>>(
      "/api/beds/assign",
      payload,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning bed:", error);
    throw error;
  }
};

interface IEditBedAssignmentPayload {
  caseId: string;
  caseName: string;
  agencyId: string;
  agencyName: string;
  siteId: string;
  siteName: string;
  dateOfArrival: string;
  notes: string;
  sendMail: boolean;
}

export const editBedAssignment = async (
  bedRequestId: string,
  payload: IEditBedAssignmentPayload,
  userId?: string,
  locationId?: string
) => {
  try {
    const headers = {
      "x-user-id": userId,
      "x-location-id": locationId,
      "Content-Type": "application/json",
    };
    const response = await backendApi.put<
      ApiResponse<IEditBedAssignmentPayload>
    >(`/api/beds/request/${bedRequestId}`, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Error editing bed assignment:", error);
    throw error;
  }
};
