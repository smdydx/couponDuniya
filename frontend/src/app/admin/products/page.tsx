"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";

const mockProducts = [
  { id: 1, name: "Amazon Pay Gift Card", sku: "AMZN-GC-001", variants: 6, bestseller: true, active: true },
  { id: 2, name: "Flipkart Gift Card", sku: "FK-GC-001", variants: 4, bestseller: true, active: true },
  { id: 3, name: "Swiggy Gift Card", sku: "SWG-GC-001", variants: 3, bestseller: false, active: true },
  { id: 4, name: "Zomato Gift Card", sku: "ZMT-GC-001", variants: 3, bestseller: false, active: true },
  { id: 5, name: "Myntra Gift Card", sku: "MYN-GC-001", variants: 4, bestseller: true, active: false },
];

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gift Cards</h1>
          <p className="text-muted-foreground">Manage gift card products and variants</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Product</th>
                  <th className="p-4 text-left text-sm font-medium">SKU</th>
                  <th className="p-4 text-left text-sm font-medium">Variants</th>
                  <th className="p-4 text-left text-sm font-medium">Bestseller</th>
                  <th className="p-4 text-left text-sm font-medium">Active</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold">
                          {product.name.charAt(0)}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{product.sku}</td>
                    <td className="p-4">{product.variants} variants</td>
                    <td className="p-4">
                      <Switch checked={product.bestseller} />
                    </td>
                    <td className="p-4">
                      <Switch checked={product.active} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
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
