"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";

export default function CartPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Mock wallet balance - replace with actual data
  const walletBalance = 500;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push(`${ROUTES.login}?redirect=${ROUTES.checkout}`);
      return;
    }
    router.push(ROUTES.checkout);
  };

  if (items.length === 0) {
    return (
      <div className="container py-6">
        <Breadcrumbs items={[{ label: "Cart" }]} />

        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our gift cards and add some to your cart.
          </p>
          <Link href={ROUTES.products}>
            <Button className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Cart" }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <Button variant="ghost" className="text-destructive" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="divide-y rounded-lg border bg-card">
            {items.map((item) => (
              <div key={item.variantId} className="p-4">
                <CartItem item={item} />
              </div>
            ))}
          </div>

          <Link
            href={ROUTES.products}
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            walletBalance={isAuthenticated ? walletBalance : 0}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
