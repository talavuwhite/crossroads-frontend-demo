import backendApi from "@/api/api";
import type {
  EventActivity,
  EventActivityData,
  EventData,
  EventLocation,
  EventLocationData,
  EventsData,
  EventTypeData,
} from "@/types";
import type { ApiResponse } from "@/types/api";

interface CreateActivityData {
  name: string;
  type: string;
}

export const createEventActivity = async (
  activityData: CreateActivityData,
  userId: string,
  locationId: string
): Promise<EventActivity> => {
  try {
    const response = await backendApi.post<ApiResponse<EventActivity>>(
      "/api/event-activities",
      activityData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error creating event activity:",
      error.response?.data?.message
    );
    throw error.response?.data?.message;
  }
};

export const getEventActivity = async (
  userId: string,
  locationId: string,
  page?: number,
  limit?: number
): Promise<ApiResponse<EventActivityData>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventActivityData>>(
      `/api/event-activities?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching event activities:", error);
    throw error.response?.data?.message || "Failed to fetch event activities";
  }
};

export const updateEventActivity = async (
  activityId: string,
  activityData: CreateActivityData,
  userId: string,
  locationId: string
): Promise<EventActivity> => {
  try {
    const response = await backendApi.put<ApiResponse<EventActivity>>(
      `/api/event-activities/${activityId}`,
      activityData,
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
    console.error("Error updating event activity:", error);
    throw error.response?.data?.message || "Failed to update event activity";
  }
};

export const deleteEventActivity = async (
  activityId: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(
      `/api/event-activities/${activityId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
  } catch (error: any) {
    console.error("Error deleting event activity:", error);
    throw error.response?.data?.message || "Failed to delete event activity";
  }
};

interface CreateLocationData {
  name: string;
  type: string;
}

export const createEventLocation = async (
  locationData: CreateLocationData,
  userId: string,
  locationId: string
): Promise<EventLocation> => {
  try {
    const response = await backendApi.post<ApiResponse<EventLocation>>(
      "/api/event-locations",
      locationData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error creating event location:",
      error.response?.data?.message
    );
    throw error.response?.data?.message;
  }
};

export const getEventLocations = async (
  page: number,
  limit: number,
  userId: string,
  locationId: string
): Promise<ApiResponse<EventLocationData>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventLocationData>>(
      `/api/event-locations?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching event locations:", error);
    throw error.response?.data?.message || "Failed to fetch event locations";
  }
};

export const getEventLocationsDedicated = async (
  userId: string,
  locationId: string
): Promise<ApiResponse<EventLocation[]>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventLocation[]>>(
      `/api/event-locations/dedicated`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching event locations:", error);
    throw error.response?.data?.message || "Failed to fetch event locations";
  }
};

export const updateEventLocation = async (
  eventLocationId: string,
  locationData: CreateLocationData,
  userId: string,
  locationId: string
): Promise<EventLocation> => {
  try {
    const response = await backendApi.put<ApiResponse<EventLocation>>(
      `/api/event-locations/${eventLocationId}`,
      locationData,
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
    console.error("Error updating event location:", error);
    throw error.response?.data?.message || "Failed to update event location";
  }
};

export const deleteEventLocation = async (
  eventLocationId: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(
      `/api/event-locations/${eventLocationId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
  } catch (error: any) {
    console.error("Error deleting event location:", error);
    throw error.response?.data?.message || "Failed to delete event location";
  }
};

interface CreateEventsTypeData {
  name: string;
}

export const getEventTypes = async (
  userId: string,
  locationId: string
): Promise<ApiResponse<EventTypeData[]>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventTypeData[]>>(
      `/api/event-types`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching event types:", error);
    throw error.response?.data?.message || "Failed to fetch event types";
  }
};

export const createEventType = async (
  eventTypeData: CreateEventsTypeData,
  userId: string,
  locationId: string
): Promise<EventTypeData> => {
  try {
    const response = await backendApi.post<ApiResponse<EventTypeData>>(
      "/api/event-types",
      eventTypeData,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating event type:", error.response?.data?.message);
    throw error.response?.data?.message;
  }
};

export const updateEventType = async (
  eventTypeId: string,
  eventTypeData: CreateEventsTypeData,
  userId: string,
  locationId: string
): Promise<EventTypeData> => {
  try {
    const response = await backendApi.put<ApiResponse<EventTypeData>>(
      `/api/event-types/${eventTypeId}`,
      eventTypeData,
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
    console.error("Error updating event type:", error);
    throw error.response?.data?.message || "Failed to update event type";
  }
};

export const deleteEventType = async (
  eventTypeId: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(
      `/api/event-types/${eventTypeId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
  } catch (error: any) {
    console.error("Error deleting event type:", error);
    throw error.response?.data?.message || "Failed to delete event type";
  }
};

export const getAllEvents = async (
  page: number,
  limit: number,
  userId: string,
  locationId: string
): Promise<ApiResponse<EventsData>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventsData>>(
      `/api/events?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching events:", error);
    throw error.response?.data?.message || "Failed to fetch events";
  }
};

export const myAgencyGetEvents = async (
  page: number,
  limit: number,
  userId: string,
  locationId: string
): Promise<ApiResponse<EventsData>> => {
  try {
    const response = await backendApi.get<ApiResponse<EventsData>>(
      `/api/events/my-agency-events?page=${page}&limit=${limit}`,
      {
        headers: {
          "x-user-id": userId,
          "x-location-id": locationId,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching events:", error);
    throw error.response?.data?.message || "Failed to fetch events";
  }
};

export const createEvent = async (
  eventData: FormData,
  userId: string,
  locationId: string
): Promise<EventData> => {
  try {
    const response = await backendApi.post<ApiResponse<EventData>>(
      "/api/events",
      eventData,
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
    console.error("Error creating events:", error.response?.data?.message);
    throw error.response?.data?.message;
  }
};

export const updateEvent = async (
  eventId: string,
  eventData: FormData,
  userId: string,
  locationId: string
): Promise<ApiResponse<EventData>> => {
  try {
    const response = await backendApi.put<ApiResponse<EventData>>(
      `/api/events/${eventId}`,
      eventData,
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
    console.error("Error updating event:", error);
    throw error.response?.data?.message || "Failed to update event";
  }
};

export const deleteEvent = async (
  eventId: string,
  userId: string,
  locationId: string
): Promise<void> => {
  try {
    await backendApi.delete<ApiResponse<void>>(`/api/events/${eventId}`, {
      headers: {
        "x-user-id": userId,
        "x-location-id": locationId,
      },
    });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    throw error.response?.data?.message || "Failed to delete event";
  }
};
