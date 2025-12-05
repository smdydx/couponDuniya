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
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import apiClient from "@/lib/api-client";

interface DashboardStats {
  orders: { total: number; today: number };
  revenue: { total: number; today: number };
  users: { total: number; new_this_week: number };
  withdrawals: { pending_count: number; pending_amount: number };
  catalog: { active_merchants: number; active_offers: number; available_products: number };
  redis: { connected: boolean; keys_count: number; memory_used: string; connected_clients: number };
}

interface RecentMerchant {
  id: number;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

interface RecentOffer {
  id: number;
  title: string;
  image_url: string | null;
  merchant_name: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [recentMerchants, setRecentMerchants] = useState<RecentMerchant[]>([]);
  const [recentOffers, setRecentOffers] = useState<RecentOffer[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const defaultStats: DashboardStats = {
      orders: { total: 0, today: 0 },
      revenue: { total: 0, today: 0 },
      users: { total: 0, new_this_week: 0 },
      withdrawals: { pending_count: 0, pending_amount: 0 },
      catalog: { active_merchants: 0, active_offers: 0, available_products: 0 },
      redis: { connected: false, keys_count: 0, memory_used: "0 MB", connected_clients: 0 },
    };

    const fetchDashboardData = async () => {
      try {
        const [statsResponse, merchantsResponse, offersResponse] = await Promise.allSettled([
          apiClient.get("/admin/analytics/dashboard"),
          apiClient.get("/admin/merchants", { params: { limit: 5 } }),
          apiClient.get("/admin/offers", { params: { limit: 5 } }),
        ]);
        
        if (statsResponse.status === "fulfilled") {
          const statsData = statsResponse.value.data;
          if (statsData?.success && statsData?.data) {
            setStats(statsData.data);
          } else if (statsData?.data) {
            setStats(statsData.data);
          } else {
            setStats(defaultStats);
          }
        } else {
          console.error("Stats fetch failed:", statsResponse.reason);
          setStats(defaultStats);
        }
        
        if (merchantsResponse.status === "fulfilled") {
          const merchantsData = merchantsResponse.value.data;
          if (merchantsData?.success && merchantsData?.data?.merchants) {
            setRecentMerchants(merchantsData.data.merchants);
          }
        }
        
        if (offersResponse.status === "fulfilled") {
          const offersData = offersResponse.value.data;
          if (offersData?.success && offersData?.data?.offers) {
            setRecentOffers(offersData.data.offers.map((o: any) => ({
              id: o.id,
              title: o.title,
              image_url: o.image_url,
              merchant_name: o.merchant?.name || "Unknown",
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Active Products",
      value: stats.catalog.available_products,
      icon: Package,
      gradient: "from-indigo-500 to-violet-500",
    },
    {
      title: "Pending Withdrawals",
      value: stats.withdrawals.pending_count,
      icon: Wallet,
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      title: "Pending Amount",
      value: `₹${stats.withdrawals.pending_amount.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-rose-500 to-red-500",
    },
  ];

  const quickActions = [
    { title: "Add Merchant", href: "/admin/merchants", icon: Store, color: "bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700" },
    { title: "Add Offer", href: "/admin/offers", icon: Tag, color: "bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700" },
    { title: "Add Product", href: "/admin/products", icon: Gift, color: "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" },
    { title: "View Users", href: "/admin/users", icon: Users, color: "bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700" },
    { title: "Manage Orders", href: "/admin/orders", icon: ShoppingCart, color: "bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700" },
    { title: "Referrals", href: "/admin/referrals", icon: Network, color: "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700" },
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
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className={`bg-gradient-to-br ${stat.gradient} p-5`}>
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-white/80 mt-1">{stat.title}</p>
                  </div>
                  <div className="rounded-xl p-3 bg-white/20 backdrop-blur-sm">
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50 to-indigo-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
                <Activity className="h-5 w-5 text-white" />
              </div>
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
                      className={`w-full h-auto py-4 flex flex-col gap-2 ${action.color} text-white shadow-lg hover:shadow-xl transition-all border-0`}
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

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50 to-cyan-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Today&apos;s Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
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

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
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

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg">
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
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Pending Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Pending Count</span>
                <span className="text-2xl font-bold text-orange-600">{stats.withdrawals.pending_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Pending Amount</span>
                <span className="text-2xl font-bold text-amber-600">₹{stats.withdrawals.pending_amount.toLocaleString()}</span>
              </div>
              <Link href="/admin/withdrawals">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg">
                  Manage Withdrawals <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5" />
              Catalog Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Active Merchants</span>
                <span className="text-2xl font-bold text-purple-600">{stats.catalog.active_merchants}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Active Offers</span>
                <span className="text-2xl font-bold text-pink-600">{stats.catalog.active_offers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Active Products</span>
                <span className="text-2xl font-bold text-indigo-600">{stats.catalog.available_products}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Redis Status</span>
                <span className={`flex items-center gap-1 font-semibold ${stats.redis.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.redis.connected ? (
                    <><CheckCircle className="h-4 w-4" /> Connected</>
                  ) : (
                    <><AlertCircle className="h-4 w-4" /> Offline</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Cache Keys</span>
                <span className="text-lg font-bold text-teal-600">{stats.redis.keys_count}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <span className="text-gray-600 font-medium">Memory Used</span>
                <span className="text-lg font-bold text-emerald-600">{stats.redis.memory_used}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(recentMerchants.length > 0 || recentOffers.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {recentMerchants.length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5" />
                  Recent Merchants
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="space-y-3">
                  {recentMerchants.map((merchant) => (
                    <div key={merchant.id} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {merchant.logo_url ? (
                        <img 
                          src={merchant.logo_url} 
                          alt={merchant.name}
                          className="w-12 h-12 rounded-lg object-contain border bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold ${merchant.logo_url ? 'hidden' : ''}`}>
                        {merchant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{merchant.name}</p>
                        <p className={`text-xs ${merchant.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {merchant.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Link href={`/admin/merchants`}>
                        <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {recentOffers.length > 0 && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5" />
                  Recent Offers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-gradient-to-br from-rose-50 to-pink-50">
                <div className="space-y-3">
                  {recentOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {offer.image_url ? (
                        <img 
                          src={offer.image_url} 
                          alt={offer.title}
                          className="w-12 h-12 rounded-lg object-cover border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center ${offer.image_url ? 'hidden' : ''}`}>
                        <Tag className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{offer.title}</p>
                        <p className="text-xs text-gray-500">{offer.merchant_name}</p>
                      </div>
                      <Link href={`/admin/offers`}>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-800 hover:bg-rose-100">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
