import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: [
    'localhost:5000',
    '127.0.0.1:5000',
    'b4593f08-7d63-4102-8c06-d96b162298c1-00-2njwiknvokenz.kirk.replit.dev',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    optimizePackageImports: ["lucide-react"],
  },
  // Disable image optimization in development to avoid sharp dependency issues
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    deviceSizes: [360, 640, 828, 1080, 1200, 1600, 2000],
  },
  compiler: {
    removeConsole: isProd ? { exclude: ["error"] } : false,
  },
  headers: async () => {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: "/backend-api/:path*/",
        destination: "http://127.0.0.1:8000/api/v1/:path*/",
      },
      {
        source: "/backend-api/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
