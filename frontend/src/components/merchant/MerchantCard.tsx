
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
      <Card className="group relative overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/60 border bg-white">
        {merchant.is_featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="warning" className="text-[9px] font-semibold shadow-md px-2 py-0.5">
              ⭐ Featured
            </Badge>
          </div>
        )}
        
        <CardContent className="p-3">
          <div className="flex flex-col items-center text-center gap-2.5">
            {/* Logo Section - Larger Image */}
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain p-2"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary bg-gradient-to-br from-primary/10 to-primary/5">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-full space-y-1.5">
              {/* Title */}
              <h3 className="font-semibold text-xs line-clamp-2 group-hover:text-primary transition-colors min-h-[32px] flex items-center justify-center leading-tight">
                {merchant.name}
              </h3>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold text-[10px] px-2 py-0.5 shadow-sm">
                  {merchant.default_cashback_type === "percentage"
                    ? `${merchant.default_cashback_value}% Cashback`
                    : `₹${merchant.default_cashback_value} Cashback`}
                </Badge>
              )}

              {/* Offers Count */}
              {merchant.total_offers !== undefined && merchant.total_offers > 0 && (
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <Tag className="h-3 w-3" />
                  <span>{merchant.total_offers} offer{merchant.total_offers > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
