"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Smartphone, Building, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { MINIMUM_WITHDRAWAL, WITHDRAWAL_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WithdrawFormProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSubmit: (amount: number, method: string, details: Record<string, string>) => Promise<void>;
}

type WithdrawMethod = "upi" | "bank" | "gift_card";

export function WithdrawForm({ open, onClose, balance, onSubmit }: WithdrawFormProps) {
  const [method, setMethod] = useState<WithdrawMethod>("upi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    amount: number;
    upi_id?: string;
    account_number?: string;
    ifsc_code?: string;
    account_name?: string;
  }>();

  const methodIcons = {
    upi: Smartphone,
    bank: Building,
    gift_card: Gift,
  };

  const handleFormSubmit = async (data: {
    amount: number;
    upi_id?: string;
    account_number?: string;
    ifsc_code?: string;
    account_name?: string;
  }) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const details: Record<string, string> = {};
      if (method === "upi") {
        if (data.upi_id) {
          details.upi_id = data.upi_id;
        }
      } else if (method === "bank") {
        if (data.account_number) details.account_number = data.account_number;
        if (data.ifsc_code) details.ifsc_code = data.ifsc_code;
        if (data.account_name) details.account_name = data.account_name;
      }

      await onSubmit(data.amount, method, details);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit withdrawal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Available balance: <strong>{formatCurrency(balance)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Method Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(WITHDRAWAL_METHODS) as WithdrawMethod[]).map((m) => {
              const Icon = methodIcons[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                    method === m
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{WITHDRAWAL_METHODS[m].label}</span>
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`Min ${formatCurrency(MINIMUM_WITHDRAWAL)}`}
              {...register("amount", {
                required: "Amount is required",
                min: { value: MINIMUM_WITHDRAWAL, message: `Minimum ${formatCurrency(MINIMUM_WITHDRAWAL)}` },
                max: { value: balance, message: "Insufficient balance" },
              })}
              error={!!errors.amount}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* UPI Fields */}
          {method === "upi" && (
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                placeholder="yourname@upi"
                {...register("upi_id", { required: "UPI ID is required" })}
                error={!!errors.upi_id}
              />
              {errors.upi_id && (
                <p className="text-xs text-destructive">{errors.upi_id.message}</p>
              )}
            </div>
          )}

          {/* Bank Fields */}
          {method === "bank" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Holder Name</Label>
                <Input
                  id="account_name"
                  placeholder="As per bank records"
                  {...register("account_name", { required: "Account name is required" })}
                  error={!!errors.account_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="Enter account number"
                  {...register("account_number", { required: "Account number is required" })}
                  error={!!errors.account_number}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  placeholder="e.g., SBIN0001234"
                  {...register("ifsc_code", { required: "IFSC code is required" })}
                  error={!!errors.ifsc_code}
                />
              </div>
            </>
          )}

          {/* Gift Card Info */}
          {method === "gift_card" && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p>You&apos;ll receive a gift card code via email within 24 hours.</p>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
