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
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/60 border bg-white w-full h-[180px]">
        {merchant.is_featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="warning" className="text-[10px] font-semibold shadow-md px-2 py-0.5">
              ⭐ Featured
            </Badge>
          </div>
        )}

        <CardContent className="p-4 h-full">
          <div className="flex flex-col items-center text-center gap-2 h-full justify-center">
            {/* Logo Section */}
            <div className="relative w-16 h-16 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md flex-shrink-0">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-1"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-bold text-muted-foreground">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-full space-y-1">
              {/* Title */}
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {merchant.name}
              </h3>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-semibold text-xs px-2 py-0.5 shadow-sm">
                  {merchant.default_cashback_type === "percentage"
                    ? `${merchant.default_cashback_value}% Cashback`
                    : `₹${merchant.default_cashback_value} Cashback`}
                </Badge>
              )}

              {/* Offers Count */}
              {merchant.total_offers !== undefined && merchant.total_offers > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-medium">
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