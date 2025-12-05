
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
      <Card className="group relative overflow-hidden h-full transition-all hover:shadow-md hover:border-primary/50 border">
        {merchant.is_featured && (
          <div className="absolute top-1 right-1 z-10">
            <Badge variant="warning" className="text-[8px] font-semibold shadow-sm px-1 py-0">
              ⭐ Featured
            </Badge>
          </div>
        )}
        
        <CardContent className="p-2">
          <div className="flex flex-col items-center text-center gap-1.5">
            {/* Logo Section */}
            <div className="relative w-full aspect-square max-w-[50px] shrink-0 overflow-hidden rounded border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary bg-gradient-to-br from-primary/10 to-primary/5">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-full space-y-0.5">
              {/* Title */}
              <h3 className="font-semibold text-[10px] line-clamp-2 group-hover:text-primary transition-colors min-h-[26px] flex items-center justify-center">
                {merchant.name}
              </h3>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold text-[8px] px-1 py-0">
                  {merchant.default_cashback_type === "percentage"
                    ? `${merchant.default_cashback_value}% CB`
                    : `₹${merchant.default_cashback_value} CB`}
                </Badge>
              )}

              {/* Offers Count */}
              {merchant.total_offers !== undefined && merchant.total_offers > 0 && (
                <div className="flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                  <Tag className="h-2 w-2" />
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
