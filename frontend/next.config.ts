import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
const allowedOrigins = replitDevDomain 
  ? [`https://${replitDevDomain}`, 'localhost:5000', '0.0.0.0:5000']
  : ['localhost:5000'];

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
};

export default nextConfig;
