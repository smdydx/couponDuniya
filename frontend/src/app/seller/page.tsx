"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import apiClient from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";

export default function SellerDashboard() {
    const [stats, setStats] = useState({
        total_products: 0,
        active_products: 0,
        total_orders: 0,
        total_revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await apiClient.get("/seller/stats");
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Products",
            value: stats.total_products,
            description: `${stats.active_products} active`,
            icon: Package,
            color: "text-blue-600",
        },
        {
            title: "Total Orders",
            value: stats.total_orders,
            description: "Lifetime orders",
            icon: ShoppingCart,
            color: "text-green-600",
        },
        {
            title: "Total Revenue",
            value: formatCurrency(stats.total_revenue),
            description: "Gross earnings",
            icon: DollarSign,
            color: "text-purple-600",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your store performance</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stat.description}
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
