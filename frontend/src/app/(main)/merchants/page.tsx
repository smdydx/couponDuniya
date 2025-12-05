
"use client";

import { useState } from "react";
import { MerchantGrid } from "@/components/merchant/MerchantGrid";
import { CategoryNav } from "@/components/common/CategoryNav";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Pagination } from "@/components/common/Pagination";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Store } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useMerchants } from "@/lib/hooks/use-merchants";

export default function MerchantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const { data, isLoading, error } = useMerchants({
    page,
    limit: 20,
    search: search || undefined,
    is_featured: sortBy === "featured" ? true : undefined,
  });

  const merchants = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Breadcrumbs items={[{ label: "Stores" }]} />

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">All Stores</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Shop with cashback at {pagination?.total_items || 1000}+ partner stores
          </p>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <CategoryNav basePath={ROUTES.merchants} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stores..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={Store}
            title="Error loading stores"
            description="Please try again later"
          />
        ) : merchants.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No stores found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <>
            <div className="mb-4 text-xs sm:text-sm text-muted-foreground">
              Showing {merchants.length} stores
            </div>

            <MerchantGrid merchants={merchants} />

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 sm:mt-8">
                <Pagination
                  currentPage={pagination.current_page}
                  totalPages={pagination.total_pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
