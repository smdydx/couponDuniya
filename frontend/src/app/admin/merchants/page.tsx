"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Mock data
const mockMerchants = [
  { id: 1, name: "Amazon", slug: "amazon", cashback: 10, offers: 45, active: true, featured: true },
  { id: 2, name: "Flipkart", slug: "flipkart", cashback: 8, offers: 32, active: true, featured: true },
  { id: 3, name: "Myntra", slug: "myntra", cashback: 12, offers: 28, active: true, featured: false },
  { id: 4, name: "Swiggy", slug: "swiggy", cashback: 5, offers: 18, active: true, featured: true },
  { id: 5, name: "Zomato", slug: "zomato", cashback: 6, offers: 15, active: false, featured: false },
];

export default function AdminMerchantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMerchants = mockMerchants.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && m.active) ||
      (statusFilter === "inactive" && !m.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Merchants</h1>
          <p className="text-muted-foreground">Manage partner stores and their settings</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Merchant
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Merchants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Merchant</th>
                  <th className="p-4 text-left text-sm font-medium">Slug</th>
                  <th className="p-4 text-left text-sm font-medium">Cashback</th>
                  <th className="p-4 text-left text-sm font-medium">Offers</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Featured</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold">
                          {merchant.name.charAt(0)}
                        </div>
                        <span className="font-medium">{merchant.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{merchant.slug}</td>
                    <td className="p-4">
                      <Badge variant="success">Up to {merchant.cashback}%</Badge>
                    </td>
                    <td className="p-4">{merchant.offers} offers</td>
                    <td className="p-4">
                      <Switch checked={merchant.active} />
                    </td>
                    <td className="p-4">
                      <Switch checked={merchant.featured} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
