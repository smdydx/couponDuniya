"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Store,
  Tag,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  TrendingDown,
} from "lucide-react";
import adminApi, { type DashboardStats } from "@/lib/api/admin";

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
}

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Monitor your platform performance</p>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">Failed to load data</p>
                <p className="text-xs text-red-600 mt-1 break-words">{error}</p>
              </div>
              <Button onClick={fetchDashboardData} size="sm" variant="outline" className="w-full sm:w-auto">Retry</Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse border-gray-200">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {!loading && stats && (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Users */}
            <Card className="border-blue-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {stats.users?.total?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(stats.users?.new_this_week || 0) > 0 ? '+' : ''}{(stats.users?.new_this_week || 0)} this week
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                {(stats.users?.new_this_week || 0) > 0 && (
                  <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.round(((stats.users?.new_this_week || 0) / (stats.users?.total || 1)) * 100)}%
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Merchants */}
            <Card className="border-green-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Merchants</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {stats.catalog?.active_merchants?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Partner stores</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <Store className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +8%
                </div>
              </CardContent>
            </Card>

            {/* Active Offers */}
            <Card className="border-purple-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Offers</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {stats.catalog?.active_offers?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Live deals</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Tag className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +15%
                </div>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className="border-orange-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {stats.orders?.total?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(stats.orders?.today || 0) > 0 ? '+' : ''}{(stats.orders?.today || 0)} today
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <ShoppingCart className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +23%
                </div>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card className="border-emerald-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {formatCurrency(stats.revenue?.total || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(stats.revenue?.today || 0)} today
                    </p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +18%
                </div>
              </CardContent>
            </Card>

            {/* Pending Withdrawals */}
            <Card className="border-red-200 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">
                      {stats.withdrawals?.pending_count?.toLocaleString() || "0"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(stats.withdrawals?.pending_amount || 0)} pending
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-xl">
                    <Wallet className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  -5%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-blue-100">Recent Orders</h3>
              <p className="text-3xl font-bold mt-2">24</p>
              <p className="text-xs text-blue-100 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-purple-100">New Users</h3>
              <p className="text-3xl font-bold mt-2">156</p>
              <p className="text-xs text-purple-100 mt-1">This week</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-pink-100">Active Coupons</h3>
              <p className="text-3xl font-bold mt-2">{stats?.catalog?.active_offers || 0}</p>
              <p className="text-xs text-pink-100 mt-1">Currently live</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-cyan-100">Cashback Pending</h3>
              <p className="text-3xl font-bold mt-2">₹2.4L</p>
              <p className="text-xs text-cyan-100 mt-1">To be processed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}