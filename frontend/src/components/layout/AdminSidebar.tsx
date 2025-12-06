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
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

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
    title: "Referrals",
    href: "/admin/referrals",
    icon: Network,
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

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        "w-64 lg:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        !isOpen && "lg:w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            BC
          </div>
          <span className={cn("font-bold transition-opacity", !isOpen && "lg:hidden")}>Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden lg:flex"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
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
                !isOpen && "lg:justify-center lg:px-2"
              )}
              title={!isOpen ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn("transition-opacity", !isOpen && "lg:hidden")}>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("absolute bottom-4 left-0 right-0 px-4 space-y-2", !isOpen && "lg:px-2")}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950",
            !isOpen && "lg:justify-center lg:px-2"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-5 w-5", isOpen ? "mr-3" : "lg:mr-0 mr-3")} />
          <span className={cn("transition-opacity", !isOpen && "lg:hidden")}>Logout</span>
        </Button>
        <div className={cn("rounded-lg border bg-muted/50 p-4", !isOpen && "lg:hidden")}>
          <p className="text-xs text-muted-foreground">
            Need help? Check the{" "}
            <Link href="/admin/docs" className="text-primary hover:underline">
              documentation
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}