
"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryNav } from "@/components/common/CategoryNav";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Pagination } from "@/components/common/Pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { Product } from "@/types";

interface ProductsResponse {
  data: Product[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ["products", currentPage, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");
      if (searchQuery) params.append("search", searchQuery);
      if (sortBy) params.append("sort_by", sortBy);

      const response = await api.get(`/products/?${params.toString()}`);
      return response.data;
    },
  });

  const products = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Breadcrumbs items={[{ label: "Gift Cards" }]} />

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Gift Cards</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Buy discounted gift cards from your favorite brands
          </p>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <CategoryNav basePath={ROUTES.products} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search gift cards..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="discount">Highest Discount</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load gift cards. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
              Showing {products.length} gift cards
            </div>

            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <p className="text-center text-muted-foreground py-12">No gift cards found</p>
            )}
          </>
        )}

        {/* Pagination at bottom */}
        {!isLoading && !error && products.length > 0 && totalPages > 1 && (
          <div className="mt-8 pb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
