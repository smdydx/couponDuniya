"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthHydration() {
  useEffect(() => {
    // Trigger rehydration on mount
    useAuthStore.persist.rehydrate();
  }, []);

  return null;
}