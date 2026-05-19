import { API_BASE } from "@/config/constants";
import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes – large base64 image payloads need more time
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor.
//
// Intentionally does NOT auto-logout on 401. The backend issues JWTs with no
// expiration (see auth.service.ts / customer.service.ts), so the user should
// remain signed in until they explicitly click Logout. A spurious 401 from a
// single endpoint — Redis blip, a misconfigured route, etc. — must not wipe
// the session and reload the whole app. The 401 still bubbles up to the
// caller so individual screens can render their own error states.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error),
);

export default apiClient;
