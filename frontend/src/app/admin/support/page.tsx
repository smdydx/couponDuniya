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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Headphones,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  MessageCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface SupportTicket {
  id: number;
  ticket_number: string;
  user_id: number;
  user_email?: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  message: string;
  admin_response?: string;
  assigned_to?: number;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("open");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '20');
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const response = await apiClient.get(`/admin/support-tickets?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.admin_response || "");
    setNewStatus(ticket.status);
    setDetailDialogOpen(true);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    setProcessingId(selectedTicket.id);
    try {
      await apiClient.patch(`/admin/support-tickets/${selectedTicket.id}`, {
        status: newStatus,
        admin_response: adminResponse || undefined,
      });
      setDetailDialogOpen(false);
      fetchTickets();
    } catch (error) {
      console.error("Failed to update ticket:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Resolved</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">In Progress</Badge>;
      case "closed":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200">Closed</Badge>;
      case "waiting_customer":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">Waiting</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Open</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">High</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Medium</Badge>;
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage customer support requests and inquiries
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Headphones className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || 0}</p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
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
                placeholder="Search tickets..."
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
                variant={statusFilter === "open" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("open")}
              >
                Open
              </Button>
              <Button
                variant={statusFilter === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("in_progress")}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchTickets}>
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
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Headphones className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} tickets` : "No support tickets yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate font-medium">
                            {ticket.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.user_email || `User #${ticket.user_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.category}</Badge>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {ticket.created_at ? formatDateTime(ticket.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(ticket)}
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
                    {pagination.total_items} tickets
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ticket Details
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/50">
                <div>
                  <span className="text-sm text-muted-foreground">Ticket Number</span>
                  <p className="font-mono font-medium">{selectedTicket.ticket_number}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">User</span>
                  <p className="font-medium">{selectedTicket.user_email || `User #${selectedTicket.user_id}`}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category</span>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Subject</span>
                  <p className="font-medium">{selectedTicket.subject}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <span className="text-sm font-medium text-muted-foreground">Customer Message</span>
                <p className="mt-2 text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting for Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Admin Response</label>
                  <Textarea
                    placeholder="Type your response to the customer..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTicket}
              disabled={processingId !== null}
            >
              <Send className="mr-2 h-4 w-4" />
              {processingId !== null ? "Updating..." : "Update Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
