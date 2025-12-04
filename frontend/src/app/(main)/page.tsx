
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiUrl}/api/v1/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=12&limit_banners=5`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data || null);
        } else {
          console.error('Homepage API error:', res.status, res.statusText);
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
            Get the best deals, exclusive coupons, and instant cashback from 1000+ top brands. Start saving today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8" asChild>
              <Link href={ROUTES.coupons}>
                Browse Coupons
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.merchants}>
                View All Stores
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section - Above Slider */}
      <section className="bg-white dark:bg-gray-900 py-8 border-y">
        <div className="container">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-3 text-center">
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">50,000+</h3>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">Verified Coupons</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Store className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">1000+</h3>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">Partner Stores</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">₹50 Cr+</h3>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">Cashback Given</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Offers Banner - Top Section */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-3 sm:py-4">
        <div className="container">
          <div className="relative overflow-hidden">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
              {/* Cleartrip Offer */}
              <div className="min-w-[280px] sm:min-w-[400px] md:min-w-[500px] flex-shrink-0 snap-start">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white px-3 py-1 rounded-md">
                          <span className="text-xs font-semibold text-blue-600">cleartrip</span>
                        </div>
                        <Badge className="bg-orange-500 text-white text-xs">Exclusive</Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-1">Upto 25% Off</h3>
                      <p className="text-blue-100 text-sm">On Domestic Flights</p>
                      <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <Tag className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-gray-800">Flat ₹160 Cashback</span>
                        <ArrowRight className="h-4 w-4 ml-auto text-gray-600" />
                      </div>
                    </div>
                    <div className="hidden sm:block ml-4">
                      <div className="text-6xl">✈️</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* McDelivery Offer */}
              <div className="min-w-[280px] sm:min-w-[400px] md:min-w-[500px] flex-shrink-0 snap-start">
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white px-3 py-1 rounded-md">
                          <span className="text-xs font-semibold text-red-600">McDelivery</span>
                        </div>
                        <Badge className="bg-yellow-400 text-red-600 text-xs">Hot Deal</Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-1">Get A Free Burger</h3>
                      <p className="text-red-100 text-sm">McVeggie Or A McChicken Burger On Orders Above ₹499</p>
                      <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <Tag className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-gray-800">Use Code : CDXMCDFREE</span>
                        <ArrowRight className="h-4 w-4 ml-auto text-gray-600" />
                      </div>
                    </div>
                    <div className="hidden sm:block ml-4">
                      <div className="text-6xl">🍔</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swiggy Offer */}
              <div className="min-w-[280px] sm:min-w-[400px] md:min-w-[500px] flex-shrink-0 snap-start">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white px-3 py-1 rounded-md">
                          <span className="text-xs font-semibold text-orange-600">Swiggy</span>
                        </div>
                        <Badge className="bg-green-500 text-white text-xs">New User</Badge>
                      </div>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-1">Flat 50% Off</h3>
                      <p className="text-orange-100 text-sm">On Your First Food Order</p>
                      <div className="mt-3 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <Tag className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-800">Up to ₹100 Off</span>
                        <ArrowRight className="h-4 w-4 ml-auto text-gray-600" />
                      </div>
                    </div>
                    <div className="hidden sm:block ml-4">
                      <div className="text-6xl">🍕</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
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
