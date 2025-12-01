import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { ROUTES, SITE_NAME, CATEGORIES } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                BC
              </div>
              <span className="text-xl font-bold">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Save money with verified coupons, earn cashback on every purchase, and buy
              discounted gift cards from your favorite brands.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.coupons} className="text-muted-foreground hover:text-primary">
                  Coupons & Deals
                </Link>
              </li>
              <li>
                <Link href={ROUTES.merchants} className="text-muted-foreground hover:text-primary">
                  All Stores
                </Link>
              </li>
              <li>
                <Link href={ROUTES.products} className="text-muted-foreground hover:text-primary">
                  Gift Cards
                </Link>
              </li>
              <li>
                <Link href={ROUTES.howItWorks} className="text-muted-foreground hover:text-primary">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href={ROUTES.referrals} className="text-muted-foreground hover:text-primary">
                  Refer & Earn
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Popular Categories</h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`${ROUTES.coupons}?category=${category.slug}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {category.icon} {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.about} className="text-muted-foreground hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={ROUTES.faq} className="text-muted-foreground hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={ROUTES.terms} className="text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={ROUTES.privacy} className="text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@biduacoupons.com"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  support@biduacoupons.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {currentYear} {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href={ROUTES.terms} className="hover:text-primary">
              Terms
            </Link>
            <Link href={ROUTES.privacy} className="hover:text-primary">
              Privacy
            </Link>
            <span>Made with love in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
