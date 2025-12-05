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
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage);
          const token = authData?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Auth token attached to request:", config.url);
          }
        } catch (error) {
          console.error("Failed to parse auth storage:", error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized request to:', error.config?.url);
    }
    if (error.response?.status === 404) {
      console.error('Endpoint not found:', error.config?.url);
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
    if (error.response?.status === 401) {
      console.error('Admin API unauthorized:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default apiClient;