"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data for dashboard
const stats = [
  {
    title: "Total Revenue",
    value: formatCurrency(1250000),
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    description: "This month",
  },
  {
    title: "Total Orders",
    value: "1,284",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
    description: "This month",
  },
  {
    title: "Active Users",
    value: "45,231",
    change: "+15.3%",
    trend: "up",
    icon: Users,
    description: "Total registered",
  },
  {
    title: "Pending Withdrawals",
    value: formatCurrency(34500),
    change: "-5.1%",
    trend: "down",
    icon: Wallet,
    description: "12 requests",
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "John Doe", amount: 1500, status: "fulfilled", date: "Today" },
  { id: "ORD-002", customer: "Jane Smith", amount: 2200, status: "processing", date: "Today" },
  { id: "ORD-003", customer: "Bob Wilson", amount: 950, status: "pending", date: "Yesterday" },
  { id: "ORD-004", customer: "Alice Brown", amount: 3100, status: "fulfilled", date: "Yesterday" },
  { id: "ORD-005", customer: "Charlie Lee", amount: 1800, status: "fulfilled", date: "2 days ago" },
];

const topMerchants = [
  { name: "Amazon", offers: 45, clicks: 12500, revenue: 450000 },
  { name: "Flipkart", offers: 32, clicks: 9800, revenue: 380000 },
  { name: "Myntra", offers: 28, clicks: 7200, revenue: 220000 },
  { name: "Swiggy", offers: 18, clicks: 5600, revenue: 150000 },
  { name: "Zomato", offers: 15, clicks: 4200, revenue: 120000 },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <Badge
                  variant={stat.trend === "up" ? "success" : "destructive"}
                  className="gap-1"
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.amount)}</p>
                    <Badge
                      variant={
                        order.status === "fulfilled"
                          ? "success"
                          : order.status === "processing"
                          ? "info"
                          : "warning"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Merchants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMerchants.map((merchant, index) => (
                <div
                  key={merchant.name}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{merchant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {merchant.offers} offers • {merchant.clicks.toLocaleString()} clicks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(merchant.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">12 pending</p>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Reports & insights</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
