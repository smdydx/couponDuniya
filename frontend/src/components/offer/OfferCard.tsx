
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
    <Card className="group relative overflow-hidden h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/30 border">
      {/* Badges */}
      <div className="absolute right-1.5 top-1.5 z-10 flex flex-col gap-0.5">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-[9px] font-semibold shadow-md backdrop-blur-sm bg-purple-600/90 px-1.5 py-0.5">
            Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-0.5 text-[9px] font-semibold shadow-md backdrop-blur-sm bg-green-600/90 text-white px-1.5 py-0.5">
            <CheckCircle className="h-2 w-2" />
            Verified
          </Badge>
        )}
      </div>

      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-start gap-2">
          {/* Merchant Logo */}
          {offer.merchant?.logo_url ? (
            <div className="relative h-10 w-10 shrink-0 rounded border border-gray-200 bg-white p-1 flex items-center justify-center">
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-gradient-to-br from-primary/10 to-primary/5 text-sm font-bold">
              {offer.merchant?.name.charAt(0)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {offer.merchant && (
              <Link
                href={ROUTES.merchantDetail(offer.merchant.slug)}
                className="text-[10px] text-muted-foreground hover:text-primary hover:underline font-medium truncate block"
              >
                {offer.merchant.name}
              </Link>
            )}
            <h3 className="font-semibold text-xs leading-tight line-clamp-2 group-hover:text-primary transition-colors mt-0.5">
              {offer.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2.5 pt-0 flex-1 flex flex-col gap-1.5">
        {offer.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-1">
          {offer.discount_value && (
            <Badge variant="info" className="text-[9px] px-1.5 py-0.5 font-semibold">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[9px] px-1.5 py-0.5 font-semibold">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% CB`
                : `${formatCurrency(offer.cashback_value)} CB`}
            </Badge>
          )}
        </div>

        {/* Expiry Warning */}
        {offer.end_date && isExpiringSoon(offer.end_date) && (
          <div className="flex items-center gap-1 text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5" />
            <span className="font-medium">Expires {formatDate(offer.end_date)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2.5 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-1.5">
            <div className="flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-primary/10 to-primary/5 border border-dashed border-primary/30 rounded">
              <code className="flex-1 text-center font-bold text-xs text-primary tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 h-6 text-[10px] px-2"
              >
                {copied ? (
                  <>
                    <Check className="h-2.5 w-2.5 mr-0.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5 mr-0.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-1.5 font-semibold text-[10px] h-7"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-2.5 w-2.5" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-1.5 font-semibold text-[10px] h-7" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-2.5 w-2.5" />
                Reveal Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-2.5 w-2.5" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
