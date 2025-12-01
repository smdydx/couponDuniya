"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const faqCategories = [
  {
    title: "General",
    faqs: [
      {
        question: "What is BIDUA Coupon?",
        answer:
          "BIDUA Coupon is India's leading platform for coupons, deals, cashback, and digital gift cards. We help millions of users save money on their online purchases by providing verified coupon codes and exclusive deals from over 500 partner merchants.",
      },
      {
        question: "Is BIDUA Coupon free to use?",
        answer:
          "Yes! Using our coupons and deals is completely free. We earn a commission from merchants when you make a purchase using our links, which allows us to offer you cashback rewards.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Click on the 'Sign Up' button in the top right corner. You can register using your email address, phone number, or sign in with Google. Registration takes less than a minute!",
      },
    ],
  },
  {
    title: "Coupons & Deals",
    faqs: [
      {
        question: "How do I use a coupon code?",
        answer:
          "Simply click on the coupon to reveal the code, then copy it. Visit the merchant's website, add items to your cart, and paste the code at checkout. The discount will be applied automatically.",
      },
      {
        question: "Why isn't my coupon working?",
        answer:
          "Coupons may not work due to: expired validity, minimum purchase requirements, product exclusions, or one-time use restrictions. Check the terms and conditions on each coupon for details.",
      },
      {
        question: "Are all coupons verified?",
        answer:
          "Yes! Our team verifies every coupon before listing. We also have user feedback that helps us remove expired or non-working codes quickly.",
      },
      {
        question: "How often are new coupons added?",
        answer:
          "We add new coupons daily! During major sales like Diwali, Big Billion Days, or Amazon sales, we update multiple times a day to bring you the latest deals.",
      },
    ],
  },
  {
    title: "Cashback",
    faqs: [
      {
        question: "How does cashback work?",
        answer:
          "When you shop through our links, merchants pay us a commission. We share a portion of this commission with you as cashback. It's automatically tracked and credited to your wallet.",
      },
      {
        question: "When will I receive my cashback?",
        answer:
          "Cashback typically becomes 'pending' immediately after purchase and gets 'confirmed' after the merchant validates the order (usually 30-90 days, depending on the merchant's return policy).",
      },
      {
        question: "Why is my cashback still pending?",
        answer:
          "Cashback remains pending until the merchant confirms your order wasn't returned or cancelled. This waiting period varies by merchant but is typically 30-90 days.",
      },
      {
        question: "Can I lose my pending cashback?",
        answer:
          "Yes, if you return the product, cancel the order, or if the merchant rejects the transaction for any reason, the pending cashback will be cancelled.",
      },
    ],
  },
  {
    title: "Gift Cards",
    faqs: [
      {
        question: "How do I buy a gift card?",
        answer:
          "Browse our gift card collection, select your preferred brand and denomination, add to cart, and complete the payment. You'll receive the gift card code instantly via email and in your order history.",
      },
      {
        question: "Are gift cards delivered instantly?",
        answer:
          "Yes! Most gift cards are delivered within seconds of successful payment. In rare cases, delivery might take up to 15 minutes during high traffic periods.",
      },
      {
        question: "Can I use wallet balance to buy gift cards?",
        answer:
          "Yes! You can use your wallet balance (confirmed cashback) to partially or fully pay for gift cards. This is a great way to redeem your cashback earnings.",
      },
      {
        question: "What if my gift card code doesn't work?",
        answer:
          "Contact our support team immediately with your order details. We'll verify and either provide a replacement code or full refund within 24 hours.",
      },
    ],
  },
  {
    title: "Wallet & Withdrawals",
    faqs: [
      {
        question: "How do I withdraw my cashback?",
        answer:
          "Go to the Wallet section and click 'Withdraw'. Choose your preferred method (UPI, bank transfer, or gift cards) and enter the amount. Minimum withdrawal is ₹100.",
      },
      {
        question: "How long do withdrawals take?",
        answer:
          "UPI withdrawals are processed within 1-2 hours. Bank transfers take 2-3 business days. Gift card redemptions are instant.",
      },
      {
        question: "Is there a minimum withdrawal amount?",
        answer:
          "Yes, the minimum withdrawal amount is ₹100 for UPI and bank transfers, and ₹50 for gift card redemptions.",
      },
      {
        question: "Are there any withdrawal fees?",
        answer:
          "No! We don't charge any fees for withdrawals. The full amount you request will be credited to your account.",
      },
    ],
  },
  {
    title: "Referrals",
    faqs: [
      {
        question: "How does the referral program work?",
        answer:
          "Share your unique referral link with friends. When they sign up and make their first purchase, both of you earn ₹50 bonus cashback!",
      },
      {
        question: "Where do I find my referral code?",
        answer:
          "Log in to your account and go to the 'Referrals' section. You'll find your unique referral link and code there, along with sharing options.",
      },
      {
        question: "Is there a limit to referral earnings?",
        answer:
          "No limit! You can refer as many friends as you want and earn ₹50 for each successful referral.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container py-8">
      <div className="mb-12 text-center">
        <Badge className="mb-4">FAQ</Badge>
        <h1 className="mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Find answers to common questions about coupons, cashback, gift cards,
          and more.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-8">
        {faqCategories.map((category) => (
          <div key={category.title}>
            <h2 className="mb-4 text-xl font-semibold">{category.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {category.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`${category.title}-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      <Card className="mx-auto mt-12 max-w-2xl">
        <CardContent className="p-8 text-center">
          <h3 className="mb-2 text-xl font-semibold">Still have questions?</h3>
          <p className="mb-6 text-muted-foreground">
            Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="mailto:support@biduacoupon.com">Email Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="tel:+911800123456">Call: 1800-123-456</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
