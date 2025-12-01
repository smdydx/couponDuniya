"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, CreditCard, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { CartItem } from "@/components/cart/CartItem";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface CheckoutForm {
  delivery_email: string;
  delivery_mobile: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, promoDiscount, walletAmountToUse, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - promoDiscount - walletAmountToUse);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      delivery_email: user?.email || "",
      delivery_mobile: user?.mobile || "",
    },
  });

  // Redirect if cart is empty or not authenticated
  if (items.length === 0) {
    router.push(ROUTES.cart);
    return null;
  }

  if (!isAuthenticated) {
    router.push(`${ROUTES.login}?redirect=${ROUTES.checkout}`);
    return null;
  }

  const handlePayment = async (data: CheckoutForm) => {
    setIsProcessing(true);

    try {
      // Mock order creation and payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear cart and redirect to success page
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      clearCart();
      router.push(ROUTES.orderSuccess(orderNumber));
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Cart", href: ROUTES.cart },
          { label: "Checkout" },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(handlePayment)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Form & Items */}
          <div className="space-y-6 lg:col-span-2">
            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gift card codes will be sent to this email address.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_email">Email Address *</Label>
                    <Input
                      id="delivery_email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("delivery_email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email address",
                        },
                      })}
                      error={!!errors.delivery_email}
                    />
                    {errors.delivery_email && (
                      <p className="text-xs text-destructive">
                        {errors.delivery_email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_mobile">Mobile Number (Optional)</Label>
                    <Input
                      id="delivery_mobile"
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...register("delivery_mobile")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {items.map((item) => (
                    <CartItem key={item.variantId} item={item} compact />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pay with Razorpay</p>
                      <p className="text-sm text-muted-foreground">
                        Credit/Debit Card, UPI, Net Banking, Wallets
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  Your payment is secured with 256-bit encryption
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo Discount</span>
                    <span>-{formatCurrency(promoDiscount)}</span>
                  </div>
                )}

                {walletAmountToUse > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </span>
                    <span>-{formatCurrency(walletAmountToUse)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatCurrency(total)}`
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By placing this order, you agree to our{" "}
                  <a href={ROUTES.terms} className="text-primary hover:underline">
                    Terms of Service
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
