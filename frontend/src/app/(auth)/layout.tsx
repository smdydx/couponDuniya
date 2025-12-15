import Link from "next/link";
import { SITE_NAME, ROUTES } from "@/lib/constants";
import { Providers } from "../providers";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gray-100">
        <div className="container flex min-h-screen flex-col items-center justify-center py-6 px-4">
          <Link href={ROUTES.home} className="mb-6 flex items-center gap-3 group flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold text-white shadow-lg group-hover:scale-105 transition-all duration-300">
              BC
            </div>
            <span className="text-2xl font-bold text-gray-800 tracking-tight">{SITE_NAME}</span>
          </Link>
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </Providers>
  );
}
