"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import adminApi, { Withdrawal, Pagination } from "@/lib/api/admin";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getWithdrawals({
        page,
        limit: 20,
        status: statusFilter,
      });
      setWithdrawals(data.withdrawals || []);
      setPagination(data.pagination);

      const pending = (data.withdrawals || []).filter(w => w.status === 'pending');
      setPendingCount(pending.length);
      setPendingAmount(pending.reduce((sum, w) => sum + w.amount, 0));
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleOpenAction = (withdrawal: Withdrawal, type: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNotes("");
    setTransactionId("");
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedWithdrawal) return;

    setProcessingId(selectedWithdrawal.id);
    try {
      if (actionType === "approve") {
        await adminApi.approveWithdrawal(selectedWithdrawal.id, {
          transaction_id: transactionId || undefined,
          admin_notes: adminNotes || undefined,
        });
      } else {
        await adminApi.rejectWithdrawal(selectedWithdrawal.id, {
          admin_notes: adminNotes || undefined,
        });
      }
      setActionDialogOpen(false);
      fetchWithdrawals();
    } catch (error) {
      console.error("Failed to process withdrawal:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "completed":
        return <Badge variant="info">Completed</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "upi":
        return "UPI";
      case "bank":
        return "Bank Transfer";
      case "gift_card":
        return "Gift Card";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Withdrawals</h1>
          <p className="text-muted-foreground">
            Approve or reject user withdrawal requests
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || 0}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withdrawals.filter(w => w.status === 'approved').length}</p>
              <p className="text-sm text-muted-foreground">Approved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchWithdrawals}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No withdrawals found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} withdrawals` : "No withdrawal requests yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-mono">#{withdrawal.id}</TableCell>
                        <TableCell>User #{withdrawal.user_id}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getMethodLabel(withdrawal.method)}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {withdrawal.created_at ? formatDateTime(withdrawal.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {withdrawal.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenAction(withdrawal, "approve")}
                                disabled={processingId === withdrawal.id}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenAction(withdrawal, "reject")}
                                disabled={processingId === withdrawal.id}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {withdrawal.processed_at
                                ? `Processed ${new Date(withdrawal.processed_at).toLocaleDateString()}`
                                : "No action needed"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && pagination.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pagination.per_page + 1} to{" "}
                    {Math.min(page * pagination.per_page, pagination.total_items)} of{" "}
                    {pagination.total_items} requests
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                      disabled={page === pagination.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Approve Withdrawal
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Withdrawal
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Request ID</span>
                    <p className="font-medium">#{selectedWithdrawal.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID</span>
                    <p className="font-medium">#{selectedWithdrawal.user_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedWithdrawal.amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method</span>
                    <p className="font-medium">{getMethodLabel(selectedWithdrawal.method)}</p>
                  </div>
                </div>
              </div>

              {actionType === "approve" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Transaction ID / UTR</label>
                  <Input
                    placeholder="Enter transaction reference"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder={actionType === "approve" 
                    ? "Add any notes about this approval..." 
                    : "Enter reason for rejection..."}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {actionType === "reject" && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Rejecting this withdrawal will refund {formatCurrency(selectedWithdrawal.amount)} back to the user&apos;s wallet.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={processingId !== null}
            >
              {processingId !== null ? "Processing..." : actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
