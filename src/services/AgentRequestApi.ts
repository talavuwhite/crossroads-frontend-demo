import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";

export interface AgentRequest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  agencyId: string;
  agencyName?: string;
  subAgencyId?: string;
  subAgencyName?: string;
  requestedBy: {
    userId: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  reason?: string; // rejection reason
  createdAt: string;
  updatedAt: string;
  orgName?: string;
}

export interface CreateAgentRequestPayload {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; // "user"
  type: string; // "account"
  userType: string; // "Agency" | "SubAgency"
  propertyRole: string; // e.g., "Agent"
  locationIds: string[];
}

export interface AgentRequestsResponse {
  requests: AgentRequest[];
  pagination: Pagination;
}

export interface ApproveAgentRequestResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export interface DenyAgentRequestResponse {
  success: boolean;
  message: string;
}

/**
 * Create a new agent request
 */
export const createAgentRequest = async (
  requestData: CreateAgentRequestPayload,
  userId: string,
  locationId: string
): Promise<ApiResponse<AgentRequest>> => {
  try {
    const response = await backendApi.post<ApiResponse<AgentRequest>>(
      `/api/agent-approvals`,
      requestData,
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
    console.error("Error creating agent request:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Get agent requests for network administrators
 */
export const getAgentRequests = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: "pending" | "approved" | "rejected",
  search?: string,
  agencyId?: string,
  locationId?: string
): Promise<ApiResponse<AgentRequestsResponse>> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status) params.append("status", status);
    if (search) params.append("search", search);
    if (agencyId) params.append("agencyId", agencyId);
    if (locationId) params.append("locationId", locationId);

    const response = await backendApi.get<ApiResponse<AgentRequestsResponse>>(
      `/api/agent-approvals?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching agent requests:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Get agent requests for the current user (agency administrators)
 */
export const getMyAgentRequests = async (
  userId: string,
  locationId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<AgentRequestsResponse>> => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await backendApi.get<ApiResponse<AgentRequestsResponse>>(
      `/api/agent-approvals?${params.toString()}`,
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
    console.error("Error fetching my agent requests:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Approve an agent request
 */
export const approveAgentRequest = async (
  requestId: string,
  userId: string
): Promise<ApiResponse<ApproveAgentRequestResponse>> => {
  try {
    const response = await backendApi.put<
      ApiResponse<ApproveAgentRequestResponse>
    >(
      `/api/agent-approvals/${requestId}/approve`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error approving agent request:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Deny an agent request
 */
export const denyAgentRequest = async (
  requestId: string,
  reason: string,
  userId: string
): Promise<ApiResponse<DenyAgentRequestResponse>> => {
  try {
    const response = await backendApi.put<
      ApiResponse<DenyAgentRequestResponse>
    >(
      `/api/agent-approvals/${requestId}/reject`,
      { reason },
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error denying agent request:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Get a single agent request by ID
 */
export const getAgentRequestById = async (
  requestId: string,
  userId: string
): Promise<ApiResponse<AgentRequest>> => {
  try {
    const response = await backendApi.get<ApiResponse<AgentRequest>>(
      `/api/agent-approvals/${requestId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching agent request:", error);
    throw error?.response?.data || error;
  }
};

/**
 * Cancel/withdraw an agent request (only for pending requests by the creator)
 */
export const cancelAgentRequest = async (
  requestId: string,
  userId: string,
  locationId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const response = await backendApi.delete<
      ApiResponse<{ success: boolean; message: string }>
    >(`/api/agent-approvals/${requestId}`, {
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error canceling agent request:", error);
    throw error?.response?.data || error;
  }
};
