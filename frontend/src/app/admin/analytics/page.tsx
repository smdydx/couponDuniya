"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Store,
  Tag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import adminApi, { DashboardStats, RevenueSeries } from "@/lib/api/admin";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenueSeries[]>([]);
  const [topMerchants, setTopMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardData, revenueData, merchantsData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRevenueAnalytics(period),
        adminApi.getTopMerchants(10),
      ]);
      setStats(dashboardData);
      setRevenueSeries(revenueData.series || []);
      setTopMerchants(merchantsData.merchants || []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-32" />
                <Skeleton className="mt-2 h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = revenueSeries.reduce((sum, r) => sum + r.revenue, 0);
  const totalOrders = revenueSeries.reduce((sum, r) => sum + r.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            View performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={period === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(7)}
          >
            7 Days
          </Button>
          <Button
            variant={period === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(30)}
          >
            30 Days
          </Button>
          <Button
            variant={period === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(90)}
          >
            90 Days
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="merchants">Merchants</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    +12.5%
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold">{formatCurrency(stats?.revenue?.total || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(stats?.revenue?.today || 0)} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    +8.2%
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold">{(stats?.orders?.total || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.orders?.today || 0} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <ArrowUpRight className="h-4 w-4" />
                    +15.3%
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold">{(stats?.users?.total || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.users?.new_this_week || 0} new this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last {period} days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend ({period} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueSeries.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex h-[250px] items-end gap-1">
                      {revenueSeries.slice(-14).map((item, index) => {
                        const maxRevenue = Math.max(...revenueSeries.map(r => r.revenue), 1);
                        const height = (item.revenue / maxRevenue) * 100;
                        return (
                          <div key={index} className="flex flex-1 flex-col items-center gap-2">
                            <div
                              className="w-full rounded-t-sm bg-primary transition-all hover:bg-primary/80"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${formatCurrency(item.revenue)} - ${item.orders} orders on ${item.date}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Period Total: {formatCurrency(totalRevenue)}
                      </span>
                      <span className="text-muted-foreground">
                        {totalOrders} orders
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catalog Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                        <Store className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-medium">Active Merchants</p>
                        <p className="text-sm text-muted-foreground">Partner stores</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{stats?.catalog?.active_merchants || 0}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                        <Tag className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <p className="font-medium">Active Offers</p>
                        <p className="text-sm text-muted-foreground">Coupons & deals</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{stats?.catalog?.active_offers || 0}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                        <Package className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium">Available Products</p>
                        <p className="text-sm text-muted-foreground">Gift cards</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{stats?.catalog?.available_products || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Period Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Period Orders</p>
                <p className="text-3xl font-bold">{totalOrders.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Last {period} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(totalRevenue / period)}</p>
                <p className="text-sm text-muted-foreground mt-1">Per day average</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {revenueSeries.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.revenue)}</p>
                  </div>
                ))}
                {revenueSeries.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merchants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Merchants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMerchants.map((merchant, index) => (
                  <div
                    key={merchant.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-3">
                        {merchant.logo_url ? (
                          <img
                            src={merchant.logo_url}
                            alt={merchant.name}
                            className="h-10 w-10 rounded-lg object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{merchant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {merchant.order_count} orders
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(merchant.total_revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
                {topMerchants.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No merchant data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Store className="h-7 w-7 text-indigo-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.catalog?.active_merchants || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Merchants</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pink-500/10">
                  <Tag className="h-7 w-7 text-pink-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.catalog?.active_offers || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Offers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Package className="h-7 w-7 text-cyan-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.catalog?.available_products || 0}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
