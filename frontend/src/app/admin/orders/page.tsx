"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Download, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Package, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import adminApi, { Order, Pagination } from "@/lib/api/admin";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders({
        page,
        limit: 20,
        status: statusFilter,
      });
      
      // Safely handle the response structure
      const ordersData = data?.data?.orders || data?.orders || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;
      
      setOrders(ordersData);
      setPagination(paginationData);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      console.error("Error details:", error.response?.data || error.message);
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleFulfillOrder = async (orderId: number) => {
    try {
      await adminApi.fulfillOrder(orderId);
      fetchOrders();
      setDetailDialogOpen(false);
    } catch (error) {
      console.error("Failed to fulfill order:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES];
    if (statusConfig) {
      return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig = PAYMENT_STATUSES[status as keyof typeof PAYMENT_STATUSES];
    if (statusConfig) {
      return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const filteredOrders = (orders || []).filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order?.order_number?.toLowerCase()?.includes(searchLower) ||
      order?.user_email?.toLowerCase()?.includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || 0}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders?.filter(o => o?.status === 'pending' || o?.status === 'processing')?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders?.filter(o => o?.status === 'fulfilled')?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Fulfilled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orders?.filter(o => o?.status === 'cancelled')?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
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
                placeholder="Search by order number or email..."
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
                variant={statusFilter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("processing")}
              >
                Processing
              </Button>
              <Button
                variant={statusFilter === "fulfilled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("fulfilled")}
              >
                Fulfilled
              </Button>
              <Button
                variant={statusFilter === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cancelled")}
              >
                Cancelled
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchOrders}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-24" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter ? "Try adjusting your filters" : "No orders placed yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono font-medium">{order.order_number}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">User #{order.user_id}</p>
                            {order.user_email && (
                              <p className="text-sm text-muted-foreground">{order.user_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {order.created_at ? formatDateTime(order.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(order.status === "processing" || order.status === "paid") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() => handleFulfillOrder(order.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
                    {pagination.total_items} orders
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
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono font-medium">{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span>#{selectedOrder.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  {getPaymentBadge(selectedOrder.payment_status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{selectedOrder.created_at ? formatDateTime(selectedOrder.created_at) : '-'}</span>
                </div>
              </div>
              {(selectedOrder.status === "processing" || selectedOrder.status === "paid") && (
                <Button
                  className="w-full"
                  onClick={() => handleFulfillOrder(selectedOrder.id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Fulfilled
                </Button>
              )}
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
