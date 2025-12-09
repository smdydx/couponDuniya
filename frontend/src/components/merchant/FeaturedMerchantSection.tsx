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

  // Take first 11 merchants for the grid
  const displayMerchants = merchants.slice(0, 11);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Shop with cashback at top partner stores
        </h2>
      </div>

      {/* Grid Container - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayMerchants.map((merchant) => (
          <Link
            key={merchant.id}
            href={ROUTES.merchantDetail(merchant.slug)}
            className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-1"
          >
            {/* Featured Badge */}
            {merchant.is_featured && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-red-500 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                  Featured
                </span>
              </div>
            )}

            {/* Image Container - Fixed Aspect Ratio */}
            <div className="relative w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="aspect-square w-full p-4 sm:p-6 flex items-center justify-center">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 flex items-center justify-center shadow-inner';
                        fallback.innerHTML = `<span class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300">${merchant.name.charAt(0)}</span>`;
                        target.parentElement.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 flex items-center justify-center shadow-inner">
                    <span className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300">
                      {merchant.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Merchant Name - Fixed Height */}
            <div className="bg-white dark:bg-gray-800 px-3 py-3 sm:py-3.5 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-center font-medium text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {merchant.name}
              </h3>
              {(merchant.total_offers ?? merchant.offers_count ?? 0) > 0 && (
                <p className="text-center text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                  {merchant.total_offers ?? merchant.offers_count ?? 0} {(merchant.total_offers ?? merchant.offers_count ?? 0) === 1 ? 'Offer' : 'Offers'}
                </p>
              )}
            </div>
          </Link>
        ))}

        {/* View All Card */}
        <Link
          href={ROUTES.merchants}
          className="group relative bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500 hover:-translate-y-1"
        >
          <div className="relative w-full">
            <div className="aspect-square w-full flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8 text-white"
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
                <p className="font-bold text-sm sm:text-base text-purple-700 dark:text-purple-300">
                  View All
                </p>
                <p className="text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  Stores
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 px-3 py-2.5 border-t border-purple-200 dark:border-purple-700/50">
            <p className="text-center font-medium text-xs sm:text-sm text-purple-700 dark:text-purple-300">
              Explore More
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}