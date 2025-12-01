"use client";

import { useState } from "react";
import { Copy, Check, Share2, Users, Wallet, Gift, MessageCircle, Twitter, Facebook, Trophy, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Referral } from "@/types";

// Mock data
const referralCode = "JOHN2024";
const referralLink = `https://biduacoupons.com/register?ref=${referralCode}`;

const mockReferrals: Referral[] = [
  {
    id: 1,
    referrer_id: 1,
    referred_id: 2,
    referred_user: {
      id: 2,
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
      role: "customer",
      is_email_verified: true,
      is_mobile_verified: false,
      kyc_status: "pending",
      referral_code: "JANE2024",
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date(Date.now() - 604800000).toISOString(),
    },
    status: "earned",
    referrer_bonus_amount: 50,
    referred_bonus_amount: 25,
    earned_amount: 50,
    created_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 2,
    referrer_id: 1,
    referred_id: 3,
    referred_user: {
      id: 3,
      email: "bob@example.com",
      first_name: "Bob",
      last_name: "Smith",
      role: "customer",
      is_email_verified: true,
      is_mobile_verified: false,
      kyc_status: "pending",
      referral_code: "BOB2024",
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
    status: "active",
    referrer_bonus_amount: 50,
    referred_bonus_amount: 25,
    earned_amount: 0,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [achievements] = useState([
    { id: 1, title: "Rookie Referrer", desc: "First successful referral", icon: Star, achieved: true },
    { id: 2, title: "Streak Saver", desc: "3 referrals in 7 days", icon: Trophy, achieved: false },
    { id: 3, title: "Top Influencer", desc: "10 total referrals", icon: Award, achieved: false },
  ]);
  const [rewards] = useState([
    { id: 1, title: "₹100 Bonus Cashback", cost: "5 referrals", status: "locked" },
    { id: 2, title: "₹250 Gift Card", cost: "10 referrals", status: "locked" },
    { id: 3, title: "Exclusive Badge", cost: "1 referral", status: "available" },
  ]);

  const totalReferrals = mockReferrals.length;
  const activeReferrals = mockReferrals.filter((r) => r.status === "active" || r.status === "earned").length;
  const totalEarnings = mockReferrals.reduce((sum, r) => sum + r.earned_amount, 0);

  const handleCopy = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = (platform: string) => {
    const message = `Sign up on BIDUA Coupons using my referral code ${referralCode} and get ₹25 bonus! ${referralLink}`;

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

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Refer & Earn" }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="text-muted-foreground">
          Invite friends and earn ₹50 for each successful referral
        </p>
      </div>

      {/* Referral Code Section */}
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
                    {referralCode}
                  </code>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCopy(referralCode, "code")}
                  className="px-6"
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
                  >
                    {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                  onClick={() => handleShare("whatsapp")}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
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

      {/* Stats Cards */}
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

      {/* Achievements */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" /> Badges & Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {achievements.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
              <a.icon className={`h-5 w-5 ${a.achieved ? "text-green-600" : "text-muted-foreground"}`} />
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

      {/* Rewards Catalog */}
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

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {mockReferrals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-4">No referrals yet</p>
              <p className="text-sm">Start sharing your code to earn rewards!</p>
            </div>
          ) : (
            <div className="divide-y">
              {mockReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-4"
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
                  <div className="text-right">
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
                    {referral.earned_amount > 0 && (
                      <p className="mt-1 text-sm font-medium text-green-600">
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
