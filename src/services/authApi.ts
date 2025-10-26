import backendApi from "@/api/api";
import type { ApiResponse } from "@/types/api";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface BackendUserData {
  user: {
    userId: string;
    companyId: string;
    activeLocation: string;
    propertyRole: string;
    userName: string;
    email: string;
    isActive: boolean;
    allowPrivateCases: boolean;
    userType: string;
    locations: string[];
  };
}

export const sendOTP = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await backendApi.post<ApiResponse<any>>(
      "/api/auth/send-otp",
      {
        email,
      }
    );

    return {
      success: response.data.success,
      message: response.data.message || "OTP sent successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Send OTP error:", error);
    throw new Error(error?.response?.data?.message || "Failed to send OTP");
  }
};

export const verifyOTP = async (
  email: string,
  otp: string
): Promise<AuthResponse> => {
  try {
    const response = await backendApi.post<ApiResponse<BackendUserData>>(
      "/api/auth/verify-otp",
      {
        email,
        otp,
      }
    );

    return {
      success: response.data.success,
      message: response.data.message || "OTP verified successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    throw new Error(error?.response?.data?.message || "Failed to verify OTP");
  }
};

export const resendOTP = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await backendApi.post<ApiResponse<any>>(
      "/api/auth/resend-otp",
      {
        email,
      }
    );

    return {
      success: response.data.success,
      message: response.data.message || "OTP resent successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    throw new Error(error?.response?.data?.message || "Failed to resend OTP");
  }
};

export const logout = async (): Promise<void> => {
  try {
    await backendApi.post("/api/auth/logout");
    // Redux persist will handle clearing user data automatically
  } catch (error: any) {
    console.error("Logout error:", error);
    // Redux persist will handle clearing user data automatically
  }
};
