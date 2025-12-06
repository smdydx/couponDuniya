
"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, RefreshCw, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { ImageUploader } from "@/components/admin";
import apiClient from "@/lib/api/client";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    banner_type: "hero",
    image_url: "",
    brand_name: "",
    badge_text: "",
    badge_color: "bg-orange-500 text-white",
    headline: "",
    description: "",
    code: "",
    metadata: "",
    link_url: "",
    order_index: 0,
    is_active: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/banners');
      setBanners(response.data?.data?.banners || []);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      banner_type: "hero",
      image_url: "",
      brand_name: "",
      badge_text: "",
      badge_color: "bg-orange-500 text-white",
      headline: "",
      description: "",
      code: "",
      metadata: '{"gradient": "from-purple-500 to-blue-600", "emoji": "🎁"}',
      link_url: "",
      order_index: banners.length,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      banner_type: (banner as any).banner_type || "hero",
      image_url: banner.image_url || "",
      brand_name: (banner as any).brand_name || "",
      badge_text: (banner as any).badge_text || "",
      badge_color: (banner as any).badge_color || "bg-orange-500 text-white",
      headline: (banner as any).headline || "",
      description: (banner as any).description || "",
      code: (banner as any).code || "",
      metadata: (banner as any).metadata || '{"gradient": "from-purple-500 to-blue-600", "emoji": "🎁"}',
      link_url: banner.link_url || "",
      order_index: banner.order_index,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) return;

    setSaving(true);
    try {
      if (editingBanner) {
        await apiClient.put(`/admin/banners/${editingBanner.id}`, formData);
      } else {
        await apiClient.post('/admin/banners', formData);
      }
      setDialogOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("Failed to save banner:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (bannerId: number, direction: 'up' | 'down') => {
    try {
      await apiClient.patch(`/admin/banners/${bannerId}/reorder`, { direction });
      fetchBanners();
    } catch (error) {
      console.error("Failed to reorder banner:", error);
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      await apiClient.delete(`/admin/banners/${bannerId}`);
      fetchBanners();
    } catch (error) {
      console.error("Failed to delete banner:", error);
    }
  };

  const filteredBanners = banners.filter((banner) =>
    search ? banner.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homepage Banners</h1>
          <p className="text-muted-foreground">
            Manage hero banners and promotional slides
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search banners..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={fetchBanners}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-20 w-32 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-2 h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No banners found</h3>
              <p className="text-muted-foreground">
                {search ? "Try a different search term" : "Get started by adding a banner"}
              </p>
              {!search && (
                <Button className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Banner
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banner</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner, index) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="h-16 w-24 rounded-lg object-cover object-center bg-muted"
                          />
                          <div>
                            <p className="font-medium">{banner.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {banner.link_url ? (
                          <a
                            href={banner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate max-w-[200px] block"
                          >
                            {banner.link_url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">No link</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{banner.order_index}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(banner.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(banner.id, 'down')}
                            disabled={index === filteredBanners.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={banner.is_active ? "success" : "secondary"}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(banner.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingBanner ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="banner_type" className="text-sm font-medium">Banner Type *</Label>
              <select
                id="banner_type"
                value={formData.banner_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, banner_type: e.target.value }))
                }
                className="h-11 px-3 rounded-md border border-gray-200"
              >
                <option value="hero">Hero Banner (Main Slider)</option>
                <option value="promo">Promotional Card</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter banner title"
                className="h-11"
              />
            </div>

            {formData.banner_type === "hero" ? (
              <ImageUploader
                label="Banner Image *"
                value={formData.image_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
                category="banners"
                aspectRatio="banner"
              />
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="brand_name" className="text-sm font-medium">Brand Name *</Label>
                  <Input
                    id="brand_name"
                    value={formData.brand_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, brand_name: e.target.value }))
                    }
                    placeholder="e.g., Swiggy, Zomato"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="badge_text" className="text-sm font-medium">Badge Text</Label>
                    <Input
                      id="badge_text"
                      value={formData.badge_text}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, badge_text: e.target.value }))
                      }
                      placeholder="Exclusive"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badge_color" className="text-sm font-medium">Badge Color</Label>
                    <Input
                      id="badge_color"
                      value={formData.badge_color}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, badge_color: e.target.value }))
                      }
                      placeholder="bg-orange-500 text-white"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="headline" className="text-sm font-medium">Headline *</Label>
                  <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, headline: e.target.value }))
                    }
                    placeholder="Flat 50% Off"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="On Your First Food Order"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="code" className="text-sm font-medium">Coupon Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="Use Code: SAVE50"
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="metadata" className="text-sm font-medium">Styling (JSON)</Label>
                  <textarea
                    id="metadata"
                    value={formData.metadata}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metadata: e.target.value }))
                    }
                    placeholder='{"gradient": "from-purple-500 to-blue-600", "emoji": "🎁"}'
                    className="h-20 px-3 py-2 rounded-md border border-gray-200 font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500">
                    Example gradients: from-blue-500 to-blue-600, from-red-500 to-red-600
                  </p>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="link_url" className="text-sm font-medium">Link URL (optional)</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                }
                placeholder="https://example.com"
                className="h-11"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 bg-gray-50/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-gray-500">
                  Show this banner on the homepage
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
              disabled={
                saving || 
                !formData.title || 
                (formData.banner_type === "hero" && !formData.image_url) ||
                (formData.banner_type === "promo" && (!formData.brand_name || !formData.headline))
              }
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? "Saving..." : editingBanner ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
