import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import type { Merchant } from "@/types";

interface MerchantsFilters {
  page?: number;
  limit?: number;
  is_featured?: boolean;
  search?: string;
}

interface MerchantsPaginatedResponse {
  data: Merchant[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export function useMerchants(filters: MerchantsFilters = {}) {
  return useQuery<MerchantsPaginatedResponse>({
    queryKey: ["merchants", filters],
    queryFn: async (): Promise<MerchantsPaginatedResponse> => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.is_featured !== undefined) params.append("is_featured", filters.is_featured.toString());
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/merchants/?${params.toString()}`);
      return response.data;
    },
  });
}

export function useMerchant(slug: string) {
  return useQuery({
    queryKey: ["merchant", slug],
    queryFn: async () => {
      const response = await api.get(`/merchants/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });
}