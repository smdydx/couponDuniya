"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Copy, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const mockOffers = [
  { id: 1, title: "50% Off Electronics", merchant: "Amazon", type: "code", code: "ELEC50", active: true, verified: true, clicks: 1250, expires: "2024-12-31" },
  { id: 2, title: "Big Billion Days Extra 10%", merchant: "Flipkart", type: "code", code: "BBD10", active: true, verified: true, clicks: 2500, expires: "2024-11-30" },
  { id: 3, title: "Flat 40% Off Fashion", merchant: "Myntra", type: "deal", code: null, active: true, verified: false, clicks: 980, expires: "2024-12-15" },
  { id: 4, title: "30% Off First 3 Orders", merchant: "Swiggy", type: "code", code: "WELCOME30", active: false, verified: true, clicks: 1500, expires: "2024-12-01" },
];

export default function AdminOffersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOffers = mockOffers.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.merchant.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || o.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && o.active) ||
      (statusFilter === "inactive" && !o.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-muted-foreground">Manage coupons, deals, and cashback offers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Bulk Upload</Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Offer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search offers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="code">Coupon Code</SelectItem>
              <SelectItem value="deal">Deal</SelectItem>
              <SelectItem value="cashback">Cashback</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Offers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Offer</th>
                  <th className="p-4 text-left text-sm font-medium">Merchant</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">Code</th>
                  <th className="p-4 text-left text-sm font-medium">Clicks</th>
                  <th className="p-4 text-left text-sm font-medium">Expires</th>
                  <th className="p-4 text-left text-sm font-medium">Active</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{offer.title}</span>
                        {offer.verified && <Badge variant="success">Verified</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{offer.merchant}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{offer.type}</Badge>
                    </td>
                    <td className="p-4">
                      {offer.code ? (
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {offer.code}
                        </code>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4">{offer.clicks.toLocaleString()}</td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(offer.expires)}
                    </td>
                    <td className="p-4">
                      <Switch checked={offer.active} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Copy className="h-4 w-4" />
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
