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
  AlertCircle,
  Database,
  CheckCircle,
  Clock,
  Package,
  BarChart3,
  CreditCard,
  ArrowDownRight,
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayStats: DashboardStats = stats || {
    orders: { total: 0, today: 0 },
    revenue: { total: 0, today: 0 },
    users: { total: 0, new_this_week: 0 },
    withdrawals: { pending_count: 0, pending_amount: 0 },
    catalog: { active_merchants: 0, active_offers: 0, available_products: 0 },
    redis: { connected: false, keys_count: 0, memory_used: "0 MB", connected_clients: 0 }
  };

  const revenueChange = displayStats.revenue.total > 0 
    ? ((displayStats.revenue.today / displayStats.revenue.total) * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your platform performance</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={fetchDashboardData}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Failed to load data</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
              <Button onClick={fetchDashboardData} size="sm" variant="outline">Retry</Button>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{revenueChange}%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Total Revenue</p>
                <h3 className="text-3xl font-bold mt-1">{formatCurrency(displayStats.revenue.total)}</h3>
                <p className="text-xs opacity-75 mt-2">Today: {formatCurrency(displayStats.revenue.today)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  {displayStats.orders.today} today
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Total Orders</p>
                <h3 className="text-3xl font-bold mt-1">{displayStats.orders.total.toLocaleString()}</h3>
                <p className="text-xs opacity-75 mt-2">Active transactions</p>
              </div>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  +{displayStats.users.new_this_week}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Active Users</p>
                <h3 className="text-3xl font-bold mt-1">{displayStats.users.total.toLocaleString()}</h3>
                <p className="text-xs opacity-75 mt-2">New this week: {displayStats.users.new_this_week}</p>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawals Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {displayStats.withdrawals.pending_count}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">Pending Withdrawals</p>
                <h3 className="text-3xl font-bold mt-1">{formatCurrency(displayStats.withdrawals.pending_amount)}</h3>
                <p className="text-xs opacity-75 mt-2">Requests: {displayStats.withdrawals.pending_count}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link href="/admin/merchants">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Merchants</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.catalog.active_merchants}</h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/offers">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tag className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Offers</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.catalog.active_offers}</h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/products">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gift className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Products</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.catalog.available_products}</h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">API Server</p>
                    <p className="text-xs text-gray-500">All services running</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Redis Cache</p>
                    <p className="text-xs text-gray-500">{displayStats.redis.keys_count} keys • {displayStats.redis.memory_used}</p>
                  </div>
                </div>
                <Badge className={displayStats.redis.connected ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                  {displayStats.redis.connected ? "Connected" : "Offline"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/admin/offers">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all cursor-pointer group text-center">
                    <Tag className="h-8 w-8 mx-auto text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">New Offer</p>
                  </div>
                </Link>

                <Link href="/admin/merchants">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group text-center">
                    <Store className="h-8 w-8 mx-auto text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Add Merchant</p>
                  </div>
                </Link>

                <Link href="/admin/withdrawals">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all cursor-pointer group text-center">
                    <Wallet className="h-8 w-8 mx-auto text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Withdrawals</p>
                  </div>
                </Link>

                <Link href="/admin/analytics">
                  <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Analytics</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}