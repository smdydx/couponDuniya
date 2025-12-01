"use client";

import { OfferCard } from "./OfferCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@/types";
import { Tag } from "lucide-react";

interface OfferGridProps {
  offers: Offer[];
  isLoading?: boolean;
  onClickTrack?: (offerId: number) => void;
}

export function OfferGrid({ offers, isLoading, onClickTrack }: OfferGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No offers found"
        description="We couldn't find any offers matching your criteria. Try adjusting your filters."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} onClickTrack={onClickTrack} />
      ))}
    </div>
  );
}