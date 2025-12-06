"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  Gift,
  Tag,
  Store,
  Percent,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantGrid } from "@/components/merchant/MerchantGrid";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { OfferCard } from "@/components/offer/OfferCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ROUTES } from "@/lib/constants";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  viewAllLink?: string;
  viewAllText?: string;
}

function SectionHeader({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>
      {viewAllLink && (
        <Button variant="outline" asChild className="gap-2">
          <Link href={viewAllLink}>
            {viewAllText}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function PromoSlider({ promoOffers }: { promoOffers: any[] }) {
  const [promoIndex, setPromoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!promoOffers || promoOffers.length === 0) {
    return null;
  }

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const cardWidth = 350; // approximate card width
      containerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      });
    }
  };

  const nextSlide = () => {
    const newIndex = promoIndex < promoOffers.length - 1 ? promoIndex + 1 : 0;
    setPromoIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const prevSlide = () => {
    const newIndex = promoIndex > 0 ? promoIndex - 1 : promoOffers.length - 1;
    setPromoIndex(newIndex);
    scrollToIndex(newIndex);
  };

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all hover:scale-105 hidden sm:flex"
          aria-label="Previous offers"
        >
          <ChevronLeft className="h-5 w-5 text-gray-800 dark:text-white" />
        </button>

        {/* Slider Container */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {promoOffers.map((offer, index) => {
              const metadata = offer.metadata ? JSON.parse(offer.metadata) : {};
              const gradient = metadata.gradient || "from-purple-500 to-blue-600";
              const emoji = metadata.emoji || "🎁";
              
              return (
                <div
                  key={offer.id}
                  className="min-w-[280px] sm:min-w-[320px] lg:min-w-[350px] flex-shrink-0 snap-start"
                >
                  <a
                    href={offer.link_url || "#"}
                    target={offer.link_url ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    <div
                      className={`bg-gradient-to-r ${gradient} rounded-xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] h-full`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <div className="bg-white px-3 py-1 rounded-lg">
                              <span className="text-xs font-bold text-gray-800">
                                {offer.brand_name || offer.title}
                              </span>
                            </div>
                            {offer.badge_text && (
                              <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-bold">
                                {offer.badge_text}
                              </span>
                            )}
                          </div>
                          <h3 className="text-white font-bold text-lg mb-2">
                            {offer.headline || offer.title}
                          </h3>
                          <p className="text-white/90 text-sm mb-3">
                            {offer.description || ''}
                          </p>
                          {offer.code && (
                            <div className="flex items-center gap-2 bg-white/95 rounded-lg px-3 py-2">
                              <Tag className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-gray-800 flex-1 truncate">
                                {offer.code}
                              </span>
                              <ArrowRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                        <div className="text-4xl sm:text-5xl flex-shrink-0">
                          {emoji}
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all hover:scale-105 hidden sm:flex"
          aria-label="Next offers"
        >
          <ChevronRight className="h-5 w-5 text-gray-800 dark:text-white" />
        </button>
      </div>

      {/* Mobile Navigation + Dots */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={prevSlide}
          className="flex sm:hidden items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-md"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4 text-gray-800 dark:text-white" />
        </button>
        
        <div className="flex gap-2">
          {promoOffers.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setPromoIndex(index);
                scrollToIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === promoIndex ? "w-6 bg-purple-600 dark:bg-purple-400" : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="flex sm:hidden items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-md"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4 text-gray-800 dark:text-white" />
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(
          `${API_URL}/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=12&limit_banners=5`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (res.ok) {
          const json = await res.json();
          console.log("Homepage data:", json);
          setData(json.data || json || null);
        } else {
          console.error("Homepage API error:", res.status, res.statusText);
          const errorText = await res.text();
          console.error("Error response:", errorText);
        }
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-advance slider
  useEffect(() => {
    if (!data?.banners || data.banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % data.banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [data?.banners]);

  const banners = data?.banners || [];
  const promo_banners = data?.promo_banners || [];
  const featured_merchants = data?.featured_merchants || [];
  const featured_offers = data?.featured_offers || [];
  const exclusive_offers = data?.exclusive_offers || [];
  const featured_products = data?.featured_products || [];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section - CouponDunia Style */}
      <section className="bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 sm:py-16">
        <div className="container text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Save Money with Verified
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
            Coupons & Cashback
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Get the best deals, exclusive coupons, and instant cashback from
            1000+ top brands. Start saving today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              asChild
            >
              <Link href={ROUTES.coupons}>
                Browse Coupons
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.merchants}>View All Stores</Link>
            </Button>
          </div>

          {/* Stats Section - Inside Hero */}
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl p-6 sm:p-8 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                50,000+
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Verified Coupons
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-6 sm:p-8 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                1000+
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Partner Stores
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <h3 className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                ₹50 Cr+
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Cashback Given
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Slider Section - At the Very Top */}
      {banners.length > 0 && (
        <section className="relative w-full bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              {/* Slider Container - Fixed aspect ratio for 2800x458 */}
              <div className="relative w-full" style={{ aspectRatio: '2800/458' }}>
                {banners.map((banner: any, index: number) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      index === currentSlide
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0"
                    }`}
                  >
                    {banner.link_url ? (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full"
                      >
                        <img
                          src={
                            banner.image_url ||
                            "/images/banners/placeholder.jpg"
                          }
                          alt={banner.title || "Banner"}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <img
                        src={
                          banner.image_url || "/images/banners/placeholder.jpg"
                        }
                        alt={banner.title || "Banner"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-800" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all hover:scale-110"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-800" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
                  {banners.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 sm:h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? "w-6 sm:w-8 bg-white"
                          : "w-1.5 sm:w-2 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {/* Promotional Offers Slider - After Stats Section */}
      {promo_banners.length > 0 && (
        <section className="bg-white dark:bg-gray-900 py-8 sm:py-12">
          <div className="container">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Special Offers</h2>
              <p className="text-muted-foreground">Exclusive deals just for you</p>
            </div>
            <PromoSlider promoOffers={promo_banners} />
          </div>
        </section>
      )}

      {/* Featured Stores */}
      <section className="container py-8 sm:py-12">
        <SectionHeader
          title="Featured Stores"
          subtitle="Shop with cashback at top partner stores"
          viewAllLink={ROUTES.merchants}
        />
        {featured_merchants.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured_merchants.slice(0, 12).map((merchant: any) => (
              <MerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No featured stores available
            </p>
          </div>
        )}
      </section>

      {/* Exclusive Deals */}
      {exclusive_offers.length > 0 && (
        <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-8 sm:py-12">
          <div className="container">
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary" className="gap-1">
                <Percent className="h-3 w-3" />
                Exclusive
              </Badge>
            </div>
            <SectionHeader
              title="Exclusive Deals"
              subtitle="Special offers only for members"
              viewAllLink={ROUTES.coupons}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {exclusive_offers.slice(0, 6).map((offer: any) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured_products.length > 0 && (
        <section className="container py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">
                Featured Gift Cards
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Best selling gift cards at amazing prices
              </p>
            </div>
            <Button variant="outline" asChild className="gap-2">
              <Link href={ROUTES.products}>
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured_products.slice(0, 6).map((product: any) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}

      {/* Today's Top Coupons */}
      <section className="container py-8 sm:py-12">
        <SectionHeader
          title="Today's Top Coupons"
          subtitle="Most popular deals right now"
          viewAllLink={ROUTES.coupons}
        />
        {featured_offers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured_offers.slice(0, 6).map((offer: any) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No featured offers available
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container py-8 sm:py-12">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Start Saving Today!
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Join thousands of smart shoppers who save money every day with our
              verified coupons and cashback offers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href={ROUTES.coupons}>
                  Browse All Deals
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}