"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Shield, Truck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { ROUTES } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/uiStore";
import { formatCurrency } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

// Mock data
const mockProduct: Product = {
  id: 1,
  name: "Amazon Pay Gift Card",
  slug: "amazon-pay-gift-card",
  sku: "AMZN-GC-001",
  description: "Amazon Pay Gift Card can be used to shop for millions of products on Amazon.in. The gift card balance does not expire and can be combined with other payment methods.",
  terms_conditions: "This Gift Card is redeemable on Amazon.in for purchase of eligible products. Gift Cards cannot be used to purchase other gift cards. Gift Cards cannot be reloaded, resold, or redeemed for cash. Amazon reserves the right to close customer accounts and request alternative forms of payment if a fraudulently obtained gift card is redeemed.",
  how_to_redeem: "1. Visit Amazon.in and add items to cart\n2. During checkout, select 'Add a gift card'\n3. Enter your gift card code and PIN\n4. Your balance will be applied to eligible items",
  validity_info: "This gift card does not expire. Balance can be used for multiple purchases until exhausted.",
  is_bestseller: true,
  is_featured: false,
  is_active: true,
  variants: [
    { id: 1, product_id: 1, denomination: 100, selling_price: 95, cost_price: 92, discount_percentage: 5, is_available: true, sku: "VAR-001", name: "₹100", price: 100, stock: 100 },
    { id: 2, product_id: 1, denomination: 250, selling_price: 237, cost_price: 230, discount_percentage: 5, is_available: true, sku: "VAR-002", name: "₹250", price: 250, stock: 100 },
    { id: 3, product_id: 1, denomination: 500, selling_price: 475, cost_price: 460, discount_percentage: 5, is_available: true, sku: "VAR-003", name: "₹500", price: 500, stock: 100 },
    { id: 4, product_id: 1, denomination: 1000, selling_price: 950, cost_price: 920, discount_percentage: 5, is_available: true, sku: "VAR-004", name: "₹1000", price: 1000, stock: 100 },
    { id: 5, product_id: 1, denomination: 2000, selling_price: 1900, cost_price: 1840, discount_percentage: 5, is_available: true, sku: "VAR-005", name: "₹2000", price: 2000, stock: 100 },
    { id: 6, product_id: 1, denomination: 5000, selling_price: 4750, cost_price: 4600, discount_percentage: 5, is_available: true, sku: "VAR-006", name: "₹5000", price: 5000, stock: 100 },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const relatedProducts: Product[] = [
  {
    id: 2,
    name: "Flipkart Gift Card",
    slug: "flipkart-gift-card",
    sku: "FK-GC-001",
    is_bestseller: true,
    is_featured: false,
    is_active: true,
    variants: [
      { id: 5, product_id: 2, denomination: 500, selling_price: 480, cost_price: 465, discount_percentage: 4, is_available: true, sku: "FK-VAR-001", name: "₹500", price: 500, stock: 50 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Myntra Gift Card",
    slug: "myntra-gift-card",
    sku: "MYN-GC-001",
    is_bestseller: false,
    is_featured: false,
    is_active: true,
    variants: [
      { id: 12, product_id: 5, denomination: 500, selling_price: 470, cost_price: 455, discount_percentage: 6, is_available: true, sku: "MYN-VAR-001", name: "₹500", price: 500, stock: 50 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = mockProduct; // Replace with API call
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      denomination: selectedVariant.denomination ?? 0,
      sellingPrice: selectedVariant.selling_price ?? 0,
      quantity,
      imageUrl: product.image_url,
    });

    toast.success(
      "Added to cart",
      `${product.name} - ${formatCurrency(selectedVariant.denomination ?? 0)} x ${quantity}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="container py-6">
        <Breadcrumbs
          items={[
            { label: "Gift Cards", href: ROUTES.products },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          {/* Left Column: Image & Highlights - Span 5 */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Main Image Card */}
              <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
                <div className="relative aspect-square w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden">
                  {/* Decorative circle background */}
                  <div className="absolute inset-0 bg-radial-gradient from-purple-50/50 to-transparent opacity-50" />

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="relative w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-gray-200">
                      {product.name.charAt(0)}
                    </div>
                  )}

                  {product.is_bestseller && (
                    <Badge className="absolute left-4 top-4 gap-1.5 shadow-md px-3 py-1 bg-yellow-400 text-yellow-950 hover:bg-yellow-500 border-0" variant="secondary">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Bestseller
                    </Badge>
                  )}
                </div>
              </div>

              {/* Trust Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 border border-gray-100 shadow-sm text-sm font-medium text-gray-700">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">100% Genuine</p>
                    <p className="text-xs text-muted-foreground">Brand Verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 border border-gray-100 shadow-sm text-sm font-medium text-gray-700">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Instant Delivery</p>
                    <p className="text-xs text-muted-foreground">Via Email/SMS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions - Span 7 */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{product.name}</h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {product.description}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
              />
            </div>

            {/* Informational Accordion */}
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="how-to-redeem" className="border-b px-6">
                  <AccordionTrigger className="text-base font-semibold py-4 hover:no-underline hover:text-purple-600">
                    How to Redeem
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="whitespace-pre-line text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {product.how_to_redeem || "Instructions will be provided with the gift card."}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="terms" className="border-b px-6">
                  <AccordionTrigger className="text-base font-semibold py-4 hover:no-underline hover:text-purple-600">
                    Terms & Conditions
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {product.terms_conditions || "Standard gift card terms apply."}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="validity" className="px-6 border-b-0">
                  <AccordionTrigger className="text-base font-semibold py-4 hover:no-underline hover:text-purple-600">
                    Validity
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {product.validity_info || "Please check the gift card for validity details."}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <section className="mt-16 border-t pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <p className="text-sm text-muted-foreground mt-1">Similar gift cards you might be interested in</p>
            </div>
            <Link
              href={ROUTES.products}
              className="group flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700"
            >
              View All
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
