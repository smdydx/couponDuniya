import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('replit.dev') || hostname.includes('repl.co')) {
      return `https://${hostname.replace('-00-', '-00-').replace('5000', '8000')}/api/v1`.replace(':5000', '').replace(/\/+$/, '');
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
};

const API_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
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
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Assuming useAuthStore is available and has refreshAccessToken and accessToken
        // This part relies on the existence and proper setup of your auth store
        // If 'useAuthStore' is not defined, you'll need to import it or define it.
        // For example: import { useAuthStore } from '@/path/to/your/authStore';
        const { refreshAccessToken } = await import('@/store/authStore'); // Adjust path as necessary
        const { accessToken } = await import('@/store/authStore'); // Adjust path as necessary

        await refreshAccessToken(); // Call the refresh token function

        const currentAccessToken = accessToken(); // Get the new access token
        originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        const { logout } = await import('@/store/authStore'); // Adjust path as necessary
        logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      // Silently handle 403 errors
      return Promise.reject(error);
    }

    // For other errors, just reject the promise
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
  (error) => {
    // Silently handle errors without console logs
    return Promise.reject(error);
  }
);

export default apiClient;