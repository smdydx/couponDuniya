"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUSES, ROUTES } from "@/lib/constants";
import type { Order } from "@/types";

// Mock data
const mockOrders: Order[] = [
  {
    id: 1,
    order_number: "ORD-ABC123",
    user_id: 1,
    status: "fulfilled",
    payment_status: "paid",
    subtotal: 1900,
    discount_amount: 0,
    wallet_amount_used: 0,
    final_amount: 1900,
    currency: "INR",
    delivery_email: "user@example.com",
    items: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    order_number: "ORD-DEF456",
    user_id: 1,
    status: "processing",
    payment_status: "paid",
    subtotal: 950,
    discount_amount: 50,
    wallet_amount_used: 100,
    final_amount: 800,
    currency: "INR",
    delivery_email: "user@example.com",
    items: [],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 3,
    order_number: "ORD-GHI789",
    user_id: 1,
    status: "pending",
    payment_status: "pending",
    subtotal: 475,
    discount_amount: 0,
    wallet_amount_used: 0,
    final_amount: 475,
    currency: "INR",
    delivery_email: "user@example.com",
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders =
    activeTab === "all"
      ? mockOrders
      : mockOrders.filter((order) => order.status === activeTab);

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "My Orders" }]} />

      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="fulfilled">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders found"
              description="You haven't placed any orders yet."
              action={{
                label: "Shop Gift Cards",
                onClick: () => (window.location.href = ROUTES.products),
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const status = ORDER_STATUSES[order.status];
                return (
                  <Link key={order.id} href={ROUTES.orderDetail(order.order_number)}>
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {order.order_number}
                                </span>
                                <Badge className={status.color}>{status.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Placed on {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
                            <span className="text-lg font-semibold">
                              {formatCurrency(order.final_amount)}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-primary">
                              View Details
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
