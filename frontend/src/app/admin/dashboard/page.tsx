
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  Leaf,
  AlertCircle,
} from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboard();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      // Set default stats even on error so UI still renders
      setStats({
        orders: { total: 0, today: 0 },
        revenue: { total: 0, today: 0 },
        users: { total: 0, new_this_week: 0 },
        withdrawals: { pending_count: 0, pending_amount: 0 },
        catalog: { active_merchants: 0, active_offers: 0, available_products: 0 },
        redis: { connected: false, keys_count: 0, memory_used: "0 MB", connected_clients: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-16 w-16 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Use default data structure if no stats available
  const displayStats: DashboardStats = stats || {
    orders: { total: 0, today: 0 },
    revenue: { total: 0, today: 0 },
    users: { total: 0, new_this_week: 0 },
    withdrawals: { pending_count: 0, pending_amount: 0 },
    catalog: { active_merchants: 0, active_offers: 0, available_products: 0 },
    redis: { connected: false, keys_count: 0, memory_used: "0 MB", connected_clients: 0 }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(displayStats.revenue.total),
      subtitle: `${formatCurrency(displayStats.revenue.today)} today`,
      icon: DollarSign,
      trend: displayStats.revenue.today > 0 ? "up" : "down",
      change: displayStats.revenue.today > 0 ? `+${((displayStats.revenue.today / (displayStats.revenue.total || 1)) * 100).toFixed(1)}%` : "0%",
      gradient: "from-emerald-400 via-green-500 to-teal-600",
      bgPattern: "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]",
      iconBg: "bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/40",
      iconColor: "text-emerald-700 dark:text-emerald-300",
      leafColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Total Orders",
      value: displayStats.orders.total.toLocaleString(),
      subtitle: `${displayStats.orders.today} today`,
      icon: ShoppingCart,
      trend: displayStats.orders.today > 0 ? "up" : "down",
      change: displayStats.orders.today > 0 ? `+${displayStats.orders.today}` : "0",
      gradient: "from-blue-400 via-cyan-500 to-teal-600",
      bgPattern: "bg-[radial-gradient(circle_at_70%_30%,rgba(6,182,212,0.15),transparent_50%)]",
      iconBg: "bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/40 dark:to-cyan-900/40",
      iconColor: "text-blue-700 dark:text-blue-300",
      leafColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "Active Users",
      value: displayStats.users.total.toLocaleString(),
      subtitle: `${displayStats.users.new_this_week} new this week`,
      icon: Users,
      trend: displayStats.users.new_this_week > 0 ? "up" : "down",
      change: `+${displayStats.users.new_this_week}`,
      gradient: "from-purple-400 via-pink-500 to-rose-600",
      bgPattern: "bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]",
      iconBg: "bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/40",
      iconColor: "text-purple-700 dark:text-purple-300",
      leafColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Pending Withdrawals",
      value: formatCurrency(displayStats.withdrawals.pending_amount),
      subtitle: `${displayStats.withdrawals.pending_count} requests`,
      icon: Wallet,
      trend: "neutral",
      change: `${displayStats.withdrawals.pending_count} pending`,
      gradient: "from-orange-400 via-amber-500 to-yellow-600",
      bgPattern: "bg-[radial-gradient(circle_at_20%_80%,rgba(251,146,60,0.15),transparent_50%)]",
      iconBg: "bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/40 dark:to-amber-900/40",
      iconColor: "text-orange-700 dark:text-orange-300",
      leafColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  const catalogStats = [
    {
      title: "Active Merchants",
      value: displayStats.catalog.active_merchants,
      icon: Store,
      href: "/admin/merchants",
      gradient: "from-indigo-400 via-purple-500 to-pink-600",
      iconColor: "text-indigo-700 dark:text-indigo-300",
      bgPattern: "bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)]",
    },
    {
      title: "Active Offers",
      value: displayStats.catalog.active_offers,
      icon: Tag,
      href: "/admin/offers",
      gradient: "from-pink-400 via-rose-500 to-red-600",
      iconColor: "text-pink-700 dark:text-pink-300",
      bgPattern: "bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent)]",
    },
    {
      title: "Available Products",
      value: displayStats.catalog.available_products,
      icon: Gift,
      href: "/admin/products",
      gradient: "from-cyan-400 via-teal-500 to-emerald-600",
      iconColor: "text-cyan-700 dark:text-cyan-300",
      bgPattern: "bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent)]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
      {error && (
        <div className="mb-4 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">Failed to load dashboard data</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
            </div>
            <Button 
              onClick={fetchDashboardData} 
              size="sm"
              variant="outline"
              className="border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <Leaf className="h-10 w-10 text-green-600 dark:text-green-400" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
          onClick={fetchDashboardData}
        >
          <RefreshCw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Cards with Nature Theme */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-700 bg-white dark:bg-gray-900">
            <div className={`absolute inset-0 ${stat.bgPattern}`} />
            <div className="absolute top-2 right-2 opacity-20">
              <Leaf className={`h-24 w-24 ${stat.leafColor} transform rotate-12`} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.iconBg} shadow-lg ring-2 ring-white dark:ring-gray-800`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
                <Badge 
                  variant={stat.trend === "up" ? "default" : stat.trend === "down" ? "secondary" : "outline"} 
                  className={`gap-1 ${stat.trend === "up" ? 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white' : stat.trend === "down" ? 'bg-gray-500 dark:bg-gray-600' : 'bg-blue-500 dark:bg-blue-600'}`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : stat.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Revenue Chart Placeholder */}
        <Card className="lg:col-span-2 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Revenue Overview (Last 7 Days)
            </CardTitle>
            <Leaf className="h-5 w-5 text-green-500 dark:text-green-400 animate-pulse" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <Activity className="h-16 w-16 text-blue-500 dark:text-blue-400 mx-auto mb-3 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 blur-xl opacity-20 animate-pulse"></div>
                </div>
                <p className="text-muted-foreground font-medium">Revenue chart visualization coming soon</p>
                <p className="text-sm text-muted-foreground mt-1">Total Revenue: {formatCurrency(displayStats.revenue.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-xl border-2 border-green-200 dark:border-green-800 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 shadow-lg">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">API Server</p>
                    <p className="text-xs text-muted-foreground">FastAPI Backend</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-md">
                  ● Online
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 shadow-lg">
                    <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">Redis Cache</p>
                    <p className="text-xs text-muted-foreground">{displayStats.redis.keys_count} keys | {displayStats.redis.memory_used}</p>
                  </div>
                </div>
                <Badge 
                  className={displayStats.redis.connected ? "bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-md" : "bg-red-500 dark:bg-red-600"}
                >
                  {displayStats.redis.connected ? "● Connected" : "● Offline"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog Stats with Nature Theme */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        {catalogStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-2xl hover:scale-105 duration-300 border-2 border-gray-200 dark:border-gray-700 relative overflow-hidden group bg-white dark:bg-gray-900">
              <div className={`absolute inset-0 ${stat.bgPattern}`} />
              <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <Leaf className="h-32 w-32 text-green-600 dark:text-green-400 transform rotate-45" />
              </div>
              <CardContent className="flex items-center gap-4 p-6 relative z-10">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-2xl group-hover:scale-110 transition-transform ring-4 ring-white dark:ring-gray-800`}>
                  <stat.icon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-5xl font-bold text-gray-900 dark:text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/offers">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-md">
                  <Tag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/merchants">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 hover:border-green-400 dark:hover:border-green-600 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 shadow-md">
                  <Store className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/withdrawals">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 shadow-md">
                  <Wallet className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">{displayStats.withdrawals.pending_count} pending</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/30 dark:hover:to-red-950/30 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 shadow-md">
                  <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">View Analytics</p>
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
