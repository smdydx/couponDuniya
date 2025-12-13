"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionList } from "@/components/wallet/TransactionList";
import { WithdrawForm } from "@/components/wallet/WithdrawForm";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import { AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import type { WalletTransaction, WithdrawalRequest } from "@/types";

export default function WalletPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("balance");
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    balance: 0,
    pendingCashback: 0,
    lifetimeEarnings: 0,
    totalWithdrawn: 0
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    fetchWalletData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "balance") {
      fetchTransactions();
    } else if (activeTab === "withdrawals") {
      fetchWithdrawals();
    }
  }, [activeTab]);

  const fetchWalletData = async () => {
    try {
      const response = await apiClient.get('/wallet/');
      if (response.data.success) {
        setWalletData({
          balance: response.data.data.balance || 0,
          pendingCashback: response.data.data.pending_cashback || 0,
          lifetimeEarnings: response.data.data.lifetime_earnings || 0,
          totalWithdrawn: response.data.data.total_withdrawn || 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiClient.get('/wallet/transactions');
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await apiClient.get('/wallet/withdrawals');
      if (response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    }
  };

  const handleWithdraw = async (
    amount: number,
    method: string,
    details: Record<string, string>
  ) => {
    try {
      const payload: any = {
        amount,
        method,
      };
      
      if (method === "upi") {
        payload.upi_id = details.upi_id;
      } else if (method === "bank_transfer") {
        payload.bank_account_number = details.account_number;
        payload.bank_ifsc = details.ifsc_code;
        payload.bank_account_name = details.account_name;
      }

      const response = await apiClient.post('/wallet/withdraw', payload);
      if (response.data.success) {
        toast.success(response.data.message || "Withdrawal request submitted successfully");
        setIsWithdrawOpen(false);
        fetchWalletData();
        fetchWithdrawals();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit withdrawal request");
    }
  };

  if (loading) {
    return (
      <div className="container py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

      <WalletBalance
        balance={walletData.balance}
        pendingCashback={walletData.pendingCashback}
        lifetimeEarnings={walletData.lifetimeEarnings}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="balance">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Your wallet transactions will appear here</p>
              </div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
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
                        {withdrawal.method?.toUpperCase() || withdrawal.withdrawal_method?.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        withdrawal.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : withdrawal.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : withdrawal.status === "rejected"
                          ? "bg-red-100 text-red-800"
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

      <WithdrawForm
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={walletData.balance}
        onSubmit={handleWithdraw}
      />
    </div>
  );
}
