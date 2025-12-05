
"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Clock, CheckCircle, Star, Copy, Check, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Offer } from "@/types";
import { formatCurrency, isExpiringSoon, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface OfferCardProps {
  offer: Offer;
  onClickTrack?: (offerId: number) => void;
}

export function OfferCard({ offer, onClickTrack }: OfferCardProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onClickTrack?.(offer.id);
    if (offer.offer_type === "code") {
      setShowCode(true);
    } else {
      window.open(offer.affiliate_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyCode = async () => {
    if (offer.coupon_code) {
      await navigator.clipboard.writeText(offer.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="group relative overflow-hidden h-full flex flex-col transition-all hover:shadow-xl hover:border-primary/30">
      {/* Offer Image with Gradient Overlay */}
      {offer.image_url && (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <img
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Badges */}
      <div className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 flex flex-col gap-1">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-[10px] sm:text-xs font-semibold shadow-lg backdrop-blur-sm bg-purple-600/90">
            ⚡ Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-1 text-[10px] sm:text-xs font-semibold shadow-lg backdrop-blur-sm bg-purple-600/90 text-white">
            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            Verified
          </Badge>
        )}
        {offer.is_featured && (
          <Badge variant="warning" className="gap-1 text-[10px] sm:text-xs font-semibold shadow-lg backdrop-blur-sm bg-orange-500/90">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
            Featured
          </Badge>
        )}
      </div>

      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Merchant Logo */}
          {offer.merchant?.logo_url ? (
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-lg border-2 border-gray-100 bg-white p-1 sm:p-1.5 shadow-sm flex items-center justify-center">
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-gradient-to-br from-primary/10 to-primary/5 text-base sm:text-lg font-bold">
              {offer.merchant?.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {offer.merchant && (
              <Link
                href={ROUTES.merchantDetail(offer.merchant.slug)}
                className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary hover:underline font-medium truncate block mb-0.5 sm:mb-1"
              >
                {offer.merchant.name}
              </Link>
            )}
            <h3 className="font-bold text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {offer.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-0 flex-1 flex flex-col gap-2 sm:gap-3">
        {offer.description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {offer.discount_value && (
            <Badge variant="info" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 font-bold">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 font-bold">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% Cashback`
                : `${formatCurrency(offer.cashback_value)} Cashback`}
            </Badge>
          )}
        </div>

        {/* Expiry Warning */}
        {offer.end_date && isExpiringSoon(offer.end_date) && (
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-orange-600 bg-orange-50 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium">Expires {formatDate(offer.end_date)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 rounded-lg">
              <code className="flex-1 text-center font-bold text-sm sm:text-base text-primary tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 h-7 sm:h-8 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-2 font-semibold text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-2 font-semibold text-xs sm:text-sm h-9 sm:h-10" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                Reveal Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
