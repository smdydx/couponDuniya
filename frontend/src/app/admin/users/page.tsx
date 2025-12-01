"use client";

import { useState } from "react";
import { Search, Eye, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "customer", orders: 12, wallet: 500, kyc: "verified", joined: "2024-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "customer", orders: 8, wallet: 1200, kyc: "pending", joined: "2024-02-20" },
  { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "customer", orders: 3, wallet: 150, kyc: "submitted", joined: "2024-03-10" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "admin", orders: 0, wallet: 0, kyc: "verified", joined: "2023-12-01" },
  { id: 5, name: "Charlie Lee", email: "charlie@example.com", role: "customer", orders: 25, wallet: 3500, kyc: "verified", joined: "2023-11-05" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">User</th>
                  <th className="p-4 text-left text-sm font-medium">Role</th>
                  <th className="p-4 text-left text-sm font-medium">Orders</th>
                  <th className="p-4 text-left text-sm font-medium">Wallet</th>
                  <th className="p-4 text-left text-sm font-medium">KYC</th>
                  <th className="p-4 text-left text-sm font-medium">Joined</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(user.name.split(" ")[0], user.name.split(" ")[1])}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">{user.orders}</td>
                    <td className="p-4">{formatCurrency(user.wallet)}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          user.kyc === "verified"
                            ? "success"
                            : user.kyc === "submitted"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {user.kyc}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(user.joined)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Ban className="h-4 w-4" />
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
