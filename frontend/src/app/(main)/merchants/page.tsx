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
import { Search } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useMerchants } from "@/lib/hooks/use-merchants";

export default function MerchantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data, isLoading, error } = useMerchants({
    page,
    limit: 20,
    search: search || undefined,
    is_featured: sortBy === "featured" ? true : undefined,
  });

  const merchants = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Stores" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Stores</h1>
        <p className="mt-1 text-muted-foreground">
          Shop with cashback at {pagination?.total_items || 1000}+ partner stores
        </p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <CategoryNav basePath={ROUTES.merchants} />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState
          title="Error loading stores"
          description="Please try again later"
        />
      ) : merchants.length === 0 ? (
        <EmptyState
          title="No stores found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {merchants.length} stores
          </div>

          <MerchantGrid merchants={merchants} />

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-8">
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
  );
}
