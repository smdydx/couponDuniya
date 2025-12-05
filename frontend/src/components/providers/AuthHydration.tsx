
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthHydration() {
  useEffect(() => {
    // Hydrate the auth store from localStorage
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const data = JSON.parse(authStorage);
        console.log("Hydrating auth store with:", data);
      } catch (error) {
        console.error("Failed to hydrate auth store:", error);
      }
    }
  }, []);

  return null;
}
