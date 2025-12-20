"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, RefreshCw, ChevronLeft, ChevronRight, Package, Box, DollarSign, TrendingUp, FolderOpen, FileUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { ImageUploader } from "@/components/admin";
import apiClient from "@/lib/api/client";
import { Product, Pagination } from "@/lib/api/admin"; // Reuse types

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function SellerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkUploading, setBulkUploading] = useState(false);

    const [formData, setFormData] = useState({
        category_id: 0,
        name: "",
        description: "",
        image_url: "",
        price: 0,
        stock: 0,
        is_active: true,
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                apiClient.get("/seller/products", { params: { page, limit: 20, search } }),
                apiClient.get("/categories"),
            ]);
            setProducts(prodRes.data.products);
            setPagination(prodRes.data.pagination);
            setCategories(catRes.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, search]);

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setFormData({
            category_id: categories[0]?.id || 0,
            name: "",
            description: "",
            image_url: "",
            price: 0,
            stock: 0,
            is_active: true,
        });
        setDialogOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            category_id: (product as any).category_id || 0,
            name: product.name,
            description: product.description || "",
            image_url: product.image_url || "",
            price: product.price,
            stock: product.stock,
            is_active: product.is_active,
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append("name", formData.name);
            payload.append("price", String(formData.price));
            payload.append("stock", String(formData.stock));
            payload.append("description", formData.description);
            payload.append("category_id", String(formData.category_id));
            if (formData.image_url) payload.append("image_url", formData.image_url);
            payload.append("is_active", String(formData.is_active));

            if (editingProduct) {
                await apiClient.put(`/seller/products/${editingProduct.id}`, payload);
            } else {
                await apiClient.post("/seller/products", payload);
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save product:", error);
            alert("Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingProduct) return;
        try {
            await apiClient.delete(`/seller/products/${deletingProduct.id}`);
            setDeleteDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to delete product:", error);
            alert("Failed to delete product");
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setBulkUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', bulkFile);
            await apiClient.post('/seller/products/bulk', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBulkOpen(false);
            setBulkFile(null);
            fetchData();
            alert("Products uploaded successfully!");
        } catch (error: any) {
            console.error("Bulk upload failed:", error);
            alert(error.response?.data?.detail || "Upload failed");
        } finally {
            setBulkUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "name,category,price,stock,description,image_url,is_active";
        const blob = new Blob([headers], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "seller_products_template.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                    <p className="text-muted-foreground">Manage your product inventory</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkOpen(true)}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Bulk Upload
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={fetchData}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Stock</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No products found</td></tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded object-cover border" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                                                    <div className="text-xs text-gray-500">Slug: {product.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(product.price)}</td>
                                        <td className="px-4 py-3">{product.stock}</td>
                                        <td className="px-4 py-3">
                                            {categories.find(c => c.id === (product as any).category_id)?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                {product.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => { setDeletingProduct(product); setDeleteDialogOpen(true); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Logic */}
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

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wireless Headset" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={String(formData.category_id)}
                                    onValueChange={(val) => setFormData({ ...formData, category_id: parseInt(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="pl-8"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Stock</Label>
                                <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Product Image</Label>
                            <div className="border rounded-md p-4">
                                <ImageUploader
                                    value={formData.image_url}
                                    onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                    category="products"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch checked={formData.is_active} onCheckedChange={checked => setFormData({ ...formData, is_active: checked })} />
                            <Label>Active Status</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? "Saving..." : "Save Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this product? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bulk Upload Products</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Upload CSV file</p>
                            <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Template
                            </Button>
                        </div>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required: name <br />
                            Optional: category, price, stock, description, image_url
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading}>
                            {bulkUploading ? "Uploading..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
