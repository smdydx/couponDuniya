"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface Payment {
  id: number;
  order_id: number;
  order_number?: string;
  user_id: number;
  user_email?: string;
  amount: number;
  gateway: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  status: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '20');
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const response = await apiClient.get(`/admin/payments?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      
      if (Array.isArray(data)) {
        setPayments(data);
        setPagination(null);
      } else {
        setPayments(data.payments || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "captured":
      case "success":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Refunded</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGatewayBadge = (gateway: string) => {
    switch (gateway?.toLowerCase()) {
      case "razorpay":
        return <Badge variant="outline" className="bg-blue-50">Razorpay</Badge>;
      case "stripe":
        return <Badge variant="outline" className="bg-purple-50">Stripe</Badge>;
      case "wallet":
        return <Badge variant="outline" className="bg-green-50">Wallet</Badge>;
      default:
        return <Badge variant="outline">{gateway || "Unknown"}</Badge>;
    }
  };

  const totalAmount = payments.reduce((sum, p) => p.status === 'completed' || p.status === 'captured' ? sum + p.amount : sum, 0);
  const successCount = payments.filter(p => p.status === 'completed' || p.status === 'captured').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View and manage payment transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || payments.length}</p>
              <p className="text-sm text-muted-foreground">Total Payments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Total Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{successCount}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedCount}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order or payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                Failed
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchPayments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
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
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} payments` : "No payment transactions yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono">#{payment.id}</TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {payment.order_number || `#${payment.order_id}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {payment.user_email || `User #${payment.user_id}`}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{getGatewayBadge(payment.gateway)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.created_at ? formatDateTime(payment.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                    {pagination.total_items} payments
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

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Payment ID</span>
                    <p className="font-mono font-medium">#{selectedPayment.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order</span>
                    <p className="font-mono font-medium">{selectedPayment.order_number || `#${selectedPayment.order_id}`}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gateway</span>
                    <div className="mt-1">{getGatewayBadge(selectedPayment.gateway)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Method</span>
                    <p className="font-medium">{selectedPayment.payment_method || "N/A"}</p>
                  </div>
                  {selectedPayment.gateway_payment_id && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Gateway Payment ID</span>
                      <p className="font-mono text-sm">{selectedPayment.gateway_payment_id}</p>
                    </div>
                  )}
                  {selectedPayment.gateway_order_id && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Gateway Order ID</span>
                      <p className="font-mono text-sm">{selectedPayment.gateway_order_id}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">User</span>
                    <p className="font-medium">{selectedPayment.user_email || `User #${selectedPayment.user_id}`}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Date</span>
                    <p className="font-medium">{selectedPayment.created_at ? formatDateTime(selectedPayment.created_at) : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
