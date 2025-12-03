import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import type { Offer } from "@/types";

interface OffersFilters {
  page?: number;
  limit?: number;
  merchant_id?: number;
  search?: string;
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
      if (filters.search) params.append("search", filters.search);

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