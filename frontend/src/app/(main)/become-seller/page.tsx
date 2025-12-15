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
    <div className="min-h-screen">
      {!showForm ? (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 py-20 text-white">
            <div className="absolute inset-0 bg-black/20" />
            <div className="container relative z-10">
              <div className="mx-auto max-w-3xl text-center">
                <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
                  Join 500+ Sellers
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Sell on BIDUA
                </h1>
                <p className="mt-6 text-lg text-white/90 sm:text-xl">
                  Partner with us to reach millions of customers. List your coupons, deals, and offers on India's fastest growing cashback platform.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <Button 
                      size="lg" 
                      className="bg-white text-orange-600 hover:bg-white/90"
                      onClick={() => setShowForm(true)}
                    >
                      Start Selling
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Link href={ROUTES.register}>
                      <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90">
                        Register to Sell
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 bg-muted/30">
            <div className="container">
              <h2 className="text-3xl font-bold text-center mb-12">Why Sell With Us?</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <benefit.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container">
              <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {steps.map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center">
                {isAuthenticated ? (
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-orange-500 to-pink-500"
                    onClick={() => setShowForm(true)}
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Link href={ROUTES.login}>
                    <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500">
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
        <div className="container py-8 max-w-2xl">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setShowForm(false)}
          >
            ← Back
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6" />
                Seller Registration
              </CardTitle>
              <CardDescription>
                Fill in your business details to register as a seller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Your business name"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Business Email *</Label>
                      <Input
                        id="business_email"
                        name="business_email"
                        type="email"
                        value={formData.business_email}
                        onChange={handleChange}
                        placeholder="business@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_phone">Business Phone *</Label>
                      <Input
                        id="business_phone"
                        name="business_phone"
                        type="tel"
                        value={formData.business_phone}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your business..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Business Address
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_address">Address *</Label>
                    <Textarea
                      id="business_address"
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleChange}
                      placeholder="Full business address"
                      required
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="business_city">City *</Label>
                      <Input
                        id="business_city"
                        name="business_city"
                        value={formData.business_city}
                        onChange={handleChange}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_state">State *</Label>
                      <Input
                        id="business_state"
                        name="business_state"
                        value={formData.business_state}
                        onChange={handleChange}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_pincode">Pincode *</Label>
                      <Input
                        id="business_pincode"
                        name="business_pincode"
                        value={formData.business_pincode}
                        onChange={handleChange}
                        placeholder="Pincode"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tax Information (Optional)
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gst_number">GST Number</Label>
                      <Input
                        id="gst_number"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        name="pan_number"
                        value={formData.pan_number}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
