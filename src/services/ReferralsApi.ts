import backendApi from "@/api/api";
import type { AgencyReferralRecord } from "@/types";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";

export interface AgencyReferralResponse {
    data: AgencyReferralRecord[];
    pagination: Pagination;
}

export const fetchReferralsByAgency = async (
    page = 1,
    limit = 10,
    status?: string,
    category?: string,
    search?: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
    locationId?: string,
    agencyId?: string,
) => {
    try {
        const params = new URLSearchParams({
            id: agencyId || "",
            page: String(page),
            limit: String(limit),
        });
        if (status) params.append('status', status);
        if (category) params.append('category', category);
        if (search) params.append('search', search);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await backendApi.get<ApiResponse<AgencyReferralResponse>>(
            `/api/assistance/referral/by-agency?${params.toString()}`, {
            headers: {
                'x-user-id': userId,
                'x-location-id': locationId,
            },
        }
        );
        return response.data;
    } catch (error: any) {
        console.error("Error fetching agency referrals:", error);
        throw error?.response?.data?.message;
    }
};