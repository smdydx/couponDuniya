"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Wallet,
  Gift,
  Tag,
  Store,
  ChevronDown,
  LogOut,
  Settings,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useUIStore } from "@/store/uiStore";
import { ROUTES, SITE_NAME, CATEGORIES } from "@/lib/constants";
import { getInitials, formatCurrency } from "@/lib/utils";
import { SearchBar } from "@/components/common/SearchBar";

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const { toggleCartDrawer } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 hidden w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
      {/* Top Bar */}
      <div className="hidden border-b bg-primary text-primary-foreground md:block">
        <div className="container flex h-8 items-center justify-between text-xs">
          <p>Save up to 50% with exclusive coupons and cashback offers!</p>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.about} className="hover:underline">
              About Us
            </Link>
            <Link href={ROUTES.howItWorks} className="hover:underline">
              How It Works
            </Link>
            <Link href={ROUTES.faq} className="hover:underline">
              FAQ
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu removed in favor of bottom More tab */}

          {/* Logo */}
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <Image 
              src="/images/logos/logo.png" 
              alt={SITE_NAME}
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-xl md:block">
            <SearchBar />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCartDrawer}
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Auth / User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user.first_name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-background shadow-lg">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <hr className="my-2" />
                      <Link
                        href={ROUTES.wallet}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Wallet className="h-4 w-4" />
                        Wallet
                      </Link>
                      <Link
                        href={ROUTES.orders}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Receipt className="h-4 w-4" />
                        My Orders
                      </Link>
                      <Link
                        href={ROUTES.referrals}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Gift className="h-4 w-4" />
                        Referrals
                      </Link>
                      <Link
                        href={ROUTES.profile}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <hr className="my-2" />
                      <button
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href={ROUTES.register} className="hidden sm:block">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="hidden border-t md:block">
        <div className="container">
          <div className="flex h-12 items-center gap-6">
            {/* Categories Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowCategories(true)}
              onMouseLeave={() => setShowCategories(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                <Menu className="h-4 w-4" />
                Categories
                <ChevronDown className="h-4 w-4" />
              </button>
              {showCategories && (
                <div className="absolute left-0 top-full z-50 w-56 rounded-md border bg-background shadow-lg">
                  <div className="p-2">
                    {CATEGORIES.map((category) => (
                      <Link
                        key={category.id}
                        href={`${ROUTES.coupons}?category=${category.slug}`}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span>{category.icon}</span>
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={ROUTES.coupons}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              <Tag className="h-4 w-4" />
              Coupons & Deals
            </Link>

            <Link
              href={ROUTES.merchants}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              <Store className="h-4 w-4" />
              Stores
            </Link>

            <Link
              href={ROUTES.products}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              <Gift className="h-4 w-4" />
              Gift Cards
            </Link>

            <div className="ml-auto">
              <Link
                href={ROUTES.wallet}
                className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
              >
                <Wallet className="h-4 w-4" />
                Earn Cashback
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu removed; secondary links accessible via bottom More tab */}
    </header>
  );
}
