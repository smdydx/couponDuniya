"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Share2, Users, Wallet, Gift, MessageCircle, Twitter, Facebook, Trophy, Award, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { Referral } from "@/types";

export default function ReferralsPage() {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.login);
      return;
    }
    fetchReferralData();
  }, [isAuthenticated]);

  const fetchReferralData = async () => {
    try {
      const [codeRes, badgesRes, rewardsRes] = await Promise.all([
        apiClient.get('/referrals/my-code'),
        apiClient.get('/referrals/my-badges'),
        apiClient.get('/referrals/rewards')
      ]);

      if (codeRes.data.success) {
        setReferralCode(codeRes.data.data.referral_code || user?.referral_code || "");
        setReferralLink(codeRes.data.data.referral_link || "");
      }

      if (badgesRes.data.success) {
        setUserBadges(badgesRes.data.data.badges || []);
        setBadges(Object.entries(badgesRes.data.data.definitions || {}).map(([key, val]: [string, any]) => ({
          id: key,
          title: val.label || key,
          desc: val.description || "",
          achieved: (badgesRes.data.data.badges || []).includes(key)
        })));
      }

      if (rewardsRes.data.success) {
        setRewards(Object.entries(rewardsRes.data.data || {}).map(([key, val]: [string, any]) => ({
          id: key,
          title: val.label || key,
          cost: val.description || "",
          status: "locked"
        })));
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
      if (user?.referral_code) {
        setReferralCode(user.referral_code);
        setReferralLink(`https://yourcoupondomain.com/signup?ref=${user.referral_code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "active" || r.status === "earned").length;
  const totalEarnings = referrals.reduce((sum, r) => sum + (r.earned_amount || 0), 0);

  const handleCopy = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (platform: string) => {
    const message = `Sign up on Leliance  Coupons using my referral code ${referralCode} and get ₹25 bonus! ${referralLink}`;

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
        break;
    }
  };

  if (loading) {
    return (
      <div className="container py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Refer & Earn" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-muted-foreground">
          Invite friends and earn ₹50 for each successful referral
        </p>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold">Your Referral Code</h2>
              <p className="mt-1 text-muted-foreground">
                Share this code with friends to earn rewards
              </p>

              <div className="mt-4 flex gap-2">
                <div className="flex-1 rounded-lg border-2 border-dashed border-primary bg-primary/5 p-4">
                  <code className="text-2xl font-bold tracking-wider text-primary">
                    {referralCode || "Loading..."}
                  </code>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCopy(referralCode, "code")}
                  className="px-6"
                  disabled={!referralCode}
                >
                  {copied === "code" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-sm text-muted-foreground">Or share your link</p>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(referralLink, "link")}
                    disabled={!referralLink}
                  >
                    {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                  onClick={() => handleShare("whatsapp")}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 gap-2"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 gap-2"
                  onClick={() => handleShare("facebook")}
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-lg bg-muted p-6">
                <h3 className="text-lg font-semibold">How it works</h3>
                <ol className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </div>
                    <span className="text-sm">
                      Share your referral code with friends
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      2
                    </div>
                    <span className="text-sm">
                      They sign up and get ₹25 bonus
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      3
                    </div>
                    <span className="text-sm">
                      You earn ₹50 when they make their first purchase
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeReferrals}</p>
              <p className="text-sm text-muted-foreground">Active Referrals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {badges.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Badges & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {badges.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Star className={`h-5 w-5 ${a.achieved ? "text-green-600" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  <Badge variant={a.achieved ? "success" : "secondary"} className="mt-1">
                    {a.achieved ? "Unlocked" : "Locked"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rewards.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" /> Rewards Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {rewards.map((r) => (
              <div key={r.id} className="flex flex-col rounded-lg border p-3">
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-muted-foreground">Requires: {r.cost}</p>
                <Badge variant={r.status === "available" ? "success" : "secondary"} className="mt-2">
                  {r.status === "available" ? "Available" : "Locked"}
                </Badge>
                <Button className="mt-3" size="sm" disabled={r.status !== "available"}>
                  Redeem
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No referrals yet</p>
              <p className="text-sm">Start sharing your code to earn rewards!</p>
            </div>
          ) : (
            <div className="divide-y">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
                >
                  <div>
                    <p className="font-medium">
                      {referral.referred_user?.first_name}{" "}
                      {referral.referred_user?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatDate(referral.created_at)}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end sm:justify-center">
                    <Badge
                      variant={
                        referral.status === "earned"
                          ? "success"
                          : referral.status === "active"
                            ? "info"
                            : "secondary"
                      }
                    >
                      {referral.status === "earned"
                        ? "Earned"
                        : referral.status === "active"
                          ? "Awaiting Purchase"
                          : "Pending"}
                    </Badge>
                    {referral.earned_amount && referral.earned_amount > 0 && (
                      <p className="text-sm font-medium text-green-600 sm:mt-1">
                        +{formatCurrency(referral.earned_amount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
