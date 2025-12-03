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
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Gift Cards" }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gift Cards</h1>
        <p className="mt-1 text-muted-foreground">
          Buy discounted gift cards from your favorite brands
        </p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <CategoryNav basePath={ROUTES.products} />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search gift cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
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
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {products.length} gift cards
          </div>

          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="text-center text-muted-foreground py-12">No gift cards found</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}