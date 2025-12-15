"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Store,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
} from "lucide-react";
import adminApi, { Merchant, Pagination, MerchantApplication } from "@/lib/api/admin";
import { ImageUploader } from "@/components/admin";

export default function AdminMerchantsPage() {
  const [activeTab, setActiveTab] = useState("merchants");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [applications, setApplications] = useState<MerchantApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [appPagination, setAppPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [appStatusFilter, setAppStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [appPage, setAppPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
    is_active: true,
    is_featured: false,
    is_verified: false,
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    business_city: "",
    business_state: "",
    business_pincode: "",
    business_country: "India",
    gst_number: "",
    pan_number: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_name: "",
    website_url: "",
    affiliate_url: "",
    tracking_url: "",
    commission_rate: 0,
    cashback_rate: 0,
    platform_commission: 10,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMerchant, setDeletingMerchant] = useState<Merchant | null>(null);

  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<MerchantApplication | null>(null);
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject">("approve");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMerchants({
        page,
        limit: 20,
        search: search || undefined,
        is_active: activeFilter,
      });
      setMerchants(data.merchants || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppLoading(true);
    try {
      const data = await adminApi.getPendingMerchantApplications({
        page: appPage,
        limit: 20,
        status: appStatusFilter,
      });
      setApplications(data.applications || []);
      setAppPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [page, activeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [appPage, appStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMerchants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingMerchant(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      banner_url: "",
      is_active: true,
      is_featured: false,
      is_verified: false,
      business_name: "",
      business_email: "",
      business_phone: "",
      business_address: "",
      business_city: "",
      business_state: "",
      business_pincode: "",
      business_country: "India",
      gst_number: "",
      pan_number: "",
      bank_account_name: "",
      bank_account_number: "",
      bank_ifsc_code: "",
      bank_name: "",
      website_url: "",
      affiliate_url: "",
      tracking_url: "",
      commission_rate: 0,
      cashback_rate: 0,
      platform_commission: 10,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setFormData({
      name: merchant.name,
      slug: merchant.slug,
      description: merchant.description || "",
      logo_url: merchant.logo_url || "",
      banner_url: merchant.banner_url || "",
      is_active: merchant.is_active,
      is_featured: merchant.is_featured || false,
      is_verified: merchant.is_verified || false,
      business_name: merchant.business_name || "",
      business_email: merchant.business_email || "",
      business_phone: merchant.business_phone || "",
      business_address: merchant.business_address || "",
      business_city: merchant.business_city || "",
      business_state: merchant.business_state || "",
      business_pincode: merchant.business_pincode || "",
      business_country: merchant.business_country || "India",
      gst_number: merchant.gst_number || "",
      pan_number: merchant.pan_number || "",
      bank_account_name: merchant.bank_account_name || "",
      bank_account_number: merchant.bank_account_number || "",
      bank_ifsc_code: merchant.bank_ifsc_code || "",
      bank_name: merchant.bank_name || "",
      website_url: merchant.website_url || "",
      affiliate_url: merchant.affiliate_url || "",
      tracking_url: merchant.tracking_url || "",
      commission_rate: merchant.commission_rate || 0,
      cashback_rate: merchant.cashback_rate || 0,
      platform_commission: merchant.platform_commission || 10,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;

    setSaving(true);
    try {
      if (editingMerchant) {
        await adminApi.updateMerchant(editingMerchant.id, formData);
      } else {
        await adminApi.createMerchant(formData);
      }
      setDialogOpen(false);
      fetchMerchants();
    } catch (error) {
      console.error("Failed to save merchant:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMerchant) return;

    try {
      await adminApi.deleteMerchant(deletingMerchant.id);
      setDeleteDialogOpen(false);
      setDeletingMerchant(null);
      fetchMerchants();
    } catch (error) {
      console.error("Failed to delete merchant:", error);
    }
  };

  const handleVerifyApplication = async () => {
    if (!selectedApplication) return;

    setVerifying(true);
    try {
      if (verifyAction === "approve") {
        await adminApi.approveMerchantApplication(selectedApplication.id, verifyNotes || undefined);
      } else {
        await adminApi.rejectMerchantApplication(selectedApplication.id, verifyNotes || undefined);
      }
      setVerifyDialogOpen(false);
      setSelectedApplication(null);
      setVerifyNotes("");
      fetchApplications();
      fetchMerchants();
    } catch (error) {
      console.error("Failed to verify application:", error);
    } finally {
      setVerifying(false);
    }
  };

  const openVerifyDialog = (application: MerchantApplication, action: "approve" | "reject") => {
    setSelectedApplication(application);
    setVerifyAction(action);
    setVerifyNotes("");
    setVerifyDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const pendingCount = applications.filter(a => a.merchant?.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Merchants</h1>
          <p className="text-muted-foreground">
            Manage your partner stores and verification requests
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Merchant
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="merchants">All Merchants</TabsTrigger>
          <TabsTrigger value="applications" className="relative">
            Verification Requests
            {appStatusFilter === "pending" && applications.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                {applications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search merchants..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeFilter === undefined ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(undefined)}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(true)}
                  >
                    Active
                  </Button>
                  <Button
                    variant={activeFilter === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(false)}
                  >
                    Inactive
                  </Button>
                  <Button variant="ghost" size="icon" onClick={fetchMerchants}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="mt-2 h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : merchants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No merchants found</h3>
                  <p className="text-muted-foreground">
                    {search ? "Try a different search term" : "Get started by adding a merchant"}
                  </p>
                  {!search && (
                    <Button className="mt-4" onClick={handleOpenCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Merchant
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {merchants.map((merchant) => (
                          <TableRow key={merchant.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {merchant.logo_url ? (
                                  <img
                                    src={merchant.logo_url}
                                    alt={merchant.name}
                                    className="h-10 w-10 rounded-lg object-cover object-center bg-muted"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                                    {merchant.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{merchant.name}</p>
                                  {merchant.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                      {merchant.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {merchant.slug}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant={merchant.is_active ? "success" : "secondary"}>
                                {merchant.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {merchant.is_featured && (
                                <Badge variant="info">Featured</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {merchant.created_at
                                ? new Date(merchant.created_at).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(merchant)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeletingMerchant(merchant);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {pagination && pagination.total_pages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * pagination.per_page + 1} to{" "}
                        {Math.min(page * pagination.per_page, pagination.total_items)} of{" "}
                        {pagination.total_items} merchants
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Merchant Verification Requests</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant={appStatusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setAppStatusFilter("pending"); setAppPage(1); }}
                  >
                    <Clock className="mr-1 h-4 w-4" />
                    Pending
                  </Button>
                  <Button
                    variant={appStatusFilter === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setAppStatusFilter("approved"); setAppPage(1); }}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approved
                  </Button>
                  <Button
                    variant={appStatusFilter === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setAppStatusFilter("rejected"); setAppPage(1); }}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Rejected
                  </Button>
                  <Button variant="ghost" size="icon" onClick={fetchApplications}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {appLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-6 w-48 mb-3" />
                      <Skeleton className="h-4 w-64 mb-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No {appStatusFilter} applications</h3>
                  <p className="text-muted-foreground">
                    {appStatusFilter === "pending" 
                      ? "All merchant applications have been reviewed"
                      : `No ${appStatusFilter} applications found`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                              {app.business_name?.charAt(0) || "M"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{app.business_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Applied: {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{app.business_email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{app.business_phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{app.business_city}, {app.business_state} - {app.business_pincode}</span>
                            </div>
                            {app.website_url && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {app.website_url}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {app.gst_number && (
                              <Badge variant="outline">GST: {app.gst_number}</Badge>
                            )}
                            {app.pan_number && (
                              <Badge variant="outline">PAN: {app.pan_number}</Badge>
                            )}
                            {app.user && (
                              <Badge variant="secondary">
                                <Building2 className="mr-1 h-3 w-3" />
                                {app.user.email}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {appStatusFilter === "pending" && (
                          <div className="flex gap-2 lg:flex-col">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex-1"
                              onClick={() => openVerifyDialog(app, "approve")}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openVerifyDialog(app, "reject")}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {appStatusFilter !== "pending" && (
                          <Badge 
                            variant={appStatusFilter === "approved" ? "success" : "destructive"}
                            className="h-fit"
                          >
                            {appStatusFilter === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {appPagination && appPagination.total_pages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {(appPage - 1) * appPagination.per_page + 1} to{" "}
                        {Math.min(appPage * appPagination.per_page, appPagination.total_items)} of{" "}
                        {appPagination.total_items} applications
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                          disabled={appPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {appPage} of {appPagination.total_pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppPage((p) => Math.min(appPagination.total_pages, p + 1))}
                          disabled={appPage === appPagination.total_pages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingMerchant ? "Edit Merchant" : "Add New Merchant"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Basic Information</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slug || generateSlug(name),
                      }));
                    }}
                    placeholder="Enter merchant name"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug" className="text-sm font-medium">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="merchant-url-slug"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description about the merchant"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website" className="text-sm font-medium">Website URL</Label>
                  <Input
                    id="website"
                    value={formData.website_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, website_url: e.target.value }))
                    }
                    placeholder="https://example.com"
                    className="h-10"
                  />
                </div>
                <ImageUploader
                  label="Logo (Square)"
                  value={formData.logo_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
                  category="merchants"
                  aspectRatio="square"
                />
                <ImageUploader
                  label="Banner (Wide)"
                  value={formData.banner_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, banner_url: url }))}
                  category="merchants"
                  aspectRatio="banner"
                />
              </div>
            </div>

            {/* Business Info */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Business Information</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="business_name" className="text-sm font-medium">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, business_name: e.target.value }))
                    }
                    placeholder="Official business name"
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="business_email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_email: e.target.value }))
                      }
                      placeholder="business@example.com"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="business_phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="business_phone"
                      value={formData.business_phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_phone: e.target.value }))
                      }
                      placeholder="+91-98765-43210"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business_address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, business_address: e.target.value }))
                    }
                    placeholder="Street address"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="business_city" className="text-sm font-medium">City</Label>
                    <Input
                      id="business_city"
                      value={formData.business_city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_city: e.target.value }))
                      }
                      placeholder="City"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="business_state" className="text-sm font-medium">State</Label>
                    <Input
                      id="business_state"
                      value={formData.business_state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_state: e.target.value }))
                      }
                      placeholder="State"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="business_pincode" className="text-sm font-medium">Pincode</Label>
                    <Input
                      id="business_pincode"
                      value={formData.business_pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_pincode: e.target.value }))
                      }
                      placeholder="PIN Code"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="business_country" className="text-sm font-medium">Country</Label>
                    <Input
                      id="business_country"
                      value={formData.business_country}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, business_country: e.target.value }))
                      }
                      placeholder="Country"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax & Compliance */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Tax & Compliance</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="gst" className="text-sm font-medium">GST Number</Label>
                  <Input
                    id="gst"
                    value={formData.gst_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, gst_number: e.target.value }))
                    }
                    placeholder="GST Number"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pan" className="text-sm font-medium">PAN Number</Label>
                  <Input
                    id="pan"
                    value={formData.pan_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pan_number: e.target.value }))
                    }
                    placeholder="PAN Number"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Bank Details</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="bank_name" className="text-sm font-medium">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bank_name: e.target.value }))
                    }
                    placeholder="Bank Name"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account_name" className="text-sm font-medium">Account Holder Name</Label>
                  <Input
                    id="account_name"
                    value={formData.bank_account_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bank_account_name: e.target.value }))
                    }
                    placeholder="Account holder name"
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="account_number" className="text-sm font-medium">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.bank_account_number}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bank_account_number: e.target.value }))
                      }
                      placeholder="Account number"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ifsc" className="text-sm font-medium">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      value={formData.bank_ifsc_code}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bank_ifsc_code: e.target.value }))
                      }
                      placeholder="IFSC Code"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commission & Rates */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Commission & Rates (%)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="commission" className="text-sm font-medium">Commission Rate</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    value={formData.commission_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cashback" className="text-sm font-medium">Cashback Rate</Label>
                  <Input
                    id="cashback"
                    type="number"
                    step="0.01"
                    value={formData.cashback_rate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cashback_rate: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platform" className="text-sm font-medium">Platform Commission</Label>
                  <Input
                    id="platform"
                    type="number"
                    step="0.01"
                    value={formData.platform_commission}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, platform_commission: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="10.00"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Affiliate URLs */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Affiliate & Tracking</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="affiliate_url" className="text-sm font-medium">Affiliate URL</Label>
                  <Input
                    id="affiliate_url"
                    value={formData.affiliate_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, affiliate_url: e.target.value }))
                    }
                    placeholder="https://affiliate.example.com"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tracking_url" className="text-sm font-medium">Tracking URL</Label>
                  <Input
                    id="tracking_url"
                    value={formData.tracking_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tracking_url: e.target.value }))
                    }
                    placeholder="https://tracking.example.com"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Status</h3>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Active</Label>
                  <p className="text-xs text-gray-500">Show on website</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Featured</Label>
                  <p className="text-xs text-gray-500">Homepage & featured sections</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_featured: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Verified</Label>
                  <p className="text-xs text-gray-500">Merchant verified status</p>
                </div>
                <Switch
                  checked={formData.is_verified}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_verified: checked }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.name || !formData.slug}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? "Saving..." : editingMerchant ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Merchant</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to deactivate{" "}
            <span className="font-medium text-foreground">
              {deletingMerchant?.name}
            </span>
            ? This will hide the merchant from the website but won&apos;t delete any
            associated data.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyAction === "approve" ? "Approve" : "Reject"} Merchant Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {verifyAction === "approve" 
                ? "Are you sure you want to approve this merchant application? The merchant will be activated and the user will become a verified merchant."
                : "Are you sure you want to reject this merchant application? Please provide a reason for rejection."}
            </p>
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{selectedApplication?.business_name}</p>
              <p className="text-sm text-muted-foreground">{selectedApplication?.business_email}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes {verifyAction === "reject" && "(Required)"}</Label>
              <Textarea
                id="notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={verifyAction === "approve" 
                  ? "Optional notes for the merchant..." 
                  : "Please provide a reason for rejection..."}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyApplication}
              disabled={verifying || (verifyAction === "reject" && !verifyNotes.trim())}
              className={verifyAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={verifyAction === "reject" ? "destructive" : "default"}
            >
              {verifying ? "Processing..." : verifyAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
