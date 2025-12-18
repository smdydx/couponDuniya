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
  // Filter out products with no valid variants or pricing
  const validProducts = products.filter(product => {
    if (!product.variants || product.variants.length === 0) return false;
    const hasValidPrice = product.variants.some(v => v && ((v.selling_price || 0) > 0 || (v.denomination || 0) > 0));
    return hasValidPrice;
  });

  const skeletonCount = columns === 6 ? 12 : 8;
  const displayProducts = showTwoRows ? validProducts.slice(0, 12) : validProducts;

  // Applying the changes logic for the grid class based on 'compact' prop
  const gridClass = cn(
    "grid gap-4 sm:gap-5",
    compact
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  if (isLoading) {
    return (
      <div className={gridClass}>
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

  if (validProducts.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No gift cards found"
        description="We couldn't find any gift cards matching your criteria. Try adjusting your filters."
      />
    );
  }

  const finalGridClass = compact
    ? "grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
    : "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7";

  return (
    <div className={finalGridClass}>
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={product} compact={compact} />
      ))}
    </div>
  );
}