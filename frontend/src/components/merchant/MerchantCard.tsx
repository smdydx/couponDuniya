
"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Merchant } from "@/types";
import { ROUTES } from "@/lib/constants";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <Link href={ROUTES.merchantDetail(merchant.slug)} className="block focus:outline-none">
      <Card className="elevated-card group relative overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
        {merchant.is_featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="warning" className="text-xs font-semibold shadow-lg">
              ⭐ Featured
            </Badge>
          </div>
        )}
        
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Logo Section - Centered */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
              {merchant.logo_url ? (
                <Image
                  src={merchant.logo_url}
                  alt={merchant.name}
                  fill
                  className="object-contain p-2"
                  sizes="96px"
                  priority={merchant.is_featured}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section - Centered */}
            <div className="w-full space-y-2">
              {/* Title */}
              <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
                {merchant.name}
              </h3>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold px-3 py-1">
                  {merchant.default_cashback_type === "percentage"
                    ? `${merchant.default_cashback_value}% Cashback`
                    : `₹${merchant.default_cashback_value} Cashback`}
                </Badge>
              )}

              {/* Offers Count */}
              {merchant.total_offers !== undefined && merchant.total_offers > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground pt-1">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">{merchant.total_offers} offer{merchant.total_offers > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
