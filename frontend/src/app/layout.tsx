import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MobileNav } from "@/components/layout/MobileNav";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 rounded bg-primary px-3 py-2 text-primary-foreground">
          Skip to main content
        </a>
        <div id="main-content">
          <Providers>{children}</Providers>
        </div>
        {/* Global mobile bottom nav so tabs remain consistent across routes */}
        <MobileNav />
      </body>
    </html>
  );
}
