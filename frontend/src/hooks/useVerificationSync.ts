"use client";

import { useEffect, useRef, useCallback } from "react";
import { authAPI } from "@/lib/api/auth";

const VERIFICATION_CHANNEL = "email_verification";
const VERIFICATION_STORAGE_KEY = "email_verified";
const POLL_INTERVAL = 3000; // Poll every 3 seconds for faster detection

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
      console.log("[VerificationSync] Already notified, skipping");
      return;
    }
    console.log("[VerificationSync] Email verified detected! Triggering callback...");
    hasNotified.current = true;
    
    // Stop polling immediately
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
    
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    if (!enabled || !email) {
      console.log("[VerificationSync] Disabled or no email, skipping setup");
      return;
    }

    console.log("[VerificationSync] Setting up listeners for:", email);

    // Setup BroadcastChannel for cross-tab communication
    try {
      broadcastChannel.current = new BroadcastChannel(VERIFICATION_CHANNEL);
      broadcastChannel.current.onmessage = (event) => {
        console.log("[VerificationSync] BroadcastChannel message received:", event.data);
        if (event.data?.email?.toLowerCase() === email.toLowerCase() && event.data?.verified) {
          console.log("[VerificationSync] Email verified via BroadcastChannel!");
          handleVerified();
        }
      };
      console.log("[VerificationSync] BroadcastChannel listener set up");
    } catch (e) {
      console.log("[VerificationSync] BroadcastChannel not supported:", e);
    }

    // Setup localStorage listener for cross-tab communication fallback
    const handleStorageChange = (event: StorageEvent) => {
      console.log("[VerificationSync] Storage event:", event.key);
      if (event.key === VERIFICATION_STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          console.log("[VerificationSync] Parsed storage data:", data);
          if (data.email?.toLowerCase() === email.toLowerCase() && data.verified) {
            console.log("[VerificationSync] Email verified via localStorage!");
            handleVerified();
          }
        } catch (e) {
          console.error("[VerificationSync] Failed to parse storage data:", e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    console.log("[VerificationSync] Storage listener set up");

    // Also check localStorage directly on mount and periodically
    // This helps when the storage event doesn't fire (same tab)
    const checkLocalStorage = () => {
      try {
        const stored = localStorage.getItem(VERIFICATION_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.email?.toLowerCase() === email.toLowerCase() && data.verified) {
            console.log("[VerificationSync] Email verified via localStorage check!");
            handleVerified();
            return true;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
      return false;
    };

    // Check immediately
    if (checkLocalStorage()) return;

    // Poll server to check verification status
    const pollServer = async () => {
      if (hasNotified.current) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        return;
      }

      // Also check localStorage each poll cycle
      if (checkLocalStorage()) return;

      try {
        console.log("[VerificationSync] Polling server for verification status...");
        const response = await authAPI.checkVerificationStatus(email);
        console.log("[VerificationSync] Poll response - is_verified:", response?.data?.is_verified);
        if (response?.data?.is_verified) {
          console.log("[VerificationSync] Email verified via polling!");
          handleVerified();
        }
      } catch (e) {
        console.error("[VerificationSync] Poll check failed:", e);
      }
    };

    // Start polling
    pollInterval.current = setInterval(pollServer, POLL_INTERVAL);
    console.log("[VerificationSync] Started polling every", POLL_INTERVAL, "ms");

    // Do an initial server check
    pollServer();

    return () => {
      console.log("[VerificationSync] Cleaning up listeners");
      if (broadcastChannel.current) {
        broadcastChannel.current.close();
        broadcastChannel.current = null;
      }
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [email, enabled, handleVerified]);
}

export function broadcastVerification(email: string) {
  console.log("[VerificationSync] Broadcasting verification for:", email);
  
  // Use BroadcastChannel for modern browsers - keep channel open briefly
  try {
    const channel = new BroadcastChannel(VERIFICATION_CHANNEL);
    const message = { email: email.toLowerCase(), verified: true, timestamp: Date.now() };
    channel.postMessage(message);
    console.log("[VerificationSync] BroadcastChannel message sent:", message);
    
    // Close after a small delay to ensure message is sent
    setTimeout(() => {
      channel.close();
    }, 500);
  } catch (e) {
    console.log("[VerificationSync] BroadcastChannel not supported:", e);
  }

  // Use localStorage for cross-tab sync
  // This will trigger storage event in OTHER tabs
  try {
    const data = { email: email.toLowerCase(), verified: true, timestamp: Date.now() };
    
    // Clear first to ensure change is detected
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    
    // Set the value
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(data));
    console.log("[VerificationSync] localStorage set:", data);
  } catch (e) {
    console.error("[VerificationSync] Failed to set localStorage:", e);
  }
}

// Helper to clear verification state (call on logout or new registration)
export function clearVerificationState() {
  try {
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    console.log("[VerificationSync] Cleared verification state");
  } catch (e) {
    // Ignore
  }
}
