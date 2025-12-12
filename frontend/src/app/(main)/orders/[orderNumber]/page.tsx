"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Copy, Check, Download, MessageCircle, Package, CreditCard, Mail, Clock, Loader2, AlertCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ORDER_STATUSES, PAYMENT_STATUSES, ROUTES } from "@/lib/constants";
import apiClient from "@/lib/api/client";
import type { Order, OrderItem, GiftCard } from "@/types";

function VoucherCode({ giftCard }: { giftCard: GiftCard }) {
  const [copied, setCopied] = useState<"code" | "pin" | null>(null);

  const handleCopy = async (text: string, type: "code" | "pin") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Card Number</p>
            <div className="flex items-center gap-2">
              <code className="font-mono font-semibold">{giftCard.card_number}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopy(giftCard.card_number, "code")}
              >
                {copied === "code" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {giftCard.pin && (
            <div>
              <p className="text-xs text-muted-foreground">PIN</p>
              <div className="flex items-center gap-2">
                <code className="font-mono font-semibold">{giftCard.pin}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(giftCard.pin!, "pin")}
                >
                  {copied === "pin" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        <Badge variant={giftCard.status === "active" ? "success" : "secondary"}>
          {giftCard.status}
        </Badge>
      </div>
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/orders/${params.orderNumber}`);
        const data = response.data?.data || response.data;
        setOrder(data);
      } catch (err: any) {
        console.error("Failed to fetch order:", err);
        setError(err.response?.data?.detail || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderNumber]);

  if (loading) {
    return (
      <div className="container py-6">
        <Breadcrumbs items={[{ label: "My Orders", href: ROUTES.orders }, { label: "Loading..." }]} />
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
            <div className="space-y-6">
              <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-6">
        <Breadcrumbs items={[{ label: "My Orders", href: ROUTES.orders }, { label: "Error" }]} />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "Unable to load this order"}</p>
            <Button asChild>
              <Link href={ROUTES.orders}>Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || { label: order.status, color: "bg-gray-100 text-gray-800" };
  const paymentStatus = PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES] || { label: order.payment_status, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { label: "My Orders", href: ROUTES.orders },
          { label: order.order_number },
        ]}
      />

      {/* Order Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={status.color} variant="outline">
            {status.label}
          </Badge>
          <Badge className={paymentStatus.color} variant="outline">
            Payment: {paymentStatus.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Items & Vouchers */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          {order.items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.product_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.denomination)} x {item.quantity} = {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.status === "fulfilled" && item.gift_cards.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Voucher Codes</p>
                    {item.gift_cards.map((giftCard) => (
                      <VoucherCode key={giftCard.id} giftCard={giftCard} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Voucher codes will appear here once the order is fulfilled
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6 lg:col-span-1">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.wallet_amount_used > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Wallet</span>
                  <span>-{formatCurrency(order.wallet_amount_used)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Paid</span>
                <span>{formatCurrency(order.final_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {order.delivery_email}
              </div>
              {order.delivery_mobile && (
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {order.delivery_mobile}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {order.payment_method || "Online Payment"}
              </div>
              {order.razorpay_payment_id && (
                <p className="text-xs text-muted-foreground">
                  Transaction ID: {order.razorpay_payment_id}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {order.status === "fulfilled" && (
              <Button className="w-full gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Download Vouchers
              </Button>
            )}
            <Button className="w-full gap-2" variant="outline">
              <MessageCircle className="h-4 w-4" />
              Need Help?
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
