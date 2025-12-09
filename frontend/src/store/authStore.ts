import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { authAPI } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  setAuthFromGoogle: (user: User, accessToken: string, refreshToken: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  refreshAccessToken: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response: AuthResponse = await authAPI.login(credentials);
          
          // Ensure user object has proper role
          const user = {
            ...response.user,
            is_admin: response.user.role === 'admin' || response.user.is_admin,
          };
          
          set({
            user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Return user object so login page can handle redirect
          return user;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response: AuthResponse = await authAPI.register(data);
          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateUser: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, isLoading: false, error: null });
      },

      setTokens: (access: string, refresh: string) => {
        set({ accessToken: access, refreshToken: refresh });
      },

      setAuthFromGoogle: (user: User, accessToken: string, refreshToken: string) => {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({
          user,
          accessToken,
          refreshToken: refreshToken || accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      setError: (error: string) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const response = await authAPI.refreshToken(refreshToken);
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token || refreshToken,
          });
        } catch {
          get().logout();
        }
      },

      checkAuth: async () => {
        const { accessToken, isAuthenticated } = get();
        if (!accessToken) {
          return false;
        }
        if (isAuthenticated) {
          return true;
        }
        set({ isLoading: true });
        try {
          const user = await authAPI.getProfile();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch {
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    }
  ),
  shallow
);