"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api/auth";
import { ROUTES } from "@/lib/constants";

interface SetPasswordFormData {
  password: string;
  confirm_password: string;
}

function SetPasswordForm() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetPasswordFormData>();

  const password = watch("password");

  const onSubmit = async (data: SetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authAPI.setPassword(data.password);
      setSuccess(true);
      setTimeout(() => {
        router.push(ROUTES.home);
      }, 2000);
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || "Failed to set password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Expired</CardTitle>
          <CardDescription>Please log in again to set your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push(ROUTES.login)} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Password Set Successfully!</CardTitle>
          <CardDescription>
            Your password has been set. You can now use it to log in. Redirecting...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Set Your Password</CardTitle>
        <CardDescription>
          Create a password to access your account without using social login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {user?.email && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Account: </span>
              <span className="font-medium">{user.email}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: "Password must contain uppercase, lowercase, and a number",
                  },
                })}
                error={!!errors.password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords don't match",
                })}
                error={!!errors.confirm_password}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Password...
              </>
            ) : (
              "Set Password"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href={ROUTES.home} className="text-sm text-muted-foreground hover:underline">
          Skip for now
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
