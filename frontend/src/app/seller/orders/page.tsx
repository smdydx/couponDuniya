"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import apiClient from "@/lib/api/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get("/seller/orders", { params: { page, limit: 20 } });
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            processing: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status.toLowerCase()] || "bg-gray-100"}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <p className="text-muted-foreground">View orders for your products</p>
            </div>

            <div className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            {/* <TableHead className="text-right">Actions</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No orders found</TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                    <TableCell>{order.user_id ? `User #${order.user_id}` : 'Guest'}</TableCell>
                                    <TableCell>{formatDateTime(order.created_at)}</TableCell>
                                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                    {/* <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell> */}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {pagination && pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
                        <span className="text-sm text-gray-500">
                            Page {pagination.current_page} of {pagination.total_pages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                                disabled={page === pagination.total_pages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
