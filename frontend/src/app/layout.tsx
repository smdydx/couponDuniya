"use client";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "BIDUA Coupons - Save with Coupons, Cashback & Gift Cards",
    template: "%s | BIDUA Coupons",
  },
  description:
    "Save money with verified coupons, earn cashback on every purchase, and buy discounted gift cards from your favorite brands.",
  keywords: [
    "coupons",
    "cashback",
    "gift cards",
    "deals",
    "discounts",
    "offers",
    "promo codes",
  ],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // If the user is authenticated, don't render the login page, redirect to dashboard instead.
  if (isAuthenticated && typeof window !== 'undefined' && window.location.pathname === '/login') {
    window.location.href = '/admin/dashboard';
    return null; // Prevent rendering anything
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} data-scroll-behavior="smooth">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 rounded bg-primary px-3 py-2 text-primary-foreground">
          Skip to main content
        </a>
        <Providers>
          <div id="main-content">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}