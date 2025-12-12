"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionList } from "@/components/wallet/TransactionList";
import { CashbackTracker } from "@/components/wallet/CashbackTracker";
import { WithdrawForm } from "@/components/wallet/WithdrawForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import { AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import apiClient from "@/lib/api/client";
import type { WalletTransaction, CashbackEvent, WithdrawalRequest } from "@/types";

export default function WalletPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("balance");
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    balance: 0,
    pending_cashback: 0,
    lifetime_earnings: 0,
    total_withdrawn: 0,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [cashbackEvents, setCashbackEvents] = useState<CashbackEvent[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          apiClient.get('/wallet/'),
          apiClient.get('/wallet/transactions?limit=50'),
          apiClient.get('/wallet/withdrawals?limit=20'),
        ]);

        if (results[0].status === 'fulfilled') {
          const wallet = results[0].value.data?.data || results[0].value.data || {};
          setWalletData({
            balance: wallet.balance || 0,
            pending_cashback: wallet.pending_cashback || 0,
            lifetime_earnings: wallet.lifetime_earnings || 0,
            total_withdrawn: wallet.total_withdrawn || 0,
          });
        }

        if (results[1].status === 'fulfilled') {
          const txData = results[1].value.data?.data || results[1].value.data || {};
          setTransactions(txData.transactions || []);
        }

        if (results[2].status === 'fulfilled') {
          const wdData = results[2].value.data?.data || results[2].value.data || {};
          setWithdrawals(wdData.withdrawals || []);
        }
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleWithdraw = async (
    amount: number,
    method: string,
    details: Record<string, string>
  ) => {
    try {
      await apiClient.post('/wallet/withdraw', {
        amount,
        method,
        account_details: details,
      });
      setIsWithdrawOpen(false);
      const walletRes = await apiClient.get('/wallet/');
      const wallet = walletRes.data?.data || walletRes.data || {};
      setWalletData({
        balance: wallet.balance || 0,
        pending_cashback: wallet.pending_cashback || 0,
        lifetime_earnings: wallet.lifetime_earnings || 0,
        total_withdrawn: wallet.total_withdrawn || 0,
      });
    } catch (err) {
      console.error("Withdrawal failed:", err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="container py-6">
        <Breadcrumbs items={[{ label: "Wallet" }]} />
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Wallet" }]} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">
            Track your earnings and manage withdrawals
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          How it works
        </Button>
      </div>

      {/* Wallet Balance Cards */}
      <WalletBalance
        balance={walletData.balance}
        pendingCashback={walletData.pending_cashback}
        lifetimeEarnings={walletData.lifetime_earnings}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />

      {/* Tabs */}
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="balance">Transactions</TabsTrigger>
            <TabsTrigger value="cashback">Cashback Tracker</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            <TransactionList transactions={transactions} />
          </TabsContent>

          <TabsContent value="cashback">
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">About Cashback Confirmation</p>
                  <p className="mt-1">
                    Cashback is typically confirmed within 30-90 days after your purchase.
                    Some merchants may take longer. Once confirmed, cashback is added to
                    your wallet automatically.
                  </p>
                </div>
              </div>
            </div>
            <CashbackTracker events={cashbackEvents} />
          </TabsContent>

          <TabsContent value="withdrawals">
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No withdrawal history yet</p>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        ₹{withdrawal.amount} via{" "}
                        {withdrawal.withdrawal_method.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        withdrawal.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : withdrawal.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdraw Modal */}
      <WithdrawForm
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={walletData.balance}
        onSubmit={handleWithdraw}
      />
    </div>
  );
}
