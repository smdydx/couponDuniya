"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  Copy,
  ShoppingCart,
  Wallet,
  Gift,
  CreditCard,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const couponSteps = [
  {
    icon: Search,
    title: "Find Your Deal",
    description:
      "Search for your favorite store or browse categories to find the best coupons and deals.",
  },
  {
    icon: Copy,
    title: "Copy the Code",
    description:
      "Click on the coupon to reveal and copy the code. Some deals activate automatically.",
  },
  {
    icon: ShoppingCart,
    title: "Shop & Apply",
    description:
      "Visit the merchant's website, shop as usual, and apply the code at checkout.",
  },
  {
    icon: Wallet,
    title: "Earn Cashback",
    description:
      "After your purchase is confirmed, cashback is added to your wallet automatically.",
  },
];

const giftCardSteps = [
  {
    icon: Gift,
    title: "Choose Gift Card",
    description:
      "Browse our collection of gift cards from top brands and select your preferred denomination.",
  },
  {
    icon: CreditCard,
    title: "Make Payment",
    description:
      "Pay securely using UPI, cards, net banking, or your wallet balance for extra savings.",
  },
  {
    icon: CheckCircle,
    title: "Instant Delivery",
    description:
      "Receive your gift card code instantly via email and in your order history.",
  },
];

const benefits = [
  {
    title: "100% Verified Coupons",
    description: "Every code is tested and verified by our team before listing.",
  },
  {
    title: "Instant Gift Cards",
    description: "Get your gift card codes delivered within seconds of payment.",
  },
  {
    title: "Real Cashback",
    description: "Earn real money that you can withdraw to your bank account.",
  },
  {
    title: "Exclusive Deals",
    description: "Access deals and discounts not available anywhere else.",
  },
  {
    title: "Easy Withdrawals",
    description: "Withdraw your earnings via UPI, bank transfer, or gift cards.",
  },
  {
    title: "24/7 Support",
    description: "Our customer support team is always ready to help you.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container py-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <Badge className="mb-4">How It Works</Badge>
        <h1 className="mb-4 text-4xl font-bold">
          Save Money in 3 Simple Steps
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Whether you&apos;re looking for coupons, cashback, or gift cards - we make
          saving money easy and rewarding.
        </p>
      </div>

      {/* Coupons Section */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Using Coupons & Earning Cashback
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {couponSteps.map((step, index) => (
            <Card key={step.title} className="relative">
              <CardContent className="p-6 text-center">
                <div className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <step.icon className="mx-auto mb-4 mt-4 h-12 w-12 text-primary" />
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/coupons">
              Browse Coupons
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Gift Cards Section */}
      <div className="mb-16 rounded-lg bg-muted p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Buying Gift Cards
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {giftCardSteps.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </div>
                <step.icon className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/products">
              Shop Gift Cards
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Why Choose Us?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title}>
              <CardContent className="flex items-start gap-4 p-6">
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Preview */}
      <div className="rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Still Have Questions?</h2>
        <p className="mb-6 text-muted-foreground">
          Check out our frequently asked questions or contact our support team.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/faq">View FAQ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="mailto:support@biduacoupon.com">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
