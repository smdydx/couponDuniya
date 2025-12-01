"use client";

import Image from "next/image";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CashbackEvent } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CASHBACK_STATUSES } from "@/lib/constants";

interface CashbackTrackerProps {
  events: CashbackEvent[];
  isLoading?: boolean;
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  rejected: XCircle,
  paid: CheckCircle,
};

export function CashbackTracker({ events, isLoading }: CashbackTrackerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <AlertCircle className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-4">No cashback events yet</p>
        <p className="text-sm">Shop through our links to start earning cashback!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const status = CASHBACK_STATUSES[event.status];
        const StatusIcon = statusIcons[event.status];

        return (
          <div key={event.id} className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              {/* Merchant Logo */}
              {event.merchant?.logo_url ? (
                <Image
                  src={event.merchant.logo_url}
                  alt={event.merchant.name}
                  width={48}
                  height={48}
                  className="rounded-lg border object-contain p-1"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted text-lg font-bold">
                  {event.merchant?.name.charAt(0) || "?"}
                </div>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{event.merchant?.name}</h4>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.offer?.title || "Purchase cashback"}
                </p>
                {event.order_amount && (
                  <p className="text-sm text-muted-foreground">
                    Order amount: {formatCurrency(event.order_amount)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.created_at)}
                </p>
              </div>

              {/* Cashback Amount */}
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  +{formatCurrency(event.cashback_amount)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {event.status === "rejected" && event.rejection_reason && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <strong>Reason:</strong> {event.rejection_reason}
              </div>
            )}

            {/* Confirmation Date */}
            {event.status === "confirmed" && event.confirmation_date && (
              <p className="mt-2 text-xs text-muted-foreground">
                Confirmed on {formatDate(event.confirmation_date)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
