
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Clock, CheckCircle, Star, Copy, Check, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CouponCode } from "./CouponCode";
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
    <Card className="elevated-card group relative overflow-hidden h-full flex flex-col transition-all hover:shadow-xl hover:border-primary/30">
      {/* Offer Image with Gradient Overlay */}
      {offer.image_url && (
        <div className="relative h-40 sm:h-48 w-full overflow-hidden">
          <img
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Badges positioned on image */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-xs font-semibold shadow-lg backdrop-blur-sm bg-purple-600/90">
            ⚡ Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-1 text-xs font-semibold shadow-lg backdrop-blur-sm bg-purple-600/90 text-white">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        )}
        {offer.is_featured && (
          <Badge variant="warning" className="gap-1 text-xs font-semibold shadow-lg backdrop-blur-sm bg-orange-500/90">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start gap-3">
          {/* Merchant Logo */}
          {offer.merchant?.logo_url ? (
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg border-2 border-gray-100 bg-white p-1.5 shadow-sm flex items-center justify-center">
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-gradient-to-br from-primary/10 to-primary/5 text-lg sm:text-xl font-bold">
              {offer.merchant?.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {offer.merchant && (
              <Link
                href={ROUTES.merchantDetail(offer.merchant.slug)}
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary hover:underline font-medium truncate block mb-1"
              >
                {offer.merchant.name}
              </Link>
            )}
            <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {offer.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 flex-1 flex flex-col gap-3">
        {offer.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-2">
          {offer.discount_value && (
            <Badge variant="info" className="text-xs sm:text-sm px-3 py-1 font-bold">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs sm:text-sm px-3 py-1 font-bold">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% Cashback`
                : `${formatCurrency(offer.cashback_value)} Cashback`}
            </Badge>
          )}
        </div>

        {/* Expiry Warning */}
        {offer.end_date && isExpiringSoon(offer.end_date) && (
          <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-md">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">Expires {formatDate(offer.end_date)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 rounded-lg">
              <code className="flex-1 text-center font-bold text-base sm:text-lg text-primary tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-2 font-semibold"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-2 font-semibold text-sm sm:text-base py-5 sm:py-6" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-4 w-4" />
                Reveal Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
