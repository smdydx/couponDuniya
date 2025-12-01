"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryNav } from "@/components/common/CategoryNav";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Pagination } from "@/components/common/Pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { Product } from "@/types";

// Mock data with local images from /public/images/
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Amazon Pay Gift Card",
    slug: "amazon-pay-gift-card",
    sku: "AMZN-GC-001",
    description: "Amazon Pay Gift Card for shopping on Amazon.in",
    image_url: "/images/gift-cards/1.png",
    is_bestseller: true,
    is_active: true,
    merchant: { id: 1, name: "Amazon", slug: "amazon", logo_url: "/images/merchants/merchant-1.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 5, is_featured: true, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 1, product_id: 1, denomination: 100, selling_price: 95, cost_price: 92, discount_percentage: 5, is_available: true },
      { id: 2, product_id: 1, denomination: 250, selling_price: 237, cost_price: 230, discount_percentage: 5, is_available: true },
      { id: 3, product_id: 1, denomination: 500, selling_price: 475, cost_price: 460, discount_percentage: 5, is_available: true },
      { id: 4, product_id: 1, denomination: 1000, selling_price: 950, cost_price: 920, discount_percentage: 5, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Flipkart Gift Card",
    slug: "flipkart-gift-card",
    sku: "FK-GC-001",
    description: "Flipkart Gift Card for shopping on Flipkart",
    image_url: "/images/gift-cards/2.png",
    is_bestseller: true,
    is_active: true,
    merchant: { id: 2, name: "Flipkart", slug: "flipkart", logo_url: "/images/merchants/merchant-2.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 4, is_featured: true, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 5, product_id: 2, denomination: 100, selling_price: 96, cost_price: 93, discount_percentage: 4, is_available: true },
      { id: 6, product_id: 2, denomination: 500, selling_price: 480, cost_price: 465, discount_percentage: 4, is_available: true },
      { id: 7, product_id: 2, denomination: 1000, selling_price: 960, cost_price: 930, discount_percentage: 4, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Myntra Gift Voucher",
    slug: "myntra-gift-voucher",
    sku: "MYN-GC-001",
    description: "Myntra Gift Voucher for fashion shopping",
    image_url: "/images/gift-cards/3.png",
    is_bestseller: true,
    is_active: true,
    merchant: { id: 3, name: "Myntra", slug: "myntra", logo_url: "/images/merchants/merchant-3.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 5, is_featured: true, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 8, product_id: 3, denomination: 500, selling_price: 475, cost_price: 460, discount_percentage: 5, is_available: true },
      { id: 9, product_id: 3, denomination: 1000, selling_price: 950, cost_price: 920, discount_percentage: 5, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Swiggy Money",
    slug: "swiggy-money",
    sku: "SWG-GC-001",
    description: "Swiggy Money for food delivery",
    image_url: "/images/gift-cards/14.png",
    is_bestseller: false,
    is_active: true,
    merchant: { id: 4, name: "Swiggy", slug: "swiggy", logo_url: "/images/merchants/merchant-4.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 5, is_featured: false, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 10, product_id: 4, denomination: 250, selling_price: 237, cost_price: 230, discount_percentage: 5, is_available: true },
      { id: 11, product_id: 4, denomination: 500, selling_price: 475, cost_price: 460, discount_percentage: 5, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Zomato Gift Voucher",
    slug: "zomato-gift-voucher",
    sku: "ZMT-GC-001",
    description: "Zomato Gift Voucher for food delivery",
    image_url: "/images/gift-cards/16.png",
    is_bestseller: false,
    is_active: true,
    merchant: { id: 5, name: "Zomato", slug: "zomato", logo_url: "/images/merchants/merchant-6.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 4, is_featured: false, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 12, product_id: 5, denomination: 250, selling_price: 240, cost_price: 233, discount_percentage: 4, is_available: true },
      { id: 13, product_id: 5, denomination: 500, selling_price: 480, cost_price: 465, discount_percentage: 4, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "BookMyShow Voucher",
    slug: "bookmyshow-voucher",
    sku: "BMS-GC-001",
    description: "BookMyShow Voucher for movie and event bookings",
    image_url: "/images/gift-cards/18.png",
    is_bestseller: false,
    is_active: true,
    merchant: { id: 6, name: "BookMyShow", slug: "bookmyshow", logo_url: "/images/merchants/merchant-7.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 6, is_featured: false, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 14, product_id: 6, denomination: 200, selling_price: 188, cost_price: 180, discount_percentage: 6, is_available: true },
      { id: 15, product_id: 6, denomination: 500, selling_price: 470, cost_price: 450, discount_percentage: 6, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: "MakeMyTrip Gift Card",
    slug: "makemytrip-gift-card",
    sku: "MMT-GC-001",
    description: "MakeMyTrip Gift Card for travel booking",
    image_url: "/images/gift-cards/20.png",
    is_bestseller: false,
    is_active: true,
    merchant: { id: 7, name: "MakeMyTrip", slug: "makemytrip", logo_url: "/images/merchants/merchant-8.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 7, is_featured: false, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 16, product_id: 7, denomination: 1000, selling_price: 930, cost_price: 900, discount_percentage: 7, is_available: true },
      { id: 17, product_id: 7, denomination: 2000, selling_price: 1860, cost_price: 1800, discount_percentage: 7, is_available: true },
      { id: 18, product_id: 7, denomination: 5000, selling_price: 4650, cost_price: 4500, discount_percentage: 7, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: "Uber Gift Card",
    slug: "uber-gift-card",
    sku: "UBR-GC-001",
    description: "Uber Gift Card for rides and food delivery",
    image_url: "/images/gift-cards/22.png",
    is_bestseller: false,
    is_active: true,
    merchant: { id: 8, name: "Uber", slug: "uber", logo_url: "/images/merchants/merchant-9.png", website_url: "", affiliate_url: "", default_cashback_type: "percentage", default_cashback_value: 5, is_featured: false, is_active: true, created_at: "", updated_at: "" },
    variants: [
      { id: 19, product_id: 8, denomination: 250, selling_price: 237, cost_price: 225, discount_percentage: 5, is_available: true },
      { id: 20, product_id: 8, denomination: 500, selling_price: 475, cost_price: 450, discount_percentage: 5, is_available: true },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Gift Cards" }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gift Cards</h1>
        <p className="mt-1 text-muted-foreground">
          Buy discounted gift cards from your favorite brands
        </p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <CategoryNav basePath={ROUTES.products} />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search gift cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="discount">Highest Discount</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredProducts.length} gift cards
      </div>

      <ProductGrid products={filteredProducts} />

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
