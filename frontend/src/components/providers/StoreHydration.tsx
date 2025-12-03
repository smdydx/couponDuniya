"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

interface StoreHydrationProps {
  children: React.ReactNode;
}

export function StoreHydration({ children }: StoreHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubAuth = useAuthStore.persist.onFinishHydration(() => {});
    const unsubCart = useCartStore.persist.onFinishHydration(() => {});
    
    useAuthStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
    
    setIsHydrated(true);
    
    return () => {
      unsubAuth();
      unsubCart();
    };
  }, []);

  if (!isHydrated) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
