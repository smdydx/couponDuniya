
"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import type { Merchant } from "@/types";

interface FeaturedMerchantSectionProps {
  merchants: Merchant[];
}

export function FeaturedMerchantSection({ merchants }: FeaturedMerchantSectionProps) {
  if (!merchants || merchants.length === 0) {
    return null;
  }

  // Take first merchant as featured (large card)
  const featured = merchants[0];
  // Next 10 merchants for grid (2 rows of 5 each)
  const gridMerchants = merchants.slice(1, 11);

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-3 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Featured Large Card - First Position (takes 2x2 grid space) */}
        <Link
          href={ROUTES.merchantDetail(featured.slug)}
          className="col-span-2 row-span-2 relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group bg-white dark:bg-gray-800 flex flex-col"
        >
          {featured.is_featured && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold">
                🔥 Featured
              </span>
            </div>
          )}

          {/* Image container with proper aspect ratio */}
          <div className="flex-1 relative w-full bg-white dark:bg-gray-900 flex items-center justify-center p-6">
            {featured.logo_url ? (
              <img
                src={featured.logo_url}
                alt={featured.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="eager"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-300">
                  {featured.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Merchant Info Overlay */}
          <div className="bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
            <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1">
              {featured.name}
            </h3>
            {featured.offers_count !== undefined && featured.offers_count > 0 && (
              <p className="text-white/90 text-xs sm:text-sm">
                {featured.offers_count} {featured.offers_count === 1 ? 'Offer' : 'Offers'}
              </p>
            )}
          </div>
        </Link>

        {/* Grid Merchant Cards - 2 rows of 5 cards each */}
        {gridMerchants.map((merchant) => (
          <Link
            key={merchant.id}
            href={ROUTES.merchantDetail(merchant.slug)}
            className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group bg-white dark:bg-gray-800 flex flex-col"
          >
            {/* Image container with fixed aspect ratio and no gaps */}
            <div className="relative w-full aspect-[4/3] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                          <span class="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-300">${merchant.name.charAt(0)}</span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-300">
                    {merchant.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Merchant name at bottom */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-2 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-center font-semibold text-[10px] sm:text-xs text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {merchant.name}
              </h3>
            </div>
          </Link>
        ))}

        {/* View All Card - Always Last Position */}
        <Link
          href={ROUTES.merchants}
          className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border-2 border-dashed border-purple-300 dark:border-purple-700 group bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 flex flex-col"
        >
          {/* Content container matching card aspect ratio */}
          <div className="relative w-full aspect-[4/3] p-2 sm:p-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
            <p className="text-center font-bold text-xs sm:text-sm text-purple-700 dark:text-purple-300">
              View All
            </p>
            <p className="text-center text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-1">
              Stores
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
