
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, User, Shield, Bell, Save, Link2, Unlink, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/uiStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import apiClient from "@/lib/api-client";
import { authAPI } from "@/lib/api/auth";
import { userAPI } from "@/lib/api/user";

interface SocialAccount {
  provider: string;
  email: string;
  linked_at: string;
}

interface KYCData {
  status: string;
  pan_number: string | null;
  pan_verified: boolean;
  aadhaar_number: string | null;
  aadhaar_verified: boolean;
  account_holder_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  upi_id: string | null;
  submitted_at: string | null;
  verified_at: string | null;
}

function ProfileContent() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile Picture State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Mobile Verification State
  const [verifyingMobile, setVerifyingMobile] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");

  // KYC State
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    pan_number: "",
    aadhaar_number: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    upi_id: ""
  });

  // Notifications State
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    promotional: false,
    cashback: true
  });

  type ProfileForm = {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      date_of_birth: user?.date_of_birth || "",
      gender: user?.gender || undefined,
    },
  });

  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name || "");
      setValue("last_name", user.last_name || "");
      setValue("email", user.email || "");
      setValue("mobile", user.mobile || "");
      setValue("date_of_birth", user.date_of_birth || "");
      if (user.gender) {
        setValue("gender", user.gender as 'male' | 'female' | 'other');
      }
    }
  }, [user, setValue]);

  // Fetch KYC data
  const fetchKycData = async () => {
    setLoadingKyc(true);
    try {
      const response = await apiClient.get('/users/kyc');
      if (response.data.success) {
        setKycData(response.data.data);
        setKycFormData({
          pan_number: response.data.data.pan_number || "",
          aadhaar_number: response.data.data.aadhaar_number || "",
          account_holder_name: response.data.data.account_holder_name || "",
          account_number: response.data.data.account_number || "",
          ifsc_code: response.data.data.ifsc_code || "",
          bank_name: response.data.data.bank_name || "",
          upi_id: response.data.data.upi_id || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch KYC data:", error);
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => {
    if (activeTab === "kyc") {
      fetchKycData();
    }
  }, [activeTab]);

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await userAPI.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        mobile: data.mobile,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
      });
      updateUser(data);
      setSaveSuccess(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error?.response?.data?.detail || "Failed to update profile");
      toast.error(error?.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      if (response.data.success) {
        setPasswordSuccess(true);
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 5000);
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post('/auth/set-password', {
        new_password: newPassword
      });

      if (response.data.success) {
        setPasswordSuccess(true);
        toast.success("Password set successfully!");
        setNewPassword("");
        setConfirmPassword("");
        updateUser({ ...user, password_hash: true });
        setTimeout(() => setPasswordSuccess(false), 5000);
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || "Failed to set password");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === "linked") {
      fetchSocialAccounts();
    }
  }, [activeTab]);

  const fetchSocialAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const accounts = await authAPI.getSocialAccounts();
      setSocialAccounts(accounts);
    } catch (error) {
      console.error("Failed to fetch social accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleUnlinkAccount = async (provider: string) => {
    setUnlinkingProvider(provider);
    try {
      await authAPI.unlinkSocialAccount(provider);
      setSocialAccounts((prev) => prev.filter((acc) => acc.provider !== provider));
      toast.success(`${provider} account unlinked successfully`);
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to unlink account";
      toast.error(message);
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const handleLinkGoogle = () => {
    const clientId = "433927974317-omujf5cn8ndhtdrofprnv9sb0uo3irl1.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/google/callback`;
    const scope = "openid email profile";
    const responseType = "id_token token";
    const nonce = Math.random().toString(36).substring(7);
    const state = "link_account";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}`;
    window.location.href = authUrl;
  };

  const handleKycSubmit = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.put('/users/kyc', kycFormData);
      if (response.data.success) {
        toast.success("KYC details submitted for verification");
        fetchKycData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit KYC");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        updateUser({ avatar_url: response.data.data.avatar_url });
        toast.success('Profile picture updated successfully');
        setAvatarPreview(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMobileOtp = async () => {
    const mobile = (document.getElementById('mobile') as HTMLInputElement)?.value;
    if (!mobile || mobile.length < 10) {
      setOtpError('Please enter a valid mobile number');
      return;
    }

    setVerifyingMobile(true);
    setOtpError('');
    try {
      const response = await apiClient.post('/auth/send-mobile-otp', { mobile });
      if (response.data.success) {
        setOtpSent(true);
        toast.success('OTP sent to your mobile number');
      }
    } catch (error: any) {
      setOtpError(error?.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setVerifyingMobile(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingMobile(true);
    setOtpError('');
    try {
      const mobile = (document.getElementById('mobile') as HTMLInputElement)?.value;
      const response = await apiClient.post('/auth/verify-mobile-otp', {
        mobile,
        otp: mobileOtp,
      });

      if (response.data.success) {
        updateUser({ mobile_verified: true });
        toast.success('Mobile number verified successfully');
        setOtpSent(false);
        setMobileOtp('');
      }
    } catch (error: any) {
      setOtpError(error?.response?.data?.detail || 'Invalid OTP');
    } finally {
      setVerifyingMobile(false);
    }
  };

  const getKycStatusBadge = () => {
    if (!kycData) return <Badge variant="secondary">Not Submitted</Badge>;
    
    switch (kycData.status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Profile" }]} />

      <div className="mb-6 flex items-center gap-4">
        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted group">
          {avatarPreview || user?.avatar_url ? (
            <img
              src={avatarPreview || user?.avatar_url || ''}
              alt={user?.full_name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-2xl font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <span className="text-white text-xs">
              {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : "Change"}
            </span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleAvatarPreview(e);
              handleAvatarUpload(e);
            }}
            disabled={uploadingAvatar}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2">
            <Shield className="h-4 w-4" />
            KYC Details
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="linked" className="gap-2">
            <Link2 className="h-4 w-4" />
            Linked Accounts
          </TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      {...register("first_name", { required: "Required" })}
                      error={!!errors.first_name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      {...register("last_name", { required: "Required" })}
                      error={!!errors.last_name}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    Mobile Number
                    {user?.mobile_verified && (
                      <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="mobile"
                      type="tel"
                      {...register("mobile")}
                      disabled={user?.mobile_verified || otpSent}
                    />
                    {!user?.mobile_verified && !otpSent && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendMobileOtp}
                        disabled={verifyingMobile}
                      >
                        {verifyingMobile ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    )}
                  </div>
                  {otpSent && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter 6-digit OTP"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          disabled={verifyingMobile}
                        >
                          {verifyingMobile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Verify OTP"
                          )}
                        </Button>
                      </div>
                      {otpError && (
                        <p className="text-sm text-red-600">{otpError}</p>
                      )}
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm p-0 h-auto"
                        onClick={handleSendMobileOtp}
                        disabled={verifyingMobile}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      {...register("date_of_birth")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select defaultValue={user?.gender || undefined} onValueChange={(val) => setValue('gender', val as ProfileForm['gender'], { shouldDirty: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={!isDirty || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                {saveError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Profile updated successfully!
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Details */}
        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>KYC Verification</CardTitle>
                  <CardDescription>
                    Complete KYC to enable withdrawals
                  </CardDescription>
                </div>
                {getKycStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingKyc ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* PAN Card */}
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">
                        PAN Number
                        {kycData?.pan_verified && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                        )}
                      </Label>
                      <Input
                        id="pan_number"
                        placeholder="ABCDE1234F"
                        value={kycFormData.pan_number}
                        onChange={(e) => setKycFormData({...kycFormData, pan_number: e.target.value.toUpperCase()})}
                        maxLength={10}
                        disabled={kycData?.pan_verified}
                      />
                    </div>

                    {/* Aadhaar Card */}
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar_number">
                        Aadhaar Number
                        {kycData?.aadhaar_verified && (
                          <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                        )}
                      </Label>
                      <Input
                        id="aadhaar_number"
                        placeholder="XXXX-XXXX-XXXX"
                        value={kycFormData.aadhaar_number}
                        onChange={(e) => setKycFormData({...kycFormData, aadhaar_number: e.target.value})}
                        maxLength={12}
                        disabled={kycData?.aadhaar_verified}
                      />
                    </div>

                    {/* Account Holder Name */}
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name">Account Holder Name</Label>
                      <Input
                        id="account_holder_name"
                        placeholder="As per bank account"
                        value={kycFormData.account_holder_name}
                        onChange={(e) => setKycFormData({...kycFormData, account_holder_name: e.target.value})}
                      />
                    </div>

                    {/* Bank Account */}
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Bank Account Number</Label>
                      <Input
                        id="account_number"
                        placeholder="Enter account number"
                        value={kycFormData.account_number}
                        onChange={(e) => setKycFormData({...kycFormData, account_number: e.target.value})}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* IFSC Code */}
                      <div className="space-y-2">
                        <Label htmlFor="ifsc_code">IFSC Code</Label>
                        <Input
                          id="ifsc_code"
                          placeholder="SBIN0001234"
                          value={kycFormData.ifsc_code}
                          onChange={(e) => setKycFormData({...kycFormData, ifsc_code: e.target.value.toUpperCase()})}
                          maxLength={11}
                        />
                      </div>

                      {/* Bank Name */}
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          placeholder="State Bank of India"
                          value={kycFormData.bank_name}
                          onChange={(e) => setKycFormData({...kycFormData, bank_name: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* UPI ID */}
                    <div className="space-y-2">
                      <Label htmlFor="upi_id">UPI ID (Optional)</Label>
                      <Input
                        id="upi_id"
                        placeholder="yourname@upi"
                        value={kycFormData.upi_id}
                        onChange={(e) => setKycFormData({...kycFormData, upi_id: e.target.value})}
                      />
                    </div>
                  </div>

                  {kycData?.status === "verified" ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                      <CheckCircle className="inline-block mr-2 h-5 w-5" />
                      Your KYC has been verified successfully!
                    </div>
                  ) : (
                    <Button onClick={handleKycSubmit} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for Verification"
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>
                {user?.auth_provider === 'google' && !user?.password_hash
                  ? 'Set Password'
                  : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {user?.auth_provider === 'google' && !user?.password_hash
                  ? 'Set a password to enable email/password login'
                  : 'Update your password to keep your account secure'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="inline-block mr-2 h-4 w-4" />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Password {user?.password_hash ? 'changed' : 'set'} successfully!
                </div>
              )}

              {user?.auth_provider === 'google' && !user?.password_hash ? (
                <>
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 mb-4">
                    You signed up with Google. Setting a password will allow you to log in using your email and password as well.
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="Enter new password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                    <Input
                      id="confirm_new_password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSetPassword} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting Password...
                      </>
                    ) : (
                      "Set Password"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                    <Input
                      id="confirm_new_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button onClick={handlePasswordChange} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive order updates and offers via email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive order updates via SMS
                  </p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Receive offers and deals via email
                  </p>
                </div>
                <Switch
                  checked={notifications.promotional}
                  onCheckedChange={(checked) => setNotifications({...notifications, promotional: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cashback Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about cashback status changes
                  </p>
                </div>
                <Switch
                  checked={notifications.cashback}
                  onCheckedChange={(checked) => setNotifications({...notifications, cashback: checked})}
                />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linked Accounts */}
        <TabsContent value="linked">
          <Card>
            <CardHeader>
              <CardTitle>Linked Accounts</CardTitle>
              <CardDescription>
                Manage your connected social accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border">
                        <img src="/images/icons/google.png" alt="Google" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        {socialAccounts.find((acc) => acc.provider === "google") ? (
                          <p className="text-sm text-muted-foreground">
                            {socialAccounts.find((acc) => acc.provider === "google")?.email}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {socialAccounts.find((acc) => acc.provider === "google") ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAccount("google")}
                        disabled={unlinkingProvider === "google"}
                      >
                        {unlinkingProvider === "google" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="h-4 w-4 mr-2" />
                            Unlink
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleLinkGoogle}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    )}
                  </div>

                  {socialAccounts.length === 0 && (
                    <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                      <p>No social accounts are currently linked.</p>
                    </div>
                  )}

                  {user?.auth_provider === "google" && !user?.password_hash && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      <p className="font-medium">Set a password before unlinking</p>
                      <p className="mt-1">
                        Set a password in the Security tab before unlinking your Google account.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
