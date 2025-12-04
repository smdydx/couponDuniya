"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Store,
  Tag,
  Gift,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import adminApi, { type DashboardStats } from "@/lib/api/admin";

export default function AdminDashboard() {
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
      setError(err.message || "Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = stats ? [
    {
      title: "Total Users",
      value: stats.users?.total?.toLocaleString() || "0",
      subtitle: `${stats.users?.new_this_week || 0} new this week`,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      change: "+12%",
      positive: true,
    },
    {
      title: "Active Merchants",
      value: stats.catalog?.active_merchants?.toLocaleString() || "0",
      subtitle: "Partner stores",
      icon: Store,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
      change: "+8%",
      positive: true,
    },
    {
      title: "Active Offers",
      value: stats.catalog?.active_offers?.toLocaleString() || "0",
      subtitle: "Live deals",
      icon: Tag,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
      change: "+15%",
      positive: true,
    },
    {
      title: "Total Orders",
      value: stats.orders?.total?.toLocaleString() || "0",
      subtitle: `${stats.orders?.today || 0} today`,
      icon: ShoppingCart,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      change: "+23%",
      positive: true,
    },
    {
      title: "Total Revenue",
      value: `₹${((stats.revenue?.total || 0) / 100000).toFixed(1)}L`,
      subtitle: `₹${stats.revenue?.today?.toLocaleString() || 0} today`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20",
      change: "+18%",
      positive: true,
    },
    {
      title: "Pending Withdrawals",
      value: stats.withdrawals?.pending_count?.toLocaleString() || "0",
      subtitle: `₹${((stats.withdrawals?.pending_amount || 0) / 1000).toFixed(1)}K pending`,
      icon: Wallet,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      change: "-5%",
      positive: false,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header - Fully Responsive */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your platform performance</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 w-full sm:w-auto"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Failed to load data</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">{error}</p>
              </div>
              <Button onClick={fetchDashboardData} size="sm" variant="outline" className="w-full sm:w-auto">Retry</Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Grid - Responsive */}
        {!loading && stats && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${stat.bgGradient} hover:scale-105 cursor-pointer`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">24</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">New Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">156</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Active Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">{stats?.catalog?.active_offers || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Currently live</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Cashback Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">₹2.4L</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">To be processed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}