
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');

        if (!idToken) {
          throw new Error('No ID token received from Google');
        }

        // Send token to backend - using correct endpoint
        const response = await apiClient.post('/auth/social/google', {
          token: idToken
        });

        if (response.data.success) {
          const { access_token, refresh_token, user } = response.data.data;
          
          // Get the auth store functions
          const { setTokens, updateUser } = useAuthStore.getState();
          
          // Store auth data using authStore methods
          setTokens(access_token, refresh_token || access_token);
          updateUser(user);

          // Redirect based on role
          const redirectUrl = user.is_admin || user.role === 'admin' 
            ? '/admin/dashboard' 
            : '/';
          
          router.replace(redirectUrl);
        }
      } catch (error: any) {
        console.error('Google auth error:', error);
        
        // Check if error is about account not found
        const errorMessage = error?.response?.data?.detail || 'google_auth_failed';
        
        if (errorMessage.includes('No account found') || errorMessage.includes('register first')) {
          router.replace('/login?error=not_registered');
        } else {
          router.replace('/login?error=google_auth_failed');
        }
      }
    };

    handleGoogleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing Google sign in...</p>
      </div>
    </div>
  );
}
