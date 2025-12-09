
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
          {/* Animated Gradient Orbs */}
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-violet-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          
          {/* Animated Lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
            <div className="absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer animation-delay-1000"></div>
            <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer animation-delay-2000"></div>
          </div>

          {/* Floating Modern Icons */}
          <div className="absolute top-20 left-10 animate-float">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 rotate-12 flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="absolute top-40 right-20 animate-float animation-delay-1000">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 -rotate-12 flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-32 left-1/4 animate-float animation-delay-2000">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 rotate-6 flex items-center justify-center shadow-xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
          
          <div className="absolute bottom-20 right-1/4 animate-float animation-delay-3000">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 -rotate-6 flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/3 animate-float animation-delay-1500">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 rotate-45 flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>

          <div className="absolute top-1/3 right-1/3 animate-float animation-delay-2500">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 -rotate-12 flex items-center justify-center shadow-xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>

          {/* Particle Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping animation-delay-1000"></div>
            <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/40 rounded-full animate-ping animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-white/40 rounded-full animate-ping animation-delay-3000"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container flex min-h-screen flex-col items-center justify-center py-4 px-4">
          <Link href={ROUTES.home} className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-white text-lg sm:text-xl font-bold text-purple-600 shadow-2xl group-hover:scale-110 transition-all duration-300 border-2 border-purple-200">
              BC
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-2xl tracking-tight">{SITE_NAME}</span>
          </Link>
          <div className="w-full max-w-md overflow-y-auto max-h-[calc(100vh-140px)] sm:max-h-[calc(100vh-160px)]">
            <div className="pb-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Providers>
  );
}
