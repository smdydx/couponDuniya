"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowUpRight,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header - PhonePe Style */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-2">Welcome back! Here's your platform overview</p>
            </div>
            <Button 
              size="sm" 
              className="gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Stats</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900">Failed to load data</p>
                <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
              </div>
              <Button onClick={fetchDashboardData} size="sm" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">Retry</Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 bg-white rounded-2xl animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        )}

        {/* Stats Grid - PhonePe Style */}
        {!loading && stats && (
          <div className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Users Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">+8%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.users?.total?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-3">{(stats.users?.new_this_week || 0)} added this week</p>
            </div>

            {/* Active Merchants Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">+8%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Active Merchants</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.catalog?.active_merchants?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-3">Partner stores online</p>
            </div>

            {/* Active Offers Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Tag className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">+15%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Active Offers</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.catalog?.active_offers?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-3">Live deals running</p>
            </div>

            {/* Total Orders Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">+23%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Orders</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.orders?.total?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-3">{(stats.orders?.today || 0)} orders today</p>
            </div>

            {/* Total Revenue Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">+18%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenue?.total || 0)}</p>
              <p className="text-xs text-gray-500 mt-3">{formatCurrency(stats.revenue?.today || 0)} today</p>
            </div>

            {/* Pending Withdrawals Card */}
            <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Wallet className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">-5%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">Pending Withdrawals</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stats.withdrawals?.pending_count?.toLocaleString() || "0"}</p>
              <p className="text-xs text-gray-500 mt-3">{formatCurrency(stats.withdrawals?.pending_amount || 0)} pending</p>
            </div>
          </div>
        )}

        {/* Quick Actions - Gradient Cards PhonePe Style */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Recent Orders */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-sm font-semibold text-blue-100 relative z-10">Recent Orders</h3>
              <p className="text-4xl font-bold mt-3 relative z-10">24</p>
              <p className="text-xs text-blue-100 mt-2 relative z-10">Last 24 hours</p>
            </div>

            {/* New Users */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-sm font-semibold text-purple-100 relative z-10">New Users</h3>
              <p className="text-4xl font-bold mt-3 relative z-10">156</p>
              <p className="text-xs text-purple-100 mt-2 relative z-10">This week</p>
            </div>

            {/* Active Coupons */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-pink-600 to-rose-700 text-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-sm font-semibold text-pink-100 relative z-10">Active Coupons</h3>
              <p className="text-4xl font-bold mt-3 relative z-10">{stats?.catalog?.active_offers || 0}</p>
              <p className="text-xs text-pink-100 mt-2 relative z-10">Currently live</p>
            </div>

            {/* Cashback Pending */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-700 text-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-sm font-semibold text-cyan-100 relative z-10">Cashback Pending</h3>
              <p className="text-4xl font-bold mt-3 relative z-10">₹2.4L</p>
              <p className="text-xs text-cyan-100 mt-2 relative z-10">To be processed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}