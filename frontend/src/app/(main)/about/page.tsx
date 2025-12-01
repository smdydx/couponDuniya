"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShoppingBag, Store, Award } from "lucide-react";

const stats = [
  { icon: Users, value: "1M+", label: "Happy Users" },
  { icon: Store, value: "500+", label: "Partner Merchants" },
  { icon: ShoppingBag, value: "5M+", label: "Orders Delivered" },
  { icon: Award, value: "₹50Cr+", label: "Cashback Given" },
];

const team = [
  { name: "Rajesh Kumar", role: "CEO & Founder", bio: "10+ years in e-commerce" },
  { name: "Priya Sharma", role: "CTO", bio: "Ex-Flipkart engineer" },
  { name: "Amit Patel", role: "COO", bio: "Operations expert" },
  { name: "Neha Gupta", role: "Head of Marketing", bio: "Growth specialist" },
];

export default function AboutPage() {
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <Badge className="mb-4">About Us</Badge>
        <h1 className="mb-4 text-4xl font-bold">
          India&apos;s Leading Coupon & Gift Card Platform
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          We help millions of Indians save money on their online purchases through
          verified coupons, exclusive deals, and instant gift cards.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center p-6 text-center">
              <stat.icon className="mb-4 h-10 w-10 text-primary" />
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Our Story */}
      <div className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Our Story</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4 text-muted-foreground">
            <p>
              Founded in 2020, BIDUA Coupon started with a simple mission: to help
              Indian consumers save money on every online purchase. What began as a
              small coupon aggregation website has grown into India&apos;s most trusted
              platform for deals, coupons, and digital gift cards.
            </p>
            <p>
              We partner with over 500 merchants across categories including fashion,
              electronics, food delivery, travel, and more. Our team works tirelessly
              to verify every coupon and negotiate exclusive deals that you won&apos;t
              find anywhere else.
            </p>
            <p>
              In 2023, we expanded into the gift card business, offering instant
              digital delivery of gift cards from top brands at discounted prices.
              Combined with our cashback program, we&apos;ve helped our users save over
              ₹50 crores to date.
            </p>
          </div>
          <div className="rounded-lg bg-muted p-8">
            <h3 className="mb-4 text-xl font-semibold">Our Mission</h3>
            <p className="mb-6 text-muted-foreground">
              To democratize savings by making the best deals accessible to everyone,
              everywhere in India.
            </p>
            <h3 className="mb-4 text-xl font-semibold">Our Vision</h3>
            <p className="text-muted-foreground">
              To become the go-to platform for smart shoppers who want to maximize
              the value of every rupee they spend online.
            </p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <h2 className="mb-6 text-2xl font-bold">Leadership Team</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <Card key={member.name}>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Our Values</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold">Trust & Transparency</h3>
              <p className="text-muted-foreground">
                Every coupon is verified. Every deal is real. We never list expired
                or fake offers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold">User First</h3>
              <p className="text-muted-foreground">
                Our users&apos; savings come first. We prioritize user experience over
                everything else.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously improve our platform to make saving money easier
                and more rewarding.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
