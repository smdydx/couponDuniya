"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { cn } from "@/lib/utils";
import { Bell, Search, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";

const mockAdminUser = {
  id: 1,
  first_name: "Admin",
  last_name: "User",
  email: "admin@example.com",
  role: "super_admin" as const,
  avatar_url: "",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mockAdminUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Mobile Sidebar Overlay */}
      {mounted && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/30 bg-white/80 backdrop-blur-md px-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search..." className="pl-10 bg-gray-50 border-gray-200" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-blue-100">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>

            {user && (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-purple-400">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-800">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role?.replace("_", " ") || "User"}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="hover:bg-red-100" onClick={() => {}}>
                  <LogOut className="h-5 w-5 text-gray-600" />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}