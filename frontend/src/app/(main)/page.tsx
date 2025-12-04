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
import { OfferGrid } from "@/components/offer/OfferGrid";
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

const promoOffers = [
  {
    id: 1,
    brand: "cleartrip",
    brandColor: "text-blue-600",
    badge: "Exclusive",
    badgeColor: "bg-orange-500 text-white",
    title: "Upto 25% Off",
    subtitle: "On Domestic Flights",
    code: "Flat ₹160 Cashback",
    gradient: "from-blue-500 to-blue-600",
    emoji: "✈️",
  },
  {
    id: 2,
    brand: "McDelivery",
    brandColor: "text-red-600",
    badge: "Hot Deal",
    badgeColor: "bg-yellow-400 text-red-600",
    title: "Get A Free Burger",
    subtitle: "McVeggie Or A McChicken Burger On Orders Above ₹499",
    code: "Use Code : CDXMCDFREE",
    gradient: "from-red-500 to-red-600",
    emoji: "🍔",
  },
  {
    id: 3,
    brand: "Swiggy",
    brandColor: "text-orange-600",
    badge: "New User",
    badgeColor: "bg-green-500 text-white",
    title: "Flat 50% Off",
    subtitle: "On Your First Food Order",
    code: "Up to ₹100 Off",
    gradient: "from-orange-500 to-orange-600",
    emoji: "🍕",
  },
  {
    id: 4,
    brand: "Amazon",
    brandColor: "text-yellow-700",
    badge: "Limited Time",
    badgeColor: "bg-purple-500 text-white",
    title: "Upto 60% Off",
    subtitle: "On Electronics & Gadgets",
    code: "Extra 10% Bank Offer",
    gradient: "from-yellow-500 to-orange-500",
    emoji: "📱",
  },
  {
    id: 5,
    brand: "Flipkart",
    brandColor: "text-blue-700",
    badge: "Big Savings",
    badgeColor: "bg-red-500 text-white",
    title: "Min 40% Off",
    subtitle: "On Fashion & Lifestyle",
    code: "Flat ₹200 Cashback",
    gradient: "from-indigo-500 to-blue-600",
    emoji: "👕",
  },
  {
    id: 6,
    brand: "Zomato",
    brandColor: "text-red-600",
    badge: "Weekend Special",
    badgeColor: "bg-green-600 text-white",
    title: "Buy 1 Get 1 Free",
    subtitle: "On All Restaurant Orders",
    code: "Use Code : BOGO50",
    gradient: "from-red-600 to-pink-600",
    emoji: "🍜",
  },
];

function PromoSlider() {
  const [promoIndex, setPromoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleCards = 3;
  const maxIndex = Math.max(0, promoOffers.length - visibleCards);

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.scrollWidth / promoOffers.length;
      containerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      });
    }
  };

  const nextSlide = () => {
    const newIndex = promoIndex < maxIndex ? promoIndex + 1 : 0;
    setPromoIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const prevSlide = () => {
    const newIndex = promoIndex > 0 ? promoIndex - 1 : maxIndex;
    setPromoIndex(newIndex);
    scrollToIndex(newIndex);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {/* Left Navigation Button */}
        <button
          onClick={prevSlide}
          className="hidden md:flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-10"
          aria-label="Previous offers"
        >
          <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-white" />
        </button>

        {/* Slider Container */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {promoOffers.map((offer) => (
              <div
                key={offer.id}
                className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] flex-shrink-0 snap-start"
              >
                <div
                  className={`bg-gradient-to-r ${offer.gradient} rounded-xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white px-3 py-1 rounded-md">
                          <span
                            className={`text-xs font-semibold ${offer.brandColor}`}
                          >
                            {offer.brand}
                          </span>
                        </div>
                        <Badge className={`${offer.badgeColor} text-xs`}>
                          {offer.badge}
                        </Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                        {offer.title}
                      </h3>
                      <p className="text-white/80 text-sm line-clamp-1">
                        {offer.subtitle}
                      </p>
                      <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <Tag className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {offer.code}
                        </span>
                        <ArrowRight className="h-4 w-4 ml-auto text-gray-600 flex-shrink-0" />
                      </div>
                    </div>
                    <div className="hidden sm:block ml-4">
                      <div className="text-5xl">{offer.emoji}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Navigation Button */}
        <button
          onClick={nextSlide}
          className="hidden md:flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-10"
          aria-label="Next offers"
        >
          <ChevronRight className="h-6 w-6 text-gray-800 dark:text-white" />
        </button>
      </div>

      {/* Mobile Navigation Buttons */}
      <div className="flex md:hidden justify-center gap-4 mt-4">
        <button
          onClick={prevSlide}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
          aria-label="Previous offers"
        >
          <ChevronLeft className="h-5 w-5 text-gray-800 dark:text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
          aria-label="Next offers"
        >
          <ChevronRight className="h-5 w-5 text-gray-800 dark:text-white" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setPromoIndex(index);
              scrollToIndex(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === promoIndex ? "w-6 bg-purple-600" : "w-2 bg-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(
          `${API_URL}/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=12&limit_banners=5`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
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
      {/* Hero Slider Section - At the Very Top */}
      {banners.length > 0 && (
        <section className="relative w-full bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              {/* Slider Container */}
              <div className="relative aspect-[16/6] sm:aspect-[21/6] md:aspect-[24/6] lg:aspect-[32/9]">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {banners.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? "w-8 bg-white"
                          : "w-2 bg-white/50"
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
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12">
        <div className="container">
          <PromoSlider />
        </div>
      </section>

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
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Verified Coupons</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-6 sm:p-8 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                1000+
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Partner Stores</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <h3 className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                ₹50 Cr+
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Cashback Given</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <section className="container py-8 sm:py-12">
        <SectionHeader
          title="Featured Stores"
          subtitle="Shop with cashback at top partner stores"
          viewAllLink={ROUTES.merchants}
        />
        {featured_merchants.length > 0 ? (
          <MerchantGrid merchants={featured_merchants} />
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
            <OfferGrid offers={exclusive_offers} />
          </div>
        </section>
      )}

      {/* Featured Products - 6+6 Grid */}
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

          {/* First Row - 6 Products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-3 md:mb-4">
            {featured_products.slice(0, 6).map((product: any) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>

          {/* Second Row - 6 Products */}
          {featured_products.length > 6 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {featured_products.slice(6, 12).map((product: any) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          )}
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
          <OfferGrid offers={featured_offers} />
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