"use client";

import { useEffect, useRef, useCallback } from "react";
import { authAPI } from "@/lib/api/auth";

const VERIFICATION_CHANNEL = "email_verification";
const VERIFICATION_STORAGE_KEY = "email_verified";
const POLL_INTERVAL = 5000;

interface VerificationSyncOptions {
  email: string;
  onVerified: () => void;
  enabled?: boolean;
}

export function useVerificationSync({ email, onVerified, enabled = true }: VerificationSyncOptions) {
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const hasNotified = useRef(false);

  const handleVerified = useCallback(() => {
    if (hasNotified.current) return;
    hasNotified.current = true;
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    if (!enabled || !email) return;

    // Setup BroadcastChannel for cross-tab communication
    try {
      broadcastChannel.current = new BroadcastChannel(VERIFICATION_CHANNEL);
      broadcastChannel.current.onmessage = (event) => {
        if (event.data?.email === email && event.data?.verified) {
          handleVerified();
        }
      };
    } catch (e) {
      console.log("BroadcastChannel not supported, using localStorage fallback");
    }

    // Setup localStorage listener for cross-tab communication fallback
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VERIFICATION_STORAGE_KEY) {
        try {
          const data = JSON.parse(event.newValue || "{}");
          if (data.email === email && data.verified) {
            handleVerified();
          }
        } catch (e) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Poll server to check verification status
    pollInterval.current = setInterval(async () => {
      if (hasNotified.current) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        return;
      }

      try {
        const response = await authAPI.checkVerificationStatus(email);
        if (response?.data?.is_verified) {
          handleVerified();
        }
      } catch (e) {
        // Silently fail - this is just polling
      }
    }, POLL_INTERVAL);

    // Do an initial check immediately
    (async () => {
      try {
        const response = await authAPI.checkVerificationStatus(email);
        if (response?.data?.is_verified) {
          handleVerified();
        }
      } catch (e) {
        // Silently fail
      }
    })();

    return () => {
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
      }
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [email, enabled, handleVerified]);
}

export function broadcastVerification(email: string) {
  // Use BroadcastChannel for modern browsers
  try {
    const channel = new BroadcastChannel(VERIFICATION_CHANNEL);
    channel.postMessage({ email, verified: true, timestamp: Date.now() });
    channel.close();
  } catch (e) {
    console.log("BroadcastChannel not supported, using localStorage");
  }

  // Use localStorage as fallback and for cross-tab sync
  try {
    const data = { email, verified: true, timestamp: Date.now() };
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(data));
    
    // Trigger storage event by setting a slightly different value
    setTimeout(() => {
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    }, 10);
  } catch (e) {
    console.error("Failed to set localStorage:", e);
  }
}
