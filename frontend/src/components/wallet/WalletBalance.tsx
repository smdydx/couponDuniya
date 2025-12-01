"use client";

import { Wallet, TrendingUp, Clock, ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface WalletBalanceProps {
  balance: number;
  pendingCashback: number;
  lifetimeEarnings: number;
  onWithdraw?: () => void;
}

export function WalletBalance({
  balance,
  pendingCashback,
  lifetimeEarnings,
  onWithdraw,
}: WalletBalanceProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Available Balance */}
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-green-100">
            <Wallet className="h-5 w-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
          {onWithdraw && balance > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={onWithdraw}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Pending Cashback */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Cashback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-yellow-600">{formatCurrency(pendingCashback)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Usually confirmed within 30-90 days
          </p>
        </CardContent>
      </Card>

      {/* Lifetime Earnings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Lifetime Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-blue-600">{formatCurrency(lifetimeEarnings)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Total earned since signup</p>
        </CardContent>
      </Card>
    </div>
  );
}
