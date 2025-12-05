"use client";

import { useState, useEffect } from "react";
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
  FolderOpen,
  ImageIcon,
  Network,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/uiStore";
import { ROUTES } from "@/lib/constants";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  children?: NavItem[];
}

const adminNavItems: NavItem[] = [
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
    title: "Categories",
    href: "/admin/categories",
    icon: FolderOpen,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: ImageIcon,
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
    title: "Referral",
    href: ROUTES.admin.referrals,
    icon: Network,
    children: [
      {
        title: "Referral List",
        href: ROUTES.admin.referrals,
        icon: Network,
      },
      {
        title: "Tree View",
        href: ROUTES.admin.referralTree,
        icon: GitBranch,
      },
    ],
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
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Referral"]);
  const pathname = usePathname();
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  if (!mounted) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-primary-foreground text-sm font-bold">
              BC
            </div>
            <span className="font-bold">Admin</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {isSidebarOpen && (
          <Link href={ROUTES.admin.dashboard} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-lg">
              BC
            </div>
            <span className="font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Admin</span>
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

      <nav className="flex flex-col gap-1 p-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
        {adminNavItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.title);
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isChildActive = hasChildren && item.children?.some(
            (child) => pathname === child.href || pathname.startsWith(child.href + "/")
          );
          const Icon = item.icon;

          if (hasChildren) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => isSidebarOpen && toggleExpand(item.title)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive || isChildActive
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    !isSidebarOpen && "justify-center px-2"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>
                {isSidebarOpen && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-200 pl-3">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildItemActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isChildItemActive
                              ? "bg-purple-100 text-purple-700 font-semibold"
                              : "text-muted-foreground hover:bg-purple-50 hover:text-purple-600"
                          )}
                        >
                          <ChildIcon className="h-4 w-4" />
                          <span>{child.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md"
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

      {isSidebarOpen && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
            <p className="text-xs text-muted-foreground">
              Need help? Check the{" "}
              <Link href="/admin/docs" className="text-purple-600 hover:underline font-medium">
                documentation
              </Link>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
