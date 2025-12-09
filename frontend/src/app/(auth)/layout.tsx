
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Purple Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
          {/* Animated Circles */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-400/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
          
          {/* Floating Coupon Icons */}
          <div className="absolute top-20 left-10 animate-float">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg rotate-12 flex items-center justify-center">
              <span className="text-3xl">🎫</span>
            </div>
          </div>
          <div className="absolute top-40 right-20 animate-float animation-delay-1000">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-lg -rotate-12 flex items-center justify-center">
              <span className="text-4xl">💰</span>
            </div>
          </div>
          <div className="absolute bottom-32 left-1/4 animate-float animation-delay-2000">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-lg rotate-6 flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
          </div>
          <div className="absolute bottom-20 right-1/4 animate-float animation-delay-3000">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg -rotate-6 flex items-center justify-center">
              <span className="text-3xl">💳</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container flex min-h-screen flex-col items-center justify-center py-8">
          <Link href={ROUTES.home} className="mb-8 flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-purple-600 shadow-lg group-hover:scale-110 transition-transform">
              BC
            </div>
            <span className="text-2xl font-bold text-white drop-shadow-lg">{SITE_NAME}</span>
          </Link>
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
