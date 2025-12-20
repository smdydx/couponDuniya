"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    User,
    CreditCard,
    Building2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import adminApi, { KYCRequest, KYCStats, Pagination } from "@/lib/api/admin";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function AdminKYCPage() {
    const [activeTab, setActiveTab] = useState("pending");
    const [requests, setRequests] = useState<KYCRequest[]>([]);
    const [stats, setStats] = useState<KYCStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
    const [verifyAction, setVerifyAction] = useState<"approve" | "reject">("approve");
    const [verifyNotes, setVerifyNotes] = useState("");
    const [verifying, setVerifying] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await adminApi.getKYCStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch KYC stats:", error);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getKYCRequests({
                page,
                limit: 20,
                status: activeTab,
            });
            setRequests(data.kyc_requests || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Failed to fetch KYC requests:", error);
            toast.error("Failed to load KYC requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [page, activeTab]);

    const handleVerify = async () => {
        if (!selectedRequest) return;

        setVerifying(true);
        try {
            await adminApi.verifyKYCRequest(selectedRequest.id, verifyAction, verifyNotes || undefined);
            toast.success(`KYC request ${verifyAction}ed successfully`);
            setVerifyDialogOpen(false);
            fetchRequests();
            fetchStats();
            setSelectedRequest(null);
            setVerifyNotes("");
        } catch (error) {
            console.error("Verification failed:", error);
            toast.error(`Failed to ${verifyAction} request`);
        } finally {
            setVerifying(false);
        }
    };

    const openVerifyDialog = (request: KYCRequest, action: "approve" | "reject") => {
        setSelectedRequest(request);
        setVerifyAction(action);
        setVerifyNotes("");
        setVerifyDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">KYC Verification</h1>
                    <p className="text-muted-foreground">
                        Manage user identity and bank account verification requests
                    </p>
                </div>
                <Button onClick={() => { fetchRequests(); fetchStats(); }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved}</div>
                        <p className="text-xs text-muted-foreground">Verified users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected}</div>
                        <p className="text-xs text-muted-foreground">Verification failed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="space-y-4 p-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-[250px]" />
                                                <Skeleton className="h-4 w-[200px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Shield className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No {activeTab} requests</h3>
                                    <p className="text-muted-foreground">
                                        There are no KYC requests in this category.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative w-full overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Documents</TableHead>
                                                <TableHead>Bank Details</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                                <User className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{request.user?.full_name || "Unknown User"}</div>
                                                                <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                                                                {request.user?.mobile && (
                                                                    <div className="text-xs text-muted-foreground">{request.user.mobile}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Badge variant="outline" className="w-16 justify-center">PAN</Badge>
                                                                <span className={request.pan_number ? "" : "text-muted-foreground italic"}>
                                                                    {request.pan_number || "Not provided"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Badge variant="outline" className="w-16 justify-center">Aadhaar</Badge>
                                                                <span className={request.aadhaar_number ? "" : "text-muted-foreground italic"}>
                                                                    {request.aadhaar_number || "Not provided"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-medium">{request.bank_name || "Unknown Bank"}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Acc: {request.account_number || "-"}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                IFSC: {request.ifsc_code || "-"}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Name: {request.account_holder_name || "-"}
                                                            </div>
                                                            {request.upi_id && (
                                                                <div className="flex items-center gap-1 text-xs mt-1">
                                                                    <Badge variant="secondary" className="text-[10px] h-4">UPI</Badge>
                                                                    {request.upi_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {request.submitted_at ? new Date(request.submitted_at).toLocaleDateString() : "-"}
                                                        <div className="text-xs">
                                                            {request.submitted_at ? new Date(request.submitted_at).toLocaleTimeString() : ""}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {request.status === "pending" && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => openVerifyDialog(request, "approve")}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => openVerifyDialog(request, "reject")}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {request.status !== "pending" && (
                                                            <Badge variant={request.status === "approved" ? "success" : "destructive"}>
                                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {pagination && pagination.total_pages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * pagination.per_page + 1} to{" "}
                                {Math.min(page * pagination.per_page, pagination.total_items)} of{" "}
                                {pagination.total_items} requests
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                    Page {page} of {pagination.total_pages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                                    disabled={page === pagination.total_pages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {verifyAction === "approve" ? "Approve KYC Request" : "Reject KYC Request"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {verifyAction === "approve"
                                ? "Are you sure you want to approve this KYC request? The user will be able to process withdrawals."
                                : "Please provide a reason for rejecting this request."}
                        </p>

                        <div className="space-y-2">
                            <span className="text-sm font-medium">Admin Notes (Optional)</span>
                            <Textarea
                                value={verifyNotes}
                                onChange={(e) => setVerifyNotes(e.target.value)}
                                placeholder={verifyAction === "approve" ? "Verification note..." : "Reason for rejection..."}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={verifyAction === "approve" ? "default" : "destructive"}
                            className={verifyAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={handleVerify}
                            disabled={verifying}
                        >
                            {verifying ? "Processing..." : verifyAction === "approve" ? "Approve Request" : "Reject Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
