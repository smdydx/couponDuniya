import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MerchantGrid } from "@/components/merchant/MerchantGrid";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ROUTES } from "@/lib/constants";

async function getHomepageData() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${base}/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=8`, {
      next: { revalidate: 300 },
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (!res.ok) {
      console.error('Homepage API error:', res.status);
      return { featured_merchants: [], featured_offers: [], exclusive_offers: [], featured_products: [] };
    }
    const json = await res.json();
    return json.data || { featured_merchants: [], featured_offers: [], exclusive_offers: [], featured_products: [] };
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return { featured_merchants: [], featured_offers: [], exclusive_offers: [], featured_products: [] };
  }
}

export default async function HomePage() {
  const { featured_merchants, featured_offers, exclusive_offers, featured_products } = await getHomepageData();

  return (
    <div className="flex flex-col gap-12 py-8">
      <section className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Save Money with Verified{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Coupons & Cashback</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">Get the best deals, exclusive coupons, and instant cashback from 1000+ top brands. Start saving today!</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={ROUTES.coupons}>Browse Coupons<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.merchants}>View All Stores</Link>
            </Button>
          </div>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><TrendingUp className="h-6 w-6 text-primary" /></div><h3 className="text-3xl font-bold">50,000+</h3><p className="mt-1 text-muted-foreground">Verified Coupons</p></div>
          <div className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-6 w-6 text-primary" /></div><h3 className="text-3xl font-bold">1000+</h3><p className="mt-1 text-muted-foreground">Partner Stores</p></div>
          <div className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Gift className="h-6 w-6 text-primary" /></div><h3 className="text-3xl font-bold">₹50 Cr+</h3><p className="mt-1 text-muted-foreground">Cashback Given</p></div>
        </div>
      </section>

      <section className="container">
        <div className="mb-6 flex items-center justify-between">
          <div><h2 className="text-2xl font-bold sm:text-3xl">Featured Stores</h2><p className="mt-1 text-muted-foreground">Shop with cashback at top partner stores</p></div>
          <Button variant="ghost" asChild className="hidden sm:flex"><Link href={ROUTES.merchants}>View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        {featured_merchants.length > 0 ? <MerchantGrid merchants={featured_merchants} /> : <p className="text-center text-muted-foreground">No featured stores available</p>}
      </section>

      {exclusive_offers.length > 0 && (
        <section className="bg-muted/50 py-12">
          <div className="container">
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold sm:text-3xl">Exclusive Deals</h2><p className="mt-1 text-muted-foreground">Special offers only for BIDUA members</p></div><Button variant="ghost" asChild className="hidden sm:flex"><Link href={ROUTES.coupons}>View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
            <OfferGrid offers={exclusive_offers} />
          </div>
        </section>
      )}

      <section className="container">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold sm:text-3xl">Today's Top Coupons</h2><p className="mt-1 text-muted-foreground">Most popular deals right now</p></div><Button variant="ghost" asChild className="hidden sm:flex"><Link href={ROUTES.coupons}>View All<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
        {featured_offers.length > 0 ? <OfferGrid offers={featured_offers} /> : <p className="text-center text-muted-foreground">No featured offers available</p>}
      </section>

      <section className="container">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold sm:text-3xl">Featured Gift Cards</h2><p className="mt-1 text-muted-foreground">Top discounted gift cards right now</p></div></div>
        {featured_products.length > 0 ? <ProductGrid products={featured_products} /> : <p className="text-center text-muted-foreground">No featured gift cards available</p>}
      </section>
    </div>
  );
}