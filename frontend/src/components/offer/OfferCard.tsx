
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
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/60 border h-full flex flex-col bg-white">
      {/* Badges */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-[9px] font-semibold shadow-md backdrop-blur-sm bg-purple-600/95 px-2 py-0.5">
            Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-1 text-[9px] font-semibold shadow-md backdrop-blur-sm bg-green-600/95 text-white px-2 py-0.5">
            <CheckCircle className="h-2.5 w-2.5" />
            Verified
          </Badge>
        )}
      </div>

      <CardHeader className="p-0">
        {/* Offer/Merchant Image - Featured */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {offer.merchant?.logo_url ? (
            <div className="w-full h-full">
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary bg-gradient-to-br from-primary/10 to-primary/5">
              {offer.merchant?.name.charAt(0)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col gap-2">
        {/* Merchant Name */}
        {offer.merchant && (
          <Link
            href={ROUTES.merchantDetail(offer.merchant.slug)}
            className="text-[10px] text-muted-foreground hover:text-primary hover:underline font-semibold truncate block"
          >
            {offer.merchant.name}
          </Link>
        )}

        {/* Offer Title */}
        <h3 className="font-semibold text-xs leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[32px]">
          {offer.title}
        </h3>

        {/* Description */}
        {offer.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {offer.discount_value && (
            <Badge variant="info" className="text-[10px] px-2 py-0.5 font-semibold shadow-sm">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 text-[10px] px-2 py-0.5 font-semibold shadow-sm">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% Cashback`
                : `${formatCurrency(offer.cashback_value)} Cashback`}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-dashed border-primary/40 rounded-lg">
              <code className="flex-1 text-center font-bold text-[11px] text-primary tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 h-7 text-[10px] px-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-1.5 font-semibold text-[11px] h-9"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-1.5 font-semibold text-[11px] h-9" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-3 w-3" />
                Reveal Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
