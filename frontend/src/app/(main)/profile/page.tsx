"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, User, Shield, Bell, Save } from "lucide-react";
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
import { KYC_STATUSES } from "@/lib/constants";
import apiClient from "@/lib/api-client";

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      date_of_birth: user?.date_of_birth || "",
      gender: user?.gender || undefined,
    },
  });

  type ProfileForm = {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateUser(data);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPassword = async () => {
    setPasswordError("");
    
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
        toast.success("Password set successfully! You can now login with email and password.");
        setNewPassword("");
        setConfirmPassword("");
        // Update user state to reflect password is set
        updateUser({ ...user, password_hash: true });
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || "Failed to set password");
    } finally {
      setIsSaving(false);
    }
  };

  const kycStatus = KYC_STATUSES[user?.kyc_status || "pending"];

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Profile" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
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
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    {...register("mobile")}
                  />
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
                <Badge className={kycStatus.color}>{kycStatus.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input id="pan_number" placeholder="ABCDE1234F" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account">Bank Account Number</Label>
                  <Input id="bank_account" placeholder="Enter account number" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input id="ifsc_code" placeholder="e.g., SBIN0001234" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upi_id">UPI ID</Label>
                  <Input id="upi_id" placeholder="yourname@upi" />
                </div>
              </div>

              <Button>Submit for Verification</Button>
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
                  ? 'Set a password to enable email/password login in addition to Google'
                  : 'Update your password to keep your account secure'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.auth_provider === 'google' && !user?.password_hash ? (
                <>
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 mb-4">
                    You signed up with Google. Setting a password will allow you to log in using your email and password as well.
                  </div>
                  
                  {passwordError && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {passwordError}
                    </div>
                  )}
                  
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
                    <Input id="current_password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                    <Input id="confirm_new_password" type="password" />
                  </div>

                  <Button>Update Password</Button>
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
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive order updates via SMS
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Receive offers and deals via email
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cashback Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about cashback status changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
