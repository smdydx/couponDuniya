"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, User, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";

interface Review {
  id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  title?: string;
  review_text?: string;
  pros?: string;
  cons?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

interface ProductReviewsProps {
  productId: number;
  productSlug?: string;
}

export function ProductReviews({ productId, productSlug }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/products/${productSlug || productId}/reviews?limit=10`);
        const data = response.data?.data || response.data;
        setReviews(data.reviews || []);
        setStats({
          average_rating: data.average_rating || 0,
          total_reviews: data.total_reviews || 0,
          rating_breakdown: data.rating_breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, productSlug]);

  const handleHelpful = async (reviewId: number) => {
    try {
      await apiClient.post(`/reviews/${reviewId}/helpful`);
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ));
    } catch (err) {
      console.error("Failed to mark as helpful:", err);
    }
  };

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No Reviews Yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to review this product
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Reviews</span>
          <div className="flex items-center gap-2">
            {renderStars(Math.round(stats.average_rating), "md")}
            <span className="text-lg font-semibold">{stats.average_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({stats.total_reviews} reviews)</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown] || 0;
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-6">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <Progress value={percentage} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {displayedReviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.user_name || `User ${review.user_id}`}
                        </span>
                        {review.is_verified_purchase && (
                          <Badge variant="outline" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <h4 className="font-medium mb-1">{review.title}</h4>
                )}
                {review.review_text && (
                  <p className="text-sm text-muted-foreground mb-2">{review.review_text}</p>
                )}
                
                {(review.pros || review.cons) && (
                  <div className="grid sm:grid-cols-2 gap-2 mb-2">
                    {review.pros && (
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">Pros: </span>
                        {review.pros}
                      </div>
                    )}
                    {review.cons && (
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">Cons: </span>
                        {review.cons}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => handleHelpful(review.id)}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpful_count})
                </Button>
              </div>
            ))}

            {reviews.length > 3 && !showAll && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {reviews.length} Reviews
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
