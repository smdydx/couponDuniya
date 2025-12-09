"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/api/auth";
import { ROUTES } from "@/lib/constants";
import { broadcastVerification, useVerificationSync } from "@/hooks/useVerificationSync";

type VerificationStatus = "loading" | "success" | "error" | "waiting";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  const [status, setStatus] = useState<VerificationStatus>(token ? "loading" : "waiting");
  const [message, setMessage] = useState<string>("");
  const [timer, setTimer] = useState(300);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    if (status === "waiting" && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, timer]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  // Auto-redirect to login after successful verification
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace(ROUTES.login);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await authAPI.verifyEmail(verificationToken);
      
      // Broadcast to other tabs IMMEDIATELY before any state changes
      const verifiedEmail = response?.data?.email || email;
      if (verifiedEmail) {
        console.log("[VerifyEmail] Broadcasting verification for:", verifiedEmail);
        broadcastVerification(verifiedEmail);
        // Broadcast again after delays to ensure it's received by all tabs
        setTimeout(() => broadcastVerification(verifiedEmail), 200);
        setTimeout(() => broadcastVerification(verifiedEmail), 500);
      }
      
      setStatus("success");
      setMessage("Your email has been verified successfully!");
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        router.push(ROUTES.login);
      }, 5000);
    } catch (err: any) {
      setStatus("error");
      const errorMessage = err?.response?.data?.detail || err?.message || "Failed to verify email. The link may have expired.";
      setMessage(errorMessage);
    }
  };

  useVerificationSync({
    email: email || "",
    enabled: status === "waiting" && !!email,
    onVerified: () => {
      setStatus("success");
      setMessage("Your email has been verified! Redirecting to login...");
      // Clear the timer
      setTimer(0);
      setTimeout(() => {
        router.push(ROUTES.login);
      }, 5000);
    },
  });

  const handleResendEmail = async () => {
    if (!email || isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      await authAPI.resendVerificationEmail(email);
      setResendCooldown(60);
      setTimer(300);
    } catch (err: any) {
      console.error("Failed to resend email:", err);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((300 - timer) / 300) * 100;

  if (status === "waiting") {
    return (
      <Card className="border-0 shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 relative">
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-purple-500 mx-auto mb-1 animate-bounce" />
                  <span className="text-2xl font-bold text-gray-800">{formatTime(timer)}</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-base mt-2">
            We&apos;ve sent a verification link to
          </CardDescription>
          {email && (
            <p className="font-semibold text-purple-600 mt-1">{email}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Check Your Inbox</h4>
                <p className="text-sm text-gray-600">
                  Click the verification link in the email we sent you. The link will expire in 24 hours.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">1</span>
              </div>
              <span>Open your email app</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">2</span>
              </div>
              <span>Find the email from CouponAli</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium">3</span>
              </div>
              <span>Click &quot;Verify Email Now&quot; button</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Didn&apos;t receive the email?</strong> Check your spam folder or click the button below to resend.
            </p>
          </div>

          <Button 
            onClick={handleResendEmail}
            variant="outline"
            className="w-full h-12 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="justify-center pb-6 pt-2">
          <Link href={ROUTES.login} className="text-sm text-purple-600 hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-blue-200" />
            <div className="absolute inset-2 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
          <CardTitle className="text-2xl">Verifying Your Email</CardTitle>
          <CardDescription>Please wait while we verify your email address...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl overflow-hidden">
      {status === "success" && (
        <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
      )}
      {status === "error" && (
        <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
      )}
      <CardHeader className="text-center">
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
            <CardDescription className="text-base">{message}</CardDescription>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-400 to-rose-500 shadow-lg">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-red-600">Verification Failed</CardTitle>
            <CardDescription className="text-destructive">{message}</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {status === "success" && (
          <>
            <p className="text-sm text-gray-600 mb-4">Redirecting to login in 5 seconds...</p>
            <Button 
              onClick={() => router.replace(ROUTES.login)} 
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Go to Login
            </Button>
          </>
        )}

        {status === "error" && (
          <div className="space-y-3">
            {token && (
              <Button onClick={() => verifyEmail(token)} variant="outline" className="w-full h-12">
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => router.push(ROUTES.login)} 
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500"
            >
              Back to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
