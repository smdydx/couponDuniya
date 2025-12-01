import Link from "next/link";
import { ArrowRight, TrendingUp, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MerchantGrid } from "@/components/merchant/MerchantGrid";
import { MerchantCard } from "@/components/merchant/MerchantCard";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ROUTES } from "@/lib/constants";

const mockMerchants = [
  { id: 1, name: 'Amazon', slug: 'amazon', logo_url: '/images/merchants/amazon.jpg', website_url: 'https://amazon.in', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 5.0, is_featured: true, is_active: true, total_offers: 120, created_at: '', updated_at: '' },
  { id: 2, name: 'Flipkart', slug: 'flipkart', logo_url: '/images/merchants/flipkart.png', website_url: 'https://flipkart.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 4.5, is_featured: true, is_active: true, total_offers: 85, created_at: '', updated_at: '' },
  { id: 3, name: 'Myntra', slug: 'myntra', logo_url: '/images/merchants/myntra.png', website_url: 'https://myntra.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 8.0, is_featured: true, is_active: true, total_offers: 65, created_at: '', updated_at: '' },
  { id: 4, name: 'Swiggy', slug: 'swiggy', logo_url: '/images/merchants/swiggy.png', website_url: 'https://swiggy.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 3.0, is_featured: true, is_active: true, total_offers: 42, created_at: '', updated_at: '' },
  { id: 5, name: 'Uber', slug: 'uber', logo_url: '/images/merchants/uber.png', website_url: 'https://uber.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 2.5, is_featured: true, is_active: true, total_offers: 18, created_at: '', updated_at: '' },
  { id: 6, name: 'BookMyShow', slug: 'bookmyshow', logo_url: '/images/merchants/bookmyshow.png', website_url: 'https://bookmyshow.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 6.0, is_featured: true, is_active: true, total_offers: 35, created_at: '', updated_at: '' },
  { id: 7, name: 'Ajio', slug: 'ajio', logo_url: '/images/merchants/ajio.png', website_url: 'https://ajio.com', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 7.0, is_featured: true, is_active: true, total_offers: 55, created_at: '', updated_at: '' },
];

const mockOffers = [
  { id: 1, merchant_id: 3, title: 'Flat 50% Off on Fashion', image_url: '/images/offers/myntra.png', merchant: { id: 3, name: 'Myntra', slug: 'myntra', logo_url: '/images/merchants/myntra.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 8, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'code' as const, discount_value: 50, discount_type: 'percentage' as const, coupon_code: 'MYNTRA50', affiliate_url: '#', is_exclusive: true, is_verified: true, is_featured: true, is_active: true, click_count: 1500, success_count: 850, start_date: '', created_at: '', updated_at: '' },
  { id: 2, merchant_id: 1, title: 'Extra 10% Cashback on Orders', image_url: '/images/offers/amazon.jpg', merchant: { id: 1, name: 'Amazon', slug: 'amazon', logo_url: '/images/merchants/amazon.jpg', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'cashback' as const, cashback_value: 10, cashback_type: 'percentage' as const, affiliate_url: '#', is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 2300, success_count: 1200, start_date: '', created_at: '', updated_at: '' },
  { id: 3, merchant_id: 4, title: 'Free Delivery on Orders Above ₹199', image_url: '/images/offers/swiggy.png', merchant: { id: 4, name: 'Swiggy', slug: 'swiggy', logo_url: '/images/merchants/swiggy.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 3, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'deal' as const, affiliate_url: '#', is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 980, success_count: 650, start_date: '', created_at: '', updated_at: '' },
  { id: 4, merchant_id: 5, title: '₹100 Off on First Ride', image_url: '/images/offers/uber.png', merchant: { id: 5, name: 'Uber', slug: 'uber', logo_url: '/images/merchants/uber.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 2.5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'code' as const, discount_value: 100, discount_type: 'fixed' as const, coupon_code: 'UBER100', affiliate_url: '#', is_exclusive: true, is_verified: true, is_featured: false, is_active: true, click_count: 450, success_count: 320, start_date: '', created_at: '', updated_at: '' },
  { id: 5, merchant_id: 6, title: 'Buy 1 Get 1 Free on Movies', image_url: '/images/offers/bookmyshow.png', merchant: { id: 6, name: 'BookMyShow', slug: 'bookmyshow', logo_url: '/images/merchants/bookmyshow.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 6, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'code' as const, coupon_code: 'BOGO', affiliate_url: '#', is_exclusive: true, is_verified: true, is_featured: true, is_active: true, click_count: 1200, success_count: 800, start_date: '', created_at: '', updated_at: '' },
  { id: 6, merchant_id: 7, title: 'Upto 70% Off + Extra 15%', image_url: '/images/offers/ajio.png', merchant: { id: 7, name: 'Ajio', slug: 'ajio', logo_url: '/images/merchants/ajio.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 7, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'code' as const, discount_value: 15, discount_type: 'percentage' as const, coupon_code: 'AJIO15', affiliate_url: '#', is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 890, success_count: 620, start_date: '', created_at: '', updated_at: '' },
  { id: 7, merchant_id: 2, title: 'Flat ₹500 Off on Electronics', image_url: '/images/offers/flipkart.png', merchant: { id: 2, name: 'Flipkart', slug: 'flipkart', logo_url: '/images/merchants/flipkart.png', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 4.5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'code' as const, discount_value: 500, discount_type: 'fixed' as const, coupon_code: 'FLIP500', affiliate_url: '#', is_exclusive: false, is_verified: true, is_featured: true, is_active: true, click_count: 1800, success_count: 1100, start_date: '', created_at: '', updated_at: '' },
  { id: 8, merchant_id: 1, title: 'Additional 5% Cashback on Prime', image_url: '/images/offers/amazon.jpg', merchant: { id: 1, name: 'Amazon', slug: 'amazon', logo_url: '/images/merchants/amazon.jpg', website_url: '', affiliate_url: '#', default_cashback_type: 'percentage' as const, default_cashback_value: 5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, offer_type: 'cashback' as const, cashback_value: 5, cashback_type: 'percentage' as const, affiliate_url: '#', is_exclusive: true, is_verified: true, is_featured: false, is_active: true, click_count: 670, success_count: 480, start_date: '', created_at: '', updated_at: '' },
];

const mockProducts = [
  { id: 1, name: 'Amazon Gift Card', slug: 'amazon-gift-card', sku: 'GC-AMZ', image_url: '/images/gift-cards/amazon.jpg', merchant: { id: 1, name: 'Amazon', slug: 'amazon', logo_url: '/images/merchants/amazon.jpg', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: true, is_active: true, variants: [{ id: 1, product_id: 1, denomination: 500, selling_price: 475, cost_price: 450, discount_percentage: 5, is_available: true }, { id: 2, product_id: 1, denomination: 1000, selling_price: 950, cost_price: 900, discount_percentage: 5, is_available: true }], created_at: '', updated_at: '' },
  { id: 2, name: 'Flipkart Gift Card', slug: 'flipkart-gift-card', sku: 'GC-FLK', image_url: '/images/gift-cards/flipkart.png', merchant: { id: 2, name: 'Flipkart', slug: 'flipkart', logo_url: '/images/merchants/flipkart.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 4.5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: true, is_active: true, variants: [{ id: 3, product_id: 2, denomination: 500, selling_price: 480, cost_price: 460, discount_percentage: 4, is_available: true }], created_at: '', updated_at: '' },
  { id: 3, name: 'Myntra Gift Card', slug: 'myntra-gift-card', sku: 'GC-MYN', image_url: '/images/gift-cards/myntra.png', merchant: { id: 3, name: 'Myntra', slug: 'myntra', logo_url: '/images/merchants/myntra.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 8, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: false, is_active: true, variants: [{ id: 4, product_id: 3, denomination: 1000, selling_price: 920, cost_price: 880, discount_percentage: 8, is_available: true }], created_at: '', updated_at: '' },
  { id: 4, name: 'Swiggy Gift Card', slug: 'swiggy-gift-card', sku: 'GC-SWG', image_url: '/images/gift-cards/swiggy.png', merchant: { id: 4, name: 'Swiggy', slug: 'swiggy', logo_url: '/images/merchants/swiggy.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 3, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: false, is_active: true, variants: [{ id: 5, product_id: 4, denomination: 500, selling_price: 485, cost_price: 470, discount_percentage: 3, is_available: true }], created_at: '', updated_at: '' },
  { id: 5, name: 'BookMyShow Gift Card', slug: 'bookmyshow-gift-card', sku: 'GC-BMS', image_url: '/images/gift-cards/bookmyshow.png', merchant: { id: 6, name: 'BookMyShow', slug: 'bookmyshow', logo_url: '/images/merchants/bookmyshow.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 6, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: true, is_active: true, variants: [{ id: 6, product_id: 5, denomination: 500, selling_price: 470, cost_price: 450, discount_percentage: 6, is_available: true }], created_at: '', updated_at: '' },
  { id: 6, name: 'Uber Gift Card', slug: 'uber-gift-card', sku: 'GC-UBR', image_url: '/images/gift-cards/uber.png', merchant: { id: 5, name: 'Uber', slug: 'uber', logo_url: '/images/merchants/uber.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 2.5, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: false, is_active: true, variants: [{ id: 7, product_id: 6, denomination: 1000, selling_price: 975, cost_price: 950, discount_percentage: 2.5, is_available: true }], created_at: '', updated_at: '' },
  { id: 7, name: 'Ajio Gift Card', slug: 'ajio-gift-card', sku: 'GC-AJI', image_url: '/images/gift-cards/ajio.png', merchant: { id: 7, name: 'Ajio', slug: 'ajio', logo_url: '/images/merchants/ajio.png', website_url: '', affiliate_url: '', default_cashback_type: 'percentage' as const, default_cashback_value: 7, is_featured: true, is_active: true, created_at: '', updated_at: '' }, is_bestseller: false, is_active: true, variants: [{ id: 8, product_id: 7, denomination: 1000, selling_price: 930, cost_price: 900, discount_percentage: 7, is_available: true }], created_at: '', updated_at: '' },
];

async function getHomepageData() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${base}/homepage/?limit_merchants=12&limit_featured_offers=8&limit_exclusive_offers=6&limit_products=8`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('API not available');
    const json = await res.json();
    return json.data || { featured_merchants: mockMerchants, featured_offers: mockOffers, exclusive_offers: mockOffers.filter(o => o.is_exclusive), featured_products: mockProducts };
  } catch {
    return { featured_merchants: mockMerchants, featured_offers: mockOffers, exclusive_offers: mockOffers.filter(o => o.is_exclusive), featured_products: mockProducts };
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
        {featured_merchants.length ? <MerchantGrid merchants={featured_merchants} /> : <p className="text-center text-muted-foreground">No featured stores available</p>}
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
        {featured_offers.length ? <OfferGrid offers={featured_offers} /> : <p className="text-center text-muted-foreground">No featured offers available</p>}
      </section>

      <section className="container">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold sm:text-3xl">Featured Gift Cards</h2><p className="mt-1 text-muted-foreground">Top discounted gift cards right now</p></div></div>
        {featured_products.length ? <ProductGrid products={featured_products} /> : <p className="text-center text-muted-foreground">No featured gift cards available</p>}
      </section>
    </div>
  );
}
