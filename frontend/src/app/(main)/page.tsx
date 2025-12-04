import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Gift, Tag, Store, Percent, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MerchantGrid } from "@/components/merchant/MerchantGrid";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
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

async function getHomepageData() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=12', {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error('Homepage API returned:', res.status);
      return null;
    }
    
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomepageData();
  
  const featured_merchants = data?.featured_merchants || [];
  const featured_offers = data?.featured_offers || [];
  const exclusive_offers = data?.exclusive_offers || [];
  const featured_products = data?.featured_products || [];

  return (
    <div className="flex flex-col gap-8 sm:gap-12 py-6 sm:py-8">
      <section className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Save Money with Verified{" "}
            <span className="bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
              Coupons & Cashback
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl max-w-2xl mx-auto">
            Get the best deals, exclusive coupons, and instant cashback from 1000+ top brands. Start saving today!
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link href={ROUTES.coupons}>
                <Tag className="h-4 w-4" />
                Browse Coupons
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2">
              <Link href={ROUTES.merchants}>
                <Store className="h-4 w-4" />
                View All Stores
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-10 sm:mt-16 grid gap-4 sm:gap-6 grid-cols-3">
          <Card className="text-center border-0 shadow-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-500/10">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">50,000+</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Verified Coupons</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-none bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-500/10">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">1000+</h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Partner Stores</p>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-none bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
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

      <section className="container">
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

      <section className="container">
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

      <section className="container">
        <SectionHeader
          title="Featured Gift Cards"
          subtitle="Top discounted gift cards - 6x2 Grid Layout"
          viewAllLink={ROUTES.products}
        />
        {featured_products.length > 0 ? (
          <ProductGrid products={featured_products} columns={6} showTwoRows />
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No featured gift cards available</p>
          </div>
        )}
      </section>

      <section className="container">
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
