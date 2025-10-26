import { useEffect, useState } from "react";
import backendApi from "@/api/api";
import type { ApiResponse, DecryptedUserData } from "@/types/api";

export function useUserContext() {
  const [userData, setUserData] = useState<DecryptedUserData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = async (event: any) => {
      const { data } = event;
      if (data.message === "REQUEST_USER_DATA_RESPONSE") {
        const encryptedData = data.payload;

        try {
          const response = await backendApi.post<
            ApiResponse<DecryptedUserData>
          >("/api/ghl-location/decrypt-user-data", {
            encryptedData,
          });

          if (response.data.success && response.data.data) {
            const userData = response.data.data;
            if (!userData.propertyRole) {
              userData.propertyRole = userData.role;
            }
            setUserData(userData);
            setError("");
          } else {
            setError(response.data.message || "Failed to decrypt user data.");
            setUserData(null);
          }
        } catch (err: any) {
          console.error("Decryption failed:", err);
          setError(err.message || "An error occurred during decryption.");
          setUserData(null);
        }
      }
    };

    window.addEventListener("message", handler);

    window.parent.postMessage({ message: "REQUEST_USER_DATA" }, "*");

    return () => window.removeEventListener("message", handler);
  }, []);

  return { userData, error };
}
