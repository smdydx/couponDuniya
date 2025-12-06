
"use client";

import Link from "next/link";
import { ExternalLink, Tag, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Merchant } from "@/types";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Calculate discount percentage (mock - you can get this from merchant data)
  const discountPercentage = merchant.default_cashback_value || 10;

  return (
    <div 
      className="group relative h-[200px] w-full perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front of Card */}
        <Card className="absolute inset-0 backface-hidden overflow-hidden transition-all hover:shadow-xl border bg-white">
          {merchant.is_featured && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="warning" className="text-[10px] font-semibold shadow-md px-2 py-0.5">
                ⭐ Featured
              </Badge>
            </div>
          )}

          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex flex-col items-center text-center gap-3 h-full justify-center">
              {/* Logo Section */}
              <div className="relative w-20 h-20 overflow-hidden rounded-xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg flex-shrink-0">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 text-2xl font-bold text-purple-600">
                    {merchant.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="w-full space-y-2">
                {/* Title */}
                <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                  {merchant.name}
                </h3>

                {/* Cashback Badge */}
                {merchant.default_cashback_value > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-bold text-xs px-3 py-1 shadow-md">
                      <Percent className="h-3 w-3 mr-1" />
                      {merchant.default_cashback_type === "percentage"
                        ? `${merchant.default_cashback_value}% Cashback`
                        : `₹${merchant.default_cashback_value} Cashback`}
                    </Badge>
                  </div>
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

        {/* Back of Card */}
        <Card className="absolute inset-0 backface-hidden rotate-y-180 overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white border-0 shadow-xl">
          <CardContent className="p-4 h-full flex flex-col justify-center items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
              <Percent className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="font-bold text-lg mb-1">{merchant.name}</h3>
            
            <div className="space-y-2 w-full">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-2xl font-bold">Up to {discountPercentage}% OFF</p>
                <p className="text-xs text-white/80 mt-1">+ Extra Cashback</p>
              </div>
              
              {merchant.description && (
                <p className="text-xs text-white/90 line-clamp-2 px-2">
                  {merchant.description}
                </p>
              )}
            </div>

            <Link href={ROUTES.merchantDetail(merchant.slug)}>
              <Badge className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-4 py-2 cursor-pointer transition-all">
                View Offers
                <ExternalLink className="h-3 w-3 ml-1" />
              </Badge>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Hidden Link for SEO */}
      <Link 
        href={ROUTES.merchantDetail(merchant.slug)} 
        className="absolute inset-0 z-[-1]"
        aria-label={`View ${merchant.name} offers`}
      />
    </div>
  );
}
