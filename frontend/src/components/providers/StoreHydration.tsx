"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export function StoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      useAuthStore.persist.rehydrate();
      useCartStore.persist.rehydrate();
      setHydrated(true);
    }
  }, [hydrated]);

  return null;
}