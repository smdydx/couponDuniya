"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api/auth";
import { ROUTES } from "@/lib/constants";
import type { LoginCredentials } from "@/types";

interface RegisterFormData {
  email: string;
  mobile?: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  referral_code?: string;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const { login, isLoading, error, clearError, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        const isAdmin = user.is_admin === true || user.role === 'admin';
        const redirectUrl = isAdmin ? '/admin/dashboard' : '/';
        router.replace(redirectUrl);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  const loginForm = useForm<LoginCredentials>();
  const registerForm = useForm<RegisterFormData>({
    defaultValues: { referral_code: referralCode || "" },
  });

  const password = registerForm.watch("password");

  const onLoginSubmit = async (data: LoginCredentials) => {
    try {
      const user = await login(data);
      if (user) {
        const redirectUrl = (user.is_admin || user.role === 'admin') ? '/admin/dashboard' : '/';
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) return;
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      const { confirm_password, ...registerData } = data;
      // Send separate first_name/last_name to backend
      await authAPI.register(registerData);
      const emailParam = encodeURIComponent(registerData.email || "");
      router.replace(`${ROUTES.verifyEmail}?email=${emailParam}`);
    } catch (err: any) {
      setRegisterError(err?.response?.data?.detail || err?.message || "Registration failed");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = "433927974317-omujf5cn8ndhtdrofprnv9sb0uo3irl1.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/google/callback`;
    const scope = "openid email profile";
    const responseType = "id_token token";
    const nonce = Math.random().toString(36).substring(7);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${nonce}`;
    window.location.href = authUrl;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
        <div className="flex bg-purple-50 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => { setActiveTab("login"); clearError(); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "login"
              ? "bg-white text-purple-600 shadow-sm"
              : "text-gray-500 hover:text-purple-600"
              }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("signup"); clearError(); setRegisterError(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === "signup"
              ? "bg-white text-purple-600 shadow-sm"
              : "text-gray-500 hover:text-purple-600"
              }`}
          >
            Sign Up
          </button>
        </div>

        <div className="px-6 pb-6">
          {activeTab === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
                <p className="text-sm text-gray-500">Sign in to your account</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-gray-700">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  {...loginForm.register("email", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
                    onChange: () => clearError(),
                  })}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-gray-700">Password</Label>
                  <Link href={ROUTES.forgotPassword || "/forgot-password"} className="text-xs text-purple-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-11 pr-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    {...loginForm.register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" },
                      onChange: () => clearError(),
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Or</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full h-11 border-purple-200 hover:bg-purple-50 hover:border-purple-300" onClick={handleGoogleLogin}>
                <img src="/images/icons/google.png" alt="Google" className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
              <div className="text-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
                <p className="text-sm text-gray-500">Start saving money today</p>
              </div>

              {registerError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-sm text-red-600">
                  {registerError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="first_name" className="text-gray-700 text-sm">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    {...registerForm.register("first_name", { required: "First name is required" })}
                  />
                  {registerForm.formState.errors.first_name && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name" className="text-gray-700 text-sm">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    {...registerForm.register("last_name", { required: "Last name is required" })}
                  />
                  {registerForm.formState.errors.last_name && (
                    <p className="text-xs text-red-500">{registerForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-gray-700 text-sm">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  {...registerForm.register("email", {
                    required: "Email is required",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address" },
                    onChange: () => setRegisterError(null),
                  })}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="mobile" className="text-gray-700 text-sm">Mobile (Optional)</Label>
                <Input id="mobile" type="tel" placeholder="+91 98765 43210" className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500" {...registerForm.register("mobile")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-password" className="text-gray-700 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="h-10 pr-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                    {...registerForm.register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm_password" className="text-gray-700 text-sm">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Confirm your password"
                  className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  {...registerForm.register("confirm_password", {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords don't match",
                  })}
                />
                {registerForm.formState.errors.confirm_password && (
                  <p className="text-xs text-red-500">{registerForm.formState.errors.confirm_password.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="referral_code" className="text-gray-700 text-sm">Referral Code (Optional)</Label>
                <Input id="referral_code" placeholder="Enter referral code" className="h-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500" {...registerForm.register("referral_code")} />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  className="mt-0.5 border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label htmlFor="terms" className="text-xs font-normal leading-tight text-gray-600">
                  I agree to the{" "}
                  <Link href={ROUTES.terms} className="text-purple-600 hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href={ROUTES.privacy} className="text-purple-600 hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <Button type="submit" className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30" disabled={registerLoading || !acceptTerms}>
                {registerLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Or</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full h-10 border-purple-200 hover:bg-purple-50 hover:border-purple-300" onClick={handleGoogleLogin}>
                <img src="/images/icons/google.png" alt="Google" className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
