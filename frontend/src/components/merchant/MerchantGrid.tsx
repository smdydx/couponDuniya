import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../common/EmptyState";
import { Store } from "lucide-react";
import { MerchantCard } from "./MerchantCard";
import type { Merchant } from "@/types";

interface MerchantGridProps {
  merchants: Merchant[];
  isLoading?: boolean;
}

export function MerchantGrid({ merchants, isLoading }: MerchantGridProps) {
  const merchantList = Array.isArray(merchants) ? merchants : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-full max-w-[200px]">
            <Skeleton className="w-full aspect-square rounded-lg" />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {merchantList.map((merchant) => (
        <MerchantCard key={merchant.id} merchant={merchant} />
      ))}
    </div>
  );
}