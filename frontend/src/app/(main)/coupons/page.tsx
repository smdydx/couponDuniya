"use client";

import { useState } from "react";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { OfferFilters } from "@/components/offer/OfferFilters";
import { CategoryNav } from "@/components/common/CategoryNav";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Pagination } from "@/components/common/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { useOffers } from "@/lib/hooks/use-offers";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useOffers({
    page: currentPage,
    limit: 20,
    search: searchQuery,
  });

  const offers = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 1;

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Coupons & Deals" }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Coupons & Deals</h1>
        <p className="mt-1 text-muted-foreground">
          Browse verified coupons and exclusive deals from top stores
        </p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <CategoryNav />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 lg:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <OfferFilters />
        </aside>

        {/* Filters Sidebar - Mobile */}
        {showFilters && (
          <div className="fixed inset-0 z-50 bg-background p-6 lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" onClick={() => setShowFilters(false)}>
                Close
              </Button>
            </div>
            <OfferFilters />
          </div>
        )}

        {/* Offers Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Failed to load offers. Please try again.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {offers.length} offers
              </div>
              {offers.length > 0 ? (
                <OfferGrid offers={offers} />
              ) : (
                <p className="text-center text-muted-foreground py-12">No offers found</p>
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
      </div>
    </div>
  );
}