import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
const allowedOrigins = replitDevDomain
  ? [`https://${replitDevDomain}`, replitDevDomain]
  : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  allowedDevOrigins: allowedOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
    optimizePackageImports: ["lucide-react"],
  },
  // Hide the floating Next.js dev indicator ("N" button) in development
  // If Next.js adds more dev tool UI elements, they can be disabled here.
  devIndicators: {
    buildActivity: false,
  },
  images: {
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
};

export default nextConfig;
