"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, ProductVariant } from "@/types";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { toast } from "@/store/uiStore";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || null
  );
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
      quantity: 1,
      imageUrl: product.image_url,
      merchantName: product.merchant?.name,
    });

    toast.success("Added to cart", `${product.name} - ${formatCurrency(selectedVariant.denomination)}`);
  };

  const discount = selectedVariant
    ? calculateDiscount(selectedVariant.denomination, selectedVariant.selling_price)
    : 0;

  // Determine min and max prices for display, considering variants
  const variantPrices = product.variants.map(v => ({
    sellingPrice: v.selling_price,
    denomination: v.denomination,
    isAvailable: v.is_available
  })).filter(v => v.isAvailable); // Filter out unavailable variants

  const minSellingPrice = variantPrices.length > 0 ? Math.min(...variantPrices.map(v => v.sellingPrice)) : 0;
  const maxSellingPrice = variantPrices.length > 0 ? Math.max(...variantPrices.map(v => v.sellingPrice)) : 0;
  const minDenomination = variantPrices.length > 0 ? Math.min(...variantPrices.map(v => v.denomination)) : 0;
  const maxDenomination = variantPrices.length > 0 ? Math.max(...variantPrices.map(v => v.denomination)) : 0;

  // If no variants are available, use the first variant's prices or default to 0
  const minPrice = variantPrices.length > 0 ? minSellingPrice : (product.variants[0]?.selling_price ?? 0);
  const maxPrice = variantPrices.length > 0 ? maxSellingPrice : (product.variants[0]?.selling_price ?? 0);
  const originalMinPrice = variantPrices.length > 0 ? minDenomination : (product.variants[0]?.denomination ?? 0);
  const originalMaxPrice = variantPrices.length > 0 ? maxDenomination : (product.variants[0]?.denomination ?? 0);


  if (compact) {
    return (
      <Link href={`/products/${product.slug}`}>
        <Card className="group overflow-hidden hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 h-full flex flex-col border border-gray-100 hover:border-purple-300 rounded-xl bg-white">
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden rounded-t-xl">
            <div className="w-full h-full p-2 sm:p-3 flex items-center justify-center">
              <img
                src={product.image_url || '/images/gift-cards/placeholder.png'}
                alt={product.name}
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `
                      <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-inner">
                        <span class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">${product.name.charAt(0)}</span>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            {product.merchant?.logo_url && (
              <div className="absolute top-1.5 left-1.5 bg-white rounded-full p-0.5 shadow-md border border-gray-100">
                <img
                  src={product.merchant.logo_url}
                  alt={product.merchant.name}
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded-full"
                />
              </div>
            )}
          </div>
          <CardContent className="p-2 sm:p-3 flex-1 flex flex-col justify-between border-t border-gray-100">
            <h3 className="font-semibold text-[10px] sm:text-[11px] mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[26px] sm:min-h-[30px] text-gray-800">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-auto">
              <div>
                <p className="text-[11px] sm:text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {formatCurrency(minPrice)}
                </p>
                {minPrice !== maxPrice && (
                  <p className="text-[8px] sm:text-[9px] text-gray-500">
                    - {formatCurrency(maxPrice)}
                  </p>
                )}
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-sm" disabled={!selectedVariant?.is_available}>
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50 border h-[280px] flex flex-col bg-white">
      {/* Bestseller Badge */}
      {product.is_bestseller && (
        <Badge className="absolute right-1 top-1 z-10 gap-0.5 text-[8px] px-1.5 py-0.5" variant="warning">
          <Star className="h-2.5 w-2.5" />
          Bestseller
        </Badge>
      )}

      <CardHeader className="p-0">
        <Link href={ROUTES.productDetail(product.slug)}>
          <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-gray-50 to-white">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-2"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-bold text-muted-foreground">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-2 flex-1 flex flex-col">
        <Link href={ROUTES.productDetail(product.slug)}>
          <h3 className="font-semibold text-xs line-clamp-2 transition-colors group-hover:text-primary leading-tight mb-1">{product.name}</h3>
        </Link>
        {product.merchant && (
          <p className="text-[10px] text-muted-foreground mb-1">{product.merchant.name}</p>
        )}

        {/* Variant Selection */}
        {product.variants.length > 1 && (
          <div className="mt-1">
            <div className="flex flex-wrap gap-0.5">
              {product.variants.slice(0, 2).map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVariant(variant)}
                  disabled={!variant.is_available}
                  className="h-5 px-1.5 text-[9px]"
                >
                  {formatCurrency(variant.denomination)}
                </Button>
              ))}
              {product.variants.length > 2 && (
                <Link
                  href={ROUTES.productDetail(product.slug)}
                  className="flex h-5 items-center px-1 text-[9px] text-primary hover:underline"
                >
                  +{product.variants.length - 2}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-sm font-bold text-primary">{formatCurrency(minPrice)}</span>
          {minPrice !== maxPrice && (
            <span className="text-[10px] text-muted-foreground">- {formatCurrency(maxPrice)}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0 border-t">
        <Button
          className="w-full h-7 text-[10px] font-semibold"
          onClick={handleAddToCart}
          disabled={!selectedVariant?.is_available}
        >
          {selectedVariant?.is_available ? "Get Deal" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}