import apiClient from './client';
import type { Merchant, MerchantFilters, PaginatedResponse } from '@/types';

export const merchantsAPI = {
  getAll: async (
    filters?: MerchantFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Merchant>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    if (filters?.category_id) params.append('category_id', String(filters.category_id));
    if (filters?.is_featured) params.append('is_featured', 'true');
    if (filters?.has_cashback) params.append('has_cashback', 'true');
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);

    const response = await apiClient.get(`/merchants?${params.toString()}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Merchant> => {
    const response = await apiClient.get(`/merchants/${slug}`);
    return response.data;
  },

  getFeatured: async (limit: number = 12): Promise<Merchant[]> => {
    const response = await apiClient.get(`/merchants/featured?limit=${limit}`);
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  getPopular: async (limit: number = 12): Promise<Merchant[]> => {
    const response = await apiClient.get(`/merchants/popular?limit=${limit}`);
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  search: async (query: string, limit: number = 10): Promise<Merchant[]> => {
    const response = await apiClient.get(`/merchants/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Admin endpoints
  create: async (data: Partial<Merchant>): Promise<Merchant> => {
    const response = await apiClient.post('/admin/merchants', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Merchant>): Promise<Merchant> => {
    const response = await apiClient.patch(`/admin/merchants/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/merchants/${id}`);
  },

  toggleActive: async (id: number, isActive: boolean): Promise<Merchant> => {
    const response = await apiClient.patch(`/admin/merchants/${id}`, { is_active: isActive });
    return response.data;
  },
};
