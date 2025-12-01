"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface OfferFiltersProps {
  merchants?: Array<{ id: number; name: string }>;
}

function OfferFiltersContent({ merchants }: OfferFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has("merchant") ||
    searchParams.has("type") ||
    searchParams.has("exclusive") ||
    searchParams.has("verified") ||
    searchParams.has("sort");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={searchParams.get("sort") || ""}
          onValueChange={(value) => updateFilter("sort", value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="cashback_high">Highest Cashback</SelectItem>
            <SelectItem value="cashback_low">Lowest Cashback</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Offer Type */}
      <div className="space-y-2">
        <Label>Offer Type</Label>
        <Select
          value={searchParams.get("type") || ""}
          onValueChange={(value) => updateFilter("type", value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Coupon Codes</SelectItem>
            <SelectItem value="deal">Deals</SelectItem>
            <SelectItem value="cashback">Cashback Offers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merchant */}
      {merchants && merchants.length > 0 && (
        <div className="space-y-2">
          <Label>Store</Label>
          <Select
            value={searchParams.get("merchant") || ""}
            onValueChange={(value) => updateFilter("merchant", value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              {merchants.map((merchant) => (
                <SelectItem key={merchant.id} value={String(merchant.id)}>
                  {merchant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="exclusive"
            checked={searchParams.get("exclusive") === "true"}
            onCheckedChange={(checked) => updateFilter("exclusive", checked ? "true" : null)}
          />
          <Label htmlFor="exclusive" className="text-sm font-normal">
            Exclusive offers only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={searchParams.get("verified") === "true"}
            onCheckedChange={(checked) => updateFilter("verified", checked ? "true" : null)}
          />
          <Label htmlFor="verified" className="text-sm font-normal">
            Verified offers only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="cashback"
            checked={searchParams.get("cashback") === "true"}
            onCheckedChange={(checked) => updateFilter("cashback", checked ? "true" : null)}
          />
          <Label htmlFor="cashback" className="text-sm font-normal">
            With cashback
          </Label>
        </div>
      </div>
    </div>
  );
}

function OfferFiltersSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-6 w-16" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function OfferFilters(props: OfferFiltersProps) {
  return (
    <Suspense fallback={<OfferFiltersSkeleton />}>
      <OfferFiltersContent {...props} />
    </Suspense>
  );
}
