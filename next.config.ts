import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      'lucide-react',
      'framer-motion',
    ],
  },
  images: {
    unoptimized: true, // Loads images instantly without waiting for server-side optimization
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "7731",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "7731",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
};

export default nextConfig;
