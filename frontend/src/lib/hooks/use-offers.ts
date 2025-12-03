import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import type { Offer } from "@/types";

interface OffersFilters {
  page?: number;
  limit?: number;
  merchant_id?: number;
  category_id?: number;
  search?: string;
  sort_by?: string;
  is_exclusive?: boolean;
  is_verified?: boolean;
  has_cashback?: boolean;
}

interface OffersPaginatedResponse {
  data: Offer[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export function useOffers(filters: OffersFilters = {}) {
  return useQuery<OffersPaginatedResponse>({
    queryKey: ["offers", filters],
    queryFn: async (): Promise<OffersPaginatedResponse> => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.merchant_id) params.append("merchant_id", filters.merchant_id.toString());
      if (filters.category_id) params.append("category_id", filters.category_id.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.sort_by) params.append("sort_by", filters.sort_by);
      if (filters.is_exclusive !== undefined) params.append("is_exclusive", filters.is_exclusive.toString());
      if (filters.is_verified !== undefined) params.append("is_verified", filters.is_verified.toString());
      if (filters.has_cashback !== undefined) params.append("has_cashback", filters.has_cashback.toString());


      const response = await api.get(`/offers/?${params.toString()}`);
      return response.data;
    },
  });
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      const response = await api.get(`/offers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}