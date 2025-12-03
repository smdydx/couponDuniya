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
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Total Orders",
      value: "2,456",
      subtitle: "24 today",
      icon: ShoppingCart,
      trend: "up",
      change: "+8.2%",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Active Users",
      value: "12,543",
      subtitle: "156 new this week",
      icon: Users,
      trend: "up",
      change: "+15.3%",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Pending Withdrawals",
      value: formatCurrency(45000),
      subtitle: "12 requests",
      icon: Wallet,
      trend: "down",
      change: "12 pending",
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  const catalogStats = [
    {
      title: "Active Merchants",
      value: 156,
      icon: Store,
      href: "/admin/merchants",
      color: "bg-indigo-500/10 text-indigo-500",
    },
    {
      title: "Active Offers",
      value: 892,
      icon: Tag,
      href: "/admin/offers",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      title: "Available Products",
      value: 234,
      icon: Gift,
      href: "/admin/products",
      color: "bg-cyan-500/10 text-cyan-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your platform.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Revenue Overview (Last 7 Days)</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">Revenue chart will appear here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">API Server</p>
                  <p className="text-xs text-muted-foreground">FastAPI Backend</p>
                </div>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {catalogStats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/offers">
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Add New Offer</p>
                  <p className="text-xs text-muted-foreground">Create coupon or deal</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/merchants">
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Store className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Add Merchant</p>
                  <p className="text-xs text-muted-foreground">New partner store</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/withdrawals">
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Process Withdrawals</p>
                  <p className="text-xs text-muted-foreground">12 pending</p>
                </div>
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
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
