"use client";

import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Badge className="mb-4">Legal</Badge>
          <h1 className="mb-4 text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              BIDUA Industries Pvt. Ltd. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
              protecting your privacy. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use the BIDUA
              Coupon platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <div className="text-muted-foreground space-y-4">
              <div>
                <h3 className="font-medium text-foreground">Personal Information</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Name and email address</li>
                  <li>Phone number</li>
                  <li>Payment information (encrypted and tokenized)</li>
                  <li>KYC documents (for wallet withdrawals)</li>
                  <li>Address for account verification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Usage Information</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Browser type and device information</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and time spent</li>
                  <li>Clicks on coupons and deals</li>
                  <li>Purchase history and cashback data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Cookies and Tracking</h3>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Session cookies for authentication</li>
                  <li>Preference cookies for user settings</li>
                  <li>Analytics cookies for improving our service</li>
                  <li>Affiliate tracking cookies for cashback attribution</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <div className="text-muted-foreground space-y-2">
              <p>We use your information to:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Provide and maintain our services</li>
                <li>Process transactions and deliver gift cards</li>
                <li>Track and credit cashback to your account</li>
                <li>Send transactional emails and notifications</li>
                <li>Personalize your experience and recommendations</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
                <li>Improve our products and services</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Information Sharing</h2>
            <div className="text-muted-foreground space-y-2">
              <p>We may share your information with:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>Merchant Partners:</strong> To track and validate
                  transactions for cashback purposes
                </li>
                <li>
                  <strong>Payment Processors:</strong> To process payments securely
                  (Razorpay, banks)
                </li>
                <li>
                  <strong>Service Providers:</strong> For hosting, analytics, and
                  customer support
                </li>
                <li>
                  <strong>Legal Authorities:</strong> When required by law or to
                  protect our rights
                </li>
              </ul>
              <p>We never sell your personal information to third parties.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Security</h2>
            <div className="text-muted-foreground space-y-2">
              <p>We implement industry-standard security measures including:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Encrypted storage of sensitive information</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication protocols</li>
                <li>PCI-DSS compliance for payment processing</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <div className="text-muted-foreground space-y-2">
              <p>You have the right to:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p>
                To exercise these rights, contact us at privacy@biduacoupon.com.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as your account is
              active or as needed to provide services. After account deletion, we
              may retain certain information for legal compliance, fraud prevention,
              and legitimate business purposes for up to 7 years.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for users under 18 years of age. We do
              not knowingly collect personal information from children. If we become
              aware that we have collected data from a child, we will delete it
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our platform contains links to merchant websites and third-party
              services. We are not responsible for the privacy practices of these
              external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. International Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries
              outside India. We ensure appropriate safeguards are in place to protect
              your data in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify
              you of significant changes via email or a prominent notice on our
              platform. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <div className="text-muted-foreground">
              <p>For privacy-related inquiries, contact our Data Protection Officer:</p>
              <p className="mt-2">
                BIDUA Industries Pvt. Ltd.<br />
                Email: privacy@biduacoupon.com<br />
                Phone: 1800-123-456<br />
                Address: 123 Tech Park, Bangalore, Karnataka 560001
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Grievance Officer</h2>
            <div className="text-muted-foreground">
              <p>
                In accordance with the Information Technology Act, 2000 and rules
                made thereunder, the Grievance Officer for this platform is:
              </p>
              <p className="mt-2">
                Name: Rajesh Kumar<br />
                Email: grievance@biduacoupon.com<br />
                Response Time: Within 24 hours on working days
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
