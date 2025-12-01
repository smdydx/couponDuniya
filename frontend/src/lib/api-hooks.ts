import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api-client';

// Types
export interface Merchant {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo_url: string;
  description?: string;
  default_cashback_type?: string;
  default_cashback_value?: number;
  offers_count?: number;
  is_featured?: boolean;
}

export interface Offer {
  id: number;
  uuid: string;
  title: string;
  description: string;
  offer_type: string;
  coupon_code?: string;
  cashback_type: string;
  cashback_value: number;
  max_cashback?: number;
  merchant: {
    id: number;
    name: string;
    slug: string;
    logo_url: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  is_exclusive: boolean;
  is_verified: boolean;
  expires_at?: string;
  views_count: number;
  clicks_count: number;
}

export interface GiftCard {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  image_url: string;
  description: string;
  merchant: {
    id: number;
    name: string;
    slug: string;
  };
  variants: Array<{
    id: number;
    denomination: number;
    selling_price: number;
    is_available: boolean;
  }>;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

// Merchants Hooks
export const useMerchants = (filters?: {
  page?: number;
  limit?: number;
  is_featured?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['merchants', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<Merchant> }>('/merchants', {
        params: filters,
      });
      return data.data;
    },
  });
};

export const useMerchant = (slug: string) => {
  return useQuery({
    queryKey: ['merchant', slug],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Merchant }>(`/merchants/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
};

// Offers Hooks
export const useOffers = (filters?: {
  page?: number;
  limit?: number;
  merchant_id?: number;
  category_id?: number;
  offer_type?: string;
  is_exclusive?: boolean;
  sort?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: async () => {
      const { data} = await apiClient.get<{ success: boolean; data: PaginatedResponse<Offer> }>('/offers', {
        params: filters,
      });
      return data.data;
    },
  });
};

export const useOffer = (uuid: string) => {
  return useQuery({
    queryKey: ['offer', uuid],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Offer }>(`/offers/${uuid}`);
      return data.data;
    },
    enabled: !!uuid,
  });
};

export const useClickOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await apiClient.post<{
        success: boolean;
        data: { click_id: string; redirect_url: string; coupon_code?: string; message: string };
      }>(`/offers/${uuid}/click`);
      return data.data;
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: ['offer', uuid] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      
      // Redirect to merchant
      if (data.redirect_url) {
        window.open(data.redirect_url, '_blank');
      }
    },
  });
};

// Gift Cards Hooks
export const useGiftCards = (filters?: {
  page?: number;
  limit?: number;
  merchant_id?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['giftCards', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: PaginatedResponse<GiftCard> }>('/products', {
        params: { ...filters, product_type: 'gift_card' },
      });
      return data.data;
    },
  });
};

export const useGiftCard = (slug: string) => {
  return useQuery({
    queryKey: ['giftCard', slug],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: GiftCard }>(`/products/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
};

// Wallet Hooks
export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean;
        data: { balance: number; pending: number; lifetime_earnings: number };
      }>('/wallet/balance');
      return data.data;
    },
  });
};

export const useWalletTransactions = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['walletTransactions', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/wallet/transactions', {
        params: { page, limit },
      });
      return data.data;
    },
  });
};

// Orders Hooks
export const useOrders = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/orders', {
        params: { page, limit },
      });
      return data.data;
    },
  });
};

export const useOrder = (orderNumber: string) => {
  return useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${orderNumber}`);
      return data.data;
    },
    enabled: !!orderNumber,
  });
};

// Categories Hook
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Array<{ id: number; name: string; slug: string; icon: string }> }>('/categories');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Trending Offers Hook
export const useTrendingOffers = () => {
  return useQuery({
    queryKey: ['trendingOffers'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: { offer_ids: number[] } }>('/offers/trending');
      return data.data.offer_ids;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
