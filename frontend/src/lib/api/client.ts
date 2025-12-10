import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return 'http://127.0.0.1:8000/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
};

const API_URL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (zustand persists here)
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          if (state?.accessToken) {
            config.headers.Authorization = `Bearer ${state.accessToken}`;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.refreshToken) {
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refresh_token: state.refreshToken,
            });

            const { access_token, refresh_token } = (response.data?.data ?? response.data) as { access_token: string; refresh_token?: string };

            // Update stored tokens
            const updatedState = {
              ...state,
              accessToken: access_token,
              refreshToken: refresh_token || state.refreshToken,
            };
            localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh failed, clear auth but don't redirect - let components handle auth errors gracefully
        localStorage.removeItem('auth-storage');
      }
    }

    // Format error message - handle both string and object detail
    const responseData = error.response?.data as { detail?: string | { message?: string; errors?: string[] } };
    let errorMessage = 'An unexpected error occurred';
    
    if (responseData?.detail) {
      if (typeof responseData.detail === 'string') {
        errorMessage = responseData.detail;
      } else if (typeof responseData.detail === 'object') {
        // Handle object detail like {"message": "...", "errors": [...]}
        errorMessage = responseData.detail.message || 
                       responseData.detail.errors?.join(', ') || 
                       JSON.stringify(responseData.detail);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;