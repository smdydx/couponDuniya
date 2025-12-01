import Link from "next/link";
import { SITE_NAME, ROUTES } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/50">
      <div className="container flex min-h-screen flex-col items-center justify-center py-8">
        <Link href={ROUTES.home} className="mb-8 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            BC
          </div>
          <span className="text-2xl font-bold">{SITE_NAME}</span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
