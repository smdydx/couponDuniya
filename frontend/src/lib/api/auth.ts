import apiClient from './client';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

function normalizeUser(u: any): User {
  const fullName: string | undefined = u?.full_name;
  const [first, ...rest] = (fullName || '').trim().split(' ');
  const last = rest.join(' ');
  return {
    id: Number(u?.id ?? 0),
    email: u?.email ?? '',
    mobile: u?.mobile ?? undefined,
    first_name: first || undefined,
    last_name: last || undefined,
    role: 'customer',
    is_email_verified: Boolean(u?.is_verified ?? false),
    is_mobile_verified: Boolean(u?.is_verified ?? false),
    kyc_status: 'pending',
    referral_code: u?.referral_code ?? '',
    referred_by_code: undefined,
    avatar_url: undefined,
    date_of_birth: undefined,
    gender: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', {
      identifier: credentials.email,
      password: credentials.password,
    });
    const data = response.data?.data ?? response.data;
    return {
      user: normalizeUser(data.user),
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type ?? 'bearer',
    };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    const payload = response.data?.data ?? response.data;
    return {
      user: normalizeUser(payload.user),
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      token_type: payload.token_type ?? 'bearer',
    };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> => {
    const response = await apiClient.post('/auth/refresh-token', { refresh_token: refreshToken });
    const data = response.data?.data ?? response.data;
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    const data = response.data?.data ?? response.data;
    return normalizeUser(data);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch('/auth/me', data);
    const payload = response.data?.data ?? response.data;
    return normalizeUser(payload);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  requestOtp: async (mobile: string): Promise<void> => {
    await apiClient.post('/auth/request-otp', { mobile });
  },

  verifyOtp: async (mobile: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/verify-otp', { mobile, otp });
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post('/auth/verify-email', { token });
  },
};
