import { useQuery } from "@tanstack/react-query";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import type { DoctorResponse } from "@shared/schema";

export function useAuth() {
  const token = getAuthToken();

  const {
    data: doctor,
    isLoading,
    error,
  } = useQuery<DoctorResponse>({
    queryKey: ["doctor", token], // cleaner key
    queryFn: async () => {
      if (!token) {
        throw new Error("No authentication token");
      }

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "https://production.up.railway.app";
      //const response = await fetch(`${backendUrl}/api/v1/doctors/me`, {
      const response = await fetch(`${backendUrl}/doctors/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

       
      if (!response.ok) {
        // If token invalid or expired → clear it
        if (response.status === 401 || response.status === 403) {
          removeAuthToken();
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      return response.json();

    

     






    },
    enabled: !!token, // only runs if token exists
    retry: false,
  });

  return {
    doctor,
    isLoading: isLoading && !!token,
    isAuthenticated: !!doctor && !!token,
    error,
  };
}
