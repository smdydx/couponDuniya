"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionList } from "@/components/wallet/TransactionList";
import { CashbackTracker } from "@/components/wallet/CashbackTracker";
import { WithdrawForm } from "@/components/wallet/WithdrawForm";
import { AlertCircle, HelpCircle } from "lucide-react";
import type { WalletTransaction, CashbackEvent, WithdrawalRequest } from "@/types";

// Mock data
const mockTransactions: WalletTransaction[] = [
  {
    id: 1,
    wallet_id: 1,
    type: "credit",
    amount: 150,
    balance_after: 650,
    category: "cashback",
    description: "Cashback from Amazon purchase",
    status: "completed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    wallet_id: 1,
    type: "debit",
    amount: 100,
    balance_after: 500,
    category: "order_payment",
    description: "Used for order ORD-ABC123",
    status: "completed",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3,
    wallet_id: 1,
    type: "credit",
    amount: 50,
    balance_after: 600,
    category: "referral",
    description: "Referral bonus - John Doe signed up",
    status: "completed",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

const mockCashbackEvents: CashbackEvent[] = [
  {
    id: 1,
    user_id: 1,
    offer_id: 1,
    merchant_id: 1,
    merchant: {
      id: 1,
      name: "Amazon",
      slug: "amazon",
      website_url: "",
      affiliate_url: "",
      default_cashback_type: "percentage",
      default_cashback_value: 10,
      is_featured: true,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    click_id: "clk_123",
    order_amount: 1500,
    cashback_amount: 150,
    status: "pending",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    offer_id: 2,
    merchant_id: 2,
    merchant: {
      id: 2,
      name: "Flipkart",
      slug: "flipkart",
      website_url: "",
      affiliate_url: "",
      default_cashback_type: "percentage",
      default_cashback_value: 8,
      is_featured: true,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    click_id: "clk_124",
    order_amount: 2000,
    cashback_amount: 160,
    status: "confirmed",
    confirmation_date: new Date(Date.now() - 604800000).toISOString(),
    created_at: new Date(Date.now() - 1209600000).toISOString(),
  },
];

const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: 1,
    user_id: 1,
    amount: 500,
    withdrawal_method: "upi",
    account_details: { upi_id: "user@upi" },
    status: "completed",
    processed_at: new Date(Date.now() - 604800000).toISOString(),
    created_at: new Date(Date.now() - 691200000).toISOString(),
  },
];

export default function WalletPage() {
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("balance");

  // Mock wallet data
  const walletBalance = 500;
  const pendingCashback = 310;
  const lifetimeEarnings = 2500;

  const handleWithdraw = async (
    amount: number,
    method: string,
    details: Record<string, string>
  ) => {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Withdrawal request:", { amount, method, details });
    setIsWithdrawOpen(false);
  };

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
        balance={walletBalance}
        pendingCashback={pendingCashback}
        lifetimeEarnings={lifetimeEarnings}
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
            <TransactionList transactions={mockTransactions} />
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
            <CashbackTracker events={mockCashbackEvents} />
          </TabsContent>

          <TabsContent value="withdrawals">
            {mockWithdrawals.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No withdrawal history yet</p>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {mockWithdrawals.map((withdrawal) => (
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
        balance={walletBalance}
        onSubmit={handleWithdraw}
      />
    </div>
  );
}
