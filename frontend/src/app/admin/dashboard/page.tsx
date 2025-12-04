
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Store,
  Tag,
  RefreshCw,
  Gift,
  Activity,
  Sparkles,
  Zap,
  TrendingDown,
  Database,
} from "lucide-react";
import Link from "next/link";
import adminApi from "@/lib/api/admin";

interface DashboardStats {
  orders: { total: number; today: number };
  revenue: { total: number; today: number };
  users: { total: number; new_this_week: number };
  withdrawals: { pending_count: number; pending_amount: number };
  catalog: { active_merchants: number; active_offers: number; available_products: number };
  redis: { connected: boolean; keys_count: number; memory_used: string; connected_clients: number };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-purple-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error || "No data available"}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.revenue.total),
      subtitle: `${formatCurrency(stats.revenue.today)} today`,
      icon: DollarSign,
      trend: stats.revenue.today > 0 ? "up" : "down",
      change: stats.revenue.today > 0 ? `+${((stats.revenue.today / (stats.revenue.total || 1)) * 100).toFixed(1)}%` : "0%",
      color: "from-emerald-500 via-green-500 to-teal-600",
      iconBg: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Orders",
      value: stats.orders.total.toLocaleString(),
      subtitle: `${stats.orders.today} today`,
      icon: ShoppingCart,
      trend: stats.orders.today > 0 ? "up" : "down",
      change: stats.orders.today > 0 ? `+${stats.orders.today}` : "0",
      color: "from-blue-500 via-sky-500 to-indigo-600",
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Users",
      value: stats.users.total.toLocaleString(),
      subtitle: `${stats.users.new_this_week} new this week`,
      icon: Users,
      trend: stats.users.new_this_week > 0 ? "up" : "down",
      change: `+${stats.users.new_this_week}`,
      color: "from-purple-500 via-pink-500 to-rose-600",
      iconBg: "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Pending Withdrawals",
      value: formatCurrency(stats.withdrawals.pending_amount),
      subtitle: `${stats.withdrawals.pending_count} requests`,
      icon: Wallet,
      trend: "neutral",
      change: `${stats.withdrawals.pending_count} pending`,
      color: "from-orange-500 via-amber-500 to-yellow-600",
      iconBg: "bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  const catalogStats = [
    {
      title: "Active Merchants",
      value: stats.catalog.active_merchants,
      icon: Store,
      href: "/admin/merchants",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Active Offers",
      value: stats.catalog.active_offers,
      icon: Tag,
      href: "/admin/offers",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Available Products",
      value: stats.catalog.available_products,
      icon: Gift,
      href: "/admin/products",
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20"
          onClick={fetchDashboardData}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Cards with Gradients */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.iconBg} shadow-lg`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
                <Badge 
                  variant={stat.trend === "up" ? "default" : stat.trend === "down" ? "secondary" : "outline"} 
                  className={`gap-1 ${stat.trend === "up" ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : stat.trend === "down" ? 'bg-gray-500' : 'bg-blue-500'}`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : stat.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart Placeholder */}
        <Card className="lg:col-span-2 border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Overview (Last 7 Days)
            </CardTitle>
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <Activity className="h-16 w-16 text-blue-500 mx-auto mb-3 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                </div>
                <p className="text-muted-foreground font-medium">Revenue chart visualization coming soon</p>
                <p className="text-sm text-muted-foreground mt-1">Total Revenue: {formatCurrency(stats.revenue.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-2 hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10">
          <CardHeader className="border-b bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border-2 border-green-200 dark:border-green-800 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">API Server</p>
                    <p className="text-xs text-muted-foreground">FastAPI Backend</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md">
                  ● Online
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 shadow-lg">
                    <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Redis Cache</p>
                    <p className="text-xs text-muted-foreground">{stats.redis.keys_count} keys | {stats.redis.memory_used}</p>
                  </div>
                </div>
                <Badge 
                  variant={stats.redis.connected ? "default" : "destructive"} 
                  className={stats.redis.connected ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-md" : ""}
                >
                  {stats.redis.connected ? "● Connected" : "● Offline"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog Stats with Gradient Borders */}
      <div className="grid gap-6 md:grid-cols-3">
        {catalogStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-2xl hover:scale-105 duration-300 border-2 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium mt-1">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-2 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/10 dark:to-pink-950/10">
        <CardHeader className="border-b bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/offers">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md">
                  <Tag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-base">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/merchants">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 hover:border-green-400 hover:shadow-xl hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-md">
                  <Store className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-base">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/withdrawals">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 shadow-md">
                  <Wallet className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-base">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">{stats.withdrawals.pending_count} pending</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/20 dark:hover:to-red-950/20 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 shadow-md">
                  <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-base">View Analytics</p>
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
