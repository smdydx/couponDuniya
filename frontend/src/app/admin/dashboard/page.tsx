
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Store,
  Tag,
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
} from "lucide-react";
import api from "@/lib/api/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface DashboardStats {
  total_users: number;
  new_users_today: number;
  total_merchants: number;
  active_merchants: number;
  total_offers: number;
  active_offers: number;
  total_products: number;
  active_products: number;
  total_orders: number;
  orders_today: number;
  total_revenue: number;
  revenue_today: number;
  pending_withdrawals: number;
  pending_withdrawal_amount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/admin/analytics/dashboard");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const calculatePercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return ((current / total) * 100).toFixed(1);
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.total_users.toLocaleString(),
      subtitle: `+${stats.new_users_today} today`,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: stats.new_users_today > 0 ? "up" : "neutral",
    },
    {
      title: "Active Merchants",
      value: stats.active_merchants.toLocaleString(),
      subtitle: `${calculatePercentage(stats.active_merchants, stats.total_merchants)}% active`,
      icon: Store,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: "neutral",
    },
    {
      title: "Active Offers",
      value: stats.active_offers.toLocaleString(),
      subtitle: `Live deals running`,
      icon: Tag,
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      change: "neutral",
    },
    {
      title: "Total Orders",
      value: stats.total_orders.toLocaleString(),
      subtitle: `+${stats.orders_today} today`,
      icon: ShoppingCart,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      change: stats.orders_today > 0 ? "up" : "neutral",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.total_revenue.toLocaleString()}`,
      subtitle: `₹${stats.revenue_today.toLocaleString()} today`,
      icon: DollarSign,
      gradient: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      change: stats.revenue_today > 0 ? "up" : "neutral",
    },
    {
      title: "Pending Withdrawals",
      value: stats.pending_withdrawals.toLocaleString(),
      subtitle: `₹${stats.pending_withdrawal_amount.toLocaleString()} pending`,
      icon: Wallet,
      gradient: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      change: stats.pending_withdrawals > 0 ? "down" : "neutral",
    },
    {
      title: "Active Products",
      value: stats.active_products.toLocaleString(),
      subtitle: `Gift cards available`,
      icon: Package,
      gradient: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      change: "neutral",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s your platform overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}
              />

              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold tracking-tight">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {stat.change === "up" && (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      )}
                      {stat.change === "down" && (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      {stat.subtitle}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Orders Today</span>
                <span className="font-bold text-blue-600">
                  {stats.orders_today}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">New Users</span>
                <span className="font-bold text-green-600">
                  {stats.new_users_today}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Revenue Today</span>
                <span className="font-bold text-indigo-600">
                  ₹{stats.revenue_today.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-600" />
              Merchants Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Merchants</span>
                <span className="font-bold text-purple-600">
                  {stats.total_merchants}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Merchants</span>
                <span className="font-bold text-green-600">
                  {stats.active_merchants}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Rate</span>
                <span className="font-bold text-blue-600">
                  {calculatePercentage(stats.active_merchants, stats.total_merchants)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Products & Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Products</span>
                <span className="font-bold text-orange-600">
                  {stats.active_products}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Offers</span>
                <span className="font-bold text-pink-600">
                  {stats.active_offers}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Products</span>
                <span className="font-bold text-indigo-600">
                  {stats.total_products}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
