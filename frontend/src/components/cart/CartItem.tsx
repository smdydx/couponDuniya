"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

export function CartItem({ item, compact = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <Link
        href={ROUTES.productDetail(item.productSlug)}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
            {item.productName.charAt(0)}
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={ROUTES.productDetail(item.productSlug)}
            className="font-medium hover:text-primary line-clamp-1"
          >
            {item.productName}
          </Link>
          <p className="text-sm text-muted-foreground">
            Denomination: {formatCurrency(item.denomination)}
          </p>
          {item.merchantName && (
            <p className="text-xs text-muted-foreground">{item.merchantName}</p>
          )}
        </div>

        {!compact && (
          <div className="flex items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeItem(item.variantId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(item.sellingPrice * item.quantity)}</p>
        {item.quantity > 1 && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.sellingPrice)} each
          </p>
        )}
      </div>
    </div>
  );
}
