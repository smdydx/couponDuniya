import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import type { Merchant } from "@/types";

interface MerchantsFilters {
  page?: number;
  limit?: number;
  is_featured?: boolean;
  search?: string;
}

// Mock data for development when API is not available
// Uses local images from /public/images/merchants/
const mockMerchants: Merchant[] = [
  {
    id: 1,
    name: "Amazon",
    slug: "amazon",
    logo_url: "/images/merchants/amazon.png",
    description: "India's largest online marketplace",
    website_url: "https://amazon.in",
    affiliate_url: "https://amazon.in",
    default_cashback_value: 5,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Flipkart",
    slug: "flipkart",
    logo_url: "/images/merchants/flipkart.png",
    description: "India's leading e-commerce marketplace",
    website_url: "https://flipkart.com",
    affiliate_url: "https://flipkart.com",
    default_cashback_value: 4,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Myntra",
    slug: "myntra",
    logo_url: "/images/merchants/myntra.png",
    description: "Fashion & lifestyle shopping destination",
    website_url: "https://myntra.com",
    affiliate_url: "https://myntra.com",
    default_cashback_value: 8,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Swiggy",
    slug: "swiggy",
    logo_url: "/images/merchants/swiggy.png",
    description: "Food delivery and dining",
    website_url: "https://swiggy.com",
    affiliate_url: "https://swiggy.com",
    default_cashback_value: 10,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "BookMyShow",
    slug: "bookmyshow",
    logo_url: "/images/merchants/bookmyshow.png",
    description: "Movie & event bookings",
    website_url: "https://bookmyshow.com",
    affiliate_url: "https://bookmyshow.com",
    default_cashback_value: 12,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Uber",
    slug: "uber",
    logo_url: "/images/merchants/uber.png",
    description: "Ride & food delivery",
    website_url: "https://uber.com",
    affiliate_url: "https://uber.com",
    default_cashback_value: 6,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: "Ajio",
    slug: "ajio",
    logo_url: "/images/merchants/ajio.png",
    description: "Fashion & lifestyle by Reliance",
    website_url: "https://ajio.com",
    affiliate_url: "https://ajio.com",
    default_cashback_value: 7,
    default_cashback_type: "percentage",
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
      try {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.is_featured !== undefined) params.append("is_featured", filters.is_featured.toString());
        if (filters.search) params.append("search", filters.search);

        const response = await api.get(`/merchants/?${params.toString()}`);
        return response.data;
      } catch {
        // Return mock data when API is not available (development mode)
        let filteredMerchants = [...mockMerchants];

        if (filters.is_featured !== undefined) {
          filteredMerchants = filteredMerchants.filter(m => m.is_featured === filters.is_featured);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredMerchants = filteredMerchants.filter(m =>
            m.name.toLowerCase().includes(searchLower)
          );
        }

        const limit = filters.limit || 10;
        const page = filters.page || 1;
        const start = (page - 1) * limit;
        const paginatedMerchants = filteredMerchants.slice(start, start + limit);

        return {
          data: paginatedMerchants,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(filteredMerchants.length / limit),
            total_items: filteredMerchants.length,
            items_per_page: limit,
          }
        };
      }
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
