import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - add token if available
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        try {
          const { state } = JSON.parse(authStore);
          const token = state?.accessToken;

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token added to request:', config.url);
          } else {
            console.warn('No token found in auth store');
          }
        } catch (error) {
          console.error('Error parsing auth token:', error);
        }
      } else {
        console.warn('No auth-storage found in localStorage');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
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

// Admin API client with /admin prefix
export const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adminApiClient to add auth token
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // This should ideally also use auth-storage
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
      localStorage.removeItem('auth_token'); // This should also be updated to check auth-storage
    }
    return Promise.reject(error);
  }
);

export default apiClient;