"use client";

import { useEffect, useState } from "react";
import { walletAPI } from "@/lib/api/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Withdrawal = {
  id: number;
  amount: number;
  method: string;
  status: string;
  user_id: number;
  created_at?: string;
  admin_notes?: string;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await walletAPI.getAllWithdrawals(statusFilter);
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error("Failed to load withdrawals", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await walletAPI.approveWithdrawal(id, notes[id]);
      } else {
        await walletAPI.rejectWithdrawal(id, notes[id]);
      }
      await loadData();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Withdrawals</h1>
          <p className="text-muted-foreground">Approve or reject user withdrawal requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Request #{w.id}</CardTitle>
                <Badge
                  variant={
                    w.status === "approved"
                      ? "success"
                      : w.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {w.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">₹{w.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Method</p>
                    <p className="font-semibold capitalize">{w.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-semibold">#{w.user_id}</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Admin Notes</label>
                  <Textarea
                    placeholder="Add notes or UTR/transaction id..."
                    value={notes[w.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [w.id]: e.target.value })}
                  />
                </div>

                {w.status === "pending" && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleAction(w.id, "approve")}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(w.id, "reject")}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {withdrawals.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No withdrawals found.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
