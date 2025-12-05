
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
    <Card className="group relative overflow-hidden transition-all hover:shadow-md border h-full flex flex-col">
      {/* Badges */}
      <div className="absolute right-1 top-1 z-10 flex flex-col gap-0.5">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-[8px] font-semibold shadow-sm backdrop-blur-sm bg-purple-600/90 px-1 py-0">
            Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-0.5 text-[8px] font-semibold shadow-sm backdrop-blur-sm bg-green-600/90 text-white px-1 py-0">
            <CheckCircle className="h-2 w-2" />
            Verified
          </Badge>
        )}
      </div>

      <CardHeader className="p-2 pb-1">
        <div className="flex items-start gap-1.5">
          {/* Merchant Logo */}
          {offer.merchant?.logo_url ? (
            <div className="relative h-8 w-8 shrink-0 rounded border border-gray-200 bg-white p-0.5 flex items-center justify-center">
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-gradient-to-br from-primary/10 to-primary/5 text-xs font-bold">
              {offer.merchant?.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {offer.merchant && (
              <Link
                href={ROUTES.merchantDetail(offer.merchant.slug)}
                className="text-[9px] text-muted-foreground hover:text-primary hover:underline font-medium truncate block"
              >
                {offer.merchant.name}
              </Link>
            )}
            <h3 className="font-semibold text-[10px] leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-0.5">
              {offer.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 pt-0 flex-1 flex flex-col gap-1">
        {offer.description && (
          <p className="text-[9px] text-muted-foreground line-clamp-1 leading-tight">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-0.5">
          {offer.discount_value && (
            <Badge variant="info" className="text-[8px] px-1 py-0 font-semibold">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[8px] px-1 py-0 font-semibold">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% CB`
                : `${formatCurrency(offer.cashback_value)} CB`}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-1">
            <div className="flex items-center gap-1 p-1 bg-gradient-to-r from-primary/10 to-primary/5 border border-dashed border-primary/30 rounded">
              <code className="flex-1 text-center font-bold text-[9px] text-primary tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 h-5 text-[8px] px-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-2 w-2 mr-0.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-2 w-2 mr-0.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-1 font-semibold text-[9px] h-6"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-2 w-2" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-1 font-semibold text-[9px] h-6" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-2 w-2" />
                Reveal Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-2 w-2" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
