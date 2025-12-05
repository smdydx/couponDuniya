"use client";

import { useState } from "react";
import { RefreshCw, Database, Server, Globe, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/api/client";

interface CacheItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
  color: string;
}

const cacheItems: CacheItem[] = [
  {
    id: "all",
    name: "All Caches",
    description: "Clear all application caches at once",
    icon: Database,
    endpoint: "/admin/cache/clear-all",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "categories",
    name: "Categories Cache",
    description: "Refresh category listings and navigation",
    icon: Globe,
    endpoint: "/admin/cache/clear/categories",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "merchants",
    name: "Merchants Cache",
    description: "Refresh merchant data and listings",
    icon: Server,
    endpoint: "/admin/cache/clear/merchants",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "offers",
    name: "Offers Cache",
    description: "Refresh coupon and offer data",
    icon: RefreshCw,
    endpoint: "/admin/cache/clear/offers",
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "products",
    name: "Products Cache",
    description: "Refresh product and gift card data",
    icon: Database,
    endpoint: "/admin/cache/clear/products",
    color: "from-pink-500 to-rose-500",
  },
];

export default function RefreshCachePage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleRefresh = async (item: CacheItem) => {
    setRefreshing(item.id);
    try {
      const response = await apiClient.post(item.endpoint);
      setResults(prev => ({
        ...prev,
        [item.id]: { 
          success: true, 
          message: response.data?.message || `${item.name} cleared successfully!` 
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [item.id]: { 
          success: false, 
          message: error.message || `Failed to clear ${item.name}` 
        }
      }));
    } finally {
      setRefreshing(null);
    }
  };

  const handleRefreshAll = async () => {
    for (const item of cacheItems) {
      await handleRefresh(item);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Refresh Cache
          </h1>
          <p className="text-gray-500 mt-1">
            Clear application caches to refresh data across the platform
          </p>
        </div>
        <Button 
          onClick={handleRefreshAll}
          disabled={refreshing !== null}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh All Caches
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cacheItems.map((item) => {
          const Icon = item.icon;
          const result = results[item.id];
          const isRefreshing = refreshing === item.id;

          return (
            <Card 
              key={item.id} 
              className={`border-0 shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                result?.success ? 'ring-2 ring-green-500/50' : ''
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${item.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {result && (
                    <Badge className={result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {result.success ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Success</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Failed</>
                      )}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleRefresh(item)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Cache
                    </>
                  )}
                </Button>
                {result && (
                  <p className={`mt-2 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Cache Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <p className="text-sm text-gray-500">Cache Type</p>
              <p className="text-lg font-semibold text-purple-700">Redis / Memory</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <p className="text-sm text-gray-500">Auto Refresh</p>
              <p className="text-lg font-semibold text-blue-700">Every 5 minutes</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-emerald-700">Operational</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
