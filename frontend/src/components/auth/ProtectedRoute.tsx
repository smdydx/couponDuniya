"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectTo 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [showAuthError, setShowAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const verifyAuth = async () => {
      if (hasCheckedRef.current || isCheckingRef.current) {
        return;
      }
      
      if (!isAuthenticated) {
        isCheckingRef.current = true;
        try {
          await checkAuth();
        } finally {
          isCheckingRef.current = false;
          hasCheckedRef.current = true;
        }
      } else {
        hasCheckedRef.current = true;
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [isAuthenticated, checkAuth]);

  useEffect(() => {
    if (isChecking || isLoading) return;

    if (!isAuthenticated) {
      // Redirect immediately without showing error
      const redirectUrl = redirectTo || `${ROUTES.login}?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
      return;
    }

    if (requireAdmin && user && !user.is_admin && user.role !== "admin") {
      // Redirect immediately to home if not admin
      router.replace(ROUTES.home);
      return;
    }
  }, [isAuthenticated, isChecking, isLoading, user, requireAdmin, router, pathname, redirectTo]);

  if (isChecking || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user && !user.is_admin && user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}

export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { requireAdmin?: boolean; redirectTo?: string }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        requireAdmin={options?.requireAdmin} 
        redirectTo={options?.redirectTo}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
