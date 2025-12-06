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
  is_active: true,
  variants: [
    { id: 1, product_id: 1, denomination: 100, selling_price: 95, cost_price: 92, discount_percentage: 5, is_available: true },
    { id: 2, product_id: 1, denomination: 250, selling_price: 237, cost_price: 230, discount_percentage: 5, is_available: true },
    { id: 3, product_id: 1, denomination: 500, selling_price: 475, cost_price: 460, discount_percentage: 5, is_available: true },
    { id: 4, product_id: 1, denomination: 1000, selling_price: 950, cost_price: 920, discount_percentage: 5, is_available: true },
    { id: 5, product_id: 1, denomination: 2000, selling_price: 1900, cost_price: 1840, discount_percentage: 5, is_available: true },
    { id: 6, product_id: 1, denomination: 5000, selling_price: 4750, cost_price: 4600, discount_percentage: 5, is_available: true },
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
    is_active: true,
    variants: [
      { id: 5, product_id: 2, denomination: 500, selling_price: 480, cost_price: 465, discount_percentage: 4, is_available: true },
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
    is_active: true,
    variants: [
      { id: 12, product_id: 5, denomination: 500, selling_price: 470, cost_price: 455, discount_percentage: 6, is_available: true },
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
      denomination: selectedVariant.denomination,
      sellingPrice: selectedVariant.selling_price,
      quantity,
      imageUrl: product.image_url,
    });

    toast.success(
      "Added to cart",
      `${product.name} - ${formatCurrency(selectedVariant.denomination)} x ${quantity}`
    );
  };

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Gift Cards", href: ROUTES.products },
          { label: product.name },
        ]}
      />

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative">
          <div className="sticky top-24">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-white shadow-sm">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl sm:text-6xl font-bold text-primary/20">
                  {product.name.charAt(0)}
                </div>
              )}
              {product.is_bestseller && (
                <Badge className="absolute left-3 top-3 gap-1 shadow-sm" variant="warning">
                  <Star className="h-3 w-3" />
                  Bestseller
                </Badge>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-4 flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-600" />
                100% Genuine
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-blue-600" />
                Instant Delivery
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <div>
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
            />
          </div>

          {/* Product Details Tabs */}
          <div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="how-to-redeem">
                <AccordionTrigger className="text-sm sm:text-base">How to Redeem</AccordionTrigger>
                <AccordionContent>
                  <div className="whitespace-pre-line text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
                    {product.how_to_redeem || "Instructions will be provided with the gift card."}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="terms">
                <AccordionTrigger className="text-sm sm:text-base">Terms & Conditions</AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
                    {product.terms_conditions || "Standard gift card terms apply."}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="validity">
                <AccordionTrigger className="text-sm sm:text-base">Validity</AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2">
                    {product.validity_info || "Please check the gift card for validity details."}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">You May Also Like</h2>
          <Link
            href={ROUTES.products}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
