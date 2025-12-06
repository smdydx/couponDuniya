
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
    <Link
      href={ROUTES.merchantDetail(merchant.slug)}
      className="block focus:outline-none w-full max-w-[200px]"
    >
      <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-primary/60 border bg-white aspect-square">
        {merchant.is_featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="warning"
              className="text-[10px] font-semibold shadow-md px-2 py-0.5"
            >
              ⭐ Featured
            </Badge>
          </div>
        )}

        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            {/* Logo Section */}
            <div className="relative w-20 h-20 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg flex-shrink-0">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain transition-transform duration-300 p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-full space-y-2 text-center">
              {/* Title */}
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[2.5rem]">
                {merchant.name}
              </h3>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-semibold text-xs px-3 py-1 shadow-sm"
                >
                  {merchant.default_cashback_type === "percentage"
                    ? `${merchant.default_cashback_value}% OFF`
                    : `₹${merchant.default_cashback_value} OFF`}
                </Badge>
              )}
            </div>
          </div>

          {/* Offers Count at Bottom */}
          {merchant.total_offers !== undefined &&
            merchant.total_offers > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-medium pt-2 border-t border-gray-100">
                <Tag className="h-3 w-3" />
                <span>
                  {merchant.total_offers} offer{merchant.total_offers > 1 ? "s" : ""}
                </span>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
