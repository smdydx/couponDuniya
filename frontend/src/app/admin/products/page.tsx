"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, RefreshCw, ChevronLeft, ChevronRight, Package, Box, DollarSign, TrendingUp, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import adminApi, { Product, Merchant, Pagination } from "@/lib/api/admin";
import { ImageUploader } from "@/components/admin";
import apiClient from "@/lib/api/client";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    merchant_id: 0,
    category_id: 0,
    name: "",
    slug: "",
    description: "",
    image_url: "",
    price: 0,
    stock: 0,
    is_active: true,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [productsData, merchantsData, categoriesResponse] = await Promise.all([
        adminApi.getProducts({ page, limit: 20, search: search || undefined }),
        adminApi.getMerchants({ limit: 100 }),
        apiClient.get('/categories/'),
      ]);
      setProducts(productsData.products || []);
      setPagination(productsData.pagination);
      setMerchants(merchantsData.merchants || []);
      
      // Handle categories response safely
      let catData = [];
      if (categoriesResponse?.data) {
        catData = categoriesResponse.data.data?.categories || 
                  categoriesResponse.data.categories || 
                  (Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      }
      setCategories(catData);
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      console.error("Error details:", error.response?.data || error.message);
      setProducts([]);
      setPagination(null);
      setMerchants([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      merchant_id: merchants[0]?.id || 0,
      category_id: categories[0]?.id || 0,
      name: "",
      slug: "",
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
      merchant_id: product.merchant_id,
      category_id: (product as any).category_id || 0,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price,
      stock: product.stock,
      is_active: product.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.merchant_id) return;

    setSaving(true);
    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, formData);
      } else {
        await adminApi.createProduct(formData);
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await apiClient.delete(`/admin/products/${deletingProduct.id}`);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getMerchantName = (merchantId: number) => {
    const merchant = merchants.find(m => m.id === merchantId);
    return merchant?.name || `Merchant #${merchantId}`;
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "-";
  };

  const filteredProducts = categoryFilter === "all" 
    ? products 
    : products.filter(p => String((p as any).category_id) === categoryFilter);

  const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const activeProducts = filteredProducts.filter(p => p.is_active).length;
  const outOfStock = filteredProducts.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-500 mt-1">
            Manage gift cards and product inventory
          </p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Products</p>
                <p className="text-3xl font-bold">{pagination?.total_items || 0}</p>
              </div>
              <Package className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Active Products</p>
                <p className="text-3xl font-bold">{activeProducts}</p>
              </div>
              <Box className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Out of Stock</p>
                <p className="text-3xl font-bold">{outOfStock}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Inventory Value</p>
                <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Product List
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchProducts}>
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
              <p className="text-gray-500 mt-1">
                {search ? "Try a different search term" : "Get started by adding a product"}
              </p>
              {!search && (
                <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Merchant</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Stock</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-blue-50/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover object-center border shadow-sm"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                                <Package className="h-6 w-6 text-blue-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800 line-clamp-1 max-w-[200px]">{product.name}</p>
                              <code className="text-xs text-gray-500">{product.slug}</code>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-gray-600">{getCategoryName((product as any).category_id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-700">{getMerchantName(product.merchant_id)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">{formatCurrency(product.price)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {product.stock} in stock
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.is_active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(product)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setDeletingProduct(product);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
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
                  <p className="text-sm text-gray-500">
                    Showing {filteredProducts.length} of {pagination.total_items} products
                    {categoryFilter !== "all" && " (filtered by category)"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm font-medium px-3">
                      Page {page} of {pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                      disabled={page === pagination.total_pages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="merchant" className="text-sm font-medium">Merchant *</Label>
                <Select
                  value={String(formData.merchant_id)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, merchant_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={String(merchant.id)}>
                        {merchant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <Select
                  value={String(formData.category_id)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                placeholder="Product name"
                className="h-11"
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
                placeholder="product-url-slug"
                className="h-11"
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
                placeholder="Product description"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock" className="text-sm font-medium">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className="h-11"
                />
              </div>
            </div>
            <ImageUploader
              label="Product Image"
              value={formData.image_url}
              onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
              category="products"
              aspectRatio="square"
            />
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-gray-500">
                  Show this product on the website
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.name || !formData.slug || !formData.merchant_id}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Product
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{deletingProduct?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
