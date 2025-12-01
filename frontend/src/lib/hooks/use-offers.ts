import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import type { Offer, Merchant } from "@/types";

interface OffersFilters {
  page?: number;
  limit?: number;
  merchant_id?: number;
  search?: string;
}

// Mock merchants for fallback
const mockMerchants: Record<number, Merchant> = {
  1: { id: 1, name: "Amazon", slug: "amazon", logo_url: "/images/merchants/merchant-1.png", website_url: "https://amazon.in", affiliate_url: "https://amazon.in", default_cashback_type: "percentage", default_cashback_value: 5, is_featured: true, is_active: true, created_at: "", updated_at: "" },
  2: { id: 2, name: "Flipkart", slug: "flipkart", logo_url: "/images/merchants/merchant-2.png", website_url: "https://flipkart.com", affiliate_url: "https://flipkart.com", default_cashback_type: "percentage", default_cashback_value: 4, is_featured: true, is_active: true, created_at: "", updated_at: "" },
  3: { id: 3, name: "Myntra", slug: "myntra", logo_url: "/images/merchants/merchant-3.png", website_url: "https://myntra.com", affiliate_url: "https://myntra.com", default_cashback_type: "percentage", default_cashback_value: 8, is_featured: true, is_active: true, created_at: "", updated_at: "" },
  4: { id: 4, name: "Swiggy", slug: "swiggy", logo_url: "/images/merchants/merchant-4.png", website_url: "https://swiggy.com", affiliate_url: "https://swiggy.com", default_cashback_type: "percentage", default_cashback_value: 10, is_featured: true, is_active: true, created_at: "", updated_at: "" },
  5: { id: 5, name: "Zomato", slug: "zomato", logo_url: "/images/merchants/merchant-6.png", website_url: "https://zomato.com", affiliate_url: "https://zomato.com", default_cashback_type: "percentage", default_cashback_value: 12, is_featured: true, is_active: true, created_at: "", updated_at: "" },
  6: { id: 6, name: "BookMyShow", slug: "bookmyshow", logo_url: "/images/merchants/merchant-7.png", website_url: "https://bookmyshow.com", affiliate_url: "https://bookmyshow.com", default_cashback_type: "percentage", default_cashback_value: 6, is_featured: true, is_active: true, created_at: "", updated_at: "" },
};

// Mock offers for development fallback
const mockOffers: Offer[] = [
  { id: 1, merchant_id: 1, merchant: mockMerchants[1], title: "50% Off on Electronics", description: "Get up to 50% discount on laptops, mobiles & accessories", image_url: "/images/offers/1.png", offer_type: "code", coupon_code: "ELEC50", discount_type: "percentage", discount_value: 50, affiliate_url: "https://amazon.in", start_date: new Date().toISOString(), is_exclusive: true, is_verified: true, is_featured: true, is_active: true, click_count: 1250, success_count: 890, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, merchant_id: 2, merchant: mockMerchants[2], title: "Big Billion Days - Extra 10% Off", description: "Additional discount during sale period", image_url: "/images/offers/2.png", offer_type: "code", coupon_code: "BBD10", discount_type: "percentage", discount_value: 10, affiliate_url: "https://flipkart.com", start_date: new Date().toISOString(), is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 2500, success_count: 1890, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, merchant_id: 3, merchant: mockMerchants[3], title: "Flat 40% Off on Fashion", description: "Shop the latest trends at discounted prices", image_url: "/images/offers/3.png", offer_type: "deal", discount_type: "percentage", discount_value: 40, affiliate_url: "https://myntra.com", start_date: new Date().toISOString(), is_exclusive: true, is_verified: true, is_featured: false, is_active: true, click_count: 980, success_count: 720, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, merchant_id: 4, merchant: mockMerchants[4], title: "30% Off on First 3 Orders", description: "New user offer on food delivery", image_url: "/images/offers/14.png", offer_type: "code", coupon_code: "WELCOME30", discount_type: "percentage", discount_value: 30, affiliate_url: "https://swiggy.com", start_date: new Date().toISOString(), is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 3200, success_count: 2100, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 5, merchant_id: 5, merchant: mockMerchants[5], title: "60% Off on Dining", description: "Flat 60% off at select restaurants", image_url: "/images/offers/16.png", offer_type: "deal", discount_type: "percentage", discount_value: 60, affiliate_url: "https://zomato.com", start_date: new Date().toISOString(), is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 1800, success_count: 1200, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 6, merchant_id: 6, merchant: mockMerchants[6], title: "Buy 1 Get 1 Free on Movie Tickets", description: "Weekend special offer", image_url: "/images/offers/18.png", offer_type: "deal", affiliate_url: "https://bookmyshow.com", start_date: new Date().toISOString(), is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 4500, success_count: 3200, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

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
      try {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.merchant_id) params.append("merchant_id", filters.merchant_id.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await api.get(`/offers/?${params.toString()}`);
        return response.data;
      } catch {
        // Return mock data when API is not available (development mode)
        let filteredOffers = [...mockOffers];

        if (filters.merchant_id) {
          filteredOffers = filteredOffers.filter(o => o.merchant_id === filters.merchant_id);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredOffers = filteredOffers.filter(o =>
            o.title.toLowerCase().includes(searchLower) ||
            o.merchant?.name.toLowerCase().includes(searchLower)
          );
        }

        const limit = filters.limit || 10;
        const page = filters.page || 1;
        const start = (page - 1) * limit;
        const paginatedOffers = filteredOffers.slice(start, start + limit);

        return {
          data: paginatedOffers,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(filteredOffers.length / limit),
            total_items: filteredOffers.length,
            items_per_page: limit,
          }
        };
      }
    },
  });
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: ["offer", id],
    queryFn: async () => {
      try {
        const response = await api.get(`/offers/${id}`);
        return response.data;
      } catch {
        // Return mock offer
        const offer = mockOffers.find(o => o.id === id);
        if (offer) {
          return { data: offer };
        }
        throw new Error("Offer not found");
      }
    },
    enabled: !!id,
  });
}
