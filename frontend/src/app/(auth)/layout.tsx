"use client";

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-20 bg-purple-500/20 rounded-lg rotate-12 animate-float-slow blur-sm"></div>
          <div className="absolute top-1/4 right-20 w-40 h-24 bg-purple-400/15 rounded-xl -rotate-6 animate-float-medium blur-sm"></div>
          <div className="absolute bottom-20 left-1/4 w-36 h-22 bg-indigo-500/20 rounded-lg rotate-3 animate-float-fast blur-sm"></div>
          <div className="absolute top-1/2 left-1/3 w-28 h-16 bg-purple-300/10 rounded-xl -rotate-12 animate-float-slow blur-sm"></div>
          <div className="absolute bottom-1/3 right-1/4 w-44 h-28 bg-purple-600/15 rounded-lg rotate-6 animate-float-medium blur-sm"></div>
          <div className="absolute top-20 right-1/3 w-24 h-14 bg-indigo-400/20 rounded-xl rotate-12 animate-float-fast blur-sm"></div>
          
          <div className="absolute top-1/3 left-20 w-20 h-12 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-lg rotate-45 animate-coupon-1">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -ml-1.5"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -mr-1.5"></div>
          </div>
          <div className="absolute bottom-1/4 right-20 w-24 h-14 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg -rotate-12 animate-coupon-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -ml-1.5"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -mr-1.5"></div>
          </div>
          <div className="absolute top-2/3 left-1/2 w-22 h-13 bg-gradient-to-r from-purple-500/15 to-pink-400/15 rounded-lg rotate-6 animate-coupon-3">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -ml-1.5"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-900 rounded-full -mr-1.5"></div>
          </div>

          <div className="absolute top-16 right-16 w-4 h-4 bg-purple-300/40 rounded-full animate-sparkle-1"></div>
          <div className="absolute top-1/3 left-16 w-3 h-3 bg-indigo-300/40 rounded-full animate-sparkle-2"></div>
          <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-purple-400/30 rounded-full animate-sparkle-3"></div>
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-pink-300/40 rounded-full animate-sparkle-1"></div>
          <div className="absolute bottom-16 right-1/4 w-4 h-4 bg-indigo-400/30 rounded-full animate-sparkle-2"></div>
        </div>

        <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center py-6 px-4">
          <Link href={ROUTES.home} className="mb-6 flex items-center gap-3 group flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-xl font-bold text-white shadow-lg group-hover:scale-105 transition-all duration-300 shadow-purple-500/30">
              BC
            </div>
            <span className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">{SITE_NAME}</span>
          </Link>
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        <style jsx>{`
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) rotate(12deg); }
            50% { transform: translateY(-20px) rotate(15deg); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0) rotate(-6deg); }
            50% { transform: translateY(-15px) rotate(-3deg); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translateY(0) rotate(3deg); }
            50% { transform: translateY(-10px) rotate(6deg); }
          }
          @keyframes coupon-1 {
            0%, 100% { transform: translateY(0) rotate(45deg) scale(1); opacity: 0.8; }
            50% { transform: translateY(-25px) rotate(50deg) scale(1.05); opacity: 1; }
          }
          @keyframes coupon-2 {
            0%, 100% { transform: translateY(0) rotate(-12deg) scale(1); opacity: 0.8; }
            50% { transform: translateY(-20px) rotate(-8deg) scale(1.05); opacity: 1; }
          }
          @keyframes coupon-3 {
            0%, 100% { transform: translateY(0) rotate(6deg) scale(1); opacity: 0.7; }
            50% { transform: translateY(-30px) rotate(10deg) scale(1.08); opacity: 0.95; }
          }
          @keyframes sparkle-1 {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          @keyframes sparkle-2 {
            0%, 100% { opacity: 0.3; transform: scale(1.2); }
            50% { opacity: 0.9; transform: scale(0.8); }
          }
          @keyframes sparkle-3 {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.3); }
          }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
          .animate-coupon-1 { animation: coupon-1 7s ease-in-out infinite; }
          .animate-coupon-2 { animation: coupon-2 9s ease-in-out infinite; }
          .animate-coupon-3 { animation: coupon-3 11s ease-in-out infinite; }
          .animate-sparkle-1 { animation: sparkle-1 3s ease-in-out infinite; }
          .animate-sparkle-2 { animation: sparkle-2 4s ease-in-out infinite 0.5s; }
          .animate-sparkle-3 { animation: sparkle-3 5s ease-in-out infinite 1s; }
        `}</style>
      </div>
    </Providers>
  );
}
