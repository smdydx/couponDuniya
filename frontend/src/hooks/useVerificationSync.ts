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
    if (hasNotified.current) {
      console.log("Already notified, skipping");
      return;
    }
    console.log("Email verified detected! Triggering callback...");
    hasNotified.current = true;
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    if (!enabled || !email) return;

    // Setup BroadcastChannel for cross-tab communication
    try {
      broadcastChannel.current = new BroadcastChannel(VERIFICATION_CHANNEL);
      broadcastChannel.current.onmessage = (event) => {
        console.log("BroadcastChannel message received:", event.data);
        if (event.data?.email === email && event.data?.verified) {
          console.log("Email verified via BroadcastChannel!");
          handleVerified();
        }
      };
      console.log("BroadcastChannel listener set up for:", email);
    } catch (e) {
      console.log("BroadcastChannel not supported, using localStorage fallback");
    }

    // Setup localStorage listener for cross-tab communication fallback
    const handleStorageChange = (event: StorageEvent) => {
      console.log("Storage event:", event.key, event.newValue);
      if (event.key === VERIFICATION_STORAGE_KEY) {
        try {
          const data = JSON.parse(event.newValue || "{}");
          console.log("Parsed storage data:", data);
          if (data.email === email && data.verified) {
            console.log("Email verified via localStorage!");
            handleVerified();
          }
        } catch (e) {
          console.error("Failed to parse storage data:", e);
        }
      }
    };
    console.log("Storage listener set up for:", email);

    window.addEventListener("storage", handleStorageChange);

    // Poll server to check verification status
    pollInterval.current = setInterval(async () => {
      if (hasNotified.current) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        return;
      }

      try {
        const response = await authAPI.checkVerificationStatus(email);
        console.log("Poll check - is_verified:", response?.data?.is_verified);
        if (response?.data?.is_verified) {
          console.log("Email verified via polling!");
          handleVerified();
        }
      } catch (e) {
        console.error("Poll check failed:", e);
      }
    }, POLL_INTERVAL);
    console.log("Started polling for verification status every", POLL_INTERVAL, "ms");

    // Do an initial check immediately
    (async () => {
      try {
        const response = await authAPI.checkVerificationStatus(email);
        console.log("Initial check - is_verified:", response?.data?.is_verified);
        if (response?.data?.is_verified) {
          console.log("Email already verified!");
          handleVerified();
        }
      } catch (e) {
        console.error("Initial check failed:", e);
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
  console.log("Broadcasting verification for:", email);
  
  // Use BroadcastChannel for modern browsers
  try {
    const channel = new BroadcastChannel(VERIFICATION_CHANNEL);
    const message = { email, verified: true, timestamp: Date.now() };
    channel.postMessage(message);
    console.log("BroadcastChannel message sent:", message);
    channel.close();
  } catch (e) {
    console.log("BroadcastChannel not supported, using localStorage");
  }

  // Use localStorage as fallback and for cross-tab sync
  try {
    const data = { email, verified: true, timestamp: Date.now() };
    
    // Remove old value first to ensure storage event fires
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    
    // Set new value
    setTimeout(() => {
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(data));
      console.log("localStorage verification set:", data);
    }, 50);
    
    // Set again with different timestamp to trigger storage event
    setTimeout(() => {
      const newData = { ...data, timestamp: Date.now() };
      localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(newData));
      console.log("localStorage verification updated:", newData);
    }, 100);
  } catch (e) {
    console.error("Failed to set localStorage:", e);
  }
}
