"use client";

import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";
import { Gift } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 4 | 6;
  showTwoRows?: boolean;
}

export function ProductGrid({ products, isLoading, columns = 4, showTwoRows = false }: ProductGridProps) {
  const gridClass = columns === 6 
    ? "grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  
  const skeletonCount = columns === 6 ? 12 : 8;
  const displayProducts = showTwoRows ? products.slice(0, 12) : products;

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

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="No products found"
        description="We couldn't find any gift cards matching your criteria. Try adjusting your filters."
      />
    );
  }

  return (
    <div className={gridClass}>
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
