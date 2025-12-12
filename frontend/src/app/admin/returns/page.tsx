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
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Package,
  Truck,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface ReturnRequest {
  id: number;
  return_number: string;
  order_id: number;
  user_id: number;
  return_type: string;
  return_reason: string;
  product_name: string;
  quantity: number;
  refund_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '20');
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const response = await apiClient.get(`/admin/returns?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      setReturns(data.returns || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleOpenAction = (returnRequest: ReturnRequest, type: "approve" | "reject") => {
    setSelectedReturn(returnRequest);
    setActionType(type);
    setAdminNotes("");
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReturn) return;

    setProcessingId(selectedReturn.id);
    try {
      if (actionType === "approve") {
        await apiClient.patch(`/admin/returns/${selectedReturn.id}/approve`, {
          admin_notes: adminNotes || undefined,
        });
      } else {
        await apiClient.patch(`/admin/returns/${selectedReturn.id}/reject`, {
          admin_notes: adminNotes || undefined,
        });
      }
      setActionDialogOpen(false);
      fetchReturns();
    } catch (error) {
      console.error("Failed to process return:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Processing</Badge>;
      case "completed":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Completed</Badge>;
      case "picked_up":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">Picked Up</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "refund":
        return <Badge variant="secondary">Refund</Badge>;
      case "exchange":
        return <Badge variant="secondary">Exchange</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const pendingCount = returns.filter(r => r.status === 'pending').length;
  const pendingAmount = returns.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.refund_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Returns & Refunds</h1>
          <p className="text-muted-foreground">
            Manage customer return requests and refunds
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <RotateCcw className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || 0}</p>
              <p className="text-sm text-muted-foreground">Total Returns</p>
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
              <Truck className="h-6 w-6 text-orange-500" />
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
              <p className="text-2xl font-bold">{returns.filter(r => r.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
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
                placeholder="Search by return number..."
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
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchReturns}>
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
          ) : returns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No returns found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} returns` : "No return requests yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return #</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((returnRequest) => (
                      <TableRow key={returnRequest.id}>
                        <TableCell className="font-mono">{returnRequest.return_number}</TableCell>
                        <TableCell>#{returnRequest.order_id}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {returnRequest.product_name}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(returnRequest.return_type)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(returnRequest.refund_amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(returnRequest.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {returnRequest.created_at ? formatDateTime(returnRequest.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {returnRequest.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenAction(returnRequest, "approve")}
                                disabled={processingId === returnRequest.id}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenAction(returnRequest, "reject")}
                                disabled={processingId === returnRequest.id}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
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
                    {pagination.total_items} returns
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
                  Approve Return
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Reject Return
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Return #</span>
                    <p className="font-medium">{selectedReturn.return_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order ID</span>
                    <p className="font-medium">#{selectedReturn.order_id}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Product</span>
                    <p className="font-medium">{selectedReturn.product_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Refund Amount</span>
                    <p className="font-semibold text-lg">{formatCurrency(selectedReturn.refund_amount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason</span>
                    <p className="font-medium">{selectedReturn.return_reason}</p>
                  </div>
                </div>
              </div>

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
