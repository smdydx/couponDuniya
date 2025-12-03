"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Wallet,
  Store,
  Tag,
  RefreshCw,
  Gift,
  Activity,
  Database,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import adminApi, { DashboardStats, RevenueSeries } from "@/lib/api/admin";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenueSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashboardData, revenueData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRevenueAnalytics(7),
      ]);
      setStats(dashboardData);
      setRevenueSeries(revenueData.series || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="mt-4 h-8 w-24" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.revenue?.total || 0),
      subtitle: `${formatCurrency(stats?.revenue?.today || 0)} today`,
      icon: DollarSign,
      trend: "up",
      change: "+12.5%",
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Total Orders",
      value: stats?.orders?.total?.toLocaleString() || "0",
      subtitle: `${stats?.orders?.today || 0} today`,
      icon: ShoppingCart,
      trend: "up",
      change: "+8.2%",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Active Users",
      value: stats?.users?.total?.toLocaleString() || "0",
      subtitle: `${stats?.users?.new_this_week || 0} new this week`,
      icon: Users,
      trend: "up",
      change: "+15.3%",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Pending Withdrawals",
      value: formatCurrency(stats?.withdrawals?.pending_amount || 0),
      subtitle: `${stats?.withdrawals?.pending_count || 0} requests`,
      icon: Wallet,
      trend: stats?.withdrawals?.pending_count ? "down" : "neutral",
      change: `${stats?.withdrawals?.pending_count || 0} pending`,
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  const catalogStats = [
    {
      title: "Active Merchants",
      value: stats?.catalog?.active_merchants || 0,
      icon: Store,
      href: ROUTES.admin.merchants,
      color: "bg-indigo-500/10 text-indigo-500",
    },
    {
      title: "Active Offers",
      value: stats?.catalog?.active_offers || 0,
      icon: Tag,
      href: ROUTES.admin.offers,
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      title: "Available Products",
      value: stats?.catalog?.available_products || 0,
      icon: Gift,
      href: ROUTES.admin.products,
      color: "bg-cyan-500/10 text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                {stat.trend !== "neutral" && (
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
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Revenue Overview (Last 7 Days)</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revenueSeries.length > 0 ? (
              <div className="space-y-4">
                <div className="flex h-[200px] items-end gap-2">
                  {revenueSeries.map((item, index) => {
                    const maxRevenue = Math.max(...revenueSeries.map(r => r.revenue), 1);
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md bg-primary transition-all hover:bg-primary/80"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${formatCurrency(item.revenue)} - ${item.orders} orders`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total: {formatCurrency(revenueSeries.reduce((sum, r) => sum + r.revenue, 0))}
                  </span>
                  <span className="text-muted-foreground">
                    Orders: {revenueSeries.reduce((sum, r) => sum + r.orders, 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-muted-foreground">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stats?.redis?.connected ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  <Database className={`h-5 w-5 ${stats?.redis?.connected ? "text-green-500" : "text-red-500"}`} />
                </div>
                <div>
                  <p className="font-medium">Redis Cache</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.redis?.connected ? "Connected" : "Disconnected"}
                  </p>
                </div>
              </div>
              <Badge variant={stats?.redis?.connected ? "success" : "destructive"}>
                {stats?.redis?.connected ? "Online" : "Offline"}
              </Badge>
            </div>

            {stats?.redis?.connected && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Keys Count</span>
                  <span className="font-medium">{stats.redis.keys_count?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Memory Used</span>
                  <span className="font-medium">{stats.redis.memory_used}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connected Clients</span>
                  <span className="font-medium">{stats.redis.connected_clients}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">API Server</p>
                  <p className="text-xs text-muted-foreground">FastAPI Backend</p>
                </div>
              </div>
              <Badge variant="success">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {catalogStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={ROUTES.admin.offers}>
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
            </Link>
            <Link href={ROUTES.admin.merchants}>
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
            </Link>
            <Link href={ROUTES.admin.withdrawals}>
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.withdrawals?.pending_count || 0} pending
                  </p>
                </div>
              </button>
            </Link>
            <Link href={ROUTES.admin.analytics}>
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Reports & insights</p>
                </div>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
