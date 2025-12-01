"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, CheckCircle } from "lucide-react";
import type { ProductVariant } from "@/types";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  maxQuantity?: number;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  quantity,
  onQuantityChange,
  onAddToCart,
  maxQuantity = 10,
}: VariantSelectorProps) {
  return (
    <div className="space-y-5">
      {/* Price Display */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-primary">
            {formatCurrency(selectedVariant.selling_price)}
          </span>
          <span className="text-base sm:text-lg text-muted-foreground line-through">
            {formatCurrency(selectedVariant.denomination)}
          </span>
          <Badge variant="success" className="ml-auto">
            {selectedVariant.discount_percentage}% OFF
          </Badge>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Face value: {formatCurrency(selectedVariant.denomination)}
        </p>
      </div>

      {/* Denomination Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium">
          Select Denomination
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
          {variants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const isAvailable = variant.is_available;

            return (
              <button
                key={variant.id}
                onClick={() => isAvailable && onVariantChange(variant)}
                disabled={!isAvailable}
                className={cn(
                  "relative rounded-lg border-2 p-3 sm:p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  !isAvailable && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="text-base sm:text-lg font-bold">
                  {formatCurrency(variant.denomination)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Pay {formatCurrency(variant.selling_price)}
                </div>
                {isSelected && (
                  <CheckCircle className="absolute right-2 top-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                )}
                {!isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                    <span className="text-xs font-medium">Out of Stock</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity Selector */}
      <div>
        <label className="mb-3 block text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min="1"
            max={maxQuantity}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              onQuantityChange(Math.min(Math.max(1, val), maxQuantity));
            }}
            className="w-16 sm:w-20 text-center h-9 sm:h-10"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => onQuantityChange(Math.min(quantity + 1, maxQuantity))}
            disabled={quantity >= maxQuantity}
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground">(Max {maxQuantity})</span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={onAddToCart}
        disabled={!selectedVariant?.is_available}
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        Add to Cart
      </Button>

      {/* Total Amount */}
      {selectedVariant && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">Total Amount:</span>
            <span className="text-lg sm:text-xl font-bold">
              {formatCurrency(selectedVariant.selling_price * quantity)}
            </span>
          </div>
          {calculateDiscount(
            selectedVariant.denomination * quantity,
            selectedVariant.selling_price * quantity
          ) > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">You Save:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(
                  selectedVariant.denomination * quantity -
                    selectedVariant.selling_price * quantity
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}