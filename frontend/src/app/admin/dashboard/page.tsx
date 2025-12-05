
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Store,
  Tag,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface DashboardStats {
  orders: { total: number; today: number };
  revenue: { total: number; today: number };
  users: { total: number; new_this_week: number };
  withdrawals: { pending_count: number; pending_amount: number };
  catalog: { active_merchants: number; active_offers: number; available_products: number };
  redis: { connected: boolean; keys_count: number; memory_used: string; connected_clients: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/admin/analytics/dashboard");
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

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
      value: stats.users.total.toLocaleString(),
      subtitle: `+${stats.users.new_this_week} this week`,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      change: stats.users.new_this_week > 0 ? "up" : "neutral",
    },
    {
      title: "Active Merchants",
      value: stats.catalog.active_merchants.toLocaleString(),
      subtitle: `Live merchants`,
      icon: Store,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      change: "neutral",
    },
    {
      title: "Active Offers",
      value: stats.catalog.active_offers.toLocaleString(),
      subtitle: `Live deals running`,
      icon: Tag,
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      change: "neutral",
    },
    {
      title: "Total Orders",
      value: stats.orders.total.toLocaleString(),
      subtitle: `+${stats.orders.today} today`,
      icon: ShoppingCart,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      change: stats.orders.today > 0 ? "up" : "neutral",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.total.toLocaleString()}`,
      subtitle: `₹${stats.revenue.today.toLocaleString()} today`,
      icon: DollarSign,
      gradient: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      change: stats.revenue.today > 0 ? "up" : "neutral",
    },
    {
      title: "Pending Withdrawals",
      value: stats.withdrawals.pending_count.toLocaleString(),
      subtitle: `₹${stats.withdrawals.pending_amount.toLocaleString()} pending`,
      icon: Wallet,
      gradient: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      change: stats.withdrawals.pending_count > 0 ? "down" : "neutral",
    },
    {
      title: "Active Products",
      value: stats.catalog.available_products.toLocaleString(),
      subtitle: `Gift cards available`,
      icon: Package,
      gradient: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      change: "neutral",
    },
  ];

  return (
    <div className="space-y-6 p-6">
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Recent Orders
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Orders Today</span>
                <span className="font-bold text-blue-600">
                  {stats.orders.today}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-bold text-green-600">
                  {stats.orders.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Revenue Today</span>
                <span className="font-bold text-indigo-600">
                  ₹{stats.revenue.today.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-600" />
              Catalog Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Merchants</span>
                <span className="font-bold text-purple-600">
                  {stats.catalog.active_merchants}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Offers</span>
                <span className="font-bold text-pink-600">
                  {stats.catalog.active_offers}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Products</span>
                <span className="font-bold text-orange-600">
                  {stats.catalog.available_products}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-600" />
              Withdrawals
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Pending Count</span>
                <span className="font-bold text-orange-600">
                  {stats.withdrawals.pending_count}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Pending Amount</span>
                <span className="font-bold text-red-600">
                  ₹{stats.withdrawals.pending_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Redis Status</span>
                <span className={`font-bold ${stats.redis.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.redis.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
