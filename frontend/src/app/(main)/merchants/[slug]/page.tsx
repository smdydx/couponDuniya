"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Tag, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { OfferGrid } from "@/components/offer/OfferGrid";
import { ROUTES } from "@/lib/constants";
import type { Merchant, Offer } from "@/types";

// Mock data
const mockMerchant: Merchant = {
  id: 1,
  name: "Amazon",
  slug: "amazon",
  description: "Amazon is one of the largest online shopping platforms offering everything from electronics, fashion, home essentials, groceries, and more. Shop with confidence and earn cashback on every purchase.",
  website_url: "https://amazon.in",
  affiliate_url: "https://amazon.in",
  default_cashback_type: "percentage",
  default_cashback_value: 10,
  is_featured: true,
  is_active: true,
  total_offers: 45,
  seo_title: "Amazon Coupons, Offers & Cashback",
  seo_description: "Get the latest Amazon coupons and earn up to 10% cashback on all purchases.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockOffers: Offer[] = [
  {
    id: 1,
    merchant_id: 1,
    merchant: mockMerchant,
    title: "50% Off on Electronics",
    description: "Get up to 50% discount on laptops, mobiles, and accessories",
    offer_type: "code",
    coupon_code: "ELEC50",
    discount_type: "percentage",
    discount_value: 50,
    cashback_type: "percentage",
    cashback_value: 5,
    affiliate_url: "https://amazon.in",
    start_date: new Date().toISOString(),
    is_exclusive: true,
    is_verified: true,
    is_featured: true,
    is_active: true,
    click_count: 1250,
    success_count: 890,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    merchant_id: 1,
    merchant: mockMerchant,
    title: "Flat Rs. 200 Off on Fashion",
    description: "Use code for instant discount on clothing and accessories",
    offer_type: "code",
    coupon_code: "FASHION200",
    discount_type: "fixed",
    discount_value: 200,
    affiliate_url: "https://amazon.in",
    start_date: new Date().toISOString(),
    is_exclusive: false,
    is_verified: true,
    is_featured: false,
    is_active: true,
    click_count: 520,
    success_count: 380,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    merchant_id: 1,
    merchant: mockMerchant,
    title: "Extra 10% Cashback on All Orders",
    description: "Earn additional cashback on your Amazon purchases through our link",
    offer_type: "cashback",
    cashback_type: "percentage",
    cashback_value: 10,
    affiliate_url: "https://amazon.in",
    start_date: new Date().toISOString(),
    is_exclusive: true,
    is_verified: true,
    is_featured: true,
    is_active: true,
    click_count: 3200,
    success_count: 2100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function MerchantDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [activeTab, setActiveTab] = useState("all");

  const merchant = mockMerchant; // Replace with API call
  const offers = mockOffers;

  const codeOffers = offers.filter((o) => o.offer_type === "code");
  const dealOffers = offers.filter((o) => o.offer_type === "deal");
  const cashbackOffers = offers.filter((o) => o.offer_type === "cashback");

  const handleTrackClick = (offerId: number) => {
    console.log("Tracking click for offer:", offerId);
    // Implement click tracking
  };

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Stores", href: ROUTES.merchants },
          { label: merchant.name },
        ]}
      />

      {/* Merchant Header */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Logo */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-white p-4">
            {merchant.logo_url ? (
              <Image
                src={merchant.logo_url}
                alt={merchant.name}
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <span className="text-4xl font-bold text-primary">
                {merchant.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{merchant.name}</h1>
              {merchant.is_featured && (
                <Badge variant="warning" className="gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>

            <p className="mt-2 text-muted-foreground">{merchant.description}</p>

            <div className="mt-4 flex flex-wrap gap-4">
              {/* Cashback Badge */}
              <Badge variant="success" className="text-sm">
                {merchant.default_cashback_type === "percentage"
                  ? `Up to ${merchant.default_cashback_value}% Cashback`
                  : `₹${merchant.default_cashback_value} Cashback`}
              </Badge>

              {/* Offers Count */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                {merchant.total_offers} Active Offers
              </div>

              {/* Verified */}
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Verified Store
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button size="lg" className="gap-2" asChild>
            <a
              href={merchant.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Store
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Offers Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All Offers ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="codes">
            Coupon Codes ({codeOffers.length})
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals ({dealOffers.length})
          </TabsTrigger>
          <TabsTrigger value="cashback">
            Cashback ({cashbackOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OfferGrid offers={offers} onClickTrack={handleTrackClick} />
        </TabsContent>
        <TabsContent value="codes">
          <OfferGrid offers={codeOffers} onClickTrack={handleTrackClick} />
        </TabsContent>
        <TabsContent value="deals">
          <OfferGrid offers={dealOffers} onClickTrack={handleTrackClick} />
        </TabsContent>
        <TabsContent value="cashback">
          <OfferGrid offers={cashbackOffers} onClickTrack={handleTrackClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
