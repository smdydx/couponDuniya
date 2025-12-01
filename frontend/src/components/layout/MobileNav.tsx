"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, Store, MoreHorizontal, Gift, User, Wallet, Info, HelpCircle, FileText, Shield, Receipt, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ROUTES, CATEGORIES } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

const primaryItems = [
  { title: "Home", href: ROUTES.home, icon: Home },
  { title: "Coupons", href: ROUTES.coupons, icon: Tag },
  { title: "Stores", href: ROUTES.merchants, icon: Store },
];

const baseMoreItems = [
  { title: "Gift Cards", href: ROUTES.products, icon: Gift },
  { title: "Earn Cashback", href: ROUTES.wallet, icon: Wallet },
  { title: "About", href: ROUTES.about, icon: Info },
  { title: "How It Works", href: ROUTES.howItWorks, icon: Info },
  { title: "FAQ", href: ROUTES.faq, icon: HelpCircle },
  { title: "Terms", href: ROUTES.terms, icon: FileText },
  { title: "Privacy", href: ROUTES.privacy, icon: Shield },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [moreOpen, setMoreOpen] = useState(false);

  // Lock body scroll while the More menu is open
  useEffect(() => {
    if (moreOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [moreOpen]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        <div className="flex h-16 items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 text-xs",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
            aria-label="More menu"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col pt-10 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm"
          style={{ paddingBottom: `calc(5rem + env(safe-area-inset-bottom))` }}
        >
          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-4 animate-more-menu">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">More</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-accent shadow-sm"
                aria-label="Close more menu"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                isAuthenticated
                  ? [
                      { title: user?.first_name ? `Hi, ${user.first_name}` : "Account", href: ROUTES.profile, icon: Settings },
                      { title: "My Orders", href: ROUTES.orders, icon: Receipt },
                      { title: "Referrals", href: ROUTES.referrals, icon: Gift },
                      ...baseMoreItems,
                    ]
                  : [
                      { title: "Login", href: ROUTES.login, icon: User },
                      { title: "Sign Up", href: ROUTES.register, icon: User },
                      ...baseMoreItems,
                    ]
              ).map((item) => {
                const Icon = item.icon as any;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="group flex flex-col items-start gap-2 rounded-xl border p-3 text-xs hover:bg-accent/60 hover:shadow-md transition-colors duration-150 bg-white/70 backdrop-blur-sm"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-foreground/80 group-hover:text-foreground">{item.title}</span>
                  </Link>
                );
              })}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    setMoreOpen(false);
                  }}
                  className="group flex flex-col items-start gap-2 rounded-xl border p-3 text-xs hover:bg-accent/60 hover:shadow-md transition-colors duration-150 bg-white/70 backdrop-blur-sm text-destructive"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive group-hover:bg-destructive/15">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
            <div className="mt-8">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Popular Categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(0,8).map(c => (
                  <Link key={c.id} href={`${ROUTES.coupons}?category=${c.slug}`} onClick={() => setMoreOpen(false)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-primary/10 bg-white/70 backdrop-blur-sm">
                    <span className="text-primary">{c.icon}</span> {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
