"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "./CartItem";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export function CartDrawer() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { isCartDrawerOpen, setCartDrawerOpen } = useUIStore();

  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    router.push(ROUTES.checkout);
  };

  if (!isCartDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setCartDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Your Cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {itemCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCartDrawerOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse our gift cards and add some to your cart.
            </p>
            <Button className="mt-4" onClick={() => setCartDrawerOpen(false)} asChild>
              <Link href={ROUTES.products}>Shop Gift Cards</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              {/* Clear Cart */}
              <div className="mb-4 flex justify-end">
                <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>

              {/* Subtotal */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCartDrawerOpen(false)}
                  asChild
                >
                  <Link href={ROUTES.cart}>View Cart</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
