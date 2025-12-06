"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { Merchant } from "@/types";

interface FeaturedMerchantSectionProps {
  merchants: Merchant[];
}

export function FeaturedMerchantSection({ merchants }: FeaturedMerchantSectionProps) {
  if (!merchants || merchants.length === 0) return null;

  const featured = merchants[0];
  const topRowMerchants = merchants.slice(1, 6);
  const bottomRowMerchants = merchants.slice(6, 10);

  const getCashbackText = (merchant: any) => {
    if (!merchant.default_cashback_value || merchant.default_cashback_value <= 0) {
      return null;
    }
    return merchant.default_cashback_type === "percentage" 
      ? `${merchant.default_cashback_value}%` 
      : `₹${merchant.default_cashback_value}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
        {/* Featured Large Card - Left Side */}
        <Link
          href={ROUTES.merchantDetail(featured.slug)}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-4 sm:p-6 lg:w-[180px] lg:flex-shrink-0 group"
        >
          {featured.is_featured && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                🔥
              </span>
            </div>
          )}
          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 flex items-center justify-center mb-3">
            {featured.logo_url ? (
              <img
                src={featured.logo_url}
                alt={featured.name}
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-3xl font-bold text-gray-400">
                {featured.name.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-medium text-gray-800 dark:text-white mb-2 text-center">
            {featured.name}
          </h3>
          {getCashbackText(featured) && (
            <div className="flex items-center gap-1.5 text-orange-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
              <span className="text-xs sm:text-sm font-semibold">
                Upto {getCashbackText(featured)} Voucher Rewards
              </span>
            </div>
          )}
        </Link>

        {/* Right Grid - 2 Rows */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4">
          {/* Top Row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
            {topRowMerchants.map((merchant) => (
              <MerchantSmallCard key={merchant.id} merchant={merchant} getCashbackText={getCashbackText} />
            ))}
          </div>
          
          {/* Bottom Row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
            {bottomRowMerchants.map((merchant) => (
              <MerchantSmallCard key={merchant.id} merchant={merchant} getCashbackText={getCashbackText} />
            ))}
            
            {/* View All Card */}
            <Link
              href={ROUTES.merchants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-3 sm:p-4 min-h-[90px] sm:min-h-[100px] group"
            >
              <span className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-300 group-hover:text-primary transition-colors">
                View All
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantSmallCard({ merchant, getCashbackText }: { merchant: any; getCashbackText: (m: any) => string | null }) {
  const cashback = getCashbackText(merchant);
  
  return (
    <Link
      href={ROUTES.merchantDetail(merchant.slug)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-3 sm:p-4 min-h-[90px] sm:min-h-[100px] group"
    >
      <div className="w-16 h-8 sm:w-24 sm:h-10 flex items-center justify-center mb-2">
        {merchant.logo_url ? (
          <img
            src={merchant.logo_url}
            alt={merchant.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-base font-bold text-gray-400">
            {merchant.name.charAt(0)}
          </div>
        )}
      </div>
      {cashback && (
        <div className="flex items-center gap-1 text-orange-500">
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
          </svg>
          <span className="text-[10px] sm:text-xs font-semibold">
            Upto {cashback}
          </span>
        </div>
      )}
    </Link>
  );
}
