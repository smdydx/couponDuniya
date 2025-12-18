"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  TrendingUp,
  Users,
  Shield,
  Wallet,
  CheckCircle,
  ArrowRight,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/uiStore";
import { ROUTES } from "@/lib/constants";
import apiClient from "@/lib/api-client";

const benefits = [
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Reach millions of customers looking for the best deals and offers"
  },
  {
    icon: Users,
    title: "Large Customer Base",
    description: "Access our growing community of deal-seekers and cashback lovers"
  },
  {
    icon: Wallet,
    title: "Easy Payments",
    description: "Get timely payouts with transparent commission structure"
  },
  {
    icon: Shield,
    title: "Trusted Platform",
    description: "Join a verified marketplace with secure transactions"
  }
];

const steps = [
  { step: 1, title: "Register", description: "Fill out the seller registration form" },
  { step: 2, title: "Verification", description: "Our team verifies your business details" },
  { step: 3, title: "Go Live", description: "Start listing your offers and earn" }
];

export default function BecomeSellerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    business_name: "",
    business_email: "",
    business_phone: "",
    business_address: "",
    business_city: "",
    business_state: "",
    business_pincode: "",
    gst_number: "",
    pan_number: "",
    website_url: "",
    description: ""
  });

  useEffect(() => {
    if (isAuthenticated) {
      checkMerchantStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [isAuthenticated]);

  const checkMerchantStatus = async () => {
    try {
      const response = await apiClient.get('/merchants/my-application');
      if (response.data.success && response.data.data.has_application) {
        setMerchantData(response.data.data);
      }
    } catch (error) {
      console.error("Failed to check merchant status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.business_name || !formData.business_email || !formData.business_phone ||
      !formData.business_address || !formData.business_city || !formData.business_state ||
      !formData.business_pincode) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/merchants/apply', formData);
      if (response.data.success) {
        toast.success("Application submitted successfully! We'll review it shortly.");
        checkMerchantStatus();
        setShowForm(false);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (merchantData?.has_application) {
    return (
      <div className="container py-12 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Seller Application Status</CardTitle>
            <CardDescription>
              Your application is being reviewed by our team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              {getStatusBadge(merchantData.verification_status)}
            </div>

            {merchantData.verification_status === "pending" && (
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                <p className="text-yellow-800 font-medium">Application Under Review</p>
                <p className="text-yellow-700 text-sm mt-1">
                  We're reviewing your application. This usually takes 1-2 business days.
                </p>
              </div>
            )}

            {merchantData.verification_status === "approved" && (
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-green-800 font-medium">Congratulations!</p>
                <p className="text-green-700 text-sm mt-1">
                  Your seller account is active. You can now list your offers.
                </p>
              </div>
            )}

            {merchantData.verification_status === "rejected" && (
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                <p className="text-red-800 font-medium">Application Rejected</p>
                <p className="text-red-700 text-sm mt-1">
                  {merchantData.verification_notes || "Please contact support for more details."}
                </p>
              </div>
            )}

            {merchantData.merchant && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Business Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{merchantData.merchant.business_name || merchantData.merchant.name}</span>
                  </div>
                  {merchantData.merchant.business_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{merchantData.merchant.business_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {!showForm ? (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-24 text-white">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-20 bg-purple-500/20 rounded-lg rotate-12 animate-blob blur-sm"></div>
              <div className="absolute top-1/4 right-20 w-40 h-24 bg-purple-400/15 rounded-xl -rotate-6 animate-blob animation-delay-2000 blur-sm"></div>
              <div className="absolute bottom-20 left-1/4 w-36 h-22 bg-indigo-500/20 rounded-lg rotate-3 animate-float blur-sm"></div>
              <div className="absolute top-1/2 left-1/3 w-28 h-16 bg-purple-300/10 rounded-xl -rotate-12 animate-blob animation-delay-4000 blur-sm"></div>
              <div className="absolute bottom-1/3 right-1/4 w-44 h-28 bg-purple-600/15 rounded-lg rotate-6 animate-float animation-delay-2000 blur-sm"></div>
              <div className="absolute top-20 right-1/3 w-24 h-14 bg-indigo-400/20 rounded-xl rotate-12 animate-blob blur-sm"></div>

              {/* Floating Coupon Shapes */}
              <div className="absolute top-1/3 left-20 w-20 h-12 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-lg rotate-45 animate-float">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -ml-1.5"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -mr-1.5"></div>
              </div>
              <div className="absolute bottom-1/4 right-20 w-24 h-14 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg -rotate-12 animate-float animation-delay-2000">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -ml-1.5"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -mr-1.5"></div>
              </div>

              {/* Sparkles */}
              <div className="absolute top-16 right-16 w-4 h-4 bg-purple-300/40 rounded-full animate-shimmer"></div>
              <div className="absolute top-1/3 left-16 w-3 h-3 bg-indigo-300/40 rounded-full animate-shimmer animation-delay-1000"></div>
              <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-purple-400/30 rounded-full animate-shimmer animation-delay-2000"></div>
            </div>

            <div className="container relative z-10">
              <div className="mx-auto max-w-3xl text-center">
                <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                  Join 500+ Sellers
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl drop-shadow-lg">
                  Sell on BIDUA
                </h1>
                <p className="mt-6 text-lg text-white/90 sm:text-xl">
                  Partner with us to reach millions of customers. List your coupons, deals, and offers on India's fastest growing cashback platform.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      className="bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg shadow-purple-500/30"
                      onClick={() => setShowForm(true)}
                    >
                      Start Selling
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Link href={ROUTES.register}>
                      <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg shadow-purple-500/30">
                        Register to Sell
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 bg-purple-50">
            <div className="container">
              <h2 className="text-3xl font-bold text-center mb-12 text-purple-900">Why Sell With Us?</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow border-purple-100">
                    <CardContent className="pt-6">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                        <benefit.icon className="h-7 w-7 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-purple-900">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container">
              <h2 className="text-3xl font-bold text-center mb-12 text-purple-900">How It Works</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {steps.map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-xl mb-2 text-purple-900">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                    onClick={() => setShowForm(true)}
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Link href={ROUTES.login}>
                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30">
                      Login to Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="container py-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button
            variant="ghost"
            className="mb-4 hover:bg-purple-50 text-purple-700"
            onClick={() => setShowForm(false)}
          >
            ← Back to Info
          </Button>

          <Card className="border-purple-100 shadow-xl overflow-hidden">
            <div className="bg-purple-600 p-6 text-white text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                  <Store className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Seller Registration</CardTitle>
              <CardDescription className="text-purple-100">
                Complete 3 steps to start selling on BIDUA
              </CardDescription>
            </div>

            {/* Stepper */}
            <div className="px-6 py-8 border-b border-purple-50">
              <div className="flex items-center justify-between relative max-w-md mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-purple-600 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>

                {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= step
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                          : "bg-white border-2 border-gray-200 text-gray-400"
                        }`}
                    >
                      {currentStep > step ? <CheckCircle className="h-6 w-6" /> : step}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${currentStep >= step ? "text-purple-600" : "text-gray-400"}`}>
                      {step === 1 ? "Contact" : step === 2 ? "Location" : "Business"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Business Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="business_name" className="text-gray-700 font-semibold text-sm">Business Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="business_name"
                          name="business_name"
                          className="pl-10 h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.business_name}
                          onChange={handleChange}
                          placeholder="Your business name"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="business_email" className="text-gray-700 font-semibold text-sm">Business Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="business_email"
                            name="business_email"
                            type="email"
                            className="pl-10 h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                            value={formData.business_email}
                            onChange={handleChange}
                            placeholder="business@example.com"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_phone" className="text-gray-700 font-semibold text-sm">Business Phone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="business_phone"
                            name="business_phone"
                            type="tel"
                            className="pl-10 h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                            value={formData.business_phone}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Address */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="business_address" className="text-gray-700 font-semibold text-sm">Full Address *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="business_address"
                          name="business_address"
                          className="pl-10 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.business_address}
                          onChange={handleChange}
                          placeholder="Full business address"
                          required
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="business_city" className="text-gray-700 font-semibold text-sm">City *</Label>
                        <Input
                          id="business_city"
                          name="business_city"
                          className="h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.business_city}
                          onChange={handleChange}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_state" className="text-gray-700 font-semibold text-sm">State *</Label>
                        <Input
                          id="business_state"
                          name="business_state"
                          className="h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.business_state}
                          onChange={handleChange}
                          placeholder="State"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business_pincode" className="text-gray-700 font-semibold text-sm">Pincode *</Label>
                        <Input
                          id="business_pincode"
                          name="business_pincode"
                          className="h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.business_pincode}
                          onChange={handleChange}
                          placeholder="Pincode"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Tax & Identity */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gst_number" className="text-gray-700 font-semibold text-sm">GST Number</Label>
                        <Input
                          id="gst_number"
                          name="gst_number"
                          className="h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.gst_number}
                          onChange={handleChange}
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan_number" className="text-gray-700 font-semibold text-sm">PAN Number</Label>
                        <Input
                          id="pan_number"
                          name="pan_number"
                          className="h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.pan_number}
                          onChange={handleChange}
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url" className="text-gray-700 font-semibold text-sm">Website URL</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="website_url"
                          name="website_url"
                          className="pl-10 h-11 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                          value={formData.website_url}
                          onChange={handleChange}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-semibold text-sm">About Your Business</Label>
                      <Textarea
                        id="description"
                        name="description"
                        className="border-purple-100 focus:border-purple-300 focus:ring-purple-200"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="What do you sell? (Brands, Categories etc.)"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                      onClick={(e) => {
                        // Validate current step fields
                        if (currentStep === 1) {
                          if (!formData.business_name || !formData.business_email || !formData.business_phone) {
                            toast.error("Please fill all contact details");
                            return;
                          }
                        } else if (currentStep === 2) {
                          if (!formData.business_address || !formData.business_city || !formData.business_state || !formData.business_pincode) {
                            toast.error("Please fill address details");
                            return;
                          }
                        }
                        setCurrentStep(prev => prev + 1);
                      }}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/30"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <CheckCircle className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
