"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tag, Wallet, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface CartSummaryProps {
  walletBalance?: number;
  onCheckout?: () => void;
  isCheckoutLoading?: boolean;
}

export function CartSummary({
  walletBalance = 0,
  onCheckout,
  isCheckoutLoading = false,
}: CartSummaryProps) {
  const {
    items,
    promoCode,
    promoDiscount,
    useWalletBalance,
    walletAmountToUse,
    setPromoCode,
    setUseWalletBalance,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState(promoCode || "");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const maxWalletUsable = Math.min(walletBalance, subtotal - promoDiscount);
  const total = Math.max(0, subtotal - promoDiscount - walletAmountToUse);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate discount calculation
      const discount = Math.floor(subtotal * 0.1); // 10% discount for demo
      setPromoCode(promoInput, discount);
    } catch (error) {
      setPromoError("Invalid promo code");
      setPromoCode(null, 0);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoInput("");
    setPromoCode(null, 0);
    setPromoError(null);
  };

  const handleWalletToggle = (checked: boolean) => {
    setUseWalletBalance(checked, checked ? maxWalletUsable : 0);
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">Order Summary</h3>

      <div className="mt-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)
          </span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* Promo Code */}
        {promoDiscount > 0 ? (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              Promo: {promoCode}
            </span>
            <div className="flex items-center gap-2">
              <span>-{formatCurrency(promoDiscount)}</span>
              <button
                onClick={handleRemovePromo}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button
                variant="outline"
                onClick={handleApplyPromo}
                disabled={!promoInput.trim() || isApplyingPromo}
              >
                {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          </div>
        )}

        {/* Wallet Balance */}
        {walletBalance > 0 && (
          <div className="rounded-lg bg-green-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Use Wallet ({formatCurrency(walletBalance)})
                </span>
              </div>
              <Switch checked={useWalletBalance} onCheckedChange={handleWalletToggle} />
            </div>
            {useWalletBalance && (
              <p className="mt-1 text-xs text-green-600">
                Using {formatCurrency(walletAmountToUse)} from wallet
              </p>
            )}
          </div>
        )}

        {/* Wallet Deduction */}
        {walletAmountToUse > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Wallet</span>
            <span>-{formatCurrency(walletAmountToUse)}</span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Savings */}
        {(promoDiscount > 0 || walletAmountToUse > 0) && (
          <p className="text-sm text-green-600">
            You&apos;re saving {formatCurrency(promoDiscount + walletAmountToUse)} on this order!
          </p>
        )}
      </div>

      {/* Checkout Button */}
      {onCheckout && (
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0 || isCheckoutLoading}
        >
          {isCheckoutLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Proceed to Checkout ${total > 0 ? `(${formatCurrency(total)})` : "(Free)"}`
          )}
        </Button>
      )}
    </div>
  );
}
