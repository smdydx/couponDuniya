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
}

export function ProductCard({ product }: ProductCardProps) {
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

  return (
    <Card className="elevated-card group relative overflow-hidden">
      {/* Bestseller Badge */}
      {product.is_bestseller && (
        <Badge className="absolute right-2 top-2 z-10 gap-1" variant="warning">
          <Star className="h-3 w-3" />
          Bestseller
        </Badge>
      )}

      <CardHeader className="p-0">
        <Link href={ROUTES.productDetail(product.slug)}>
          <div className="relative aspect-[4/3] overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-4">
        <Link href={ROUTES.productDetail(product.slug)}>
          <h3 className="font-semibold line-clamp-2 transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>
        {product.merchant && (
          <p className="mt-1 text-sm text-muted-foreground">{product.merchant.name}</p>
        )}

        {/* Variant Selection */}
        {product.variants.length > 1 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Select Amount</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.slice(0, 4).map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVariant(variant)}
                  disabled={!variant.is_available}
                  className="h-8 px-3 text-xs"
                >
                  {formatCurrency(variant.denomination)}
                </Button>
              ))}
              {product.variants.length > 4 && (
                <Link
                  href={ROUTES.productDetail(product.slug)}
                  className="flex h-8 items-center px-2 text-xs text-primary hover:underline"
                >
                  +{product.variants.length - 4} more
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4">
        <div>
          {selectedVariant && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {formatCurrency(selectedVariant.selling_price)}
                </span>
                {discount > 0 && (
                  <Badge variant="success" className="text-xs">
                    {discount}% off
                  </Badge>
                )}
              </div>
              {discount > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(selectedVariant.denomination)}
                </span>
              )}
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={!selectedVariant?.is_available}
          className="gap-1"
        >
          <ShoppingCart className="h-4 w-4" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}
