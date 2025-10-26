import backendApi from "@/api/api";
import type { Country } from "@/types/index";
import type { ApiResponse } from "@/types/api";

export const createCountry = async (
  name: string,
  USER_ID: string
): Promise<Country> => {
  try {
    const response = await backendApi.post<ApiResponse<Country>>(
      "/api/countries",
      { name },
      { headers: { "x-user-id": USER_ID } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to create country";
    throw new Error(message);
  }
};

export const getCountries = async (
  USER_ID: string,
  LOCATION_ID?: string
): Promise<Country[]> => {
  try {
    const response = await backendApi.get<ApiResponse<Country[]>>("/api/countries", {
      headers: { "x-user-id": USER_ID, "x-location-id": LOCATION_ID },
    });
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to fetch countries";
    throw new Error(message);
  }
};

export const deleteCountry = async (
  countryId: string,
  USER_ID: string
): Promise<{ success: boolean }> => {
  try {
    const response = await backendApi.delete<ApiResponse<{ success: boolean }>>(
      `/api/countries/${countryId}`,
      {
        headers: { "x-user-id": USER_ID },
      }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to delete country";
    throw new Error(message);
  }
};

export const updateCountry = async (
  countryId: string,
  name: string,
  USER_ID: string
): Promise<Country> => {
  try {
    const response = await backendApi.put<ApiResponse<Country>>(
      `/api/countries/${countryId}`,
      { name },
      { headers: { "x-user-id": USER_ID, "Content-Type": "application/json" } }
    );
    return response.data.data;
  } catch (error) {
    const message =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ||
      (error as Error).message ||
      "Failed to update country";
    throw new Error(message);
  }
};
