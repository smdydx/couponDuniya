"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { authAPI } from "@/lib/api/auth";
import { ROUTES } from "@/lib/constants";

interface RegisterFormData {
  email: string;
  mobile?: string;
  password: string;
  confirm_password: string;
  full_name: string;
  referral_code?: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      referral_code: referralCode || "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) return;

    setIsLoading(true);
    setError(null);

    try {
      const { confirm_password, ...registerData } = data;
      
      // Call the API directly - send full_name as is
      await authAPI.register({
        ...registerData,
        full_name: registerData.full_name,
      });
      
      // Redirect to verify email page with email parameter for animated waiting page
      const emailParam = encodeURIComponent(registerData.email || "");
      router.replace(`${ROUTES.verifyEmail}?email=${emailParam}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription className="text-sm">Start earning cashback and saving money today</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register("full_name", { required: "Full name is required" })}
              error={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              error={!!errors.email}
              onChange={() => setError(null)}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile (Optional)</Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="+91 98765 43210"
              {...register("mobile")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Input
              id="confirm_password"
              type="password"
              placeholder="Confirm your password"
              {...register("confirm_password", {
                required: "Please confirm your password",
                validate: (value) => value === password || "Passwords don't match",
              })}
              error={!!errors.confirm_password}
            />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral_code">Referral Code (Optional)</Label>
            <Input
              id="referral_code"
              placeholder="Enter referral code"
              {...register("referral_code")}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-tight">
              I agree to the{" "}
              <Link href={ROUTES.terms} className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href={ROUTES.privacy} className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button type="submit" className="w-full h-10 text-base" disabled={isLoading || !acceptTerms}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline" 
            className="w-full h-10 flex items-center justify-center gap-2 text-base" 
            onClick={() => {
              const clientId = "433927974317-omujf5cn8ndhtdrofprnv9sb0uo3irl1.apps.googleusercontent.com";
              // Use current host for redirect
              const redirectUri = `${window.location.origin}/google/callback`;
              const scope = "openid email profile";
              const responseType = "id_token token";
              const nonce = Math.random().toString(36).substring(7);
              
              const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${nonce}`;
              
              window.location.href = authUrl;
            }}
          >
            <img src="/images/icons/google.png" alt="Google" className="w-5 h-5" />
            Continue with Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pt-4 pb-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={ROUTES.login} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    }>
      <RegisterForm />
    </Suspense>
  );
}
