"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Gift,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  DollarSign,
  CreditCard,
  Users,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import adminApi, { GiftCard, Pagination } from "@/lib/api/admin";

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total_cards: 0,
    active_cards: 0,
    assigned_cards: 0,
    total_value: 0,
    redeemed_value: 0,
    available_value: 0,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    count: 10,
    value: 100,
    expires_in_days: 365,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<GiftCard | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsData, statsData] = await Promise.all([
        adminApi.getGiftCards({
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter,
        }),
        adminApi.getGiftCardStats(),
      ]);
      setGiftCards(cardsData.gift_cards || []);
      setPagination(cardsData.pagination);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch gift cards:", error);
      setGiftCards([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCards = async () => {
    setCreating(true);
    try {
      await adminApi.createGiftCardsBulk({
        count: createForm.count,
        value: createForm.value,
        expires_in_days: createForm.expires_in_days || undefined,
      });
      setCreateDialogOpen(false);
      setCreateForm({ count: 10, value: 100, expires_in_days: 365 });
      fetchData();
    } catch (error) {
      console.error("Failed to create gift cards:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;

    try {
      await adminApi.deleteGiftCard(deletingCard.id);
      setDeleteDialogOpen(false);
      setDeletingCard(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete gift card:", error);
    }
  };

  const getStatusBadge = (card: GiftCard) => {
    if (!card.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (card.remaining_value === 0) {
      return <Badge variant="destructive">Used</Badge>;
    }
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return <Badge variant="warning">Expired</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gift Cards</h1>
          <p className="text-muted-foreground">
            Create and manage gift card codes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Gift Cards
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Gift className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_cards}</p>
              <p className="text-sm text-muted-foreground">Total Cards</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <CreditCard className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active_cards}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.available_value)}</p>
              <p className="text-sm text-muted-foreground">Available Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Users className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.assigned_cards}</p>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "used" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("used")}
              >
                Used
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("expired")}
              >
                Expired
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchData}>
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
                  <Skeleton className="h-10 w-32" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-2 h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : giftCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No gift cards found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter ? "Try adjusting your filters" : "Create gift cards to get started"}
              </p>
              {!search && !statusFilter && (
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Gift Cards
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border flex items-center justify-center flex-shrink-0">
                              <Gift className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                                {card.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyCode(card.code)}
                              >
                                {copiedCode === card.code ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(card.initial_value)}
                        </TableCell>
                        <TableCell>
                          <span className={card.remaining_value === 0 ? "text-muted-foreground" : "font-medium"}>
                            {formatCurrency(card.remaining_value)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(card)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {card.expires_at
                            ? new Date(card.expires_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {card.created_at
                            ? new Date(card.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingCard(card);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
                    {pagination.total_items} gift cards
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Gift Cards</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="count">Number of Cards *</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="1000"
                value={createForm.count}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, count: parseInt(e.target.value) || 1 }))
                }
              />
              <p className="text-xs text-muted-foreground">Maximum 1000 cards at once</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value per Card (INR) *</Label>
              <Input
                id="value"
                type="number"
                min="1"
                step="1"
                value={createForm.value}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expires">Expires In (Days)</Label>
              <Input
                id="expires"
                type="number"
                min="0"
                value={createForm.expires_in_days}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, expires_in_days: parseInt(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-muted-foreground">Leave 0 for no expiry</p>
            </div>
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm font-medium">Summary</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Total Cards:</span>
                <span className="font-medium">{createForm.count}</span>
                <span className="text-muted-foreground">Value Each:</span>
                <span className="font-medium">{formatCurrency(createForm.value)}</span>
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-semibold">{formatCurrency(createForm.count * createForm.value)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCards} disabled={creating || createForm.count < 1 || createForm.value < 1}>
              {creating ? "Creating..." : `Create ${createForm.count} Cards`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Gift Card</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to deactivate gift card{" "}
            <code className="rounded bg-muted px-2 py-1 font-mono">
              {deletingCard?.code}
            </code>
            ? This will prevent it from being used.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCard}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
