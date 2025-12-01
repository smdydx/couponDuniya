"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Image from "next/image";

type GiftCard = {
  id: number;
  name: string;
  slug: string;
  merchant: string;
  image: string;
  min: number;
  max: number;
  inStock: boolean;
};

const sampleCards: GiftCard[] = [
  { id: 1, name: "Amazon Pay", slug: "amazon-pay", merchant: "Amazon", image: "/images/gift-cards/1.png", min: 100, max: 10000, inStock: true },
  { id: 2, name: "Flipkart", slug: "flipkart-gc", merchant: "Flipkart", image: "/images/gift-cards/2.png", min: 100, max: 10000, inStock: true },
  { id: 3, name: "Swiggy Money", slug: "swiggy-money", merchant: "Swiggy", image: "/images/gift-cards/4.png", min: 100, max: 2000, inStock: false },
];

export default function GiftCardAdminPage() {
  const [cards, setCards] = useState<GiftCard[]>(sampleCards);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    merchant: "",
    min: 100,
    max: 1000,
    image: "",
  });

  const addCard = () => {
    setCards([
      ...cards,
      {
        id: Date.now(),
        name: form.name,
        slug: form.slug,
        merchant: form.merchant,
        image: form.image || "/images/gift-cards/1.png",
        min: form.min,
        max: form.max,
        inStock: true,
      },
    ]);
    setForm({ name: "", slug: "", merchant: "", min: 100, max: 1000, image: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gift Card Management</h1>
        <p className="text-muted-foreground">Create and manage digital gift cards with denominations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Gift Card</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Amazon Pay Gift Card" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Slug</label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="amazon-pay" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Merchant</label>
            <Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Amazon" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Image URL</label>
            <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/images/gift-cards/1.png" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Min Value</label>
            <Input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Max Value</label>
            <Input type="number" value={form.max} onChange={(e) => setForm({ ...form, max: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={addCard}>Save Gift Card</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{card.name}</CardTitle>
              <Badge variant={card.inStock ? "success" : "destructive"}>
                {card.inStock ? "Active" : "Out of stock"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-24 overflow-hidden rounded-md border">
                  <Image src={card.image} alt={card.name} fill className="object-cover" sizes="96px" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.merchant}</p>
                  <p className="text-sm font-medium">₹{card.min} - ₹{card.max}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Slug: {card.slug}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
