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
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  MessageSquare,
  ThumbsUp,
  Flag,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface Review {
  id: number;
  product_id: number;
  product_name?: string;
  user_id: number;
  user_name?: string;
  rating: number;
  title?: string;
  review_text?: string;
  status: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  report_count: number;
  created_at: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      queryParams.append('limit', '20');
      if (statusFilter) queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const response = await apiClient.get(`/admin/reviews?${queryParams.toString()}`);
      const data = response.data?.data || response.data;
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: number) => {
    setProcessingId(reviewId);
    try {
      await apiClient.patch(`/admin/reviews/${reviewId}/approve`);
      fetchReviews();
    } catch (error) {
      console.error("Failed to approve review:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    setProcessingId(reviewId);
    try {
      await apiClient.patch(`/admin/reviews/${reviewId}/reject`);
      fetchReviews();
    } catch (error) {
      console.error("Failed to reject review:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
      case "spam":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-200">Spam</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;
  const flaggedCount = reviews.filter(r => r.report_count > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Moderation</h1>
          <p className="text-muted-foreground">
            Approve, reject, or moderate customer reviews
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination?.total_items || 0}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
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
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <Flag className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{flaggedCount}</p>
              <p className="text-sm text-muted-foreground">Flagged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reviews.filter(r => r.status === 'approved').length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
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
                placeholder="Search reviews..."
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
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchReviews}>
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
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
              <p className="text-muted-foreground">
                {statusFilter ? `No ${statusFilter} reviews` : "No reviews yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="max-w-[150px] truncate font-medium">
                            {review.product_name || `Product #${review.product_id}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{review.user_name || `User #${review.user_id}`}</span>
                            {review.is_verified_purchase && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {review.title || review.review_text || "No content"}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {review.created_at ? formatDateTime(review.created_at) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(review)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {review.status === "pending" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-600"
                                  onClick={() => handleApprove(review.id)}
                                  disabled={processingId === review.id}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleReject(review.id)}
                                  disabled={processingId === review.id}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
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
                    {pagination.total_items} reviews
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {renderStars(selectedReview.rating)}
                    <span className="font-semibold">{selectedReview.rating}/5</span>
                  </div>
                  {getStatusBadge(selectedReview.status)}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Product</span>
                    <p className="font-medium">{selectedReview.product_name || `Product #${selectedReview.product_id}`}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">User</span>
                    <p className="font-medium flex items-center gap-2">
                      {selectedReview.user_name || `User #${selectedReview.user_id}`}
                      {selectedReview.is_verified_purchase && (
                        <Badge variant="outline" className="text-xs">Verified Purchase</Badge>
                      )}
                    </p>
                  </div>
                  {selectedReview.title && (
                    <div>
                      <span className="text-sm text-muted-foreground">Title</span>
                      <p className="font-medium">{selectedReview.title}</p>
                    </div>
                  )}
                  {selectedReview.review_text && (
                    <div>
                      <span className="text-sm text-muted-foreground">Review</span>
                      <p className="text-sm mt-1">{selectedReview.review_text}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedReview.helpful_count} helpful
                  </div>
                  {selectedReview.report_count > 0 && (
                    <div className="flex items-center gap-1 text-red-500">
                      <Flag className="h-4 w-4" />
                      {selectedReview.report_count} reports
                    </div>
                  )}
                </div>
              </div>

              {selectedReview.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApprove(selectedReview.id);
                      setDetailDialogOpen(false);
                    }}
                    disabled={processingId === selectedReview.id}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReject(selectedReview.id);
                      setDetailDialogOpen(false);
                    }}
                    disabled={processingId === selectedReview.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
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
