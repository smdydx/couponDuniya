import apiClient from './client';

export interface DashboardStats {
  orders: { total: number; today: number };
  revenue: { total: number; today: number };
  users: { total: number; new_this_week: number };
  withdrawals: { pending_count: number; pending_amount: number };
  catalog: { active_merchants: number; active_offers: number; available_products: number };
  redis: { connected: boolean; keys_count: number; memory_used: string; connected_clients: number };
}

export interface Merchant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_active: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  business_name?: string;
  business_email?: string;
  business_phone?: string;
  business_address?: string;
  business_city?: string;
  business_state?: string;
  business_pincode?: string;
  business_country?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
  website_url?: string;
  affiliate_url?: string;
  tracking_url?: string;
  commission_rate?: number;
  cashback_rate?: number;
  platform_commission?: number;
  created_at?: string;
}

export interface Offer {
  id: number;
  merchant_id: number;
  merchant_name?: string;
  title: string;
  description?: string;
  code?: string;
  image_url?: string;
  priority: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: number;
  merchant_id: number;
  category_id?: number;
  merchant_name?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  mobile?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  wallet_balance: number;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  created_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  user_email?: string;
  total_amount: number;
  status: string;
  payment_status: string;
  items_count?: number;
  created_at?: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  method: string;
  status: string;
  account_details?: string;
  admin_notes?: string;
  transaction_id?: string;
  created_at?: string;
  processed_at?: string;
}

export interface GiftCard {
  id: number;
  code: string;
  initial_value: number;
  remaining_value: number;
  is_active: boolean;
  user_id?: number;
  expires_at?: string;
  created_at?: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export interface RevenueSeries {
  date: string;
  revenue: number;
  orders: number;
}

const adminApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get('/admin/analytics/dashboard');
      
      if (response.data?.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }

      throw new Error("Invalid response format");
    } catch (error: any) {
      // Check for verification error
      if (error.response?.data?.error?.message?.includes("not verified")) {
        console.error("❌ Admin account is not verified. Please verify your account first.");
        throw new Error("ACCOUNT_NOT_VERIFIED");
      }
      
      // Check for 403 - unauthorized
      if (error.response?.status === 403) {
        console.error("❌ Access denied. Admin privileges required.");
        throw new Error("ACCESS_DENIED");
      }

      console.error("Dashboard API error:", error.message, error.response?.data);

      // Return empty data structure for other errors
      return {
        orders: { total: 0, today: 0 },
        revenue: { total: 0, today: 0 },
        users: { total: 0, new_this_week: 0 },
        withdrawals: { pending_count: 0, pending_amount: 0 },
        catalog: { active_merchants: 0, active_offers: 0, available_products: 0 },
        redis: { connected: false, keys_count: 0, memory_used: "0 MB", connected_clients: 0 }
      };
    }
  },

  getRevenueAnalytics: async (days: number = 30): Promise<{ series: RevenueSeries[]; period_days: number }> => {
    const response = await apiClient.get(`/admin/analytics/revenue?days=${days}`);
    return response.data?.data || response.data;
  },

  getTopMerchants: async (limit: number = 10) => {
    const response = await apiClient.get(`/admin/analytics/top-merchants?limit=${limit}`);
    return response.data?.data || response.data;
  },

  getMerchants: async (params: { page?: number; limit?: number; search?: string; is_active?: boolean } = {}): Promise<{ merchants: Merchant[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));

    const response = await apiClient.get(`/admin/merchants?${queryParams.toString()}`);
    const data = response.data;
    if (data?.merchants && data?.pagination) {
      return { merchants: data.merchants, pagination: data.pagination };
    }
    if (data?.data?.merchants && data?.data?.pagination) {
      return { merchants: data.data.merchants, pagination: data.data.pagination };
    }
    return { merchants: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  createMerchant: async (data: Omit<Merchant, 'id' | 'created_at'>): Promise<Merchant> => {
    const response = await apiClient.post('/admin/merchants', data);
    return response.data?.data || response.data;
  },

  updateMerchant: async (id: number, data: Omit<Merchant, 'id' | 'created_at'>): Promise<Merchant> => {
    const response = await apiClient.put(`/admin/merchants/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteMerchant: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/merchants/${id}`);
  },

  getOffers: async (params: { page?: number; limit?: number; search?: string; merchant_id?: number } = {}): Promise<{ offers: Offer[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.merchant_id) queryParams.append('merchant_id', String(params.merchant_id));

    const response = await apiClient.get(`/admin/offers?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.offers && data?.data?.pagination) {
      return { offers: data.data.offers, pagination: data.data.pagination };
    }
    if (data?.offers && data?.pagination) {
      return { offers: data.offers, pagination: data.pagination };
    }
    return { offers: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  createOffer: async (data: Omit<Offer, 'id' | 'created_at'>): Promise<Offer> => {
    const response = await apiClient.post('/admin/offers', data);
    return response.data?.data || response.data;
  },

  updateOffer: async (id: number, data: Omit<Offer, 'id' | 'created_at'>): Promise<Offer> => {
    const response = await apiClient.put(`/admin/offers/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteOffer: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/offers/${id}`);
  },

  getProducts: async (params: { page?: number; limit?: number; search?: string } = {}): Promise<{ products: Product[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/admin/products?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.products && data?.data?.pagination) {
      return { products: data.data.products, pagination: data.data.pagination };
    }
    if (data?.products && data?.pagination) {
      return { products: data.products, pagination: data.pagination };
    }
    return { products: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  createProduct: async (data: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const response = await apiClient.post('/admin/products', data);
    return response.data?.data || response.data;
  },

  updateProduct: async (id: number, data: Omit<Product, 'id' | 'created_at'>): Promise<Product> => {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  getUsers: async (params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<{ users: User[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);

    const response = await apiClient.get(`/admin/users?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.users && data?.data?.pagination) {
      return { users: data.data.users, pagination: data.data.pagination };
    }
    if (data?.users && data?.pagination) {
      return { users: data.users, pagination: data.pagination };
    }
    return { users: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  getOrders: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<{ orders: Order[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get(`/admin/orders?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.orders && data?.data?.pagination) {
      return { orders: data.data.orders, pagination: data.data.pagination };
    }
    if (data?.orders && data?.pagination) {
      return { orders: data.orders, pagination: data.pagination };
    }
    return { orders: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  updateOrderStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.patch(`/admin/orders/${id}/status`, { status });
  },

  fulfillOrder: async (id: number): Promise<void> => {
    await apiClient.post(`/admin/orders/${id}/fulfill`);
  },

  getWithdrawals: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<{ withdrawals: Withdrawal[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status_filter', params.status);

    const response = await apiClient.get(`/admin/withdrawals?${queryParams.toString()}`);
    return response.data?.data || { withdrawals: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  approveWithdrawal: async (id: number, data: { transaction_id?: string; admin_notes?: string }): Promise<void> => {
    await apiClient.patch(`/admin/withdrawals/${id}/approve`, { status: 'approved', ...data });
  },

  rejectWithdrawal: async (id: number, data: { admin_notes?: string }): Promise<void> => {
    await apiClient.patch(`/admin/withdrawals/${id}/reject`, { status: 'rejected', ...data });
  },

  getGiftCards: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<{ gift_cards: GiftCard[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get(`/admin/gift-cards?${queryParams.toString()}`);
    return response.data?.data || { gift_cards: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 50 } };
  },

  createGiftCardsBulk: async (data: { count: number; value: number; expires_in_days?: number }): Promise<{ created_count: number; gift_cards: GiftCard[] }> => {
    const response = await apiClient.post('/admin/gift-cards/bulk-create', data);
    return response.data?.data || response.data;
  },

  updateGiftCard: async (id: number, data: { is_active?: boolean; remaining_value?: number }): Promise<GiftCard> => {
    const response = await apiClient.patch(`/admin/gift-cards/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteGiftCard: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/gift-cards/${id}`);
  },

  getGiftCardStats: async (): Promise<{ total_cards: number; active_cards: number; assigned_cards: number; total_value: number; redeemed_value: number; available_value: number }> => {
    const response = await apiClient.get('/admin/gift-cards/stats');
    return response.data?.data || response.data;
  },

  // Cashback APIs
  getCashback: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<{ cashback_events: CashbackEvent[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get(`/admin/cashback?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.cashback_events && data?.data?.pagination) {
      return { cashback_events: data.data.cashback_events, pagination: data.data.pagination };
    }
    if (data?.cashback_events && data?.pagination) {
      return { cashback_events: data.cashback_events, pagination: data.pagination };
    }
    return { cashback_events: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  confirmCashback: async (id: number): Promise<void> => {
    await apiClient.patch(`/admin/cashback/${id}/confirm`);
  },

  rejectCashback: async (id: number): Promise<void> => {
    await apiClient.patch(`/admin/cashback/${id}/reject`);
  },

  // Banner APIs
  getBanners: async (params: { page?: number; limit?: number; banner_type?: string } = {}): Promise<{ banners: Banner[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.banner_type) queryParams.append('banner_type', params.banner_type);

    const response = await apiClient.get(`/admin/banners?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.banners && data?.data?.pagination) {
      return { banners: data.data.banners, pagination: data.data.pagination };
    }
    if (data?.banners && data?.pagination) {
      return { banners: data.banners, pagination: data.pagination };
    }
    return { banners: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  createBanner: async (data: Omit<Banner, 'id' | 'created_at'>): Promise<Banner> => {
    const response = await apiClient.post('/admin/banners', data);
    return response.data?.data || response.data;
  },

  updateBanner: async (id: number, data: Partial<Banner>): Promise<Banner> => {
    const response = await apiClient.put(`/admin/banners/${id}`, data);
    return response.data?.data || response.data;
  },

  deleteBanner: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/banners/${id}`);
  },

  reorderBanner: async (id: number, order_index: number): Promise<void> => {
    await apiClient.patch(`/admin/banners/${id}/reorder`, { order_index });
  },

  // Category APIs
  getCategories: async (params: { page?: number; limit?: number; search?: string } = {}): Promise<{ categories: Category[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get(`/categories?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.categories && data?.data?.pagination) {
      return { categories: data.data.categories, pagination: data.data.pagination };
    }
    if (data?.categories && data?.pagination) {
      return { categories: data.categories, pagination: data.pagination };
    }
    if (Array.isArray(data?.data)) {
      return { categories: data.data, pagination: { current_page: 1, total_pages: 1, total_items: data.data.length, per_page: 100 } };
    }
    return { categories: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  createCategory: async (data: { name: string; slug: string; description?: string; icon_name?: string; is_active?: boolean }): Promise<Category> => {
    const response = await apiClient.post('/admin/categories', data);
    return response.data?.data || response.data;
  },

  updateCategory: async (id: number, data: { name?: string; slug?: string; description?: string; icon_name?: string; is_active?: boolean }): Promise<Category> => {
    const response = await apiClient.put(`/admin/categories/${id}`, data);
    return response.data?.data || response.data;
  },

  // Product Variants
  addProductVariant: async (productId: number, data: { sku: string; name: string; price: number; stock: number; is_available?: boolean }): Promise<ProductVariant> => {
    const response = await apiClient.post(`/admin/products/${productId}/variants`, data);
    return response.data?.data || response.data;
  },

  // Complete withdrawal
  completeWithdrawal: async (id: number, data: { transaction_id?: string; admin_notes?: string }): Promise<void> => {
    await apiClient.patch(`/admin/withdrawals/${id}/complete`, data);
  },

  // Upload APIs
  uploadImage: async (file: File, category: string = 'general'): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const response = await apiClient.post('/admin/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data?.data || response.data;
  },

  deleteImage: async (category: string, filename: string): Promise<void> => {
    await apiClient.delete(`/admin/upload/image/${category}/${filename}`);
  },

  // Invalidate cache
  invalidateMerchantCache: async (slug: string): Promise<void> => {
    await apiClient.post(`/admin/merchants/${slug}/invalidate`);
  },

  // Merchant Verification APIs
  getPendingMerchantApplications: async (params: { page?: number; limit?: number; status?: string } = {}): Promise<{ applications: MerchantApplication[]; pagination: Pagination }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.status) queryParams.append('status', params.status || 'pending');

    const response = await apiClient.get(`/merchants/admin/pending-applications?${queryParams.toString()}`);
    const data = response.data;
    if (data?.data?.applications && data?.data?.pagination) {
      return { applications: data.data.applications, pagination: data.data.pagination };
    }
    return { applications: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 20 } };
  },

  approveMerchantApplication: async (merchantId: number, notes?: string): Promise<void> => {
    await apiClient.post(`/merchants/admin/verify/${merchantId}`, { action: 'approve', notes });
  },

  rejectMerchantApplication: async (merchantId: number, notes?: string): Promise<void> => {
    await apiClient.post(`/merchants/admin/verify/${merchantId}`, { action: 'reject', notes });
  },
};

export interface CashbackEvent {
  id: number;
  user_id: number;
  user_email?: string;
  order_id?: number;
  amount: number;
  status: string;
  created_at: string;
  confirmed_at?: string;
}

export interface Banner {
  id: number;
  title: string;
  banner_type: string;
  image_url?: string;
  brand_name?: string;
  badge_text?: string;
  badge_color?: string;
  headline?: string;
  description?: string;
  code?: string;
  style_metadata?: string;
  link_url?: string;
  is_active: boolean;
  order_index: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  is_available: boolean;
}

export interface MerchantApplication {
  id: number;
  merchant: {
    id: number;
    name: string;
    slug: string;
    status: string;
    is_verified: boolean;
    is_active: boolean;
  };
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_city: string;
  business_state: string;
  business_pincode: string;
  gst_number?: string;
  pan_number?: string;
  website_url?: string;
  user?: {
    id: number;
    email: string;
    full_name?: string;
  };
  created_at: string;
}

export default adminApi;