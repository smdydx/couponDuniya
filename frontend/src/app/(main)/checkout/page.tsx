
"use client";

import { useState, useEffect } from "react";
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
import { checkout, verifyPayment } from "@/lib/api/cart";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Declare Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutForm {
  delivery_email: string;
  delivery_mobile: string;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, promoCode, promoDiscount, walletAmountToUse, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push(ROUTES.cart);
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  const handlePayment = async (data: CheckoutForm) => {
    if (!scriptLoaded) {
      toast.error("Payment gateway is loading. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      const checkoutData = await checkout({
        items: items.map(item => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity
        })),
        promo_code: promoCode || undefined,
        wallet_amount: walletAmountToUse,
        email: data.delivery_email,
        mobile: data.delivery_mobile,
      });

      if (!checkoutData.success) {
        toast.error("Failed to create order");
        return;
      }

      const { order_id, payment_details, payment_required } = checkoutData;

      // If no payment required (fully paid by wallet)
      if (payment_required === 0 || !payment_details) {
        toast.success("Order placed successfully!");
        clearCart();
        router.push(ROUTES.orderSuccess(checkoutData.order_number));
        return;
      }

      // Open Razorpay payment modal
      const options = {
        key: payment_details.key,
        amount: payment_details.amount,
        currency: payment_details.currency,
        order_id: payment_details.order_id,
        name: "CouponAli",
        description: "Gift Card Purchase",
        image: "/images/logos/icon.png",
        prefill: {
          email: data.delivery_email,
          contact: data.delivery_mobile,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyData = await verifyPayment({
              order_id: order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyData.success) {
              toast.success("Payment successful!");
              clearCart();
              router.push(ROUTES.orderSuccess(verifyData.order_number));
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment failed:", error);
      // Extract error message from API response
      const errorMessage = error?.response?.data?.detail || 
                          error?.message || 
                          "Failed to initiate payment";
      toast.error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
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
                  disabled={isProcessing || !scriptLoaded}
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

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
