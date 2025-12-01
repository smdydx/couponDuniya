"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Tag,
  Gift,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";
import { ROUTES } from "@/lib/constants";

const adminNavItems = [
  {
    title: "Dashboard",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "Merchants",
    href: ROUTES.admin.merchants,
    icon: Store,
  },
  {
    title: "Offers",
    href: ROUTES.admin.offers,
    icon: Tag,
  },
  {
    title: "Products",
    href: ROUTES.admin.products,
    icon: Gift,
  },
  {
    title: "Orders",
    href: ROUTES.admin.orders,
    icon: ShoppingCart,
  },
  {
    title: "Users",
    href: ROUTES.admin.users,
    icon: Users,
  },
  {
    title: "Withdrawals",
    href: ROUTES.admin.withdrawals,
    icon: Wallet,
  },
  {
    title: "Queues",
    href: ROUTES.admin.queues,
    icon: FileText,
  },
  {
    title: "Gift Cards",
    href: ROUTES.admin.giftCards,
    icon: Gift,
  },
  {
    title: "CMS",
    href: ROUTES.admin.cms,
    icon: FileText,
  },
  {
    title: "Analytics",
    href: ROUTES.admin.analytics,
    icon: BarChart3,
  },
  {
    title: "Access Control",
    href: "/admin/access",
    icon: Shield,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {isSidebarOpen && (
          <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              BC
            </div>
            <span className="font-bold">Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                !isSidebarOpen && "justify-center px-2"
              )}
              title={!isSidebarOpen ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      {isSidebarOpen && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              Need help? Check the{" "}
              <Link href="/admin/docs" className="text-primary hover:underline">
                documentation
              </Link>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
