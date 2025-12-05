"use client";

import { MerchantCard } from "./MerchantCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Merchant } from "@/types";
import { Store } from "lucide-react";

interface MerchantGridProps {
  merchants: Merchant[];
  isLoading?: boolean;
}

export function MerchantGrid({ merchants, isLoading }: MerchantGridProps) {
  const merchantList = Array.isArray(merchants) ? merchants : [];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (merchantList.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No stores found"
        description="We couldn't find any stores matching your criteria. Try adjusting your filters."
      />
    );
  }

  return (
    <div className="grid gap-2.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
      {merchantList.map((merchant) => (
        <MerchantCard key={merchant.id} merchant={merchant} />
      ))}
    </div>
  );
}