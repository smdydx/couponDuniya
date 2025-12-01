
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
      <Card className="elevated-card group overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/50">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            {/* Logo Section */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition-transform duration-200 group-hover:scale-105">
              {merchant.logo_url ? (
                <Image
                  src={merchant.logo_url}
                  alt={merchant.name}
                  fill
                  className="object-contain"
                  sizes="64px"
                  priority={merchant.is_featured}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              {/* Title and Featured Badge */}
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {merchant.name}
                </h3>
                {merchant.is_featured && (
                  <Badge variant="warning" className="shrink-0 text-xs">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              {/* Cashback Info */}
              {merchant.default_cashback_value > 0 && (
                <Badge variant="success" className="mt-1 text-xs">
                  {merchant.default_cashback_type === "percentage"
                    ? `Up to ${merchant.default_cashback_value}% Cashback`
                    : `₹${merchant.default_cashback_value} Cashback`}
                </Badge>
              )}

              {/* Offers Count */}
              {merchant.total_offers !== undefined && merchant.total_offers > 0 && (
                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">{merchant.total_offers} offer{merchant.total_offers > 1 ? 's' : ''} available</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
