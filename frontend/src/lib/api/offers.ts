import apiClient from './client';
import type { Offer, OfferFilters, PaginatedResponse } from '@/types';

export const offersAPI = {
  getAll: async (
    filters?: OfferFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Offer>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    if (filters?.merchant_id) params.append('merchant_id', String(filters.merchant_id));
    if (filters?.category_id) params.append('category_id', String(filters.category_id));
    if (filters?.offer_type) params.append('offer_type', filters.offer_type);
    if (filters?.is_exclusive) params.append('is_exclusive', 'true');
    if (filters?.is_verified) params.append('is_verified', 'true');
    if (filters?.has_cashback) params.append('has_cashback', 'true');
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);

    const response = await apiClient.get(`/offers?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Offer> => {
    const response = await apiClient.get(`/offers/${id}`);
    return response.data;
  },

  getByMerchant: async (
    merchantId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Offer>> => {
    const response = await apiClient.get(
      `/offers?merchant_id=${merchantId}&page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  getFeatured: async (limit: number = 12): Promise<Offer[]> => {
    const response = await apiClient.get(`/offers/featured?limit=${limit}`);
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  getExclusive: async (limit: number = 12): Promise<Offer[]> => {
    const response = await apiClient.get(`/offers/exclusive?limit=${limit}`);
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    return [];
  },

  getExpiringSoon: async (days: number = 7, limit: number = 12): Promise<Offer[]> => {
    const response = await apiClient.get(`/offers/expiring-soon?days=${days}&limit=${limit}`);
    return response.data;
  },

  trackClick: async (offerId: number): Promise<{ redirect_url: string; click_id: string }> => {
    const response = await apiClient.post(`/offers/${offerId}/click`);
    return response.data;
  },

  reportSuccess: async (offerId: number): Promise<void> => {
    await apiClient.post(`/offers/${offerId}/success`);
  },

  // Admin endpoints
  create: async (data: Partial<Offer>): Promise<Offer> => {
    const response = await apiClient.post('/admin/offers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Offer>): Promise<Offer> => {
    const response = await apiClient.patch(`/admin/offers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/offers/${id}`);
  },

  duplicate: async (id: number): Promise<Offer> => {
    const response = await apiClient.post(`/admin/offers/${id}/duplicate`);
    return response.data;
  },
};
