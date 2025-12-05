"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  ArrowRight,
  Activity,
  BarChart3,
  Gift,
  UserPlus,
  Network,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
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

  const mainStats = [
    {
      title: "Total Users",
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.new_this_week} this week`,
      icon: Users,
      gradient: "from-violet-500 to-purple-600",
      shadowColor: "shadow-violet-200",
      trend: "up",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.total.toLocaleString()}`,
      change: `₹${stats.revenue.today.toLocaleString()} today`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600",
      shadowColor: "shadow-emerald-200",
      trend: "up",
    },
    {
      title: "Total Orders",
      value: stats.orders.total.toLocaleString(),
      change: `+${stats.orders.today} today`,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-cyan-600",
      shadowColor: "shadow-blue-200",
      trend: "up",
    },
    {
      title: "Active Merchants",
      value: stats.catalog.active_merchants.toLocaleString(),
      change: "Live merchants",
      icon: Store,
      gradient: "from-orange-500 to-amber-600",
      shadowColor: "shadow-orange-200",
      trend: "neutral",
    },
  ];

  const secondaryStats = [
    {
      title: "Active Offers",
      value: stats.catalog.active_offers,
      icon: Tag,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Active Products",
      value: stats.catalog.available_products,
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Pending Withdrawals",
      value: stats.withdrawals.pending_count,
      icon: Wallet,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Pending Amount",
      value: `₹${stats.withdrawals.pending_amount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
  ];

  const quickActions = [
    { title: "Add Merchant", href: "/admin/merchants", icon: Store, color: "bg-purple-500 hover:bg-purple-600" },
    { title: "Add Offer", href: "/admin/offers", icon: Tag, color: "bg-blue-500 hover:bg-blue-600" },
    { title: "Add Product", href: "/admin/products", icon: Gift, color: "bg-emerald-500 hover:bg-emerald-600" },
    { title: "View Users", href: "/admin/users", icon: Users, color: "bg-orange-500 hover:bg-orange-600" },
    { title: "Manage Orders", href: "/admin/orders", icon: ShoppingCart, color: "bg-pink-500 hover:bg-pink-600" },
    { title: "Referrals", href: "/admin/referrals", icon: Network, color: "bg-indigo-500 hover:bg-indigo-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-500">
          Welcome back! Here&apos;s your platform overview for today
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`relative overflow-hidden border-0 shadow-xl ${stat.shadowColor} hover:scale-105 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-90`} />
              <CardContent className="relative p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/80">{stat.title}</p>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                    <p className="text-sm text-white/80 flex items-center gap-1">
                      {stat.trend === "up" && <TrendingUp className="h-4 w-4" />}
                      {stat.trend === "down" && <TrendingDown className="h-4 w-4" />}
                      {stat.change}
                    </p>
                  </div>
                  <div className="rounded-full p-3 bg-white/20 backdrop-blur-sm">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Button
                      className={`w-full h-auto py-4 flex flex-col gap-2 ${action.color} text-white shadow-lg hover:shadow-xl transition-all`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{action.title}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Today&apos;s Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Orders Today</p>
                  <p className="text-2xl font-bold">{stats.orders.today}</p>
                </div>
              </div>
              <Link href="/admin/orders">
                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Revenue Today</p>
                  <p className="text-2xl font-bold">₹{stats.revenue.today.toLocaleString()}</p>
                </div>
              </div>
              <Link href="/admin/analytics">
                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-white/80">New Users This Week</p>
                  <p className="text-2xl font-bold">{stats.users.new_this_week}</p>
                </div>
              </div>
              <Link href="/admin/users">
                <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                  View <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Pending Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Count</span>
                <span className="text-2xl font-bold text-orange-600">{stats.withdrawals.pending_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Amount</span>
                <span className="text-2xl font-bold text-amber-600">₹{stats.withdrawals.pending_amount.toLocaleString()}</span>
              </div>
              <Link href="/admin/withdrawals">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  Manage Withdrawals <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5" />
              Catalog Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Merchants</span>
                <span className="text-2xl font-bold text-purple-600">{stats.catalog.active_merchants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Offers</span>
                <span className="text-2xl font-bold text-pink-600">{stats.catalog.active_offers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Products</span>
                <span className="text-2xl font-bold text-indigo-600">{stats.catalog.available_products}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Redis Status</span>
                <span className={`flex items-center gap-1 font-semibold ${stats.redis.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.redis.connected ? (
                    <><CheckCircle className="h-4 w-4" /> Connected</>
                  ) : (
                    <><AlertCircle className="h-4 w-4" /> Disconnected</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cache Keys</span>
                <span className="text-lg font-bold text-teal-600">{stats.redis.keys_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Memory Used</span>
                <span className="text-lg font-bold text-emerald-600">{stats.redis.memory_used}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connected Clients</span>
                <span className="text-lg font-bold text-cyan-600">{stats.redis.connected_clients}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
