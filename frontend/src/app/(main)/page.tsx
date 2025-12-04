
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Gift, Tag, Store, Percent, ChevronRight, ChevronLeft } from "lucide-react";
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

function SectionHeader({ title, subtitle, viewAllLink, viewAllText = "View All" }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
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

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=12&limit_banners=5');
        if (res.ok) {
          const json = await res.json();
          setData(json.data || null);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
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
      {/* Hero Slider Section */}
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
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    {banner.link_url ? (
                      <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <img
                          src={banner.image_url || '/images/banners/placeholder.jpg'}
                          alt={banner.title || 'Banner'}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <img
                        src={banner.image_url || '/images/banners/placeholder.jpg'}
                        alt={banner.title || 'Banner'}
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
                        index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'
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

      {/* Stats Section */}
      <section className="container py-8 sm:py-12">
        <div className="grid gap-4 sm:gap-6 grid-cols-3">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-500/10">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">50,000+</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Verified Coupons</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-500/10">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">1000+</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Partner Stores</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-orange-500/10">
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">₹50 Cr+</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Cashback Given</p>
            </CardContent>
          </Card>
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
            <p className="text-muted-foreground">No featured stores available</p>
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
              <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">Featured Gift Cards</h2>
              <p className="text-sm text-muted-foreground mt-1">Best selling gift cards at amazing prices</p>
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
            <p className="text-muted-foreground">No featured offers available</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container py-8 sm:py-12">
        <Card className="bg-gradient-to-r from-primary to-green-600 text-white border-0">
          <CardContent className="p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start Saving Today!</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Join thousands of smart shoppers who save money every day with our verified coupons and cashback offers.
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
