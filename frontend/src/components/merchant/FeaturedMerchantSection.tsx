
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
    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-3 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Featured Large Card - Left Side */}
        <Link
          href={ROUTES.merchantDetail(featured.slug)}
          className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 w-full lg:w-[180px] lg:flex-shrink-0 group bg-white dark:bg-gray-800"
          style={{ aspectRatio: '1/1' }}
        >
          {featured.is_featured && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                🔥
              </span>
            </div>
          )}
          
          {/* Full Cover Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-300"
            style={{ 
              backgroundImage: featured.logo_url 
                ? `url(${featured.logo_url})` 
                : 'none',
              backgroundColor: !featured.logo_url ? '#f3f4f6' : 'transparent'
            }}
          >
            {!featured.logo_url && (
              <div className="flex items-center justify-center h-full text-3xl font-bold text-gray-400">
                {featured.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Overlay with gradient and cashback info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
            <h3 className="text-sm sm:text-base font-medium text-white mb-2 text-center">
              {featured.name}
            </h3>
            {getCashbackText(featured) && (
              <div className="flex items-center justify-center gap-1.5 bg-white/95 rounded-lg px-2 py-1.5">
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-gray-800">
                  Upto {getCashbackText(featured)}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Right Grid - 2 Rows for Desktop, Single Column for Mobile */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Top Row - 3 columns on mobile, 5 on desktop */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {topRowMerchants.map((merchant) => (
              <MerchantSmallCard key={merchant.id} merchant={merchant} getCashbackText={getCashbackText} />
            ))}
          </div>
          
          {/* Bottom Row - 3 columns on mobile (with View All), 5 on desktop */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {bottomRowMerchants.slice(0, 2).map((merchant) => (
              <MerchantSmallCard key={merchant.id} merchant={merchant} getCashbackText={getCashbackText} />
            ))}
            
            {/* View All Card - Always visible on mobile at position 3 */}
            <Link
              href={ROUTES.merchants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-2 sm:p-4 min-h-[80px] sm:min-h-[100px] group"
              style={{ aspectRatio: '1/1' }}
            >
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 group-hover:text-primary transition-colors text-center">
                View All
              </span>
            </Link>

            {/* Remaining merchants - hidden on mobile, shown on desktop */}
            {bottomRowMerchants.slice(2).map((merchant) => (
              <MerchantSmallCard 
                key={merchant.id} 
                merchant={merchant} 
                getCashbackText={getCashbackText}
                className="hidden lg:block"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantSmallCard({ 
  merchant, 
  getCashbackText,
  className = ""
}: { 
  merchant: any; 
  getCashbackText: (m: any) => string | null;
  className?: string;
}) {
  const cashback = getCashbackText(merchant);
  
  return (
    <Link
      href={ROUTES.merchantDetail(merchant.slug)}
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[80px] sm:min-h-[100px] group ${className}`}
      style={{ aspectRatio: '1/1' }}
    >
      {/* Full Cover Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-300"
        style={{ 
          backgroundImage: merchant.logo_url 
            ? `url(${merchant.logo_url})` 
            : 'none',
          backgroundColor: !merchant.logo_url ? '#f3f4f6' : 'transparent'
        }}
      >
        {!merchant.logo_url && (
          <div className="flex items-center justify-center h-full text-base font-bold text-gray-400">
            {merchant.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Overlay with gradient and cashback info */}
      {cashback && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-1.5 sm:p-2">
          <div className="flex items-center gap-1 bg-white/95 rounded-lg px-1.5 py-1">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
            <span className="text-[9px] sm:text-xs font-semibold text-gray-800 whitespace-nowrap">
              {cashback}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
