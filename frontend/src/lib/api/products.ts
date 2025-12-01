import apiClient from './client';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';

export const productsAPI = {
  getAll: async (
    filters?: ProductFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    if (filters?.category_id) params.append('category_id', String(filters.category_id));
    if (filters?.merchant_id) params.append('merchant_id', String(filters.merchant_id));
    if (filters?.min_price) params.append('min_price', String(filters.min_price));
    if (filters?.max_price) params.append('max_price', String(filters.max_price));
    if (filters?.is_bestseller) params.append('is_bestseller', 'true');
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${slug}`);
    return response.data;
  },

  getBestsellers: async (limit: number = 12): Promise<Product[]> => {
    const response = await apiClient.get(`/products/bestsellers?limit=${limit}`);
    return response.data;
  },

  getByCategory: async (
    categoryId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get(
      `/products?category_id=${categoryId}&page=${page}&page_size=${pageSize}`
    );
    return response.data;
  },

  search: async (query: string, limit: number = 10): Promise<Product[]> => {
    const response = await apiClient.get(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  getRelated: async (productId: number, limit: number = 6): Promise<Product[]> => {
    const response = await apiClient.get(`/products/${productId}/related?limit=${limit}`);
    return response.data;
  },

  // Admin endpoints
  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/admin/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.patch(`/admin/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  updateVariant: async (
    productId: number,
    variantId: number,
    data: { selling_price?: number; is_available?: boolean; stock_quantity?: number }
  ): Promise<void> => {
    await apiClient.patch(`/admin/products/${productId}/variants/${variantId}`, data);
  },
};
