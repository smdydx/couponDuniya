"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StoreHydration } from "@/components/providers/StoreHydration";
import { AuthHydration } from "@/components/providers/AuthHydration";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(savedTheme);

    useAuthStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Unregister all service workers to prevent caching issues
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StoreHydration />
      <AuthHydration />
      {children}
      {mounted && <CartDrawer />}
    </QueryClientProvider>
  );
}