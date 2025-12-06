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
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-100 hover:border-purple-300 border border-gray-100 h-full flex flex-col bg-white rounded-xl">
      {/* Badges */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        {offer.is_exclusive && (
          <Badge variant="exclusive" className="text-[9px] font-semibold shadow-lg backdrop-blur-sm bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-0.5 border-0">
            Exclusive
          </Badge>
        )}
        {offer.is_verified && (
          <Badge className="gap-1 text-[9px] font-semibold shadow-lg backdrop-blur-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 border-0">
            <CheckCircle className="h-2.5 w-2.5" />
            Verified
          </Badge>
        )}
      </div>

      <CardHeader className="p-0">
        {/* Offer/Merchant Image - Full Display without Cropping */}
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-t-xl">
          <div className="w-full h-full p-3 sm:p-4 flex items-center justify-center">
            {offer.merchant?.logo_url ? (
              <img
                src={offer.merchant.logo_url}
                alt={offer.merchant.name}
                className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-inner">
                        <span class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">${offer.merchant?.name?.charAt(0) || 'O'}</span>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-inner">
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {offer.merchant?.name?.charAt(0) || 'O'}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col gap-1.5 sm:gap-2 border-t border-gray-100">
        {/* Merchant Name */}
        {offer.merchant && (
          <Link
            href={ROUTES.merchantDetail(offer.merchant.slug)}
            className="text-[10px] sm:text-[11px] text-gray-500 hover:text-purple-600 font-medium truncate block transition-colors"
          >
            {offer.merchant.name}
          </Link>
        )}

        {/* Offer Title */}
        <h3 className="font-semibold text-[11px] sm:text-xs leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[28px] sm:min-h-[32px] text-gray-800">
          {offer.title}
        </h3>

        {/* Description */}
        {offer.description && (
          <p className="text-[9px] sm:text-[10px] text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
            {offer.description}
          </p>
        )}

        {/* Cashback/Discount Info */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-auto">
          {offer.discount_value && (
            <Badge variant="info" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-semibold shadow-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
              {offer.discount_type === "percentage"
                ? `${offer.discount_value}% OFF`
                : `${formatCurrency(offer.discount_value)} OFF`}
            </Badge>
          )}
          {offer.cashback_value && (
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-semibold shadow-sm border-0">
              {offer.cashback_type === "percentage"
                ? `${offer.cashback_value}% Cashback`
                : `${formatCurrency(offer.cashback_value)} Cashback`}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 sm:p-3 pt-0">
        {showCode && offer.offer_type === "code" && offer.coupon_code ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-dashed border-purple-300 rounded-lg">
              <code className="flex-1 text-center font-bold text-[10px] sm:text-[11px] text-purple-700 tracking-wider">
                {offer.coupon_code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="shrink-0 h-6 sm:h-7 text-[9px] sm:text-[10px] px-1.5 sm:px-2 border-purple-300 hover:bg-purple-100"
              >
                {copied ? (
                  <>
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button
              className="w-full gap-1 sm:gap-1.5 font-semibold text-[10px] sm:text-[11px] h-8 sm:h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md"
              onClick={() => window.open(offer.affiliate_url, "_blank")}
            >
              Go to Store
              <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-1 sm:gap-1.5 font-semibold text-[10px] sm:text-[11px] h-8 sm:h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all duration-300 hover:shadow-lg" onClick={handleClick}>
            {offer.offer_type === "code" ? (
              <>
                <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Get Code
              </>
            ) : (
              <>
                Get Deal
                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}