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
      href={`${ROUTES.merchants}/${merchant.slug}`}
      className="group block"
    >
      <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-0 bg-white dark:bg-gray-800">
        <CardContent className="p-1.5 sm:p-2">
          <div className="aspect-square w-full mb-1.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full p-1.5 sm:p-2 flex items-center justify-center">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105 rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center';
                      fallback.innerHTML = `<span class="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-300">${merchant.name.charAt(0)}</span>`;
                      target.parentElement.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-300">
                    {merchant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-center space-y-0.5">
            <h3 className="font-semibold text-[10px] sm:text-[11px] text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {merchant.name}
            </h3>
            {(merchant.total_offers ?? merchant.offers_count ?? 0) > 0 && (
              <p className="text-[8px] sm:text-[9px] text-purple-600 dark:text-purple-400 font-medium">
                {merchant.total_offers ?? merchant.offers_count ?? 0} {(merchant.total_offers ?? merchant.offers_count ?? 0) === 1 ? 'Offer' : 'Offers'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}