"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthHydration() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // 1. Initial rehydration on mount
    useAuthStore.persist.rehydrate();

    // 2. Listen for storage changes from other tabs to sync auth state
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-storage') {
        console.log("[AuthHydration] Auth storage changed in another tab, rehydrating...");
        useAuthStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return null;
}