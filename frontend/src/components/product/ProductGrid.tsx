"use client";

import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming cn is available for conditional class names

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 4 | 6;
  showTwoRows?: boolean;
  compact?: boolean; // Added compact prop as seen in the changes
}

export function ProductGrid({ products, isLoading, columns = 4, showTwoRows = false, compact = false }: ProductGridProps) {
  // The original gridClass logic seems to be replaced by the logic within the changes snippet.
  // I will use the logic from the changes snippet and adapt it to the original isLoading and products.length === 0 conditions.

  const skeletonCount = columns === 6 ? 12 : 8; // This line might be less relevant if the 'columns' prop is fully replaced by 'compact' in the new logic. However, keeping it for now.
  const displayProducts = showTwoRows ? products.slice(0, 12) : products;

  // Applying the changes logic for the grid class based on 'compact' prop
  const gridClass = cn(
    "grid gap-4 sm:gap-5",
    compact
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  if (isLoading) {
    return (
      <div className={gridClass}> {/* Using the new gridClass */}
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card">
            <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>
            <div className="flex items-center justify-between border-t p-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No gift cards found"
        description="We couldn't find any gift cards matching your criteria. Try adjusting your filters."
      />
    );
  }

  return (
    <div className={gridClass}> {/* Using the new gridClass */}
      {displayProducts.map((product) => (
        // The 'compact' prop is passed down to ProductCard in the changes snippet.
        <ProductCard key={product.id} product={product} compact={compact} />
      ))}
    </div>
  );
}