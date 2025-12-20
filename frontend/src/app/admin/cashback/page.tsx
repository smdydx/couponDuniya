"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, CheckCircle, XCircle, Clock, DollarSign, Users, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/store/uiStore";
import adminApi, { CashbackEvent, Pagination } from "@/lib/api/admin";

export default function AdminCashbackPage() {
  const [cashbackEvents, setCashbackEvents] = useState<CashbackEvent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: "confirm" | "reject"; id: number } | null>(null);

  const fetchCashback = async () => {
    setLoading(true);
    try {
      const params: { page?: number; limit?: number; status?: string } = { page, limit: 20 };
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      const data = await adminApi.getCashback(params);
      setCashbackEvents(data.cashback_events);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch cashback events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashback();
  }, [page, statusFilter]);

  const handleConfirmCashback = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.confirmCashback(id);
      toast.success("Cashback confirmed successfully");
      fetchCashback();
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm cashback");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const handleRejectCashback = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.rejectCashback(id);
      toast.success("Cashback rejected");
      fetchCashback();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject cashback");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
      processing: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return (
      <Badge variant="outline" className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredEvents = cashbackEvents.filter((event) => {
    const matchesSearch = !search || 
      event.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      event.id.toString().includes(search);
    return matchesSearch;
  });

  const pendingCount = cashbackEvents.filter((e) => e.status === "pending").length;
  const confirmedCount = cashbackEvents.filter((e) => e.status === "confirmed").length;
  const totalAmount = cashbackEvents.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Cashback Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user cashback events
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Events</CardTitle>
            <Users className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total_items || cashbackEvents.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Pending</CardTitle>
            <Clock className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cashback events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">#{event.id}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">User #{event.user_id}</div>
                          {event.user_email && (
                            <div className="text-muted-foreground">{event.user_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.order_id ? `#${event.order_id}` : "-"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{event.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.confirmed_at
                          ? new Date(event.confirmed_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {event.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setConfirmDialog({ open: true, type: "confirm", id: event.id })}
                              disabled={actionLoading === event.id}
                            >
                              {actionLoading === event.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setConfirmDialog({ open: true, type: "reject", id: event.id })}
                              disabled={actionLoading === event.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} items)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === "confirm" ? "Confirm Cashback" : "Reject Cashback"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === "confirm"
                ? "Are you sure you want to confirm this cashback? The amount will be added to the user's wallet."
                : "Are you sure you want to reject this cashback? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.type === "confirm" ? "default" : "destructive"}
              onClick={() => {
                if (confirmDialog?.type === "confirm") {
                  handleConfirmCashback(confirmDialog.id);
                } else if (confirmDialog?.type === "reject") {
                  handleRejectCashback(confirmDialog!.id);
                }
              }}
              disabled={actionLoading !== null}
            >
              {actionLoading !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog?.type === "confirm" ? "Confirm" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
