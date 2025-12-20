import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/backend-api/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
};

const API_BASE_URL = typeof window !== 'undefined'
  ? '/backend-api/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  validateStatus: (status) => status < 500, // Don't throw on client errors (4xx)
});

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const authStore = localStorage.getItem('auth-storage');
  if (authStore) {
    try {
      const { state } = JSON.parse(authStore);
      return state?.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // In a real app, you'd import and use your auth store here, e.g.:
    // import { useAuthStore } from '@/store/authStore';
    // const state = useAuthStore.getState();
    // const token = state.accessToken;

    // For now, directly access localStorage for the token
    let token = localStorage.getItem('access_token');

    // Fallback to auth-storage if access_token is not found
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.accessToken || null;
        } catch (e) {
          console.error('Failed to parse auth storage:', e);
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error - return empty data structure instead of rejecting
    if (!error.response) {
      console.warn("Network error - API unavailable:", error.message);
      return Promise.resolve({ data: { data: null } });
    }

    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("refreshToken", refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 errors gracefully for non-admin pages
    if (error.response?.status === 403) {
      console.warn("Access forbidden:", error.config?.url);
    }

    return Promise.reject(error);
  }
);

// Admin API client with /admin prefix - uses same auth as main client
export const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => status < 500, // Don't throw on client errors (4xx)
});

// Request interceptor for adminApiClient - use same auth-storage as main client
adminApiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for adminApiClient
adminApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 403 - clear auth and redirect
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;