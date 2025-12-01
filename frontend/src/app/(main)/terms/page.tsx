"use client";

import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="mb-4 text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using BIDUA Coupon (&quot;the Platform&quot;), you accept and
              agree to be bound by the terms and provision of this agreement. If you
              do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              BIDUA Coupon provides a platform for users to discover coupon codes,
              deals, cashback offers, and purchase digital gift cards. We act as an
              intermediary between users and merchant partners. We do not guarantee
              the availability, accuracy, or validity of any coupon or deal listed on
              our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. User Accounts</h2>
            <div className="text-muted-foreground space-y-2">
              <p>To access certain features, you must create an account. You agree to:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not create multiple accounts for fraudulent purposes</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Coupons and Deals</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Regarding coupons and deals on our platform:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>We strive to ensure accuracy but cannot guarantee all codes will work</li>
                <li>Terms and conditions of each offer are set by the respective merchant</li>
                <li>Offers may expire or be modified without prior notice</li>
                <li>We are not responsible for any issues with merchant transactions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cashback Program</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Our cashback program is subject to the following conditions:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Cashback rates are subject to change without notice</li>
                <li>Cashback is tracked based on merchant confirmation</li>
                <li>Pending cashback may be cancelled if the order is returned or cancelled</li>
                <li>Minimum withdrawal amount and processing times apply</li>
                <li>We reserve the right to cancel cashback in case of fraud or abuse</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Gift Cards</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Gift card purchases are governed by the following:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>All gift card sales are final and non-refundable</li>
                <li>Gift cards are subject to the terms of the issuing brand</li>
                <li>We are not responsible for lost, stolen, or expired gift cards</li>
                <li>Delivery times may vary; typical delivery is instant</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Prohibited Activities</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Users are prohibited from:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Using the platform for fraudulent or illegal purposes</li>
                <li>Creating fake accounts or manipulating the referral system</li>
                <li>Attempting to bypass tracking or cashback systems</li>
                <li>Scraping, copying, or redistributing our content</li>
                <li>Interfering with the platform&apos;s operation or security</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on BIDUA Coupon, including logos, text, graphics, and
              software, is the property of BIDUA Industries or its licensors and is
              protected by intellectual property laws. You may not use, reproduce,
              or distribute any content without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              BIDUA Coupon and its affiliates shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from
              your use of the platform. Our total liability shall not exceed the
              amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account at any time,
              with or without cause, with or without notice. Upon termination, any
              pending cashback may be forfeited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the new terms. We encourage
              you to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms shall be governed by and construed in accordance with the
              laws of India. Any disputes shall be subject to the exclusive
              jurisdiction of the courts in Bangalore, Karnataka.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Contact Information</h2>
            <div className="text-muted-foreground">
              <p>For questions about these terms, contact us at:</p>
              <p className="mt-2">
                BIDUA Industries Pvt. Ltd.<br />
                Email: legal@biduacoupon.com<br />
                Address: 123 Tech Park, Bangalore, Karnataka 560001
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
