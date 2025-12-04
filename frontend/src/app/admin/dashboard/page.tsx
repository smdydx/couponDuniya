
"use client";

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
} from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(1250000),
      subtitle: `${formatCurrency(15000)} today`,
      icon: DollarSign,
      trend: "up",
      change: "+12.5%",
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Orders",
      value: "2,456",
      subtitle: "24 today",
      icon: ShoppingCart,
      trend: "up",
      change: "+8.2%",
      color: "from-blue-500 to-indigo-600",
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Users",
      value: "12,543",
      subtitle: "156 new this week",
      icon: Users,
      trend: "up",
      change: "+15.3%",
      color: "from-purple-500 to-pink-600",
      iconBg: "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Pending Withdrawals",
      value: formatCurrency(45000),
      subtitle: "12 requests",
      icon: Wallet,
      trend: "down",
      change: "12 pending",
      color: "from-orange-500 to-red-600",
      iconBg: "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

  const catalogStats = [
    {
      title: "Active Merchants",
      value: 156,
      icon: Store,
      href: "/admin/merchants",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Active Offers",
      value: 892,
      icon: Tag,
      href: "/admin/offers",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      iconColor: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "Available Products",
      value: 234,
      icon: Gift,
      href: "/admin/products",
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Cards with Gradients */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <Badge 
                  variant={stat.trend === "up" ? "default" : "secondary"} 
                  className={`gap-1 ${stat.trend === "up" ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}`}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Overview (Last 7 Days)
            </CardTitle>
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-muted-foreground">Revenue chart will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between rounded-lg border-2 border-green-200 dark:border-green-800 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium">API Server</p>
                  <p className="text-xs text-muted-foreground">FastAPI Backend</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog Stats with Gradient Borders */}
      <div className="grid gap-6 md:grid-cols-3">
        {catalogStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 duration-300 border-2 relative overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <CardContent className="flex items-center gap-4 p-6 relative">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/offers">
              <button className="flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 hover:border-blue-300 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                  <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/merchants">
              <button className="flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 hover:border-green-300 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                  <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/withdrawals">
              <button className="flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 hover:border-purple-300 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                  <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">12 pending</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/20 dark:hover:to-red-950/20 hover:border-orange-300 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
                  <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold">View Analytics</p>
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
