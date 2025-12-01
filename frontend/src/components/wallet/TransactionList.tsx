"use client";

import { ArrowUpRight, ArrowDownLeft, Gift, ShoppingCart, Wallet, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { WalletTransaction } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: WalletTransaction[];
  isLoading?: boolean;
}

const categoryIcons = {
  cashback: Gift,
  referral: Gift,
  order_payment: ShoppingCart,
  withdrawal: Wallet,
  refund: RefreshCw,
  bonus: Gift,
  adjustment: RefreshCw,
};

const categoryLabels = {
  cashback: "Cashback",
  referral: "Referral Bonus",
  order_payment: "Order Payment",
  withdrawal: "Withdrawal",
  refund: "Refund",
  bonus: "Bonus",
  adjustment: "Adjustment",
};

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Wallet className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-4">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {transactions.map((transaction) => {
        const Icon = categoryIcons[transaction.category] || Gift;
        const isCredit = transaction.type === "credit";

        return (
          <div key={transaction.id} className="flex items-center gap-4 p-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isCredit ? "bg-green-100" : "bg-red-100"
              )}
            >
              {isCredit ? (
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{transaction.description}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[transaction.category]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(transaction.created_at)}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p
                className={cn(
                  "font-semibold",
                  isCredit ? "text-green-600" : "text-red-600"
                )}
              >
                {isCredit ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Bal: {formatCurrency(transaction.balance_after)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
