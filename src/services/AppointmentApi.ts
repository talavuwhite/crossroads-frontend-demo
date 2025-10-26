import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";
import type { Pagination } from "@/types/case";

export interface AppointmentContact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AppointmentCreatedBy {
  name: string;
  userId: string;
}

export interface Appointment {
  _id: string;
  ghlAppointmentId: string;
  startTime: string;
  endTime: string;
  contact: AppointmentContact;
  note?: string;
  caseId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: AppointmentCreatedBy;
  status: string;
  locationId: string;
  appointmentName: string;
  companyName: string;
}
export interface FetchAppointmentsResponse {
  results: Appointment[];
  pagination: Pagination;
}

export const fetchAppointments = async (
  caseId: string,
  page: number = 1,
  limit: number = 10,
  userId?: string,
  locationId?: string
): Promise<ApiResponse<FetchAppointmentsResponse>> => {
  try {
    const response = await backendApi.get<
      ApiResponse<FetchAppointmentsResponse>
    >(`/api/appointment/${caseId}?page=${page}&limit=${limit}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    throw error?.response?.data?.message || error.message;
  }
};
